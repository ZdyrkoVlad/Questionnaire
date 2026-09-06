import { Injectable, BadRequestException } from '@nestjs/common';
import { SubmitSurveyDto, AnswerDto, QGEvalScoresDto } from './dto/submit-survey.dto';

export const QGEVAL_METRICS = [
  // Linguistic dimensions
  { id: 'fluency',           label: 'Fluency',           labelUk: 'Природність',            group: 'linguistic',    description: 'How well-formed, grammatically correct, logically coherent and comprehensible the question is.' },
  { id: 'clarity',           label: 'Clarity',           labelUk: 'Чіткість',               group: 'linguistic',    description: 'Whether the question is stated clearly and unambiguously, avoiding over-generalisation or vagueness.' },
  { id: 'conciseness',       label: 'Conciseness',       labelUk: 'Лаконічність',           group: 'linguistic',    description: 'Whether the question is concise and does not contain redundancy or duplicate information.' },
  // Task-oriented dimensions
  { id: 'relevance',         label: 'Relevance',         labelUk: 'Релевантність',          group: 'task',          description: 'How relevant the question is to the provided image (domain) and dataset topic.' },
  { id: 'consistency',       label: 'Consistency',       labelUk: 'Контекстна узгодженість', group: 'task',         description: 'Whether the information stated in the question itself is consistent with the provided image.' },
  { id: 'answerability',     label: 'Answerability',     labelUk: 'Можливість відповісти',  group: 'task',          description: 'Whether a clear and unambiguous answer can be found relying solely on the provided image.' },
  { id: 'answer_consistency',label: 'Answer Consistency',labelUk: 'Узгодженість відповіді', group: 'task',          description: 'Whether the generated question can be successfully answered using the target answer that was provided to the model.' },
] as const;

export type MetricId = typeof QGEVAL_METRICS[number]['id'];

export interface Question {
  id: string;
  title: string;
  category: string;
  description: string;
  imageContext: string; // domain / image description shown to annotator
  targetAnswer: string; // reference answer used for answer_consistency
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

export interface SurveyResponse {
  id: string;
  timestamp: string;
  answers: AnswerDto[];
  feedback?: string;
  respondentName?: string;
}

@Injectable()
export class SurveyService {
  private readonly questions: Question[] = [
    {
      id: 'q1',
      title: 'Question 1',
      category: 'Visual Recognition',
      description: 'What is the dominant color of the vehicle parked in front of the building?',
      imageContext: 'An outdoor urban street scene showing a red SUV parked in front of a modern glass office building.',
      targetAnswer: 'Red',
    },
    {
      id: 'q2',
      title: 'Question 2',
      category: 'Object Counting',
      description: 'How many people are visible in the foreground of the image?',
      imageContext: 'A busy café terrace with several tables; three people are clearly visible in the foreground while others are blurred in the background.',
      targetAnswer: 'Three',
    },
    {
      id: 'q3',
      title: 'Question 3',
      category: 'Spatial Reasoning',
      description: 'Where is the clock located relative to the entrance door?',
      imageContext: 'Interior of a train station. A large analogue clock is mounted on the wall directly above and to the left of the main entrance double doors.',
      targetAnswer: 'Above and to the left of the entrance door',
    },
    {
      id: 'q4',
      title: 'Question 4',
      category: 'Text Recognition',
      description: 'What text is written on the sign hanging above the shop entrance?',
      imageContext: 'A street-level photograph of a small bakery. A wooden sign with the words "FRESH BAKED DAILY" hangs above the front door.',
      targetAnswer: 'FRESH BAKED DAILY',
    },
    {
      id: 'q5',
      title: 'Question 5',
      category: 'Activity Recognition',
      description: 'What activity is the woman in the yellow jacket performing?',
      imageContext: 'A park scene. A woman wearing a yellow jacket is jogging along a paved path, with earphones in.',
      targetAnswer: 'Jogging / running',
    },
  ];

  // In-memory response store initialised with realistic baseline data
  private readonly responses: SurveyResponse[] = [
    {
      id: 'sample-1',
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
      answers: [
        { questionId: 'q1', scores: { fluency: 3, clarity: 3, conciseness: 3, relevance: 3, consistency: 3, answerability: 3, answer_consistency: 3 } },
        { questionId: 'q2', scores: { fluency: 3, clarity: 2, conciseness: 3, relevance: 3, consistency: 3, answerability: 2, answer_consistency: 3 } },
        { questionId: 'q3', scores: { fluency: 2, clarity: 2, conciseness: 2, relevance: 3, consistency: 2, answerability: 2, answer_consistency: 2 } },
        { questionId: 'q4', scores: { fluency: 3, clarity: 3, conciseness: 3, relevance: 3, consistency: 3, answerability: 3, answer_consistency: 3 } },
        { questionId: 'q5', scores: { fluency: 3, clarity: 3, conciseness: 2, relevance: 3, consistency: 3, answerability: 3, answer_consistency: 2 } },
      ],
      feedback: 'Questions are generally well-formed and unambiguous.',
      respondentName: 'Alex M.',
    },
    {
      id: 'sample-2',
      timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
      answers: [
        { questionId: 'q1', scores: { fluency: 3, clarity: 3, conciseness: 3, relevance: 3, consistency: 3, answerability: 3, answer_consistency: 3 } },
        { questionId: 'q2', scores: { fluency: 2, clarity: 2, conciseness: 2, relevance: 2, consistency: 2, answerability: 2, answer_consistency: 2 } },
        { questionId: 'q3', scores: { fluency: 3, clarity: 2, conciseness: 3, relevance: 3, consistency: 2, answerability: 2, answer_consistency: 2 } },
        { questionId: 'q4', scores: { fluency: 3, clarity: 3, conciseness: 3, relevance: 3, consistency: 3, answerability: 3, answer_consistency: 3 } },
        { questionId: 'q5', scores: { fluency: 2, clarity: 2, conciseness: 2, relevance: 3, consistency: 2, answerability: 3, answer_consistency: 2 } },
      ],
      feedback: 'Q3 could be clearer about which direction.',
      respondentName: 'Jordan K.',
    },
  ];

  getQuestions(): Question[] {
    return this.questions;
  }

  submitResponse(dto: SubmitSurveyDto): { success: boolean; responseId: string; message: string } {
    if (!dto.answers || dto.answers.length === 0) {
      throw new BadRequestException('At least one question score is required.');
    }

    const validQuestionIds = new Set(this.questions.map((q) => q.id));
    for (const ans of dto.answers) {
      if (!validQuestionIds.has(ans.questionId)) {
        throw new BadRequestException(`Question ID "${ans.questionId}" not found.`);
      }
    }

    const responseId = 'resp-' + Date.now();
    const newResponse: SurveyResponse = {
      id: responseId,
      timestamp: new Date().toISOString(),
      answers: dto.answers,
      feedback: dto.feedback?.trim(),
      respondentName: dto.respondentName?.trim() || 'Anonymous User',
    };

    this.responses.push(newResponse);

    return {
      success: true,
      responseId,
      message: 'Thank you! Your QGEval ratings have been recorded.',
    };
  }

  getResults() {
    const totalResponses = this.responses.length;

    const questionStats: QuestionStat[] = this.questions.map((question) => {
      const answersForQ = this.responses.flatMap((r) =>
        r.answers.filter((a) => a.questionId === question.id),
      );
      const count = answersForQ.length;

      const metrics: MetricStat[] = QGEVAL_METRICS.map((metric) => {
        const scores = answersForQ.map((a) => (a.scores as any)[metric.id] as number);
        const sum = scores.reduce((acc, s) => acc + s, 0);
        const avg = count > 0 ? parseFloat((sum / count).toFixed(2)) : 0;

        const distribution = [1, 2, 3].map((s) => {
          const cnt = scores.filter((v) => v === s).length;
          return {
            score: s,
            count: cnt,
            percentage: count > 0 ? Math.round((cnt / count) * 100) : 0,
          };
        });

        return {
          metricId: metric.id,
          label: metric.label,
          labelUk: metric.labelUk,
          averageScore: avg,
          distribution,
        };
      });

      const allScores = metrics.flatMap((m) => m.distribution.flatMap((d) => Array(d.count).fill(d.score)));
      const totalSum = allScores.reduce((a, b) => a + b, 0);
      const overallAverage = allScores.length > 0 ? parseFloat((totalSum / allScores.length).toFixed(2)) : 0;

      return {
        questionId: question.id,
        title: question.title,
        category: question.category,
        count,
        overallAverage,
        metrics,
      };
    });

    // Global averages per metric across all questions
    const globalMetricAverages = QGEVAL_METRICS.map((metric) => {
      const allScores = this.responses.flatMap((r) =>
        r.answers.map((a) => (a.scores as any)[metric.id] as number),
      );
      const avg = allScores.length > 0
        ? parseFloat((allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(2))
        : 0;
      return { metricId: metric.id, label: metric.label, labelUk: metric.labelUk, averageScore: avg };
    });

    const allScoresFlat = this.responses.flatMap((r) =>
      r.answers.flatMap((a) => Object.values(a.scores) as number[]),
    );
    const overallAverage =
      allScoresFlat.length > 0
        ? parseFloat((allScoresFlat.reduce((a, b) => a + b, 0) / allScoresFlat.length).toFixed(2))
        : 0;

    const recentFeedback = this.responses
      .filter((r) => r.feedback && r.feedback.length > 0)
      .slice(-5)
      .reverse()
      .map((r) => ({
        respondent: r.respondentName,
        feedback: r.feedback,
        timestamp: r.timestamp,
      }));

    return {
      totalResponses,
      overallAverage,
      globalMetricAverages,
      questionStats,
      recentFeedback,
    };
  }
}
