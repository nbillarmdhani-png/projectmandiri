import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(email, password);
            toast.success('Login berhasil!');
            navigate('/');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Login gagal');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 pt-28 pb-12">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-panel p-10 w-full max-w-md shadow-2xl"
            >
                <h2 className="text-3xl font-bold mb-3 text-center text-slate-800">Selamat Datang</h2>
                <p className="text-neutral-500 text-center mb-8">Masuk untuk melanjutkan sesi photobooth Anda.</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-1 opacity-80">Email</label>
                        <input 
                            type="email" 
                            className="input-field" 
                            placeholder="nama@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 opacity-80">Password</label>
                        <input 
                            type="password" 
                            className="input-field" 
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required 
                        />
                    </div>
                    <button type="submit" className="btn-primary w-full mt-8 py-3 text-lg">
                        Login
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                    <p className="text-sm text-neutral-500">
                        Belum punya akun? <Link to="/register" className="text-primary font-bold hover:underline ml-1">Daftar di sini</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
