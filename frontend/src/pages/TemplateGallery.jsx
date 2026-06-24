import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Layers, Film, Square } from 'lucide-react';
import { Link } from 'react-router-dom';
import api, { getImageUrl } from '../services/api';

// Frame Count Icon helper
const FrameIcon = ({ count }) => {
    if (count === 1) return <Square className="w-4 h-4" />;
    if (count === 3) return <Film className="w-4 h-4" />;
    return <Layers className="w-4 h-4" />;
};

// Sophisticated CSS Mockup that visually represents the layout
const TemplateMockup = ({ template }) => {
    const config = template.config;
    const id = template.id;

    const containerStyle = {
        perspective: '800px',
    };

    // Vintage Diary: 2 polaroid cards rotated
    if (id === 5) return (
        <div style={containerStyle} className="relative w-full h-full flex items-center justify-center">
            <div className="absolute w-36 h-52 rounded-sm shadow-xl" style={{ background: '#8B2E3F', transform: 'rotate(-3deg) translateY(-10px) translateX(5px)', zIndex: 1 }}>
                <div className="absolute inset-2 bottom-8" style={{ background: 'rgba(200,215,240,0.3)', borderRadius: '1px' }}/>
                <div className="absolute inset-x-2 top-2" style={{ height: '56%', background: 'rgba(255,255,255,0.15)', borderRadius: '2px' }} />
                <div className="absolute inset-x-2 bottom-6" style={{ height: '40%', background: 'rgba(255,255,255,0.12)', borderRadius: '2px' }} />
            </div>
            <div className="absolute w-36 h-52 rounded-sm shadow-2xl" style={{ background: '#8B2E3F', transform: 'rotate(5deg) translateY(10px) translateX(-8px)', zIndex: 2 }}>
                <div className="absolute inset-2 bottom-8" style={{ background: 'rgba(200,215,240,0.3)', borderRadius: '1px' }}/>
                <div className="absolute inset-x-2 top-2" style={{ height: '56%', background: 'rgba(255,255,255,0.15)', borderRadius: '2px' }} />
                <div className="absolute inset-x-2 bottom-6" style={{ height: '40%', background: 'rgba(255,255,255,0.12)', borderRadius: '2px' }} />
            </div>
            <div className="absolute bottom-3 right-4 text-[9px] font-serif italic text-slate-400 select-none">vintage diary</div>
        </div>
    );

    // Y2K Retro: Gradient bg + phone silhouette
    if (id === 6) return (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-2xl" 
             style={{ background: 'linear-gradient(135deg, #b5a0c8, #c9a89d, #a89db5)' }}>
            {/* Dot pattern */}
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '12px 12px' }} />
            {/* Star stickers */}
            <span className="absolute top-3 right-5 text-2xl" style={{ color: '#FF6B9D', opacity: 0.9 }}>✦</span>
            <span className="absolute bottom-4 left-4 text-xl" style={{ color: '#6BB5FF', opacity: 0.9 }}>✦</span>
            {/* Phone mockup */}
            <div className="relative z-10 w-20 h-28 rounded-2xl shadow-2xl flex flex-col items-center justify-center"
                 style={{ background: 'linear-gradient(145deg, #d4a9a0, #c49088)', border: '2px solid rgba(180,120,100,0.4)' }}>
                <div className="w-14 h-16 rounded-lg mb-1 flex items-center justify-center"
                     style={{ background: 'rgba(200,220,255,0.35)', border: '1px solid rgba(180,140,130,0.4)' }}>
                    <Camera className="w-5 h-5 text-white/60" />
                </div>
                <div className="w-8 h-2 rounded-full" style={{ background: 'rgba(140,80,70,0.4)' }} />
            </div>
        </div>
    );

    // Cinematic: Dark bg 3 horizontal strips
    if (id === 3) return (
        <div className="relative w-full h-full flex flex-col items-center justify-center gap-2 rounded-2xl overflow-hidden"
             style={{ background: '#0f0f14' }}>
            {[0,1,2].map(i => (
                <div key={i} className="w-4/5 h-12 rounded-sm" 
                     style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)' }} />
            ))}
            <div className="absolute bottom-2 right-3 text-[8px] font-semibold tracking-widest text-white/30 uppercase select-none">Cinematic</div>
        </div>
    );

    // Grid Collage: 2x2 grid
    if (id === 2) return (
        <div className="relative w-full h-full flex items-center justify-center rounded-2xl overflow-hidden"
             style={{ background: '#f8f4f0' }}>
            <div className="grid grid-cols-2 gap-2 p-4 w-full h-full">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="rounded-lg" style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.12)' }} />
                ))}
            </div>
        </div>
    );

    // Polaroid single
    if (id === 4) return (
        <div className="relative w-full h-full flex items-center justify-center rounded-2xl overflow-hidden"
             style={{ background: '#f5f5f5' }}>
            <div className="w-32 shadow-2xl" style={{ background: 'white', padding: '8px 8px 28px 8px', borderRadius: '2px' }}>
                <div className="w-full aspect-square rounded-sm" style={{ background: 'rgba(200,210,240,0.5)' }} />
            </div>
        </div>
    );

    // Default fallback: Show the actual template image
    return (
        <div className="relative w-full h-full flex items-center justify-center rounded-2xl overflow-hidden bg-white/20 backdrop-blur-sm border border-white/30 p-4 shadow-inner">
            <img 
                src={getImageUrl(template.file_path)} 
                alt={template.name}
                className="max-w-full max-h-full object-contain drop-shadow-xl rounded-sm"
            />
        </div>
    );
};

// Badge colors per template style
const STYLE_BADGES = {
    1: { label: '4 Frames', color: 'bg-purple-100 text-purple-700' },
    2: { label: '2×2 Grid', color: 'bg-pink-100 text-pink-700' },
    3: { label: 'Cinematic', color: 'bg-slate-800 text-slate-200' },
    4: { label: 'Polaroid', color: 'bg-amber-100 text-amber-700' },
    5: { label: 'Scrapbook', color: 'bg-rose-100 text-rose-700' },
    6: { label: 'Y2K Retro', color: 'bg-violet-100 text-violet-700' },
};

const TemplateGallery = () => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hovered, setHovered] = useState(null);

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const res = await api.get('/photobooth/templates');
                // Only show templates that have been configured with at least 1 frame
                const validTemplates = res.data.filter(t => t.frame_count > 0);
                setTemplates(validTemplates);
            } catch (error) {
                console.error('Failed to fetch templates:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchTemplates();
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
    };
    const cardVariants = {
        hidden: { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 20 } }
    };

    return (
        <div className="pt-28 pb-16 min-h-screen px-4 max-w-7xl mx-auto relative">
            
            {/* Hero Header */}
            <div className="text-center mb-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <span className="inline-block px-4 py-1.5 mb-6 rounded-full text-sm font-semibold bg-primary/10 text-primary border border-primary/20">
                        {templates.length} Templates Available
                    </span>
                    <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-5">
                        Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Style</span>
                    </h2>
                    <p className="text-slate-500 max-w-xl mx-auto text-lg font-medium leading-relaxed">
                        From clean classics to vintage scrapbook — pick a frame that fits your vibe.
                    </p>
                </motion.div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-24">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                </div>
            ) : (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                    {templates.map((template) => {
                        const badge = STYLE_BADGES[template.id] || { label: `${template.frame_count} Frames`, color: 'bg-slate-100 text-slate-600' };
                        return (
                            <motion.div
                                key={template.id}
                                variants={cardVariants}
                                onHoverStart={() => setHovered(template.id)}
                                onHoverEnd={() => setHovered(null)}
                                className="group glass-panel flex flex-col hover:shadow-[0_20px_60px_rgba(244,114,182,0.2)] hover:-translate-y-2 transition-all duration-300 relative overflow-hidden"
                            >
                                {/* Mockup Preview Area */}
                                <div className="relative h-64 overflow-hidden bg-white/10 border-b border-white/20 backdrop-blur-sm">
                                    <motion.div
                                        animate={hovered === template.id ? { scale: 1.05 } : { scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 250, damping: 22 }}
                                        className="w-full h-full"
                                    >
                                        <TemplateMockup template={template} />
                                    </motion.div>
                                    
                                    {/* Hover CTA overlay */}
                                    <motion.div
                                        animate={{ opacity: hovered === template.id ? 1 : 0 }}
                                        className="absolute inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center"
                                    >
                                        <Link
                                            to={`/camera?template=${template.id}`}
                                            className="bg-white text-slate-900 font-bold px-6 py-3 rounded-full flex items-center gap-2 shadow-xl hover:scale-105 transition-transform"
                                        >
                                            <Camera className="w-5 h-5" />
                                            Start Session
                                        </Link>
                                    </motion.div>
                                </div>

                                {/* Card Body */}
                                <div className="p-6 flex flex-col gap-4 flex-1">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900 mb-1">{template.name}</h3>
                                            <p className="text-sm text-slate-500 font-medium leading-relaxed">{template.description}</p>
                                        </div>
                                        <span className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-full ${badge.color}`}>
                                            {badge.label}
                                        </span>
                                    </div>

                                    {/* Frame count + icon */}
                                    <div className="flex items-center gap-2 text-sm text-slate-500 font-medium pt-1">
                                        <FrameIcon count={template.frame_count} />
                                        <span>{template.frame_count} photo{template.frame_count > 1 ? 's' : ''} required</span>
                                    </div>
                                    
                                    <Link
                                        to={`/camera?template=${template.id}`}
                                        className="mt-auto w-full py-3 rounded-2xl border-2 border-primary/20 text-primary text-center font-bold text-sm hover:bg-primary hover:text-white hover:border-primary transition-all duration-200 flex items-center justify-center gap-2"
                                    >
                                        <Camera className="w-4 h-4" />
                                        Use This Template
                                    </Link>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}
        </div>
    );
};

export default TemplateGallery;
