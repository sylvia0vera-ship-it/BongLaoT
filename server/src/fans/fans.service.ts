import { Injectable, NotFoundException } from '@nestjs/common'
import { getSupabaseClient } from '../storage/database/supabase-client'

@Injectable()
export class FansService {
  private supabase = getSupabaseClient()

  async findAll() {
    const { data, error } = await this.supabase
      .from('fans')
      .select('*')
      .order('updated_at', { ascending: false })
    if (error) throw error
    return data
  }

  async findOne(id: string) {
    const { data, error } = await this.supabase
      .from('fans')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw new NotFoundException('粉丝不存在')
    return data
  }

  async create(body: Record<string, any>) {
    const insertData: Record<string, any> = { name: body.name }
    if (body.relationship_stage) insertData.relationship_stage = body.relationship_stage
    if (body.support_habits) insertData.support_habits = body.support_habits
    if (body.chat_preferences) insertData.chat_preferences = body.chat_preferences
    if (body.triggers) insertData.triggers = body.triggers
    if (body.nickname) insertData.nickname = body.nickname
    if (body.last_interaction_summary) insertData.last_interaction_summary = body.last_interaction_summary
    if (body.next_step_suggestion) insertData.next_step_suggestion = body.next_step_suggestion
    if (body.persona_type) insertData.persona_type = body.persona_type
    if (body.tags) insertData.tags = body.tags
    if (body.notes) insertData.notes = body.notes
    if (body.relationship_level) insertData.relationship_level = body.relationship_level

    const { data, error } = await this.supabase
      .from('fans')
      .insert(insertData)
      .select()
      .single()
    if (error) throw error
    return data
  }

  async update(id: string, body: Record<string, any>) {
    const updateData: Record<string, any> = { updated_at: new Date().toISOString() }
    const fields = ['name', 'relationship_stage', 'support_habits', 'chat_preferences',
      'triggers', 'nickname', 'last_interaction_summary', 'next_step_suggestion',
      'persona_type', 'tags', 'notes', 'relationship_level']
    for (const f of fields) {
      if (body[f] !== undefined) updateData[f] = body[f]
    }

    const { data, error } = await this.supabase
      .from('fans')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    if (error) throw new NotFoundException('粉丝不存在')
    return data
  }

  async remove(id: string) {
    const { error } = await this.supabase
      .from('fans')
      .delete()
      .eq('id', id)
    if (error) throw error
  }

  async addChatLog(fanId: string, body: Record<string, any>) {
    const { data, error } = await this.supabase
      .from('chat_logs')
      .insert({
        fan_id: fanId,
        message: body.message,
        context: body.context || null,
        analysis_result: body.analysis_result || null,
        chat_mode: body.chat_mode || 'mid-chat',
      })
      .select()
      .single()
    if (error) throw error
    return data
  }

  async getChatLogs(fanId: string) {
    const { data, error } = await this.supabase
      .from('chat_logs')
      .select('*')
      .eq('fan_id', fanId)
      .order('created_at', { ascending: false })
      .limit(10)
    if (error) throw error
    return data
  }
}
