'use client';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check } from 'lucide-react';

interface Props { text: string; }

export default function ResultBox({ text }: Props) {
  const [copied, setCopied] = useState(false);

  if (!text) return null;

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{
      marginTop: '16px', background: 'white', borderRadius: '12px',
      padding: '18px', border: '1px solid #E2E8F0',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: '#1E40AF', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          분석 결과
        </div>
        <button
          onClick={handleCopy}
          style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            padding: '4px 10px', borderRadius: '6px', fontSize: '12px',
            border: '1px solid #E2E8F0',
            background: copied ? '#F0FDF4' : 'white',
            color: copied ? '#16A34A' : '#64748B',
            cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          {copied ? <><Check size={12} /> 복사됨</> : <><Copy size={12} /> 복사</>}
        </button>
      </div>
      <div style={{ fontSize: '13px', color: '#334155', lineHeight: 1.8, wordBreak: 'break-word' }}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => <div style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: '14px 0 6px' }}>{children}</div>,
            h2: ({ children }) => <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: '12px 0 6px' }}>{children}</div>,
            h3: ({ children }) => <div style={{ fontSize: '14px', fontWeight: 600, color: '#1E40AF', margin: '10px 0 4px' }}>{children}</div>,
            strong: ({ children }) => <strong style={{ fontWeight: 600, color: '#0F172A' }}>{children}</strong>,
            p: ({ children }) => <p style={{ margin: '4px 0', lineHeight: 1.7 }}>{children}</p>,
            ul: ({ children }) => <ul style={{ paddingLeft: '16px', margin: '4px 0' }}>{children}</ul>,
            ol: ({ children }) => <ol style={{ paddingLeft: '16px', margin: '4px 0' }}>{children}</ol>,
            li: ({ children }) => <li style={{ margin: '2px 0', lineHeight: 1.7 }}>{children}</li>,
            a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer" style={{ color: '#1E40AF', textDecoration: 'underline' }}>{children}</a>,
            hr: () => <hr style={{ border: 'none', borderTop: '1px solid #E2E8F0', margin: '12px 0' }} />,
            table: ({ children }) => (
              <div style={{ overflowX: 'auto', margin: '10px 0' }}>
                <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '12px' }}>{children}</table>
              </div>
            ),
            thead: ({ children }) => <thead style={{ background: '#F8FAFC' }}>{children}</thead>,
            tbody: ({ children }) => <tbody>{children}</tbody>,
            tr: ({ children }) => <tr style={{ borderBottom: '1px solid #E2E8F0' }}>{children}</tr>,
            th: ({ children }) => <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#475569', borderBottom: '2px solid #E2E8F0', whiteSpace: 'nowrap' }}>{children}</th>,
            td: ({ children }) => <td style={{ padding: '7px 10px', color: '#334155', verticalAlign: 'top' }}>{children}</td>,
          }}
        >
          {text}
        </ReactMarkdown>
      </div>
    </div>
  );
}
