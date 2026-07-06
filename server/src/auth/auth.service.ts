import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common'
import { getSupabaseClient } from '../storage/database/supabase-client'
import { EmailService } from './email.service'
import * as crypto from 'crypto'

@Injectable()
export class AuthService {
  private supabase = getSupabaseClient()

  constructor(private readonly emailService: EmailService) {}

  /** 密码哈希 */
  private hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password + '__bonglaot_salt__').digest('hex')
  }

  /** 生成 token */
  private generateToken(userId: string): string {
    const payload = `${userId}:${Date.now()}:${crypto.randomBytes(16).toString('hex')}`
    return Buffer.from(payload).toString('base64')
  }

  /** 发送验证码 */
  async sendCode(email: string) {
    if (!email || !email.endsWith('@qq.com')) {
      throw new BadRequestException('请使用QQ邮箱')
    }
    const emailPrefix = email.replace('@qq.com', '')
    if (!/^\d{5,11}$/.test(emailPrefix)) {
      throw new BadRequestException('QQ号格式不正确')
    }

    // 检查邮箱是否已注册
    const { data: existing } = await this.supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existing) {
      throw new BadRequestException('该QQ邮箱已注册，请直接登录')
    }

    return await this.emailService.sendVerificationCode(email)
  }

  /** 注册（需先验证码验证） */
  async register(email: string, password: string, code: string, nickname?: string) {
    if (!email || !email.endsWith('@qq.com')) {
      throw new BadRequestException('请使用QQ邮箱注册')
    }
    const emailPrefix = email.replace('@qq.com', '')
    if (!/^\d{5,11}$/.test(emailPrefix)) {
      throw new BadRequestException('QQ号格式不正确')
    }
    if (!password || password.length < 6) {
      throw new BadRequestException('密码至少6个字符')
    }

    // 验证验证码
    const isValid = this.emailService.verifyCode(email, code)
    if (!isValid) {
      throw new BadRequestException('验证码错误或已过期')
    }

    // 检查邮箱是否已存在
    const { data: existing } = await this.supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existing) {
      throw new BadRequestException('该QQ邮箱已注册')
    }

    const hashedPassword = this.hashPassword(password)
    const username = emailPrefix

    const { data, error } = await this.supabase
      .from('users')
      .insert({
        email,
        username,
        password: hashedPassword,
        nickname: nickname || username,
      })
      .select('id, email, username, nickname, avatar_url, created_at')
      .single()

    if (error) throw new BadRequestException('注册失败：' + error.message)

    const token = this.generateToken(data.id)

    return { user: data, token }
  }

  /** 登录 */
  async login(email: string, password: string) {
    const hashedPassword = this.hashPassword(password)

    const { data, error } = await this.supabase
      .from('users')
      .select('id, email, username, nickname, avatar_url, created_at')
      .eq('email', email)
      .eq('password', hashedPassword)
      .single()

    if (error || !data) {
      throw new UnauthorizedException('邮箱或密码错误')
    }

    const token = this.generateToken(data.id)

    return { user: data, token }
  }

  /** 获取用户信息 */
  async getProfile(userId: string) {
    const { data, error } = await this.supabase
      .from('users')
      .select('id, email, username, nickname, avatar_url, created_at')
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
      .select('id, email, username, nickname, avatar_url, created_at')
      .single()

    if (error) throw new BadRequestException('更新失败：' + error.message)

    return data
  }
}
