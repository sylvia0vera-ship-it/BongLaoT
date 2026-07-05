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
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!username.trim()) {
      Taro.showToast({ title: '请输入用户名', icon: 'none' })
      return
    }
    if (!password.trim() || password.length < 6) {
      Taro.showToast({ title: '密码至少6位', icon: 'none' })
      return
    }

    setLoading(true)
    try {
      const url = isRegister ? '/api/auth/register' : '/api/auth/login'
      const data: Record<string, string> = { username: username.trim(), password }
      if (isRegister && nickname.trim()) {
        data.nickname = nickname.trim()
      }

      console.log('[Login] POST', url, { username: data.username })
      const res = await Network.request({
        url,
        method: 'POST',
        data,
      })
      console.log('[Login] Response:', res.data)

      const result = res.data?.data || res.data

      if (result?.user && result?.token) {
        // 保存登录态
        Taro.setStorageSync('userInfo', result.user)
        Taro.setStorageSync('token', result.token)

        Taro.showToast({
          title: isRegister ? '注册成功' : '登录成功',
          icon: 'success',
        })

        setTimeout(() => {
          Taro.switchTab({ url: '/pages/index/index' })
        }, 500)
      } else {
        Taro.showToast({ title: '操作失败，请重试', icon: 'none' })
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

        {/* 用户名 */}
        <View className="mb-4">
          <Text className="block text-sm mb-2" style={{ color: '#A85D6A' }}>用户名</Text>
          <View className="rounded-xl px-4 py-3" style={{ backgroundColor: '#F8EDEB' }}>
            <Input
              className="w-full bg-transparent"
              placeholder="请输入用户名"
              value={username}
              onInput={(e) => setUsername(e.detail.value)}
            />
          </View>
        </View>

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
            onClick={() => setIsRegister(!isRegister)}
          >
            {isRegister ? '已有账号？去登录' : '没有账号？去注册'}
          </Text>
        </View>
      </View>

      {/* 底部装饰 */}
      <View className="flex justify-center mt-10">
        <Text className="block text-xs" style={{ color: '#C4A09A' }}>温柔手作风 · 让每一次回复都有温度</Text>
      </View>
    </View>
  )
}
