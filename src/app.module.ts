import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { SurveyModule } from './survey/survey.module';
import { DatabaseModule } from './database/database.module';
import { ImageExampleModule } from './image-example/image-example.module';

@Module({
  imports: [
    // Load .env automatically — available globally in every module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Serve built client assets from /public
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      exclude: ['/api/(.*)'],
    }),

    // MongoDB connection + collection services
    DatabaseModule,

    // Survey feature module
    SurveyModule,

    // Hugging Face Image Example module
    ImageExampleModule,
  ],
})
export class AppModule {}
