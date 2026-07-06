import { Injectable, BadRequestException } from '@nestjs/common'
import * as nodemailer from 'nodemailer'
import * as crypto from 'crypto'

/** 验证码存储 */
interface CodeRecord {
  code: string
  email: string
  expiresAt: number
  verified: boolean
}

@Injectable()
export class EmailService {
  /** 内存存储验证码，key = email */
  private codeStore = new Map<string, CodeRecord>()

  /** 获取 SMTP 配置 */
  private getTransporter() {
    const user = process.env.SENDER_QQ_EMAIL
    const pass = process.env.SENDER_QQ_AUTH_CODE

    if (!user || !pass) {
      throw new BadRequestException('邮件服务未配置，请联系管理员设置 SENDER_QQ_EMAIL 和 SENDER_QQ_AUTH_CODE')
    }

    return nodemailer.createTransport({
      host: 'smtp.qq.com',
      port: 465,
      secure: true,
      auth: { user, pass },
    })
  }

  /** 生成6位数字验证码 */
  private generateCode(): string {
    return crypto.randomInt(100000, 999999).toString()
  }

  /** 发送验证码到 QQ 邮箱 */
  async sendVerificationCode(email: string) {
    if (!email.endsWith('@qq.com')) {
      throw new BadRequestException('请使用QQ邮箱')
    }

    // 限频：60秒内不能重复发送
    const existing = this.codeStore.get(email)
    if (existing && existing.expiresAt > Date.now() + 4 * 60 * 1000) {
      throw new BadRequestException('验证码已发送，请稍后再试')
    }

    const code = this.generateCode()
    const expiresAt = Date.now() + 5 * 60 * 1000 // 5分钟有效期

    this.codeStore.set(email, { code, email, expiresAt, verified: false })

    const senderEmail = process.env.SENDER_QQ_EMAIL
    const senderAuthCode = process.env.SENDER_QQ_AUTH_CODE

    // 未配置 SMTP 时，直接返回验证码（开发模式）
    if (!senderEmail || !senderAuthCode) {
      console.log(`[Email] 开发模式：验证码为 ${code}（邮箱 ${email}）`)
      return { devCode: code }
    }

    const transporter = this.getTransporter()

    try {
      await transporter.sendMail({
        from: `"回复小助手" <${senderEmail}>`,
        to: email,
        subject: '回复小助手 - 注册验证码',
        text: `您的验证码是：${code}\n\n验证码5分钟内有效，请尽快完成注册。\n\n如非本人操作，请忽略此邮件。`,
        html: `
          <div style="max-width:400px;margin:0 auto;padding:32px;font-family:sans-serif;">
            <h2 style="color:#A85D6A;margin-bottom:24px;">回复小助手</h2>
            <p style="color:#333;font-size:16px;">您的注册验证码：</p>
            <div style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#D98C9A;margin:16px 0;">${code}</div>
            <p style="color:#999;font-size:14px;">验证码5分钟内有效，请尽快完成注册。</p>
            <p style="color:#ccc;font-size:12px;margin-top:24px;">如非本人操作，请忽略此邮件。</p>
          </div>
        `,
      })
      console.log('[Email] 验证码已发送:', email)
      return { devCode: null }
    } catch (err: any) {
      console.error('[Email] 发送失败:', err.message)
      throw new BadRequestException('验证码发送失败，请检查邮箱地址或稍后重试')
    }
  }

  /** 验证验证码 */
  verifyCode(email: string, code: string): boolean {
    const record = this.codeStore.get(email)

    if (!record) {
      return false
    }

    if (record.expiresAt < Date.now()) {
      this.codeStore.delete(email)
      return false
    }

    if (record.code !== code) {
      return false
    }

    // 标记已验证
    record.verified = true
    return true
  }

  /** 检查是否已验证 */
  isVerified(email: string): boolean {
    const record = this.codeStore.get(email)
    return !!record && record.verified && record.expiresAt >= Date.now()
  }

  /** 清理过期验证码（可定时调用） */
  cleanExpired() {
    const now = Date.now()
    for (const [key, record] of this.codeStore) {
      if (record.expiresAt < now) {
        this.codeStore.delete(key)
      }
    }
  }
}
