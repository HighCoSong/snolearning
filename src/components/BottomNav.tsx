'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, GraduationCap, CalendarDays, Bell } from 'lucide-react';

const tabs = [
  { href: '/', label: '홈', Icon: Home },
  { href: '/graduation', label: '졸업요건', Icon: GraduationCap },
  { href: '/syllabus', label: '학기일정', Icon: CalendarDays },
  { href: '/notice', label: '공지알림', Icon: Bell },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: '430px', background: 'white',
      borderTop: '1px solid #E2E8F0', display: 'flex',
      paddingBottom: 'env(safe-area-inset-bottom)', zIndex: 50,
    }}>
      {tabs.map(({ href, label, Icon }) => {
        const active = pathname === href;
        return (
          <Link key={href} href={href} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '10px 0 8px', textDecoration: 'none', gap: '3px',
            color: active ? '#1E40AF' : '#94A3B8',
            fontSize: '11px', fontWeight: active ? 600 : 400,
          }}>
            <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
