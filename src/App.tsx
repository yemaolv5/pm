import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Plus, Download, Upload, Trash2, Move, Type, Palette, Maximize, AlignLeft, AlignCenter, AlignRight, List } from 'lucide-react';
import { toPng } from 'html-to-image';
import { motion, AnimatePresence } from 'motion/react';
import { Rnd } from 'react-rnd';
import { PosterState, PosterText } from './types';
import defaultTemplate from './assets/images/regenerated_image_1779371896823.png';

export default function App() {
  const TEMPLATES = [
    { id: 'custom-default', url: defaultTemplate, name: '默认模板' },
    { id: '1', url: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=2071&auto=format&fit=crop', name: '极简背景' },
    { id: '2', url: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop', name: '渐变蓝' },
    { id: '3', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1964&auto=format&fit=crop', name: '几何艺术' },
  ];

  const [state, setState] = useState<PosterState>({
    templateImage: TEMPLATES[0].url, // Use first template as default
    texts: [
      {
        id: '1',
        content: '在这里输入内容 ✨',
        fontSize: 48,
        color: '#ffffff',
        x: 20,
        y: 10,
        width: 60,
        height: 15,
        fontWeight: 'bold',
        rotation: 0,
        shadowColor: '#000000',
        shadowBlur: 4,
        strokeColor: '#000000',
        strokeWidth: 0,
        textAlign: 'center',
        lineHeight: 1.3,
      }
    ],
    selectedTextId: '1',
    suggestedColors: ['#ffffff', '#000000', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
  });

  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const posterRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Track canvas size for px <-> % conversions
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setCanvasSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    if (posterRef.current) {
      observer.observe(posterRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setState(prev => ({ ...prev, templateImage: result }));
        extractColorsFromImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const extractColorsFromImage = (imageSrc: string) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 100;
      canvas.height = 100; // Resize for speed
      ctx.drawImage(img, 0, 0, 100, 100);

      const imageData = ctx.getImageData(0, 0, 100, 100).data;
      const colors: Record<string, number> = {};

      for (let i = 0; i < imageData.length; i += 40) { // Step to sample
        const r = imageData[i];
        const g = imageData[i + 1];
        const b = imageData[i + 2];
        const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
        colors[hex] = (colors[hex] || 0) + 1;
      }

      const sortedColors = Object.entries(colors)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(c => c[0]);

      setState(prev => ({ ...prev, suggestedColors: Array.from(new Set([...sortedColors, '#ffffff', '#000000'])) }));
    };
  };

  const addText = () => {
    const newText: PosterText = {
      id: Math.random().toString(36).substr(2, 9),
      content: '新内容 ✍️',
      fontSize: 32,
      color: state.suggestedColors[0] || '#ffffff',
      x: 30,
      y: 45,
      width: 40,
      height: 10,
      fontWeight: 'normal',
      rotation: 0,
      shadowColor: '#000000',
      shadowBlur: 2,
      strokeColor: '#000000',
      strokeWidth: 0,
      textAlign: 'center',
      lineHeight: 1.3,
    };
    setState(prev => ({
      ...prev,
      texts: [...prev.texts, newText],
      selectedTextId: newText.id
    }));
  };

  const updateText = (id: string, updates: Partial<PosterText>) => {
    setState(prev => ({
      ...prev,
      texts: prev.texts.map(t => t.id === id ? { ...t, ...updates } : t)
    }));
  };

  const deleteText = (id: string) => {
    setState(prev => ({
      ...prev,
      texts: prev.texts.filter(t => t.id !== id),
      selectedTextId: prev.selectedTextId === id ? null : prev.selectedTextId
    }));
  };

  const exportPoster = async () => {
    if (posterRef.current) {
      // Temporarily hide selection markers for export
      const originalSelectedId = state.selectedTextId;
      setState(prev => ({ ...prev, selectedTextId: null }));
      
      try {
        // Wait for state update/render
        await new Promise(r => setTimeout(r, 100));
        const dataUrl = await toPng(posterRef.current, { quality: 1.0, pixelRatio: 2 });
        const link = document.createElement('a');
        link.download = 'my-poster.png';
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error('Export failed', err);
      } finally {
        setState(prev => ({ ...prev, selectedTextId: originalSelectedId }));
      }
    }
  };

  const selectedText = state.texts.find(t => t.id === state.selectedTextId);

  return (
    <div className="flex h-screen bg-slate-950 font-sans text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-80 border-r border-slate-800 bg-slate-900 flex flex-col shadow-2xl z-10 overflow-y-auto shrink-0">
        <div className="p-6 border-b border-slate-800 bg-slate-900 sticky top-0 z-20">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-blue-500 tracking-[0.2em] mb-1">DESIGNED BY</span>
            <h1 className="text-2xl font-bold tracking-tight">
              <span className="font-display bg-gradient-to-br from-white via-blue-400 to-indigo-600 bg-clip-text text-transparent italic">yemaolv</span>
              <span className="text-slate-400 font-light ml-1 text-lg">海报制作</span>
            </h1>
          </div>
          <div className="mt-4 flex items-center gap-2 px-2 py-1 bg-blue-500/10 rounded-full w-fit border border-blue-500/20">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider">Professional Version</span>
          </div>
        </div>

        <div className="p-6 space-y-8 flex-1">
          {/* Template Section */}
          <section>
            <label className="text-sm font-medium text-slate-400 mb-3 block">1. 模板图片 (Template)</label>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-24 border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center hover:border-blue-500 hover:bg-blue-500/5 transition-all text-slate-500 hover:text-blue-400 group cursor-pointer"
            >
              <Upload className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs">{state.templateImage ? '更换图片' : '选择图片'}</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
          </section>

          {/* Text Elements Section */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-slate-400">2. 文字内容 (Texts)</label>
              <button
                onClick={addText}
                className="p-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
                title="添加新文字"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <AnimatePresence>
                {state.texts.map((text) => (
                  <motion.div
                    key={text.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    onClick={() => setState(prev => ({ ...prev, selectedTextId: text.id }))}
                    className={`p-3 rounded-xl cursor-pointer border transition-all ${
                      state.selectedTextId === text.id
                        ? 'bg-slate-800 border-blue-500/50 shadow-lg'
                        : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                       <div className="text-xs font-medium truncate opacity-60 flex-1">
                        {text.content.split('\n')[0] || '空内容'}
                       </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteText(text.id); }}
                        className="text-slate-600 hover:text-red-400 transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>

          {/* Controls for Selected Text */}
          {selectedText && (
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 pt-4 border-t border-slate-800"
            >
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 flex items-center gap-2">
                  <Type className="w-4 h-4" /> 编辑文字内容 (Content)
                </label>
                <textarea
                  value={selectedText.content}
                  onChange={(e) => updateText(selectedText.id, { content: e.target.value })}
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:ring-1 focus:ring-blue-500 outline-none resize-none transition-all scrollbar-hide"
                  placeholder="输入海报文案内容..."
                />
              </div>

              <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Palette className="w-4 h-4" /> 风格与布局 (Style)
              </label>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>字体大小</span>
                    <span>{selectedText.fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="8"
                    max="300"
                    value={selectedText.fontSize}
                    onChange={(e) => updateText(selectedText.id, { fontSize: parseInt(e.target.value) })}
                    className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-xs text-slate-500 flex items-center gap-1">
                    <Palette className="w-3 h-3" /> 颜色设置 (Color & Adaptation)
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {state.suggestedColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => updateText(selectedText.id, { color })}
                        className="w-6 h-6 rounded-full border border-slate-700 hover:scale-110 transition-transform shadow-sm"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-3 bg-slate-950/50 p-2 rounded-lg">
                    <input
                      type="color"
                      value={selectedText.color}
                      onChange={(e) => updateText(selectedText.id, { color: e.target.value })}
                      className="w-8 h-8 rounded bg-transparent border-none cursor-pointer"
                    />
                    <span className="text-xs font-mono opacity-60">{selectedText.color}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs text-slate-500">文字居中 (Align)</label>
                    <div className="flex bg-slate-950 p-1 rounded-lg gap-1">
                      {(['left', 'center', 'right'] as const).map(align => (
                        <button
                          key={align}
                          onClick={() => updateText(selectedText.id, { textAlign: align })}
                          className={`flex-1 flex justify-center py-1 rounded ${
                            selectedText.textAlign === align ? 'bg-blue-600' : 'hover:bg-slate-800'
                          }`}
                        >
                          {align === 'left' && <AlignLeft className="w-3.5 h-3.5" />}
                          {align === 'center' && <AlignCenter className="w-3.5 h-3.5" />}
                          {align === 'right' && <AlignRight className="w-3.5 h-3.5" />}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-slate-500">加粗 (Bold)</label>
                    <button
                      onClick={() => updateText(selectedText.id, { fontWeight: selectedText.fontWeight === 'bold' ? 'normal' : 'bold' })}
                      className={`w-full py-1 rounded border border-slate-700 text-xs font-bold transition-colors ${
                        selectedText.fontWeight === 'bold' ? 'bg-blue-600 border-blue-500' : 'bg-slate-800 hover:bg-slate-700'
                      }`}
                    >
                      B
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                   <label className="text-xs text-slate-500 flex justify-between">
                      <span>行高 (Line Height)</span>
                      <span>{selectedText.lineHeight}</span>
                   </label>
                   <input
                      type="range"
                      min="0.5"
                      max="3"
                      step="0.1"
                      value={selectedText.lineHeight}
                      onChange={(e) => updateText(selectedText.id, { lineHeight: parseFloat(e.target.value) })}
                      className="w-full accent-blue-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs text-slate-500">文字描边 (Stroke)</label>
                    <div className="flex items-center gap-2">
                       <input
                        type="color"
                        value={selectedText.strokeColor}
                        onChange={(e) => updateText(selectedText.id, { strokeColor: e.target.value })}
                        className="w-6 h-6 rounded bg-transparent border-none cursor-pointer"
                      />
                      <input
                        type="range"
                        min="0"
                        max="8"
                        step="0.5"
                        value={selectedText.strokeWidth}
                        onChange={(e) => updateText(selectedText.id, { strokeWidth: parseFloat(e.target.value) })}
                        className="flex-1 accent-blue-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-slate-500">文字阴影 (Shadow)</label>
                    <div className="flex items-center gap-2">
                       <input
                        type="color"
                        value={selectedText.shadowColor}
                        onChange={(e) => updateText(selectedText.id, { shadowColor: e.target.value })}
                        className="w-6 h-6 rounded bg-transparent border-none cursor-pointer"
                      />
                      <input
                        type="range"
                        min="0"
                        max="20"
                        value={selectedText.shadowBlur}
                        onChange={(e) => updateText(selectedText.id, { shadowBlur: parseInt(e.target.value) })}
                        className="flex-1 accent-indigo-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-slate-500 flex items-center gap-1">旋转角度 (Rotation)</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      value={selectedText.rotation}
                      onChange={(e) => updateText(selectedText.id, { rotation: parseInt(e.target.value) })}
                      className="flex-1 accent-indigo-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-[10px] w-6 font-mono">{selectedText.rotation}°</span>
                  </div>
                </div>
              </div>
            </motion.section>
          )}
        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-900 sticky bottom-0">
          <button
            onClick={exportPoster}
            disabled={!state.templateImage}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:bg-slate-800 disabled:text-slate-600 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg active:scale-95"
          >
            <Download className="w-5 h-5" />
            导出海报 (Export)
          </button>
          {!state.templateImage && (
            <p className="text-[10px] text-slate-500 mt-2 text-center">请先上传模板图片</p>
          )}
        </div>
      </aside>

      {/* Main Preview Area */}
      <main className="flex-1 p-8 flex items-center justify-center bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_100%)] from-slate-900 to-slate-950 overflow-hidden relative">
        {/* Subtle grid background */}
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none"
             style={{ backgroundImage: 'radial-gradient(circle, #475569 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

        <div className="relative z-10 max-w-full max-h-full flex items-center justify-center shadow-[0_0_80px_rgba(0,0,0,0.5)]">
          <div
            ref={posterRef}
            className="relative bg-slate-800 overflow-hidden"
            style={{
              width: 'min(90vw - 340px, 80vh * 0.707)',
              aspectRatio: '1 / 1.414',
            }}
          >
            {state.templateImage ? (
              <img
                src={state.templateImage}
                alt="Poster background"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                draggable={false}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-slate-600">
                <Upload className="w-12 h-12 opacity-20" />
                <p className="text-sm font-medium opacity-40">预览区域 (先上传图片)</p>
              </div>
            )}

            {/* Poster Canvas Overlay for Texts */}
            <div className="absolute inset-0 overflow-hidden">
              {state.texts.map((text) => (
                <Rnd
                  key={text.id}
                  size={{
                    width: (text.width || 50) * canvasSize.width / 100,
                    height: (text.height || 10) * canvasSize.height / 100,
                  }}
                  position={{
                    x: (text.x * canvasSize.width) / 100,
                    y: (text.y * canvasSize.height) / 100,
                  }}
                  onDragStop={(e, d) => {
                    const newX = (d.x / canvasSize.width) * 100;
                    const newY = (d.y / canvasSize.height) * 100;
                    updateText(text.id, { x: newX, y: newY });
                  }}
                  onResizeStop={(e, direction, ref, delta, position) => {
                    const newW = (parseFloat(ref.style.width) / canvasSize.width) * 100;
                    const newH = (parseFloat(ref.style.height) / canvasSize.height) * 100;
                    const newX = (position.x / canvasSize.width) * 100;
                    const newY = (position.y / canvasSize.height) * 100;
                    updateText(text.id, { 
                      width: newW, 
                      height: newH,
                      x: newX,
                      y: newY
                    });
                  }}
                  onDragStart={() => setState(prev => ({ ...prev, selectedTextId: text.id }))}
                  bounds="parent"
                  enableResizing={state.selectedTextId === text.id}
                  disableDragging={false}
                  className={`flex items-center justify-center ${
                    state.selectedTextId === text.id ? 'ring-1 ring-blue-500 ring-offset-0 z-30' : 'z-20'
                  }`}
                >
                  <div
                    style={{
                      fontSize: `${text.fontSize}px`,
                      color: text.color,
                      fontWeight: text.fontWeight as any,
                      lineHeight: text.lineHeight,
                      textAlign: text.textAlign,
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: text.textAlign === 'center' ? 'center' : text.textAlign === 'right' ? 'flex-end' : 'flex-start',
                      justifyContent: 'center',
                      wordBreak: 'break-word',
                      padding: '4px',
                      textShadow: `${text.shadowColor} 0px 0px ${text.shadowBlur}px, ${text.shadowColor} 0px 0px ${text.shadowBlur/2}px`,
                      WebkitTextStroke: text.strokeWidth > 0 ? `${text.strokeWidth}px ${text.strokeColor}` : 'none',
                      whiteSpace: 'pre-wrap',
                      userSelect: 'none',
                      transform: `rotate(${text.rotation}deg)`,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setState(prev => ({ ...prev, selectedTextId: text.id }));
                    }}
                  >
                    {text.content}
                  </div>

                  {/* Resize handle visual indicators for selected item */}
                  {state.selectedTextId === text.id && (
                    <div className="absolute inset-0 border border-blue-500/50 pointer-events-none">
                       <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 rounded-full" />
                       <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
                       <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 rounded-full" />
                       <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
                    </div>
                  )}
                </Rnd>
              ))}
            </div>
          </div>
        </div>

        {/* Hover/Interaction hints */}
        {state.templateImage && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-slate-800 text-[10px] text-slate-400 flex items-center gap-4">
             <div className="flex items-center gap-1 font-medium"><Move className="w-3 h-3" /> 拖动调整位置</div>
             <div className="w-1 h-1 bg-slate-700 rounded-full"></div>
             <div className="flex items-center gap-1 font-medium"><Maximize className="w-3 h-3" /> 边缘缩放区域</div>
          </div>
        )}
      </main>

      {/* Right Sidebar - Template Library */}
      <aside className="w-48 border-l border-slate-800 bg-slate-900 flex flex-col shadow-2xl z-10 overflow-y-auto shrink-0">
        <div className="p-4 border-b border-slate-800 bg-slate-900 sticky top-0 z-20">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <List className="w-3 h-3" /> 模板库 (Gallery)
          </h2>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => {
                  setState(prev => ({ ...prev, templateImage: template.url }));
                  extractColorsFromImage(template.url);
                }}
                className={`group relative aspect-[1/1.414] rounded-lg overflow-hidden border-2 transition-all ${
                  state.templateImage === template.url ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'border-transparent hover:border-slate-700'
                }`}
              >
                <img
                  src={template.url}
                  alt={template.name}
                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white bg-blue-600 px-2 py-1 rounded">使用</span>
                </div>
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-800">
             <p className="text-[10px] text-slate-500 leading-relaxed">
               点击上方模板快速更换。您也可以在左侧面板上传自定义图片。
             </p>
          </div>
        </div>
      </aside>
    </div>
  );
}


