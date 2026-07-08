import { Injectable, NotFoundException } from '@nestjs/common'
import { getSupabaseClient } from '../storage/database/supabase-client'

@Injectable()
export class FansService {
  private supabase = getSupabaseClient()

  private normalizeFanPayload(body: Record<string, any>) {
    return {
      name: body.name,
      relationship_stage: body.relationship_stage,
      support_habits: body.support_habits ?? body.spending_habit,
      chat_preferences: body.chat_preferences ?? body.chat_preference,
      triggers: body.triggers ?? body.red_flags,
      nickname: body.nickname ?? body.preferred_name,
      last_interaction_summary: body.last_interaction_summary,
      next_step_suggestion: body.next_step_suggestion ?? body.next_maintenance_tip,
      persona_type: body.persona_type,
      tags: body.tags,
      notes: body.notes,
      relationship_level: body.relationship_level,
    }
  }

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
    const normalized = this.normalizeFanPayload(body)
    const insertData: Record<string, any> = { name: normalized.name }
    const fields = ['relationship_stage', 'support_habits', 'chat_preferences',
      'triggers', 'nickname', 'last_interaction_summary', 'next_step_suggestion',
      'persona_type', 'tags', 'notes', 'relationship_level']
    for (const f of fields) {
      if (normalized[f] !== undefined && normalized[f] !== '') insertData[f] = normalized[f]
    }

    const { data, error } = await this.supabase
      .from('fans')
      .insert(insertData)
      .select()
      .single()
    if (error) throw error
    return data
  }

  async update(id: string, body: Record<string, any>) {
    const normalized = this.normalizeFanPayload(body)
    const updateData: Record<string, any> = { updated_at: new Date().toISOString() }
    const fields = ['name', 'relationship_stage', 'support_habits', 'chat_preferences',
      'triggers', 'nickname', 'last_interaction_summary', 'next_step_suggestion',
      'persona_type', 'tags', 'notes', 'relationship_level']
    for (const f of fields) {
      if (normalized[f] !== undefined) updateData[f] = normalized[f]
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
