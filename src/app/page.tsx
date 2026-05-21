import Link from 'next/link';
import { GraduationCap, CalendarDays, Bell, ChevronRight } from 'lucide-react';

const features = [
  {
    href: '/graduation',
    Icon: GraduationCap,
    title: '졸업요건 분석',
    desc: '이수표를 업로드하면 AI가 잔여 학점을 분석해줘요',
    iconBg: '#EFF6FF',
    iconColor: '#1E40AF',
  },
  {
    href: '/syllabus',
    Icon: CalendarDays,
    title: '학기 일정 관리',
    desc: '강의계획서를 업로드하면 구글 캘린더에 자동 등록해줘요',
    iconBg: '#F0FDF4',
    iconColor: '#16A34A',
  },
  {
    href: '/notice',
    Icon: Bell,
    title: '맞춤형 지원 발굴',
    desc: '학과와 관심 분야를 선택하면 맞춤 공지를 모아줘요',
    iconBg: '#FFF7ED',
    iconColor: '#D97706',
  },
];

export default function Home() {
  return (
    <div>
      {/* Header */}
      <div style={{ padding: '52px 20px 24px', borderBottom: '1px solid #E2E8F0', background: 'white' }}>
        <div style={{ fontSize: '12px', color: '#64748B', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '6px' }}>
          숙명여자대학교
        </div>
        <div style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.5px' }}>
          스노러닝
        </div>
        <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
          AI 기반 학생 지원 서비스
        </div>
      </div>

      {/* Feature list */}
      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px', paddingLeft: '4px' }}>
          서비스
        </div>
        {features.map(({ href, Icon, title, desc, iconBg, iconColor }) => (
          <Link key={href} href={href} style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'white', borderRadius: '12px', padding: '16px',
              display: 'flex', alignItems: 'center', gap: '14px',
              border: '1px solid #E2E8F0',
            }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '10px',
                background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon size={22} color={iconColor} strokeWidth={1.8} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>{title}</div>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px', lineHeight: 1.4 }}>{desc}</div>
              </div>
              <ChevronRight size={16} color="#CBD5E1" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
