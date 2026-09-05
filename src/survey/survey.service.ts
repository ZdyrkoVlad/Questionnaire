import { Injectable, BadRequestException } from '@nestjs/common';
import { SubmitSurveyDto, AnswerDto } from './dto/submit-survey.dto';

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
      id: 'satisfaction',
      title: 'Overall Satisfaction',
      category: 'Experience',
      description: 'How satisfied are you with the overall service and responsiveness of our platform?',
      minScore: 1,
      maxScore: 10,
      minLabel: 'Very Dissatisfied (1)',
      maxLabel: 'Extremely Satisfied (10)',
    },
    {
      id: 'recommendation',
      title: 'Net Promoter Rating',
      category: 'Loyalty',
      description: 'How likely are you to recommend our product or solution to a colleague or friend?',
      minScore: 1,
      maxScore: 10,
      minLabel: 'Not at all likely (1)',
      maxLabel: 'Extremely likely (10)',
    },
    {
      id: 'usability',
      title: 'Ease of Use & Interface',
      category: 'Design',
      description: 'How effortless and intuitive was it to navigate and find what you needed?',
      minScore: 1,
      maxScore: 10,
      minLabel: 'Very Difficult (1)',
      maxLabel: 'Seamless & Easy (10)',
    },
    {
      id: 'performance',
      title: 'Speed & Reliability',
      category: 'Performance',
      description: 'How would you rate the speed, stability, and system performance during your session?',
      minScore: 1,
      maxScore: 10,
      minLabel: 'Laggy & Unreliable (1)',
      maxLabel: 'Blazing Fast & Robust (10)',
    },
  ];

  // In-memory response store initialized with realistic baseline data
  private readonly responses: SurveyResponse[] = [
    {
      id: 'sample-1',
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
      answers: [
        { questionId: 'satisfaction', score: 9 },
        { questionId: 'recommendation', score: 10 },
        { questionId: 'usability', score: 8 },
        { questionId: 'performance', score: 9 },
      ],
      feedback: 'Very intuitive design and clean light aesthetics. Love the lime green accent!',
      respondentName: 'Alex M.',
    },
    {
      id: 'sample-2',
      timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
      answers: [
        { questionId: 'satisfaction', score: 8 },
        { questionId: 'recommendation', score: 9 },
        { questionId: 'usability', score: 9 },
        { questionId: 'performance', score: 8 },
      ],
      feedback: 'Setup was effortless and deployment on Render worked out of the box.',
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

    // Validate that question IDs exist
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
      message: 'Thank you! Your feedback has been recorded.',
    };
  }

  getResults() {
    const totalResponses = this.responses.length;

    // Per question statistics
    const questionStats = this.questions.map((question) => {
      const scoresForQuestion = this.responses.flatMap((r) =>
        r.answers.filter((a) => a.questionId === question.id).map((a) => a.score),
      );

      const count = scoresForQuestion.length;
      const sum = scoresForQuestion.reduce((acc, s) => acc + s, 0);
      const avg = count > 0 ? parseFloat((sum / count).toFixed(1)) : 0;

      // Distribution array from score 1 to 10
      const distribution: { score: number; count: number; percentage: number }[] = [];
      for (let s = 1; s <= 10; s++) {
        const scoreCount = scoresForQuestion.filter((val) => val === s).length;
        const percentage = count > 0 ? Math.round((scoreCount / count) * 100) : 0;
        distribution.push({ score: s, count: scoreCount, percentage });
      }

      return {
        questionId: question.id,
        title: question.title,
        category: question.category,
        count,
        averageScore: avg,
        distribution,
      };
    });

    // Overall global average
    const allScores = this.responses.flatMap((r) => r.answers.map((a) => a.score));
    const globalSum = allScores.reduce((acc, s) => acc + s, 0);
    const overallAverage = allScores.length > 0 ? parseFloat((globalSum / allScores.length).toFixed(1)) : 0;

    // Recent feedback snippets
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
      questionStats,
      recentFeedback,
    };
  }
}
