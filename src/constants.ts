/** Mirrored from frontend/components/constants.py */

export const TARGET_ROLES = [
  'ai engineer',
  'machine learning engineer',
  'ml engineer',
  'applied ai engineer',
  'data scientist',
  'senior data scientist',
  'computer vision engineer',
  'llm engineer',
  'generative ai engineer',
  'ai platform engineer',
] as const;

export const COUNTRY_OPTIONS: Record<string, string> = {
  IN: 'India',
  US: 'United States',
  GB: 'United Kingdom',
  DE: 'Germany',
  NL: 'Netherlands',
  SG: 'Singapore',
  CA: 'Canada',
  AU: 'Australia',
  AE: 'United Arab Emirates',
  FR: 'France',
  CH: 'Switzerland',
  SE: 'Sweden',
  IE: 'Ireland',
};

export const SALARY_CURRENCIES = ['USD', 'INR', 'EUR', 'GBP', 'SGD', 'AED', 'CAD', 'AUD'] as const;

export const CLASSIFICATION_OPTIONS = [
  'apply_immediately',
  'high_priority',
  'apply',
  'optional',
  'skip',
] as const;

export const ARCHETYPE_OPTIONS = [
  { value: 'ml_engineering', label: 'ML Engineering' },
  { value: 'llm_ai_engineering', label: 'LLM / AI' },
  { value: 'data_science', label: 'Data Science' },
  { value: 'data_engineering', label: 'Data Engineering' },
  { value: 'backend', label: 'Backend' },
  { value: 'fullstack_frontend', label: 'Full-stack / Frontend' },
  { value: 'devops_platform', label: 'DevOps / Platform' },
  { value: 'product_management', label: 'Product' },
  { value: 'solutions_devrel', label: 'Solutions / DevRel' },
  { value: 'other', label: 'Other' },
] as const;

export const VISA_STATUS_OPTIONS = ['available', 'likely', 'unknown', 'unlikely', 'none'] as const;

export const REJECT_REASONS = [
  { value: 'company', label: 'Company' },
  { value: 'role', label: 'Role' },
  { value: 'location', label: 'Location' },
  { value: 'other', label: 'Other' },
] as const;

export const SUB_STATUS_OPTIONS = [
  { value: 'phone_screen', label: 'Phone screen' },
  { value: 'technical', label: 'Technical' },
  { value: 'onsite_loop', label: 'Onsite loop' },
  { value: 'final_round', label: 'Final round' },
] as const;

export const STAR_TAGS = [
  'ambiguity',
  'stakeholder_mgmt',
  'conflict',
  'leadership',
  'cross_functional',
  'technical_depth',
  'communication',
  'problem_solving',
  'prioritization',
  'deadline_pressure',
  'failure_recovery',
  'innovation',
  'mentorship',
  'teamwork',
  'ownership',
  'data_driven',
  'customer_focus',
  'adaptability',
  'negotiation',
  'ethics',
  'remote_collaboration',
  'project_management',
  'learning_agility',
  'influence_without_authority',
  'quality_focus',
] as const;
