import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode } from '@nestjs/common'
import { FansService } from './fans.service'

@Controller('fans')
export class FansController {
  constructor(private readonly fansService: FansService) {}

  @Get()
  async findAll() {
    const data = await this.fansService.findAll()
    return { code: 200, msg: 'success', data }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.fansService.findOne(id)
    return { code: 200, msg: 'success', data }
  }

  @Post()
  @HttpCode(200)
  async create(@Body() body: {
    name: string
    relationship_stage?: string
    support_habits?: string
    chat_preferences?: string
    triggers?: string
    nickname?: string
    last_interaction_summary?: string
    next_step_suggestion?: string
    persona_type?: string
    tags?: string
    notes?: string
    relationship_level?: string
  }) {
    const data = await this.fansService.create(body)
    return { code: 200, msg: 'success', data }
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: {
    name?: string
    relationship_stage?: string
    support_habits?: string
    chat_preferences?: string
    triggers?: string
    nickname?: string
    last_interaction_summary?: string
    next_step_suggestion?: string
    persona_type?: string
    tags?: string
    notes?: string
    relationship_level?: string
  }) {
    const data = await this.fansService.update(id, body)
    return { code: 200, msg: 'success', data }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.fansService.remove(id)
    return { code: 200, msg: 'success', data: null }
  }

  @Post(':id/chat-logs')
  @HttpCode(200)
  async addChatLog(@Param('id') fanId: string, @Body() body: {
    message: string
    context?: string
    analysis_result?: any
    chat_mode?: string
  }) {
    const data = await this.fansService.addChatLog(fanId, body)
    return { code: 200, msg: 'success', data }
  }

  @Get(':id/chat-logs')
  async getChatLogs(@Param('id') fanId: string) {
    const data = await this.fansService.getChatLogs(fanId)
    return { code: 200, msg: 'success', data }
  }
}
