import { ChatPanel } from './chat/ChatWidget';

export default function ChatCoach() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Coach.</h1>
        <p className="page-subtitle">
          Ask anything — or say “show me around” for a live glowing tour of the app.
        </p>
      </div>
      <ChatPanel className="h-[min(720px,70vh)] min-h-0 rounded-[22px] shadow-[0_8px_30px_rgba(0,0,0,0.06)]" />
    </div>
  );
}
