import { useState, useEffect } from 'react'
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
  Loader,
  Users,
  ChevronDown,
  X,
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

/** 粉丝简要信息 */
interface FanBrief {
  id: string
  name: string
  tags: string | null
  relationship_level: string
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

const LEVEL_STYLE: Record<string, { color: string; bg: string }> = {
  '新粉': { color: '#6B8EB5', bg: '#E8F0F8' },
  '普通': { color: '#7A8061', bg: '#F0EDE4' },
  '忠实': { color: '#5B8A72', bg: '#E8F5EE' },
  '重点': { color: '#D98C9A', bg: '#FDE2E4' },
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
  const [fans, setFans] = useState<FanBrief[]>([])
  const [selectedFanId, setSelectedFanId] = useState('')
  const [showFanPicker, setShowFanPicker] = useState(false)

  // 加载粉丝列表
  useEffect(() => {
    const fetchFans = async () => {
      try {
        const res = await Network.request({ url: '/api/fans' })
        const data = res.data?.data
        if (data) {
          setFans(data.map((f: FanBrief) => ({ id: f.id, name: f.name, tags: f.tags, relationship_level: f.relationship_level })))
        }
      } catch (err) {
        console.error('获取粉丝列表失败:', err)
      }
    }
    fetchFans()
  }, [])

  // 从粉丝管理页返回时刷新列表
  useEffect(() => {
    const onShow = () => {
      const fetchFans = async () => {
        try {
          const res = await Network.request({ url: '/api/fans' })
          const data = res.data?.data
          if (data) {
            setFans(data.map((f: FanBrief) => ({ id: f.id, name: f.name, tags: f.tags, relationship_level: f.relationship_level })))
          }
        } catch (err) {
          console.error('刷新粉丝列表失败:', err)
        }
      }
      fetchFans()
    }
    // 页面显示时刷新
    Taro.eventCenter.on('onShow', onShow)
    return () => { Taro.eventCenter.off('onShow', onShow) }
  }, [])

  const selectedFan = fans.find(f => f.id === selectedFanId)

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
        data: {
          message: trimmed,
          context: context.trim(),
          fan_id: selectedFanId || undefined,
        },
      })

      console.log('分析接口响应:', res.data)

      const data = res.data?.data
      if (data) {
        setResult(data)

        // 自动保存对话记录
        if (selectedFanId) {
          try {
            await Network.request({
              url: `/api/fans/${selectedFanId}/chat-logs`,
              method: 'POST',
              data: {
                message: trimmed,
                context: context.trim(),
                analysis_result: data,
              },
            })
            console.log('对话记录已自动保存')
          } catch (err) {
            console.error('保存对话记录失败:', err)
          }
        }
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
      <View className="bg-background sticky top-0 z-40 px-4 pt-4 pb-2">
        <View className="flex flex-row items-center justify-between">
          <View className="flex flex-row items-center gap-2">
            <MessageCircleHeart size={20} color="#D98C9A" />
            <Text className="block text-base font-bold text-foreground">回复小助手</Text>
          </View>
          <View className="flex flex-row items-center gap-2">
            <View
              onClick={() => Taro.navigateTo({ url: '/pages/fans/index' })}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-muted"
            >
              <Users size={14} color="#7A8061" />
            </View>
          </View>
        </View>
        <Text className="block text-xs text-muted-foreground mt-1">帮你拿捏分寸，轻松回复粉丝消息</Text>
      </View>

      {/* Scrollable Content */}
      <View className="flex-1 overflow-y-auto pb-6">
        {/* ===== 粉丝选择 ===== */}
        <View className="px-4 pt-1 pb-1">
          <View
            className="flex flex-row items-center justify-between rounded-xl px-3 py-2"
            style={{ backgroundColor: '#ffffff', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
            onClick={() => setShowFanPicker(!showFanPicker)}
          >
            <View className="flex flex-row items-center gap-2">
              <Users size={14} color="#D98C9A" />
              {selectedFan ? (
                <View className="flex flex-row items-center gap-2">
                  <Text className="block text-xs font-bold text-foreground">{selectedFan.name}</Text>
                  <View
                    className="inline-flex items-center px-2 py-0 rounded-full"
                    style={{ backgroundColor: (LEVEL_STYLE[selectedFan.relationship_level] || LEVEL_STYLE['普通']).bg }}
                  >
                    <Text className="text-xs font-bold" style={{ color: (LEVEL_STYLE[selectedFan.relationship_level] || LEVEL_STYLE['普通']).color }}>
                      {selectedFan.relationship_level}
                    </Text>
                  </View>
                  {selectedFan.tags && (
                    <Text className="block text-xs text-muted-foreground">{selectedFan.tags}</Text>
                  )}
                </View>
              ) : (
                <Text className="block text-xs text-muted-foreground">选择粉丝（可选，带入记忆）</Text>
              )}
            </View>
            <View className="flex flex-row items-center gap-1">
              {selectedFanId && (
                <View onClick={(e) => { e.stopPropagation && e.stopPropagation(); setSelectedFanId(''); setShowFanPicker(false) }}>
                  <X size={14} color="#999" />
                </View>
              )}
              <ChevronDown size={14} color="#999" />
            </View>
          </View>

          {/* 粉丝选择下拉 */}
          {showFanPicker && (
            <View className="rounded-xl mt-1 overflow-hidden" style={{ backgroundColor: '#ffffff', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', maxHeight: '200px' }}>
              {fans.length === 0 ? (
                <View className="px-4 py-3">
                  <Text className="block text-xs text-muted-foreground">暂无粉丝档案，点击右上角添加</Text>
                </View>
              ) : (
                fans.map((fan) => {
                  const isSelected = selectedFanId === fan.id
                  const levelS = LEVEL_STYLE[fan.relationship_level] || LEVEL_STYLE['普通']
                  return (
                    <View
                      key={fan.id}
                      className="flex flex-row items-center gap-2 px-4 py-2"
                      style={{ backgroundColor: isSelected ? '#FDE2E4' : '#ffffff' }}
                      onClick={() => { setSelectedFanId(isSelected ? '' : fan.id); setShowFanPicker(false) }}
                    >
                      <View className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: levelS.bg }}>
                        <Text className="text-xs font-bold" style={{ color: levelS.color }}>{fan.name.charAt(0)}</Text>
                      </View>
                      <Text className="block text-xs font-bold text-foreground flex-1">{fan.name}</Text>
                      <View className="inline-flex items-center px-2 py-0 rounded-full" style={{ backgroundColor: levelS.bg }}>
                        <Text className="text-xs" style={{ color: levelS.color }}>{fan.relationship_level}</Text>
                      </View>
                    </View>
                  )
                })
              )}
            </View>
          )}
        </View>

        {/* ===== 消息输入区 ===== */}
        <View className="px-4 pt-2 pb-3">
          {/* 主输入框 */}
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

        {/* ===== 分析结果 ===== */}
        {result && (
          <View className="px-4 pb-4">
            <View className="bg-card rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 10px rgba(217,140,154,0.10)' }}>
              {/* 消息类型 + 情绪 */}
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
                    <Text className="text-xs font-bold" style={{ color: getTypeStyle(result.messageType).color }}>
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

              {/* 注意事项 */}
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

              <View className="mx-4 h-px bg-border" />

              {/* 回复建议 */}
              <View className="px-4 py-3">
                <View className="flex flex-row items-center gap-1 mb-2">
                  <PenTool size={12} color="#D98C9A" />
                  <Text className="block text-xs font-bold text-foreground">回复建议</Text>
                  <Text className="block text-xs text-muted-foreground">· 点击复制</Text>
                </View>

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

              {/* 避雷提醒 */}
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

        {/* 底部原则 */}
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
