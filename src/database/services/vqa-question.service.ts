import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { VqaQuestion, VqaQuestionDocument } from '../schemas/vqa-question.schema';

export interface VqaQuestionDto {
  _id: Types.ObjectId;
  id: number;
  question: string;
  answer: string;
}

/**
 * Service for the `LORA_question` MongoDB collection.
 * Provides count, random-fetch, paginated listing, and upsert helpers.
 */
@Injectable()
export class VqaQuestionService implements OnModuleInit {
  private readonly logger = new Logger(VqaQuestionService.name);

  constructor(
    @InjectModel(VqaQuestion.name)
    private readonly model: Model<VqaQuestionDocument>,
  ) {}

  /** Log total document count on startup */
  async onModuleInit(): Promise<void> {
    try {
      const total = await this.count();
      this.logger.log(`✅ Connected to LORA_question — ${total} questions available.`);
    } catch (err) {
      this.logger.error(`❌ Could not reach LORA_question collection: ${err.message}`);
    }
  }

  /** Total number of documents in LORA_question */
  async count(): Promise<number> {
    return this.model.countDocuments().exec();
  }

  /** Return one truly random document using MongoDB $sample */
  async findRandom(): Promise<VqaQuestionDto | null> {
    const results = await this.model
      .aggregate<VqaQuestionDto>([{ $sample: { size: 1 } }])
      .exec();
    return results[0] ?? null;
  }

  /** Find by numeric id field */
  async findById(id: number): Promise<VqaQuestionDto | null> {
    return this.model.findOne({ id }).lean().exec() as Promise<VqaQuestionDto | null>;
  }

  /** Paginated listing (0-based skip) */
  async findPage(skip = 0, limit = 20): Promise<VqaQuestionDto[]> {
    return this.model
      .find()
      .sort({ id: 1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec() as Promise<VqaQuestionDto[]>;
  }

  /** Bulk upsert by numeric id (useful for seeding) */
  async bulkUpsert(items: Omit<VqaQuestionDto, '_id'>[]): Promise<void> {
    const ops = items.map((item) => ({
      updateOne: {
        filter: { id: item.id },
        update: { $set: item },
        upsert: true,
      },
    }));
    await this.model.bulkWrite(ops);
    this.logger.log(`Bulk upserted ${items.length} questions.`);
  }
}
