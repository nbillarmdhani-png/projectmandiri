import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import TemplateGallery from './pages/TemplateGallery';
import CameraPage from './pages/CameraPage';
import PhotoPreview from './pages/PhotoPreview';
import HistoryPage from './pages/HistoryPage';
import TemplateBuilder from './pages/TemplateBuilder';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="relative z-0 min-h-screen">
          <Toaster position="top-center" />
          <div className="fixed inset-0 bg-background z-[-1] overflow-hidden pointer-events-none">
            <motion.div 
              animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full mix-blend-multiply opacity-50" 
              style={{ background: 'radial-gradient(circle, rgba(219,39,119,0.3) 0%, rgba(219,39,119,0) 70%)', willChange: 'transform' }}
            />
            <motion.div 
              animate={{ x: [0, -100, 0], y: [0, -50, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full mix-blend-multiply opacity-50" 
              style={{ background: 'radial-gradient(circle, rgba(244,114,182,0.4) 0%, rgba(244,114,182,0) 70%)', willChange: 'transform' }}
            />
            <motion.div 
              animate={{ x: [0, 50, 0], y: [0, -100, 0], scale: [1, 1.3, 1] }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[20%] left-[40%] w-[50%] h-[50%] rounded-full mix-blend-multiply opacity-40" 
              style={{ background: 'radial-gradient(circle, rgba(251,146,60,0.3) 0%, rgba(251,146,60,0) 70%)', willChange: 'transform' }}
            />
          </div>
          
          <Navbar />
          
          <main>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/gallery" element={<TemplateGallery />} />
              <Route path="/camera" element={
                <PrivateRoute>
                  <CameraPage />
                </PrivateRoute>
              } />
              <Route path="/preview" element={
                <PrivateRoute>
                  <PhotoPreview />
                </PrivateRoute>
              } />
              <Route path="/history" element={
                <PrivateRoute>
                  <HistoryPage />
                </PrivateRoute>
              } />
              <Route path="/admin/templates" element={
                <PrivateRoute adminOnly={true}>
                  <TemplateBuilder />
                </PrivateRoute>
              } />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
