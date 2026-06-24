import React, { useState, useEffect, useRef } from 'react';
import api, { getImageUrl } from '../services/api';
import { motion } from 'framer-motion';
import Moveable from 'react-moveable';
import { Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TemplateBuilder() {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [saving, setSaving] = useState(false);
  const [activeSlotIndex, setActiveSlotIndex] = useState(null);
  const gestureState = useRef({ top: 0, left: 0, width: 0, height: 0, rotation: 0 });
  const [templateSize, setTemplateSize] = useState({ width: 1080, height: 1350 });
  const [scale, setScale] = useState(0.5);

  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateFile, setNewTemplateFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const slotColors = [
    'bg-pink-500/60 border-pink-400 text-pink-100',
    'bg-emerald-500/60 border-emerald-400 text-emerald-100',
    'bg-amber-500/60 border-amber-400 text-amber-100',
    'bg-blue-500/60 border-blue-400 text-blue-100',
    'bg-purple-500/60 border-purple-400 text-purple-100',
    'bg-rose-500/60 border-rose-400 text-rose-100',
    'bg-cyan-500/60 border-cyan-400 text-cyan-100',
    'bg-lime-500/60 border-lime-400 text-lime-100'
  ];

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/photobooth/templates');
      setTemplates(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectTemplate = (t) => {
    setSelectedTemplate(t);
    setTemplateSize({ width: 1080, height: 1350 });
    setScale(0.5);
    if (t?.config && t.config.slots) {
      setSlots(t.config.slots);
    } else {
      setSlots([]);
    }
    setActiveSlotIndex(null);
  };

  const handleUploadTemplate = async (e) => {
    e.preventDefault();
    if (!newTemplateName || !newTemplateFile) {
      toast.error('Nama dan file wajib diisi');
      return;
    }
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('name', newTemplateName);
      formData.append('background_image', newTemplateFile);
      const res = await api.post('/photobooth/templates', formData);
      toast.success('Template berhasil diunggah!');
      setNewTemplateName('');
      setNewTemplateFile(null);
      
      // Fetch templates again and select the newly created one
      const fetchRes = await api.get('/photobooth/templates');
      setTemplates(fetchRes.data);
      const newTemplate = fetchRes.data.find(t => t.id === res.data.id);
      if (newTemplate) {
        handleSelectTemplate(newTemplate);
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengunggah template');
    }
    setIsUploading(false);
  };

  const handleDeleteTemplate = async (id) => {
    if (!window.confirm('Yakin ingin menghapus template ini?')) return;
    try {
      await api.delete(`/photobooth/templates/${id}`);
      toast.success('Template dihapus');
      if (selectedTemplate?.id === id) {
        setSelectedTemplate(null);
        setSlots([]);
      }
      fetchTemplates();
    } catch (err) {
      console.error(err);
      toast.error('Gagal menghapus template');
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'textarea') {
        return;
      }
      
      if (activeSlotIndex !== null) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          handleRemoveSlot(activeSlotIndex);
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
          e.preventDefault();
          const activeSlot = slots[activeSlotIndex];
          const newSlot = { ...activeSlot, top: activeSlot.top + 20, left: activeSlot.left + 20 };
          setSlots(prev => {
            const next = [...prev, newSlot];
            setActiveSlotIndex(next.length - 1);
            return next;
          });
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
          sessionStorage.setItem('copiedSlot', JSON.stringify(slots[activeSlotIndex]));
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        const copied = sessionStorage.getItem('copiedSlot');
        if (copied) {
          const slotToPaste = JSON.parse(copied);
          const newSlot = { ...slotToPaste, top: slotToPaste.top + 20, left: slotToPaste.left + 20 };
          setSlots(prev => {
            const next = [...prev, newSlot];
            setActiveSlotIndex(next.length - 1);
            return next;
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slots, activeSlotIndex]);

  const handleAddSlot = () => {
    setSlots([...slots, { top: 100, left: 100, width: 250, height: 250, rotation: 0 }]);
  };

  const handleSlotChange = (index, field, value) => {
    const newSlots = [...slots];
    newSlots[index] = { ...newSlots[index], [field]: Number(value) };
    setSlots(newSlots);
  };

  const handleRemoveSlot = (index) => {
    setSlots(slots.filter((_, i) => i !== index));
    if (activeSlotIndex === index) setActiveSlotIndex(null);
  };

  const handleSave = async () => {
    if (!selectedTemplate) return;
    setSaving(true);
    try {
      const config = {
        canvasWidth: templateSize.width,
        canvasHeight: templateSize.height,
        backgroundOverlay: selectedTemplate.file_path,
        slots: slots
      };
      await api.put(`/photobooth/templates/${selectedTemplate.id}`, { config });
      toast.success('Template configuration saved successfully!');
      fetchTemplates(); // refresh
    } catch (err) {
      console.error(err);
      toast.error('Failed to save configuration');
    }
    setSaving(false);
  };

  return (
    <div className="pt-32 pb-12 px-4 max-w-[1600px] mx-auto min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-800 drop-shadow-sm">Template Configurator</h1>
          <p className="text-slate-500 mt-2 font-medium">Map photo slots to physical template images with pixel-perfect precision.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left column: Configuration */}
        <div className="glass-panel p-6 space-y-8">
          
          <div className="bg-white/40 p-4 rounded-xl border border-white">
            <h3 className="font-bold text-slate-800 mb-4">Upload New Template</h3>
            <form onSubmit={handleUploadTemplate} className="space-y-3">
              <input 
                type="text" 
                placeholder="Template Name" 
                value={newTemplateName}
                onChange={e => setNewTemplateName(e.target.value)}
                className="w-full p-2 rounded border border-slate-200"
              />
              <input 
                type="file" 
                accept="image/png, image/jpeg"
                onChange={e => setNewTemplateFile(e.target.files[0])}
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
              <button disabled={isUploading} type="submit" className="w-full btn-primary py-2 rounded-lg">
                {isUploading ? 'Uploading...' : 'Upload'}
              </button>
            </form>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">Select Template</label>
            <div className="flex gap-2">
              <select 
                className="input-field w-full p-3 rounded-lg border border-slate-200"
                value={selectedTemplate?.id || ''}
                onChange={(e) => {
                  const t = templates.find(t => t.id === parseInt(e.target.value));
                  handleSelectTemplate(t);
                }}
              >
                <option value="">-- Choose Template --</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              {selectedTemplate && (
                <button 
                  onClick={() => handleDeleteTemplate(selectedTemplate.id)}
                  className="bg-red-50 text-red-600 px-4 rounded-lg border border-red-100 hover:bg-red-100 flex items-center justify-center transition-colors"
                  title="Hapus Template"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {selectedTemplate && (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-slate-700">Photo Slots</h2>
                <button 
                  onClick={handleAddSlot}
                  className="bg-primary/20 text-primary px-4 py-2 rounded-full text-sm font-bold hover:bg-primary hover:text-white transition-all duration-300 vercel-border shadow-sm"
                >
                  + Add Slot
                </button>
              </div>
              
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {slots.map((slot, i) => (
                  <div 
                    key={i} 
                    onClick={() => setActiveSlotIndex(i)}
                    className={`bg-white/40 backdrop-blur-md p-4 rounded-2xl relative cursor-pointer transition-all duration-300 ${activeSlotIndex === i ? 'border-[1.5px] border-primary shadow-[0_4px_20px_rgba(244,114,182,0.2)]' : 'border border-white/60 hover:border-primary/50 shadow-sm'}`}
                  >
                    <button 
                      onClick={() => handleRemoveSlot(i)}
                      className="absolute top-2 right-2 text-red-400 hover:text-red-300 text-sm"
                    >
                      Remove
                    </button>
                    <h3 className="font-medium mb-3 text-primary">Slot #{i + 1}</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <label className="block text-slate-500 mb-1 font-medium">Top (Y)</label>
                        <input type="number" value={slot.top} onChange={(e) => handleSlotChange(i, 'top', e.target.value)} className="w-full bg-white border border-slate-300 p-2 rounded" />
                      </div>
                      <div>
                        <label className="block text-slate-500 mb-1 font-medium">Left (X)</label>
                        <input type="number" value={slot.left} onChange={(e) => handleSlotChange(i, 'left', e.target.value)} className="w-full bg-white border border-slate-300 p-2 rounded" />
                      </div>
                      <div>
                        <label className="block text-slate-500 mb-1 font-medium">Width</label>
                        <input type="number" value={slot.width} onChange={(e) => handleSlotChange(i, 'width', e.target.value)} className="w-full bg-white border border-slate-300 p-2 rounded" />
                      </div>
                      <div>
                        <label className="block text-slate-500 mb-1 font-medium">Height</label>
                        <input type="number" value={slot.height} onChange={(e) => handleSlotChange(i, 'height', e.target.value)} className="w-full bg-white border border-slate-300 p-2 rounded" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-slate-500 mb-1 font-medium">Rotation (Degrees)</label>
                        <input type="number" value={slot.rotation || 0} onChange={(e) => handleSlotChange(i, 'rotation', e.target.value)} className="w-full bg-white border border-slate-300 p-2 rounded" />
                      </div>
                    </div>
                  </div>
                ))}
                
                {slots.length === 0 && (
                  <div className="text-center p-6 border border-dashed border-slate-300 rounded-xl text-slate-500">
                    No slots configured yet. Click "+ Add Slot" to begin.
                  </div>
                )}
              </div>

              <button 
                onClick={handleSave}
                disabled={saving}
                className="w-full btn-primary mt-8"
              >
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </>
          )}
        </div>

        {/* Right column: Preview Canvas */}
        <div className="md:col-span-2 glass-panel p-6 flex items-center justify-center overflow-auto min-h-[600px] bg-white/20">
          {selectedTemplate ? (
            <div style={{ width: templateSize.width * scale, height: templateSize.height * scale }} className="relative flex justify-center shrink-0">
              <div 
                className="absolute top-0 left-0 bg-zinc-800 shadow-2xl ring-4 ring-white/10"
                style={{ 
                  width: templateSize.width, 
                  height: templateSize.height, 
                  transform: `scale(${scale})`, 
                  transformOrigin: 'top left' 
                }}
              >
                {/* Template Image Overlay */}
                <div className="absolute inset-0 z-10 pointer-events-none opacity-90">
                  <img 
                    src={getImageUrl(selectedTemplate.file_path)} 
                    alt="Template" 
                    className="w-full h-full object-cover mix-blend-normal"
                    onLoad={(e) => {
                      const nw = e.target.naturalWidth || 1080;
                      const nh = e.target.naturalHeight || 1350;
                      setTemplateSize({ width: nw, height: nh });
                      
                      const containerSizeX = 700;
                      const containerSizeY = 600;
                      let newScale = Math.min(containerSizeX / nw, containerSizeY / nh);
                      if (newScale > 1) newScale = 1;
                      setScale(newScale);
                    }} 
                  />
                </div>

              {/* Slots Preview */}
              {slots.map((slot, i) => (
                <div 
                  key={i}
                  id={`slot-${i}`}
                  className={`slot-${i} absolute z-20 border-4 flex items-center justify-center text-6xl font-black shadow-[inset_0_0_40px_rgba(0,0,0,0.5)] transition-colors duration-200 ${activeSlotIndex === i ? 'bg-primary/80 border-primary text-white shadow-[0_0_20px_rgba(255,255,255,0.8)]' : slotColors[i % slotColors.length]}`}
                  onClick={() => setActiveSlotIndex(i)}
                  style={{
                    top: `${slot.top}px`,
                    left: `${slot.left}px`,
                    width: `${slot.width}px`,
                    height: `${slot.height}px`,
                    transform: `rotate(${slot.rotation || 0}deg)`,
                    cursor: 'pointer'
                  }}
                >
                  {i + 1}
                </div>
              ))}

              <Moveable
                  target={activeSlotIndex !== null ? `.slot-${activeSlotIndex}` : null}
                  zoom={1 / scale}
                  draggable={true}
                  resizable={true}
                  rotatable={true}
                  renderDirections={["nw", "n", "ne", "w", "e", "sw", "s", "se"]}
                  rotationPosition="top"
                  keepRatio={false}
                  snappable={true}
                  bounds={{ left: 0, top: 0, right: templateSize.width, bottom: templateSize.height }}
                  onDragStart={() => {
                    const slot = slots[activeSlotIndex];
                    gestureState.current = { 
                      ...slot, 
                      top: slot.top || 0, 
                      left: slot.left || 0, 
                      width: slot.width || 0, 
                      height: slot.height || 0, 
                      rotation: slot.rotation || 0 
                    };
                  }}
                  onDrag={(e) => {
                    gestureState.current.left += e.delta[0];
                    gestureState.current.top += e.delta[1];
                    e.target.style.left = `${Math.round(gestureState.current.left)}px`;
                    e.target.style.top = `${Math.round(gestureState.current.top)}px`;
                  }}
                  onDragEnd={() => {
                    setSlots((prev) => {
                      const s = [...prev];
                      s[activeSlotIndex].left = Math.round(gestureState.current.left);
                      s[activeSlotIndex].top = Math.round(gestureState.current.top);
                      return s;
                    });
                  }}
                  onResizeStart={() => {
                    const slot = slots[activeSlotIndex];
                    gestureState.current = { 
                      ...slot, 
                      top: slot.top || 0, 
                      left: slot.left || 0, 
                      width: slot.width || 0, 
                      height: slot.height || 0, 
                      rotation: slot.rotation || 0 
                    };
                  }}
                  onResize={(e) => {
                    gestureState.current.width = e.width;
                    gestureState.current.height = e.height;
                    gestureState.current.left += e.drag.delta[0];
                    gestureState.current.top += e.drag.delta[1];
                    e.target.style.width = `${Math.round(gestureState.current.width)}px`;
                    e.target.style.height = `${Math.round(gestureState.current.height)}px`;
                    e.target.style.left = `${Math.round(gestureState.current.left)}px`;
                    e.target.style.top = `${Math.round(gestureState.current.top)}px`;
                  }}
                  onResizeEnd={() => {
                    setSlots((prev) => {
                      const s = [...prev];
                      s[activeSlotIndex].width = Math.round(gestureState.current.width);
                      s[activeSlotIndex].height = Math.round(gestureState.current.height);
                      s[activeSlotIndex].left = Math.round(gestureState.current.left);
                      s[activeSlotIndex].top = Math.round(gestureState.current.top);
                      return s;
                    });
                  }}
                  onRotateStart={() => {
                    const slot = slots[activeSlotIndex];
                    gestureState.current = { 
                      ...slot, 
                      top: slot.top || 0, 
                      left: slot.left || 0, 
                      width: slot.width || 0, 
                      height: slot.height || 0, 
                      rotation: slot.rotation || 0 
                    };
                  }}
                  onRotate={(e) => {
                    gestureState.current.rotation += e.delta;
                    e.target.style.transform = `rotate(${Math.round(gestureState.current.rotation)}deg)`;
                  }}
                  onRotateEnd={() => {
                    setSlots((prev) => {
                      const s = [...prev];
                      s[activeSlotIndex].rotation = Math.round(gestureState.current.rotation);
                      return s;
                    });
                  }}
              />
              </div>
            </div>
          ) : (
            <div className="text-slate-400 flex flex-col items-center">
              <svg className="w-16 h-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Select a template to preview its configuration
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
