import { useState } from 'react';
import ProfileTab from './settings/ProfileTab';
import ResumeUploadTab from './settings/ResumeUploadTab';
import BlacklistsTab from './settings/BlacklistsTab';
import LLMStatusTab from './settings/LLMStatusTab';
import SkillGapTab from './settings/SkillGapTab';
import CoverLetterAnglesTab from './settings/CoverLetterAnglesTab';
import UsageTab from './settings/UsageTab';
import PageHeader from './ui/PageHeader';

const TABS = [
  { id: 'profile', label: 'Preferences' },
  { id: 'resume', label: 'Resume' },
  { id: 'coverletter', label: 'Cover letter' },
  { id: 'blacklists', label: 'Blacklists' },
  { id: 'usage', label: 'Usage' },
  { id: 'llm', label: 'API keys' },
  { id: 'skillgap', label: 'Skill gap' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function Settings() {
  const [activeTab, setActiveTab] = useState<TabId>('resume');

  return (
    <div className="space-y-8">
      <PageHeader title="Settings." subtitle="Preferences, usage, keys, and profile details." />

      <div data-coach-id="settings-tabs" className="flex flex-wrap gap-2 pb-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-[14px] font-medium rounded-full cursor-pointer transition-colors ${
              activeTab === tab.id
                ? 'bg-ink text-white'
                : 'text-muted hover:text-ink bg-surface border border-line'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        data-coach-id="settings-panel"
        className="bg-surface border border-line rounded-[18px] p-6 md:p-8"
      >
        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'resume' && <ResumeUploadTab />}
        {activeTab === 'coverletter' && <CoverLetterAnglesTab />}
        {activeTab === 'blacklists' && <BlacklistsTab />}
        {activeTab === 'usage' && <UsageTab />}
        {activeTab === 'llm' && <LLMStatusTab />}
        {activeTab === 'skillgap' && <SkillGapTab />}
      </div>
    </div>
  );
}
