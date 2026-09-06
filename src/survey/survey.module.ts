import { Module } from '@nestjs/common';
import { SurveyController } from './survey.controller';
import { SurveyService } from './survey.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [SurveyController],
  providers: [SurveyService],
  exports: [SurveyService],
})
export class SurveyModule {}
