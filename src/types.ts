/** TypeScript mirrors of backend Pydantic schemas (snake_case). */

// --- Auth / User ---

export interface AuthStatusResponse {
  has_users: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SetupRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user_id: string;
  name: string;
  email: string;
  is_admin?: boolean;
  token_balance?: number;
}

export interface UserProfileResponse {
  id: string;
  name: string;
  email: string;
  nationality: string | null;
  preferred_countries: string[];
  preferred_roles: string[];
  prefers_remote: boolean;
  salary_range_min: number | null;
  salary_range_max: number | null;
  salary_currency: string;
  years_experience: number | null;
  parsed_skills: string[];
  has_active_resume: boolean;
  score_warning_threshold: number;
  cover_letter_angles: Record<string, string>;
  notify_digest_email: boolean;
  notify_followup_email: boolean;
  is_admin?: boolean;
  token_balance?: number;
  preferred_llm_provider?: string | null;
}

export interface UserProfileUpdate {
  nationality?: string | null;
  preferred_countries?: string[] | null;
  preferred_roles?: string[] | null;
  prefers_remote?: boolean | null;
  salary_range_min?: number | null;
  salary_range_max?: number | null;
  salary_currency?: string | null;
  years_experience?: number | null;
  score_warning_threshold?: number | null;
  cover_letter_angles?: Record<string, string> | null;
  notify_digest_email?: boolean | null;
  notify_followup_email?: boolean | null;
}

export interface LLMProviderInfo {
  id: string;
  label: string;
  configured: boolean;
  model: string | null;
  env_keys: string[];
}

export interface LLMStatusResponse {
  selected_provider: string;
  providers: LLMProviderInfo[];
  anthropic_configured: boolean;
  openai_configured: boolean;
  opencode_configured: boolean;
  opencode_model: string | null;
  local_llm_configured: boolean;
  local_llm_model: string | null;
  groq_configured: boolean;
  groq_model: string | null;
  deepseek_configured: boolean;
  deepseek_model: string | null;
  google_configured: boolean;
  google_model: string | null;
  kimi_configured: boolean;
  kimi_model: string | null;
  azure_configured: boolean;
  azure_deployment: string | null;
  aws_configured: boolean;
  aws_model: string | null;
  resume_parser_mode: string;
}

export interface LLMProviderUpdate {
  provider: string;
}

export interface ResumeTextUpload {
  text: string;
}

export interface ResumeUploadResponse {
  master_resume_id: string;
  filename: string;
  skills: string[];
  experience_years: number | null;
  previous_titles: string[];
  education: string[];
  languages: string[];
}

export interface BlacklistResponse {
  blacklisted_companies: string[];
  blacklisted_roles: string[];
  blacklisted_locations: string[];
}

export interface BlacklistUpdate {
  blacklisted_companies?: string[] | null;
  blacklisted_roles?: string[] | null;
  blacklisted_locations?: string[] | null;
}

// --- Opportunities ---

export interface OpportunitySummary {
  id: string;
  job_id: string;
  company: string;
  title: string;
  country: string | null;
  city: string | null;
  remote_type: string | null;
  salary_display: string | null;
  overall_score: number | null;
  classification: string | null;
  visa_status: string | null;
  score_visa: number | null;
  score_skill_match: number | null;
  score_role_match: number | null;
  score_experience: number | null;
  score_country_pref: number | null;
  score_remote_pref: number | null;
  score_fit: number | null;
  user_feedback: string | null;
  digest_date: string | null;
  created_at: string | null;
  url: string | null;
  is_stale: boolean;
  archetype: string | null;
  salary: SalaryInfo | null;
  legitimacy_flags: LegitimacyFlag[];
  repost: RepostInfo | null;
}

export interface SalaryInfo {
  min: number | null;
  max: number | null;
  currency: string | null;
  period: string | null;
  usd_min: number | null;
  usd_max: number | null;
  currency_assumed: boolean;
}

export interface LegitimacyFlag {
  rule: string;
  detail: string;
  version: number;
}

export interface RepostInfo {
  is_repost: boolean;
  first_seen: string | null;
  repost_count: number;
}

export interface OpportunityDetail extends OpportunitySummary {
  description: string | null;
  fit_reasoning: string | null;
  visa_reasoning: string | null;
  score_skill_match: number | null;
  score_role_match: number | null;
  score_experience: number | null;
  score_country_pref: number | null;
  score_remote_pref: number | null;
  score_fit: number | null;
  skills_required: string[];
}

export interface OpportunityListResponse {
  items: OpportunitySummary[];
  total: number;
  page: number;
  page_size: number;
}

export type RejectReason = 'company' | 'role' | 'location' | 'other';

export interface RejectRequest {
  reason: RejectReason;
}

export interface OpportunityActionResponse {
  id: string;
  user_feedback: string;
  reject_reason: string | null;
  application_id: string | null;
}

// --- Applications ---

export type ApplicationStatus =
  | 'approved'
  | 'applied'
  | 'interviewing'
  | 'offer'
  | 'accepted'
  | 'rejected';

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  'approved',
  'applied',
  'interviewing',
  'offer',
  'accepted',
  'rejected',
];

export interface ApplicationResponse {
  id: string;
  job_id: string;
  company: string;
  title: string;
  country: string | null;
  status: ApplicationStatus;
  sub_status: string | null;
  time_in_stage_days: number | null;
  applied_at: string | null;
  follow_up_due: string | null;
  followed_up_at: string | null;
  second_follow_up_due: string | null;
  notes: string | null;
  updated_at: string | null;
  opportunity_id: string | null;
  resume_version_id: string | null;
  is_follow_up_overdue: boolean;
  is_second_follow_up_overdue: boolean;
  cover_letter_status: string | null;
  overall_score: number | null;
  score_skill_match: number | null;
  score_role_match: number | null;
  score_experience: number | null;
  score_country_pref: number | null;
  score_remote_pref: number | null;
  score_fit: number | null;
  score_visa: number | null;
}

export interface ApplicationListResponse {
  applications: ApplicationResponse[];
}

export interface ApplicationUpdate {
  status?: ApplicationStatus | null;
  sub_status?: string | null;
  notes?: string | null;
  applied_at?: string | null;
  follow_up_due?: string | null;
  followed_up_at?: string | null;
  second_follow_up_due?: string | null;
}

// --- STAR stories ---

export interface StoryResponse {
  id: string;
  status: 'draft' | 'ready';
  title: string;
  tags: string[];
  situation: string | null;
  task: string | null;
  action: string | null;
  result: string | null;
  reflection: string | null;
  source_job_id: string | null;
  ai_drafted: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface StoryListResponse {
  items: StoryResponse[];
  total: number;
}

export interface ThemesResponse {
  themes: string[];
  status: 'pending' | 'ready' | 'failed';
}

export interface InterviewPrepResponse {
  themes: string[];
  stories: StoryResponse[];
  uncovered_themes: string[];
}

export interface StageEvent {
  from_status: string | null;
  to_status: string | null;
  from_sub: string | null;
  to_sub: string | null;
  occurred_at: string | null;
}

export interface TimelineResponse {
  events: StageEvent[];
}

// --- Notifications ---

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  link_path: string | null;
  read_at: string | null;
  created_at: string | null;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  unread_count: number;
}

export interface FollowUpDraftResponse {
  body: string;
  days_since_applied: number;
  personalised: boolean;
}

// --- Cover letters ---

export interface CoverLetterResponse {
  id: string;
  application_id: string;
  status: 'pending' | 'generating' | 'draft' | 'approved' | 'failed';
  body: string | null;
  word_count: number;
  generation_count: number;
  error: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// --- Resume versions ---

export interface ResumeVersionItem {
  id: string;
  job_id: string;
  application_id: string | null;
  job_title: string;
  company: string;
  ats_score_before: number | null;
  ats_score_after: number | null;
  keywords_added: string[];
  skill_gaps: string[];
  master_text: string;
  tailored_markdown: string;
  latex_source: string;
  ai_tailored: boolean;
  ai_latex: boolean;
  pdf_engine: string;
  has_latex_pdf: boolean;
  created_at: string | null;
}

export interface ResumeVersionListResponse {
  versions: ResumeVersionItem[];
}

// --- Pipeline ---

export interface PipelineProgressEntry {
  ts: string;
  stage: string;
  level: string;
  message: string;
}

export interface PipelineRunResponse {
  id: string;
  run_date: string;
  started_at: string | null;
  completed_at: string | null;
  status: string | null;
  jobs_discovered: number;
  jobs_after_dedup: number;
  jobs_scored: number;
  top_opportunities: number;
  error_stage: string | null;
  error_message: string | null;
  current_stage: string | null;
  progress_log: PipelineProgressEntry[];
}

export interface PipelineRunListResponse {
  runs: PipelineRunResponse[];
}

export interface LLMUsageResponse {
  total_calls: number;
  total_prompt_tokens: number;
  total_completion_tokens: number;
  estimated_cost_usd: number;
  budget_usd: number;
  remaining_usd: number;
  token_balance?: number;
  spent_today_tokens?: number;
}

export interface BillingRates {
  pipeline_run_tokens: number;
  llm_call_tokens: number;
  signup_grant_tokens: number;
  usd_per_thousand_tokens: number;
}

export interface UsageDayPoint {
  date: string;
  spent: number;
}

export interface BillingUsageResponse {
  token_balance: number;
  spent_today: number;
  daily_generation_used: number;
  daily_generation_limit: number;
  rates: BillingRates;
  series: UsageDayPoint[];
  request_tokens_hint: string;
}

export interface UserLlmModelOption {
  id: string;
  label: string;
}

export interface UserLlmProviderStatus {
  id: string;
  label: string;
  byok_supported: boolean;
  configured: boolean;
  key_hint: string | null;
  model: string | null;
  models: UserLlmModelOption[];
  env_keys: string[];
}

export interface UserLlmKeysResponse {
  preferred_provider: string;
  providers: UserLlmProviderStatus[];
}

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  token_balance: number;
  is_admin: boolean;
}

export type PipelineStageKey =
  | 'starting'
  | 'discover'
  | 'deduplicate'
  | 'store_jobs'
  | 'score'
  | 'liveness'
  | 'company_universe'
  | 'digest'
  | 'skill_gap'
  | 'complete';

export const PIPELINE_STAGE_ORDER: PipelineStageKey[] = [
  'starting',
  'discover',
  'deduplicate',
  'store_jobs',
  'score',
  'liveness',
  'company_universe',
  'digest',
  'skill_gap',
  'complete',
];

export const PIPELINE_STAGE_LABELS: Record<PipelineStageKey, string> = {
  starting: 'Starting',
  discover: 'Discovering jobs',
  deduplicate: 'Deduplicating',
  store_jobs: 'Storing jobs',
  score: 'Scoring',
  liveness: 'Liveness checks',
  company_universe: 'Company universe',
  digest: 'Daily digest',
  skill_gap: 'Skill gap report',
  complete: 'Complete',
};

// --- Digest ---

export interface DigestResponse {
  digest_date: string;
  content_text: string;
  metrics_json: Record<string, unknown> | null;
}

// --- Reports ---

export interface SkillGapSkillEntry {
  skill: string;
  job_count: number;
  avg_score: number;
}

export interface SkillGapPeriod {
  period_type: string | null;
  period_start: string | null;
  period_end: string | null;
  top_missing_skills: SkillGapSkillEntry[] | null;
  total_jobs_analysed: number | null;
}

export interface SkillGapReportResponse {
  weekly: SkillGapPeriod | null;
  monthly: SkillGapPeriod | null;
}

export interface AnalyticsBucket {
  key: string;
  applications: number;
  responses: number;
  rate: number;
}

export interface ApplicationAnalyticsLocked {
  unlocked: false;
  qualifying_applications: number;
  required: number;
}

export interface ApplicationAnalyticsUnlocked {
  unlocked: true;
  qualifying_applications: number;
  response_rate_overall: number;
  by_country: AnalyticsBucket[];
  by_archetype: AnalyticsBucket[];
  by_score_band: AnalyticsBucket[];
  days_to_first_response: {
    p50: number | null;
    p90: number | null;
    sample_size: number;
  };
  excluded_pre_event_log: number;
}

export type ApplicationAnalyticsResponse =
  | ApplicationAnalyticsLocked
  | ApplicationAnalyticsUnlocked;

// --- Network outreach (LinkedIn drafts) ---

export type NetworkRoleTag =
  | 'recruiter'
  | 'hiring_manager'
  | 'employee'
  | 'agency'
  | 'other';

export type NetworkContactStatus =
  | 'drafted'
  | 'ready'
  | 'sent'
  | 'accepted'
  | 'replied'
  | 'closed';

export type NetworkMessageTemplate = 'referral' | 'cold' | 'follow_up';

export interface NetworkContactResponse {
  id: string;
  application_id: string | null;
  job_id: string | null;
  company: string;
  person_name: string;
  linkedin_url: string;
  role_tag: NetworkRoleTag | string;
  status: NetworkContactStatus | string;
  message_draft: string | null;
  message_template: NetworkMessageTemplate | string;
  sent_at: string | null;
  follow_up_due: string | null;
  notes: string | null;
  is_follow_up_overdue: boolean;
  agent_enabled?: boolean;
  agent_step?: string | null;
  next_action_at?: string | null;
  nudge_count?: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface NetworkingAgentReadyItem {
  contact: NetworkContactResponse;
  action_type: string;
  message: string | null;
  linkedin_url: string;
}

export interface NetworkingAgentQueueResponse {
  enrolled: NetworkContactResponse[];
  ready_to_send: NetworkingAgentReadyItem[];
  upcoming: Array<{
    contact_id: string;
    person_name: string;
    agent_step: string | null;
    next_action_at: string | null;
  }>;
  tip: string;
}

export interface ConversationAssistantRequest {
  thread_text: string;
  application_id?: string | null;
  contact_id?: string | null;
  voice_notes?: string | null;
}

export interface ConversationAssistantResponse {
  drafts: Array<{ tone: string; body: string }>;
  intent: string | null;
  suggested_next_status: string | null;
}

export interface HealthSummaryResponse {
  applications_total: number;
  by_status: Record<string, number>;
  network_contacts: number;
  agent_enrolled: number;
  agent_ready: number;
  resume_versions: number;
  has_active_resume: boolean;
  analytics_unlocked: boolean;
  qualifying_applications: number;
  tip: string;
}

export interface NetworkContactListResponse {
  contacts: NetworkContactResponse[];
}

export interface NetworkContactCreate {
  person_name: string;
  linkedin_url: string;
  role_tag?: NetworkRoleTag;
  message_template?: NetworkMessageTemplate;
  application_id?: string | null;
  company?: string | null;
  notes?: string | null;
  generate_draft?: boolean;
}

export interface NetworkContactUpdate {
  person_name?: string;
  linkedin_url?: string;
  role_tag?: NetworkRoleTag;
  status?: NetworkContactStatus;
  message_draft?: string;
  message_template?: NetworkMessageTemplate;
  notes?: string | null;
  follow_up_due?: string | null;
  company?: string;
}

// --- LinkedIn coach / extension import ---

export interface LinkedInProfileSectionScore {
  section: string;
  score: number;
  status: string;
  feedback: string;
  suggested_rewrite: string | null;
}

export interface LinkedInProfileAnalysisResponse {
  overall_score: number;
  summary: string;
  sections: LinkedInProfileSectionScore[];
  quick_wins: string[];
  headline_suggestion: string | null;
  about_suggestion: string | null;
  analyzed_at: string | null;
  source: string;
}

export interface LinkedInProfileAnalyzeRequest {
  profile_text: string;
  target_roles?: string[] | null;
  source?: 'pasted_profile' | 'extension';
}

export interface FindNetworkRequest {
  company: string;
  job_title?: string | null;
  application_id?: string | null;
  job_description?: string | null;
}

export interface NetworkSearchSuggestion {
  role_tag: string;
  title_query: string;
  why: string;
  linkedin_search_url: string;
  priority: number;
}

export interface FindNetworkResponse {
  company: string;
  job_title: string | null;
  strategy_summary: string;
  suggestions: NetworkSearchSuggestion[];
  tip: string;
}

export interface ImportContactItem {
  person_name: string;
  linkedin_url: string;
  role_tag?: NetworkRoleTag | null;
  headline?: string | null;
  company?: string | null;
}

export interface ImportContactsRequest {
  contacts: ImportContactItem[];
  application_id?: string | null;
  company?: string | null;
  generate_drafts?: boolean;
  source?: 'extension' | 'manual';
}

export interface ImportContactsResponse {
  created: NetworkContactResponse[];
  skipped: number;
  skipped_urls: string[];
}

// --- Autopilot ---

export interface TodayOpportunityItem {
  opportunity_id: string;
  job_id: string;
  company: string;
  title: string;
  overall_score: number | null;
  url: string | null;
  is_stale: boolean;
  reason: string;
}

export interface TodayFollowUpItem {
  kind: 'application' | 'network';
  id: string;
  label: string;
  company: string | null;
  due: string | null;
  overdue: boolean;
  detail: string | null;
}

export interface TodayPacketGapItem {
  application_id: string;
  company: string;
  title: string;
  missing: string[];
}

export interface TodayInterviewNudge {
  application_id: string;
  company: string;
  title: string;
  sub_status: string | null;
}

export interface TodayQueueResponse {
  opportunities: TodayOpportunityItem[];
  follow_ups: TodayFollowUpItem[];
  packet_gaps: TodayPacketGapItem[];
  interview_nudges: TodayInterviewNudge[];
  tip: string;
}

export interface ChecklistItem {
  key: string;
  label: string;
  done: boolean;
  href: string | null;
}

export interface ApplyPacketResponse {
  application_id: string;
  company: string;
  title: string;
  job_url: string | null;
  status: string;
  resume_version_id: string | null;
  ats_score_before: number | null;
  ats_score_after: number | null;
  cover_letter_status: string | null;
  has_cover_letter_body: boolean;
  connect_note: string | null;
  network_suggestions: Array<Record<string, unknown>>;
  form_answers: Array<Record<string, unknown>>;
  checklist: ChecklistItem[];
  ready: boolean;
}

export interface MessagePackItem {
  key: string;
  label: string;
  channel: 'linkedin' | 'email';
  body: string;
  day_offset: number;
  max_chars: number | null;
}

export interface MessagePackResponse {
  application_id: string;
  company: string;
  title: string;
  messages: MessagePackItem[];
  generated_at: string | null;
}

export interface MockQuestion {
  question: string;
  tip: string | null;
  related_theme: string | null;
}

export interface InterviewPackResponse {
  application_id: string;
  company: string;
  title: string;
  themes: string[];
  stories: Array<Record<string, unknown>>;
  uncovered_themes: string[];
  mock_questions: MockQuestion[];
  thank_you_note: string | null;
  generated_at: string | null;
}

export interface ReplyCoachRequest {
  message: string;
  application_id?: string | null;
}

export interface ReplyDraft {
  tone: string;
  body: string;
}

export interface ReplyCoachResponse {
  drafts: ReplyDraft[];
  suggested_status: string | null;
  next_steps: string[];
}

export interface OfferCompareRequest {
  application_ids: string[];
}

export interface OfferCompareRow {
  application_id: string;
  company: string;
  title: string;
  status: string;
  salary_display: string | null;
  remote_type: string | null;
  country: string | null;
  visa_mentioned: boolean;
  notes: string | null;
}

export interface OfferCompareResponse {
  rows: OfferCompareRow[];
  summary: string;
  negotiation_bullets: string[];
}

export interface ResumeSectionScore {
  section: string;
  score: number;
  feedback: string;
}

export interface ResumeScoreResponse {
  overall_score: number;
  summary: string;
  sections: ResumeSectionScore[];
  quick_wins: string[];
  analyzed_at: string | null;
  master_resume_id: string | null;
  persona_label: string | null;
}

export interface WeeklyPlanAction {
  action: string;
  why: string;
  effort: 'low' | 'medium' | 'high';
}

export interface WeeklyPlanResponse {
  period_label: string | null;
  actions: WeeklyPlanAction[];
  focus_skills: string[];
  generated_at: string | null;
}

export interface AutopilotChatRequest {
  message: string;
}

export interface SuggestedAction {
  action: string;
  label: string;
  application_id: string | null;
  path?: string | null;
}

export interface ChatVisualStat {
  label: string;
  value: string;
  tone: 'neutral' | 'accent' | 'warn' | 'ok';
}

export interface ChatVisualJob {
  title: string;
  company: string;
  score: number | null;
  opportunity_id: string | null;
  url: string | null;
}

export interface ChatVisualProgress {
  label: string;
  value: number;
  max: number;
}

export interface ChatVisualChecklistItem {
  label: string;
  done: boolean;
  path: string | null;
}

export interface ChatVisual {
  type: 'stat_row' | 'job_list' | 'progress' | 'checklist' | 'quick_replies' | 'route_cta' | 'tip';
  title?: string | null;
  stats?: ChatVisualStat[];
  jobs?: ChatVisualJob[];
  progress?: ChatVisualProgress | null;
  checklist?: ChatVisualChecklistItem[];
  quick_replies?: string[];
  path?: string | null;
  label?: string | null;
  body?: string | null;
}

export interface AutopilotChatResponse {
  reply: string;
  suggested_actions: SuggestedAction[];
  visuals: ChatVisual[];
  mood: 'neutral' | 'encouraging' | 'urgent' | 'celebratory';
  tour_id?: string | null;
  tour?: CoachTourStep[];
}

export interface CoachTourStep {
  path: string;
  target: string;
  title: string;
  body: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
}

export interface ChatHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
  visuals: ChatVisual[];
  suggested_actions: SuggestedAction[];
  tour_id?: string | null;
  tour?: CoachTourStep[];
}

export interface ChatHistoryResponse {
  messages: ChatHistoryMessage[];
}

export interface MasterResumeItem {
  id: string;
  filename: string | null;
  label: string | null;
  is_active: boolean;
  uploaded_at: string | null;
}

export interface MasterResumeListResponse {
  resumes: MasterResumeItem[];
}

export interface MasterResumeUpdate {
  label?: string | null;
  is_active?: boolean | null;
}

// --- Career-ops style autopilot extensions ---

export interface AutoPipelineRequest {
  description: string;
  url?: string | null;
  company?: string | null;
  title?: string | null;
  country?: string | null;
  remote_type?: string | null;
  approve?: boolean;
  track?: boolean;
}

export interface AutoPipelineScores {
  skill_match: number;
  role_match: number;
  experience: number;
  country_pref: number;
  remote_pref: number;
  fit: number;
  visa: number;
}

export interface AutoPipelineResponse {
  opportunity_id: string;
  job_id: string;
  application_id: string | null;
  resume_version_id: string | null;
  company: string;
  title: string;
  url: string | null;
  overall_score: number;
  classification: string;
  scores: AutoPipelineScores;
  fit_reasoning: string | null;
  visa_status: string | null;
  visa_reasoning: string | null;
  tailored: boolean;
  created_at: string | null;
}

export interface CompanyResearchRequest {
  company: string;
  job_title?: string | null;
  application_id?: string | null;
  force?: boolean;
}

export interface CompanyResearchResponse {
  company: string;
  job_title: string | null;
  application_id: string | null;
  cached: boolean;
  summary: string;
  funding_or_stage: string | null;
  leadership_notes: string | null;
  press_signals: string[];
  comp_signals: string[];
  red_flags: string[];
  green_flags: string[];
  questions_to_ask: string[];
  generated_at: string | null;
}

export interface FormAnswersRequest {
  questions: Array<{ id?: string | null; prompt: string }>;
}

export interface FormAnswerItem {
  id: string;
  question: string;
  answer: string;
  tips: string | null;
}

export interface FormAnswersResponse {
  application_id: string;
  company: string;
  title: string;
  answers: FormAnswerItem[];
  generated_at: string | null;
}

export interface PatternStat {
  key: string;
  count: number;
  label: string;
}

export interface PatternInsight {
  kind: string;
  title: string;
  detail: string;
  severity: 'info' | 'warn';
}

export interface PatternsResponse {
  total_opportunities: number;
  total_applications: number;
  reject_reasons: PatternStat[];
  rejected_companies: PatternStat[];
  rejected_archetypes: PatternStat[];
  skipped_companies: PatternStat[];
  insights: PatternInsight[];
  summary: string | null;
  generated_at: string | null;
}

export interface TrainingScoreRequest {
  title: string;
  description?: string | null;
  cost_hours?: number | null;
  cost_money?: number | null;
  url?: string | null;
}

export interface TrainingScoreResponse {
  title: string;
  score: number;
  verdict: 'worth_it' | 'maybe' | 'skip';
  summary: string;
  why: string[];
  opportunity_cost: string[];
  better_alternatives: string[];
  scored_at: string | null;
}

export interface ProjectScoreRequest {
  title: string;
  description?: string | null;
  estimated_hours?: number | null;
}

export interface ProjectScoreResponse {
  title: string;
  score: number;
  verdict: 'build' | 'maybe' | 'skip';
  summary: string;
  why: string[];
  scope_tips: string[];
  resume_bullets: string[];
  scored_at: string | null;
}

// --- Health ---

export interface HealthResponse {
  status: string;
  db: string;
}

// --- API errors ---

export interface ApiErrorPayload {
  error: string;
  code: string;
  detail: unknown;
}
