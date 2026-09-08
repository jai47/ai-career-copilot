import { apiDelete, apiGet, apiGetBytes, apiPatch, apiPost, API_URL } from './client';
import type {
  ApplyPacketResponse,
  AutopilotChatRequest,
  AutopilotChatResponse,
  AutoPipelineRequest,
  AutoPipelineResponse,
  ChatHistoryResponse,
  CompanyResearchRequest,
  CompanyResearchResponse,
  FormAnswersRequest,
  FormAnswersResponse,
  InterviewPackResponse,
  MasterResumeItem,
  MasterResumeListResponse,
  MasterResumeUpdate,
  MessagePackResponse,
  OfferCompareRequest,
  OfferCompareResponse,
  PatternsResponse,
  ProjectScoreRequest,
  ProjectScoreResponse,
  ReplyCoachRequest,
  ReplyCoachResponse,
  ResumeScoreResponse,
  TodayQueueResponse,
  TrainingScoreRequest,
  TrainingScoreResponse,
  WeeklyPlanResponse,
} from '../types';

export function getTodayQueue(token: string, signal?: AbortSignal) {
  return apiGet<TodayQueueResponse>(token, '/autopilot/today', undefined, signal);
}

export async function downloadAutopilotCalendar(token: string): Promise<Blob> {
  return apiGetBytes(token, '/autopilot/calendar.ics');
}

export function getApplyPacket(token: string, applicationId: string, signal?: AbortSignal) {
  return apiGet<ApplyPacketResponse>(
    token,
    `/autopilot/applications/${applicationId}/packet`,
    undefined,
    signal,
  );
}

export function ensureApplyPacket(token: string, applicationId: string, signal?: AbortSignal) {
  return apiPost<ApplyPacketResponse>(
    token,
    `/autopilot/applications/${applicationId}/packet/ensure`,
    {},
    signal,
  );
}

export function getMessagePack(token: string, applicationId: string, signal?: AbortSignal) {
  return apiGet<MessagePackResponse>(
    token,
    `/autopilot/applications/${applicationId}/message-pack`,
    undefined,
    signal,
  );
}

export function generateMessagePack(token: string, applicationId: string, signal?: AbortSignal) {
  return apiPost<MessagePackResponse>(
    token,
    `/autopilot/applications/${applicationId}/message-pack`,
    {},
    signal,
  );
}

export function getInterviewPack(token: string, applicationId: string, signal?: AbortSignal) {
  return apiGet<InterviewPackResponse>(
    token,
    `/autopilot/applications/${applicationId}/interview-pack`,
    undefined,
    signal,
  );
}

export function generateInterviewPack(token: string, applicationId: string, signal?: AbortSignal) {
  return apiPost<InterviewPackResponse>(
    token,
    `/autopilot/applications/${applicationId}/interview-pack`,
    {},
    signal,
  );
}

export function runReplyCoach(token: string, payload: ReplyCoachRequest, signal?: AbortSignal) {
  return apiPost<ReplyCoachResponse>(token, '/autopilot/reply-coach', payload, signal);
}

export function compareOffers(token: string, payload: OfferCompareRequest, signal?: AbortSignal) {
  return apiPost<OfferCompareResponse>(token, '/autopilot/offers/compare', payload, signal);
}

export function getResumeScore(token: string, signal?: AbortSignal) {
  return apiGet<ResumeScoreResponse>(token, '/autopilot/resume-score', undefined, signal);
}

export function analyzeResumeScore(token: string, signal?: AbortSignal) {
  return apiPost<ResumeScoreResponse>(token, '/autopilot/resume-score', {}, signal);
}

export function getWeeklyPlan(token: string, signal?: AbortSignal) {
  return apiGet<WeeklyPlanResponse>(token, '/autopilot/weekly-plan', undefined, signal);
}

export function generateWeeklyPlan(token: string, signal?: AbortSignal) {
  return apiPost<WeeklyPlanResponse>(token, '/autopilot/weekly-plan', {}, signal);
}

export function autopilotChat(token: string, payload: AutopilotChatRequest, signal?: AbortSignal) {
  return apiPost<AutopilotChatResponse>(token, '/autopilot/chat', payload, signal);
}

export function getChatHistory(token: string, signal?: AbortSignal) {
  return apiGet<ChatHistoryResponse>(token, '/autopilot/chat/history', undefined, signal);
}

export function clearChatHistory(token: string, signal?: AbortSignal) {
  return apiDelete<ChatHistoryResponse>(token, '/autopilot/chat/history', signal);
}

export function getCoachTour(token: string, tourId: string, signal?: AbortSignal) {
  return apiGet<{ tour_id: string; steps: import('../types').CoachTourStep[] }>(
    token,
    `/autopilot/coach-tours/${tourId}`,
    undefined,
    signal,
  );
}

export function listMasterResumes(token: string, signal?: AbortSignal) {
  return apiGet<MasterResumeListResponse>(token, '/autopilot/master-resumes', undefined, signal);
}

export function updateMasterResume(
  token: string,
  resumeId: string,
  payload: MasterResumeUpdate,
  signal?: AbortSignal,
) {
  return apiPatch<MasterResumeItem>(token, `/autopilot/master-resumes/${resumeId}`, payload, signal);
}

export function runAutoPipeline(token: string, payload: AutoPipelineRequest, signal?: AbortSignal) {
  return apiPost<AutoPipelineResponse>(token, '/autopilot/auto-pipeline', payload, signal);
}

export function researchCompany(
  token: string,
  payload: CompanyResearchRequest,
  signal?: AbortSignal,
) {
  return apiPost<CompanyResearchResponse>(token, '/autopilot/company-research', payload, signal);
}

export function getFormAnswers(token: string, applicationId: string, signal?: AbortSignal) {
  return apiGet<FormAnswersResponse>(
    token,
    `/autopilot/applications/${applicationId}/form-answers`,
    undefined,
    signal,
  );
}

export function generateFormAnswers(
  token: string,
  applicationId: string,
  payload: FormAnswersRequest,
  signal?: AbortSignal,
) {
  return apiPost<FormAnswersResponse>(
    token,
    `/autopilot/applications/${applicationId}/form-answers`,
    payload,
    signal,
  );
}

export function getPatterns(token: string, refresh = false, signal?: AbortSignal) {
  return apiGet<PatternsResponse>(
    token,
    '/autopilot/patterns',
    { refresh: refresh ? 'true' : 'false' },
    signal,
  );
}

export function scoreTraining(token: string, payload: TrainingScoreRequest, signal?: AbortSignal) {
  return apiPost<TrainingScoreResponse>(token, '/autopilot/training/score', payload, signal);
}

export function scoreProject(token: string, payload: ProjectScoreRequest, signal?: AbortSignal) {
  return apiPost<ProjectScoreResponse>(token, '/autopilot/project/score', payload, signal);
}

export { API_URL };
