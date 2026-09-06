import { Injectable } from '../core/injectable.decorator';

// ─── QGEval Metric Definitions ──────────────────────────────────────────────

export interface QGEvalMetricDef {
  id: string;
  label: string;
  labelUk: string;
  group: 'linguistic' | 'task';
  description: string;
}

export const QGEVAL_METRICS: QGEvalMetricDef[] = [
  // Linguistic dimensions
  { id: 'fluency',            label: 'Fluency',            labelUk: 'Природність',             group: 'linguistic', description: 'How well-formed, grammatically correct, logically coherent and comprehensible the question is.' },
  { id: 'clarity',            label: 'Clarity',            labelUk: 'Чіткість',                group: 'linguistic', description: 'Whether the question is stated clearly and unambiguously, avoiding over-generalisation or vagueness.' },
  { id: 'conciseness',        label: 'Conciseness',        labelUk: 'Лаконічність',            group: 'linguistic', description: 'Whether the question is concise and does not contain redundancy or duplicate information.' },
  // Task-oriented dimensions
  { id: 'relevance',          label: 'Relevance',          labelUk: 'Релевантність',           group: 'task',       description: 'How relevant the question is to the provided image (domain) and dataset topic.' },
  { id: 'consistency',        label: 'Consistency',        labelUk: 'Контекстна узгодженість', group: 'task',       description: 'Whether the information stated in the question itself is consistent with the provided image.' },
  { id: 'answerability',      label: 'Answerability',      labelUk: 'Можливість відповісти',   group: 'task',       description: 'Whether a clear and unambiguous answer can be found relying solely on the provided image.' },
  { id: 'answer_consistency', label: 'Answer Consistency', labelUk: 'Узгодженість відповіді',  group: 'task',       description: 'Whether the generated question can be successfully answered using the target answer provided to the model.' },
];

export type MetricId = 'fluency' | 'clarity' | 'conciseness' | 'relevance' | 'consistency' | 'answerability' | 'answer_consistency';
export type MetricScore = 1 | 2 | 3;
export type QGEvalScores = Partial<Record<MetricId, MetricScore>>;

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface Question {
  id: string;
  numericId?: number;
  title: string;
  category: string;
  description: string;
  imageContext: string;
  targetAnswer: string;
}

export interface ScoreDistribution {
  score: number;
  count: number;
  percentage: number;
}

export interface MetricStat {
  metricId: string;
  label: string;
  labelUk: string;
  averageScore: number;
  distribution: ScoreDistribution[];
}

export interface QuestionStat {
  questionId: string;
  title: string;
  category: string;
  count: number;
  overallAverage: number;
  metrics: MetricStat[];
}

export interface GlobalMetricAverage {
  metricId: string;
  label: string;
  labelUk: string;
  averageScore: number;
}

export interface RecentFeedback {
  respondent: string;
  feedback: string;
  timestamp: string;
}

export const APP_VERSION = '1.0.0';

export interface SurveyResults {
  version?: string;
  totalResponses: number;
  overallAverage: number;
  globalMetricAverages: GlobalMetricAverage[];
  questionStats: QuestionStat[];
  recentFeedback: RecentFeedback[];
}

export interface SubmitPayload {
  version?: string;
  answers: { questionId: string; scores: QGEvalScores }[];
  respondentName?: string;
  feedback?: string;
}

export type ActiveView = 'survey' | 'results';

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class SurveyService {
  private questions: Question[] = [];
  /** Map<questionId, QGEvalScores> */
  private selectedScores: Map<string, QGEvalScores> = new Map();
  private currentView: ActiveView = 'survey';
  private cachedResults: SurveyResults | null = null;

  // Reactive listeners
  private viewListeners = new Set<(view: ActiveView) => void>();
  private scoreListeners = new Set<(scores: Map<string, QGEvalScores>) => void>();

  async getQuestions(): Promise<Question[]> {
    if (this.questions.length > 0) {
      return this.questions;
    }
    const res = await fetch('/api/survey/questions');
    if (!res.ok) {
      throw new Error(`Failed to load questionnaire items: ${res.statusText}`);
    }
    this.questions = await res.json();
    return this.questions;
  }

  /** Set a single metric score for a question */
  setMetricScore(questionId: string, metricId: MetricId, score: MetricScore): void {
    const existing = this.selectedScores.get(questionId) ?? {};
    this.selectedScores.set(questionId, { ...existing, [metricId]: score });
    this.notifyScoreListeners();
  }

  /** Get all QGEval scores for a question */
  getScores(questionId: string): QGEvalScores {
    return this.selectedScores.get(questionId) ?? {};
  }

  /** Get a single metric score for a question */
  getMetricScore(questionId: string, metricId: MetricId): MetricScore | undefined {
    return (this.selectedScores.get(questionId) ?? {})[metricId];
  }

  /** Returns true when all 7 metrics have been rated for the given question */
  isQuestionFullyAnswered(questionId: string): boolean {
    const scores = this.selectedScores.get(questionId);
    if (!scores) return false;
    return QGEVAL_METRICS.every((m) => scores[m.id as MetricId] !== undefined);
  }

  getSelectedScores(): Map<string, QGEvalScores> {
    return new Map(this.selectedScores);
  }

  /** Number of questions where all 7 metrics have been rated */
  getAnsweredCount(): number {
    return this.questions.filter((q) => this.isQuestionFullyAnswered(q.id)).length;
  }

  getTotalQuestionsCount(): number {
    return this.questions.length;
  }

  resetScores(): void {
    this.selectedScores.clear();
    this.notifyScoreListeners();
  }

  async submitSurvey(payload: SubmitPayload): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/survey/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Submission failed');
    }

    const data = await res.json();
    this.cachedResults = null;
    return data;
  }

  async getResults(): Promise<SurveyResults> {
    const res = await fetch('/api/survey/results');
    if (!res.ok) {
      throw new Error(`Failed to fetch results: ${res.statusText}`);
    }
    this.cachedResults = await res.json();
    return this.cachedResults;
  }

  setView(view: ActiveView): void {
    this.currentView = view;
    this.viewListeners.forEach((fn) => fn(view));
  }

  getView(): ActiveView {
    return this.currentView;
  }

  onViewChange(fn: (view: ActiveView) => void): () => void {
    this.viewListeners.add(fn);
    return () => this.viewListeners.delete(fn);
  }

  onScoreChange(fn: (scores: Map<string, QGEvalScores>) => void): () => void {
    this.scoreListeners.add(fn);
    return () => this.scoreListeners.delete(fn);
  }

  private notifyScoreListeners(): void {
    const copy = new Map(this.selectedScores);
    this.scoreListeners.forEach((fn) => fn(copy));
  }
}
