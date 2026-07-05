'use client';

import { useRef, useEffect, useState, useCallback } from 'react';

type SigMethod = 'draw' | 'type' | 'upload';

interface DigitalSignatureProps {
  onSignature: (data: string, method: SigMethod) => void;
  signerName?: string;
}

export default function DigitalSignatureCanvas({ onSignature, signerName = '' }: DigitalSignatureProps) {
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const [method, setMethod]  = useState<SigMethod>('draw');
  const [typedName, setTyped] = useState(signerName);
  const [drawing, setDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // ── Canvas init ───────────────────────────────────────────────
  useEffect(() => {
    if (method !== 'draw') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth   = 2.5;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
  }, [method]);

  const getPos = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top)  * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top)  * scaleY,
    };
  };

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const pos = getPos(e.nativeEvent as MouseEvent | TouchEvent, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setDrawing(true);
  }, []);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const pos = getPos(e.nativeEvent as MouseEvent | TouchEvent, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasDrawn(true);
  }, [drawing]);

  const endDraw = useCallback(() => {
    setDrawing(false);
    if (hasDrawn && canvasRef.current) {
      onSignature(canvasRef.current.toDataURL(), 'draw');
    }
  }, [drawing, hasDrawn, onSignature]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleTypeChange = (val: string) => {
    setTyped(val);
    onSignature(val, 'type');
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => onSignature(ev.target?.result as string, 'upload');
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3">
      {/* Method tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {(['draw', 'type', 'upload'] as SigMethod[]).map(m => (
          <button
            key={m}
            onClick={() => setMethod(m)}
            className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-all capitalize
              ${method === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {m === 'draw' ? 'Draw on screen' : m === 'type' ? 'Type name' : 'Upload image'}
          </button>
        ))}
      </div>

      {/* Draw */}
      {method === 'draw' && (
        <div className="relative border-2 border-dashed border-slate-300 rounded-lg overflow-hidden bg-white">
          <canvas
            ref={canvasRef}
            width={500}
            height={140}
            className="w-full cursor-crosshair touch-none"
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={e => { e.preventDefault(); draw(e); }}
            onTouchEnd={endDraw}
          />
          <button
            onClick={clearCanvas}
            className="absolute top-2 right-2 bg-white border border-slate-200 text-slate-500 text-[11px] px-2 py-1 rounded-md hover:bg-slate-50"
          >
            Clear
          </button>
          <p className="text-[11px] text-slate-400 text-center pb-2">
            Draw your signature using your finger or mouse
          </p>
        </div>
      )}

      {/* Type */}
      {method === 'type' && (
        <div className="space-y-3">
          <input
            type="text"
            value={typedName}
            onChange={e => handleTypeChange(e.target.value)}
            placeholder="Type your full legal name"
            className="w-full border-2 border-slate-200 rounded-lg px-3 py-2.5 text-sm
              focus:outline-none focus:border-blue-500 transition-all"
          />
          {typedName && (
            <div className="border border-slate-200 rounded-lg p-4 bg-white min-h-[70px] flex items-center">
              <div>
                <span className="sig-cursive text-[28px]">{typedName}</span>
                <div className="border-t border-slate-800 mt-1 w-48" />
                <p className="text-[10px] text-slate-400 mt-1">Digitally signed</p>
              </div>
            </div>
          )}
          <p className="text-[11px] text-slate-400">
            Your name in cursive will appear as your digital signature on the agreement.
          </p>
        </div>
      )}

      {/* Upload */}
      {method === 'upload' && (
        <div>
          <label className="block border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
            <i className="ti ti-upload text-2xl text-slate-400 block mb-2" />
            <span className="text-[13px] font-medium text-slate-600">Upload signature image</span>
            <p className="text-[11px] text-slate-400 mt-1">JPG or PNG, clear background preferred</p>
            <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
          </label>
        </div>
      )}
    </div>
  );
}
