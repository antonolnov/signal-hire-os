import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";

type JobStatus = "draft" | "active" | "paused" | "closed";
type ApplicationStatus = "new" | "screening" | "interview" | "offer" | "rejected" | "hired" | "hold";
type PipelineStageKind = "new" | "screening" | "interview" | "offer" | "rejected" | "hired";
type SessionStatus = "active" | "paused" | "completed" | "escalated" | "failed";
type SenderType = "ai" | "candidate" | "recruiter" | "system";

type Timestamped = {
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceRecord = Timestamped & {
  id: string;
  name: string;
  slug: string;
  plan?: string;
};

export type UserRecord = Timestamped & {
  id: string;
  workspaceId: string;
  name: string;
  email: string;
  role: string;
};

export type JobRecord = Timestamped & {
  id: string;
  workspaceId: string;
  ownerUserId?: string;
  title: string;
  department?: string;
  location?: string;
  employmentType?: string;
  status: JobStatus;
  descriptionRaw?: string;
};

export type JobScorecardRecord = Timestamped & {
  id: string;
  jobId: string;
  summary?: string;
  mustHaves?: string[];
  niceToHaves?: string[];
  redFlags?: string[];
  screeningQuestions?: string[];
  interviewFocusAreas?: string[];
  version: number;
};

export type PipelineStageRecord = Timestamped & {
  id: string;
  jobId: string;
  name: string;
  orderIndex: number;
  kind: PipelineStageKind;
  isTerminal: boolean;
};

export type CandidateRecord = Timestamped & {
  id: string;
  workspaceId: string;
  fullName: string;
  email?: string;
  phone?: string;
  location?: string;
  headline?: string;
  linkedinUrl?: string;
  summary?: string;
  seniority?: string;
  currentCompany?: string;
  yearsExperience?: number;
};

export type CandidateProfileRecord = Timestamped & {
  id: string;
  candidateId: string;
  skills?: string[];
  experienceTimeline?: unknown[];
  education?: unknown[];
  languages?: string[];
  salaryExpectation?: string;
  noticePeriod?: string;
  workPreference?: string;
  rawStructuredData?: unknown;
};

export type ApplicationRecord = Timestamped & {
  id: string;
  candidateId: string;
  jobId: string;
  currentStageId?: string;
  sourceId?: string;
  assignedRecruiterId?: string;
  status: ApplicationStatus;
  fitLevel?: string;
  fitConfidence?: string;
  recommendedNextStep?: string;
};

export type CandidateInsightRecord = {
  id: string;
  candidateId: string;
  applicationId?: string;
  type: string;
  content: string;
  evidence?: unknown;
  confidence?: number;
  createdAt: string;
};

export type DecisionRecommendationRecord = {
  id: string;
  applicationId: string;
  recommendedAction: string;
  fitLevel?: string;
  confidence?: number;
  why?: string;
  missingEvidence?: unknown;
  risks?: unknown;
  createdAt: string;
};

export type CandidateSourceRecord = Timestamped & {
  id: string;
  workspaceId: string;
  type: string;
  label: string;
  externalAccountId?: string;
  metadata?: unknown;
};

export type IngestionRecord = Timestamped & {
  id: string;
  workspaceId: string;
  sourceId?: string;
  jobId?: string;
  candidateId?: string;
  applicationId?: string;
  status: string;
  payloadType: string;
  rawPayloadRef?: string;
  parseResult?: unknown;
  parseConfidence?: number;
  errorMessage?: string;
  createdBy?: string;
};

export type ConversationPlaybookRecord = Timestamped & {
  id: string;
  workspaceId: string;
  jobId?: string;
  targetStageId?: string;
  name: string;
  channelType?: string;
  objective?: string;
  instructions?: string;
  autonomyMode?: string;
  status: string;
};

export type ConversationSessionRecord = Timestamped & {
  id: string;
  candidateId: string;
  applicationId?: string;
  playbookId?: string;
  channelType?: string;
  externalThreadId?: string;
  status: SessionStatus;
  startedBy?: string;
  completedAt?: string;
};

export type ConversationMessageRecord = {
  id: string;
  sessionId: string;
  senderType: SenderType;
  content: string;
  structuredExtract?: unknown;
  requiresApproval: boolean;
  sentAt?: string;
  createdAt: string;
};

export type AtsStore = {
  version: number;
  workspaces: WorkspaceRecord[];
  users: UserRecord[];
  jobs: JobRecord[];
  jobScorecards: JobScorecardRecord[];
  pipelineStages: PipelineStageRecord[];
  candidates: CandidateRecord[];
  candidateProfiles: CandidateProfileRecord[];
  applications: ApplicationRecord[];
  candidateInsights: CandidateInsightRecord[];
  decisionRecommendations: DecisionRecommendationRecord[];
  candidateSources: CandidateSourceRecord[];
  ingestions: IngestionRecord[];
  playbooks: ConversationPlaybookRecord[];
  conversationSessions: ConversationSessionRecord[];
  conversationMessages: ConversationMessageRecord[];
};

const STORE_PATH = path.join(process.cwd(), "state", "ats-store.json");
let mutationQueue = Promise.resolve();

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix: string) {
  return `${prefix}-${randomUUID().slice(0, 8)}`;
}

function touch<T extends Timestamped>(record: T): T {
  return {
    ...record,
    updatedAt: nowIso(),
  };
}

function defaultStages(jobId: string): PipelineStageRecord[] {
  const timestamp = nowIso();

  return [
    { id: createId("stage"), jobId, name: "Новые", kind: "new", orderIndex: 0, isTerminal: false, createdAt: timestamp, updatedAt: timestamp },
    { id: createId("stage"), jobId, name: "AI pre-screen", kind: "screening", orderIndex: 1, isTerminal: false, createdAt: timestamp, updatedAt: timestamp },
    { id: createId("stage"), jobId, name: "Recruiter review", kind: "screening", orderIndex: 2, isTerminal: false, createdAt: timestamp, updatedAt: timestamp },
    { id: createId("stage"), jobId, name: "Interview", kind: "interview", orderIndex: 3, isTerminal: false, createdAt: timestamp, updatedAt: timestamp },
    { id: createId("stage"), jobId, name: "Rejected", kind: "rejected", orderIndex: 4, isTerminal: true, createdAt: timestamp, updatedAt: timestamp },
    { id: createId("stage"), jobId, name: "Hired", kind: "hired", orderIndex: 5, isTerminal: true, createdAt: timestamp, updatedAt: timestamp },
  ];
}

function mapStageKindToStatus(kind: string): ApplicationStatus | undefined {
  switch (kind) {
    case "new":
      return "new";
    case "screening":
      return "screening";
    case "interview":
      return "interview";
    case "offer":
      return "offer";
    case "rejected":
      return "rejected";
    case "hired":
      return "hired";
    default:
      return undefined;
  }
}

function createInitialStore(): AtsStore {
  const timestamp = "2026-04-17T19:00:00.000Z";
  const workspaceId = "workspace-demo";
  const userId = "user-anton";

  const jobDesignerId = "job-designer";
  const jobBackendId = "job-backend";

  const stages: PipelineStageRecord[] = [
    { id: "stage-designer-new", jobId: jobDesignerId, name: "Новые", kind: "new", orderIndex: 0, isTerminal: false, createdAt: timestamp, updatedAt: timestamp },
    { id: "stage-designer-screen", jobId: jobDesignerId, name: "AI pre-screen", kind: "screening", orderIndex: 1, isTerminal: false, createdAt: timestamp, updatedAt: timestamp },
    { id: "stage-designer-review", jobId: jobDesignerId, name: "Recruiter review", kind: "screening", orderIndex: 2, isTerminal: false, createdAt: timestamp, updatedAt: timestamp },
    { id: "stage-designer-interview", jobId: jobDesignerId, name: "Interview", kind: "interview", orderIndex: 3, isTerminal: false, createdAt: timestamp, updatedAt: timestamp },
    { id: "stage-designer-rejected", jobId: jobDesignerId, name: "Rejected", kind: "rejected", orderIndex: 4, isTerminal: true, createdAt: timestamp, updatedAt: timestamp },
    { id: "stage-designer-hired", jobId: jobDesignerId, name: "Hired", kind: "hired", orderIndex: 5, isTerminal: true, createdAt: timestamp, updatedAt: timestamp },
    { id: "stage-backend-new", jobId: jobBackendId, name: "Новые", kind: "new", orderIndex: 0, isTerminal: false, createdAt: timestamp, updatedAt: timestamp },
    { id: "stage-backend-screen", jobId: jobBackendId, name: "AI pre-screen", kind: "screening", orderIndex: 1, isTerminal: false, createdAt: timestamp, updatedAt: timestamp },
    { id: "stage-backend-review", jobId: jobBackendId, name: "Recruiter review", kind: "screening", orderIndex: 2, isTerminal: false, createdAt: timestamp, updatedAt: timestamp },
    { id: "stage-backend-interview", jobId: jobBackendId, name: "Interview", kind: "interview", orderIndex: 3, isTerminal: false, createdAt: timestamp, updatedAt: timestamp },
    { id: "stage-backend-rejected", jobId: jobBackendId, name: "Rejected", kind: "rejected", orderIndex: 4, isTerminal: true, createdAt: timestamp, updatedAt: timestamp },
    { id: "stage-backend-hired", jobId: jobBackendId, name: "Hired", kind: "hired", orderIndex: 5, isTerminal: true, createdAt: timestamp, updatedAt: timestamp },
  ];

  return {
    version: 1,
    workspaces: [
      {
        id: workspaceId,
        name: "Signal Hire Demo",
        slug: "signal-hire-demo",
        plan: "prototype",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    users: [
      {
        id: userId,
        workspaceId,
        name: "Anton Olnov",
        email: "antonolnov@gmail.com",
        role: "lead",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    jobs: [
      {
        id: jobDesignerId,
        workspaceId,
        ownerUserId: userId,
        title: "Senior Product Designer",
        department: "Design",
        location: "Remote, Europe",
        employmentType: "Full-time",
        status: "active",
        descriptionRaw: "Build product experience for AI-native recruiting teams.",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: jobBackendId,
        workspaceId,
        ownerUserId: userId,
        title: "Backend Engineer, Python",
        department: "Engineering",
        location: "Remote",
        employmentType: "Full-time",
        status: "active",
        descriptionRaw: "Own ingestion and AI orchestration backend services.",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    jobScorecards: [
      {
        id: "scorecard-designer",
        jobId: jobDesignerId,
        summary: "Lead end-to-end design for AI-heavy recruiter workflows.",
        mustHaves: ["B2B SaaS", "Design systems", "Complex workflow UX"],
        niceToHaves: ["Recruiting tech", "AI product experience"],
        redFlags: ["No evidence of product ownership"],
        screeningQuestions: ["Как вы проектировали сложные workflow systems?"],
        interviewFocusAreas: ["Decision support UX", "Information density"],
        version: 1,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: "scorecard-backend",
        jobId: jobBackendId,
        summary: "Build ingestion, workflow logic and AI services at the core of the product.",
        mustHaves: ["Python", "Queues", "Postgres"],
        niceToHaves: ["LLM systems", "Workflow orchestration"],
        redFlags: ["No backend ownership examples"],
        screeningQuestions: ["Как вы проектировали async pipelines?"],
        interviewFocusAreas: ["Reliability", "Observability"],
        version: 1,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    pipelineStages: stages,
    candidates: [
      {
        id: "cand-alina",
        workspaceId,
        fullName: "Alina Petrova",
        email: "alina@example.com",
        location: "Berlin",
        headline: "Senior Product Designer",
        summary: "AI workflow designer with strong B2B experience.",
        seniority: "Senior",
        currentCompany: "Flowbase",
        yearsExperience: 7,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: "cand-mark",
        workspaceId,
        fullName: "Mark Chen",
        email: "mark@example.com",
        location: "Warsaw",
        headline: "Backend Engineer",
        summary: "Python backend engineer with queue and ETL experience.",
        seniority: "Senior",
        currentCompany: "Signal Stack",
        yearsExperience: 6,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    candidateProfiles: [
      {
        id: "profile-alina",
        candidateId: "cand-alina",
        skills: ["Product Design", "Research", "Design Systems"],
        workPreference: "Remote",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: "profile-mark",
        candidateId: "cand-mark",
        skills: ["Python", "Queues", "Postgres"],
        workPreference: "Remote",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    applications: [
      {
        id: "app-alina",
        candidateId: "cand-alina",
        jobId: jobDesignerId,
        currentStageId: "stage-designer-screen",
        sourceId: "source-manual",
        status: "screening",
        fitLevel: "strong",
        fitConfidence: "high",
        recommendedNextStep: "Invite to recruiter review",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: "app-mark",
        candidateId: "cand-mark",
        jobId: jobBackendId,
        currentStageId: "stage-backend-screen",
        sourceId: "source-resume",
        status: "screening",
        fitLevel: "medium",
        fitConfidence: "medium",
        recommendedNextStep: "Collect more evidence via AI pre-screen",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    candidateInsights: [
      {
        id: "insight-alina",
        candidateId: "cand-alina",
        applicationId: "app-alina",
        type: "fit_analysis",
        content: "Сильный профиль под recruiter-facing workflow UX, хороший signal в design systems и research.",
        confidence: 0.9,
        createdAt: timestamp,
      },
      {
        id: "insight-mark",
        candidateId: "cand-mark",
        applicationId: "app-mark",
        type: "missing_info",
        content: "Нужно проверить production async pipelines, monitoring stack и ownership of LLM workflows.",
        confidence: 0.82,
        createdAt: timestamp,
      },
    ],
    decisionRecommendations: [
      {
        id: "rec-alina",
        applicationId: "app-alina",
        recommendedAction: "move_to_recruiter_review",
        fitLevel: "strong",
        confidence: 0.91,
        why: "Есть прямой опыт в B2B workflow products и signal-heavy recruiting UX.",
        createdAt: timestamp,
      },
      {
        id: "rec-mark",
        applicationId: "app-mark",
        recommendedAction: "launch_playbook",
        fitLevel: "medium",
        confidence: 0.78,
        why: "Нужно добрать evidence по AI orchestration и observability.",
        createdAt: timestamp,
      },
    ],
    candidateSources: [
      {
        id: "source-manual",
        workspaceId,
        type: "manual",
        label: "Manual entry",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: "source-resume",
        workspaceId,
        type: "resume_upload",
        label: "Resume upload",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: "source-linkedin",
        workspaceId,
        type: "linkedin_capture",
        label: "LinkedIn capture",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    ingestions: [
      {
        id: "ingestion-manual-1",
        workspaceId,
        sourceId: "source-manual",
        jobId: jobDesignerId,
        candidateId: "cand-alina",
        applicationId: "app-alina",
        status: "linked",
        payloadType: "manual_form",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: "ingestion-resume-1",
        workspaceId,
        sourceId: "source-resume",
        jobId: jobBackendId,
        candidateId: "cand-mark",
        applicationId: "app-mark",
        status: "pending",
        payloadType: "file",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: "ingestion-linkedin-1",
        workspaceId,
        sourceId: "source-linkedin",
        status: "duplicate_review",
        payloadType: "url",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    playbooks: [
      {
        id: "playbook-designer",
        workspaceId,
        jobId: jobDesignerId,
        targetStageId: "stage-designer-screen",
        name: "Designer pre-screen",
        channelType: "email",
        objective: "Уточнить compensation, notice period и readiness к recruiter review.",
        instructions: "Держаться playbook, собирать факты короткими сообщениями.",
        autonomyMode: "guardrailed",
        status: "active",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: "playbook-backend",
        workspaceId,
        jobId: jobBackendId,
        targetStageId: "stage-backend-screen",
        name: "Backend AI screen",
        channelType: "telegram",
        objective: "Проверить опыт с async pipelines, observability и LLM workflows.",
        instructions: "Если кандидат уходит в compensation negotiation, эскалировать recruiter.",
        autonomyMode: "guardrailed",
        status: "active",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    conversationSessions: [
      {
        id: "session-alina",
        candidateId: "cand-alina",
        applicationId: "app-alina",
        playbookId: "playbook-designer",
        channelType: "email",
        externalThreadId: "demo-email-alina",
        status: "active",
        startedBy: "system",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: "session-mark",
        candidateId: "cand-mark",
        applicationId: "app-mark",
        playbookId: "playbook-backend",
        channelType: "telegram",
        externalThreadId: "demo-telegram-mark",
        status: "escalated",
        startedBy: "system",
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    conversationMessages: [
      {
        id: "msg-a1",
        sessionId: "session-alina",
        senderType: "ai",
        content: "Спасибо, Алина. Подтверди, пожалуйста, ожидаемый compensation range и notice period.",
        requiresApproval: false,
        createdAt: timestamp,
      },
      {
        id: "msg-a2",
        sessionId: "session-alina",
        senderType: "candidate",
        content: "Ориентируюсь на 6.5k-7k EUR net, notice period 30 days.",
        requiresApproval: false,
        createdAt: timestamp,
      },
      {
        id: "msg-m1",
        sessionId: "session-mark",
        senderType: "ai",
        content: "Расскажи, пожалуйста, про production async pipelines и monitoring stack.",
        requiresApproval: false,
        createdAt: timestamp,
      },
      {
        id: "msg-m2",
        sessionId: "session-mark",
        senderType: "candidate",
        content: "Могу описать, но сначала хочу понять salary band и remote policy.",
        requiresApproval: true,
        createdAt: timestamp,
      },
    ],
  };
}

async function persistStore(store: AtsStore) {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

export async function ensureStoreSeeded() {
  try {
    await fs.access(STORE_PATH);
  } catch {
    await persistStore(createInitialStore());
  }
}

export async function readStore(): Promise<AtsStore> {
  await ensureStoreSeeded();
  const raw = await fs.readFile(STORE_PATH, "utf8");
  return JSON.parse(raw) as AtsStore;
}

export async function mutateStore<T>(mutator: (store: AtsStore) => T | Promise<T>): Promise<T> {
  const run = mutationQueue.then(async () => {
    const store = await readStore();
    const result = await mutator(store);
    await persistStore(store);
    return result;
  });

  mutationQueue = run.then(() => undefined, () => undefined);
  return run;
}

function sortNewestFirst<T extends { createdAt: string }>(items: T[]) {
  return [...items].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

function sortOldestFirst<T extends { createdAt: string }>(items: T[]) {
  return [...items].sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}

function buildIndexes(store: AtsStore) {
  return {
    workspacesById: new Map(store.workspaces.map((item) => [item.id, item])),
    jobsById: new Map(store.jobs.map((item) => [item.id, item])),
    stagesById: new Map(store.pipelineStages.map((item) => [item.id, item])),
    candidatesById: new Map(store.candidates.map((item) => [item.id, item])),
    profilesByCandidateId: new Map(store.candidateProfiles.map((item) => [item.candidateId, item])),
    playbooksById: new Map(store.playbooks.map((item) => [item.id, item])),
  };
}

function getApplicationsForJob(store: AtsStore, jobId: string) {
  return sortNewestFirst(store.applications.filter((application) => application.jobId === jobId));
}

function getApplicationsForCandidate(store: AtsStore, candidateId: string) {
  return sortNewestFirst(store.applications.filter((application) => application.candidateId === candidateId));
}

function getMessagesForSession(store: AtsStore, sessionId: string) {
  return sortNewestFirst(store.conversationMessages.filter((message) => message.sessionId === sessionId));
}

function getSessionsForPlaybook(store: AtsStore, playbookId: string) {
  return sortNewestFirst(store.conversationSessions.filter((session) => session.playbookId === playbookId));
}

function getRecommendationsForApplication(store: AtsStore, applicationId: string) {
  return sortNewestFirst(
    store.decisionRecommendations.filter((recommendation) => recommendation.applicationId === applicationId),
  );
}

function getInsightsForApplication(store: AtsStore, applicationId: string) {
  return sortNewestFirst(store.candidateInsights.filter((insight) => insight.applicationId === applicationId));
}

export async function getJobsView() {
  const store = await readStore();

  return sortNewestFirst(store.jobs).map((job) => ({
    ...job,
    applications: getApplicationsForJob(store, job.id).map((application) => ({
      id: application.id,
      status: application.status,
    })),
    scorecards: sortNewestFirst(store.jobScorecards.filter((scorecard) => scorecard.jobId === job.id)),
    pipelineStages: sortOldestFirst(store.pipelineStages.filter((stage) => stage.jobId === job.id)).map((stage) => ({
      id: stage.id,
      name: stage.name,
      kind: stage.kind,
      orderIndex: stage.orderIndex,
    })),
  }));
}

export async function getJobSummary() {
  const store = await readStore();
  const activeJobs = store.jobs.filter((job) => job.status === "active").length;
  const totalApplications = store.applications.length;
  const screeningApplications = store.applications.filter((application) => application.status === "screening").length;

  return {
    activeJobs,
    totalApplications,
    screeningApplications,
  };
}

export async function getCandidatesView() {
  const store = await readStore();
  const { jobsById, stagesById, profilesByCandidateId } = buildIndexes(store);

  return sortNewestFirst(store.candidates).map((candidate) => ({
    ...candidate,
    profile: profilesByCandidateId.get(candidate.id)
      ? {
          skills: profilesByCandidateId.get(candidate.id)?.skills,
          workPreference: profilesByCandidateId.get(candidate.id)?.workPreference,
        }
      : null,
    applications: getApplicationsForCandidate(store, candidate.id).map((application) => ({
      ...application,
      job: jobsById.get(application.jobId)
        ? {
            id: jobsById.get(application.jobId)?.id,
            title: jobsById.get(application.jobId)?.title,
          }
        : null,
      currentStage: application.currentStageId && stagesById.get(application.currentStageId)
        ? {
            id: stagesById.get(application.currentStageId)?.id,
            name: stagesById.get(application.currentStageId)?.name,
            kind: stagesById.get(application.currentStageId)?.kind,
          }
        : null,
      insights: getInsightsForApplication(store, application.id).slice(0, 1).map((insight) => ({
        id: insight.id,
        type: insight.type,
        content: insight.content,
        confidence: insight.confidence,
      })),
      recommendations: getRecommendationsForApplication(store, application.id).slice(0, 1).map((recommendation) => ({
        id: recommendation.id,
        recommendedAction: recommendation.recommendedAction,
        why: recommendation.why,
        confidence: recommendation.confidence,
      })),
    })),
  }));
}

export async function getCandidateSummary() {
  const store = await readStore();

  return {
    totalCandidates: store.candidates.length,
    screeningCandidates: store.candidates.filter((candidate) =>
      store.applications.some(
        (application) => application.candidateId === candidate.id && application.status === "screening",
      ),
    ).length,
    strongFitCandidates: store.candidates.filter((candidate) =>
      store.applications.some(
        (application) => application.candidateId === candidate.id && application.fitLevel === "strong",
      ),
    ).length,
  };
}

export async function getConversationSessionsView() {
  const store = await readStore();
  const { candidatesById, jobsById, playbooksById } = buildIndexes(store);

  return sortNewestFirst(store.conversationSessions).map((session) => {
    const application = session.applicationId
      ? store.applications.find((item) => item.id === session.applicationId)
      : undefined;
    const playbook = session.playbookId ? playbooksById.get(session.playbookId) : undefined;
    const job = application ? jobsById.get(application.jobId) : undefined;

    return {
      ...session,
      candidate: candidatesById.get(session.candidateId)
        ? {
            id: candidatesById.get(session.candidateId)?.id,
            fullName: candidatesById.get(session.candidateId)?.fullName,
            headline: candidatesById.get(session.candidateId)?.headline,
            currentCompany: candidatesById.get(session.candidateId)?.currentCompany,
            location: candidatesById.get(session.candidateId)?.location,
          }
        : null,
      application: application
        ? {
            id: application.id,
            status: application.status,
            fitLevel: application.fitLevel,
            recommendedNextStep: application.recommendedNextStep,
            job: job
              ? {
                  id: job.id,
                  title: job.title,
                }
              : null,
          }
        : null,
      playbook: playbook
        ? {
            id: playbook.id,
            name: playbook.name,
            channelType: playbook.channelType,
            status: playbook.status,
          }
        : null,
      messages: getMessagesForSession(store, session.id).slice(0, 2).map((message) => ({
        id: message.id,
        senderType: message.senderType,
        content: message.content,
        requiresApproval: message.requiresApproval,
        createdAt: message.createdAt,
      })),
    };
  });
}

export async function getConversationSummary() {
  const store = await readStore();

  return {
    totalSessions: store.conversationSessions.length,
    activeSessions: store.conversationSessions.filter((session) => session.status === "active").length,
    approvalQueue: store.conversationMessages.filter((message) => message.requiresApproval).length,
    escalations: store.conversationSessions.filter((session) => session.status === "escalated").length,
  };
}

export async function getImportSourcesView() {
  const store = await readStore();
  const { candidatesById, jobsById } = buildIndexes(store);

  return sortOldestFirst(store.candidateSources).map((source) => ({
    ...source,
    applications: sortNewestFirst(
      store.applications.filter((application) => application.sourceId === source.id),
    ).map((application) => ({
      id: application.id,
      candidate: candidatesById.get(application.candidateId)
        ? {
            id: candidatesById.get(application.candidateId)?.id,
            fullName: candidatesById.get(application.candidateId)?.fullName,
          }
        : null,
      job: jobsById.get(application.jobId)
        ? {
            id: jobsById.get(application.jobId)?.id,
            title: jobsById.get(application.jobId)?.title,
          }
        : null,
    })),
    ingestions: sortNewestFirst(store.ingestions.filter((ingestion) => ingestion.sourceId === source.id)).map((ingestion) => ({
      id: ingestion.id,
      status: ingestion.status,
      payloadType: ingestion.payloadType,
      candidateId: ingestion.candidateId,
      jobId: ingestion.jobId,
      createdAt: ingestion.createdAt,
    })),
  }));
}

export async function getImportSummary() {
  const store = await readStore();

  return {
    sourceCount: store.candidateSources.length,
    linkedApplications: store.applications.filter((application) => Boolean(application.sourceId)).length,
    totalIngestions: store.ingestions.length,
    pendingReview: store.ingestions.filter(
      (ingestion) => ingestion.status === "pending" || ingestion.status === "duplicate_review",
    ).length,
  };
}

export async function getPlaybooksView() {
  const store = await readStore();
  const { jobsById, stagesById } = buildIndexes(store);

  return sortNewestFirst(store.playbooks).map((playbook) => ({
    ...playbook,
    job: playbook.jobId && jobsById.get(playbook.jobId)
      ? {
          id: jobsById.get(playbook.jobId)?.id,
          title: jobsById.get(playbook.jobId)?.title,
        }
      : null,
    targetStage: playbook.targetStageId && stagesById.get(playbook.targetStageId)
      ? {
          id: stagesById.get(playbook.targetStageId)?.id,
          name: stagesById.get(playbook.targetStageId)?.name,
          kind: stagesById.get(playbook.targetStageId)?.kind,
        }
      : null,
    sessions: getSessionsForPlaybook(store, playbook.id).map((session) => ({
      id: session.id,
      status: session.status,
      channelType: session.channelType,
      messages: getMessagesForSession(store, session.id).map((message) => ({
        id: message.id,
        requiresApproval: message.requiresApproval,
      })),
    })),
  }));
}

export async function getPlaybookSummary() {
  const store = await readStore();
  const playbookIds = new Set(store.playbooks.map((playbook) => playbook.id));
  const sessions = store.conversationSessions.filter((session) => session.playbookId && playbookIds.has(session.playbookId));
  const approvals = sessions.reduce(
    (sum, session) => sum + store.conversationMessages.filter((message) => message.sessionId === session.id && message.requiresApproval).length,
    0,
  );

  return {
    totalPlaybooks: store.playbooks.length,
    activePlaybooks: store.playbooks.filter((playbook) => playbook.status === "active").length,
    liveSessions: sessions.length,
    approvals,
  };
}

export async function getPipelineBoardView() {
  const store = await readStore();
  const { candidatesById } = buildIndexes(store);

  return sortNewestFirst(store.jobs).map((job) => ({
    ...job,
    pipelineStages: sortOldestFirst(store.pipelineStages.filter((stage) => stage.jobId === job.id)).map((stage) => ({
      ...stage,
      applications: sortNewestFirst(
        store.applications.filter((application) => application.jobId === job.id && application.currentStageId === stage.id),
      ).map((application) => ({
        id: application.id,
        status: application.status,
        fitLevel: application.fitLevel,
        recommendedNextStep: application.recommendedNextStep,
        candidate: candidatesById.get(application.candidateId)
          ? {
              id: candidatesById.get(application.candidateId)?.id,
              fullName: candidatesById.get(application.candidateId)?.fullName,
              headline: candidatesById.get(application.candidateId)?.headline,
              currentCompany: candidatesById.get(application.candidateId)?.currentCompany,
              location: candidatesById.get(application.candidateId)?.location,
            }
          : null,
        recommendations: getRecommendationsForApplication(store, application.id).slice(0, 1).map((recommendation) => ({
          id: recommendation.id,
          fitLevel: recommendation.fitLevel,
          confidence: recommendation.confidence,
          why: recommendation.why,
        })),
      })),
    })),
  }));
}

export async function getPipelineSummary() {
  const store = await readStore();
  const stagesById = new Map(store.pipelineStages.map((stage) => [stage.id, stage]));

  return {
    openJobs: store.jobs.length,
    totalApplications: store.applications.length,
    screeningLoad: store.applications.filter((application) => {
      const stage = application.currentStageId ? stagesById.get(application.currentStageId) : undefined;
      return application.status === "screening" || stage?.kind === "screening";
    }).length,
    strongFits: store.applications.filter((application) => application.fitLevel === "strong").length,
  };
}

export async function createJobRecord(input: {
  workspaceSlug: string;
  title: string;
  department?: string;
  location?: string;
  employmentType?: string;
  descriptionRaw?: string;
}) {
  return mutateStore((store) => {
    const workspace = store.workspaces.find((item) => item.slug === input.workspaceSlug);

    if (!workspace) {
      throw new Error(`Workspace ${input.workspaceSlug} was not found.`);
    }

    const timestamp = nowIso();
    const jobId = createId("job");

    store.jobs.push({
      id: jobId,
      workspaceId: workspace.id,
      title: input.title,
      department: input.department,
      location: input.location,
      employmentType: input.employmentType,
      descriptionRaw: input.descriptionRaw,
      status: "draft",
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    store.pipelineStages.push(...defaultStages(jobId));

    store.jobScorecards.push({
      id: createId("scorecard"),
      jobId,
      summary: "Черновой AI scorecard. Дальше сюда подключим реальную генерацию.",
      mustHaves: ["Определить must-have навыки"],
      niceToHaves: ["Определить дополнительные сигналы"],
      redFlags: ["Определить стоп-факторы"],
      screeningQuestions: ["Почему вам интересна роль?"],
      interviewFocusAreas: ["Проверить глубину релевантного опыта"],
      version: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    return { id: jobId };
  });
}

export async function createCandidateRecord(input: {
  workspaceSlug: string;
  fullName: string;
  email?: string;
  phone?: string;
  location?: string;
  headline?: string;
  linkedinUrl?: string;
  summary?: string;
  seniority?: string;
  currentCompany?: string;
  yearsExperience?: number;
  skills?: string[];
  workPreference?: string;
  jobId?: string;
  sourceId?: string;
  currentStageId?: string;
  fitLevel?: string;
  fitConfidence?: string;
  recommendedNextStep?: string;
}) {
  return mutateStore((store) => {
    const workspace = store.workspaces.find((item) => item.slug === input.workspaceSlug);

    if (!workspace) {
      throw new Error(`Workspace ${input.workspaceSlug} was not found.`);
    }

    const timestamp = nowIso();
    const candidateId = createId("cand");

    store.candidates.push({
      id: candidateId,
      workspaceId: workspace.id,
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      location: input.location,
      headline: input.headline,
      linkedinUrl: input.linkedinUrl,
      summary: input.summary,
      seniority: input.seniority,
      currentCompany: input.currentCompany,
      yearsExperience: input.yearsExperience,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    if ((input.skills && input.skills.length > 0) || input.workPreference) {
      store.candidateProfiles.push({
        id: createId("profile"),
        candidateId,
        skills: input.skills,
        workPreference: input.workPreference,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }

    if (input.jobId) {
      const job = store.jobs.find((item) => item.id === input.jobId && item.workspaceId === workspace.id);

      if (!job) {
        throw new Error("Job was not found in this workspace.");
      }

      const stages = sortOldestFirst(store.pipelineStages.filter((stage) => stage.jobId === job.id));
      const chosenStage = input.currentStageId
        ? stages.find((stage) => stage.id === input.currentStageId)
        : stages.find((stage) => stage.kind === "screening") ?? stages[0];

      const source = input.sourceId
        ? store.candidateSources.find((item) => item.id === input.sourceId && item.workspaceId === workspace.id)
        : undefined;

      if (input.sourceId && !source) {
        throw new Error("Source was not found in this workspace.");
      }

      store.applications.push({
        id: createId("app"),
        candidateId,
        jobId: job.id,
        currentStageId: chosenStage?.id,
        sourceId: source?.id,
        status: chosenStage ? mapStageKindToStatus(chosenStage.kind) ?? "new" : "new",
        fitLevel: input.fitLevel,
        fitConfidence: input.fitConfidence,
        recommendedNextStep: input.recommendedNextStep,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }

    return { id: candidateId };
  });
}

export async function updateCandidateRecord(input: {
  candidateId: string;
  fullName: string;
  email?: string;
  phone?: string;
  location?: string;
  headline?: string;
  linkedinUrl?: string;
  summary?: string;
  seniority?: string;
  currentCompany?: string;
  yearsExperience?: number;
  skills?: string[];
  workPreference?: string;
}) {
  return mutateStore((store) => {
    const candidate = store.candidates.find((item) => item.id === input.candidateId);

    if (!candidate) {
      throw new Error("Candidate not found.");
    }

    candidate.fullName = input.fullName;
    candidate.email = input.email;
    candidate.phone = input.phone;
    candidate.location = input.location;
    candidate.headline = input.headline;
    candidate.linkedinUrl = input.linkedinUrl;
    candidate.summary = input.summary;
    candidate.seniority = input.seniority;
    candidate.currentCompany = input.currentCompany;
    candidate.yearsExperience = input.yearsExperience;
    candidate.updatedAt = nowIso();

    const existingProfile = store.candidateProfiles.find((item) => item.candidateId === candidate.id);
    const shouldKeepProfile = (input.skills && input.skills.length > 0) || input.workPreference;

    if (existingProfile && shouldKeepProfile) {
      existingProfile.skills = input.skills;
      existingProfile.workPreference = input.workPreference;
      existingProfile.updatedAt = nowIso();
    } else if (existingProfile && !shouldKeepProfile) {
      store.candidateProfiles = store.candidateProfiles.filter((item) => item.id !== existingProfile.id);
    } else if (!existingProfile && shouldKeepProfile) {
      const timestamp = nowIso();
      store.candidateProfiles.push({
        id: createId("profile"),
        candidateId: candidate.id,
        skills: input.skills,
        workPreference: input.workPreference,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }
  });
}

export async function deleteCandidateRecord(candidateId: string) {
  return mutateStore((store) => {
    const candidate = store.candidates.find((item) => item.id === candidateId);

    if (!candidate) {
      throw new Error("Candidate not found.");
    }

    const applicationIds = store.applications
      .filter((application) => application.candidateId === candidateId)
      .map((application) => application.id);
    const sessionIds = store.conversationSessions
      .filter((session) => session.candidateId === candidateId)
      .map((session) => session.id);

    store.candidates = store.candidates.filter((item) => item.id !== candidateId);
    store.candidateProfiles = store.candidateProfiles.filter((item) => item.candidateId !== candidateId);
    store.applications = store.applications.filter((item) => item.candidateId !== candidateId);
    store.candidateInsights = store.candidateInsights.filter((item) => item.candidateId !== candidateId);
    store.decisionRecommendations = store.decisionRecommendations.filter(
      (item) => !applicationIds.includes(item.applicationId),
    );
    store.ingestions = store.ingestions.filter(
      (item) => item.candidateId !== candidateId && (!item.applicationId || !applicationIds.includes(item.applicationId)),
    );
    store.conversationSessions = store.conversationSessions.filter((item) => item.candidateId !== candidateId);
    store.conversationMessages = store.conversationMessages.filter((item) => !sessionIds.includes(item.sessionId));
  });
}

export async function createCandidateSourceRecord(input: {
  workspaceSlug: string;
  label: string;
  type: string;
}) {
  return mutateStore((store) => {
    const workspace = store.workspaces.find((item) => item.slug === input.workspaceSlug);

    if (!workspace) {
      throw new Error(`Workspace ${input.workspaceSlug} was not found.`);
    }

    const timestamp = nowIso();
    const sourceId = createId("source");

    store.candidateSources.push({
      id: sourceId,
      workspaceId: workspace.id,
      label: input.label,
      type: input.type,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    return { id: sourceId };
  });
}

export async function updateCandidateSourceRecord(input: {
  sourceId: string;
  label: string;
  type: string;
}) {
  return mutateStore((store) => {
    const source = store.candidateSources.find((item) => item.id === input.sourceId);

    if (!source) {
      throw new Error("Source not found.");
    }

    source.label = input.label;
    source.type = input.type;
    source.updatedAt = nowIso();
  });
}

export async function deleteCandidateSourceRecord(sourceId: string) {
  return mutateStore((store) => {
    const source = store.candidateSources.find((item) => item.id === sourceId);

    if (!source) {
      throw new Error("Source not found.");
    }

    store.candidateSources = store.candidateSources.filter((item) => item.id !== sourceId);
    store.ingestions = store.ingestions.filter((item) => item.sourceId !== sourceId);
    store.applications = store.applications.map((application) =>
      application.sourceId === sourceId
        ? {
            ...application,
            sourceId: undefined,
            updatedAt: nowIso(),
          }
        : application,
    );
  });
}

export async function createIngestionRecord(input: {
  workspaceSlug: string;
  sourceId?: string;
  jobId?: string;
  candidateId?: string;
  status: string;
  payloadType: string;
}) {
  return mutateStore((store) => {
    const workspace = store.workspaces.find((item) => item.slug === input.workspaceSlug);

    if (!workspace) {
      throw new Error(`Workspace ${input.workspaceSlug} was not found.`);
    }

    const source = input.sourceId
      ? store.candidateSources.find((item) => item.id === input.sourceId && item.workspaceId === workspace.id)
      : undefined;
    const job = input.jobId
      ? store.jobs.find((item) => item.id === input.jobId && item.workspaceId === workspace.id)
      : undefined;
    const candidate = input.candidateId
      ? store.candidates.find((item) => item.id === input.candidateId && item.workspaceId === workspace.id)
      : undefined;

    if (input.sourceId && !source) {
      throw new Error("Source was not found in this workspace.");
    }

    if (input.jobId && !job) {
      throw new Error("Job was not found in this workspace.");
    }

    if (input.candidateId && !candidate) {
      throw new Error("Candidate was not found in this workspace.");
    }

    const application = candidate && job
      ? store.applications.find((item) => item.candidateId === candidate.id && item.jobId === job.id)
      : undefined;
    const timestamp = nowIso();

    store.ingestions.push({
      id: createId("ingestion"),
      workspaceId: workspace.id,
      sourceId: source?.id,
      jobId: job?.id,
      candidateId: candidate?.id,
      applicationId: application?.id,
      status: input.status,
      payloadType: input.payloadType,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  });
}

export async function updateIngestionRecord(input: {
  ingestionId: string;
  status: string;
  payloadType: string;
}) {
  return mutateStore((store) => {
    const ingestion = store.ingestions.find((item) => item.id === input.ingestionId);

    if (!ingestion) {
      throw new Error("Ingestion record not found.");
    }

    ingestion.status = input.status;
    ingestion.payloadType = input.payloadType;
    ingestion.updatedAt = nowIso();
  });
}

export async function deleteIngestionRecord(ingestionId: string) {
  return mutateStore((store) => {
    const ingestion = store.ingestions.find((item) => item.id === ingestionId);

    if (!ingestion) {
      throw new Error("Ingestion record not found.");
    }

    store.ingestions = store.ingestions.filter((item) => item.id !== ingestionId);
  });
}

export async function createPlaybookRecord(input: {
  workspaceSlug: string;
  name: string;
  targetStageId?: string;
  channelType?: string;
  objective?: string;
  instructions?: string;
  autonomyMode?: string;
}) {
  return mutateStore((store) => {
    const workspace = store.workspaces.find((item) => item.slug === input.workspaceSlug);

    if (!workspace) {
      throw new Error(`Workspace ${input.workspaceSlug} was not found.`);
    }

    let jobId: string | undefined;

    if (input.targetStageId) {
      const stage = store.pipelineStages.find((item) => item.id === input.targetStageId);
      const job = stage ? store.jobs.find((item) => item.id === stage.jobId) : undefined;

      if (!stage || !job || job.workspaceId !== workspace.id) {
        throw new Error("Target stage was not found in this workspace.");
      }

      jobId = job.id;
    }

    const timestamp = nowIso();

    store.playbooks.push({
      id: createId("playbook"),
      workspaceId: workspace.id,
      jobId,
      targetStageId: input.targetStageId,
      name: input.name,
      channelType: input.channelType,
      objective: input.objective,
      instructions: input.instructions,
      autonomyMode: input.autonomyMode ?? "guardrailed",
      status: "active",
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  });
}

export async function advanceApplicationStageRecord(input: { applicationId: string; nextStageId: string }) {
  return mutateStore((store) => {
    const application = store.applications.find((item) => item.id === input.applicationId);

    if (!application) {
      throw new Error("Application not found.");
    }

    const stage = store.pipelineStages.find(
      (item) => item.id === input.nextStageId && item.jobId === application.jobId,
    );

    if (!stage) {
      throw new Error("Target stage not found for this job.");
    }

    application.currentStageId = stage.id;
    application.status = mapStageKindToStatus(stage.kind) ?? application.status;
    application.updatedAt = nowIso();
  });
}
