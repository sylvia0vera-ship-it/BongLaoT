import { useState, useEffect } from 'react'
import { View, Text, Image } from '@tarojs/components'
import { Input } from '@/components/ui/input'
import Taro from '@tarojs/taro'
import { Network } from '@/network'
import { BookHeart, ImagePlus, X, Sparkles, MapPin, LogOut } from 'lucide-react-taro'

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
  // 登录态
  const [userInfo, setUserInfo] = useState<any>(null)

  // 工作流模式
  const [chatMode, setChatMode] = useState<'mid-chat' | 'post-chat'>('mid-chat')
  // 输入
  const [message, setMessage] = useState('')
  const [context, setContext] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imagePreview, setImagePreview] = useState('')
  // 位置搜索
  const [locationQuery, setLocationQuery] = useState('')
  const [locationResults, setLocationResults] = useState<any>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  // 粉丝
  const [fans, setFans] = useState<any[]>([])
  const [selectedFanId, setSelectedFanId] = useState('')
  // 人设
  const [persona, setPersona] = useState('温柔陪伴')
  // 状态
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    // 检查登录态
    const info = Taro.getStorageSync('userInfo')
    if (!info) {
      Taro.navigateTo({ url: '/pages/login/index' })
      return
    }
    setUserInfo(info)
    // 恢复粉丝页传来的选中状态
    const preSelectedFanId = Taro.getStorageSync('selectedFanId')
    if (preSelectedFanId) {
      setSelectedFanId(preSelectedFanId)
      Taro.removeStorageSync('selectedFanId')
    }
    loadFans()
  }, [])

  const loadFans = async () => {
    try {
      const res = await Network.request({ url: '/api/fans' })
      console.log('粉丝列表响应:', JSON.stringify(res.data))
      const list = res.data?.data || []
      setFans(list)
      console.log('粉丝数量:', list.length)
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

  const handleLocationSearch = async () => {
    if (!locationQuery.trim()) return
    setLocationLoading(true)
    setLocationResults(null)
    try {
      const res = await Network.request({
        url: '/api/location/search',
        method: 'POST',
        data: { query: locationQuery.trim() }
      })
      console.log('[LocationSearch] response:', res.data)
      const data = res.data?.data?.data || res.data?.data || res.data
      setLocationResults(data)
    } catch (e) {
      console.error('[LocationSearch] error:', e)
      Taro.showToast({ title: '搜索失败', icon: 'none' })
    } finally {
      setLocationLoading(false)
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


  return (
    <View className="min-h-screen" style={{ backgroundColor: '#FDF2EF' }}>
      {/* Header */}
      <View style={{ paddingTop: HEADER_TOP, paddingLeft: 16, paddingRight: 16, paddingBottom: 8, display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <BookHeart size={22} color="#C49890" />
          <Text className="block text-2xl font-bold" style={{ color: '#5C3A32' }}>陪伴小助手</Text>
        </View>
        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {userInfo && (
            <Text className="block text-xs" style={{ color: '#C49890' }}>{userInfo.nickname || userInfo.username}</Text>
          )}
          <View onClick={() => { Taro.removeStorageSync('userInfo'); Taro.removeStorageSync('token'); Taro.navigateTo({ url: '/pages/login/index' }) }} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 16, borderStyle: 'dashed', borderWidth: 1, borderColor: '#F0D6CE' }}>
            <LogOut size={14} color="#C49890" />
            <Text className="block text-xs" style={{ color: '#C49890' }}>退出</Text>
          </View>
        </View>
      </View>

      {/* 工作流模式切换 */}
      <View style={{ paddingLeft: 16, paddingRight: 16, marginBottom: 10, display: 'flex', flexDirection: 'row', gap: 8 }}>
        {MODE_OPTIONS.map(m => (
          <View
            key={m.key}
            onClick={() => { setChatMode(m.key as any); setResult(null) }}
            style={{
              flex: 1, paddingTop: 8, paddingBottom: 8, borderRadius: 24,
              backgroundColor: chatMode === m.key ? '#F08C99' : '#FFFFFF',
              display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6,
              borderWidth: 1.5, borderColor: chatMode === m.key ? '#F08C99' : '#F0D6CE',
              boxShadow: chatMode === m.key ? '0 2px 8px rgba(240,140,153,0.25)' : '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <Text className="block text-sm">{m.icon}</Text>
            <Text className="block text-sm font-semibold" style={{ color: chatMode === m.key ? '#FFFFFF' : '#5C3A32' }}>{m.label}</Text>
          </View>
        ))}
      </View>

      {/* 输入区 */}
      <View style={{ marginLeft: 12, marginRight: 12, marginBottom: 10, padding: 14, borderRadius: 20, backgroundColor: '#FDE8E4', boxShadow: '0 2px 12px rgba(240,140,153,0.08)' }}>
        {/* 粉丝选择 */}
        <View style={{ marginBottom: 8 }}>
          <Text className="block text-xs mb-2 font-medium" style={{ color: '#997A70' }}>♡ 选择粉丝</Text>
          {fans.length === 0 ? (
            <View onClick={() => Taro.switchTab({ url: '/pages/fans/index' })} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 12, backgroundColor: '#FFF3ED', borderWidth: 1, borderColor: '#F0D6CE', borderStyle: 'dashed' }}>
              <Text className="block text-xs" style={{ color: '#C4856A' }}>暂无粉丝，点击去添加 →</Text>
            </View>
          ) : (
            <View style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              <View
                onClick={() => { console.log('点击未选择'); setSelectedFanId('') }}
                style={{ padding: '6px 14px', borderRadius: 16, borderWidth: 1.5, borderColor: selectedFanId ? '#F0D6CE' : '#F08C99', backgroundColor: selectedFanId ? '#FFFFFF' : '#F08C99' }}
              >
                <Text className="block text-xs font-bold" style={{ color: selectedFanId ? '#5C3A32' : '#FFFFFF' }}>未选择</Text>
              </View>
              {fans.map((f: any) => (
                <View
                  key={f.id}
                  onClick={() => { console.log('点击粉丝:', f.name, f.id); setSelectedFanId(f.id) }}
                  style={{ padding: '6px 14px', borderRadius: 16, borderWidth: 1.5, borderColor: selectedFanId === f.id ? '#F08C99' : '#F0D6CE', backgroundColor: selectedFanId === f.id ? '#F08C99' : '#FFFFFF' }}
                >
                  <Text className="block text-xs font-bold" style={{ color: selectedFanId === f.id ? '#FFFFFF' : '#5C3A32' }}>{f.name}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 人设选择 */}
        <View style={{ marginBottom: 8 }}>
          <Text className="block text-xs mb-2 font-medium" style={{ color: '#997A70' }}>人设风格</Text>
          <View style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
            {PERSONA_OPTIONS.map(p => (
              <View
                key={p.key}
                onClick={() => setPersona(p.key)}
                style={{ padding: '4px 10px', borderRadius: 14, borderWidth: 1.5, borderColor: persona === p.key ? '#F08C99' : '#F0D6CE', backgroundColor: persona === p.key ? '#F08C99' : '#FFFFFF' }}
              >
                <Text className="block text-xs font-medium" style={{ color: persona === p.key ? '#FFFFFF' : '#5C3A32' }}>{p.emoji} {p.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 消息输入 */}
        <View style={{ marginBottom: 6 }}>
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 14, padding: '10px 14px', borderWidth: 1, borderColor: '#F0D6CE' }}>
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
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 14, padding: '10px 14px', borderWidth: 1, borderColor: '#F0D6CE' }}>
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
                <View onClick={() => { setImageUrl(''); setImagePreview('') }} style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: 9, backgroundColor: '#C77A6E', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <X size={10} color="#FFFFFF" />
                </View>
              </View>
            ) : (
              <View onClick={handleChooseImage} style={{ width: 64, height: 64, borderRadius: 8, borderWidth: 1, borderColor: '#F0D6CE', borderStyle: 'dashed', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
                <ImagePlus size={20} color="#F08C99" />
              </View>
            )}
          </View>
        )}

        {/* 分析按钮 */}
        <View
          onClick={handleAnalyze}
          style={{
            backgroundColor: loading ? '#F0D6CE' : '#C49890',
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
            <View style={{ borderRadius: 16, backgroundColor: '#FFFFFF', padding: 12, borderWidth: 1, borderColor: '#F0D6CE' }}>
              {/* 类型+情绪+关系阶段 */}
              <View style={{ display: 'flex', flexDirection: 'row', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
                {result.messageType && (
                  <View style={{ padding: '2px 8px', borderRadius: 8, backgroundColor: '#FEF3F0' }}>
                    <Text className="block text-xs font-medium" style={{ color: '#C49890' }}>{result.messageType}</Text>
                  </View>
                )}
                {result.emotion && (
                  <View style={{ padding: '2px 8px', borderRadius: 8, backgroundColor: '#FFF2EA' }}>
                    <Text className="block text-xs" style={{ color: '#C77A6E' }}>{result.emotion}</Text>
                  </View>
                )}
                {result.relationshipStage && (
                  <View style={{ padding: '2px 8px', borderRadius: 8, backgroundColor: '#FFF5F2' }}>
                    <Text className="block text-xs" style={{ color: '#8BA06E' }}>{result.relationshipStage}</Text>
                  </View>
                )}
              </View>

              {/* 风险提醒 */}
              {result.riskWarning && (
                <View style={{ borderLeftWidth: 3, borderLeftColor: '#C77A6E', paddingLeft: 8, marginBottom: 6, backgroundColor: '#FFF5F2', borderRadius: 4, paddingTop: 4, paddingBottom: 4}}>
                  <Text className="block text-xs" style={{ color: '#C77A6E' }}>⚠️ {result.riskWarning}</Text>
                </View>
              )}

              {/* 回复策略 */}
              {result.replyStrategy && (
                <View style={{ marginBottom: 6, padding: '4px 8px', borderRadius: 8, backgroundColor: '#FFF2EA' }}>
                  <Text className="block text-xs" style={{ color: '#C77A6E' }}>🎯 {result.replyStrategy}</Text>
                </View>
              )}

              {/* 三版回复 */}
              <View style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                {[
                  { label: '温柔撒娇', value: result.gentleReply, color: '#FEF3F0', border: '#F08C99' },
                  { label: '轻松暧昧', value: result.casualReply, color: '#FFF2EA', border: '#C77A6E' },
                  { label: '甜而不腻', value: result.sweetReply, color: '#FFF5F2', border: '#8BA06E' },
                ].map(r => r.value && (
                  <View key={r.label} style={{ borderLeftWidth: 3, borderLeftColor: r.border, paddingLeft: 8, borderRadius: 4, backgroundColor: r.color, paddingTop: 4, paddingBottom: 4}}>
                    <Text className="block text-xs font-medium mb-1" style={{ color: '#5C3A32' }}>{r.label}</Text>
                    <Text className="block text-xs" style={{ color: '#5C3A32' }}>{r.value}</Text>
                  </View>
                ))}
              </View>

              {/* 前5句破冰 */}
              {result.iceBreaker && (
                <View style={{ marginBottom: 6 }}>
                  <Text className="block text-xs font-medium mb-1" style={{ color: '#5C3A32' }}>🔥 前5句破冰</Text>
                  <View style={{ display: 'flex', flexDirection: 'row', gap: 3, flexWrap: 'wrap' }}>
                    {Object.entries(result.iceBreaker).map(([k, v]) => (
                      <View key={k} style={{ padding: '3px 8px', borderRadius: 10, backgroundColor: '#FEF3F0' }}>
                        <Text className="block text-xs" style={{ color: '#C49890' }}>{k}. {v as string}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* 不建议发送 */}
              {result.badReply && (
                <View style={{ borderLeftWidth: 3, borderLeftColor: '#C77A6E', paddingLeft: 8, marginBottom: 6, backgroundColor: '#FFF5F2', borderRadius: 4, paddingTop: 4, paddingBottom: 4}}>
                  <Text className="block text-xs line-through" style={{ color: '#8BA06E' }}>✗ {result.badReply}</Text>
                  {result.badReason && <Text className="block text-xs mt-1" style={{ color: '#C77A6E' }}>原因：{result.badReason}</Text>}
                </View>
              )}

              {/* 复盘+档案建议 */}
              {(result.postChatReview || result.fanProfileUpdate) && (
                <View style={{ borderTopWidth: 1, borderTopColor: '#F0D6CE', paddingTop: 6, marginTop: 4 }}>
                  {result.postChatReview && (
                    <View style={{ marginBottom: 4 }}>
                      <Text className="block text-xs font-medium" style={{ color: '#8BA06E' }}>📋 复盘方向</Text>
                      <Text className="block text-xs" style={{ color: '#5C3A32' }}>{result.postChatReview}</Text>
                    </View>
                  )}
                  {result.fanProfileUpdate && (
                    <View>
                      <Text className="block text-xs font-medium" style={{ color: '#8BA06E' }}>📝 档案更新</Text>
                      <Text className="block text-xs" style={{ color: '#5C3A32' }}>{result.fanProfileUpdate}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

          {/* === 聊后复盘 === */}
          {chatMode === 'post-chat' && (
            <View style={{ borderRadius: 16, backgroundColor: '#FFFFFF', padding: 12, borderWidth: 1, borderColor: '#F0D6CE' }}>
              {/* 总结 */}
              {result.chatSummary && (
                <View style={{ marginBottom: 8, padding: '6px 10px', borderRadius: 10, backgroundColor: '#FEF3F0' }}>
                  <Text className="block text-xs font-medium mb-1" style={{ color: '#C49890' }}>💬 本轮总结</Text>
                  <Text className="block text-xs" style={{ color: '#5C3A32' }}>{result.chatSummary}</Text>
                </View>
              )}

              {/* 情绪+关系变化 */}
              <View style={{ display: 'flex', flexDirection: 'row', gap: 6, marginBottom: 8 }}>
                {result.emotionChange && (
                  <View style={{ padding: '3px 8px', borderRadius: 8, backgroundColor: '#FFF2EA' }}>
                    <Text className="block text-xs" style={{ color: '#C77A6E' }}>情绪：{result.emotionChange}</Text>
                  </View>
                )}
                {result.relationshipChange && (
                  <View style={{ padding: '3px 8px', borderRadius: 8, backgroundColor: '#FFF5F2' }}>
                    <Text className="block text-xs" style={{ color: '#8BA06E' }}>关系：{result.relationshipChange}</Text>
                  </View>
                )}
              </View>

              {/* 档案更新建议 */}
              {result.profileUpdateSuggestions && (
                <View style={{ marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#F08C99', paddingLeft: 8 }}>
                  <Text className="block text-xs font-medium mb-1" style={{ color: '#C49890' }}>📝 档案更新建议</Text>
                  {Object.entries(result.profileUpdateSuggestions as Record<string, string>).map(([k, v]) => v && (
                    <Text key={k} className="block text-xs" style={{ color: '#5C3A32' }}>• {k}：{v as string}</Text>
                  ))}
                </View>
              )}

              {/* 下次开场 */}
              {result.nextOpeners && result.nextOpeners.length > 0 && (
                <View style={{ marginBottom: 8 }}>
                  <Text className="block text-xs font-medium mb-1" style={{ color: '#5C3A32' }}>💡 下次开场建议</Text>
                  {result.nextOpeners.map((o: string, i: number) => (
                    <View key={i} style={{ padding: '4px 8px', borderRadius: 8, backgroundColor: '#FFF5F2', marginBottom: 3 }}>
                      <Text className="block text-xs" style={{ color: '#5C3A32' }}>{o}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* 维护建议 */}
              {result.maintenanceAdvice && (
                <View style={{ padding: '6px 10px', borderRadius: 10, backgroundColor: '#FFF2EA' }}>
                  <Text className="block text-xs font-medium mb-1" style={{ color: '#C77A6E' }}>🎯 维护建议</Text>
                  <Text className="block text-xs" style={{ color: '#5C3A32' }}>{result.maintenanceAdvice}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* 底部原则 */}
      <View style={{ paddingLeft: 16, paddingRight: 16, paddingBottom: 12 }}>
        <View style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 4, justifyContent: 'center' }}>
          {['可撒娇可暧昧', '人设内亲密', '不承诺现实', '不PUA不卖惨', '轻松引导互动'].map(t => (
            <View key={t} style={{ padding: '2px 8px', borderRadius: 10, borderWidth: 1, borderColor: '#F0D6CE', borderStyle: 'dashed' }}>
              <Text className="block text-xs" style={{ color: '#8BA06E' }}>{t}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 地点搜索 - 找附近特产&景点 */}
      <View style={{ paddingLeft: 16, paddingRight: 16, paddingBottom: 20 }}>
        <View style={{ backgroundColor: '#FFF5F2', borderRadius: 16, padding: 12 }}>
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <MapPin size={14} color="#C77A6E" />
            <Text className="block text-xs font-medium" style={{ color: '#C77A6E' }}>找附近特产&景点</Text>
          </View>
          <View style={{ display: 'flex', flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            <View style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: 20, paddingLeft: 12, paddingRight: 12, paddingTop: 6, paddingBottom: 6 }}>
              <Input
                style={{ width: '100%', fontSize: 13, color: '#5C3A32' }}
                placeholder="输入地名，如：成都、厦门、大理…"
                placeholderStyle="color: #C77A6E"
                value={locationQuery}
                onInput={(e: any) => setLocationQuery(e.detail.value)}
                onConfirm={() => handleLocationSearch()}
              />
            </View>
            <View
              style={{ backgroundColor: '#F08C99', borderRadius: 20, paddingLeft: 10, paddingRight: 10, paddingTop: 6, paddingBottom: 6 }}
              onClick={() => handleLocationSearch()}
            >
              <Text className="block text-xs text-white">搜索</Text>
            </View>
          </View>
          {locationLoading && (
            <View style={{ marginTop: 8, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text className="block text-xs" style={{ color: '#8BA06E' }}>正在搜索…</Text>
            </View>
          )}
          {locationResults && (
            <View style={{ marginTop: 8 }}>
              {locationResults.specialties && locationResults.specialties.length > 0 && (
                <View style={{ marginBottom: 6 }}>
                  <Text className="block text-xs font-medium mb-1" style={{ color: '#C49890' }}>当地特产</Text>
                  <View style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                    {locationResults.specialties.map((s: string, i: number) => (
                      <View key={i} style={{ backgroundColor: '#FEF3F0', borderRadius: 10, paddingLeft: 8, paddingRight: 8, paddingTop: 2, paddingBottom: 2 }}>
                        <Text className="block text-xs" style={{ color: '#C49890' }}>{s}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              {locationResults.attractions && locationResults.attractions.length > 0 && (
                <View style={{ marginBottom: 6 }}>
                  <Text className="block text-xs font-medium mb-1" style={{ color: '#C77A6E' }}>附近景点</Text>
                  {locationResults.attractions.map((a: any, i: number) => (
                    <View key={i} style={{ backgroundColor: '#FFFFFF', borderRadius: 8, padding: 6, marginTop: 4 }}>
                      <Text className="block text-xs font-medium" style={{ color: '#5C3A32' }}>{a.name}</Text>
                      {a.description && <Text className="block text-xs mt-1" style={{ color: '#8BA06E' }}>{a.description}</Text>}
                    </View>
                  ))}
                </View>
              )}
              {locationResults.chatTopics && locationResults.chatTopics.length > 0 && (
                <View>
                  <Text className="block text-xs font-medium mb-1" style={{ color: '#8BA06E' }}>聊天话题灵感</Text>
                  <View style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                    {locationResults.chatTopics.map((t: string, i: number) => (
                      <View key={i} style={{ backgroundColor: '#FFF2EA', borderRadius: 10, paddingLeft: 8, paddingRight: 8, paddingTop: 2, paddingBottom: 2 }}>
                        <Text className="block text-xs" style={{ color: '#C77A6E' }}>{t}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  )
}
