import { useMemo, useState } from 'react';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAsync } from '../hooks/useAsync';
import {
  createNetworkContact,
  deleteNetworkContact,
  listNetworkContacts,
  markNetworkContactSent,
  updateNetworkContact,
} from '../api/networks';
import { ApiError } from '../api/client';
import type { NetworkContactStatus, NetworkRoleTag } from '../types';
import { EmptyState, ErrorState, LoadingState } from './ui/AsyncStates';
import FindNetworkPanel from './FindNetworkPanel';
import NetworkingAgentPanel, { EnrollAgentButton } from './NetworkingAgentPanel';

const STATUS_FILTERS: Array<NetworkContactStatus | 'all'> = [
  'all',
  'drafted',
  'ready',
  'sent',
  'accepted',
  'replied',
  'closed',
];

export default function NetworkBoard() {
  const { token } = useAuth();
  const [statusFilter, setStatusFilter] = useState<NetworkContactStatus | 'all'>('all');
  const [companyFilter, setCompanyFilter] = useState('');
  const [personName, setPersonName] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [company, setCompany] = useState('');
  const [roleTag, setRoleTag] = useState<NetworkRoleTag>('recruiter');
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const contacts = useAsync(
    (signal) => {
      if (!token) return Promise.reject(new Error('Not authenticated'));
      return listNetworkContacts(
        token,
        {
          status: statusFilter === 'all' ? undefined : statusFilter,
          company: companyFilter.trim() || undefined,
        },
        signal,
      ).then((r) => r.contacts);
    },
    [token, statusFilter, companyFilter],
    Boolean(token),
  );

  const overdueCount = useMemo(
    () => (contacts.data ?? []).filter((c) => c.is_follow_up_overdue).length,
    [contacts.data],
  );

  const handleCreate = async () => {
    if (!token) return;
    setCreating(true);
    setError(null);
    try {
      await createNetworkContact(token, {
        person_name: personName.trim(),
        linkedin_url: linkedinUrl.trim(),
        company: company.trim() || 'Unknown',
        role_tag: roleTag,
        generate_draft: false,
      });
      setPersonName('');
      setLinkedinUrl('');
      setCompany('');
      await contacts.refetch();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create contact');
    } finally {
      setCreating(false);
    }
  };

  if (contacts.loading && !contacts.data) return <LoadingState />;
  if (contacts.error) return <ErrorState message={contacts.error} onRetry={contacts.refetch} />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-title">Network.</h1>
        <p className="page-subtitle">
          Track LinkedIn outreach. Drafts stay here — you always send on LinkedIn yourself.
        </p>
      </div>

      {overdueCount > 0 && (
        <div className="text-[14px] text-[#8a6d00] bg-[#fff9eb] border border-[#f0d78c] px-4 py-3 rounded-[12px] flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" strokeWidth={1.75} />
          {overdueCount} follow-up{overdueCount === 1 ? '' : 's'} overdue
        </div>
      )}

      {error && (
        <div className="text-[14px] text-[#b00020] bg-[#fff2f2] border border-[#f5c2c2] px-4 py-3 rounded-[12px]">
          {error}
        </div>
      )}

      <FindNetworkPanel />

      <NetworkingAgentPanel />

      <div data-coach-id="network-add" className="sophisticated-card p-6 space-y-4">
        <h3 className="text-[17px] font-semibold tracking-[-0.02em] text-ink">
          Add contact
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            value={personName}
            onChange={(e) => setPersonName(e.target.value)}
            placeholder="Name"
            className="bg-canvas border border-line rounded-xl px-2 py-2 text-xs"
          />
          <input
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            placeholder="LinkedIn URL"
            className="bg-canvas border border-line rounded-xl px-2 py-2 text-xs"
          />
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Company"
            className="bg-canvas border border-line rounded-xl px-2 py-2 text-xs"
          />
          <select
            value={roleTag}
            onChange={(e) => setRoleTag(e.target.value as NetworkRoleTag)}
            className="bg-canvas border border-line rounded-xl px-2 py-2 text-xs"
          >
            <option value="recruiter">Recruiter</option>
            <option value="hiring_manager">Hiring manager</option>
            <option value="employee">Employee</option>
            <option value="agency">Agency</option>
            <option value="other">Other</option>
          </select>
        </div>
        <button
          type="button"
          disabled={creating || !personName.trim() || !linkedinUrl.trim()}
          onClick={() => void handleCreate()}
          className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-[14px] font-medium rounded-full px-5 py-2.5 cursor-pointer disabled:opacity-50"
        >
          {creating ? 'Adding…' : 'Add'}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-[14px] font-medium rounded-xl border cursor-pointer ${
              statusFilter === s
                ? 'border-accent text-accent bg-soft'
                : 'border-line text-slate-500'
            }`}
          >
            {s}
          </button>
        ))}
        <input
          value={companyFilter}
          onChange={(e) => setCompanyFilter(e.target.value)}
          placeholder="Filter company…"
          className="ml-auto bg-canvas border border-line rounded-xl px-2 py-1.5 text-xs min-w-[160px]"
        />
      </div>

      {!contacts.data?.length ? (
        <EmptyState message="No network contacts yet. Add one here or from Application Tracker." />
      ) : (
        <div className="space-y-2">
          {contacts.data.map((c) => (
            <div
              key={c.id}
              className="border border-line rounded-xl p-3 flex flex-col sm:flex-row sm:items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-ink truncate">{c.person_name}</p>
                <p className="text-[10px] text-accent truncate">{c.company}</p>
                <p className="text-[14px] font-medium text-slate-400 mt-1">
                  {c.role_tag.replace(/_/g, ' ')} · {c.status}
                  {c.agent_enabled ? ` · agent:${c.agent_step || 'on'}` : ''}
                  {c.is_follow_up_overdue ? ' · overdue' : ''}
                  {c.follow_up_due ? ` · follow-up ${c.follow_up_due}` : ''}
                </p>
                {c.message_draft && (
                  <p className="text-[11px] text-slate-600 mt-2 line-clamp-2">{c.message_draft}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 shrink-0">
                {!c.agent_enabled && <EnrollAgentButton contactId={c.id} />}
                <button
                  type="button"
                  onClick={() => window.open(c.linkedin_url, '_blank', 'noopener,noreferrer')}
                  className="inline-flex items-center gap-1 px-2 py-1.5 bg-accent text-white text-[13px] font-medium rounded-full cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3" /> LinkedIn
                </button>
                {c.status !== 'sent' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!token) return;
                      void markNetworkContactSent(token, c.id)
                        .then(() => contacts.refetch())
                        .catch((err) =>
                          setError(err instanceof ApiError ? err.message : 'Update failed'),
                        );
                    }}
                    className="px-2 py-1.5 border border-emerald-200 text-emerald-700 text-[13px] font-medium rounded-xl cursor-pointer"
                  >
                    Mark sent
                  </button>
                )}
                <select
                  value={c.status}
                  onChange={(e) => {
                    if (!token) return;
                    void updateNetworkContact(token, c.id, {
                      status: e.target.value as NetworkContactStatus,
                    })
                      .then(() => contacts.refetch())
                      .catch((err) =>
                        setError(err instanceof ApiError ? err.message : 'Update failed'),
                      );
                  }}
                  className="bg-canvas border border-line rounded-xl px-2 py-1 text-[13px] font-medium"
                >
                  {STATUS_FILTERS.filter((s) => s !== 'all').map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    if (!token) return;
                    if (!window.confirm(`Remove ${c.person_name}?`)) return;
                    void deleteNetworkContact(token, c.id)
                      .then(() => contacts.refetch())
                      .catch((err) =>
                        setError(err instanceof ApiError ? err.message : 'Delete failed'),
                      );
                  }}
                  className="px-2 py-1.5 border border-red-200 text-red-600 text-[13px] font-medium rounded-xl cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
