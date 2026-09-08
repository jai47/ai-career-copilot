import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  BarChart3,
  BookOpen,
  ClipboardList,
  Layers,
  Settings,
  LogOut,
  Sparkles,
  Users,
  Linkedin,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';

const COACH_NAV: Record<string, string> = {
  '/today': 'nav-today',
  '/coach': 'nav-coach',
  '/opportunities': 'nav-jobs',
  '/tracker': 'nav-tracker',
  '/networks': 'nav-network',
  '/settings': 'nav-settings',
  '/analytics': 'nav-analytics',
};

const primary = [
  { to: '/today', label: 'Today', icon: Sparkles },
  { to: '/coach', label: 'Coach', icon: MessageCircle },
  { to: '/digest', label: 'Digest', icon: LayoutDashboard },
  { to: '/opportunities', label: 'Jobs', icon: Briefcase },
  { to: '/tracker', label: 'Tracker', icon: ClipboardList },
  { to: '/networks', label: 'Network', icon: Users },
];

const secondaryBase = [
  { to: '/resumes', label: 'Resumes', icon: FileText },
  { to: '/linkedin', label: 'LinkedIn', icon: Linkedin },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/stories', label: 'Stories', icon: BookOpen },
  { to: '/status', label: 'Pipeline', icon: Layers },
  { to: '/settings', label: 'Settings', icon: Settings },
];

function NavItem({
  to,
  label,
  icon: Icon,
  isCollapsed,
}: {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isCollapsed?: boolean;
}) {
  return (
    <NavLink
      to={to}
      {...(COACH_NAV[to] ? { 'data-coach-id': COACH_NAV[to] } : {})}
      className={({ isActive }) =>
        `group flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-3'} py-[9px] rounded-[10px] text-[14px] font-medium tracking-[-0.01em] transition-all duration-200 ${
          isActive
            ? 'bg-ink text-white'
            : 'text-muted hover:text-ink hover:bg-black/[0.04]'
        }`
      }
      title={isCollapsed ? label : undefined}
    >
      {({ isActive }) => (
        <>
          <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-white' : 'text-[#aeaeb2] group-hover:text-ink'}`} />
          {!isCollapsed && <span className="truncate">{label}</span>}
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar({ isCollapsed, onToggle }: { isCollapsed: boolean; onToggle: () => void }) {
  const { logout } = useAuth();
  const { profile } = useProfile();
  const secondary = profile?.is_admin
    ? [...secondaryBase, { to: '/admin', label: 'Admin', icon: Settings }]
    : secondaryBase;

  return (
    <aside className="fixed left-0 top-0 h-full w-[var(--nav-width)] bg-surface/80 backdrop-blur-[20px] border-r border-line/80 flex flex-col z-50 select-none transition-all duration-300">
      <div className={`h-[var(--topbar-height)] flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-5'} border-b border-line/80 relative`}>
        <NavLink to="/today" className="flex items-center gap-2.5 min-w-0" title={isCollapsed ? "Copilot" : undefined}>
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-white">
            <Sparkles className="w-3.5 h-3.5" strokeWidth={2} />
          </span>
          {!isCollapsed && (
            <span className="text-[17px] font-semibold tracking-[-0.03em] text-ink truncate">
              Copilot
            </span>
          )}
        </NavLink>
      </div>

      <nav className={`flex-1 overflow-y-auto ${isCollapsed ? 'px-2' : 'px-3'} py-4 space-y-6`}>
        <div className="space-y-0.5">
          {primary.map((item) => (
            <NavItem key={item.to} {...item} isCollapsed={isCollapsed} />
          ))}
        </div>
        <div>
          {!isCollapsed && (
            <p className="px-3 mb-1.5 text-[11px] font-medium uppercase tracking-[0.06em] text-[#aeaeb2]">
              More
            </p>
          )}
          {isCollapsed && <div className="h-4" />}
          <div className="space-y-0.5">
            {secondary.map((item) => (
              <NavItem key={item.to} {...item} isCollapsed={isCollapsed} />
            ))}
          </div>
        </div>
      </nav>

      <div className={`px-2 pb-5 pt-2 border-t border-line/80 flex ${isCollapsed ? 'flex-col items-center gap-2' : 'flex-row items-center gap-1'}`}>
        <button
          type="button"
          onClick={logout}
          className={`flex-1 flex items-center ${isCollapsed ? 'justify-center w-10 h-10 px-0' : 'gap-3 px-3 py-[9px]'} rounded-[10px] text-[14px] font-medium text-muted hover:text-ink hover:bg-black/[0.04] transition-colors text-left cursor-pointer`}
          title={isCollapsed ? 'Sign out' : undefined}
        >
          <LogOut className="w-[18px] h-[18px] text-[#aeaeb2] shrink-0" />
          {!isCollapsed && <span>Sign out</span>}
        </button>
        <button
          type="button"
          onClick={onToggle}
          className={`flex items-center justify-center ${isCollapsed ? 'w-10 h-10' : 'w-9 h-9'} rounded-[10px] text-muted hover:text-ink hover:bg-black/[0.04] transition-colors cursor-pointer shrink-0`}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-[18px] h-[18px]" /> : <ChevronLeft className="w-[18px] h-[18px]" />}
        </button>
      </div>
    </aside>
  );
}
