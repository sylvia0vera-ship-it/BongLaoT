import { Controller, Post, Body, HttpCode } from '@nestjs/common'
import { AnalyzeService } from './analyze.service'

@Controller('analyze-message')
export class AnalyzeController {
  constructor(private readonly analyzeService: AnalyzeService) {}

  @Post()
  @HttpCode(200)
  async analyze(@Body() body: {
    message: string
    context?: string
    fan_id?: string
    image_url?: string
    chat_mode?: string
  }) {
    const chatMode = (body.chat_mode === 'pre-chat' || body.chat_mode === 'post-chat')
      ? body.chat_mode
      : 'mid-chat'
    const result = await this.analyzeService.analyze(
      body.message,
      body.context,
      body.fan_id,
      body.image_url,
      chatMode as any,
    )
    return { code: 200, msg: 'success', data: result }
  }
}
