import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { CoachTourStep } from '../types';

export type CoachPhase = 'idle' | 'thinking' | 'redirecting' | 'highlighting';

interface CoachTourState {
  phase: CoachPhase;
  steps: CoachTourStep[];
  index: number;
  active: boolean;
  current: CoachTourStep | null;
  setThinking: (v: boolean) => void;
  startTour: (steps: CoachTourStep[]) => void;
  next: () => void;
  prev: () => void;
  skip: () => void;
  flashRedirect: (path: string) => void;
}

const CoachTourContext = createContext<CoachTourState | null>(null);

export function useCoachTour() {
  const ctx = useContext(CoachTourContext);
  if (!ctx) throw new Error('useCoachTour must be used within CoachTourProvider');
  return ctx;
}

export function CoachTourProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [phase, setPhase] = useState<CoachPhase>('idle');
  const [steps, setSteps] = useState<CoachTourStep[]>([]);
  const [index, setIndex] = useState(0);
  const [pendingNav, setPendingNav] = useState(false);

  const current = steps[index] ?? null;
  const active = steps.length > 0 && index < steps.length;

  const goToStep = useCallback(
    async (step: CoachTourStep) => {
      if (location.pathname !== step.path) {
        setPhase('redirecting');
        setPendingNav(true);
        navigate(step.path);
        // wait for route paint
        await new Promise((r) => setTimeout(r, 450));
        setPendingNav(false);
      }
      setPhase('highlighting');
      // allow DOM to render target
      await new Promise((r) => setTimeout(r, 80));
      const el = document.querySelector(`[data-coach-id="${step.target}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      }
    },
    [location.pathname, navigate],
  );

  useEffect(() => {
    if (!active || !current || pendingNav) return;
    void goToStep(current);
  }, [active, current, goToStep, pendingNav, index]);

  const startTour = useCallback(
    (nextSteps: CoachTourStep[]) => {
      if (!nextSteps.length) return;
      setSteps(nextSteps);
      setIndex(0);
      setPhase('redirecting');
    },
    [],
  );

  const next = useCallback(() => {
    setIndex((i) => {
      if (i + 1 >= steps.length) {
        setSteps([]);
        setPhase('idle');
        return 0;
      }
      return i + 1;
    });
  }, [steps.length]);

  const prev = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  const skip = useCallback(() => {
    setSteps([]);
    setIndex(0);
    setPhase('idle');
  }, []);

  const setThinking = useCallback((v: boolean) => {
    setPhase((p) => {
      if (v) return 'thinking';
      return p === 'thinking' ? 'idle' : p;
    });
  }, []);

  const flashRedirect = useCallback(
    (path: string) => {
      setPhase('redirecting');
      navigate(path);
      window.setTimeout(() => setPhase((p) => (p === 'redirecting' ? 'idle' : p)), 700);
    },
    [navigate],
  );

  const value = useMemo(
    () => ({
      phase,
      steps,
      index,
      active,
      current,
      setThinking,
      startTour,
      next,
      prev,
      skip,
      flashRedirect,
    }),
    [phase, steps, index, active, current, setThinking, startTour, next, prev, skip, flashRedirect],
  );

  return <CoachTourContext.Provider value={value}>{children}</CoachTourContext.Provider>;
}
