import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import { Textarea } from '@/components/ui/textarea'
import Taro from '@tarojs/taro'
import { Button } from '@/components/ui/button'
import { Network } from '@/network'
import {
  MessageCircleHeart,
  Sparkles,
  Stamp,
  HeartPulse,
  ShieldAlert,
  ShieldCheck,
  Compass,
  PenTool,
  Copy,
  TriangleAlert,
  Ban,
  Smile,
  Info,
  MessageSquare,
  Loader,
} from 'lucide-react-taro'

/** 分析结果类型 */
interface AnalysisResult {
  messageType: string
  emotion: string
  warnings: { label: string; detail: string }[]
  gentleReply: string
  casualReply: string
  boundaryReply: string
  badReply: string
  badReason: string
}

const PRINCIPLES = [
  '不冷漠不敷衍',
  '不油腻不越界',
  '不承诺线下见面',
  '不给无法兑现的承诺',
  '保持温暖但清晰的边界感',
]

const IndexPage = () => {
  const [message, setMessage] = useState('')
  const [context, setContext] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)

  const handleAnalyze = async () => {
    const trimmed = message.trim()
    if (!trimmed) {
      Taro.showToast({ title: '请输入粉丝消息', icon: 'none' })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const res = await Network.request({
        url: '/api/analyze-message',
        method: 'POST',
        data: { message: trimmed, context: context.trim() },
      })

      console.log('分析接口响应:', res.data)

      const data = res.data?.data
      if (data) {
        setResult(data)
      } else {
        Taro.showToast({ title: '分析失败，请重试', icon: 'none' })
      }
    } catch (err) {
      console.error('分析请求失败:', err)
      Taro.showToast({ title: '网络错误，请重试', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = (text: string) => {
    Taro.setClipboardData({ data: text })
  }

  return (
    <View className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <View className="bg-background sticky top-0 z-40 h-14 flex items-center justify-between px-4">
        <View className="flex flex-row items-center gap-2">
          <MessageCircleHeart size={20} color="#D98C9A" />
          <Text className="block text-base font-semibold text-foreground">回复小助手</Text>
        </View>
        <View className="w-10 h-10 flex items-center justify-center rounded-full">
          <Info size={20} color="#7A8061" />
        </View>
      </View>

      {/* Scrollable Content */}
      <View className="flex-1 overflow-y-auto pb-8">
        {/* ===== 消息输入区 ===== */}
        <View className="px-4 pt-4 pb-6">
          <View className="bg-card rounded-2xl p-4 shadow-sm">
            {/* 主输入框 */}
            <View className="bg-muted rounded-xl px-4 py-3">
              <Textarea
                className="h-auto border-none bg-transparent ring-0 ring-offset-0 focus-within:ring-0 focus-within:border-none"
                style={{ width: '100%', minHeight: '80px', backgroundColor: 'transparent', fontSize: '14px' }}
                placeholder="粘贴粉丝发来的微信消息..."
                value={message}
                onInput={(e) => setMessage(e.detail.value)}
                maxlength={500}
              />
            </View>

            {/* 补充背景输入框 */}
            <View className="mt-3 bg-muted rounded-xl px-4 py-3">
              <Textarea
                className="h-auto border-none bg-transparent ring-0 ring-offset-0 focus-within:ring-0 focus-within:border-none"
                style={{ width: '100%', minHeight: '50px', backgroundColor: 'transparent', fontSize: '12px' }}
                placeholder="补充粉丝背景（可选），如「大R粉丝，月消费5k+」"
                value={context}
                onInput={(e) => setContext(e.detail.value)}
                maxlength={200}
              />
            </View>

            {/* 分析按钮 */}
            <Button
              className="w-full bg-primary text-primary-foreground py-4 rounded-xl text-base font-semibold mt-4"
              onClick={handleAnalyze}
              disabled={loading}
            >
              {loading ? (
                <View className="flex flex-row items-center gap-2">
                  <Loader size={18} color="#ffffff" className="animate-spin" />
                  <Text className="text-primary-foreground text-base">分析中...</Text>
                </View>
              ) : (
                <View className="flex flex-row items-center gap-2">
                  <Sparkles size={18} color="#ffffff" />
                  <Text className="text-primary-foreground text-base font-semibold">分析消息</Text>
                </View>
              )}
            </Button>
          </View>
        </View>

        {/* ===== AI分析结果区 ===== */}
        {result && (
          <>
            {/* 原始消息回显 */}
            <View className="px-4 pb-4">
              <View className="bg-card rounded-2xl p-4 shadow-sm">
                <View className="flex flex-row items-center gap-2 mb-2">
                  <MessageSquare size={16} color="#7A8061" />
                  <Text className="block text-xs font-semibold text-muted-foreground">粉丝消息</Text>
                </View>
                <Text className="block text-sm text-foreground leading-relaxed">{message.trim()}</Text>
                {context.trim() && (
                  <Text className="block text-xs text-muted-foreground mt-2">背景：{context.trim()}</Text>
                )}
              </View>
            </View>

            {/* 消息类型判断 */}
            <View className="px-4 pb-4">
              <View className="bg-card rounded-2xl p-4 shadow-sm">
                <View className="flex flex-row items-center gap-2 mb-3">
                  <Stamp size={16} color="#D98C9A" />
                  <Text className="block text-sm font-semibold text-foreground">消息类型</Text>
                </View>
                <View className="inline-flex items-center px-3 py-2 rounded-full bg-primary-container">
                  <Text className="text-sm font-semibold text-foreground">{result.messageType}</Text>
                </View>
              </View>
            </View>

            {/* 情绪判断 */}
            <View className="px-4 pb-4">
              <View className="bg-card rounded-2xl p-4 shadow-sm">
                <View className="flex flex-row items-center gap-2 mb-2">
                  <HeartPulse size={16} color="#D98C9A" />
                  <Text className="block text-sm font-semibold text-foreground">情绪判断</Text>
                </View>
                <Text className="block text-sm text-foreground leading-relaxed">{result.emotion}</Text>
              </View>
            </View>

            {/* 注意事项 */}
            <View className="px-4 pb-4">
              <View className="bg-card rounded-2xl p-4 shadow-sm">
                <View className="flex flex-row items-center gap-2 mb-2">
                  <ShieldAlert size={16} color="#C77763" />
                  <Text className="block text-sm font-semibold text-foreground">注意事项</Text>
                </View>
                <View className="flex flex-col gap-2">
                  {result.warnings.map((w, i) => (
                    <View key={i} className="flex flex-row items-start gap-2">
                      <View className="w-2 h-2 rounded-full bg-destructive mt-2 shrink-0" />
                      <Text className="block text-sm text-destructive leading-relaxed">
                        <Text className="font-bold">{w.label}</Text> → {w.detail}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* ===== 三种回复建议区 ===== */}
            <View className="px-4 pb-4">
              <View className="flex flex-row items-center gap-2 mb-4">
                <PenTool size={16} color="#D98C9A" />
                <Text className="block text-sm font-semibold text-foreground">回复建议</Text>
              </View>

              {/* 温柔安抚版 */}
              <View className="bg-warm-pink rounded-2xl p-4 shadow-sm mb-3">
                <View className="flex flex-row items-center gap-2 mb-2">
                  <MessageCircleHeart size={16} color="#D98C9A" />
                  <Text className="block text-xs font-bold text-primary tracking-wide">温柔安抚版</Text>
                </View>
                <Text className="block text-sm text-foreground leading-relaxed">{result.gentleReply}</Text>
                <View
                  className="mt-3 inline-flex flex-row items-center gap-1 px-3 py-2 rounded-lg bg-white bg-opacity-60 active:bg-white active:bg-opacity-80"
                  onClick={() => handleCopy(result.gentleReply)}
                >
                  <Copy size={14} color="#7A8061" />
                  <Text className="text-xs font-medium text-muted-foreground">复制</Text>
                </View>
              </View>

              {/* 轻松互动版 */}
              <View className="bg-warm-cream rounded-2xl p-4 shadow-sm mb-3">
                <View className="flex flex-row items-center gap-2 mb-2">
                  <Smile size={16} color="#D98C9A" />
                  <Text className="block text-xs font-bold text-warning tracking-wide">轻松互动版</Text>
                </View>
                <Text className="block text-sm text-foreground leading-relaxed">{result.casualReply}</Text>
                <View
                  className="mt-3 inline-flex flex-row items-center gap-1 px-3 py-2 rounded-lg bg-white bg-opacity-60 active:bg-white active:bg-opacity-80"
                  onClick={() => handleCopy(result.casualReply)}
                >
                  <Copy size={14} color="#7A8061" />
                  <Text className="text-xs font-medium text-muted-foreground">复制</Text>
                </View>
              </View>

              {/* 边界清晰版 */}
              <View className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm mb-3">
                <View className="flex flex-row items-center gap-2 mb-2">
                  <ShieldCheck size={16} color="#7A8061" />
                  <Text className="block text-xs font-bold text-muted-foreground tracking-wide">边界清晰版</Text>
                </View>
                <Text className="block text-sm text-foreground leading-relaxed">{result.boundaryReply}</Text>
                <View
                  className="mt-3 inline-flex flex-row items-center gap-1 px-3 py-2 rounded-lg bg-muted active:bg-surface-container-high"
                  onClick={() => handleCopy(result.boundaryReply)}
                >
                  <Copy size={14} color="#7A8061" />
                  <Text className="text-xs font-medium text-muted-foreground">复制</Text>
                </View>
              </View>
            </View>

            {/* ===== 避雷提醒区 ===== */}
            <View className="px-4 pb-4">
              <View className="bg-warm-white rounded-2xl p-4 shadow-sm border border-destructive border-opacity-20">
                <View className="flex flex-row items-center gap-2 mb-3">
                  <TriangleAlert size={16} color="#C77763" />
                  <Text className="block text-sm font-semibold text-destructive">避雷提醒</Text>
                </View>
                {/* 不建议的回复 */}
                <View className="bg-muted bg-opacity-60 rounded-xl p-3 mb-3">
                  <Text className="block text-xs text-muted-foreground mb-1">不建议这样回复：</Text>
                  <Text className="block text-sm text-foreground leading-relaxed line-through decoration-destructive decoration-opacity-40">
                    {result.badReply}
                  </Text>
                </View>
                {/* 为什么不建议 */}
                <View className="flex flex-row items-start gap-2">
                  <Ban size={16} color="#C77763" />
                  <Text className="block text-sm text-destructive leading-relaxed">{result.badReason}</Text>
                </View>
              </View>
            </View>
          </>
        )}

        {/* ===== 底部原则提示 ===== */}
        <View className="px-4 pb-8">
          <View className="bg-warm-white rounded-2xl p-4 shadow-sm">
            <View className="flex flex-row items-center gap-2 mb-3">
              <Compass size={16} color="#D98C9A" />
              <Text className="block text-sm font-semibold text-foreground">核心原则</Text>
            </View>
            <View className="flex flex-col gap-3">
              {PRINCIPLES.map((p, i) => (
                <View key={i} className="flex flex-row items-center gap-3">
                  <View className="w-6 h-6 rounded-full bg-primary-container flex items-center justify-center shrink-0">
                    <Text className="text-xs font-bold text-primary">{i + 1}</Text>
                  </View>
                  <Text className="block text-sm text-foreground">{p}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}

export default IndexPage
