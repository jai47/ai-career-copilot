import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAsync } from '../hooks/useAsync';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import {
  adminGetRates,
  adminGetUser,
  adminGrantTokens,
  adminListUsers,
  adminLlmPlatformStatus,
  adminPatchRates,
  adminSetAdmin,
  type AdminUserDetail,
} from '../api/billing';
import PageHeader from './ui/PageHeader';
import { LoadingState, ErrorState } from './ui/AsyncStates';
import type { AdminUserRow, BillingRates, LLMStatusResponse } from '../types';

export default function AdminPanel() {
  const { token } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const [ratesDraft, setRatesDraft] = useState<Partial<BillingRates> | null>(null);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [grantAmount, setGrantAmount] = useState('1000');
  const [grantNote, setGrantNote] = useState('');
  const [confirmAdmin, setConfirmAdmin] = useState<{
    makeAdmin: boolean;
    email: string;
  } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const rates = useAsync(
    (signal) => {
      if (!token) return Promise.reject(new Error('Not authenticated'));
      return adminGetRates(token, signal);
    },
    [token],
    Boolean(token && profile?.is_admin),
  );

  const users = useAsync(
    (signal) => {
      if (!token) return Promise.reject(new Error('Not authenticated'));
      return adminListUsers(token, signal).then((r) => r.users);
    },
    [token],
    Boolean(token && profile?.is_admin),
  );

  const platform = useAsync(
    (signal) => {
      if (!token) return Promise.reject(new Error('Not authenticated'));
      return adminLlmPlatformStatus(token, signal) as Promise<LLMStatusResponse>;
    },
    [token],
    Boolean(token && profile?.is_admin),
  );

  const filteredUsers = useMemo(() => {
    const list = users.data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        u.name.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q),
    );
  }, [users.data, search]);

  useEffect(() => {
    if (!token || !selectedId) {
      setDetail(null);
      setDetailError(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    setDetailError(null);
    adminGetUser(token, selectedId)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setDetail(null);
          setDetailError(err instanceof Error ? err.message : 'Failed to load user');
        }
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, selectedId]);

  if (profileLoading) return <LoadingState message="Loading…" />;
  if (!profile?.is_admin) return <Navigate to="/settings" replace />;

  const currentRates = ratesDraft ?? rates.data;
  const isSelf = detail ? profile?.id === detail.id : false;

  const closeModal = () => {
    setSelectedId(null);
    setDetail(null);
    setConfirmAdmin(null);
    setGrantAmount('1000');
    setGrantNote('');
    setDetailError(null);
  };

  const saveRates = async () => {
    if (!token || !currentRates) return;
    setBusy(true);
    setMessage(null);
    try {
      await adminPatchRates(token, currentRates);
      setRatesDraft(null);
      rates.refetch();
      setMessage('Rates saved');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to save rates');
    } finally {
      setBusy(false);
    }
  };

  const refreshDetail = async (userId: string) => {
    if (!token) return;
    const data = await adminGetUser(token, userId);
    setDetail(data);
    users.refetch();
  };

  const grant = async () => {
    if (!token || !detail) return;
    const amount = Number(grantAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage('Enter a positive token amount');
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const result = await adminGrantTokens(token, detail.id, amount, grantNote || undefined);
      await refreshDetail(detail.id);
      setGrantNote('');
      setMessage(`Granted ${result.granted} tokens to ${detail.email}`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Grant failed');
    } finally {
      setBusy(false);
    }
  };

  const applyAdminChange = async () => {
    if (!token || !detail || !confirmAdmin) return;
    setBusy(true);
    setMessage(null);
    try {
      const result = await adminSetAdmin(token, detail.id, confirmAdmin.makeAdmin);
      await refreshDetail(detail.id);
      setConfirmAdmin(null);
      setMessage(
        confirmAdmin.makeAdmin
          ? `${result.email} is now an admin`
          : `Removed admin access for ${result.email}`,
      );
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to update admin status');
    } finally {
      setBusy(false);
    }
  };

  const openUser = (u: AdminUserRow) => {
    setMessage(null);
    setSelectedId(u.id);
  };

  return (
    <div className="space-y-8">
      <PageHeader title="Admin." subtitle="Token rates, users, and platform LLM keys." />

      {message && <p className="text-sm text-muted">{message}</p>}

      <section className="bg-surface border border-line rounded-[18px] p-6 space-y-4 max-w-xl">
        <h2 className="text-sm font-medium text-ink">Billing rates</h2>
        {rates.loading && <LoadingState message="Loading rates…" />}
        {rates.error && <ErrorState message={rates.error} onRetry={rates.refetch} />}
        {currentRates && (
          <div className="grid gap-3 text-sm">
            {(
              [
                ['pipeline_run_tokens', 'Pipeline run tokens'],
                ['llm_call_tokens', 'LLM call tokens'],
                ['signup_grant_tokens', 'Signup grant tokens'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="block">
                <span className="text-muted text-xs">{label}</span>
                <input
                  type="number"
                  min={0}
                  value={Number(currentRates[key])}
                  onChange={(e) =>
                    setRatesDraft({
                      ...(currentRates as BillingRates),
                      [key]: Number(e.target.value),
                    })
                  }
                  className="mt-1 w-full bg-surface border border-line rounded-xl px-3 py-2 font-mono"
                />
              </label>
            ))}
            <button
              type="button"
              disabled={busy}
              onClick={saveRates}
              className="mt-2 px-4 py-2 rounded-xl bg-ink text-white text-sm disabled:opacity-50"
            >
              Save rates
            </button>
          </div>
        )}
      </section>

      <section className="bg-surface border border-line rounded-[18px] p-6 space-y-4 max-w-2xl">
        <h2 className="text-sm font-medium text-ink">Users</h2>
        <p className="text-[13px] text-muted">
          Search by name or email, then open a user to manage tokens, admin access, and BYOK status.
        </p>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users…"
          className="w-full bg-surface border border-line rounded-xl px-3 py-2 text-sm"
        />
        {users.loading && <LoadingState message="Loading users…" />}
        {users.error && <ErrorState message={users.error} onRetry={users.refetch} />}
        {users.data && (
          <div className="grid gap-2 max-h-[28rem] overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <p className="text-sm text-muted py-2">No users match “{search.trim()}”.</p>
            ) : (
              filteredUsers.map((u) => {
                const self = profile?.id === u.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => openUser(u)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border border-line rounded-xl px-3 py-2.5 text-left hover:bg-soft/50 transition-colors cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-ink truncate">
                        {u.name}{' '}
                        <span className="text-muted font-mono text-xs">({u.email})</span>
                      </p>
                      <p className="text-[11px] text-muted font-mono">
                        {u.token_balance} tokens
                        {u.is_admin ? ' · admin' : ''}
                        {self ? ' · you' : ''}
                      </p>
                    </div>
                    <span className="text-xs text-accent shrink-0">Open</span>
                  </button>
                );
              })
            )}
          </div>
        )}
      </section>

      <section className="bg-surface border border-line rounded-[18px] p-6 space-y-3 max-w-2xl">
        <h2 className="text-sm font-medium text-ink">Platform LLM (.env)</h2>
        <p className="text-[13px] text-muted">
          Server-configured providers. Regular users do not see this — they manage BYOK in Settings.
        </p>
        {platform.loading && <LoadingState message="Loading platform status…" />}
        {platform.error && <ErrorState message={platform.error} onRetry={platform.refetch} />}
        {platform.data && (
          <div className="grid gap-2">
            {platform.data.providers
              .filter((p) => p.id !== 'auto')
              .map((row) => (
                <div
                  key={row.id}
                  className="flex items-center justify-between gap-3 border border-line rounded-xl px-3 py-2"
                >
                  <div>
                    <p className="text-sm text-ink">{row.label}</p>
                    {row.env_keys.length > 0 && (
                      <p className="text-[10px] font-mono text-muted">{row.env_keys.join(', ')}</p>
                    )}
                  </div>
                  <span
                    className={`text-[12px] px-2 py-1 rounded-lg ${
                      row.configured
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-soft text-muted border border-line'
                    }`}
                  >
                    {row.configured ? 'Configured' : 'Not set'}
                  </span>
                </div>
              ))}
          </div>
        )}
      </section>

      {selectedId && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/40"
          role="dialog"
          aria-modal="true"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-surface border border-line shadow-xl p-5 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-medium text-ink">User details</h3>
                <p className="text-[12px] text-muted mt-0.5">API keys are never shown in full.</p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="text-sm text-muted hover:text-ink"
              >
                Close
              </button>
            </div>

            {detailLoading && <LoadingState message="Loading user…" />}
            {detailError && <p className="text-sm text-red-600">{detailError}</p>}

            {detail && !detailLoading && (
              <>
                <div className="space-y-1">
                  <p className="text-sm text-ink font-medium">{detail.name}</p>
                  <p className="text-xs font-mono text-muted">{detail.email}</p>
                  <p className="text-xs text-muted">
                    Preferred provider:{' '}
                    <span className="font-mono text-ink">
                      {detail.preferred_llm_provider || 'auto'}
                    </span>
                    {detail.is_admin ? ' · admin' : ''}
                    {isSelf ? ' · you' : ''}
                  </p>
                </div>

                <div className="rounded-xl border border-line bg-soft/30 px-3 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted">Remaining tokens</p>
                  <p className="text-2xl font-mono text-ink mt-1">
                    {detail.token_balance.toLocaleString()}
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-ink">BYOK keys</h4>
                  <div className="grid gap-1.5">
                    {detail.byok_providers.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between gap-2 text-xs border border-line rounded-lg px-2.5 py-1.5"
                      >
                        <span className="text-ink">{p.label}</span>
                        <span className="font-mono text-muted">
                          {p.configured ? `Saved ···${p.key_hint ?? ''}` : 'Not set'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-ink">Add tokens</h4>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="number"
                      min={1}
                      value={grantAmount}
                      onChange={(e) => setGrantAmount(e.target.value)}
                      className="flex-1 border border-line rounded-xl px-3 py-2 font-mono text-sm"
                      placeholder="Amount"
                    />
                    <input
                      value={grantNote}
                      onChange={(e) => setGrantNote(e.target.value)}
                      className="flex-1 border border-line rounded-xl px-3 py-2 text-sm"
                      placeholder="Note (optional)"
                    />
                    <button
                      type="button"
                      disabled={busy}
                      onClick={grant}
                      className="px-4 py-2 rounded-xl bg-ink text-white text-sm disabled:opacity-50"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div className="space-y-2 pt-1 border-t border-line">
                  <h4 className="text-sm font-medium text-ink">Admin access</h4>
                  {detail.is_admin ? (
                    <button
                      type="button"
                      disabled={busy || isSelf}
                      onClick={() =>
                        setConfirmAdmin({ makeAdmin: false, email: detail.email })
                      }
                      className="px-3 py-2 text-sm rounded-xl border border-line text-muted hover:text-ink disabled:opacity-40"
                      title={isSelf ? 'You cannot remove your own admin access' : undefined}
                    >
                      Remove admin
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        setConfirmAdmin({ makeAdmin: true, email: detail.email })
                      }
                      className="px-3 py-2 text-sm rounded-xl bg-ink text-white disabled:opacity-50"
                    >
                      Make admin
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {confirmAdmin && detail && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/50"
          role="alertdialog"
          aria-modal="true"
          onClick={() => setConfirmAdmin(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-surface border border-line p-5 space-y-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-medium text-ink">
              {confirmAdmin.makeAdmin ? 'Confirm make admin' : 'Confirm remove admin'}
            </h3>
            <p className="text-sm text-muted">
              {confirmAdmin.makeAdmin ? (
                <>
                  Grant <span className="text-ink font-mono">{confirmAdmin.email}</span> full admin
                  access? They will be able to change rates, grant tokens, and manage other admins.
                </>
              ) : (
                <>
                  Remove admin access for{' '}
                  <span className="text-ink font-mono">{confirmAdmin.email}</span>?
                </>
              )}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmAdmin(null)}
                className="px-3 py-2 text-sm rounded-xl border border-line text-muted hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={applyAdminChange}
                className="px-3 py-2 text-sm rounded-xl bg-ink text-white disabled:opacity-50"
              >
                {confirmAdmin.makeAdmin ? 'Make admin' : 'Remove admin'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
