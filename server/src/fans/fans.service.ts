import { Injectable } from '@nestjs/common'
import { getSupabaseClient } from '@/storage/database/supabase-client'

interface CreateFanDto {
  name: string
  tags: string
  notes: string
  relationshipLevel: string
}

interface CreateChatLogDto {
  fanId: string
  message: string
  context: string
  analysisResult: Record<string, unknown>
}

@Injectable()
export class FansService {
  /** 获取所有粉丝列表 */
  async findAll() {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('fans')
      .select('id, name, tags, notes, relationship_level, created_at, updated_at')
      .order('updated_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
    if (error) throw new Error(`查询粉丝列表失败: ${error.message}`)
    return data
  }

  /** 获取单个粉丝（含最近5条对话记录） */
  async findOne(id: string) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('fans')
      .select('id, name, tags, notes, relationship_level, created_at, updated_at')
      .eq('id', id)
      .maybeSingle()
    if (error) throw new Error(`查询粉丝详情失败: ${error.message}`)
    if (!data) throw new Error('粉丝不存在')

    // 获取最近对话记录
    const { data: chatLogs, error: chatError } = await client
      .from('chat_logs')
      .select('id, message, context, analysis_result, created_at')
      .eq('fan_id', id)
      .order('created_at', { ascending: false })
      .limit(5)
    if (chatError) throw new Error(`查询对话记录失败: ${chatError.message}`)

    return { ...data, recentChats: chatLogs || [] }
  }

  /** 创建粉丝 */
  async create(dto: CreateFanDto) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('fans')
      .insert({
        name: dto.name,
        tags: dto.tags || null,
        notes: dto.notes || null,
        relationship_level: dto.relationshipLevel || '普通',
      })
      .select('id, name, tags, notes, relationship_level, created_at, updated_at')
    if (error) throw new Error(`创建粉丝失败: ${error.message}`)
    return data?.[0] || null
  }

  /** 更新粉丝 */
  async update(id: string, dto: CreateFanDto) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('fans')
      .update({
        name: dto.name,
        tags: dto.tags || null,
        notes: dto.notes || null,
        relationship_level: dto.relationshipLevel || '普通',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id, name, tags, notes, relationship_level, created_at, updated_at')
    if (error) throw new Error(`更新粉丝失败: ${error.message}`)
    return data?.[0] || null
  }

  /** 删除粉丝 */
  async remove(id: string) {
    const client = getSupabaseClient()
    const { error } = await client.from('fans').delete().eq('id', id)
    if (error) throw new Error(`删除粉丝失败: ${error.message}`)
  }

  /** 保存对话记录 */
  async createChatLog(dto: CreateChatLogDto) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('chat_logs')
      .insert({
        fan_id: dto.fanId,
        message: dto.message,
        context: dto.context || null,
        analysis_result: dto.analysisResult || null,
      })
      .select('id, fan_id, message, context, analysis_result, created_at')
    if (error) throw new Error(`保存对话记录失败: ${error.message}`)
    return data?.[0] || null
  }

  /** 获取粉丝的对话记录 */
  async getChatLogs(fanId: string) {
    const client = getSupabaseClient()
    const { data, error } = await client
      .from('chat_logs')
      .select('id, message, context, analysis_result, created_at')
      .eq('fan_id', fanId)
      .order('created_at', { ascending: false })
      .limit(20)
    if (error) throw new Error(`查询对话记录失败: ${error.message}`)
    return data
  }
}
