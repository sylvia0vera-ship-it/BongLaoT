import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import { Input } from '@/components/ui/input'
import Taro from '@tarojs/taro'
import { MapPin, Heart, MessageCircleHeart } from 'lucide-react-taro'
import { Network } from '@/network'

// Warm Scrapbook Design Tokens
const C = {
  bg: '#FFF8F4',        // warm cream
  card: '#FFFFFF',       // white card
  pink: '#F08C99',       // dusty rose primary
  pinkLight: '#FEF0F2',  // very light pink
  pinkMid: '#FCD5D9',    // mid pink
  apricot: '#FFF0E6',    // warm apricot
  apricotLight: '#FFF7F0', // light apricot
  green: '#B8D4A0',      // sage green
  greenDark: '#7A9A58',   // dark sage
  brown: '#C77A6E',       // caramel brown
  brownLight: '#E8C4B8',  // light brown
  text: '#4A2C2A',        // deep coffee
  textMid: '#8B6B63',     // mid brown
  textLight: '#B8A098',   // light brown gray
  border: '#F0D6CE',      // soft pink border
  borderDash: '#E8C4B8',  // dashed border
  shadow: '0 4px 16px rgba(180,120,100,0.08)',
  shadowLg: '0 8px 24px rgba(180,120,100,0.12)',
}

export default function Index() {
  const [userInfo, setUserInfo] = useState<any>(null)
  const [fans, setFans] = useState<any[]>([])
  const [selectedFanId, setSelectedFanId] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [chatMode, setChatMode] = useState<'pre-chat' | 'post-chat'>('pre-chat')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [locationQuery, setLocationQuery] = useState('')
  const [locationResults, setLocationResults] = useState<any>(null)
  const [locationLoading, setLocationLoading] = useState(false)

  useEffect(() => {
    Taro.getStorage({ key: 'userInfo' }).then(res => {
      setUserInfo(res.data)
      loadFans()
    }).catch(() => {
      Taro.navigateTo({ url: '/pages/login/index' })
    })
    const selectedFan = Taro.getStorageSync('selectedFanId')
    if (selectedFan) {
      setSelectedFanId(Number(selectedFan))
      Taro.removeStorageSync('selectedFanId')
    }
  }, [])

  const loadFans = async () => {
    try {
      const res = await Network.request({ url: '/api/fans' })
      console.log('loadFans response:', res.data)
      setFans(res.data?.data || [])
    } catch (e) { console.error('loadFans error', e) }
  }

  const handleLogout = () => {
    Taro.removeStorage({ key: 'userInfo' })
    Taro.navigateTo({ url: '/pages/login/index' })
  }

  const handleSubmit = async () => {
    if (!message.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await Network.request({
        url: '/api/fans/analyze',
        method: 'POST',
        data: {
          message,
          chatMode,
          fanId: selectedFanId,
          context: { fanId: selectedFanId }
        }
      })
      console.log('analyze response:', res.data)
      setResult(res.data?.data || res.data)
    } catch (e: any) {
      console.error('analyze error', e)
      setResult({ error: e.message || '分析失败' })
    } finally { setLoading(false) }
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
      console.log('location search response:', res.data)
      setLocationResults(res.data?.data || null)
    } catch (e: any) {
      console.error('location search error', e)
    } finally { setLocationLoading(false) }
  }

  const selectedFan = fans.find(f => f.id === selectedFanId)

  return (
    <ScrollView scrollY className="h-screen" style={{ backgroundColor: C.bg }}>
      {/* ~~ Header ~~ */}
      <View style={{ padding: '16px 20px 12px', backgroundColor: C.pinkLight, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MessageCircleHeart size={22} color={C.pink} />
            <View>
              <Text className="block text-sm font-bold" style={{ color: C.text }}>陪伴小助手 ♡</Text>
              <Text className="block text-xs" style={{ color: C.textMid }}>{userInfo?.nickname || '你好~'}</Text>
            </View>
          </View>
          <View
            style={{ padding: '4px 12px', borderRadius: 16, borderWidth: 1, borderColor: C.borderDash, borderStyle: 'dashed', backgroundColor: '#FFFFFF' }}
            onClick={handleLogout}
          >
            <Text className="block text-xs" style={{ color: C.textLight }}>退出</Text>
          </View>
        </View>
      </View>

      <View style={{ padding: '12px 16px 0' }}>
        {/* ~~ 粉丝选择卡片 ~~ */}
        <View style={{ backgroundColor: C.card, borderRadius: 20, padding: 16, marginBottom: 12, boxShadow: C.shadow, borderWidth: 1, borderColor: C.border }}>
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <Heart size={14} color={C.pink} />
            <Text className="block text-sm font-semibold" style={{ color: C.text }}>选择粉丝 ♡</Text>
          </View>
          {fans.length === 0 ? (
            <View style={{ padding: '8px 0' }}>
              <Text className="block text-xs" style={{ color: C.textLight }}>暂无粉丝，去添加吧 →</Text>
            </View>
          ) : (
            <View style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <View
                style={{ padding: '6px 14px', borderRadius: 20, backgroundColor: !selectedFanId ? C.pink : '#FFFFFF', borderWidth: 1, borderColor: !selectedFanId ? C.pink : C.border }}
                onClick={() => setSelectedFanId(null)}
              >
                <Text className="block text-xs font-medium" style={{ color: !selectedFanId ? '#FFFFFF' : C.textMid }}>全部</Text>
              </View>
              {fans.map(fan => (
                <View
                  key={fan.id}
                  style={{ padding: '6px 14px', borderRadius: 20, backgroundColor: selectedFanId === fan.id ? C.pink : '#FFFFFF', borderWidth: 1, borderColor: selectedFanId === fan.id ? C.pink : C.border }}
                  onClick={() => setSelectedFanId(fan.id)}
                >
                  <Text className="block text-xs font-medium" style={{ color: selectedFanId === fan.id ? '#FFFFFF' : C.textMid }}>{fan.nickname || fan.name}</Text>
                </View>
              ))}
            </View>
          )}
          {selectedFan && (
            <View style={{ marginTop: 8, padding: '6px 10px', borderRadius: 12, backgroundColor: C.pinkLight }}>
              <Text className="block text-xs" style={{ color: C.pink }}>✦ 当前：{selectedFan.nickname || selectedFan.name} — {selectedFan.tags || '暂无标签'}</Text>
            </View>
          )}
        </View>

        {/* ~~ 聊天模式切换 ~~ */}
        <View style={{ display: 'flex', flexDirection: 'row', gap: 8, marginBottom: 12 }}>
          {[
            { key: 'pre-chat', label: '✨ 聊前准备', desc: '找话题' },
            { key: 'post-chat', label: '💭 聊后复盘', desc: '做总结' },
          ].map(m => (
            <View
              key={m.key}
              style={{ flex: 1, padding: '10px 12px', borderRadius: 16, backgroundColor: chatMode === m.key ? C.apricot : C.card, borderWidth: 1.5, borderColor: chatMode === m.key ? C.brown : C.border, boxShadow: chatMode === m.key ? C.shadow : 'none', alignItems: 'center' }}
              onClick={() => setChatMode(m.key as 'pre-chat' | 'post-chat')}
            >
              <Text className="block text-sm font-semibold" style={{ color: chatMode === m.key ? C.brown : C.textLight }}>{m.label}</Text>
              <Text className="block text-xs" style={{ color: C.textLight, marginTop: 2 }}>{m.desc}</Text>
            </View>
          ))}
        </View>

        {/* ~~ 消息输入卡片 ~~ */}
        <View style={{ backgroundColor: C.card, borderRadius: 20, padding: 16, marginBottom: 12, boxShadow: C.shadow, borderWidth: 1, borderColor: C.border }}>
          <Text className="block text-sm font-semibold mb-2" style={{ color: C.text }}>
            {chatMode === 'pre-chat' ? '📝 聊天内容 ~' : '💬 聊天回顾 ~'}
          </Text>
          <View style={{ backgroundColor: C.apricotLight, borderRadius: 16, padding: 12, marginBottom: 10 }}>
            <Input
              style={{ width: '100%', fontSize: 14, color: C.text, minHeight: 40 }}
              placeholder={chatMode === 'pre-chat' ? '描述聊天情况，如：他昨晚主动找我了…' : '记录刚才聊了什么…'}
              placeholderStyle={`color: ${C.textLight}`}
              value={message}
              onInput={(e: any) => setMessage(e.detail.value)}
            />
          </View>
          <View
            style={{ backgroundColor: C.pink, borderRadius: 28, padding: '10px 0', boxShadow: C.shadow, alignItems: 'center' }}
            onClick={handleSubmit}
          >
            <Text className="block text-sm font-bold text-white">
              {loading ? '思考中 ✦' : (chatMode === 'pre-chat' ? '✨ 生成回复建议' : '💭 开始复盘')}
            </Text>
          </View>
        </View>
      </View>

      {/* ~~ 结果卡片 ~~ */}
      {result && (
        <View style={{ padding: '0 16px 12px' }}>
          {result.error && (
            <View style={{ backgroundColor: C.card, borderRadius: 20, padding: 16, boxShadow: C.shadow, borderWidth: 1, borderColor: C.border }}>
              <Text className="block text-sm" style={{ color: C.pink }}>♡ {result.error}</Text>
            </View>
          )}

          {/* 聊前准备结果 */}
          {chatMode === 'pre-chat' && !result.error && (
            <View style={{ backgroundColor: C.card, borderRadius: 20, padding: 16, boxShadow: C.shadowLg, borderWidth: 1, borderColor: C.border }}>
              {/* 推荐回复 */}
              {result.recommendedReply && (
                <View style={{ marginBottom: 10, padding: '8px 12px', borderRadius: 14, backgroundColor: C.pinkLight, borderWidth: 1, borderColor: C.pinkMid }}>
                  <Text className="block text-xs font-bold mb-1" style={{ color: C.pink }}>♡ 推荐回复</Text>
                  <Text className="block text-sm" style={{ color: C.text, lineHeight: 1.6 }}>{result.recommendedReply}</Text>
                </View>
              )}

              {/* 替代表达 */}
              {result.alternativeExpressions && result.alternativeExpressions.length > 0 && (
                <View style={{ marginBottom: 8 }}>
                  <Text className="block text-xs font-medium mb-1" style={{ color: C.brown }}>✦ 替代表达</Text>
                  {result.alternativeExpressions.map((alt: string, i: number) => (
                    <View key={i} style={{ padding: '4px 10px', borderRadius: 10, backgroundColor: C.apricotLight, marginBottom: 4 }}>
                      <Text className="block text-xs" style={{ color: C.text }}>{alt}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* 话题延续 */}
              {result.topicContinuations && result.topicContinuations.length > 0 && (
                <View style={{ marginBottom: 8 }}>
                  <Text className="block text-xs font-medium mb-1" style={{ color: C.greenDark }}>🌿 话题延续</Text>
                  <View style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                    {result.topicContinuations.map((t: string, i: number) => (
                      <View key={i} style={{ padding: '3px 10px', borderRadius: 12, backgroundColor: '#F0F5E8' }}>
                        <Text className="block text-xs" style={{ color: C.greenDark }}>{t}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* 不建议发送 */}
              {result.badReply && (
                <View style={{ borderLeftWidth: 3, borderLeftColor: C.brown, paddingLeft: 8, marginBottom: 6, backgroundColor: C.apricotLight, borderRadius: 4, paddingTop: 4, paddingBottom: 4 }}>
                  <Text className="block text-xs line-through" style={{ color: C.greenDark }}>✗ {result.badReply}</Text>
                  {result.badReason && <Text className="block text-xs mt-1" style={{ color: C.brown }}>原因：{result.badReason}</Text>}
                </View>
              )}

              {/* 复盘+档案建议 */}
              {(result.postChatReview || result.fanProfileUpdate) && (
                <View style={{ borderTopWidth: 1, borderTopColor: C.border, paddingTop: 6, marginTop: 4, borderStyle: 'dashed' }}>
                  {result.postChatReview && (
                    <View style={{ marginBottom: 4 }}>
                      <Text className="block text-xs font-medium" style={{ color: C.greenDark }}>📋 复盘方向</Text>
                      <Text className="block text-xs" style={{ color: C.text }}>{result.postChatReview}</Text>
                    </View>
                  )}
                  {result.fanProfileUpdate && (
                    <View>
                      <Text className="block text-xs font-medium" style={{ color: C.greenDark }}>📝 档案更新</Text>
                      <Text className="block text-xs" style={{ color: C.text }}>{result.fanProfileUpdate}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

          {/* 聊后复盘结果 */}
          {chatMode === 'post-chat' && !result.error && (
            <View style={{ backgroundColor: C.card, borderRadius: 20, padding: 16, boxShadow: C.shadowLg, borderWidth: 1, borderColor: C.border }}>
              {/* 总结 */}
              {result.chatSummary && (
                <View style={{ marginBottom: 8, padding: '6px 10px', borderRadius: 12, backgroundColor: C.pinkLight }}>
                  <Text className="block text-xs font-medium mb-1" style={{ color: C.pink }}>💬 本轮总结</Text>
                  <Text className="block text-xs" style={{ color: C.text }}>{result.chatSummary}</Text>
                </View>
              )}

              {/* 情绪+关系变化 */}
              <View style={{ display: 'flex', flexDirection: 'row', gap: 6, marginBottom: 8 }}>
                {result.emotionChange && (
                  <View style={{ padding: '3px 8px', borderRadius: 10, backgroundColor: C.apricot }}>
                    <Text className="block text-xs" style={{ color: C.brown }}>情绪：{result.emotionChange}</Text>
                  </View>
                )}
                {result.relationshipChange && (
                  <View style={{ padding: '3px 8px', borderRadius: 10, backgroundColor: '#F0F5E8' }}>
                    <Text className="block text-xs" style={{ color: C.greenDark }}>关系：{result.relationshipChange}</Text>
                  </View>
                )}
              </View>

              {/* 档案更新建议 */}
              {result.profileUpdateSuggestions && (
                <View style={{ marginBottom: 8, borderLeftWidth: 3, borderLeftColor: C.pink, paddingLeft: 8 }}>
                  <Text className="block text-xs font-medium mb-1" style={{ color: C.pink }}>📝 档案更新建议</Text>
                  {Object.entries(result.profileUpdateSuggestions as Record<string, string>).map(([k, v]) => v && (
                    <Text key={k} className="block text-xs" style={{ color: C.text }}>• {k}：{v as string}</Text>
                  ))}
                </View>
              )}

              {/* 下次开场 */}
              {result.nextOpeners && result.nextOpeners.length > 0 && (
                <View style={{ marginBottom: 8 }}>
                  <Text className="block text-xs font-medium mb-1" style={{ color: C.text }}>✨ 下次开场建议</Text>
                  {result.nextOpeners.map((o: string, i: number) => (
                    <View key={i} style={{ padding: '4px 8px', borderRadius: 10, backgroundColor: C.apricotLight, marginBottom: 3 }}>
                      <Text className="block text-xs" style={{ color: C.text }}>{o}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* 维护建议 */}
              {result.maintenanceAdvice && (
                <View style={{ padding: '6px 10px', borderRadius: 12, backgroundColor: C.apricot }}>
                  <Text className="block text-xs font-medium mb-1" style={{ color: C.brown }}>🎯 维护建议</Text>
                  <Text className="block text-xs" style={{ color: C.text }}>{result.maintenanceAdvice}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* ~~ 底部原则标签 ~~ */}
      <View style={{ paddingLeft: 16, paddingRight: 16, paddingBottom: 12 }}>
        <View style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
          {['♡ 可撒娇可暧昧', '✦ 人设内亲密', '🌿 不承诺现实', '🐾 不PUA不卖惨', '✨ 轻松引导互动'].map(t => (
            <View key={t} style={{ padding: '3px 10px', borderRadius: 12, borderWidth: 1, borderColor: C.borderDash, borderStyle: 'dashed', backgroundColor: '#FFFFFF' }}>
              <Text className="block text-xs" style={{ color: C.textMid }}>{t}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ~~ 地点搜索卡片 ~~ */}
      <View style={{ paddingLeft: 16, paddingRight: 16, paddingBottom: 20 }}>
        <View style={{ backgroundColor: C.apricotLight, borderRadius: 20, padding: 16, boxShadow: C.shadow, borderWidth: 1, borderColor: C.border }}>
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <MapPin size={14} color={C.brown} />
            <Text className="block text-sm font-semibold" style={{ color: C.brown }}>找附近特产&景点 ✦</Text>
          </View>
          <View style={{ display: 'flex', flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <View style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: 24, paddingLeft: 14, paddingRight: 14, paddingTop: 8, paddingBottom: 8, boxShadow: '0 2px 8px rgba(180,120,100,0.06)' }}>
              <Input
                style={{ width: '100%', fontSize: 13, color: C.text }}
                placeholder="输入地名，如：成都、厦门、大理…"
                placeholderStyle={`color: ${C.textLight}`}
                value={locationQuery}
                onInput={(e: any) => setLocationQuery(e.detail.value)}
                onConfirm={() => handleLocationSearch()}
              />
            </View>
            <View
              style={{ backgroundColor: C.pink, borderRadius: 24, paddingLeft: 14, paddingRight: 14, paddingTop: 8, paddingBottom: 8, boxShadow: C.shadow }}
              onClick={() => handleLocationSearch()}
            >
              <Text className="block text-xs font-bold text-white">搜索</Text>
            </View>
          </View>
          {locationLoading && (
            <View style={{ marginTop: 8, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text className="block text-xs" style={{ color: C.greenDark }}>正在搜索 ✦</Text>
            </View>
          )}
          {locationResults && (
            <View style={{ marginTop: 8 }}>
              {locationResults.specialties && locationResults.specialties.length > 0 && (
                <View style={{ marginBottom: 6 }}>
                  <Text className="block text-xs font-medium mb-1" style={{ color: C.pink }}>♡ 当地特产</Text>
                  <View style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                    {locationResults.specialties.map((s: string, i: number) => (
                      <View key={i} style={{ backgroundColor: C.pinkLight, borderRadius: 12, paddingLeft: 8, paddingRight: 8, paddingTop: 3, paddingBottom: 3 }}>
                        <Text className="block text-xs" style={{ color: C.pink }}>{s}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              {locationResults.attractions && locationResults.attractions.length > 0 && (
                <View style={{ marginBottom: 6 }}>
                  <Text className="block text-xs font-medium mb-1" style={{ color: C.brown }}>✦ 附近景点</Text>
                  {locationResults.attractions.map((a: any, i: number) => (
                    <View key={i} style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: 8, marginTop: 4, boxShadow: '0 2px 8px rgba(180,120,100,0.06)' }}>
                      <Text className="block text-xs font-medium" style={{ color: C.text }}>{a.name}</Text>
                      {a.description && <Text className="block text-xs mt-1" style={{ color: C.textMid }}>{a.description}</Text>}
                    </View>
                  ))}
                </View>
              )}
              {locationResults.chatTopics && locationResults.chatTopics.length > 0 && (
                <View>
                  <Text className="block text-xs font-medium mb-1" style={{ color: C.greenDark }}>🌿 聊天话题灵感</Text>
                  <View style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                    {locationResults.chatTopics.map((t: string, i: number) => (
                      <View key={i} style={{ backgroundColor: '#F0F5E8', borderRadius: 12, paddingLeft: 8, paddingRight: 8, paddingTop: 3, paddingBottom: 3 }}>
                        <Text className="block text-xs" style={{ color: C.greenDark }}>{t}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  )
}
