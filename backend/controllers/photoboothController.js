const Template = require('../models/templateModel');
const Filter = require('../models/filterModel');
const Session = require('../models/sessionModel');
const Result = require('../models/resultModel');
const supabase = require('../config/db');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const upload = multer({ storage: multer.memoryStorage() });
exports.uploadPhotos = upload.fields([
    { name: 'photos', maxCount: 6 },
    { name: 'stickers', maxCount: 10 }
]);

exports.getTemplates = async (req, res) => {
    try {
        const templates = await Template.findAll();
        const parsed = templates.map(t => ({
            ...t,
            config: t.config ? (typeof t.config === 'string' ? JSON.parse(t.config) : t.config) : null
        }));
        res.status(200).json(parsed);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan' });
    }
};

exports.getFilters = async (req, res) => {
    try {
        const filters = await Filter.findAll();
        res.status(200).json(filters);
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan' });
    }
};

exports.createSession = async (req, res) => {
    try {
        const { template_id } = req.body;
        if (!template_id) return res.status(400).json({ message: 'Template ID diperlukan' });
        const sessionId = await Session.create(req.userId, template_id);
        res.status(201).json({ message: 'Sesi berhasil dibuat', sessionId });
    } catch (error) {
        res.status(500).json({ message: 'Gagal membuat sesi' });
    }
};

const applyFilter = (sharpInstance, filter) => {
    if (filter === 'grayscale') return sharpInstance.grayscale();
    if (filter === 'sepia') return sharpInstance.recomb([
        [0.393, 0.769, 0.189],
        [0.349, 0.686, 0.168],
        [0.272, 0.534, 0.131]
    ]);
    return sharpInstance;
};

async function fetchImageBuffer(urlOrPath) {
    if (!urlOrPath) return null;
    if (urlOrPath.startsWith('http')) {
        try {
            const response = await fetch(urlOrPath);
            if (!response.ok) return null;
            const arrayBuffer = await response.arrayBuffer();
            return Buffer.from(arrayBuffer);
        } catch (e) {
            console.error('Fetch error for URL:', urlOrPath, e);
            return null;
        }
    } else {
        const localPath = path.join(__dirname, '..', urlOrPath);
        if (fs.existsSync(localPath)) {
            return fs.readFileSync(localPath);
        }
        return null;
    }
}

async function runCompositingEngine(config, photoBuffers, filter, stickersData = [], stickerFiles = []) {
    const { canvasWidth, canvasHeight, background, backgroundOverlay, slots, decorations } = config;
    const composites = [];

    if (backgroundOverlay) {
        const bgBufRaw = await fetchImageBuffer(backgroundOverlay);
        if (bgBufRaw) {
            const bgBuf = await sharp(bgBufRaw)
                .resize(canvasWidth, canvasHeight, { fit: 'cover' })
                .png()
                .toBuffer();
            composites.push({ input: bgBuf, top: 0, left: 0 });
        }
    }

    for (let i = 0; i < slots.length; i++) {
        const slot = slots[i];
        const photoBuf = photoBuffers[i];
        if (!photoBuf) continue;

        const { top, left, width, height, rotation, frameOverlay, borderColor, borderWidth } = slot;

        let photoSharp = sharp(photoBuf).resize(width, height, { fit: 'cover' });
        photoSharp = applyFilter(photoSharp, filter);

        if (borderColor && borderWidth) {
            const bw = borderWidth;
            const innerW = width - bw * 2;
            const innerH = height - bw * 2;
            const resizedBuf = await photoSharp.resize(innerW, innerH).png().toBuffer();

            const borderBuf = await sharp({
                create: { width, height, channels: 4, background: { ...borderColor, alpha: 1 } }
            })
            .composite([{ input: resizedBuf, top: bw, left: bw }])
            .png()
            .toBuffer();

            if (rotation && rotation !== 0) {
                const rotated = await sharp(borderBuf)
                    .rotate(rotation, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
                    .png()
                    .toBuffer();
                const meta = await sharp(rotated).metadata();
                const offsetTop = Math.round(top - (meta.height - height) / 2);
                const offsetLeft = Math.round(left - (meta.width - width) / 2);
                composites.push({ input: rotated, top: Math.max(0, offsetTop), left: Math.max(0, offsetLeft) });
            } else {
                composites.push({ input: borderBuf, top, left });
            }
        } else if (rotation && rotation !== 0) {
            const rawBuf = await photoSharp.png().toBuffer();
            const rotated = await sharp(rawBuf)
                .rotate(rotation, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
                .png()
                .toBuffer();
            const meta = await sharp(rotated).metadata();
            const offsetTop = Math.round(top - (meta.height - height) / 2);
            const offsetLeft = Math.round(left - (meta.width - width) / 2);
            composites.push({ input: rotated, top: Math.max(0, offsetTop), left: Math.max(0, offsetLeft) });
        } else {
            const rawBuf = await photoSharp.png().toBuffer();
            composites.push({ input: rawBuf, top, left });
        }

        if (frameOverlay) {
            const frameBufRaw = await fetchImageBuffer(frameOverlay);
            if (frameBufRaw) {
                const frameBuf = await sharp(frameBufRaw)
                    .resize(width, height, { fit: 'fill' })
                    .png()
                    .toBuffer();

                if (rotation && rotation !== 0) {
                    const rotatedFrame = await sharp(frameBuf)
                        .rotate(rotation, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
                        .png()
                        .toBuffer();
                    const meta = await sharp(rotatedFrame).metadata();
                    const offsetTop = Math.round(top - (meta.height - height) / 2);
                    const offsetLeft = Math.round(left - (meta.width - width) / 2);
                    composites.push({ input: rotatedFrame, top: Math.max(0, offsetTop), left: Math.max(0, offsetLeft) });
                } else {
                    composites.push({ input: frameBuf, top, left });
                }
            }
        }
    }

    if (decorations && decorations.length > 0) {
        for (const deco of decorations) {
            if (deco.type === 'overlay' && deco.path) {
                const decoBufRaw = await fetchImageBuffer(deco.path);
                if (decoBufRaw) {
                    const decoBuf = await sharp(decoBufRaw)
                        .resize(deco.width, deco.height, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
                        .png()
                        .toBuffer();
                    composites.push({ input: decoBuf, top: deco.top, left: deco.left });
                }
            }
        }
    }

    const bgColor = background || { r: 255, g: 255, b: 255 };
    const finalBuf = await sharp({
        create: {
            width: canvasWidth,
            height: canvasHeight,
            channels: 4,
            background: { ...bgColor, alpha: 1 }
        }
    })
    .composite(composites)
    .jpeg({ quality: 92 })
    .toBuffer();

    return finalBuf;
}

exports.generateResult = async (req, res) => {
    try {
        const { session_id, template_id, filter } = req.body;

        const template = await Template.findById(parseInt(template_id) || 1);
        if (!template) return res.status(404).json({ message: 'Template tidak ditemukan' });

        const config = typeof template.config === 'string' 
            ? JSON.parse(template.config) 
            : template.config;

        if (!config) return res.status(400).json({ message: 'Konfigurasi template tidak valid' });

        const expectedFrames = config.slots.length;
        if (!req.files || !req.files.photos || req.files.photos.length !== expectedFrames) {
            return res.status(400).json({ 
                message: `Template ini memerlukan ${expectedFrames} foto, diterima ${req.files?.photos?.length || 0}`
            });
        }

        const photoBuffers = req.files.photos.map(f => f.buffer);
        
        let stickersData = [];
        if (req.body.stickers_data) {
            try { stickersData = JSON.parse(req.body.stickers_data); } catch(e) {}
        }
        const stickerFiles = req.files.stickers || [];

        const finalBuf = await runCompositingEngine(config, photoBuffers, filter, stickersData, stickerFiles);

        // Supabase Upload
        const finalImageName = `result_${session_id}_${Date.now()}.jpg`;
        const { data, error } = await supabase.storage.from('results').upload(finalImageName, finalBuf, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
            upsert: false
        });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage.from('results').getPublicUrl(finalImageName);

        await Result.create(session_id, publicUrl);
        await Session.updateStatus(session_id, 'completed');

        res.status(200).json({
            message: 'Hasil berhasil digenerate',
            final_image_url: publicUrl
        });

    } catch (error) {
        console.error('Compositing Error:', error);
        res.status(500).json({ message: 'Terjadi kesalahan saat memproses gambar.', detail: error.message });
    }
};

exports.getHistory = async (req, res) => {
    try {
        const history = await Result.findByUser(req.userId);
        res.status(200).json(history);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil riwayat' });
    }
};

exports.updateTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const { config } = req.body;
        
        if (!config) return res.status(400).json({ message: 'Konfigurasi tidak valid' });

        const template = await Template.findById(id);
        if (!template) return res.status(404).json({ message: 'Template tidak ditemukan' });

        await Template.updateConfig(id, config);
        res.status(200).json({ message: 'Konfigurasi template berhasil diupdate' });
    } catch (error) {
        console.error('Update Template Error:', error);
        res.status(500).json({ message: 'Gagal update template' });
    }
};

exports.createTemplate = async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name || !req.file) {
            return res.status(400).json({ message: 'Nama dan file background template wajib diisi' });
        }

        const fileName = `template_${Date.now()}.png`;
        const { data, error } = await supabase.storage.from('overlays').upload(fileName, req.file.buffer, {
            contentType: 'image/png',
            cacheControl: '3600',
            upsert: false
        });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage.from('overlays').getPublicUrl(fileName);

        const config = {
            canvasWidth: 1080,
            canvasHeight: 1350,
            backgroundOverlay: publicUrl,
            slots: []
        };

        const templateId = await Template.create(name, description || '', publicUrl, 0);
        await Template.updateConfig(templateId, config);

        res.status(201).json({ message: 'Template berhasil dibuat', id: templateId });
    } catch (error) {
        console.error('Create Template Error:', error);
        res.status(500).json({ message: 'Gagal membuat template' });
    }
};

exports.deleteTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const template = await Template.findById(id);
        if (!template) return res.status(404).json({ message: 'Template tidak ditemukan' });

        await Template.delete(id);
        res.status(200).json({ message: 'Template berhasil dihapus' });
    } catch (error) {
        console.error('Delete Template Error:', error);
        res.status(500).json({ message: 'Gagal menghapus template' });
    }
};

exports.deleteHistoryItem = async (req, res) => {
    try {
        const { id } = req.params;
        const history = await Result.findByUser(req.userId);
        const item = history.find(h => h.id === parseInt(id));
        if (!item) return res.status(404).json({ message: 'Riwayat tidak ditemukan' });

        await Result.delete(id);
        res.status(200).json({ message: 'Riwayat berhasil dihapus' });
    } catch (error) {
        console.error('Delete History Error:', error);
        res.status(500).json({ message: 'Gagal menghapus riwayat' });
    }
};

exports.clearAllHistory = async (req, res) => {
    try {
        await Result.deleteAllByUser(req.userId);
        res.status(200).json({ message: 'Semua riwayat berhasil dihapus' });
    } catch (error) {
        console.error('Clear History Error:', error);
        res.status(500).json({ message: 'Gagal membersihkan riwayat' });
    }
};
