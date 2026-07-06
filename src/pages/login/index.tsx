import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Taro from '@tarojs/taro'
import { Network } from '@/network'
import { BookHeart } from 'lucide-react-taro'

const STATUS_BAR_HEIGHT = Taro.getSystemInfoSync().statusBarHeight || 0
const HEADER_TOP = STATUS_BAR_HEIGHT + 40 + 8

export default function Login() {
  const [isRegister, setIsRegister] = useState(false)
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
        Taro.showToast({ title: '验证码已发送', icon: 'success' })

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
    <View className="min-h-screen" style={{ backgroundColor: '#F8EDEB' }}>
      {/* 安全区 */}
      <View style={{ height: HEADER_TOP, flexShrink: 0 }} />

      {/* 品牌区 */}
      <View className="flex flex-col items-center mt-12 mb-10">
        <BookHeart size={56} color="#D98C9A" />
        <Text className="block text-2xl font-bold mt-4" style={{ color: '#A85D6A' }}>回复小助手</Text>
        <Text className="block text-sm mt-2" style={{ color: '#C77763' }}>主播私域关系维护工作台</Text>
      </View>

      {/* 表单卡片 */}
      <View className="mx-6 rounded-2xl p-6" style={{ backgroundColor: 'rgba(255,255,255,0.7)' }}>
        <Text className="block text-lg font-semibold mb-5" style={{ color: '#A85D6A' }}>
          {isRegister ? '注册账号' : '欢迎回来'}
        </Text>

        {/* QQ号 + @qq.com 后缀 */}
        <View className="mb-4">
          <Text className="block text-sm mb-2" style={{ color: '#A85D6A' }}>QQ邮箱</Text>
          <View className="rounded-xl flex flex-row items-center" style={{ backgroundColor: '#F8EDEB' }}>
            <View className="flex-1 px-4 py-3">
              <Input
                className="w-full bg-transparent"
                type="number"
                placeholder="请输入QQ号"
                value={qqNumber}
                onInput={(e) => setQqNumber(e.detail.value)}
              />
            </View>
            <Text className="pr-4 text-sm" style={{ color: '#A85D6A' }}>@qq.com</Text>
          </View>
        </View>

        {/* 注册时：验证码输入 + 发送按钮 */}
        {isRegister && (
          <View className="mb-4">
            <Text className="block text-sm mb-2" style={{ color: '#A85D6A' }}>验证码</Text>
            <View className="flex flex-row items-center gap-2">
              <View className="flex-1 rounded-xl px-4 py-3" style={{ backgroundColor: '#F8EDEB' }}>
                <Input
                  className="w-full bg-transparent"
                  type="number"
                  placeholder="6位验证码"
                  value={verifyCode}
                  onInput={(e) => setVerifyCode(e.detail.value)}
                />
              </View>
              <Button
                className="rounded-xl px-4 py-3 text-sm shrink-0"
                style={{
                  backgroundColor: countdown > 0 ? '#E8C9C4' : '#D98C9A',
                  color: '#fff',
                  minWidth: '90px',
                }}
                onClick={handleSendCode}
                disabled={countdown > 0 || loading}
              >
                <Text className="text-white text-sm">
                  {countdown > 0 ? `${countdown}s` : (codeSent ? '重新发送' : '获取验证码')}
                </Text>
              </Button>
            </View>
            {codeSent && (
              <Text className="block text-xs mt-1" style={{ color: '#C4A09A' }}>
                验证码已发送至 {qqNumber}@qq.com
              </Text>
            )}
          </View>
        )}

        {/* 密码 */}
        <View className="mb-4">
          <Text className="block text-sm mb-2" style={{ color: '#A85D6A' }}>密码</Text>
          <View className="rounded-xl px-4 py-3" style={{ backgroundColor: '#F8EDEB' }}>
            <Input
              className="w-full bg-transparent"
              type="text"
              password
              placeholder="至少6位密码"
              value={password}
              onInput={(e) => setPassword(e.detail.value)}
            />
          </View>
        </View>

        {/* 昵称（注册时） */}
        {isRegister && (
          <View className="mb-4">
            <Text className="block text-sm mb-2" style={{ color: '#A85D6A' }}>昵称（选填）</Text>
            <View className="rounded-xl px-4 py-3" style={{ backgroundColor: '#F8EDEB' }}>
              <Input
                className="w-full bg-transparent"
                placeholder="给自己取个昵称吧"
                value={nickname}
                onInput={(e) => setNickname(e.detail.value)}
              />
            </View>
          </View>
        )}

        {/* 提交按钮 */}
        <Button
          className="w-full rounded-xl py-3 mt-2 text-white font-semibold"
          style={{ backgroundColor: '#D98C9A' }}
          onClick={handleSubmit}
          disabled={loading}
        >
          <Text className="text-white font-semibold">
            {loading ? '请稍候...' : (isRegister ? '注册' : '登录')}
          </Text>
        </Button>

        {/* 切换登录/注册 */}
        <View className="flex justify-center mt-4">
          <Text
            className="text-sm"
            style={{ color: '#C77763' }}
            onClick={() => { setIsRegister(!isRegister); setCodeSent(false); setVerifyCode(''); setCountdown(0) }}
          >
            {isRegister ? '已有账号？去登录' : '没有账号？去注册'}
          </Text>
        </View>
      </View>

      {/* 底部装饰 */}
      <View className="flex justify-center mt-10">
        <Text className="block text-xs" style={{ color: '#C4A09A' }}>让每一次回复都有温度</Text>
      </View>
    </View>
  )
}
