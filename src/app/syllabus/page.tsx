'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, CheckCircle2, Loader2, LogIn, LogOut, Plus } from 'lucide-react';
import PdfUploader from '@/components/PdfUploader';

interface CalEvent {
  title: string;
  date: string;
  startDateTime: string;
  endDateTime: string;
  description?: string;
}

declare global {
  interface Window {
    google: {
      accounts: {
        oauth2: {
          initTokenClient: (cfg: {
            client_id: string;
            scope: string;
            callback: (r: { access_token: string }) => void;
          }) => { requestAccessToken: () => void };
        };
      };
    };
  }
}

function toCalDate(iso: string) {
  return new Date(iso).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekDay = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
  return `${month}/${day} (${weekDay})`;
}

function formatTime(dt: string) {
  return dt.slice(11, 16);
}

export default function SyllabusPage() {
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [scriptReady, setScriptReady] = useState(false);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [addedCount, setAddedCount] = useState(0);
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());
  const [addingId, setAddingId] = useState<number | null>(null);

  useEffect(() => {
    if (document.querySelector('script[src*="accounts.google.com/gsi"]')) {
      setScriptReady(true); return;
    }
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
          const info = await fetch('https://www.googleapis.com/oauth2/v1/userinfo', {
            headers: { Authorization: `Bearer ${res.access_token}` },
          }).then(r => r.json());
          setEmail(info.email || 'Google 계정');
        } catch { setEmail('Google 계정'); }
      },
    }).requestAccessToken();
  }

  async function addEventToCalendar(ev: CalEvent, idx: number) {
    if (!token) return;
    setAddingId(idx);
    try {
      await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: ev.title,
          description: ev.description || '',
          start: { dateTime: ev.startDateTime, timeZone: 'Asia/Seoul' },
          end: { dateTime: ev.endDateTime, timeZone: 'Asia/Seoul' },
        }),
      });
      setAddedIds(prev => new Set([...prev, idx]));
    } catch { /* ignore */ }
    setAddingId(null);
  }

  async function addAllToCalendar() {
    if (!token || events.length === 0) return;
    setAdding(true);
    setAddedCount(0);
    let count = 0;
    const newAdded = new Set(addedIds);
    for (let i = 0; i < events.length; i++) {
      if (newAdded.has(i)) { count++; continue; }
      try {
        await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            summary: events[i].title,
            description: events[i].description || '',
            start: { dateTime: events[i].startDateTime, timeZone: 'Asia/Seoul' },
            end: { dateTime: events[i].endDateTime, timeZone: 'Asia/Seoul' },
          }),
        });
        newAdded.add(i);
        count++;
        setAddedCount(count);
      } catch { /* continue */ }
    }
    setAddedIds(newAdded);
    setAdded(true);
    setAdding(false);
  }

  function handleSuccess(raw: string) {
    try {
      const data = JSON.parse(raw);
      setEvents(data.events || []);
      setAdded(false);
      setAddedCount(0);
      setAddedIds(new Set());
    } catch { setEvents([]); }
  }

  const allAdded = events.length > 0 && addedIds.size === events.length;

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      <div style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '52px 20px 20px' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#64748B', textDecoration: 'none', fontSize: '13px', marginBottom: '16px' }}>
          <ArrowLeft size={14} /> 홈
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', background: '#F0FDF4', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CalendarDays size={20} color="#16A34A" strokeWidth={1.8} />
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>학기 일정 관리</div>
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '1px' }}>강의계획서 PDF → Google Calendar</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Google Login */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '16px', border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A', marginBottom: '10px' }}>Google 캘린더 계정</div>
          {token ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} color="#16A34A" />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: '#0F172A' }}>{email}</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>연결됨</div>
                </div>
              </div>
              <button onClick={() => { setToken(''); setEmail(''); setAdded(false); }} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '6px', fontSize: '12px', border: '1px solid #E2E8F0', background: 'white', color: '#64748B', cursor: 'pointer' }}>
                <LogOut size={12} /> 로그아웃
              </button>
            </div>
          ) : (
            <button onClick={handleGoogleLogin} disabled={!scriptReady} style={{ width: '100%', padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, border: '1px solid #E2E8F0', background: 'white', color: '#0F172A', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              <LogIn size={14} /> Google로 로그인
            </button>
          )}
        </div>

        <PdfUploader webhookPath="syllabus" onSuccess={handleSuccess} />

        {/* Add All Button */}
        {events.length > 0 && token && !allAdded && (
          <button
            onClick={addAllToCalendar}
            disabled={adding}
            style={{
              width: '100%', padding: '14px', borderRadius: '10px',
              background: adding ? '#E2E8F0' : '#16A34A',
              color: adding ? '#94A3B8' : 'white',
              fontWeight: 600, fontSize: '14px', border: 'none', cursor: adding ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            {adding
              ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> 추가 중... ({addedCount}/{events.length})</>
              : <><CalendarDays size={16} /> {events.length}개 일정 전체 캘린더에 추가</>}
          </button>
        )}

        {events.length > 0 && !token && (
          <div style={{ padding: '12px 16px', background: '#FFFBEB', borderRadius: '10px', border: '1px solid #FDE68A', fontSize: '13px', color: '#92400E', textAlign: 'center' }}>
            Google 로그인 후 캘린더에 추가할 수 있어요
          </div>
        )}

        {allAdded && events.length > 0 && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '16px', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CheckCircle2 size={24} color="#16A34A" />
            <div>
              <div style={{ fontWeight: 600, color: '#15803D', fontSize: '14px' }}>캘린더 등록 완료!</div>
              <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>{events.length}개 일정이 {email} 캘린더에 추가됐어요</div>
            </div>
          </div>
        )}

        {/* Event Preview List */}
        {events.length > 0 && (
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A' }}>일정 미리보기</div>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>{events.length}개</div>
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {events.map((ev, i) => {
                const isDone = addedIds.has(i);
                const isAdding = addingId === i;
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 16px',
                    borderBottom: i < events.length - 1 ? '1px solid #F8FAFC' : 'none',
                    background: isDone ? '#F0FDF4' : 'white',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: isDone ? '#15803D' : '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ev.title}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                        {formatDate(ev.date)} · {formatTime(ev.startDateTime)}~{formatTime(ev.endDateTime)}
                      </div>
                    </div>
                    {token && (
                      isDone ? (
                        <CheckCircle2 size={18} color="#16A34A" />
                      ) : (
                        <button
                          onClick={() => addEventToCalendar(ev, i)}
                          disabled={isAdding}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '4px',
                            padding: '5px 10px', borderRadius: '6px', fontSize: '12px',
                            border: '1px solid #BBF7D0', background: '#F0FDF4',
                            color: '#16A34A', cursor: isAdding ? 'default' : 'pointer',
                            flexShrink: 0,
                          }}
                        >
                          {isAdding ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={12} />}
                          추가
                        </button>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
