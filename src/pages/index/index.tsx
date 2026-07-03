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

/** 消息类型配置 - 与飞书测试表对应 */
const MESSAGE_TYPE_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  '抱怨回复慢': { color: '#D98C9A', bg: '#FDE2E4', icon: 'clock' },
  '情绪低落':   { color: '#7A8061', bg: '#F0EDE4', icon: 'cloud' },
  '暧昧试探':   { color: '#C77763', bg: '#FFF1DE', icon: 'heart' },
  '消费后求关注': { color: '#B07D4F', bg: '#FFF5E6', icon: 'gift' },
  '直播安排询问': { color: '#5B8A72', bg: '#E8F5EE', icon: 'calendar' },
  '普通互动':   { color: '#6B8EB5', bg: '#E8F0F8', icon: 'chat' },
  '冷场唤回':   { color: '#8B7EB5', bg: '#F0EAF8', icon: 'revive' },
  '轻微不满':   { color: '#B5914F', bg: '#FFF8E8', icon: 'frown' },
  '边界试探':   { color: '#B55A5A', bg: '#FDE8E8', icon: 'shield' },
  '其他':       { color: '#7A8061', bg: '#F0EDE4', icon: 'help' },
}

const getTypeStyle = (type: string) => {
  const config = MESSAGE_TYPE_CONFIG[type] || MESSAGE_TYPE_CONFIG['其他']
  return config
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
      {/* Header - 融入内容流，不做明显分割 */}
      <View className="bg-background sticky top-0 z-40 px-5 pt-5 pb-3">
        <View className="flex flex-row items-center justify-between">
          <View className="flex flex-row items-center gap-2">
            <MessageCircleHeart size={22} color="#D98C9A" />
            <Text className="block text-lg font-bold text-foreground">回复小助手</Text>
          </View>
          <View className="w-8 h-8 flex items-center justify-center rounded-full bg-muted">
            <Info size={16} color="#7A8061" />
          </View>
        </View>
        <Text className="block text-xs text-muted-foreground mt-1">帮你拿捏分寸，轻松回复粉丝消息</Text>
      </View>

      {/* Scrollable Content */}
      <View className="flex-1 overflow-y-auto pb-8">
        {/* ===== 消息输入区 ===== */}
        <View className="px-5 pt-2 pb-5">
          <View className="bg-card rounded-3xl p-5" style={{ boxShadow: '0 2px 12px rgba(217,140,154,0.12)' }}>
            {/* 主输入框 */}
            <Text className="block text-xs font-semibold text-muted-foreground mb-2">粉丝消息</Text>
            <View className="bg-muted rounded-2xl px-4 py-3">
              <Textarea
                className="h-auto border-none bg-transparent ring-0 ring-offset-0 focus-within:ring-0 focus-within:border-none"
                style={{ width: '100%', minHeight: '80px', backgroundColor: 'transparent', fontSize: '15px' }}
                placeholder="粘贴粉丝发来的微信消息..."
                value={message}
                onInput={(e) => setMessage(e.detail.value)}
                maxlength={500}
              />
            </View>

            {/* 补充背景输入框 */}
            <Text className="block text-xs font-semibold text-muted-foreground mt-4 mb-2">补充背景（可选）</Text>
            <View className="bg-muted rounded-2xl px-4 py-3">
              <Textarea
                className="h-auto border-none bg-transparent ring-0 ring-offset-0 focus-within:ring-0 focus-within:border-none"
                style={{ width: '100%', minHeight: '44px', backgroundColor: 'transparent', fontSize: '13px' }}
                placeholder="如「大R粉丝，月消费5k+」"
                value={context}
                onInput={(e) => setContext(e.detail.value)}
                maxlength={200}
              />
            </View>

            {/* 分析按钮 */}
            <Button
              className="w-full bg-primary text-primary-foreground mt-5 rounded-2xl h-12 text-base font-semibold"
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

        {/* ===== AI分析结果区 - 合并为一个连贯的卡片 ===== */}
        {result && (
          <View className="px-5 pb-5">
            <View className="bg-card rounded-3xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(217,140,154,0.12)' }}>
              {/* 原始消息回显 */}
              <View className="px-5 pt-5 pb-4">
                <View className="flex flex-row items-center gap-2 mb-2">
                  <MessageSquare size={14} color="#7A8061" />
                  <Text className="block text-xs font-semibold text-muted-foreground">粉丝消息</Text>
                </View>
                <View className="bg-muted rounded-xl px-4 py-3">
                  <Text className="block text-sm text-foreground leading-relaxed">{message.trim()}</Text>
                  {context.trim() && (
                    <Text className="block text-xs text-muted-foreground mt-2 pt-2 border-t border-border">背景：{context.trim()}</Text>
                  )}
                </View>
              </View>

              {/* 分隔线 */}
              <View className="mx-5 h-px bg-border" />

              {/* 消息类型 + 情绪判断 合并展示 */}
              <View className="px-5 py-4">
                <View className="flex flex-row items-center gap-3">
                  <View className="flex flex-row items-center gap-2">
                    <Stamp size={14} color="#D98C9A" />
                    <Text className="block text-xs font-semibold text-muted-foreground">类型</Text>
                  </View>
                  <View
                    className="inline-flex items-center px-3 py-1 rounded-full"
                    style={{ backgroundColor: getTypeStyle(result.messageType).bg }}
                  >
                    <Text
                      className="text-xs font-bold"
                      style={{ color: getTypeStyle(result.messageType).color }}
                    >
                      {result.messageType}
                    </Text>
                  </View>
                </View>
                <View className="flex flex-row items-start gap-2 mt-3">
                  <HeartPulse size={14} color="#D98C9A" className="mt-1 shrink-0" />
                  <Text className="block text-sm text-foreground leading-relaxed">{result.emotion}</Text>
                </View>
              </View>

              {/* 分隔线 */}
              <View className="mx-5 h-px bg-border" />

              {/* 注意事项 */}
              <View className="px-5 py-4">
                <View className="flex flex-row items-center gap-2 mb-3">
                  <ShieldAlert size={14} color="#C77763" />
                  <Text className="block text-xs font-semibold text-muted-foreground">注意</Text>
                </View>
                <View className="flex flex-col gap-2">
                  {result.warnings.map((w, i) => (
                    <View key={i} className="flex flex-row items-start gap-2">
                      <View className="w-2 h-2 rounded-full bg-destructive mt-2 shrink-0" />
                      <Text className="block text-sm text-foreground leading-relaxed">
                        <Text className="font-bold text-destructive">{w.label}</Text> → {w.detail}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ===== 三种回复建议区 - 合并为一个卡片 ===== */}
        {result && (
          <View className="px-5 pb-5">
            <View className="flex flex-row items-center gap-2 mb-3 px-1">
              <PenTool size={16} color="#D98C9A" />
              <Text className="block text-sm font-bold text-foreground">回复建议</Text>
              <Text className="block text-xs text-muted-foreground">点击即可复制</Text>
            </View>

            <View className="bg-card rounded-3xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(217,140,154,0.12)' }}>
              {/* 温柔安抚版 */}
              <View
                className="px-5 pt-4 pb-4 active:bg-primary-container"
                onClick={() => handleCopy(result.gentleReply)}
              >
                <View className="flex flex-row items-center gap-2 mb-2">
                  <View className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FDE2E4' }}>
                    <MessageCircleHeart size={12} color="#D98C9A" />
                  </View>
                  <Text className="block text-xs font-bold text-primary">温柔安抚版</Text>
                </View>
                <Text className="block text-sm text-foreground leading-relaxed pl-8">{result.gentleReply}</Text>
              </View>

              <View className="mx-5 h-px bg-border" />

              {/* 轻松互动版 */}
              <View
                className="px-5 pt-4 pb-4 active:bg-primary-container"
                onClick={() => handleCopy(result.casualReply)}
              >
                <View className="flex flex-row items-center gap-2 mb-2">
                  <View className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FFF1DE' }}>
                    <Smile size={12} color="#D98C9A" />
                  </View>
                  <Text className="block text-xs font-bold text-warning">轻松互动版</Text>
                </View>
                <Text className="block text-sm text-foreground leading-relaxed pl-8">{result.casualReply}</Text>
              </View>

              <View className="mx-5 h-px bg-border" />

              {/* 边界清晰版 */}
              <View
                className="px-5 pt-4 pb-4 active:bg-primary-container"
                onClick={() => handleCopy(result.boundaryReply)}
              >
                <View className="flex flex-row items-center gap-2 mb-2">
                  <View className="w-6 h-6 rounded-full flex items-center justify-center bg-muted">
                    <ShieldCheck size={12} color="#7A8061" />
                  </View>
                  <Text className="block text-xs font-bold text-muted-foreground">边界清晰版</Text>
                </View>
                <Text className="block text-sm text-foreground leading-relaxed pl-8">{result.boundaryReply}</Text>
              </View>
            </View>
          </View>
        )}

        {/* ===== 避雷提醒区 ===== */}
        {result && (
          <View className="px-5 pb-5">
            <View className="rounded-3xl p-5" style={{ backgroundColor: '#FFF5F5', boxShadow: '0 2px 12px rgba(199,119,99,0.1)' }}>
              <View className="flex flex-row items-center gap-2 mb-3">
                <TriangleAlert size={16} color="#C77763" />
                <Text className="block text-sm font-bold text-destructive">避雷提醒</Text>
              </View>
              {/* 不建议的回复 */}
              <View className="bg-white bg-opacity-60 rounded-2xl p-3 mb-3">
                <Text className="block text-xs text-muted-foreground mb-1">不建议这样回复：</Text>
                <Text className="block text-sm text-foreground leading-relaxed line-through decoration-destructive">
                  {result.badReply}
                </Text>
              </View>
              {/* 为什么不建议 */}
              <View className="flex flex-row items-start gap-2">
                <Ban size={14} color="#C77763" />
                <Text className="block text-sm text-destructive leading-relaxed">{result.badReason}</Text>
              </View>
            </View>
          </View>
        )}

        {/* ===== 底部原则提示 - 精简为标签流 ===== */}
        <View className="px-5 pb-8">
          <View className="flex flex-row items-center gap-2 mb-3 px-1">
            <Compass size={14} color="#D98C9A" />
            <Text className="block text-xs font-semibold text-muted-foreground">核心原则</Text>
          </View>
          <View className="flex flex-row flex-wrap gap-2">
            {PRINCIPLES.map((p, i) => (
              <View key={i} className="inline-flex items-center px-3 py-1 rounded-full bg-card" style={{ boxShadow: '0 1px 4px rgba(217,140,154,0.08)' }}>
                <Text className="text-xs text-foreground">{p}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  )
}

export default IndexPage
