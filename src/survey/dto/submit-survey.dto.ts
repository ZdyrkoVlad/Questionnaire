import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class QGEvalScoresDto {
  @IsInt()
  @Min(1, { message: 'Fluency must be at least 1' })
  @Max(3, { message: 'Fluency must not exceed 3' })
  fluency: number;

  @IsInt()
  @Min(1, { message: 'Clarity must be at least 1' })
  @Max(3, { message: 'Clarity must not exceed 3' })
  clarity: number;

  @IsInt()
  @Min(1, { message: 'Conciseness must be at least 1' })
  @Max(3, { message: 'Conciseness must not exceed 3' })
  conciseness: number;

  @IsInt()
  @Min(1, { message: 'Relevance must be at least 1' })
  @Max(3, { message: 'Relevance must not exceed 3' })
  relevance: number;

  @IsInt()
  @Min(1, { message: 'Consistency must be at least 1' })
  @Max(3, { message: 'Consistency must not exceed 3' })
  consistency: number;

  @IsInt()
  @Min(1, { message: 'Answerability must be at least 1' })
  @Max(3, { message: 'Answerability must not exceed 3' })
  answerability: number;

  @IsInt()
  @Min(1, { message: 'Answer Consistency must be at least 1' })
  @Max(3, { message: 'Answer Consistency must not exceed 3' })
  answer_consistency: number;
}

export class AnswerDto {
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @ValidateNested()
  @Type(() => QGEvalScoresDto)
  scores: QGEvalScoresDto;
}

export class SubmitSurveyDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];

  @IsOptional()
  @IsString()
  feedback?: string;

  @IsOptional()
  @IsString()
  respondentName?: string;
}
