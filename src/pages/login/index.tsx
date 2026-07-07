import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Taro from '@tarojs/taro'
import { Network } from '@/network'
import { BookHeart, Sparkles, Heart } from 'lucide-react-taro'

const STATUS_BAR_HEIGHT = Taro.getSystemInfoSync().statusBarHeight || 0
const HEADER_TOP = STATUS_BAR_HEIGHT + 40 + 8

export default function Login() {
  const [isRegister, setIsRegister] = useState(true)
  const [qqNumber, setQqNumber] = useState('')
  const [verifyCode, setVerifyCode] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)

  // 验证码倒计时
  const [countdown, setCountdown] = useState(0)
  const [codeSent, setCodeSent] = useState(false)

  /** 发送验证码 */
  const handleSendCode = async () => {
    if (!qqNumber.trim() || !/^\d{5,11}$/.test(qqNumber.trim())) {
      Taro.showToast({ title: '请输入正确的QQ号', icon: 'none' })
      return
    }

    setLoading(true)
    try {
      const email = qqNumber.trim() + '@qq.com'
      console.log('[Login] POST /api/auth/send-code', { email })
      const res = await Network.request({
        url: '/api/auth/send-code',
        method: 'POST',
        data: { email },
      })
      console.log('[Login] send-code response:', res.data)

      if (res.data?.code === 200) {
        setCodeSent(true)

        // 开发模式：后端返回 devCode 时自动填入
        const devCode = res.data?.data?.devCode
        if (devCode) {
          setVerifyCode(devCode)
          Taro.showToast({ title: `验证码：${devCode}`, icon: 'none', duration: 3000 })
        } else {
          Taro.showToast({ title: '验证码已发送', icon: 'success' })
        }

        // 60秒倒计时
        setCountdown(60)
        const timer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        Taro.showToast({ title: res.data?.msg || '发送失败', icon: 'none' })
      }
    } catch (err: any) {
      console.log('[Login] send-code error:', err)
      const msg = err?.data?.message || err?.message || '发送失败'
      Taro.showToast({ title: msg, icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  /** 提交（登录或注册） */
  const handleSubmit = async () => {
    if (!qqNumber.trim() || !/^\d{5,11}$/.test(qqNumber.trim())) {
      Taro.showToast({ title: '请输入正确的QQ号', icon: 'none' })
      return
    }

    if (isRegister) {
      if (!verifyCode.trim()) {
        Taro.showToast({ title: '请输入验证码', icon: 'none' })
        return
      }
    }

    if (!password.trim() || password.length < 6) {
      Taro.showToast({ title: '密码至少6位', icon: 'none' })
      return
    }

    const email = qqNumber.trim() + '@qq.com'
    setLoading(true)
    try {
      if (isRegister) {
        // 注册（带验证码）
        const data: Record<string, string> = {
          email,
          password,
          code: verifyCode.trim(),
        }
        if (nickname.trim()) {
          data.nickname = nickname.trim()
        }

        console.log('[Login] POST /api/auth/register', { email })
        const res = await Network.request({
          url: '/api/auth/register',
          method: 'POST',
          data,
        })
        console.log('[Login] register response:', res.data)

        const result = res.data?.data || res.data
        if (result?.user && result?.token) {
          Taro.setStorageSync('userInfo', result.user)
          Taro.setStorageSync('token', result.token)
          Taro.showToast({ title: '注册成功', icon: 'success' })
          setTimeout(() => {
            Taro.switchTab({ url: '/pages/index/index' })
          }, 500)
        } else {
          Taro.showToast({ title: res.data?.msg || '注册失败', icon: 'none' })
        }
      } else {
        // 登录
        console.log('[Login] POST /api/auth/login', { email })
        const res = await Network.request({
          url: '/api/auth/login',
          method: 'POST',
          data: { email, password },
        })
        console.log('[Login] login response:', res.data)

        const result = res.data?.data || res.data
        if (result?.user && result?.token) {
          Taro.setStorageSync('userInfo', result.user)
          Taro.setStorageSync('token', result.token)
          Taro.showToast({ title: '登录成功', icon: 'success' })
          setTimeout(() => {
            Taro.switchTab({ url: '/pages/index/index' })
          }, 500)
        } else {
          Taro.showToast({ title: '登录失败，请重试', icon: 'none' })
        }
      }
    } catch (err: any) {
      console.log('[Login] Error:', err)
      const msg = err?.data?.message || err?.message || '网络错误'
      Taro.showToast({ title: msg, icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="min-h-screen" style={{ backgroundColor: '#FFF8F4' }}>
      {/* 安全区 */}
      <View style={{ height: HEADER_TOP, flexShrink: 0 }} />

      {/* 品牌区 - 手账风装饰 */}
      <View className="flex flex-col items-center mt-12 mb-10">
        <View className="relative">
          <BookHeart size={56} color="#C4868D" />
          <Sparkles size={16} color="#D4A574" className="absolute -top-1 -right-2" />
        </View>
        <Text className="block text-2xl font-bold mt-4" style={{ color: '#5C3D2E' }}>回复小助手</Text>
        <Text className="block text-sm mt-2" style={{ color: '#A89282' }}>主播私域关系维护工作台</Text>
        <View className="flex flex-row items-center gap-1 mt-2">
          <Heart size={10} color="#C4868D" />
          <Text className="block text-xs" style={{ color: '#C4868D' }}>温柔陪伴每一段关系</Text>
          <Heart size={10} color="#C4868D" />
        </View>
      </View>

      {/* 表单卡片 - Paper Card 风格 */}
      <View className="mx-6 p-6" style={{
        backgroundColor: '#FFFAF5',
        borderRadius: '24px',
        boxShadow: '0 6px 20px rgba(92,61,46,0.06)',
        border: '1px solid #F0DDD0',
      }}
      >
        <Text className="block text-lg font-semibold mb-5" style={{ color: '#5C3D2E' }}>
          {isRegister ? '♡ 注册账号' : '♡ 欢迎回来'}
        </Text>

        {/* QQ号 + @qq.com 后缀 */}
        <View className="mb-4">
          <Text className="block text-sm mb-2" style={{ color: '#8B6F5E' }}>QQ邮箱</Text>
          <View className="flex flex-row items-center gap-2">
            <View className="flex-1 flex flex-row items-center" style={{
              backgroundColor: '#FEF5EE',
              borderRadius: '24px',
              border: '1px solid #F0DDD0',
            }}
            >
              <View className="flex-1 px-4 py-3">
                <Input
                  className="w-full bg-transparent"
                  type="number"
                  placeholder="请输入QQ号"
                  placeholderStyle="color: #C4B5A5"
                  value={qqNumber}
                  onInput={(e) => setQqNumber(e.detail.value)}
                />
              </View>
              <Text className="pr-4 text-sm shrink-0" style={{ color: '#C4868D' }}>@qq.com</Text>
            </View>
            {/* 注册时：获取验证码按钮紧跟QQ号 */}
            {isRegister && (
              <Button
                className="shrink-0 text-sm"
                style={{
                  backgroundColor: countdown > 0 ? '#E8D5CC' : '#C4868D',
                  color: '#fff',
                  borderRadius: '28px',
                  minWidth: '80px',
                  padding: '12px 14px',
                  boxShadow: countdown > 0 ? 'none' : '0 3px 10px rgba(196,134,141,0.25)',
                }}
                onClick={handleSendCode}
                disabled={countdown > 0 || loading}
              >
                <Text className="text-white text-xs">
                  {countdown > 0 ? `${countdown}s` : (codeSent ? '重发' : '获取验证码')}
                </Text>
              </Button>
            )}
          </View>
        </View>

        {/* 注册时：验证码输入 */}
        {isRegister && (
          <View className="mb-4">
            <Text className="block text-sm mb-2" style={{ color: '#8B6F5E' }}>验证码</Text>
            <View className="px-4 py-3" style={{
              backgroundColor: '#FEF5EE',
              borderRadius: '24px',
              border: '1px solid #F0DDD0',
            }}
            >
              <Input
                className="w-full bg-transparent"
                type="number"
                placeholder="请输入6位验证码"
                placeholderStyle="color: #C4B5A5"
                value={verifyCode}
                onInput={(e) => setVerifyCode(e.detail.value)}
              />
            </View>
            {codeSent && (
              <Text className="block text-xs mt-1" style={{ color: '#A89282' }}>
                ✉ 验证码已发送至 {qqNumber}@qq.com，请查收邮件
              </Text>
            )}
          </View>
        )}

        {/* 密码 */}
        <View className="mb-4">
          <Text className="block text-sm mb-2" style={{ color: '#8B6F5E' }}>密码</Text>
          <View className="px-4 py-3" style={{
            backgroundColor: '#FEF5EE',
            borderRadius: '24px',
            border: '1px solid #F0DDD0',
          }}
          >
            <Input
              className="w-full bg-transparent"
              type="text"
              password
              placeholder="至少6位密码"
              placeholderStyle="color: #C4B5A5"
              value={password}
              onInput={(e) => setPassword(e.detail.value)}
            />
          </View>
        </View>

        {/* 昵称（注册时） */}
        {isRegister && (
          <View className="mb-4">
            <Text className="block text-sm mb-2" style={{ color: '#8B6F5E' }}>昵称（选填）</Text>
            <View className="px-4 py-3" style={{
              backgroundColor: '#FEF5EE',
              borderRadius: '24px',
              border: '1px solid #F0DDD0',
            }}
            >
              <Input
                className="w-full bg-transparent"
                placeholder="给自己取个昵称吧"
                placeholderStyle="color: #C4B5A5"
                value={nickname}
                onInput={(e) => setNickname(e.detail.value)}
              />
            </View>
          </View>
        )}

        {/* 提交按钮 - 豆沙粉圆角 */}
        <Button
          className="w-full py-3 mt-2"
          style={{
            backgroundColor: '#C4868D',
            color: '#fff',
            borderRadius: '28px',
            boxShadow: '0 4px 14px rgba(196,134,141,0.3)',
          }}
          onClick={handleSubmit}
          disabled={loading}
        >
          <Text className="text-white font-semibold">
            {loading ? '请稍候...' : (isRegister ? '注册' : '登录')}
          </Text>
        </Button>

        {/* 切换登录/注册 - 虚线分隔 */}
        <View className="flex justify-center mt-5 pt-4" style={{ borderTop: '1px dashed #F0DDD0' }}>
          <Text
            className="text-sm"
            style={{ color: '#C4868D' }}
            onClick={() => { setIsRegister(!isRegister); setCodeSent(false); setVerifyCode(''); setCountdown(0) }}
          >
            {isRegister ? '已有账号？去登录 →' : '没有账号？去注册 →'}
          </Text>
        </View>
      </View>

      {/* 底部装饰 - 手账风 */}
      <View className="flex flex-col items-center mt-10">
        <Text className="block text-xs" style={{ color: '#C4B5A5' }}>✦ 让每一次回复都有温度 ✦</Text>
      </View>
    </View>
  )
}
