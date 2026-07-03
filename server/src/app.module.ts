import { Module } from '@nestjs/common';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { AnalyzeModule } from './analyze/analyze.module';
import { FansModule } from './fans/fans.module';

@Module({
  imports: [AnalyzeModule, FansModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
