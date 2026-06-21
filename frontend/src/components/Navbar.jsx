import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <motion.nav 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed top-0 w-full z-50 px-4 py-6 flex justify-center pointer-events-none"
        >
            <div className="glass-panel vercel-border px-8 py-3 rounded-full flex justify-between items-center bg-white/30 backdrop-blur-3xl pointer-events-auto gap-8 sm:gap-16 shadow-[0_8px_32px_rgba(244,114,182,0.2)]">
                <Link to="/" className="flex items-center gap-3 group">
                    <img src="/logo.png" alt="BoothApp Logo" className="w-12 h-12 object-contain group-hover:scale-105 transition-all duration-300" />
                    <span className="text-xl font-bold tracking-tight text-slate-600">
                        BoothApp
                    </span>
                </Link>
                
                <div>
                    <div className="flex items-center gap-6">
                        {user ? (
                            <>
                                <Link to="/gallery" className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors">Template</Link>
                                <Link to="/history" className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors">Riwayat</Link>
                                {user.role === 'admin' && (
                                    <Link to="/admin/templates" className="text-sm font-bold text-accent hover:text-primary transition-colors">Admin Panel</Link>
                                )}
                                <div className="h-5 w-px bg-slate-300"></div>
                                <span className="text-sm font-semibold text-slate-800 bg-white/50 px-3 py-1.5 rounded-full vercel-border">{user.username}</span>
                                <button onClick={handleLogout} className="flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-red-500 transition-all bg-white/40 px-4 py-2 rounded-full vercel-border hover:bg-red-50 hover:border-red-200 hover:shadow-sm">
                                    <LogOut className="w-4 h-4" />
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/gallery" className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors">Gallery</Link>
                                <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors">Login</Link>
                                <Link to="/register" className="btn-primary !py-2 !px-5 text-sm !rounded-full">Register</Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </motion.nav>
    );
};

export default Navbar;
