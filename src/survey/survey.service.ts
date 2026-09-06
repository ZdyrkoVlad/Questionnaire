import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { SubmitSurveyDto, AnswerDto } from './dto/submit-survey.dto';
import { SaveLoraAnswerDto } from './dto/save-lora-answer.dto';
import { VqaQuestionService } from '../database/services/vqa-question.service';
import { LoraAnswerService, LoraAnswerResult } from '../database/services/lora-answer.service';

export const APP_VERSION = '1.0.0';

export const QGEVAL_METRICS = [
  { id: 'fluency',            label: 'Fluency',            labelUk: 'Природність',             group: 'linguistic', description: 'How well-formed, grammatically correct, logically coherent and comprehensible the question is.' },
  { id: 'clarity',            label: 'Clarity',            labelUk: 'Чіткість',                group: 'linguistic', description: 'Whether the question is stated clearly and unambiguously, avoiding over-generalisation or vagueness.' },
  { id: 'conciseness',        label: 'Conciseness',        labelUk: 'Лаконічність',            group: 'linguistic', description: 'Whether the question is concise and does not contain redundancy or duplicate information.' },
  { id: 'relevance',          label: 'Relevance',          labelUk: 'Релевантність',           group: 'task',       description: 'How relevant the question is to the provided image (domain) and dataset topic.' },
  { id: 'consistency',        label: 'Consistency',        labelUk: 'Контекстна узгодженість', group: 'task',       description: 'Whether the information stated in the question itself is consistent with the provided image.' },
  { id: 'answerability',      label: 'Answerability',      labelUk: 'Можливість відповісти',   group: 'task',       description: 'Whether a clear and unambiguous answer can be found relying solely on the provided image.' },
  { id: 'answer_consistency', label: 'Answer Consistency', labelUk: 'Узгодженість відповіді',  group: 'task',       description: 'Whether the generated question can be successfully answered using the target answer provided to the model.' },
] as const;

export type MetricId = typeof QGEVAL_METRICS[number]['id'];

/** Shape returned to the client */
export interface Question {
  id: string;
  numericId: number;
  title: string;
  category: string;
  description: string;
  imageContext: string;
  targetAnswer: string;
}

export interface MetricStat {
  metricId: string;
  label: string;
  labelUk: string;
  averageScore: number;
  distribution: { score: number; count: number; percentage: number }[];
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

export interface SurveyResponse {
  id: string;
  timestamp: string;
  answers: AnswerDto[];
  feedback?: string;
  respondentName?: string;
}

@Injectable()
export class SurveyService {
  private readonly logger = new Logger(SurveyService.name);
  private readonly responses: SurveyResponse[] = [];

  constructor(
    private readonly vqaQuestionService: VqaQuestionService,
    private readonly loraAnswerService: LoraAnswerService,
  ) {}

  /**
   * Returns a single random question from the LORA_question collection.
   */
  async getQuestions(): Promise<Question[]> {
    const total = await this.vqaQuestionService.count();
    this.logger.log(`LORA_question total: ${total} questions. Picking 1 at random…`);

    const doc = await this.vqaQuestionService.findRandom();

    if (!doc) {
      this.logger.warn('LORA_question collection appears to be empty.');
      return [];
    }

    this.logger.log(`Selected question #${doc.id}: "${doc.question.slice(0, 60)}…"`);

    const question: Question = {
      id: doc.id.toString(),
      numericId: doc.id,
      title: `Question #${doc.id}`,
      category: 'LORA VQA',
      description: doc.question,
      imageContext: '',
      targetAnswer: doc.answer,
    };

    return [question];
  }

  /** GET /api/survey/questions/count */
  async getCount(): Promise<{ total: number; version: string }> {
    const total = await this.vqaQuestionService.count();
    return { total, version: APP_VERSION };
  }

  /**
   * Returns a specific question by numeric id or index from the database.
   */
  async getQuestionById(id: number): Promise<Question | null> {
    // 1. Try finding by exact numeric id field
    let doc = await this.vqaQuestionService.findById(id);
    // 2. Fallback: try id - 1 (in case DB IDs are 0-indexed)
    if (!doc && id > 0) {
      doc = await this.vqaQuestionService.findById(id - 1);
    }
    // 3. Fallback: try by collection offset
    if (!doc && id >= 1) {
      const page = await this.vqaQuestionService.findPage(id - 1, 1);
      if (page && page.length > 0) {
        doc = page[0];
      }
    }

    if (!doc) {
      return null;
    }

    return {
      id: doc.id.toString(),
      numericId: doc.id,
      title: `Question #${doc.id}`,
      category: 'LORA VQA',
      description: doc.question,
      imageContext: '',
      targetAnswer: doc.answer,
    };
  }

  /**
   * Saves a single answer directly into `LORA_answers` MongoDB collection.
   */
  async saveLoraAnswer(dto: SaveLoraAnswerDto): Promise<LoraAnswerResult> {
    const result = await this.loraAnswerService.create({
      id: dto.id,
      questionId: dto.questionId,
      question: dto.question,
      answer: dto.answer,
      imgUrl: dto.imgUrl,
      score: dto.score,
      respondentName: dto.respondentName,
      feedback: dto.feedback,
      version: dto.version || APP_VERSION,
    });
    return result;
  }

  /**
   * Submits survey responses and saves each answer to `LORA_answers` in MongoDB.
   */
  async submitResponse(dto: SubmitSurveyDto): Promise<{ success: boolean; responseId: string; savedCount: number; version: string; message: string }> {
    if (!dto.answers || dto.answers.length === 0) {
      throw new BadRequestException('At least one question score is required.');
    }

    const responseId = 'resp-' + Date.now();
    let savedCount = 0;

    for (const ans of dto.answers) {
      const numericId = parseInt(ans.questionId, 10);
      let questionText = `Question #${ans.questionId}`;
      let answerText = '';

      if (!isNaN(numericId)) {
        const qDoc = await this.vqaQuestionService.findById(numericId);
        if (qDoc) {
          questionText = qDoc.question;
          answerText = qDoc.answer;
        }
      }

      await this.loraAnswerService.create({
        id: numericId || undefined,
        questionId: ans.questionId,
        question: questionText,
        answer: answerText,
        score: ans.scores as any,
        respondentName: dto.respondentName?.trim() || 'Anonymous',
        feedback: dto.feedback?.trim(),
        version: APP_VERSION,
      });
      savedCount++;
    }

    const newResponse: SurveyResponse = {
      id: responseId,
      timestamp: new Date().toISOString(),
      answers: dto.answers,
      feedback: dto.feedback?.trim(),
      respondentName: dto.respondentName?.trim() || 'Anonymous',
    };
    this.responses.push(newResponse);

    this.logger.log(`Saved ${savedCount} answer(s) into LORA_answers collection in MongoDB.`);

    return {
      success: true,
      responseId,
      savedCount,
      version: APP_VERSION,
      message: 'Thank you! Your answers and ratings have been saved to LORA_answers.',
    };
  }

  async getResults() {
    const dbAnswers = await this.loraAnswerService.findAll();
    const totalResponses = dbAnswers.length;

    const questionIds = [...new Set(dbAnswers.map((a) => a.questionId.toString()))];

    const questionStats: QuestionStat[] = questionIds.map((qId) => {
      const answersForQ = dbAnswers.filter((a) => a.questionId.toString() === qId);
      const count = answersForQ.length;

      const metrics: MetricStat[] = QGEVAL_METRICS.map((metric) => {
        const scores = answersForQ.map((a) => (a.score as any)?.[metric.id] as number).filter((s) => typeof s === 'number');
        const sum = scores.reduce((acc, s) => acc + s, 0);
        const avg = count > 0 && scores.length > 0 ? parseFloat((sum / scores.length).toFixed(2)) : 0;

        const distribution = [1, 2, 3].map((s) => {
          const cnt = scores.filter((v) => v === s).length;
          return { score: s, count: cnt, percentage: scores.length > 0 ? Math.round((cnt / scores.length) * 100) : 0 };
        });

        return { metricId: metric.id, label: metric.label, labelUk: metric.labelUk, averageScore: avg, distribution };
      });

      const allScores = metrics.flatMap((m) =>
        m.distribution.flatMap((d) => Array(d.count).fill(d.score)),
      );
      const overallAverage =
        allScores.length > 0
          ? parseFloat((allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(2))
          : 0;

      return { questionId: qId, title: `Question #${qId}`, category: 'LORA VQA', count, overallAverage, metrics };
    });

    const globalMetricAverages: GlobalMetricAverage[] = QGEVAL_METRICS.map((metric) => {
      const allScores = dbAnswers
        .map((a) => (a.score as any)?.[metric.id] as number)
        .filter((s) => typeof s === 'number');
      const avg =
        allScores.length > 0
          ? parseFloat((allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(2))
          : 0;
      return { metricId: metric.id, label: metric.label, labelUk: metric.labelUk, averageScore: avg };
    });

    const recentFeedback = dbAnswers
      .filter((a) => a.feedback && a.feedback.length > 0)
      .slice(-5)
      .reverse()
      .map((a) => ({
        respondent: a.respondentName ?? 'Anonymous',
        feedback: a.feedback!,
        timestamp: a.createdAt ? new Date(a.createdAt).toISOString() : new Date().toISOString(),
      }));

    return { version: APP_VERSION, totalResponses, overallAverage: 0, globalMetricAverages, questionStats, recentFeedback };
  }
}
