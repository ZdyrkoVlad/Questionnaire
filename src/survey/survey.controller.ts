import {
  Controller,
  Get,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SurveyService } from './survey.service';
import { SubmitSurveyDto } from './dto/submit-survey.dto';
import { SaveLoraAnswerDto } from './dto/save-lora-answer.dto';

@Controller('api/survey')
export class SurveyController {
  constructor(private readonly surveyService: SurveyService) {}

  /** Returns the total number of questions in LORA_question collection */
  @Get('questions/count')
  getCount() {
    return this.surveyService.getCount();
  }

  /** Returns a single random question from LORA_question */
  @Get('questions')
  async getQuestions() {
    return this.surveyService.getQuestions();
  }

  /**
   * Save a single answer entry directly into `LORA_answers` MongoDB collection.
   * Expects SaveLoraAnswerDto: { id?, questionId, question, answer, imgUrl?, score: {} }
   */
  @Post('answer')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  saveAnswer(@Body() saveLoraAnswerDto: SaveLoraAnswerDto) {
    return this.surveyService.saveLoraAnswer(saveLoraAnswerDto);
  }

  /**
   * Submit survey ratings and persist all entries to `LORA_answers` collection.
   */
  @Post('submit')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  submit(@Body() submitSurveyDto: SubmitSurveyDto) {
    return this.surveyService.submitResponse(submitSurveyDto);
  }

  @Get('results')
  getResults() {
    return this.surveyService.getResults();
  }
}
