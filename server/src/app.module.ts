import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { AnalyzeModule } from './analyze/analyze.module';
import { FansModule } from './fans/fans.module';
import { UploadModule } from './upload/upload.module';
import { LocationModule } from './location/location.module';

@Module({
  imports: [AnalyzeModule, FansModule, UploadModule, LocationModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
