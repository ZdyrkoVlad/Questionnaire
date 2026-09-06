import { Module } from '@nestjs/common';
import { ImageExampleController } from './image-example.controller';

@Module({
  controllers: [ImageExampleController],
})
export class ImageExampleModule {}
