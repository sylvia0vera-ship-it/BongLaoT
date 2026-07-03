import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common'
import { FansService } from './fans.service'

@Controller('fans')
export class FansController {
  constructor(private readonly fansService: FansService) {}

  /** 获取所有粉丝列表 */
  @Get()
  async findAll() {
    const data = await this.fansService.findAll()
    return { code: 200, msg: 'success', data }
  }

  /** 获取单个粉丝详情（含最近对话记录） */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.fansService.findOne(id)
    return { code: 200, msg: 'success', data }
  }

  /** 创建粉丝 */
  @Post()
  async create(
    @Body('name') name: string,
    @Body('tags') tags: string,
    @Body('notes') notes: string,
    @Body('relationship_level') relationshipLevel: string,
  ) {
    const data = await this.fansService.create({ name, tags, notes, relationshipLevel })
    return { code: 200, msg: 'success', data }
  }

  /** 更新粉丝 */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body('name') name: string,
    @Body('tags') tags: string,
    @Body('notes') notes: string,
    @Body('relationship_level') relationshipLevel: string,
  ) {
    const data = await this.fansService.update(id, { name, tags, notes, relationshipLevel })
    return { code: 200, msg: 'success', data }
  }

  /** 删除粉丝 */
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.fansService.remove(id)
    return { code: 200, msg: 'success', data: null }
  }

  /** 保存对话记录 */
  @Post(':id/chat-logs')
  async createChatLog(
    @Param('id') fanId: string,
    @Body('message') message: string,
    @Body('context') context: string,
    @Body('analysis_result') analysisResult: Record<string, unknown>,
  ) {
    const data = await this.fansService.createChatLog({ fanId, message, context, analysisResult })
    return { code: 200, msg: 'success', data }
  }

  /** 获取粉丝的对话记录 */
  @Get(':id/chat-logs')
  async getChatLogs(@Param('id') fanId: string) {
    const data = await this.fansService.getChatLogs(fanId)
    return { code: 200, msg: 'success', data }
  }
}
