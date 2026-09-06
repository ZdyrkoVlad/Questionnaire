import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type VqaQuestionDocument = HydratedDocument<VqaQuestion>;

/**
 * Mongoose schema mapped to the `LORA_question` MongoDB collection.
 *
 * Document shape:
 * {
 *   _id: ObjectId('6a9c6a4624ef7bf0afb3b5b7'),
 *   id: NumberInt(1),
 *   question: 'What vegetable is red with a woody taste...',
 *   answer: 'lettuce, onion, tomato'
 * }
 */
@Schema({
  collection: 'LORA_question',
  timestamps: false,
  versionKey: false,
})
export class VqaQuestion {
  /** Sequential numeric index (not the Mongo _id) */
  @Prop({ type: Number, required: true, index: true })
  id: number;

  /** The VQA question text */
  @Prop({ type: String, required: true, trim: true })
  question: string;

  /** The reference / ground-truth answer */
  @Prop({ type: String, required: true, trim: true })
  answer: string;
}

export const VqaQuestionSchema = SchemaFactory.createForClass(VqaQuestion);
