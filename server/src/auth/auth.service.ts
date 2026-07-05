import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common'
import { getSupabaseClient } from '../storage/database/supabase-client'
import * as crypto from 'crypto'

@Injectable()
export class AuthService {
  private supabase = getSupabaseClient()

  /** 密码哈希 */
  private hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password + '__bonglaot_salt__').digest('hex')
  }

  /** 生成 token */
  private generateToken(userId: string): string {
    const payload = `${userId}:${Date.now()}:${crypto.randomBytes(16).toString('hex')}`
    return Buffer.from(payload).toString('base64')
  }

  /** 注册 */
  async register(username: string, password: string, nickname?: string) {
    if (!username || username.length < 2) {
      throw new BadRequestException('用户名至少2个字符')
    }
    if (!password || password.length < 6) {
      throw new BadRequestException('密码至少6个字符')
    }

    // 检查用户名是否已存在
    const { data: existing } = await this.supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single()

    if (existing) {
      throw new BadRequestException('用户名已存在')
    }

    const hashedPassword = this.hashPassword(password)

    const { data, error } = await this.supabase
      .from('users')
      .insert({
        username,
        password: hashedPassword,
        nickname: nickname || username,
      })
      .select('id, username, nickname, avatar_url, created_at')
      .single()

    if (error) throw new BadRequestException('注册失败：' + error.message)

    const token = this.generateToken(data.id)

    return { user: data, token }
  }

  /** 登录 */
  async login(username: string, password: string) {
    const hashedPassword = this.hashPassword(password)

    const { data, error } = await this.supabase
      .from('users')
      .select('id, username, nickname, avatar_url, created_at')
      .eq('username', username)
      .eq('password', hashedPassword)
      .single()

    if (error || !data) {
      throw new UnauthorizedException('用户名或密码错误')
    }

    const token = this.generateToken(data.id)

    return { user: data, token }
  }

  /** 获取用户信息 */
  async getProfile(userId: string) {
    const { data, error } = await this.supabase
      .from('users')
      .select('id, username, nickname, avatar_url, created_at')
      .eq('id', userId)
      .single()

    if (error || !data) {
      throw new UnauthorizedException('用户不存在')
    }

    return data
  }

  /** 更新用户信息 */
  async updateProfile(userId: string, updates: { nickname?: string; avatar_url?: string }) {
    const { data, error } = await this.supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select('id, username, nickname, avatar_url, created_at')
      .single()

    if (error) throw new BadRequestException('更新失败：' + error.message)

    return data
  }
}
