'use client';

import { useState, useRef, useCallback } from 'react';

type UploadFileType = 'image' | 'pdf' | 'any';

interface FileUploadProps {
  onUpload: (url: string) => void;
  bucket?: string;
  folder?: string;
  accept?: string;
  maxSizeMB?: number;
  type?: UploadFileType;
  currentUrl?: string;
  label?: string;
  className?: string;
}

interface UploadState {
  status: 'idle' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  url?: string;
}

export default function FileUpload({
  onUpload,
  bucket = 'documents',
  folder = '',
  accept = 'image/*,application/pdf',
  maxSizeMB = 10,
  currentUrl,
  label = 'Upload file',
  className = '',
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [upload, setUpload] = useState<UploadState>({
    status: currentUrl ? 'success' : 'idle',
    progress: 0,
    url: currentUrl,
  });
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      setUpload({ status: 'error', progress: 0, error: `File too large. Max ${maxSizeMB}MB.` });
      return;
    }

    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const validPdfTypes = ['application/pdf'];
    const isValidImage = validImageTypes.includes(file.type);
    const isValidPdf = validPdfTypes.includes(file.type);

    if (!isValidImage && !isValidPdf) {
      setUpload({ status: 'error', progress: 0, error: 'Invalid file type. Use JPEG, PNG, or PDF.' });
      return;
    }

    setUpload({ status: 'uploading', progress: 10, error: undefined });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', bucket);
    formData.append('folder', folder);

    try {
      const progressInterval = setInterval(() => {
        setUpload(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 15, 80),
        }));
      }, 200);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Upload failed');
      }

      const data = await response.json();

      setUpload({ status: 'success', progress: 100, url: data.url });
      onUpload(data.url);
    } catch (err) {
      setUpload({
        status: 'error',
        progress: 0,
        error: (err as Error).message || 'Upload failed. Try again.',
      });
    }
  }, [bucket, folder, maxSizeMB, onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const reset = useCallback(() => {
    setUpload({ status: 'idle', progress: 0, error: undefined, url: undefined });
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  const isImage = upload.url && /\.(jpg|jpeg|png|webp|gif|svg)/i.test(upload.url);

  return (
    <div className={className}>
      {upload.status === 'success' && upload.url ? (
        <div className="space-y-2">
          {isImage ? (
            <div className="relative group">
              <img
                src={upload.url}
                alt="Uploaded file"
                className="w-full h-32 object-cover rounded-lg border border-green-200"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                <a
                  href={upload.url}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-white text-slate-900 px-3 py-1.5 rounded-lg text-[12px] font-medium"
                >
                  View
                </a>
                <button
                  onClick={reset}
                  className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-[12px] font-medium"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-3">
              <i className="ti ti-file-text text-green-600 text-xl" />
              <div className="flex-1 min-w-0">
                <a
                  href={upload.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[12px] text-green-700 font-medium hover:underline truncate block"
                >
                  View uploaded file
                </a>
              </div>
              <button onClick={reset} className="text-red-500 hover:text-red-700">
                <i className="ti ti-x" />
              </button>
            </div>
          )}
          <p className="text-[11px] text-green-600 text-center">
            <i className="ti ti-circle-check mr-1" /> Uploaded successfully
          </p>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`
            flex flex-col items-center justify-center
            border-2 border-dashed rounded-xl p-6
            cursor-pointer transition-all
            ${upload.status === 'uploading'
              ? 'border-blue-400 bg-blue-50'
              : upload.status === 'error'
              ? 'border-red-300 bg-red-50'
              : dragOver
              ? 'border-blue-500 bg-blue-50 scale-[1.01]'
              : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50'
            }
          `}
        >
          {upload.status === 'uploading' ? (
            <div className="text-center w-full">
              <i className="ti ti-upload text-3xl text-blue-400 mb-2 block animate-bounce" />
              <span className="text-[13px] font-medium text-blue-600">
                Uploading... {upload.progress}%
              </span>
              <div className="mt-3 w-full bg-blue-200 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${upload.progress}%` }}
                />
              </div>
            </div>
          ) : upload.status === 'error' ? (
            <div className="text-center">
              <i className="ti ti-alert-circle text-3xl text-red-400 mb-2 block" />
              <span className="text-[13px] font-medium text-red-600">{upload.error}</span>
              <button
                onClick={(e) => { e.stopPropagation(); setUpload({ status: 'idle', progress: 0 }); }}
                className="block mt-2 text-[12px] text-blue-600 hover:underline mx-auto"
              >
                Try again
              </button>
            </div>
          ) : (
            <>
              <i className="ti ti-upload text-3xl text-slate-400 mb-2" />
              <span className="text-[13px] font-medium text-slate-600">{label}</span>
              <span className="text-[11px] text-slate-400 mt-1">Drag & drop or click to browse</span>
              <span className="text-[10px] text-slate-400 mt-0.5">
                {accept === 'image/*' ? 'JPG, PNG, WebP' : accept.includes('pdf') ? 'Images & PDF' : 'Any file'}
                {' · '}Max {maxSizeMB}MB
              </span>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleInput}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}