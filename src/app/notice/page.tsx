'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bell, RefreshCw, Loader2, ExternalLink, CalendarDays, CheckCircle2, LogIn, LogOut, Plus } from 'lucide-react';

const DEPT_BY_COLLEGE: { college: string; depts: string[] }[] = [
  { college: '문과대학', depts: ['한국어문학부', '역사문화학과', '프랑스언어·문화학과', '중어중문학부', '독일언어·문화학과', '일본학과', '문헌정보학과', '문화관광학전공', '르꼬르동블루외식경영전공', '교육학부'] },
  { college: '이과대학', depts: ['수학과', '통계학과', '화학과', '생명시스템학부', '체육교육과', '무용과'] },
  { college: '공과대학', depts: ['화공생명공학부', '인공지능공학부', '지능형전자시스템학부', '신소재물리학부', '컴퓨터과학전공', '데이터사이언스전공', '기계시스템학부', '첨단공학부'] },
  { college: '생활과학대학', depts: ['가족자원경영학과', '아동복지학부', '의류학과', '식품영양학과'] },
  { college: '사회과학대학', depts: ['정치외교학과', '행정학과', '홍보광고학과', '소비자경제학과', '사회심리학과'] },
  { college: '법과대학', depts: ['법학부'] },
];
const DEPARTMENTS = DEPT_BY_COLLEGE.flatMap(c => c.depts);
const CATEGORIES = ['장학금', '취업/인턴십', '공모전', '행사/프로그램', '교환학생', '기타'];

const CATEGORY_KEYS: Record<string, string[]> = {
  '장학금': ['장학', '장학금', '지원금'],
  '취업/인턴십': ['취업', '인턴', '채용', '직무'],
  '공모전': ['공모전', '대회', '경진', '공모'],
  '행사/프로그램': ['행사', '프로그램', '특강', '세미나', '설명회', '캠프', '워크숍', '비교과', '간담회', 'colloquium'],
  '교환학생': ['교환학생', '해외', '유학', '글로벌'],
  '기타': [],
};

interface NoticeItem {
  title: string;
  date?: string;
  url?: string;
  source?: string;
}

declare global {
  interface Window {
    google: {
      accounts: { oauth2: { initTokenClient: (cfg: { client_id: string; scope: string; callback: (r: { access_token: string }) => void }) => { requestAccessToken: () => void } } };
    };
  }
}

function formatKoreanDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const m = d.getMonth() + 1;
    const day = d.getDate();
    const weekDay = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
    const h = d.getHours().toString().padStart(2, '0');
    const min = d.getMinutes().toString().padStart(2, '0');
    return `${m}/${day} (${weekDay}) ${h}:${min}`;
  } catch { return iso; }
}

function categorize(item: NoticeItem): string {
  const text = ((item.source || '') + ' ' + item.title).toLowerCase();
  for (const cat of CATEGORIES.slice(0, -1)) {
    if (CATEGORY_KEYS[cat].some(kw => text.includes(kw.toLowerCase()))) return cat;
  }
  return '기타';
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

function NoticeCard({ item, token, onAddCal }: { item: NoticeItem; token: string; onAddCal: (item: NoticeItem) => Promise<void> }) {
  const [added, setAdded] = useState(false);
  const [adding, setAdding] = useState(false);
  const hasDate = !!item.date && item.date !== '날짜미상';

  async function handleAdd() {
    setAdding(true);
    await onAddCal(item);
    setAdded(true);
    setAdding(false);
  }

  return (
    <div style={{ background: 'white', borderRadius: '10px', padding: '12px 14px', border: '1px solid #F1F5F9', marginBottom: '8px' }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '10px', fontWeight: 600, color: '#D97706', background: '#FFF7ED', border: '1px solid #FDE68A', borderRadius: '4px', padding: '2px 6px', whiteSpace: 'nowrap', flexShrink: 0, marginTop: '1px' }}>
          {item.source || '공지'}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 500, color: '#0F172A', lineHeight: 1.5 }}>{item.title}</div>
          {hasDate && (
            <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '3px' }}>{formatKoreanDate(item.date!)}</div>
          )}
          <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
            {item.url && (
              <a href={item.url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 500, color: '#1E40AF', textDecoration: 'none', background: '#EFF6FF', borderRadius: '6px', padding: '4px 10px' }}>
                <ExternalLink size={11} /> 공지 보기
              </a>
            )}
            {hasDate && token && (
              added ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#16A34A', background: '#F0FDF4', borderRadius: '6px', padding: '4px 10px' }}>
                  <CheckCircle2 size={11} /> 추가됨
                </span>
              ) : (
                <button onClick={handleAdd} disabled={adding} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 500, color: '#16A34A', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '6px', padding: '4px 10px', cursor: adding ? 'default' : 'pointer' }}>
                  {adding ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={11} />}
                  캘린더
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultView({ items, analysis, token, onAddCal }: { items: NoticeItem[]; analysis: string; token: string; onAddCal: (item: NoticeItem) => Promise<void> }) {
  const byCategory: Record<string, NoticeItem[]> = {};
  for (const item of items) {
    const cat = categorize(item);
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(item);
  }
  const availableTabs = ['전체', ...CATEGORIES.filter(c => byCategory[c]?.length > 0)];
  const [tab, setTab] = useState('전체');
  const displayItems = tab === '전체' ? items : (byCategory[tab] || []);

  return (
    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
      <div className="tab-bar" style={{ display: 'flex', overflowX: 'auto', borderBottom: '1px solid #F1F5F9' }}>
        {availableTabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '10px 8px', fontSize: '11px', fontWeight: tab === t ? 600 : 400,
            color: tab === t ? '#1E40AF' : '#94A3B8',
            background: 'none', border: 'none',
            borderBottom: `2px solid ${tab === t ? '#1E40AF' : 'transparent'}`,
            cursor: 'pointer', whiteSpace: 'nowrap', minWidth: 'fit-content',
          }}>
            {t}
            {t !== '전체' && byCategory[t] && <span style={{ marginLeft: '3px', fontSize: '10px', color: tab === t ? '#1E40AF' : '#CBD5E1' }}>{byCategory[t].length}</span>}
          </button>
        ))}
      </div>
      <div style={{ padding: '12px', maxHeight: '65vh', overflowY: 'auto' }}>
        {displayItems.length > 0
          ? displayItems.map((item, i) => <NoticeCard key={i} item={item} token={token} onAddCal={onAddCal} />)
          : <div style={{ fontSize: '13px', color: '#94A3B8', textAlign: 'center', padding: '20px' }}>관련 공지가 없습니다</div>
        }
      </div>
    </div>
  );
}

export default function NoticePage() {
  const [depts, setDepts] = useState<string[]>([]);
  const [cats, setCats] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<NoticeItem[]>([]);
  const [analysis, setAnalysis] = useState('');
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [scriptReady, setScriptReady] = useState(false);
  const [cachedAt, setCachedAt] = useState<Date | null>(null);
  const didFetch = useRef(false);

  const CACHE_KEY = 'notice_cache';
  const CACHE_TTL = 30 * 60 * 1000; // 30분

  function loadCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return false;
      const { items: i, analysis: a, ts } = JSON.parse(raw);
      if (Date.now() - ts > CACHE_TTL) return false;
      setItems(i); setAnalysis(a); setCachedAt(new Date(ts));
      return true;
    } catch { return false; }
  }

  function saveCache(i: NoticeItem[], a: string) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ items: i, analysis: a, ts: Date.now() })); } catch { /* ignore */ }
  }

  useEffect(() => {
    if (document.querySelector('script[src*="accounts.google.com/gsi"]')) { setScriptReady(true); return; }
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => setScriptReady(true);
    document.head.appendChild(s);
  }, []);

  function handleGoogleLogin() {
    if (!scriptReady || !window.google) return;
    window.google.accounts.oauth2.initTokenClient({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
      scope: 'https://www.googleapis.com/auth/calendar.events openid email profile',
      callback: async (res) => {
        setToken(res.access_token);
        try {
          const info = await fetch('https://www.googleapis.com/oauth2/v1/userinfo', { headers: { Authorization: `Bearer ${res.access_token}` } }).then(r => r.json());
          setEmail(info.email || 'Google 계정');
        } catch { setEmail('Google 계정'); }
      },
    }).requestAccessToken();
  }

  async function addToCalendar(item: NoticeItem) {
    if (!token || !item.date) return;
    const start = new Date(item.date);
    const end = new Date(start.getTime() + 60 * 60 * 1000); // +1시간
    await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        summary: item.title,
        description: item.url || '',
        start: { dateTime: start.toISOString(), timeZone: 'Asia/Seoul' },
        end: { dateTime: end.toISOString(), timeZone: 'Asia/Seoul' },
      }),
    });
  }

  function toggle(arr: string[], item: string, set: (v: string[]) => void) {
    set(arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item]);
  }

  async function fetchNotices(departments: string[], categories: string[], useCache = false) {
    if (useCache && loadCache()) return;
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/notice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ departments, categories }),
      });
      if (!res.ok) throw new Error(await res.text());
      const text = await res.text();
      try {
        const json = JSON.parse(text);
        const newItems = json.items || [];
        const newAnalysis = json.analysis || '';
        setItems(newItems);
        setAnalysis(newAnalysis);
        saveCache(newItems, newAnalysis);
        setCachedAt(new Date());
      } catch {
        setAnalysis(text);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!didFetch.current) { didFetch.current = true; fetchNotices([], [], true); }
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
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
            <button onClick={() => fetchNotices(depts, cats)} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '7px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, border: '1px solid #E2E8F0', background: 'white', color: '#64748B', cursor: loading ? 'default' : 'pointer' }}>
              {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={14} />}
              새로고침
            </button>
            {cachedAt && !loading && <div style={{ fontSize: '10px', color: '#CBD5E1' }}>{cachedAt.getHours()}:{cachedAt.getMinutes().toString().padStart(2,'0')} 기준</div>}
          </div>
        </div>
      </div>

      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Google Login */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '12px 16px', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#0F172A', marginBottom: '8px' }}>
            <CalendarDays size={12} style={{ display: 'inline', marginRight: '4px' }} />
            Google 캘린더 연동
          </div>
          {token ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={14} color="#16A34A" />
                <span style={{ fontSize: '12px', color: '#0F172A' }}>{email}</span>
              </div>
              <button onClick={() => { setToken(''); setEmail(''); }} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', border: '1px solid #E2E8F0', background: 'white', color: '#64748B', cursor: 'pointer' }}>
                <LogOut size={11} /> 로그아웃
              </button>
            </div>
          ) : (
            <button onClick={handleGoogleLogin} disabled={!scriptReady} style={{ width: '100%', padding: '8px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, border: '1px solid #E2E8F0', background: 'white', color: '#0F172A', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <svg width="14" height="14" viewBox="0 0 18 18" fill="none"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/><path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
              <LogIn size={12} /> Google로 로그인
            </button>
          )}
        </div>

        {/* Filters */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '14px 16px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', letterSpacing: '0.04em', marginBottom: '10px' }}>학과</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {DEPT_BY_COLLEGE.map(({ college, depts: ds }) => (
                <div key={college}>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: '#94A3B8', marginBottom: '6px', letterSpacing: '0.05em' }}>{college}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {ds.map(d => <Chip key={d} label={d} selected={depts.includes(d)} color="#1E40AF" onClick={() => toggle(depts, d, setDepts)} />)}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', letterSpacing: '0.04em', marginBottom: '8px' }}>카테고리</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {CATEGORIES.map(c => <Chip key={c} label={c} selected={cats.includes(c)} color="#D97706" onClick={() => toggle(cats, c, setCats)} />)}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => fetchNotices(depts, cats)} disabled={loading} style={{ flex: 1, padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, background: loading ? '#E2E8F0' : '#1E40AF', color: loading ? '#94A3B8' : 'white', border: 'none', cursor: loading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Bell size={14} />}
                공지 조회하기
              </button>
              {activeFilterCount > 0 && <button onClick={() => { setDepts([]); setCats([]); fetchNotices([], []); }} style={{ padding: '10px 14px', borderRadius: '8px', fontSize: '13px', border: '1px solid #E2E8F0', background: 'white', color: '#64748B', cursor: 'pointer' }}>초기화</button>}
          </div>
        </div>

        {error && <div style={{ padding: '10px 14px', background: '#FFF1F2', borderRadius: '8px', color: '#E11D48', fontSize: '13px' }}>{error}</div>}

        {loading && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '40px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <Loader2 size={28} color="#D97706" style={{ animation: 'spin 1s linear infinite' }} />
            <div style={{ fontSize: '13px', color: '#D97706', fontWeight: 500 }}>공지를 불러오는 중...</div>
          </div>
        )}

        {items.length > 0 && !loading && <ResultView items={items} analysis={analysis} token={token} onAddCal={addToCalendar} />}
      </div>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .tab-bar { scrollbar-width: none; -ms-overflow-style: none; }
        .tab-bar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
