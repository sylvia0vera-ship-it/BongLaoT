import { Controller, Post, Body } from '@nestjs/common'
import { AnalyzeService, AnalysisResult } from './analyze.service'

@Controller('analyze-message')
export class AnalyzeController {
  constructor(private readonly analyzeService: AnalyzeService) {}

  @Post()
  async analyzeMessage(
    @Body() body: { message: string; context?: string; fan_id?: string; image_url?: string },
  ): Promise<{ status: string; data: AnalysisResult }> {
    const result = await this.analyzeService.analyze(
      body.message,
      body.context || '',
      body.fan_id,
      body.image_url,
    )
    return { status: 'success', data: result }
  }
}
