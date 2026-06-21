import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';



const MagneticButton = ({ children, className }) => {
    const ref = useRef(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleMouse = (e) => {
        const { clientX, clientY } = e;
        const { height, width, left, top } = ref.current.getBoundingClientRect();
        const middleX = clientX - (left + width / 2);
        const middleY = clientY - (top + height / 2);
        setPosition({ x: middleX * 0.2, y: middleY * 0.2 });
    };

    const reset = () => {
        setPosition({ x: 0, y: 0 });
    };

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouse}
            onMouseLeave={reset}
            animate={{ x: position.x, y: position.y }}
            transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

const LandingPage = () => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const updateMousePosition = (e) => {
            setMousePosition({ 
                x: (e.clientX - window.innerWidth / 2) * 0.02,
                y: (e.clientY - window.innerHeight / 2) * 0.02
            });
        };
        window.addEventListener('mousemove', updateMousePosition);
        return () => window.removeEventListener('mousemove', updateMousePosition);
    }, []);

    return (
        <div className="min-h-screen relative flex flex-col justify-center pt-24 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full flex flex-col items-center text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="max-w-3xl"
                >
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 text-primary text-sm font-semibold mb-8 shadow-sm cursor-default">
                        <img src="/logo.png" alt="BoothApp Logo" className="w-5 h-5 object-contain" />
                        Premium Photobooth Experience
                    </span>
                    <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-6">
                        Capture Your <br className="hidden md:block"/> 
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Best Moments</span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed font-medium">
                        Create aesthetic photo strips directly from your browser. No app installation required. Studio quality right in your hands.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                        <MagneticButton>
                            <Link to="/camera" className="btn-primary w-full sm:w-auto text-lg px-8 py-4">
                                Start Photobooth
                            </Link>
                        </MagneticButton>
                        <MagneticButton>
                            <Link to="/gallery" className="btn-secondary w-full sm:w-auto text-lg px-8 py-4">
                                View Templates
                            </Link>
                        </MagneticButton>
                    </div>
                </motion.div>

                {/* Floating Mockup Preview with Parallax */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                    className="mt-20 relative w-full max-w-5xl"
                >
                    <div className="aspect-video bg-white/40 backdrop-blur-3xl rounded-[2rem] border border-white/80 shadow-[0_20px_50px_rgb(0,0,0,0.06)] p-4 md:p-8 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
                        <motion.div 
                            animate={{ x: -mousePosition.x, y: -mousePosition.y }}
                            transition={{ type: "tween", ease: "backOut", duration: 0.5 }}
                            className="w-full h-full bg-slate-50/80 backdrop-blur-sm rounded-2xl border border-white shadow-inner flex items-center justify-center gap-8 overflow-hidden"
                        >
                            {/* Dummy Strip 1 */}
                            <motion.div 
                                animate={{ y: [-10, 10, -10] }}
                                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                                className="w-32 md:w-48 bg-white p-2 md:p-3 shadow-xl rounded-sm transform -rotate-6"
                            >
                                <div className="space-y-2">
                                    <img src="https://picsum.photos/400/300?random=11" alt="dummy" className="w-full aspect-[4/3] object-cover rounded-sm" />
                                    <img src="https://picsum.photos/400/300?random=12" alt="dummy" className="w-full aspect-[4/3] object-cover rounded-sm" />
                                    <img src="https://picsum.photos/400/300?random=13" alt="dummy" className="w-full aspect-[4/3] object-cover rounded-sm" />
                                    <img src="https://picsum.photos/400/300?random=14" alt="dummy" className="w-full aspect-[4/3] object-cover rounded-sm" />
                                </div>
                            </motion.div>
                            
                            {/* Dummy Strip 2 */}
                            <motion.div 
                                animate={{ y: [10, -10, 10] }}
                                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                                className="w-32 md:w-48 bg-white p-2 md:p-3 shadow-2xl rounded-sm transform rotate-3 z-10"
                            >
                                <div className="space-y-2">
                                    <img src="https://picsum.photos/400/300?random=21" alt="dummy" className="w-full aspect-[4/3] object-cover rounded-sm" />
                                    <img src="https://picsum.photos/400/300?random=22" alt="dummy" className="w-full aspect-[4/3] object-cover rounded-sm" />
                                    <img src="https://picsum.photos/400/300?random=23" alt="dummy" className="w-full aspect-[4/3] object-cover rounded-sm" />
                                    <img src="https://picsum.photos/400/300?random=24" alt="dummy" className="w-full aspect-[4/3] object-cover rounded-sm" />
                                </div>
                            </motion.div>

                            {/* Dummy Strip 3 */}
                            <motion.div 
                                animate={{ y: [-15, 5, -15] }}
                                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                                className="hidden md:block w-48 bg-white p-3 shadow-xl rounded-sm transform -rotate-12"
                            >
                                <div className="space-y-2">
                                    <img src="https://picsum.photos/400/300?random=31" alt="dummy" className="w-full aspect-[4/3] object-cover rounded-sm" />
                                    <img src="https://picsum.photos/400/300?random=32" alt="dummy" className="w-full aspect-[4/3] object-cover rounded-sm" />
                                    <img src="https://picsum.photos/400/300?random=33" alt="dummy" className="w-full aspect-[4/3] object-cover rounded-sm" />
                                    <img src="https://picsum.photos/400/300?random=34" alt="dummy" className="w-full aspect-[4/3] object-cover rounded-sm" />
                                </div>
                            </motion.div>
                            
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default LandingPage;
