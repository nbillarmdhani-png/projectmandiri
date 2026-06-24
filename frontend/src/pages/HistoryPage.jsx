import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Calendar, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { getImageUrl } from '../services/api';

const HistoryPage = () => {
    const [history, setHistory] = useState([]);
    
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await api.get('/photobooth/history');
                setHistory(res.data);
            } catch (error) {
                console.error(error);
            }
        };
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await api.get('/photobooth/history');
            setHistory(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Yakin ingin menghapus foto ini?')) return;
        try {
            await api.delete(`/photobooth/history/${id}`);
            fetchHistory();
        } catch (error) {
            console.error(error);
            toast.error('Gagal menghapus foto');
        }
    };

    const handleClearAll = async () => {
        if (!window.confirm('Yakin ingin menghapus SEMUA riwayat? Ini tidak dapat dibatalkan.')) return;
        try {
            await api.delete('/photobooth/history/all');
            setHistory([]);
        } catch (error) {
            console.error(error);
            toast.error('Gagal membersihkan riwayat');
        }
    };

    const handleDownload = (url, name) => {
        try {
            const fullUrl = getImageUrl(url);
            // Append ?download=name to force Supabase to send Content-Disposition: attachment
            const downloadUrl = fullUrl.includes('?') 
                ? `${fullUrl}&download=${name || 'photobooth.jpg'}`
                : `${fullUrl}?download=${name || 'photobooth.jpg'}`;
            
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = name || 'photobooth.jpg';
            link.target = '_blank'; // Fallback for some browsers
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Gagal mendownload foto');
        }
    };

    return (
        <div className="pt-28 pb-12 min-h-screen px-4 max-w-7xl mx-auto">
            <div className="text-center mb-16 relative">
                <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
                    Your Personal Gallery
                </h2>
                <p className="text-slate-500 max-w-2xl mx-auto text-lg font-medium">All your beautiful moments saved in one place.</p>
                {history.length > 0 && (
                    <button 
                        onClick={handleClearAll}
                        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 rounded-full font-bold hover:bg-red-100 transition-colors border border-red-100"
                    >
                        <Trash2 className="w-4 h-4" />
                        Clear All History
                    </button>
                )}
            </div>

            {history.length === 0 ? (
                <div className="text-center text-slate-400 py-20 font-medium">No photos yet. Start a session to create memories!</div>
            ) : (
                <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
                    {history.map((item, idx) => (
                        <motion.div 
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="glass-panel p-3 flex flex-col group relative overflow-hidden break-inside-avoid hover:shadow-[0_20px_60px_rgba(244,114,182,0.2)] transition-all duration-300 hover:-translate-y-2"
                        >
                            <div className="relative rounded-xl overflow-hidden mb-3">
                                <img 
                                    src={getImageUrl(item.final_image_path)} 
                                    alt="Photobooth Result" 
                                    className="w-full h-auto"
                                />
                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                    <button 
                                        onClick={() => handleDownload(item.final_image_path, `BoothApp_${item.id}.jpg`)}
                                        className="bg-white text-slate-900 p-3 rounded-full hover:scale-110 transition-transform shadow-xl"
                                        title="Download"
                                    >
                                        <Download className="w-5 h-5" />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(item.id)}
                                        className="bg-red-500 text-white p-3 rounded-full hover:bg-red-600 hover:scale-110 transition-all shadow-xl"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="px-2 flex items-center justify-between text-sm font-medium text-slate-500">
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4 text-primary" />
                                    {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default HistoryPage;
