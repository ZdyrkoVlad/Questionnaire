import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  NotFoundException,
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

  /** Returns a question by id query or a random question */
  @Get('questions')
  async getQuestions(@Query('id') idQuery?: string) {
    if (idQuery) {
      const id = parseInt(idQuery, 10);
      if (!isNaN(id)) {
        const question = await this.surveyService.getQuestionById(id);
        if (question) return [question];
        throw new NotFoundException(`Question #${id} not found in database`);
      }
    }
    return this.surveyService.getQuestions();
  }

  /** Returns a specific question by its numeric ID */
  @Get('questions/:id')
  async getQuestionById(@Param('id', ParseIntPipe) id: number) {
    const question = await this.surveyService.getQuestionById(id);
    if (!question) {
      throw new NotFoundException(`Question #${id} not found in database`);
    }
    return question;
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

  /**
   * Returns all submitted answers for a specific question.
   */
  @Get('questions/:id/answers')
  getQuestionAnswers(@Param('id') id: string) {
    return this.surveyService.getAnswersByQuestionId(id);
  }
}
