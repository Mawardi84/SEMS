import React, { useState, useRef, useEffect } from "react";
import { Rnd } from "react-rnd";
import { Type, Image as ImageIcon, Square, QrCode, Trash2, Copy, BringToFront, SendToBack, Palette } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

export type ElementType = "text" | "image" | "qr" | "shape";

export interface CanvasElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number | string;
  height: number | string;
  
  // text
  text?: string;
  fontSize?: number;
  color?: string;
  fontWeight?: string;
  textAlign?: "left" | "center" | "right";
  fontFamily?: string;

  // image
  src?: string;
  
  // shape/bg
  backgroundColor?: string;
  borderRadius?: number;
  
  zIndex: number;
  
  // specific bindings for placeholders
  placeholderFor?: "name" | "role" | "none";
}

interface IdCardCanvasEditorProps {
  onSave?: (elements: CanvasElement[], background: string) => void;
  initialElements?: CanvasElement[];
}

const DEFAULT_CARD_WIDTH = 235;
const DEFAULT_CARD_HEIGHT = 360;

export default function IdCardCanvasEditor({ onSave, initialElements }: IdCardCanvasEditorProps) {
  const [elements, setElements] = useState<CanvasElement[]>(initialElements || [
    {
      id: "bg-shape",
      type: "shape",
      x: 0,
      y: 0,
      width: 235,
      height: 360,
      backgroundColor: "#ffffff",
      zIndex: 0,
    },
    {
      id: "title",
      type: "text",
      x: 20,
      y: 20,
      width: 195,
      height: 30,
      text: "PANITIA PELAKSANA",
      fontSize: 14,
      fontWeight: "bold",
      color: "#ef4444",
      textAlign: "center",
      zIndex: 1,
    },
    {
      id: "name-placeholder",
      type: "text",
      x: 20,
      y: 200,
      width: 195,
      height: 30,
      text: "NAMA PANITIA",
      fontSize: 16,
      fontWeight: "900",
      color: "#1e293b",
      textAlign: "center",
      placeholderFor: "name",
      zIndex: 2,
    },
    {
      id: "role-placeholder",
      type: "text",
      x: 20,
      y: 230,
      width: 195,
      height: 20,
      text: "JABATAN",
      fontSize: 12,
      fontWeight: "bold",
      color: "#64748b",
      textAlign: "center",
      placeholderFor: "role",
      zIndex: 3,
    }
  ]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [background, setBackground] = useState("#ffffff");

  useEffect(() => {
    if (onSave) {
      onSave(elements, background);
    }
  }, [elements, background]);

  const addElement = (type: ElementType) => {
    const newElement: CanvasElement = {
      id: uuidv4(),
      type,
      x: 50,
      y: 50,
      width: type === "text" ? 150 : 100,
      height: type === "text" ? 40 : 100,
      zIndex: elements.length + 1,
      ...(type === "text" && {
        text: "Teks Baru",
        fontSize: 14,
        color: "#000000",
        fontWeight: "normal",
        textAlign: "center"
      }),
      ...(type === "shape" && {
        backgroundColor: "#e2e8f0",
        borderRadius: 0,
      }),
      ...(type === "qr" && {
        src: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=example",
      })
    };
    setElements([...elements, newElement]);
    setSelectedId(newElement.id);
  };

  const updateElement = (id: string, updates: Partial<CanvasElement>) => {
    setElements(elements.map(el => (el.id === id ? { ...el, ...updates } : el)));
  };

  const deleteElement = (id: string) => {
    setElements(elements.filter(el => el.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const duplicateElement = (id: string) => {
    const el = elements.find(e => e.id === id);
    if (!el) return;
    const newEl = { ...el, id: uuidv4(), x: (el.x as number) + 10, y: (el.y as number) + 10, zIndex: elements.length + 1 };
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
  };

  const bringToFront = (id: string) => {
    const maxZ = Math.max(...elements.map(e => e.zIndex), 0);
    updateElement(id, { zIndex: maxZ + 1 });
  };

  const sendToBack = (id: string) => {
    const minZ = Math.min(...elements.map(e => e.zIndex), 0);
    updateElement(id, { zIndex: minZ - 1 });
  };

  const selectedElement = elements.find(e => e.id === selectedId);

  return (
    <div className="flex h-[700px] bg-slate-100 rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Sidebar Tools */}
      <div className="w-20 bg-white border-r border-slate-200 flex flex-col items-center py-4 space-y-4 z-10 shrink-0">
        <ToolButton icon={<Type size={20} />} label="Teks" onClick={() => addElement("text")} />
        <ToolButton icon={<Square size={20} />} label="Bentuk" onClick={() => addElement("shape")} />
        <ToolButton icon={<ImageIcon size={20} />} label="Gambar" onClick={() => {
           const url = prompt("Masukkan URL Gambar:");
           if (url) {
             const newElement: CanvasElement = {
                id: uuidv4(), type: "image", x: 50, y: 50, width: 100, height: 100, zIndex: elements.length + 1, src: url
             };
             setElements([...elements, newElement]);
           }
        }} />
        <ToolButton icon={<QrCode size={20} />} label="QR Code" onClick={() => addElement("qr")} />
      </div>

      {/* Canvas Area */}
      <div 
        className="flex-1 overflow-auto bg-slate-50 flex items-center justify-center p-8 relative"
        onClick={() => setSelectedId(null)}
      >
        <div 
          className="relative bg-white shadow-xl"
          style={{ width: DEFAULT_CARD_WIDTH, height: DEFAULT_CARD_HEIGHT, backgroundColor: background }}
        >
          {elements.sort((a, b) => a.zIndex - b.zIndex).map(el => (
            <Rnd
              key={el.id}
              bounds="parent"
              position={{ x: el.x as number, y: el.y as number }}
              size={{ width: el.width, height: el.height }}
              onDragStop={(e, d) => {
                updateElement(el.id, { x: d.x, y: d.y });
              }}
              onResizeStop={(e, direction, ref, delta, position) => {
                updateElement(el.id, {
                  width: ref.style.width,
                  height: ref.style.height,
                  ...position,
                });
              }}
              onClick={(e: any) => {
                e.stopPropagation();
                setSelectedId(el.id);
              }}
              className={`${selectedId === el.id ? "ring-2 ring-blue-500 shadow-lg ring-offset-1" : ""} hover:ring-1 hover:ring-blue-300 transition-shadow`}
              style={{
                zIndex: el.zIndex,
                display: 'flex',
                alignItems: 'center',
                justifyContent: el.textAlign === 'center' ? 'center' : el.textAlign === 'right' ? 'flex-end' : 'flex-start',
                backgroundColor: el.type === "shape" ? el.backgroundColor : "transparent",
                borderRadius: el.borderRadius ? `${el.borderRadius}px` : undefined,
                overflow: "hidden"
              }}
            >
              {el.type === "text" && (
                <div style={{
                  fontSize: `${el.fontSize}px`,
                  color: el.color,
                  fontWeight: el.fontWeight,
                  fontFamily: el.fontFamily,
                  textAlign: el.textAlign,
                  width: '100%',
                  wordWrap: 'break-word',
                  lineHeight: 1.2
                }}>
                  {el.placeholderFor === 'name' ? '[ NAMA PANITIA ]' : el.placeholderFor === 'role' ? '[ JABATAN ]' : el.text}
                </div>
              )}
              {el.type === "image" && el.src && (
                <img src={el.src} alt="element" className="w-full h-full object-cover pointer-events-none" />
              )}
              {el.type === "qr" && el.src && (
                <img src={el.src} alt="qr" className="w-full h-full object-contain pointer-events-none" />
              )}
            </Rnd>
          ))}
        </div>
      </div>

      {/* Properties Panel */}
      <div className="w-72 bg-white border-l border-slate-200 p-5 overflow-y-auto z-10 shrink-0">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Palette size={18} /> Properti
        </h3>
        
        {selectedElement ? (
          <div className="space-y-4">
            {/* Quick Actions */}
            <div className="flex gap-2">
              <button onClick={() => deleteElement(selectedElement.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 flex-1 flex justify-center"><Trash2 size={16} /></button>
              <button onClick={() => duplicateElement(selectedElement.id)} className="p-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 flex-1 flex justify-center"><Copy size={16} /></button>
              <button onClick={() => bringToFront(selectedElement.id)} className="p-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 flex-1 flex justify-center" title="Bring to Front"><BringToFront size={16} /></button>
              <button onClick={() => sendToBack(selectedElement.id)} className="p-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 flex-1 flex justify-center" title="Send to Back"><SendToBack size={16} /></button>
            </div>

            {selectedElement.type === "text" && (
              <>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Teks</label>
                  <textarea 
                    value={selectedElement.text} 
                    onChange={e => updateElement(selectedElement.id, { text: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 text-sm"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Ukuran Font</label>
                    <input 
                      type="number" 
                      value={selectedElement.fontSize} 
                      onChange={e => updateElement(selectedElement.id, { fontSize: Number(e.target.value) })}
                      className="w-full border border-slate-300 rounded p-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Warna</label>
                    <input 
                      type="color" 
                      value={selectedElement.color} 
                      onChange={e => updateElement(selectedElement.id, { color: e.target.value })}
                      className="w-full h-[38px] cursor-pointer"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Jenis Font</label>
                  <select 
                    value={selectedElement.fontFamily || "sans-serif"} 
                    onChange={e => updateElement(selectedElement.id, { fontFamily: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 text-sm"
                  >
                    <option value="sans-serif">Sans Serif</option>
                    <option value="serif">Serif</option>
                    <option value="monospace">Monospace</option>
                    <option value="Inter, sans-serif">Inter</option>
                    <option value="JetBrains Mono, monospace">JetBrains Mono</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Ketebalan</label>
                  <select 
                    value={selectedElement.fontWeight} 
                    onChange={e => updateElement(selectedElement.id, { fontWeight: e.target.value })}
                    className="w-full border border-slate-300 rounded p-2 text-sm"
                  >
                    <option value="normal">Normal</option>
                    <option value="medium">Medium</option>
                    <option value="bold">Bold</option>
                    <option value="900">Black</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Align</label>
                  <select 
                    value={selectedElement.textAlign} 
                    onChange={e => updateElement(selectedElement.id, { textAlign: e.target.value as any })}
                    className="w-full border border-slate-300 rounded p-2 text-sm"
                  >
                    <option value="left">Kiri</option>
                    <option value="center">Tengah</option>
                    <option value="right">Kanan</option>
                  </select>
                </div>
                <div className="pt-2">
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Variabel Otomatis (Mail Merge)</label>
                  <select 
                    value={selectedElement.placeholderFor || "none"} 
                    onChange={e => updateElement(selectedElement.id, { placeholderFor: e.target.value as any })}
                    className="w-full border border-slate-300 rounded p-2 text-sm bg-slate-50"
                  >
                    <option value="none">Teks Statis (Bukan Variabel)</option>
                    <option value="name">Nama Panitia</option>
                    <option value="role">Jabatan / Role</option>
                  </select>
                </div>
              </>
            )}

            {selectedElement.type === "shape" && (
              <>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Warna Latar</label>
                  <input 
                    type="color" 
                    value={selectedElement.backgroundColor} 
                    onChange={e => updateElement(selectedElement.id, { backgroundColor: e.target.value })}
                    className="w-full h-[38px] cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Radius Sudut (px)</label>
                  <input 
                    type="number" 
                    value={selectedElement.borderRadius || 0} 
                    onChange={e => updateElement(selectedElement.id, { borderRadius: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded p-2 text-sm"
                  />
                </div>
              </>
            )}

            <div className="pt-4 border-t border-slate-100">
               <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Posisi (X, Y)</label>
               <div className="flex gap-2">
                 <input type="number" value={Math.round(selectedElement.x as number)} readOnly className="w-1/2 bg-slate-50 border border-slate-200 rounded p-2 text-sm text-slate-500" />
                 <input type="number" value={Math.round(selectedElement.y as number)} readOnly className="w-1/2 bg-slate-50 border border-slate-200 rounded p-2 text-sm text-slate-500" />
               </div>
            </div>
            
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl">
              <h4 className="text-xs font-black text-purple-800 uppercase tracking-wider mb-2">Desain Kanvas Utama</h4>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Warna Latar Utama</label>
                <input 
                  type="color" 
                  value={background} 
                  onChange={e => setBackground(e.target.value)}
                  className="w-full h-[38px] cursor-pointer"
                />
              </div>
            </div>
            <div className="text-xs text-slate-400 text-center py-6 leading-relaxed">
              Klik elemen di kanvas untuk mengedit propertinya.<br/>
              Atau gunakan menu di sebelah kiri untuk menambahkan elemen baru.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ToolButton({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center gap-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors w-full"
    >
      {icon}
      <span className="text-[10px] font-bold uppercase">{label}</span>
    </button>
  );
}
