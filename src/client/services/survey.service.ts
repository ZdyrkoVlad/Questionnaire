import { Injectable } from '../core/injectable.decorator';

export interface Question {
  id: string;
  title: string;
  category: string;
  description: string;
  minScore: number;
  maxScore: number;
  minLabel: string;
  maxLabel: string;
}

export interface ScoreDistribution {
  score: number;
  count: number;
  percentage: number;
}

export interface QuestionStat {
  questionId: string;
  title: string;
  category: string;
  count: number;
  averageScore: number;
  distribution: ScoreDistribution[];
}

export interface RecentFeedback {
  respondent: string;
  feedback: string;
  timestamp: string;
}

export interface SurveyResults {
  totalResponses: number;
  overallAverage: number;
  questionStats: QuestionStat[];
  recentFeedback: RecentFeedback[];
}

export interface SubmitPayload {
  answers: { questionId: string; score: number }[];
  respondentName?: string;
  feedback?: string;
}

export type ActiveView = 'survey' | 'results';

@Injectable()
export class SurveyService {
  private questions: Question[] = [];
  private selectedScores: Map<string, number> = new Map();
  private currentView: ActiveView = 'survey';
  private cachedResults: SurveyResults | null = null;

  // Listeners for reactive updates
  private viewListeners = new Set<(view: ActiveView) => void>();
  private scoreListeners = new Set<(scores: Map<string, number>) => void>();

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

  setScore(questionId: string, score: number): void {
    this.selectedScores.set(questionId, score);
    this.notifyScoreListeners();
  }

  getScore(questionId: string): number | undefined {
    return this.selectedScores.get(questionId);
  }

  getSelectedScores(): Map<string, number> {
    return new Map(this.selectedScores);
  }

  getAnsweredCount(): number {
    return this.selectedScores.size;
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
    this.cachedResults = null; // Invalidate cache
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

  onScoreChange(fn: (scores: Map<string, number>) => void): () => void {
    this.scoreListeners.add(fn);
    return () => this.scoreListeners.delete(fn);
  }

  private notifyScoreListeners(): void {
    const copy = new Map(this.selectedScores);
    this.scoreListeners.forEach((fn) => fn(copy));
  }
}
