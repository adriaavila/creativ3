export type GrowthRunStatus = "queued" | "running" | "completed" | "failed";
export type LeadStatus =
  | "new"
  | "researched"
  | "drafted"
  | "approved"
  | "contacted"
  | "replied"
  | "meeting_booked"
  | "won"
  | "lost";
export type DraftStatus = "pending" | "approved" | "rejected";
export type DraftKind = "dm" | "followup_1" | "followup_2" | "audio_script" | "proposal";

export type PublicAgentEvent = {
  id: string;
  agent: "Research Agent" | "Proposal Agent" | "Project Operator";
  action: string;
  detail: string;
  createdAt: string;
  isDemo: boolean;
};

export type GrowthRun = {
  id: string;
  status: GrowthRunStatus;
  market: string;
  summary: string | null;
  error: string | null;
  leadsRequested: number;
  createdAt: string;
};

export type GrowthLead = {
  id: string;
  businessName: string;
  vertical: string;
  location: string;
  websiteUrl: string | null;
  instagramUrl: string | null;
  businessPhone: string | null;
  contactSourceUrl: string | null;
  evidence: string;
  sourceUrls: string[];
  problemDetected: string;
  offerAngle: string;
  leadScore: number;
  status: LeadStatus;
  nextAction: string | null;
  nextActionAt: string | null;
  closeProbability: number | null;
  potentialValue: number | null;
  lastContactedAt: string | null;
  createdAt: string;
};

export type OutreachDraft = {
  id: string;
  leadId: string;
  channel: "instagram" | "email" | "whatsapp";
  kind: DraftKind;
  content: string;
  status: DraftStatus;
  updatedAt: string;
};
