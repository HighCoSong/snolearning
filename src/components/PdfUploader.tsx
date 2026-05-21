'use client';
import { useState, useRef } from 'react';
import { Upload, FileText, Loader2, AlertCircle } from 'lucide-react';

interface Props {
  webhookPath: string;
  extraBody?: Record<string, string>;
  onSuccess?: (result: string) => void;
}

export default function PdfUploader({ webhookPath, extraBody, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file || !file.name.endsWith('.pdf')) {
      triggerError('PDF 파일만 업로드 가능합니다');
      return;
    }
    setFileName(file.name);
    setError('');
    setLoading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch(`/api/${webhookPath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_base64: base64, file_name: file.name, ...extraBody }),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `오류가 발생했습니다 (${res.status})`);
      }
      onSuccess?.(await res.text());
    } catch (e: unknown) {
      triggerError(e instanceof Error ? e.message : '오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  }

  function triggerError(msg: string) {
    setFileName('');
    setError(msg);
    setTimeout(() => setError(''), 4000);
  }

  const isError = !!error;

  return (
    <div>
      <div
        onClick={() => !loading && inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        style={{
          border: `1.5px dashed ${loading ? '#93C5FD' : isError ? '#FCA5A5' : '#CBD5E1'}`,
          borderRadius: '12px', padding: '40px 20px',
          textAlign: 'center', cursor: loading ? 'default' : 'pointer',
          background: loading ? '#F0F9FF' : isError ? '#FFF1F2' : 'white',
          transition: 'all 0.2s',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
        }}
      >
        {loading ? (
          <>
            <Loader2 size={28} color="#3B82F6" style={{ animation: 'spin 1s linear infinite' }} />
            <div style={{ fontSize: '14px', color: '#3B82F6', fontWeight: 500 }}>AI가 분석 중입니다...</div>
            <div style={{ fontSize: '12px', color: '#94A3B8' }}>{fileName}</div>
          </>
        ) : isError ? (
          <>
            <AlertCircle size={28} color="#E11D48" />
            <div style={{ fontSize: '14px', color: '#E11D48', fontWeight: 500 }}>{error}</div>
            <div style={{ fontSize: '12px', color: '#94A3B8' }}>클릭하여 다시 시도하세요</div>
          </>
        ) : fileName ? (
          <>
            <FileText size={28} color="#1E40AF" />
            <div style={{ fontSize: '14px', fontWeight: 500, color: '#0F172A' }}>{fileName}</div>
            <div style={{ fontSize: '12px', color: '#94A3B8' }}>다른 파일을 선택하려면 클릭하세요</div>
          </>
        ) : (
          <>
            <Upload size={28} color="#94A3B8" />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 500, color: '#0F172A' }}>PDF 파일 업로드</div>
              <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>클릭하거나 파일을 드래그하세요</div>
            </div>
          </>
        )}
      </div>
      <input ref={inputRef} type="file" accept=".pdf" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
