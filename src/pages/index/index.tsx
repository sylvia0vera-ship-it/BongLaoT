import { useState, useEffect } from 'react'
import { View, Text, Image } from '@tarojs/components'
import { Input } from '@/components/ui/input'
import Taro from '@tarojs/taro'
import { Network } from '@/network'
import { BookHeart, ImagePlus, X, Users, Sparkles } from 'lucide-react-taro'

const STATUS_BAR_HEIGHT = Taro.getSystemInfoSync().statusBarHeight || 0
const HEADER_TOP = STATUS_BAR_HEIGHT + 40 + 8

/** 人设类型 */
const PERSONA_OPTIONS = [
  { key: '温柔陪伴', label: '温柔陪伴', emoji: '🤍' },
  { key: '女友感', label: '女友感', emoji: '💕' },
  { key: '撒娇型', label: '撒娇型', emoji: '🥺' },
  { key: '成熟姐姐', label: '成熟姐姐', emoji: '✨' },
  { key: '轻松朋友', label: '轻松朋友', emoji: '👋' },
]


/** 工作流模式 */
const MODE_OPTIONS = [
  { key: 'mid-chat', label: '聊中回复', icon: '💬' },
  { key: 'post-chat', label: '聊后复盘', icon: '📝' },
]

export default function Index() {
  // 工作流模式
  const [chatMode, setChatMode] = useState<'mid-chat' | 'post-chat'>('mid-chat')
  // 输入
  const [message, setMessage] = useState('')
  const [context, setContext] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imagePreview, setImagePreview] = useState('')
  // 粉丝
  const [fans, setFans] = useState<any[]>([])
  const [selectedFanId, setSelectedFanId] = useState('')
  // 人设
  const [persona, setPersona] = useState('温柔陪伴')
  // 状态
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  useEffect(() => { loadFans() }, [])

  const loadFans = async () => {
    try {
      const res = await Network.request({ url: '/api/fans' })
      setFans(res.data.data || [])
    } catch (e) { console.error('加载粉丝失败', e) }
  }

  const handleChooseImage = async () => {
    try {
      const res = await Taro.chooseImage({ count: 1, sizeType: ['compressed'] })
      const tempPath = res.tempFilePaths[0]
      setImagePreview(tempPath)
      const uploadRes = await Network.uploadFile({ url: '/api/upload-image', filePath: tempPath, name: 'file' })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = (uploadRes as any).data.data
      setImageUrl(data.url as string)
      Taro.showToast({ title: '图片已上传', icon: 'success', duration: 1000 })
    } catch (e) {
      console.error('图片上传失败', e)
      Taro.showToast({ title: '上传失败', icon: 'none' })
    }
  }

  const handleAnalyze = async () => {
    if (!message.trim()) {
      Taro.showToast({ title: '请输入消息内容', icon: 'none' })
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const reqData: any = {
        message: message.trim(),
        chat_mode: chatMode,
      }
      if (context.trim()) reqData.context = `人设风格：${persona}。${context.trim()}`
      else reqData.context = `人设风格：${persona}`
      if (selectedFanId) reqData.fan_id = selectedFanId
      if (imageUrl) reqData.image_url = imageUrl

      const res = await Network.request({
        url: '/api/analyze-message',
        method: 'POST',
        data: reqData,
      })
      console.log('分析结果:', res.data)
      const data = res.data.data?.data || res.data.data
      setResult(data)

      // 保存对话记录
      if (selectedFanId && chatMode === 'mid-chat') {
        try {
          await Network.request({
            url: `/api/fans/${selectedFanId}/chat-logs`,
            method: 'POST',
            data: {
              message: message.trim(),
              context: reqData.context,
              chat_mode: chatMode,
              analysis_result: JSON.stringify(data).substring(0, 500),
            },
          })
        } catch (e) { console.error('保存记录失败', e) }
      }
    } catch (e) {
      console.error('分析失败', e)
      Taro.showToast({ title: '分析失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const goFans = () => Taro.navigateTo({ url: '/pages/fans/index' })

  return (
    <View className="min-h-screen" style={{ backgroundColor: '#F8EDEB' }}>
      {/* Header */}
      <View style={{ paddingTop: HEADER_TOP, paddingLeft: 16, paddingRight: 16, paddingBottom: 8, display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <BookHeart size={22} color="#A85D6A" />
          <Text className="block text-2xl font-bold" style={{ color: '#2F2523' }}>回复小助手</Text>
        </View>
        <View onClick={goFans} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 16, borderStyle: 'dashed', borderWidth: 1, borderColor: '#E8C9C4' }}>
          <Users size={14} color="#A85D6A" />
          <Text className="block text-xs" style={{ color: '#A85D6A' }}>粉丝</Text>
        </View>
      </View>

      {/* 工作流模式切换 */}
      <View style={{ paddingLeft: 16, paddingRight: 16, marginBottom: 8, display: 'flex', flexDirection: 'row', gap: 6 }}>
        {MODE_OPTIONS.map(m => (
          <View
            key={m.key}
            onClick={() => { setChatMode(m.key as any); setResult(null) }}
            style={{
              flex: 1, paddingTop: 6, paddingBottom: 6, borderRadius: 12,
              backgroundColor: chatMode === m.key ? '#D98C9A' : '#FFFFFF',
              display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4,
              borderWidth: 1, borderColor: chatMode === m.key ? '#D98C9A' : '#E8C9C4',
            }}
          >
            <Text className="block text-sm">{m.icon}</Text>
            <Text className="block text-xs font-medium" style={{ color: chatMode === m.key ? '#FFFFFF' : '#2F2523' }}>{m.label}</Text>
          </View>
        ))}
      </View>

      {/* 输入区 */}
      <View style={{ marginLeft: 12, marginRight: 12, marginBottom: 8, padding: 12, borderRadius: 16, backgroundColor: '#FDE2E4' }}>
        {/* 粉丝选择 */}
        <View style={{ marginBottom: 8 }}>
          <Text className="block text-xs mb-1" style={{ color: '#7A8061' }}>选择粉丝</Text>
          <View style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
            <View
              onClick={() => setSelectedFanId('')}
              style={{ padding: '3px 10px', borderRadius: 12, borderWidth: 1, borderColor: selectedFanId ? '#E8C9C4' : '#D98C9A', backgroundColor: selectedFanId ? '#FFFFFF' : '#D98C9A' }}
            >
              <Text className="block text-xs" style={{ color: selectedFanId ? '#2F2523' : '#FFFFFF' }}>未选择</Text>
            </View>
            {fans.map((f: any) => (
              <View
                key={f.id}
                onClick={() => setSelectedFanId(f.id)}
                style={{ padding: '3px 10px', borderRadius: 12, borderWidth: 1, borderColor: selectedFanId === f.id ? '#D98C9A' : '#E8C9C4', backgroundColor: selectedFanId === f.id ? '#D98C9A' : '#FFFFFF' }}
              >
                <Text className="block text-xs" style={{ color: selectedFanId === f.id ? '#FFFFFF' : '#2F2523' }}>{f.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 人设选择 */}
        <View style={{ marginBottom: 8 }}>
          <Text className="block text-xs mb-1" style={{ color: '#7A8061' }}>人设风格</Text>
          <View style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
            {PERSONA_OPTIONS.map(p => (
              <View
                key={p.key}
                onClick={() => setPersona(p.key)}
                style={{ padding: '3px 8px', borderRadius: 12, borderWidth: 1, borderColor: persona === p.key ? '#D98C9A' : '#E8C9C4', backgroundColor: persona === p.key ? '#D98C9A' : '#FFFFFF' }}
              >
                <Text className="block text-xs" style={{ color: persona === p.key ? '#FFFFFF' : '#2F2523' }}>{p.emoji} {p.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 消息输入 */}
        <View style={{ marginBottom: 6 }}>
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: '8px 12px' }}>
            <Input
              style={{ width: '100%', fontSize: '14px' }}
              placeholder={chatMode === 'post-chat' ? '粘贴本轮聊天内容...' : '粘贴粉丝发来的消息...'}
              value={message}
              onInput={(e: any) => setMessage(e.detail.value)}
            />
          </View>
        </View>

        {/* 补充背景 */}
        <View style={{ marginBottom: 6 }}>
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: '8px 12px' }}>
            <Input
              style={{ width: '100%', fontSize: '13px' }}
              placeholder="补充背景（可选）"
              value={context}
              onInput={(e: any) => setContext(e.detail.value)}
            />
          </View>
        </View>

        {/* 图片上传 */}
        {chatMode === 'mid-chat' && (
          <View style={{ marginBottom: 6 }}>
            {imagePreview ? (
              <View style={{ position: 'relative', width: 64, height: 64 }}>
                <Image src={imagePreview} style={{ width: 64, height: 64, borderRadius: 8 }} mode="aspectFill" />
                <View onClick={() => { setImageUrl(''); setImagePreview('') }} style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: 9, backgroundColor: '#C77763', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <X size={10} color="#FFFFFF" />
                </View>
              </View>
            ) : (
              <View onClick={handleChooseImage} style={{ width: 64, height: 64, borderRadius: 8, borderWidth: 1, borderColor: '#E8C9C4', borderStyle: 'dashed', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
                <ImagePlus size={20} color="#D98C9A" />
              </View>
            )}
          </View>
        )}

        {/* 分析按钮 */}
        <View
          onClick={handleAnalyze}
          style={{
            backgroundColor: loading ? '#E8C9C4' : '#A85D6A',
            borderRadius: 12, paddingTop: 8, paddingBottom: 8,
            display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4,
          }}
        >
          {loading ? (
            <Text className="block text-sm text-white">正在生成...</Text>
          ) : (
            <>
              <Sparkles size={14} color="#FFFFFF" />
              <Text className="block text-sm text-white font-medium">
                {chatMode === 'post-chat' ? '生成聊后复盘' : '帮我想想怎么回'}
              </Text>
            </>
          )}
        </View>
      </View>

      {/* 结果区 */}
      {result && (
        <View style={{ marginLeft: 12, marginRight: 12, marginBottom: 12 }}>
          {/* === 聊中回复 === */}
          {chatMode === 'mid-chat' && (
            <View style={{ borderRadius: 16, backgroundColor: '#FFFFFF', padding: 12, borderWidth: 1, borderColor: '#E8C9C4' }}>
              {/* 类型+情绪+关系阶段 */}
              <View style={{ display: 'flex', flexDirection: 'row', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
                {result.messageType && (
                  <View style={{ padding: '2px 8px', borderRadius: 8, backgroundColor: '#FDE2E4' }}>
                    <Text className="block text-xs font-medium" style={{ color: '#A85D6A' }}>{result.messageType}</Text>
                  </View>
                )}
                {result.emotion && (
                  <View style={{ padding: '2px 8px', borderRadius: 8, backgroundColor: '#FFF1DE' }}>
                    <Text className="block text-xs" style={{ color: '#C77763' }}>{result.emotion}</Text>
                  </View>
                )}
                {result.relationshipStage && (
                  <View style={{ padding: '2px 8px', borderRadius: 8, backgroundColor: '#FFF7F2' }}>
                    <Text className="block text-xs" style={{ color: '#7A8061' }}>{result.relationshipStage}</Text>
                  </View>
                )}
              </View>

              {/* 风险提醒 */}
              {result.riskWarning && (
                <View style={{ borderLeftWidth: 3, borderLeftColor: '#C77763', paddingLeft: 8, marginBottom: 6, backgroundColor: '#FFF7F2', borderRadius: 4, paddingTop: 4, paddingBottom: 4}}>
                  <Text className="block text-xs" style={{ color: '#C77763' }}>⚠️ {result.riskWarning}</Text>
                </View>
              )}

              {/* 回复策略 */}
              {result.replyStrategy && (
                <View style={{ marginBottom: 6, padding: '4px 8px', borderRadius: 8, backgroundColor: '#FFF1DE' }}>
                  <Text className="block text-xs" style={{ color: '#C77763' }}>🎯 {result.replyStrategy}</Text>
                </View>
              )}

              {/* 三版回复 */}
              <View style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                {[
                  { label: '温柔撒娇', value: result.gentleReply, color: '#FDE2E4', border: '#D98C9A' },
                  { label: '轻松暧昧', value: result.casualReply, color: '#FFF1DE', border: '#C77763' },
                  { label: '甜而不腻', value: result.sweetReply, color: '#FFF7F2', border: '#7A8061' },
                ].map(r => r.value && (
                  <View key={r.label} style={{ borderLeftWidth: 3, borderLeftColor: r.border, paddingLeft: 8, borderRadius: 4, backgroundColor: r.color, paddingTop: 4, paddingBottom: 4}}>
                    <Text className="block text-xs font-medium mb-1" style={{ color: '#2F2523' }}>{r.label}</Text>
                    <Text className="block text-xs" style={{ color: '#2F2523' }}>{r.value}</Text>
                  </View>
                ))}
              </View>

              {/* 前5句破冰 */}
              {result.iceBreaker && (
                <View style={{ marginBottom: 6 }}>
                  <Text className="block text-xs font-medium mb-1" style={{ color: '#2F2523' }}>🔥 前5句破冰</Text>
                  <View style={{ display: 'flex', flexDirection: 'row', gap: 3, flexWrap: 'wrap' }}>
                    {Object.entries(result.iceBreaker).map(([k, v]) => (
                      <View key={k} style={{ padding: '3px 8px', borderRadius: 10, backgroundColor: '#FDE2E4' }}>
                        <Text className="block text-xs" style={{ color: '#A85D6A' }}>{k}. {v as string}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* 不建议发送 */}
              {result.badReply && (
                <View style={{ borderLeftWidth: 3, borderLeftColor: '#C77763', paddingLeft: 8, marginBottom: 6, backgroundColor: '#FFF7F2', borderRadius: 4, paddingTop: 4, paddingBottom: 4}}>
                  <Text className="block text-xs line-through" style={{ color: '#7A8061' }}>✗ {result.badReply}</Text>
                  {result.badReason && <Text className="block text-xs mt-1" style={{ color: '#C77763' }}>原因：{result.badReason}</Text>}
                </View>
              )}

              {/* 复盘+档案建议 */}
              {(result.postChatReview || result.fanProfileUpdate) && (
                <View style={{ borderTopWidth: 1, borderTopColor: '#E8C9C4', paddingTop: 6, marginTop: 4 }}>
                  {result.postChatReview && (
                    <View style={{ marginBottom: 4 }}>
                      <Text className="block text-xs font-medium" style={{ color: '#7A8061' }}>📋 复盘方向</Text>
                      <Text className="block text-xs" style={{ color: '#2F2523' }}>{result.postChatReview}</Text>
                    </View>
                  )}
                  {result.fanProfileUpdate && (
                    <View>
                      <Text className="block text-xs font-medium" style={{ color: '#7A8061' }}>📝 档案更新</Text>
                      <Text className="block text-xs" style={{ color: '#2F2523' }}>{result.fanProfileUpdate}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

          {/* === 聊后复盘 === */}
          {chatMode === 'post-chat' && (
            <View style={{ borderRadius: 16, backgroundColor: '#FFFFFF', padding: 12, borderWidth: 1, borderColor: '#E8C9C4' }}>
              {/* 总结 */}
              {result.chatSummary && (
                <View style={{ marginBottom: 8, padding: '6px 10px', borderRadius: 10, backgroundColor: '#FDE2E4' }}>
                  <Text className="block text-xs font-medium mb-1" style={{ color: '#A85D6A' }}>💬 本轮总结</Text>
                  <Text className="block text-xs" style={{ color: '#2F2523' }}>{result.chatSummary}</Text>
                </View>
              )}

              {/* 情绪+关系变化 */}
              <View style={{ display: 'flex', flexDirection: 'row', gap: 6, marginBottom: 8 }}>
                {result.emotionChange && (
                  <View style={{ padding: '3px 8px', borderRadius: 8, backgroundColor: '#FFF1DE' }}>
                    <Text className="block text-xs" style={{ color: '#C77763' }}>情绪：{result.emotionChange}</Text>
                  </View>
                )}
                {result.relationshipChange && (
                  <View style={{ padding: '3px 8px', borderRadius: 8, backgroundColor: '#FFF7F2' }}>
                    <Text className="block text-xs" style={{ color: '#7A8061' }}>关系：{result.relationshipChange}</Text>
                  </View>
                )}
              </View>

              {/* 档案更新建议 */}
              {result.profileUpdateSuggestions && (
                <View style={{ marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#D98C9A', paddingLeft: 8 }}>
                  <Text className="block text-xs font-medium mb-1" style={{ color: '#A85D6A' }}>📝 档案更新建议</Text>
                  {Object.entries(result.profileUpdateSuggestions as Record<string, string>).map(([k, v]) => v && (
                    <Text key={k} className="block text-xs" style={{ color: '#2F2523' }}>• {k}：{v as string}</Text>
                  ))}
                </View>
              )}

              {/* 下次开场 */}
              {result.nextOpeners && result.nextOpeners.length > 0 && (
                <View style={{ marginBottom: 8 }}>
                  <Text className="block text-xs font-medium mb-1" style={{ color: '#2F2523' }}>💡 下次开场建议</Text>
                  {result.nextOpeners.map((o: string, i: number) => (
                    <View key={i} style={{ padding: '4px 8px', borderRadius: 8, backgroundColor: '#FFF7F2', marginBottom: 3 }}>
                      <Text className="block text-xs" style={{ color: '#2F2523' }}>{o}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* 维护建议 */}
              {result.maintenanceAdvice && (
                <View style={{ padding: '6px 10px', borderRadius: 10, backgroundColor: '#FFF1DE' }}>
                  <Text className="block text-xs font-medium mb-1" style={{ color: '#C77763' }}>🎯 维护建议</Text>
                  <Text className="block text-xs" style={{ color: '#2F2523' }}>{result.maintenanceAdvice}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* 底部原则 */}
      <View style={{ paddingLeft: 16, paddingRight: 16, paddingBottom: 20 }}>
        <View style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 4, justifyContent: 'center' }}>
          {['可撒娇可暧昧', '人设内亲密', '不承诺现实', '不PUA不卖惨', '轻松引导互动'].map(t => (
            <View key={t} style={{ padding: '2px 8px', borderRadius: 10, borderWidth: 1, borderColor: '#E8C9C4', borderStyle: 'dashed' }}>
              <Text className="block text-xs" style={{ color: '#7A8061' }}>{t}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}
