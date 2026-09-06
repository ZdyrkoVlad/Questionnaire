import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { join } from 'path';

@Controller('imageExample')
export class ImageExampleController {
  @Get()
  getImageExamplePage(@Res() res: Response) {
    const filePath = join(process.cwd(), 'public', 'imageExample', 'index.html');
    return res.sendFile(filePath);
  }
}
