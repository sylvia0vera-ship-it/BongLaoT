import { Controller, Post, Get, Put, Body, Query, HttpCode } from '@nestjs/common'
import { AuthService } from './auth.service'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** 注册 */
  @Post('register')
  @HttpCode(200)
  async register(
    @Body() body: { email: string; password: string; nickname?: string }
  ) {
    console.log('[Auth] POST /api/auth/register', { email: body.email })
    const result = await this.authService.register(body.email, body.password, body.nickname)
    console.log('[Auth] 注册成功', { userId: result.user.id })
    return { code: 200, msg: '注册成功', data: result }
  }

  /** 登录 */
  @Post('login')
  @HttpCode(200)
  async login(
    @Body() body: { email: string; password: string }
  ) {
    console.log('[Auth] POST /api/auth/login', { email: body.email })
    const result = await this.authService.login(body.email, body.password)
    console.log('[Auth] 登录成功', { userId: result.user.id })
    return { code: 200, msg: '登录成功', data: result }
  }

  /** 获取用户信息 */
  @Get('profile')
  async getProfile(@Query('userId') userId: string) {
    console.log('[Auth] GET /api/auth/profile', { userId })
    const user = await this.authService.getProfile(userId)
    return { code: 200, msg: 'success', data: user }
  }

  /** 更新用户信息 */
  @Put('profile')
  async updateProfile(
    @Body() body: { userId: string; nickname?: string; avatar_url?: string }
  ) {
    console.log('[Auth] PUT /api/auth/profile', { userId: body.userId })
    const user = await this.authService.updateProfile(body.userId, {
      nickname: body.nickname,
      avatar_url: body.avatar_url,
    })
    return { code: 200, msg: '更新成功', data: user }
  }
}
