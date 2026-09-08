import { useState } from 'react';
import { Upload } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../context/ProfileContext';
import { uploadResumeFile, uploadResumeText } from '../../api/users';
import { ApiError } from '../../api/client';
import type { ResumeUploadResponse } from '../../types';

export default function ResumeUploadTab() {
  const { token } = useAuth();
  const { profile, refetchProfile } = useProfile();
  const [pasteText, setPasteText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ResumeUploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    setUploading(true);
    setError(null);
    setResult(null);
    try {
      const res = await uploadResumeFile(token, file);
      setResult(res);
      await refetchProfile();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handlePaste = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !pasteText.trim()) return;
    setUploading(true);
    setError(null);
    setResult(null);
    try {
      const res = await uploadResumeText(token, { text: pasteText.trim() });
      setResult(res);
      setPasteText('');
      await refetchProfile();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      {profile?.has_active_resume && (
        <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl">
          Active master resume on file.
        </div>
      )}

      {error && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-xl">
          {error}
        </div>
      )}

      <div className="sophisticated-card p-6 rounded-xl">
        <p className="text-[14px] font-medium text-accent mb-3">Upload file (PDF or DOCX)</p>
        <label className="inline-flex items-center gap-2 px-4 py-2 border border-dashed border-line rounded-xl cursor-pointer hover:border-accent/50 text-xs">
          <Upload className="w-4 h-4 text-accent" />
          {uploading ? 'Uploading…' : 'Choose file'}
          <input
            type="file"
            accept=".pdf,.docx"
            className="hidden"
            disabled={uploading}
            onChange={(e) => void handleFile(e)}
          />
        </label>
      </div>

      <form onSubmit={handlePaste} className="sophisticated-card p-6 rounded-xl space-y-3">
        <p className="text-[14px] font-medium text-accent">Or paste resume text</p>
        <textarea
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          rows={10}
          placeholder="Paste your resume content here…"
          className="w-full bg-canvas border border-line rounded-xl px-3 py-2 text-xs resize-y"
        />
        <button
          type="submit"
          disabled={uploading || !pasteText.trim()}
          className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-[14px] font-medium rounded-full px-5 py-2.5 cursor-pointer disabled:opacity-50"
        >
          {uploading ? 'Processing…' : 'Upload text'}
        </button>
      </form>

      {result && (
        <div className="sophisticated-card p-6 rounded-xl space-y-3 text-xs">
          <p className="text-[14px] font-medium text-accent">Parse results</p>
          <p>
            <span className="text-slate-400">File:</span> {result.filename}
          </p>
          {result.experience_years != null && (
            <p>
              <span className="text-slate-400">Experience:</span> {result.experience_years} years
            </p>
          )}
          {result.skills.length > 0 && (
            <div>
              <p className="text-slate-400 mb-1">Skills</p>
              <div className="flex flex-wrap gap-1">
                {result.skills.map((s) => (
                  <span key={s} className="px-2 py-0.5 bg-soft border border-line rounded-xl">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
          {result.previous_titles.length > 0 && (
            <p>
              <span className="text-slate-400">Titles:</span> {result.previous_titles.join(', ')}
            </p>
          )}
          {result.education.length > 0 && (
            <p>
              <span className="text-slate-400">Education:</span> {result.education.join(', ')}
            </p>
          )}
          {result.languages.length > 0 && (
            <p>
              <span className="text-slate-400">Languages:</span> {result.languages.join(', ')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
