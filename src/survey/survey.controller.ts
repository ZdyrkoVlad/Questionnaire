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

@Controller('api/survey')
export class SurveyController {
  constructor(private readonly surveyService: SurveyService) {}

  @Get('questions')
  getQuestions() {
    return this.surveyService.getQuestions();
  }

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
