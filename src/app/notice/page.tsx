'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bell, RefreshCw, Loader2, ExternalLink } from 'lucide-react';

const DEPARTMENTS = ['컴퓨터과학전공', '수학과', '화학과', '통계학과', '식품영양학과', '의류학과', '영어영문학부', '경제학부', '법학부'];
const CATEGORIES = ['장학금', '취업/인턴십', '공모전', '행사/프로그램', '교환학생', '기타'];

const CATEGORY_KEYS: Record<string, string[]> = {
  '장학금': ['장학', '장학금', '지원금'],
  '취업/인턴십': ['취업', '인턴', '채용', '직무'],
  '공모전': ['공모전', '대회', '경진', '공모'],
  '행사/프로그램': ['행사', '프로그램', '특강', '세미나', '설명회', '캠프', '워크숍', '비교과', '간담회', '콜로퀴움', 'colloquium', 'Colloquium'],
  '교환학생': ['교환학생', '해외', '유학', '글로벌'],
  '기타': [],
};

interface NoticeItem {
  source: string;
  title: string;
  datetime?: string;
  details: string[];
  link?: string;
}

function formatKoreanDate(iso: string): string {
  try {
    const d = new Date(iso);
    const m = d.getMonth() + 1;
    const day = d.getDate();
    const weekDay = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
    const h = d.getHours().toString().padStart(2, '0');
    const min = d.getMinutes().toString().padStart(2, '0');
    return `${m}/${day} (${weekDay}) ${h}:${min}`;
  } catch { return iso; }
}

function parseNotices(text: string): NoticeItem[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const items: NoticeItem[] = [];
  let current: NoticeItem | null = null;

  const titleRe = /^\[([^\]]+)\]\s*(.*)/;
  const isoRe = /\((\d{4}-\d{2}-\d{2}T[^)]+)\)\s*$/;
  const urlRe = /https?:\/\/\S+/;

  for (const line of lines) {
    const titleMatch = line.match(titleRe);
    if (titleMatch) {
      if (current) items.push(current);
      let title = titleMatch[2].trim();
      let datetime: string | undefined;
      const dtMatch = title.match(isoRe);
      if (dtMatch) {
        datetime = dtMatch[1];
        title = title.replace(isoRe, '').trim();
      }
      current = { source: titleMatch[1], title, datetime, details: [] };
    } else if (current) {
      if (urlRe.test(line)) {
        current.link = line.match(urlRe)![0];
      } else if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
        const detail = line.replace(/^[•\-*]\s*/, '');
        if (detail && !detail.startsWith('링크') && !detail.startsWith('핵심 내용')) current.details.push(detail);
        // extract url from detail
        const urlInDetail = detail.match(urlRe);
        if (urlInDetail) current.link = urlInDetail[0];
      } else if (!line.startsWith('이 정보는') && !line.startsWith('※')) {
        // skip footer lines
      }
    }
  }
  if (current) items.push(current);
  return items;
}

function categorizItem(item: NoticeItem): string {
  const text = (item.source + ' ' + item.title + ' ' + item.details.join(' ')).toLowerCase();
  for (const cat of CATEGORIES.slice(0, -1)) {
    if (CATEGORY_KEYS[cat].some(kw => text.includes(kw.toLowerCase()))) return cat;
  }
  return '기타';
}

function NoticeCard({ item }: { item: NoticeItem }) {
  return (
    <div style={{
      background: 'white', borderRadius: '10px', padding: '12px 14px',
      border: '1px solid #F1F5F9', marginBottom: '8px',
    }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
        <span style={{
          fontSize: '10px', fontWeight: 600, color: '#D97706',
          background: '#FFF7ED', border: '1px solid #FDE68A',
          borderRadius: '4px', padding: '2px 6px', whiteSpace: 'nowrap', flexShrink: 0, marginTop: '1px',
        }}>{item.source}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 500, color: '#0F172A', lineHeight: 1.5 }}>{item.title}</div>
          {item.datetime && (
            <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '3px' }}>
              {formatKoreanDate(item.datetime)}
            </div>
          )}
          {item.details.length > 0 && (
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '6px', lineHeight: 1.6 }}>
              {item.details.map((d, i) => <div key={i}>{d}</div>)}
            </div>
          )}
          {item.link && (
            <a
              href={item.link} target="_blank" rel="noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                marginTop: '8px', fontSize: '12px', fontWeight: 500,
                color: '#1E40AF', textDecoration: 'none',
                background: '#EFF6FF', borderRadius: '6px', padding: '4px 10px',
              }}
            >
              <ExternalLink size={11} /> 공지 보기
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultTabs({ text }: { text: string }) {
  const items = parseNotices(text);
  const byCategory: Record<string, NoticeItem[]> = {};
  for (const item of items) {
    const cat = categorizItem(item);
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(item);
  }

  const availableTabs = items.length > 0
    ? ['전체', ...CATEGORIES.filter(c => byCategory[c]?.length > 0)]
    : ['전체'];

  const [tab, setTab] = useState('전체');

  const displayItems = tab === '전체' ? items : (byCategory[tab] || []);

  // fallback if items couldn't be parsed
  if (items.length === 0) {
    return (
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '16px' }}>
        <div style={{ fontSize: '13px', color: '#334155', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{text}</div>
      </div>
    );
  }

  return (
    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', overflowX: 'auto', borderBottom: '1px solid #F1F5F9', padding: '0 4px' }}>
        {availableTabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '10px 14px', fontSize: '12px', fontWeight: tab === t ? 600 : 400,
            color: tab === t ? '#1E40AF' : '#94A3B8',
            background: 'none', border: 'none',
            borderBottom: `2px solid ${tab === t ? '#1E40AF' : 'transparent'}`,
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}>
            {t}
            {t !== '전체' && byCategory[t] && (
              <span style={{ marginLeft: '4px', fontSize: '10px', color: tab === t ? '#1E40AF' : '#CBD5E1' }}>
                {byCategory[t].length}
              </span>
            )}
          </button>
        ))}
      </div>
      {/* Cards */}
      <div style={{ padding: '12px', maxHeight: '65vh', overflowY: 'auto' }}>
        {displayItems.length > 0
          ? displayItems.map((item, i) => <NoticeCard key={i} item={item} />)
          : <div style={{ fontSize: '13px', color: '#94A3B8', textAlign: 'center', padding: '20px' }}>관련 공지가 없습니다</div>
        }
      </div>
    </div>
  );
}

function Chip({ label, selected, color, onClick }: { label: string; selected: boolean; color: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: '5px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
      border: `1px solid ${selected ? color : '#E2E8F0'}`,
      background: selected ? `${color}14` : 'white',
      color: selected ? color : '#64748B',
      fontWeight: selected ? 600 : 400,
      whiteSpace: 'nowrap',
    }}>{label}</button>
  );
}

export default function NoticePage() {
  const [depts, setDepts] = useState<string[]>([]);
  const [cats, setCats] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const didFetch = useRef(false);

  function toggle(arr: string[], item: string, set: (v: string[]) => void) {
    set(arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item]);
  }

  async function fetchNotices(departments: string[], categories: string[]) {
    setLoading(true); setError(''); setResult('');
    try {
      const res = await fetch('/api/notice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ departments, categories }),
      });
      if (!res.ok) throw new Error(`오류가 발생했습니다 (${res.status})`);
      setResult(await res.text());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!didFetch.current) {
      didFetch.current = true;
      fetchNotices([], []);
    }
  }, []);

  const activeFilterCount = depts.length + cats.length;

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      <div style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '52px 20px 16px' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#64748B', textDecoration: 'none', fontSize: '13px', marginBottom: '16px' }}>
          <ArrowLeft size={14} /> 홈
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', background: '#FFF7ED', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bell size={20} color="#D97706" strokeWidth={1.8} />
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>맞춤형 지원 발굴</div>
              <div style={{ fontSize: '12px', color: '#64748B', marginTop: '1px' }}>학교 공지 · 장학금 · 취업 정보</div>
            </div>
          </div>
          <button
            onClick={() => fetchNotices(depts, cats)}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '7px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, border: '1px solid #E2E8F0', background: 'white', color: '#64748B', cursor: loading ? 'default' : 'pointer' }}
          >
            {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={14} />}
            새로고침
          </button>
        </div>
      </div>

      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Filters always visible */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '14px 16px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', letterSpacing: '0.04em', marginBottom: '8px' }}>학과</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {DEPARTMENTS.map(d => <Chip key={d} label={d} selected={depts.includes(d)} color="#1E40AF" onClick={() => toggle(depts, d, setDepts)} />)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', letterSpacing: '0.04em', marginBottom: '8px' }}>카테고리</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {CATEGORIES.map(c => <Chip key={c} label={c} selected={cats.includes(c)} color="#D97706" onClick={() => toggle(cats, c, setCats)} />)}
            </div>
          </div>
          {activeFilterCount > 0 && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => fetchNotices(depts, cats)}
                disabled={loading}
                style={{ flex: 1, padding: '8px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, background: loading ? '#E2E8F0' : '#1E40AF', color: loading ? '#94A3B8' : 'white', border: 'none', cursor: loading ? 'default' : 'pointer' }}
              >
                적용
              </button>
              <button
                onClick={() => { setDepts([]); setCats([]); fetchNotices([], []); }}
                style={{ padding: '8px 14px', borderRadius: '8px', fontSize: '13px', border: '1px solid #E2E8F0', background: 'white', color: '#64748B', cursor: 'pointer' }}
              >
                초기화
              </button>
            </div>
          )}
        </div>

        {error && <div style={{ padding: '10px 14px', background: '#FFF1F2', borderRadius: '8px', color: '#E11D48', fontSize: '13px' }}>{error}</div>}

        {loading && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '40px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <Loader2 size={28} color="#D97706" style={{ animation: 'spin 1s linear infinite' }} />
            <div style={{ fontSize: '13px', color: '#D97706', fontWeight: 500 }}>공지를 불러오는 중...</div>
          </div>
        )}

        {result && !loading && <ResultTabs text={result} />}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
