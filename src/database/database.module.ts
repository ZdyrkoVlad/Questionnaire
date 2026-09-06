import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { VqaQuestion, VqaQuestionSchema } from './schemas/vqa-question.schema';
import { LoraAnswer, LoraAnswerSchema } from './schemas/lora-answer.schema';
import { VqaQuestionService } from './services/vqa-question.service';
import { LoraAnswerService } from './services/lora-answer.service';

/**
 * DatabaseModule wires up the MongoDB connection and registers all schemas and services.
 */
@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI'),
        dbName: config.get<string>('MONGODB_DB_NAME'),
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
      }),
    }),

    MongooseModule.forFeature([
      { name: VqaQuestion.name, schema: VqaQuestionSchema },
      { name: LoraAnswer.name, schema: LoraAnswerSchema },
    ]),
  ],

  providers: [
    VqaQuestionService,
    LoraAnswerService,
  ],

  exports: [
    VqaQuestionService,
    LoraAnswerService,
  ],
})
export class DatabaseModule {}
