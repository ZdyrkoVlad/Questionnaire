import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LoraAnswer, LoraAnswerDocument } from '../schemas/lora-answer.schema';

export interface CreateLoraAnswerInput {
  id?: string | number;
  questionId: string | number;
  question: string;
  answer: string;
  imgUrl?: string;
  score: Record<string, number>;
  respondentName?: string;
  feedback?: string;
  version?: string;
}

export interface LoraAnswerResult {
  _id: Types.ObjectId;
  id?: string | number;
  questionId: string | number;
  question: string;
  answer: string;
  imgUrl?: string;
  score: Record<string, number>;
  respondentName?: string;
  feedback?: string;
  version?: string;
  createdAt?: Date;
}

/**
 * Service for managing the `LORA_answers` MongoDB collection.
 */
@Injectable()
export class LoraAnswerService {
  private readonly logger = new Logger(LoraAnswerService.name);

  constructor(
    @InjectModel(LoraAnswer.name)
    private readonly model: Model<LoraAnswerDocument>,
  ) {}

  /** Save a new answer document into LORA_answers collection */
  async create(input: CreateLoraAnswerInput): Promise<LoraAnswerResult> {
    const doc = new this.model(input);
    const saved = await doc.save();
    this.logger.log(
      `Saved answer to LORA_answers collection | questionId=${input.questionId} | docId=${saved._id}`,
    );
    return saved.toObject() as unknown as LoraAnswerResult;
  }

  /** Count total saved answers */
  async count(): Promise<number> {
    return this.model.countDocuments().exec();
  }

  /** Find saved answers by questionId */
  async findByQuestionId(questionId: string | number): Promise<LoraAnswerResult[]> {
    const results = await this.model
      .find({ questionId })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    return results as unknown as LoraAnswerResult[];
  }

  /** Find all saved answers */
  async findAll(): Promise<LoraAnswerResult[]> {
    const results = await this.model
      .find()
      .sort({ createdAt: -1 })
      .lean()
      .exec();
    return results as unknown as LoraAnswerResult[];
  }
}
