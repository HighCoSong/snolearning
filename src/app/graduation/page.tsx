'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, GraduationCap } from 'lucide-react';
import PdfUploader from '@/components/PdfUploader';
import ResultBox from '@/components/ResultBox';

export default function GraduationPage() {
  const [result, setResult] = useState('');
  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      <div style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '52px 20px 20px' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#64748B', textDecoration: 'none', fontSize: '13px', marginBottom: '16px' }}>
          <ArrowLeft size={14} /> 홈
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', background: '#EFF6FF', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={20} color="#1E40AF" strokeWidth={1.8} />
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>졸업요건 분석</div>
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '1px' }}>이수표 PDF를 업로드하세요</div>
          </div>
        </div>
      </div>
      <div style={{ padding: '20px 16px' }}>
        <PdfUploader webhookPath="graduation" onSuccess={setResult} />
        <ResultBox text={result} />
      </div>
    </div>
  );
}
