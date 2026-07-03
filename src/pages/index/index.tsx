import { useState, useEffect } from 'react'
import { View, Text, Image } from '@tarojs/components'
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
  PenTool,
  TriangleAlert,
  Ban,
  Smile,
  Loader,
  Users,
  ChevronDown,
  X,
  BookHeart,
  StickyNote,
  ImagePlus,
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
const MESSAGE_TYPE_CONFIG: Record<string, { color: string; bg: string }> = {
  '抱怨回复慢': { color: '#D98C9A', bg: '#FDE2E4' },
  '情绪低落':   { color: '#7A8061', bg: '#F0EDE4' },
  '暧昧试探':   { color: '#C77763', bg: '#FFF1DE' },
  '消费后求关注': { color: '#B07D4F', bg: '#FFF5E6' },
  '上线安排询问': { color: '#5B8A72', bg: '#E8F5EE' },
  '普通互动':   { color: '#6B8EB5', bg: '#E8F0F8' },
  '冷场唤回':   { color: '#8B7EB5', bg: '#F0EAF8' },
  '轻微不满':   { color: '#B5914F', bg: '#FFF8E8' },
  '边界试探':   { color: '#B55A5A', bg: '#FDE8E8' },
  '其他':       { color: '#7A8061', bg: '#F0EDE4' },
}

const LEVEL_STYLE: Record<string, { color: string; bg: string }> = {
  '新粉': { color: '#6B8EB5', bg: '#E8F0F8' },
  '普通': { color: '#7A8061', bg: '#F0EDE4' },
  '忠实': { color: '#5B8A72', bg: '#E8F5EE' },
  '重点': { color: '#D98C9A', bg: '#FDE2E4' },
}

const getTypeStyle = (type: string) => {
  return MESSAGE_TYPE_CONFIG[type] || MESSAGE_TYPE_CONFIG['其他']
}

const PRINCIPLES = [
  '可以撒娇暧昧但不越界',
  '让粉丝感到被偏爱被记住',
  '不承诺线下见面和现实恋爱',
  '不用PUA、威胁、卖惨方式',
  '像微信聊天一样自然',
]

/** 安全区顶部高度 */
/** 安全区顶部高度（状态栏 + 胶囊按钮区域 + 间距） */
const HEADER_TOP_PADDING = (() => {
  try {
    const sysInfo = Taro.getSystemInfoSync()
    const statusBarH = sysInfo.statusBarHeight || 0
    const capsuleHeight = 40
    return statusBarH + capsuleHeight + 8
  } catch { return 60 }
})()

const IndexPage = () => {
  const [message, setMessage] = useState('')
  const [context, setContext] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [fans, setFans] = useState<FanBrief[]>([])
  const [selectedFanId, setSelectedFanId] = useState('')
  const [showFanPicker, setShowFanPicker] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [imagePreview, setImagePreview] = useState('')
  const [uploading, setUploading] = useState(false)

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
    Taro.eventCenter.on('onShow', onShow)
    return () => { Taro.eventCenter.off('onShow', onShow) }
  }, [])

  const selectedFan = fans.find(f => f.id === selectedFanId)

  const handleChooseImage = async () => {
    try {
      const res = await Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
      })
      const tempPath = res.tempFilePaths[0]
      setImagePreview(tempPath)
      setUploading(true)

      const uploadRes = await Network.uploadFile({
        url: '/api/upload-image',
        filePath: tempPath,
        name: 'file',
      })
      console.log('图片上传响应:', uploadRes.data)
      const resData = typeof uploadRes.data === 'string' ? JSON.parse(uploadRes.data) : uploadRes.data
      const data = resData?.data
      if (data?.url) {
        setImageUrl(data.url)
        Taro.showToast({ title: '图片已上传', icon: 'success', duration: 1000 })
      } else {
        Taro.showToast({ title: '上传失败', icon: 'none' })
        setImagePreview('')
      }
    } catch (err) {
      console.error('选择图片失败:', err)
      setImagePreview('')
    } finally {
      setUploading(false)
    }
  }

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
          image_url: imageUrl || undefined,
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
    <View className="flex flex-col min-h-screen" style={{ backgroundColor: '#F8EDEB' }}>
      {/* Header - 便签式标题区 */}
      <View
        className="px-5 pb-3"
        style={{ paddingTop: `${HEADER_TOP_PADDING}px` }}
      >
        <View className="flex flex-row items-center justify-between">
          <View className="flex flex-row items-center gap-2">
            <BookHeart size={22} color="#A85D6A" />
            <Text className="block text-2xl font-bold" style={{ color: '#2F2523' }}>回复小助手</Text>
          </View>
          <View
            className="flex flex-row items-center gap-1 px-3 py-1 rounded-full"
            style={{ backgroundColor: '#FDE2E4' }}
            onClick={() => Taro.navigateTo({ url: '/pages/fans/index' })}
          >
            <Users size={13} color="#D98C9A" />
            <Text className="text-xs font-bold" style={{ color: '#D98C9A' }}>粉丝</Text>
          </View>
        </View>
        <Text className="block text-xs mt-1" style={{ color: '#7A8061' }}>帮你拿捏分寸，轻松回复粉丝消息</Text>
      </View>

      {/* Scrollable Content */}
      <View className="flex-1 overflow-y-auto pb-8">

        {/* ===== 粉丝选择 - 便签标签 ===== */}
        <View className="px-5 pt-1 pb-2">
          <View
            className="flex flex-row items-center justify-between rounded-2xl px-3 py-2"
            style={{ backgroundColor: '#FFF7F2', border: '1px dashed #E8C9C4' }}
            onClick={() => setShowFanPicker(!showFanPicker)}
          >
            <View className="flex flex-row items-center gap-2">
              <StickyNote size={13} color="#D98C9A" />
              {selectedFan ? (
                <View className="flex flex-row items-center gap-2">
                  <Text className="block text-xs font-bold" style={{ color: '#2F2523' }}>{selectedFan.name}</Text>
                  <View
                    className="inline-flex items-center px-2 py-0 rounded-full"
                    style={{ backgroundColor: (LEVEL_STYLE[selectedFan.relationship_level] || LEVEL_STYLE['普通']).bg }}
                  >
                    <Text className="text-xs font-bold" style={{ color: (LEVEL_STYLE[selectedFan.relationship_level] || LEVEL_STYLE['普通']).color }}>
                      {selectedFan.relationship_level}
                    </Text>
                  </View>
                </View>
              ) : (
                <Text className="block text-xs" style={{ color: '#7A8061' }}>选择粉丝（可选，带入记忆）</Text>
              )}
            </View>
            <View className="flex flex-row items-center gap-1">
              {selectedFanId && (
                <View onClick={(e) => { e.stopPropagation && e.stopPropagation(); setSelectedFanId(''); setShowFanPicker(false) }}>
                  <X size={13} color="#999" />
                </View>
              )}
              <ChevronDown size={13} color="#999" />
            </View>
          </View>

          {/* 粉丝选择下拉 - 便签列表 */}
          {showFanPicker && (
            <View className="rounded-2xl mt-1 overflow-hidden" style={{ backgroundColor: '#FFF7F2', border: '1px dashed #E8C9C4' }}>
              {fans.length === 0 ? (
                <View className="px-4 py-3">
                  <Text className="block text-xs" style={{ color: '#7A8061' }}>暂无粉丝档案，点击右上角添加</Text>
                </View>
              ) : (
                fans.map((fan) => {
                  const isSelected = selectedFanId === fan.id
                  const levelS = LEVEL_STYLE[fan.relationship_level] || LEVEL_STYLE['普通']
                  return (
                    <View
                      key={fan.id}
                      className="flex flex-row items-center gap-2 px-4 py-2"
                      style={{ backgroundColor: isSelected ? '#FDE2E4' : 'transparent' }}
                      onClick={() => { setSelectedFanId(isSelected ? '' : fan.id); setShowFanPicker(false) }}
                    >
                      <View className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: levelS.bg }}>
                        <Text className="text-xs font-bold" style={{ color: levelS.color }}>{fan.name.charAt(0)}</Text>
                      </View>
                      <Text className="block text-xs font-bold flex-1" style={{ color: '#2F2523' }}>{fan.name}</Text>
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

        {/* ===== 消息输入区 - 浅粉便签 ===== */}
        <View className="px-5 pt-1 pb-3">
          <View
            className="rounded-2xl p-4"
            style={{ backgroundColor: '#FDE2E4' }}
          >
            <View className="flex flex-row items-center gap-1 mb-2">
              <MessageCircleHeart size={13} color="#A85D6A" />
              <Text className="block text-xs font-bold" style={{ color: '#A85D6A' }}>粉丝发来的消息</Text>
            </View>

            {/* 主输入框 */}
            <View
              className="rounded-xl px-3 py-2 mb-2"
              style={{ backgroundColor: '#ffffff' }}
            >
              <Input
                className="border-none bg-transparent p-0 shadow-none ring-0 focus-within:ring-0 focus-within:border-none rounded-none"
                style={{ fontSize: '14px', width: '100%' }}
                placeholder="粘贴粉丝发来的微信消息..."
                placeholderClass="text-gray-400"
                value={message}
                onInput={(e) => setMessage(e.detail.value)}
                maxlength={500}
              />
            </View>

            {/* 补充背景 */}
            <View
              className="rounded-xl px-3 py-2 mb-2"
              style={{ backgroundColor: '#FFF7F2' }}
            >
              <Input
                className="border-none bg-transparent p-0 shadow-none ring-0 focus-within:ring-0 focus-within:border-none rounded-none"
                style={{ fontSize: '12px', width: '100%' }}
                placeholder="补充粉丝背景（可选）"
                placeholderClass="text-gray-400"
                value={context}
                onInput={(e) => setContext(e.detail.value)}
                maxlength={200}
              />
            </View>

            {/* 图片上传 - 便签式 */}
            <View className="mb-3">
              {imagePreview ? (
                <View className="relative rounded-xl overflow-hidden" style={{ backgroundColor: '#FFF7F2' }}>
                  <View className="flex flex-row items-center gap-2 p-2">
                    <View className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
                      <Image src={imagePreview} className="w-full h-full" mode="aspectFill" />
                    </View>
                    <View className="flex-1">
                      <Text className="block text-xs font-bold" style={{ color: '#2F2523' }}>已添加截图</Text>
                      <Text className="block text-xs" style={{ color: '#7A8061' }}>{uploading ? '上传中...' : 'AI 会识别图片内容'}</Text>
                    </View>
                    <View
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: '#FDE2E4' }}
                      onClick={() => { setImagePreview(''); setImageUrl('') }}
                    >
                      <X size={12} color="#D98C9A" />
                    </View>
                  </View>
                </View>
              ) : (
                <View
                  className="flex flex-row items-center justify-center gap-2 rounded-xl py-2"
                  style={{ backgroundColor: '#FFF7F2', border: '1px dashed #E8C9C4' }}
                  onClick={handleChooseImage}
                >
                  <ImagePlus size={14} color="#D98C9A" />
                  <Text className="block text-xs" style={{ color: '#D98C9A' }}>上传聊天截图（可选）</Text>
                </View>
              )}
            </View>

            {/* 分析按钮 - 印章风格 */}
            <View
              className="flex flex-row items-center justify-center gap-2 rounded-xl py-2"
              style={{
                backgroundColor: loading ? '#D98C9A' : '#A85D6A',
                opacity: loading ? 0.8 : 1,
              }}
              onClick={handleAnalyze}
            >
              {loading ? (
                <Loader size={14} color="#ffffff" className="animate-spin" />
              ) : (
                <Sparkles size={14} color="#ffffff" />
              )}
              <Text style={{ color: '#ffffff', fontSize: '14px', fontWeight: 700 }}>
                {loading ? '分析中...' : '帮我想想怎么回'}
              </Text>
            </View>
          </View>
        </View>

        {/* ===== 分析结果 - 手作卡片组 ===== */}
        {result && (
          <View className="px-5 pb-4">
            {/* 消息类型 + 情绪 - 小标签 */}
            <View className="flex flex-row items-center gap-2 mb-2 flex-wrap">
              <Stamp size={12} color="#A85D6A" />
              <View
                className="inline-flex items-center px-2 py-0 rounded-full"
                style={{ backgroundColor: getTypeStyle(result.messageType).bg }}
              >
                <Text className="text-xs font-bold" style={{ color: getTypeStyle(result.messageType).color }}>
                  {result.messageType}
                </Text>
              </View>
              <View className="h-3 w-px" style={{ backgroundColor: '#E8C9C4' }} />
              <HeartPulse size={12} color="#C77763" />
              <Text className="block text-xs" style={{ color: '#2F2523' }}>{result.emotion}</Text>
            </View>

            {/* 注意事项 - 陶土色小条 */}
            {result.warnings && result.warnings.length > 0 && (
              <View
                className="rounded-xl px-3 py-2 mb-2"
                style={{ backgroundColor: '#FFF1DE', borderLeft: '3px solid #C77763' }}
              >
                <View className="flex flex-row items-center gap-1 mb-1">
                  <ShieldAlert size={11} color="#C77763" />
                  <Text className="block text-xs font-bold" style={{ color: '#C77763' }}>注意</Text>
                </View>
                <View className="flex flex-col gap-1">
                  {result.warnings.map((w, i) => (
                    <View key={i} className="flex flex-row items-start gap-1">
                      <View className="w-1 h-1 rounded-full mt-2 shrink-0" style={{ backgroundColor: '#C77763' }} />
                      <Text className="block text-xs leading-snug" style={{ color: '#2F2523' }}>
                        <Text className="font-bold" style={{ color: '#C77763' }}>{w.label}</Text> → {w.detail}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* 回复建议 - 三张手作便签卡片 */}
            <View className="flex flex-row items-center gap-1 mb-2">
              <PenTool size={12} color="#A85D6A" />
              <Text className="block text-xs font-bold" style={{ color: '#A85D6A' }}>回复建议</Text>
              <Text className="block text-xs" style={{ color: '#7A8061' }}>· 点击复制</Text>
            </View>

            {/* 温柔安抚 - 浅粉卡片 */}
            <View
              className="rounded-2xl px-3 py-2 mb-2"
              style={{ backgroundColor: '#ffffff', borderLeft: '3px solid #D98C9A' }}
              onClick={() => handleCopy(result.gentleReply)}
            >
              <View className="flex flex-row items-center gap-1 mb-1">
                <MessageCircleHeart size={11} color="#D98C9A" />
                <Text className="block text-xs font-bold" style={{ color: '#D98C9A' }}>温柔撒娇</Text>
              </View>
              <Text className="block text-xs leading-snug" style={{ color: '#2F2523' }}>{result.gentleReply}</Text>
            </View>

            {/* 轻松互动 - 奶油卡片 */}
            <View
              className="rounded-2xl px-3 py-2 mb-2"
              style={{ backgroundColor: '#ffffff', borderLeft: '3px solid #C77763' }}
              onClick={() => handleCopy(result.casualReply)}
            >
              <View className="flex flex-row items-center gap-1 mb-1">
                <Smile size={11} color="#C77763" />
                <Text className="block text-xs font-bold" style={{ color: '#C77763' }}>轻松暧昧</Text>
              </View>
              <Text className="block text-xs leading-snug" style={{ color: '#2F2523' }}>{result.casualReply}</Text>
            </View>

            {/* 边界清晰 - 橄榄灰卡片 */}
            <View
              className="rounded-2xl px-3 py-2 mb-2"
              style={{ backgroundColor: '#ffffff', borderLeft: '3px solid #7A8061' }}
              onClick={() => handleCopy(result.boundaryReply)}
            >
              <View className="flex flex-row items-center gap-1 mb-1">
                <ShieldCheck size={11} color="#7A8061" />
                <Text className="block text-xs font-bold" style={{ color: '#7A8061' }}>甜而不腻</Text>
              </View>
              <Text className="block text-xs leading-snug" style={{ color: '#2F2523' }}>{result.boundaryReply}</Text>
            </View>

            {/* 避雷提醒 - 陶土色印章 */}
            <View
              className="rounded-2xl px-3 py-2"
              style={{ backgroundColor: '#FFF5F0', borderLeft: '3px solid #B55A5A' }}
            >
              <View className="flex flex-row items-center gap-1 mb-1">
                <TriangleAlert size={11} color="#B55A5A" />
                <Text className="block text-xs font-bold" style={{ color: '#B55A5A' }}>避雷提醒</Text>
              </View>
              <View className="rounded-lg px-2 py-1 mb-1" style={{ backgroundColor: '#FDE8E8' }}>
                <Text className="block text-xs line-through" style={{ color: '#2F2523', textDecorationColor: '#B55A5A' }}>
                  {result.badReply}
                </Text>
              </View>
              <View className="flex flex-row items-start gap-1">
                <Ban size={10} color="#C77763" />
                <Text className="block text-xs leading-snug" style={{ color: '#C77763' }}>{result.badReason}</Text>
              </View>
            </View>
          </View>
        )}

        {/* 底部原则 - 手写标签式 */}
        <View className="px-5 pb-6">
          <View className="flex flex-row items-center gap-1 mb-2">
            <BookHeart size={12} color="#7A8061" />
            <Text className="block text-xs" style={{ color: '#7A8061' }}>核心原则</Text>
          </View>
          <View className="flex flex-row flex-wrap gap-1">
            {PRINCIPLES.map((p, i) => (
              <View
                key={i}
                className="inline-flex items-center px-2 py-1 rounded-full"
                style={{ backgroundColor: '#FFF7F2', border: '1px dashed #E8C9C4' }}
              >
                <Text className="text-xs" style={{ color: '#2F2523' }}>{p}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  )
}

export default IndexPage
