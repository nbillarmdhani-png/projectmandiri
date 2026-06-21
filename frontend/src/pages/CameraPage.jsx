import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, RefreshCw, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';

// Sounds are generated via Web Audio API for maximum compatibility
let audioCtx = null;

const initAudio = () => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
};

const playSyntheticSound = (type) => {
    initAudio();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    if (type === 'tick') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'shutter') {
        // Create white noise burst for shutter sound
        const bufferSize = audioCtx.sampleRate * 0.1;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        
        const noiseFilter = audioCtx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.value = 1000;
        
        const noiseGain = audioCtx.createGain();
        noiseGain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(audioCtx.destination);
        noise.start();
        
        // Mechanical click
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.05);
    }
};

const FILTERS = [
    { id: 'none', label: 'Normal', css: '' },
    { id: 'grayscale', label: 'B&W', css: 'grayscale-[100%]' },
    { id: 'sepia', label: 'Vintage', css: 'sepia-[80%]' }
];

const CameraStudio = () => {
    const webcamRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();
    const [photos, setPhotos] = useState([]);
    const [isCounting, setIsCounting] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [sessionId, setSessionId] = useState(null);
    const [timerOption, setTimerOption] = useState(3);
    const [flash, setFlash] = useState(false);
    const [template, setTemplate] = useState(null);
    
    // New Interactive States
    const [activeFilter, setActiveFilter] = useState('none');
    const [soundEnabled, setSoundEnabled] = useState(true);
    
    const searchParams = new URLSearchParams(location.search);
    const templateId = parseInt(searchParams.get('template') || 1);

    // Fetch template info from backend for dynamic frame_count
    useEffect(() => {
        api.get('/photobooth/templates')
           .then(res => {
               const found = res.data.find(t => t.id === templateId);
               setTemplate(found || null);
           })
           .catch(console.error);
    }, [templateId]);

    const MAX_FRAMES = template ? template.frame_count : 4;

    const playSound = (type) => {
        if (!soundEnabled) return;
        try {
            playSyntheticSound(type);
        } catch (e) {
            console.log('Audio play failed', e);
        }
    };

    const startSession = async () => {
        try {
            const res = await api.post('/photobooth/sessions', { template_id: templateId });
            setSessionId(res.data.sessionId);
        } catch (error) {
            console.error('Failed to start session', error);
        }
    };

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current.getScreenshot();
        setPhotos(prev => [...prev, imageSrc]);
        
        playSound('shutter');
        setFlash(true);
        setTimeout(() => setFlash(false), 150);
    }, [webcamRef, soundEnabled]);

    const startCaptureSequence = () => {
        if (!sessionId) {
            startSession();
        }
        
        if (photos.length >= MAX_FRAMES) return;

        setIsCounting(true);
        let count = timerOption;
        setCountdown(count);
        playSound('tick');

        const interval = setInterval(() => {
            count -= 1;
            setCountdown(count);
            
            if (count > 0) {
                playSound('tick');
            }
            
            if (count === 0) {
                clearInterval(interval);
                capture();
                setIsCounting(false);
            }
        }, 1000);
    };

    const resetPhotos = () => {
        setPhotos([]);
        setSessionId(null);
    };

    useEffect(() => {
        if (photos.length === MAX_FRAMES) {
            setTimeout(() => {
                navigate('/preview', { state: { photos, sessionId, filter: activeFilter, templateId } });
            }, 1000);
        }
    }, [photos, navigate, sessionId, activeFilter, templateId, MAX_FRAMES]);

    const currentFilterCss = FILTERS.find(f => f.id === activeFilter).css;

    return (
        <div className="pt-24 pb-8 min-h-screen px-4 max-w-[1400px] mx-auto flex flex-col items-center">
            
            <div className="w-full flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
                
                {/* Left: Camera Viewfinder */}
                <div className="flex-[2.5] relative rounded-[2rem] overflow-hidden bg-slate-900 flex items-center justify-center shadow-[0_20px_50px_rgb(0,0,0,0.1)] border border-slate-200">
                    <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        className={`w-full h-full object-cover transform scale-x-[-1] ${currentFilterCss}`}
                    />
                    
                    {/* Live Filter Indicator */}
                    {activeFilter !== 'none' && (
                        <div className="absolute top-6 right-6 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-accent" />
                            <span className="text-white text-sm font-semibold uppercase">{activeFilter}</span>
                        </div>
                    )}
                    
                    {/* Fullscreen Flash Overlay */}
                    <AnimatePresence>
                        {flash && (
                            <motion.div 
                                initial={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-white z-50 pointer-events-none"
                            />
                        )}
                    </AnimatePresence>
                </div>

                {/* Right: Controls */}
                <div className="flex-1 flex flex-col gap-6">
                    <div className="glass-panel p-6 flex flex-col gap-6 h-full overflow-y-auto">
                        
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 mb-1">Studio Settings</h3>
                                <p className="text-sm text-slate-500 font-medium">Configure your photobooth</p>
                            </div>
                            <button 
                                onClick={() => setSoundEnabled(!soundEnabled)}
                                className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors text-slate-600"
                            >
                                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                            </button>
                        </div>

                        {/* Live Filters */}
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 shadow-inner">
                            <span className="text-sm font-bold text-slate-700 block mb-3">Live Filters</span>
                            <div className="flex gap-2">
                                {FILTERS.map(f => (
                                    <button 
                                        key={f.id}
                                        onClick={() => setActiveFilter(f.id)}
                                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all uppercase ${activeFilter === f.id ? 'bg-primary text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Timer */}
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 shadow-inner">
                            <span className="text-sm font-bold text-slate-700 block mb-3">Timer Delay</span>
                            <div className="flex gap-2">
                                {[3, 5, 10].map(t => (
                                    <button 
                                        key={t}
                                        onClick={() => setTimerOption(t)}
                                        className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${timerOption === t ? 'bg-primary text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
                                    >
                                        {t}s
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 min-h-[150px]">
                            <div className="text-sm font-bold text-slate-700 mb-3 flex justify-between items-center">
                                <span>Shots Taken ({photos.length}/{MAX_FRAMES})</span>
                                {photos.length > 0 && (
                                    <button onClick={resetPhotos} className="text-slate-400 hover:text-red-500 transition-colors p-1 bg-white rounded-full shadow-sm border border-slate-100">
                                        <RefreshCw className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            <div className={`grid gap-3 ${MAX_FRAMES === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                {[...Array(MAX_FRAMES)].map((_, i) => (
                                    <div key={i} className="aspect-[4/3] rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center relative shadow-inner">
                                        {photos[i] ? (
                                            <img src={photos[i]} alt={`Shot ${i+1}`} className={`w-full h-full object-cover transform scale-x-[-1] ${currentFilterCss}`} />
                                        ) : (
                                            <Camera className="w-6 h-6 text-slate-300" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button 
                            onClick={startCaptureSequence}
                            disabled={isCounting || photos.length >= MAX_FRAMES}
                            className="btn-primary py-4 text-lg mt-auto disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Camera className="w-5 h-5" />
                            {photos.length >= MAX_FRAMES ? 'Processing...' : 'Take Photo'}
                        </button>
                    </div>
                </div>

            </div>

            {/* Fullscreen Countdown Overlay */}
            <AnimatePresence>
                {isCounting && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-white/40 backdrop-blur-lg"
                    >
                        <motion.span 
                            key={countdown}
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 1.5, opacity: 0 }}
                            transition={{ duration: 0.5 }}
                            className="text-[15rem] md:text-[20rem] font-extrabold text-white drop-shadow-xl mix-blend-overlay"
                        >
                            {countdown}
                        </motion.span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CameraStudio;
