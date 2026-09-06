import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type LoraAnswerDocument = HydratedDocument<LoraAnswer>;

/**
 * Annotation answer stored in the `LORA_answers` MongoDB collection.
 *
 * Fields:
 * - id: optional string/number ID
 * - questionId: ID of the question being evaluated
 * - score: object containing metric ratings (e.g. { fluency: 3, clarity: 2, ... })
 * - question: full text of the question
 * - answer: reference / target answer
 * - imgUrl: optional image URL
 */
@Schema({
  collection: 'LORA_answers',
  timestamps: { createdAt: 'createdAt', updatedAt: false },
  versionKey: false,
})
export class LoraAnswer {
  @Prop({ type: MongooseSchema.Types.Mixed, required: false })
  id?: string | number;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true, index: true })
  questionId: string | number;

  @Prop({ type: String, required: true })
  question: string;

  @Prop({ type: String, required: true })
  answer: string;

  @Prop({ type: String, required: false, default: null })
  imgUrl?: string;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  score: Record<string, number>;

  @Prop({ type: String, required: false, default: 'Anonymous' })
  respondentName?: string;

  @Prop({ type: String, required: false, default: null })
  feedback?: string;

  @Prop({ type: String, required: false, default: '1.0.0' })
  version?: string;

  createdAt?: Date;
}

export const LoraAnswerSchema = SchemaFactory.createForClass(LoraAnswer);
