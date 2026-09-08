import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import HealthBanner from '../components/HealthBanner';
import FollowUpDrawer from '../components/FollowUpDrawer';

const TITLES: Record<string, string> = {
  '/today': 'Today',
  '/coach': 'Coach',
  '/digest': 'Daily Digest',
  '/opportunities': 'Opportunities',
  '/resumes': 'Resumes',
  '/tracker': 'Applications',
  '/networks': 'Network',
  '/linkedin': 'LinkedIn',
  '/analytics': 'Analytics',
  '/stories': 'Stories',
  '/status': 'Pipeline',
  '/settings': 'Settings',
};

export default function AppLayout() {
  const { pathname } = useLocation();
  const title = TITLES[pathname] ?? 'Copilot';
  const [followUpAppId, setFollowUpAppId] = useState<string | null>(null);

  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebarCollapsed') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('sidebarCollapsed', String(isCollapsed));
    } catch {
      // Ignore
    }
  }, [isCollapsed]);

  return (
    <div 
      className="flex min-h-screen text-ink bg-canvas"
      style={{ '--nav-width': isCollapsed ? '72px' : '240px' } as React.CSSProperties}
    >
      <Sidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />
      <div className="flex-1 min-h-screen ml-[var(--nav-width)] pt-[var(--topbar-height)] flex flex-col transition-all duration-300">
        <Header title={title} onFollowUp={(id) => setFollowUpAppId(id)} />
        <main className="flex-1 px-8 py-10 md:px-12 md:py-12 w-full max-w-[1080px] mx-auto">
          <HealthBanner />
          <Outlet />
        </main>
      </div>
      <FollowUpDrawer applicationId={followUpAppId} onClose={() => setFollowUpAppId(null)} />
    </div>
  );
}
