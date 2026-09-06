import { IsNotEmpty, IsOptional, IsString, IsObject } from 'class-validator';

/**
 * DTO for saving answer ratings into the `LORA_answers` collection.
 *
 * Requirements:
 * - id?: string | number (optional)
 * - questionId (or quesitonId): string | number
 * - question: string
 * - answer: string
 * - imgUrl?: string (optional)
 * - score: {} (object containing rating scores)
 */
export class SaveLoraAnswerDto {
  @IsOptional()
  id?: string | number;

  @IsNotEmpty()
  questionId: string | number;

  @IsNotEmpty()
  @IsString()
  question: string;

  @IsNotEmpty()
  @IsString()
  answer: string;

  @IsOptional()
  @IsString()
  imgUrl?: string;

  @IsNotEmpty()
  @IsObject()
  score: Record<string, number>;

  @IsOptional()
  @IsString()
  respondentName?: string;

  @IsOptional()
  @IsString()
  feedback?: string;

  @IsOptional()
  @IsString()
  version?: string;
}
