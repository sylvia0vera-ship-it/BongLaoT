import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import { Input } from '@/components/ui/input'
import Taro from '@tarojs/taro'
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
  '上线安排询问': { color: '#5B8A72', bg: '#E8F5EE', icon: 'calendar' },
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
      {/* Header - 融入内容流 */}
      <View className="bg-background sticky top-0 z-40 px-4 pt-4 pb-2">
        <View className="flex flex-row items-center justify-between">
          <View className="flex flex-row items-center gap-2">
            <MessageCircleHeart size={20} color="#D98C9A" />
            <Text className="block text-base font-bold text-foreground">回复小助手</Text>
          </View>
          <View className="w-7 h-7 flex items-center justify-center rounded-full bg-muted">
            <Info size={14} color="#7A8061" />
          </View>
        </View>
        <Text className="block text-xs text-muted-foreground mt-1">帮你拿捏分寸，轻松回复粉丝消息</Text>
      </View>

      {/* Scrollable Content */}
      <View className="flex-1 overflow-y-auto pb-6">
        {/* ===== 消息输入区 ===== */}
        <View className="px-4 pt-1 pb-3">
          {/* 主输入框 - 胶囊型 */}
          <View className="flex flex-row items-center" style={{ backgroundColor: '#ffffff', borderRadius: '999px', boxShadow: '0 2px 10px rgba(0,0,0,0.07)', height: '46px', paddingLeft: '16px', paddingRight: '4px' }}>
            <View style={{ flex: 1 }}>
              <Input
                className="border-none bg-transparent p-0 h-full shadow-none ring-0 focus-within:ring-0 focus-within:border-none rounded-none"
                style={{ fontSize: '14px' }}
                placeholder="粘贴粉丝发来的微信消息..."
                placeholderClass="text-gray-400"
                value={message}
                onInput={(e) => setMessage(e.detail.value)}
                maxlength={500}
              />
            </View>
            <View
              onClick={handleAnalyze}
              style={{ flexShrink: 0, backgroundColor: '#D98C9A', borderRadius: '999px', padding: '0 16px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? (
                <Loader size={14} color="#ffffff" className="animate-spin" />
              ) : (
                <Sparkles size={14} color="#ffffff" />
              )}
              <Text style={{ color: '#ffffff', fontSize: '13px', fontWeight: 600 }}>{loading ? '分析中' : '分析'}</Text>
            </View>
          </View>

          {/* 补充背景输入框 */}
          <View className="mt-2 flex flex-row items-center" style={{ backgroundColor: '#ffffff', borderRadius: '999px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', height: '38px', paddingLeft: '16px' }}>
            <Input
              className="border-none bg-transparent p-0 h-full shadow-none ring-0 focus-within:ring-0 focus-within:border-none rounded-none"
              style={{ fontSize: '12px' }}
              placeholder="补充粉丝背景（可选）"
              placeholderClass="text-gray-400"
              value={context}
              onInput={(e) => setContext(e.detail.value)}
              maxlength={200}
            />
          </View>
        </View>

        {/* ===== 分析结果 - 全部合一，紧凑展示 ===== */}
        {result && (
          <View className="px-4 pb-4">
            <View className="bg-card rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 10px rgba(217,140,154,0.10)' }}>
              {/* 消息类型 + 情绪 - 一行紧凑 */}
              <View className="px-4 pt-3 pb-3">
                <View className="flex flex-row items-center gap-2 flex-wrap">
                  <View className="flex flex-row items-center gap-1">
                    <Stamp size={12} color="#D98C9A" />
                    <Text className="block text-xs text-muted-foreground">类型</Text>
                  </View>
                  <View
                    className="inline-flex items-center px-2 py-0 rounded-full"
                    style={{ backgroundColor: getTypeStyle(result.messageType).bg }}
                  >
                    <Text
                      className="text-xs font-bold"
                      style={{ color: getTypeStyle(result.messageType).color }}
                    >
                      {result.messageType}
                    </Text>
                  </View>
                  <View className="mx-1 h-3 w-px bg-border" />
                  <View className="flex flex-row items-center gap-1 flex-1">
                    <HeartPulse size={12} color="#D98C9A" />
                    <Text className="block text-xs text-foreground leading-snug">{result.emotion}</Text>
                  </View>
                </View>
              </View>

              {/* 注意事项 - 紧凑展示 */}
              {result.warnings && result.warnings.length > 0 && (
                <>
                  <View className="mx-4 h-px bg-border" />
                  <View className="px-4 py-2">
                    <View className="flex flex-row items-center gap-1 mb-1">
                      <ShieldAlert size={12} color="#C77763" />
                      <Text className="block text-xs font-semibold text-muted-foreground">注意</Text>
                    </View>
                    <View className="flex flex-col gap-1">
                      {result.warnings.map((w, i) => (
                        <View key={i} className="flex flex-row items-start gap-1">
                          <View className="w-1 h-1 rounded-full bg-destructive mt-2 shrink-0" />
                          <Text className="block text-xs text-foreground leading-snug">
                            <Text className="font-bold text-destructive">{w.label}</Text> → {w.detail}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </>
              )}

              {/* 分隔线 */}
              <View className="mx-4 h-px bg-border" />

              {/* 回复建议 */}
              <View className="px-4 py-3">
                <View className="flex flex-row items-center gap-1 mb-2">
                  <PenTool size={12} color="#D98C9A" />
                  <Text className="block text-xs font-bold text-foreground">回复建议</Text>
                  <Text className="block text-xs text-muted-foreground">· 点击复制</Text>
                </View>

                {/* 温柔安抚版 */}
                <View
                  className="rounded-xl px-3 py-2 mb-2 active:bg-primary-container"
                  style={{ backgroundColor: '#FDE2E4' }}
                  onClick={() => handleCopy(result.gentleReply)}
                >
                  <View className="flex flex-row items-center gap-1 mb-1">
                    <MessageCircleHeart size={11} color="#D98C9A" />
                    <Text className="block text-xs font-bold text-primary">温柔安抚</Text>
                  </View>
                  <Text className="block text-xs text-foreground leading-snug">{result.gentleReply}</Text>
                </View>

                {/* 轻松互动版 */}
                <View
                  className="rounded-xl px-3 py-2 mb-2 active:bg-primary-container"
                  style={{ backgroundColor: '#FFF1DE' }}
                  onClick={() => handleCopy(result.casualReply)}
                >
                  <View className="flex flex-row items-center gap-1 mb-1">
                    <Smile size={11} color="#C77763" />
                    <Text className="block text-xs font-bold text-warning">轻松互动</Text>
                  </View>
                  <Text className="block text-xs text-foreground leading-snug">{result.casualReply}</Text>
                </View>

                {/* 边界清晰版 */}
                <View
                  className="rounded-xl px-3 py-2 active:bg-primary-container"
                  style={{ backgroundColor: '#F0EDE4' }}
                  onClick={() => handleCopy(result.boundaryReply)}
                >
                  <View className="flex flex-row items-center gap-1 mb-1">
                    <ShieldCheck size={11} color="#7A8061" />
                    <Text className="block text-xs font-bold text-muted-foreground">边界清晰</Text>
                  </View>
                  <Text className="block text-xs text-foreground leading-snug">{result.boundaryReply}</Text>
                </View>
              </View>

              {/* 避雷提醒 - 嵌入同一卡片 */}
              <View className="mx-4 h-px bg-border" />
              <View className="px-4 py-3" style={{ backgroundColor: '#FFF5F5' }}>
                <View className="flex flex-row items-center gap-1 mb-1">
                  <TriangleAlert size={12} color="#C77763" />
                  <Text className="block text-xs font-bold text-destructive">避雷提醒</Text>
                </View>
                <View className="bg-white bg-opacity-60 rounded-lg px-3 py-2 mb-1">
                  <Text className="block text-xs text-foreground line-through decoration-destructive">
                    {result.badReply}
                  </Text>
                </View>
                <View className="flex flex-row items-start gap-1">
                  <Ban size={11} color="#C77763" />
                  <Text className="block text-xs text-destructive leading-snug">{result.badReason}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ===== 底部原则提示 - 标签流 ===== */}
        <View className="px-4 pb-6">
          <View className="flex flex-row items-center gap-1 mb-2 px-1">
            <Compass size={12} color="#D98C9A" />
            <Text className="block text-xs text-muted-foreground">核心原则</Text>
          </View>
          <View className="flex flex-row flex-wrap gap-1">
            {PRINCIPLES.map((p, i) => (
              <View key={i} className="inline-flex items-center px-2 py-1 rounded-full bg-card" style={{ boxShadow: '0 1px 3px rgba(217,140,154,0.06)' }}>
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
