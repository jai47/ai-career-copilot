import { useEffect, useState } from 'react';
import { Copy, ExternalLink, RefreshCw, Send, Trash2, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAsync } from '../hooks/useAsync';
import {
  createNetworkContact,
  deleteNetworkContact,
  draftNetworkContact,
  listNetworkContacts,
  markNetworkContactSent,
  updateNetworkContact,
} from '../api/networks';
import { ApiError } from '../api/client';
import type { NetworkContactResponse, NetworkMessageTemplate, NetworkRoleTag } from '../types';
import { EmptyState, ErrorState, LoadingState } from './ui/AsyncStates';
import FindNetworkPanel from './FindNetworkPanel';

const ROLE_OPTIONS: { value: NetworkRoleTag; label: string }[] = [
  { value: 'recruiter', label: 'Recruiter' },
  { value: 'hiring_manager', label: 'Hiring manager' },
  { value: 'employee', label: 'Employee' },
  { value: 'agency', label: 'Agency' },
  { value: 'other', label: 'Other' },
];

const TEMPLATE_OPTIONS: { value: NetworkMessageTemplate; label: string }[] = [
  { value: 'referral', label: 'Referral ask' },
  { value: 'cold', label: 'Cold intro' },
  { value: 'follow_up', label: 'Follow-up' },
];

interface NetworkOutreachPanelProps {
  applicationId: string;
  company: string;
  title: string;
}

export default function NetworkOutreachPanel({
  applicationId,
  company,
  title,
}: NetworkOutreachPanelProps) {
  const { token } = useAuth();
  const [personName, setPersonName] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [roleTag, setRoleTag] = useState<NetworkRoleTag>('recruiter');
  const [template, setTemplate] = useState<NetworkMessageTemplate>('referral');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draftEdits, setDraftEdits] = useState<Record<string, string>>({});

  const contacts = useAsync(
    (signal) => {
      if (!token) return Promise.reject(new Error('Not authenticated'));
      return listNetworkContacts(token, { application_id: applicationId }, signal).then(
        (r) => r.contacts,
      );
    },
    [token, applicationId],
    Boolean(token),
  );

  useEffect(() => {
    const next: Record<string, string> = {};
    for (const c of contacts.data ?? []) {
      next[c.id] = c.message_draft ?? '';
    }
    setDraftEdits(next);
  }, [contacts.data]);

  const handleCreate = async (generate: boolean) => {
    if (!token) return;
    setCreating(true);
    setError(null);
    setMessage(null);
    try {
      await createNetworkContact(token, {
        person_name: personName.trim(),
        linkedin_url: linkedinUrl.trim(),
        role_tag: roleTag,
        message_template: template,
        application_id: applicationId,
        company,
        generate_draft: generate,
      });
      setPersonName('');
      setLinkedinUrl('');
      setMessage(generate ? 'Contact added and draft generated.' : 'Contact added.');
      await contacts.refetch();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not add contact');
    } finally {
      setCreating(false);
    }
  };

  const withBusy = async (id: string, fn: () => Promise<void>) => {
    setBusyId(id);
    setError(null);
    setMessage(null);
    try {
      await fn();
      await contacts.refetch();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Action failed');
    } finally {
      setBusyId(null);
    }
  };

  const copyDraft = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setMessage('Connection note copied. Paste it into LinkedIn.');
    } catch {
      setError('Clipboard permission denied — select and copy the note manually.');
    }
  };

  if (contacts.loading && !contacts.data) return <LoadingState />;
  if (contacts.error) return <ErrorState message={contacts.error} onRetry={contacts.refetch} />;

  return (
    <div className="border border-line rounded-xl p-4 space-y-4 bg-canvas/60">
      <div className="flex items-start gap-2">
        <Users className="w-4 h-4 text-accent mt-0.5 shrink-0" />
        <div>
          <h4 className="text-xs font-mono uppercase tracking-wider text-accent">
            LinkedIn outreach
          </h4>
          <p className="text-[10px] text-slate-400 mt-1">
            We draft and track. You send the connection request on LinkedIn yourself — safest for a
            multi-user SaaS (no LinkedIn login stored on our servers). Target: {title} @ {company}.
          </p>
        </div>
      </div>

      <FindNetworkPanel
        defaultCompany={company}
        defaultJobTitle={title}
        applicationId={applicationId}
      />

      {message && (
        <p className="text-[10px] text-emerald-700/90 bg-emerald-50 border border-emerald-500/30 px-3 py-2 rounded-xl">
          {message}
        </p>
      )}
      {error && (
        <p className="text-[10px] text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-xl">
          {error}
        </p>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[14px] font-medium text-slate-400 block mb-1">
            Person name
          </label>
          <input
            value={personName}
            onChange={(e) => setPersonName(e.target.value)}
            className="w-full bg-surface border border-line rounded-xl px-2 py-2 text-xs"
            placeholder="Alex Chen"
          />
        </div>
        <div>
          <label className="text-[14px] font-medium text-slate-400 block mb-1">
            LinkedIn profile URL
          </label>
          <input
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            className="w-full bg-surface border border-line rounded-xl px-2 py-2 text-xs"
            placeholder="https://linkedin.com/in/…"
          />
        </div>
        <div>
          <label className="text-[14px] font-medium text-slate-400 block mb-1">
            Role
          </label>
          <select
            value={roleTag}
            onChange={(e) => setRoleTag(e.target.value as NetworkRoleTag)}
            className="w-full bg-surface border border-line rounded-xl px-2 py-2 text-xs"
          >
            {ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[14px] font-medium text-slate-400 block mb-1">
            Note style
          </label>
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value as NetworkMessageTemplate)}
            className="w-full bg-surface border border-line rounded-xl px-2 py-2 text-xs"
          >
            {TEMPLATE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={creating || !personName.trim() || !linkedinUrl.trim()}
          onClick={() => void handleCreate(false)}
          className="px-3 py-2 border border-line text-[14px] font-medium rounded-xl cursor-pointer disabled:opacity-50 hover:border-accent/50"
        >
          {creating ? 'Adding…' : 'Add contact'}
        </button>
        <button
          type="button"
          disabled={creating || !personName.trim() || !linkedinUrl.trim()}
          onClick={() => void handleCreate(true)}
          className="px-3 py-2 bg-accent hover:bg-accent-hover text-white text-[14px] font-medium rounded-full px-5 py-2.5 cursor-pointer disabled:opacity-50"
        >
          Add + generate note
        </button>
      </div>

      {!contacts.data?.length ? (
        <EmptyState message="No outreach contacts for this application yet." />
      ) : (
        <div className="space-y-3">
          {contacts.data.map((contact) => (
            <ContactRow
              key={contact.id}
              contact={contact}
              draft={draftEdits[contact.id] ?? ''}
              busy={busyId === contact.id}
              onDraftChange={(value) =>
                setDraftEdits((prev) => ({ ...prev, [contact.id]: value }))
              }
              onGenerate={() =>
                void withBusy(contact.id, async () => {
                  if (!token) return;
                  await draftNetworkContact(token, contact.id);
                  setMessage('Draft ready — review, copy, then open LinkedIn.');
                })
              }
              onSaveDraft={() =>
                void withBusy(contact.id, async () => {
                  if (!token) return;
                  await updateNetworkContact(token, contact.id, {
                    message_draft: draftEdits[contact.id] ?? '',
                  });
                  setMessage('Draft saved.');
                })
              }
              onCopy={() => void copyDraft(draftEdits[contact.id] || contact.message_draft || '')}
              onOpen={() => window.open(contact.linkedin_url, '_blank', 'noopener,noreferrer')}
              onMarkSent={() =>
                void withBusy(contact.id, async () => {
                  if (!token) return;
                  await markNetworkContactSent(token, contact.id);
                  setMessage('Marked sent. Follow-up reminder in 7 days.');
                })
              }
              onStatus={(status) =>
                void withBusy(contact.id, async () => {
                  if (!token) return;
                  await updateNetworkContact(token, contact.id, {
                    status: status as import('../types').NetworkContactStatus,
                  });
                })
              }
              onDelete={() =>
                void withBusy(contact.id, async () => {
                  if (!token) return;
                  if (!window.confirm(`Remove ${contact.person_name}?`)) return;
                  await deleteNetworkContact(token, contact.id);
                })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ContactRow({
  contact,
  draft,
  busy,
  onDraftChange,
  onGenerate,
  onSaveDraft,
  onCopy,
  onOpen,
  onMarkSent,
  onStatus,
  onDelete,
}: {
  contact: NetworkContactResponse;
  draft: string;
  busy: boolean;
  onDraftChange: (value: string) => void;
  onGenerate: () => void;
  onSaveDraft: () => void;
  onCopy: () => void;
  onOpen: () => void;
  onMarkSent: () => void;
  onStatus: (status: NetworkContactResponse['status']) => void;
  onDelete: () => void;
}) {
  const charCount = draft.length;

  return (
    <div className="border border-line rounded-xl p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-ink">{contact.person_name}</p>
          <p className="text-[10px] text-accent font-mono uppercase">
            {contact.role_tag.replace(/_/g, ' ')} · {contact.status}
            {contact.is_follow_up_overdue ? ' · follow-up overdue' : ''}
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={onDelete}
          className="text-slate-400 hover:text-red-600 cursor-pointer disabled:opacity-50"
          aria-label="Delete contact"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <textarea
        value={draft}
        onChange={(e) => onDraftChange(e.target.value.slice(0, 300))}
        rows={3}
        maxLength={300}
        placeholder="Generate a connection note (max 300 characters)…"
        className="w-full bg-surface border border-line rounded-xl px-2 py-2 text-xs resize-y"
      />
      <p className="text-[9px] font-mono text-slate-400 text-right">{charCount}/300</p>

      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          disabled={busy}
          onClick={onGenerate}
          className="inline-flex items-center gap-1 px-2 py-1.5 border border-line text-[13px] font-medium rounded-xl cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className="w-3 h-3" /> Generate
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onSaveDraft}
          className="px-2 py-1.5 border border-line text-[13px] font-medium rounded-xl cursor-pointer disabled:opacity-50"
        >
          Save
        </button>
        <button
          type="button"
          disabled={busy || !draft.trim()}
          onClick={onCopy}
          className="inline-flex items-center gap-1 px-2 py-1.5 border border-line text-[13px] font-medium rounded-xl cursor-pointer disabled:opacity-50"
        >
          <Copy className="w-3 h-3" /> Copy
        </button>
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex items-center gap-1 px-2 py-1.5 bg-accent text-white text-[13px] font-medium rounded-full cursor-pointer"
        >
          <ExternalLink className="w-3 h-3" /> Open LinkedIn
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onMarkSent}
          className="inline-flex items-center gap-1 px-2 py-1.5 border border-emerald-200 text-emerald-700 text-[13px] font-medium rounded-xl cursor-pointer disabled:opacity-50"
        >
          <Send className="w-3 h-3" /> Mark sent
        </button>
        <select
          value={contact.status}
          disabled={busy}
          onChange={(e) => onStatus(e.target.value as NetworkContactResponse['status'])}
          className="ml-auto bg-surface border border-line rounded-xl px-2 py-1 text-[13px] font-medium"
        >
          {['drafted', 'ready', 'sent', 'accepted', 'replied', 'closed'].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
