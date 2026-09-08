import { User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

interface HeaderProps {
  title: string;
  onFollowUp?: (applicationId: string) => void;
}

export default function Header({ title, onFollowUp }: HeaderProps) {
  const { userName } = useAuth();
  const first = userName?.split(' ')[0] ?? 'Account';

  return (
    <header className="fixed top-0 left-[var(--nav-width)] w-[calc(100%-var(--nav-width))] h-[var(--topbar-height)] bg-canvas/72 backdrop-blur-[20px] border-b border-line/70 flex items-center justify-between px-8 z-40 select-none transition-all duration-300">
      <p className="text-[13px] font-medium text-muted tracking-[-0.01em]">{title}</p>
      <div className="flex items-center gap-3">
        <NotificationBell onFollowUp={onFollowUp} />
        <div className="flex items-center gap-2.5 pl-3 border-l border-line">
          <span className="text-[13px] font-medium text-ink hidden sm:inline tracking-[-0.01em]">
            {first}
          </span>
          <div className="w-8 h-8 rounded-full bg-soft border border-line flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-muted" strokeWidth={1.75} />
          </div>
        </div>
      </div>
    </header>
  );
}
