require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const supabase = require('./config/db');

const templateDir = path.resolve(__dirname, '../template');
const bucketName = 'overlays';

const safeFileName = (file) => file.replace(/[^a-zA-Z0-9.\-_]/g, '_');

async function detectTransparentSlots(imagePath) {
    const { data, info } = await sharp(imagePath)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    const { width, height, channels } = info;
    const totalPixels = width * height;
    const transparent = new Uint8Array(totalPixels);

    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            const pixelIndex = y * width + x;
            const dataIndex = pixelIndex * channels;
            const alpha = data[dataIndex + 3];
            if (alpha < 50) transparent[pixelIndex] = 1;
        }
    }

    const visited = new Uint8Array(totalPixels);
    const slots = [];

    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            const startIndex = y * width + x;
            if (!transparent[startIndex] || visited[startIndex]) continue;

            let minX = x;
            let minY = y;
            let maxX = x;
            let maxY = y;
            let count = 0;
            const queue = [[x, y]];
            visited[startIndex] = 1;

            for (let i = 0; i < queue.length; i += 1) {
                const [cx, cy] = queue[i];
                count += 1;
                minX = Math.min(minX, cx);
                minY = Math.min(minY, cy);
                maxX = Math.max(maxX, cx);
                maxY = Math.max(maxY, cy);

                const neighbors = [
                    [cx + 1, cy],
                    [cx - 1, cy],
                    [cx, cy + 1],
                    [cx, cy - 1]
                ];

                for (const [nx, ny] of neighbors) {
                    if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
                    const nextIndex = ny * width + nx;
                    if (transparent[nextIndex] && !visited[nextIndex]) {
                        visited[nextIndex] = 1;
                        queue.push([nx, ny]);
                    }
                }
            }

            const slotWidth = maxX - minX + 1;
            const slotHeight = maxY - minY + 1;
            const areaRatio = count / totalPixels;

            if (slotWidth > 20 && slotHeight > 20 && areaRatio < 0.9) {
                slots.push({
                    top: minY,
                    left: minX,
                    width: slotWidth,
                    height: slotHeight
                });
            }
        }
    }

    return slots.sort((a, b) => (a.top - b.top) || (a.left - b.left));
}

async function upsertTemplate({ name, description, publicUrl, config }) {
    const { data: existing, error: selectError } = await supabase
        .from('templates')
        .select('id')
        .eq('name', name)
        .maybeSingle();

    if (selectError) throw selectError;

    const payload = {
        name,
        description,
        file_path: publicUrl,
        frame_count: config.slots.length,
        config
    };

    if (existing) {
        const { error } = await supabase
            .from('templates')
            .update(payload)
            .eq('id', existing.id);
        if (error) throw error;
        return 'updated';
    }

    const { error } = await supabase.from('templates').insert([payload]);
    if (error) throw error;
    return 'created';
}

async function ensurePublicBucket(name) {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) throw listError;

    const exists = buckets.some((bucket) => bucket.name === name);
    if (exists) return;

    const { error: createError } = await supabase.storage.createBucket(name, {
        public: true,
        fileSizeLimit: 10485760
    });

    if (createError) throw createError;
    console.log(`Created storage bucket: ${name}`);
}

async function seed() {
    if (!fs.existsSync(templateDir)) {
        throw new Error(`Template directory not found: ${templateDir}`);
    }

    await ensurePublicBucket(bucketName);
    await ensurePublicBucket('results');

    const files = fs.readdirSync(templateDir)
        .filter((file) => file.toLowerCase().endsWith('.png'))
        .sort();

    console.log(`Found ${files.length} template files in ${templateDir}`);

    for (const file of files) {
        const srcPath = path.join(templateDir, file);
        const name = path.basename(file, path.extname(file));
        const storagePath = `seed/${Date.now()}_${safeFileName(file)}`;
        const fileBuffer = fs.readFileSync(srcPath);
        const metadata = await sharp(srcPath).metadata();
        const slots = await detectTransparentSlots(srcPath);

        console.log(`Uploading ${file} (${slots.length} slot${slots.length === 1 ? '' : 's'})...`);

        const { error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(storagePath, fileBuffer, {
                contentType: 'image/png',
                cacheControl: '3600',
                upsert: true
            });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from(bucketName)
            .getPublicUrl(storagePath);

        const config = {
            canvasWidth: metadata.width || 1080,
            canvasHeight: metadata.height || 1350,
            backgroundOverlay: publicUrl,
            slots
        };

        const result = await upsertTemplate({
            name,
            description: `Template ${name}`,
            publicUrl,
            config
        });

        console.log(`  ${result}: ${name}`);
    }

    console.log('Template seeding completed.');
}

seed().catch((error) => {
    console.error(error);
    process.exit(1);
});
