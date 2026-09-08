import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProfileProvider } from './context/ProfileContext';
import { CoachTourProvider } from './context/CoachTourContext';
import AuthGate from './components/AuthGate';
import AppLayout from './layouts/AppLayout';
import DailyDigest from './components/DailyDigest';
import Opportunities from './components/Opportunities';
import ResumeVersions from './components/ResumeVersions';
import ApplicationTracker from './components/ApplicationTracker';
import ApplicationAnalytics from './components/ApplicationAnalytics';
import NetworkBoard from './components/NetworkBoard';
import LinkedInCoach from './components/LinkedInCoach';
import TodayQueue from './components/TodayQueue';
import PipelineStatus from './components/PipelineStatus';
import Settings from './components/Settings';
import AdminPanel from './components/AdminPanel';
import StoryBank from './components/StoryBank';
import ChatCoach from './components/ChatCoach';
import ChatWidget from './components/chat/ChatWidget';
import CoachSpotlight from './components/chat/CoachSpotlight';

function ProtectedRoutes() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <AuthGate />;
  }
  return (
    <ProfileProvider>
      <CoachTourProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/today" replace />} />
            <Route path="today" element={<TodayQueue />} />
            <Route path="digest" element={<DailyDigest />} />
            <Route path="opportunities" element={<Opportunities />} />
            <Route path="resumes" element={<ResumeVersions />} />
            <Route path="tracker" element={<ApplicationTracker />} />
            <Route path="networks" element={<NetworkBoard />} />
            <Route path="linkedin" element={<LinkedInCoach />} />
            <Route path="analytics" element={<ApplicationAnalytics />} />
            <Route path="stories" element={<StoryBank />} />
            <Route path="coach" element={<ChatCoach />} />
            <Route path="status" element={<PipelineStatus />} />
            <Route path="settings" element={<Settings />} />
            <Route path="admin" element={<AdminPanel />} />
          </Route>
          <Route path="*" element={<Navigate to="/today" replace />} />
        </Routes>
        <ChatWidget />
        <CoachSpotlight />
      </CoachTourProvider>
    </ProfileProvider>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-canvas text-ink font-sans antialiased">
      <BrowserRouter>
        <AuthProvider>
          <ProtectedRoutes />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}
