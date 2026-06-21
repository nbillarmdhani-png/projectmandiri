import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Save, RefreshCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${baseUrl}${path}`;
};

const PhotoPreview = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { photos, sessionId, filter, templateId } = location.state || { photos: [], sessionId: null, filter: 'none', templateId: 1 };
    const [isSaving, setIsSaving] = useState(false);
    const [stickers, setStickers] = useState([]);
    const [template, setTemplate] = useState(null);
    const containerRef = useRef(null);

    useEffect(() => {
        api.get('/photobooth/templates')
           .then(res => {
               const found = res.data.find(t => t.id === templateId);
               setTemplate(found || null);
           })
           .catch(console.error);
    }, [templateId]);

    let cssFilter = '';
    if (filter === 'grayscale') cssFilter = 'grayscale-[100%]';
    if (filter === 'sepia') cssFilter = 'sepia-[80%]';

    if (!photos || photos.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <button onClick={() => navigate('/camera')} className="btn-primary">Back to Camera</button>
            </div>
        );
    }

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const formData = new FormData();
            formData.append('session_id', sessionId);
            formData.append('template_id', templateId);
            formData.append('filter', filter);
            
            // Collect sticker data
            const stickersData = stickers.map(s => ({ x: s.x, y: s.y }));
            formData.append('stickers_data', JSON.stringify(stickersData));

            for (let i = 0; i < photos.length; i++) {
                const res = await fetch(photos[i]);
                const blob = await res.blob();
                formData.append('photos', blob, `photo_${i}.jpg`);
            }

            for (let i = 0; i < stickers.length; i++) {
                formData.append('stickers', stickers[i].file, `sticker_${i}.png`);
            }

            await api.post('/photobooth/results/generate', formData);

            navigate('/history');
        } catch (error) {
            console.error('Failed to save', error);
            toast.error('Gagal memproses gambar');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="pt-24 min-h-screen bg-slate-50 flex flex-col items-center justify-center pb-32 px-4 relative overflow-hidden">
            
            {/* Background Decor */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full pointer-events-none opacity-20" style={{ background: 'radial-gradient(circle, rgba(219,39,119,0.3) 0%, rgba(219,39,119,0) 70%)' }}></div>

            <div className="text-center mb-8 relative z-10">
                <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Preview Your Strip</h2>
                <p className="text-slate-500 font-medium mt-2 text-lg">Looking good! Ready to save your moment?</p>
            </div>

            {/* Strip Preview Container */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="bg-white p-4 shadow-[0_20px_50px_rgb(0,0,0,0.08)] rounded-xl border border-slate-100 max-w-sm w-full relative z-10 mx-auto flex justify-center"
                ref={containerRef}
            >
                {template && template.config ? (() => {
                    const config = template.config;
                    const cw = config.canvasWidth || 1080;
                    const ch = config.canvasHeight || 1350;
                    const containerWidth = 320; 
                    const scale = containerWidth / cw;
                    
                    return (
                        <div className="relative overflow-hidden bg-slate-100 shadow-sm rounded-md" style={{ width: containerWidth, height: ch * scale }} id="strip-container">
                            <div 
                                className="absolute top-0 left-0 origin-top-left" 
                                style={{ width: cw, height: ch, transform: `scale(${scale})` }}
                            >
                                {/* Background Overlay */}
                                <div className="absolute inset-0 z-10 pointer-events-none">
                                     <img src={getImageUrl(config.backgroundOverlay || template.file_path)} alt="Template Overlay" className="w-full h-full object-cover mix-blend-normal" />
                                </div>

                                {/* Photos in slots */}
                                {config.slots.map((slot, i) => {
                                    const src = photos[i];
                                    if (!src) return null;
                                    return (
                                        <div 
                                            key={i}
                                            className="absolute z-0 overflow-hidden"
                                            style={{
                                                top: slot.top, left: slot.left, width: slot.width, height: slot.height,
                                                transform: `rotate(${slot.rotation || 0}deg)`
                                            }}
                                        >
                                            <img src={src} alt={`Shot ${i}`} className={`w-full h-full object-cover transform scale-x-[-1] ${cssFilter}`} />
                                        </div>
                                    );
                                })}

                                {/* Render Stickers */}
                                {stickers.map(sticker => (
                                    <motion.img 
                                        key={sticker.id}
                                        src={sticker.url} 
                                        drag 
                                        dragConstraints={containerRef}
                                        dragMomentum={false}
                                        onDragEnd={(e, info) => {
                                            setStickers(prev => prev.map(s => 
                                                s.id === sticker.id ? { ...s, x: s.x + info.offset.x / scale, y: s.y + info.offset.y / scale } : s
                                            ));
                                        }}
                                        className="absolute w-48 h-48 object-contain cursor-move drop-shadow-lg z-20"
                                        style={{ top: '50%', left: '50%', x: '-50%', y: '-50%' }}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })() : (
                    <div className="space-y-3 bg-slate-100 p-3 rounded-lg border border-slate-200 relative overflow-hidden" id="strip-container">
                        {photos.map((src, i) => (
                            <div key={i} className="aspect-[4/3] rounded-md overflow-hidden shadow-sm">
                                <img src={src} alt={`Shot ${i}`} className={`w-full h-full object-cover transform scale-x-[-1] ${cssFilter}`} />
                            </div>
                        ))}
                        
                        {/* Render Stickers */}
                        {stickers.map(sticker => (
                            <motion.img 
                                key={sticker.id}
                                src={sticker.url} 
                                drag 
                                dragConstraints={containerRef}
                                dragMomentum={false}
                                onDragEnd={(e, info) => {
                                    setStickers(prev => prev.map(s => 
                                        s.id === sticker.id ? { ...s, x: s.x + info.offset.x, y: s.y + info.offset.y } : s
                                    ));
                                }}
                                className="absolute w-24 h-24 object-contain cursor-move drop-shadow-lg"
                                style={{ top: '50%', left: '50%', x: '-50%', y: '-50%' }}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                            />
                        ))}
                    </div>
                )}
            </motion.div>

            {/* Floating Action Bar */}
            <motion.div 
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, type: "spring", damping: 20 }}
                className="fixed bottom-8 bg-white/80 backdrop-blur-xl px-6 py-4 rounded-full shadow-[0_20px_50px_rgb(0,0,0,0.1)] border border-white flex items-center gap-4 z-50"
            >
                <button 
                    onClick={() => navigate('/camera')}
                    className="flex items-center gap-2 px-4 py-2 text-slate-600 font-bold hover:text-slate-900 transition-colors"
                >
                    <RefreshCcw className="w-5 h-5" />
                    Retake
                </button>
                
                <div className="relative">
                    <input 
                        type="file" 
                        accept="image/png, image/jpeg, image/svg+xml"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                                const url = URL.createObjectURL(file);
                                setStickers([...stickers, { id: Date.now(), file, url, x: 0, y: 0 }]);
                            }
                        }}
                    />
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-slate-700 font-bold hover:bg-slate-200 transition-colors">
                        + Add Sticker
                    </button>
                </div>
                
                <div className="w-px h-8 bg-slate-200"></div>
                
                <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="btn-primary py-3 px-8 rounded-full"
                >
                    <Save className="w-5 h-5" />
                    {isSaving ? 'Saving to Database...' : 'Save to History'}
                </button>
            </motion.div>

        </div>
    );
};

export default PhotoPreview;
