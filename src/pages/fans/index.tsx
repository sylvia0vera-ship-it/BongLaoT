import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import { Input } from '@/components/ui/input'
import Taro from '@tarojs/taro'
import { Network } from '@/network'
import {
  Users,
  UserPlus,
  PenLine,
  Trash2,
  Check,
  ArrowLeft,
  Tag,
  NotebookPen,
  Loader,
  BookHeart,
  StickyNote,
  MessageCircleHeart,
  Flame,
  TriangleAlert,
  HandHeart,
} from 'lucide-react-taro'

const HEADER_TOP_PADDING = (() => {
  try {
    const sysInfo = Taro.getSystemInfoSync()
    return (sysInfo.statusBarHeight || 0) + 40 + 8
  } catch { return 60 }
})()

interface FanProfile {
  id: string
  name: string
  relationship_stage: string
  spending_habit: string
  chat_preference: string
  red_flags: string
  preferred_name: string
  last_interaction_summary: string
  next_maintenance_tip: string
  tags: string | null
  notes: string | null
  created_at: string
  updated_at: string | null
}

const STAGE_CONFIG: Record<string, { color: string; bg: string }> = {
  '普通互动': { color: '#8BA06E', bg: '#F0EDE4' },
  '熟悉陪伴': { color: '#5B8A72', bg: '#E8F5EE' },
  '暧昧升温': { color: '#F08C99', bg: '#FEF3F0' },
  '恋爱感人设': { color: '#C77A6E', bg: '#FFF2EA' },
  '冷淡流失': { color: '#6B8EB5', bg: '#E8F0F8' },
  '风险降温': { color: '#B55A5A', bg: '#FDE8E8' },
}

const STAGES = ['普通互动', '熟悉陪伴', '暧昧升温', '恋爱感人设', '冷淡流失', '风险降温']

const IndexPage = () => {
  const [fans, setFans] = useState<FanProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditor, setShowEditor] = useState(false)
  const [editFan, setEditFan] = useState<FanProfile | null>(null)
  // form
  const [formName, setFormName] = useState('')
  const [formStage, setFormStage] = useState('普通互动')
  const [formSpending, setFormSpending] = useState('')
  const [formChatPref, setFormChatPref] = useState('')
  const [formRedFlags, setFormRedFlags] = useState('')
  const [formPreferredName, setFormPreferredName] = useState('')
  const [formLastSummary, setFormLastSummary] = useState('')
  const [formNextTip, setFormNextTip] = useState('')
  const [formTags, setFormTags] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchFans = async () => {
    try {
      const res = await Network.request({ url: '/api/fans' })
      const data = res.data?.data
      if (data) setFans(data)
    } catch (err) {
      console.error('获取粉丝列表失败:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchFans() }, [])

  const openNewFan = () => {
    setEditFan(null)
    setFormName(''); setFormStage('普通互动'); setFormSpending('')
    setFormChatPref(''); setFormRedFlags(''); setFormPreferredName('')
    setFormLastSummary(''); setFormNextTip(''); setFormTags(''); setFormNotes('')
    setShowEditor(true)
  }

  const openEditFan = (fan: FanProfile) => {
    setEditFan(fan)
    setFormName(fan.name)
    setFormStage(fan.relationship_stage || '普通互动')
    setFormSpending(fan.spending_habit || '')
    setFormChatPref(fan.chat_preference || '')
    setFormRedFlags(fan.red_flags || '')
    setFormPreferredName(fan.preferred_name || '')
    setFormLastSummary(fan.last_interaction_summary || '')
    setFormNextTip(fan.next_maintenance_tip || '')
    setFormTags(fan.tags || '')
    setFormNotes(fan.notes || '')
    setShowEditor(true)
  }

  const handleSave = async () => {
    if (!formName.trim()) {
      Taro.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }
    setSaving(true)
    try {
      const payload = {
        name: formName.trim(),
        relationship_stage: formStage,
        spending_habit: formSpending.trim(),
        chat_preference: formChatPref.trim(),
        red_flags: formRedFlags.trim(),
        preferred_name: formPreferredName.trim(),
        last_interaction_summary: formLastSummary.trim(),
        next_maintenance_tip: formNextTip.trim(),
        tags: formTags.trim(),
        notes: formNotes.trim(),
      }
      if (editFan) {
        await Network.request({ url: `/api/fans/${editFan.id}`, method: 'PUT', data: payload })
      } else {
        await Network.request({ url: '/api/fans', method: 'POST', data: payload })
      }
      setShowEditor(false)
      fetchFans()
      Taro.showToast({ title: editFan ? '已保存' : '已添加', icon: 'none' })
    } catch (err) {
      console.error('保存粉丝失败:', err)
      Taro.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    const { confirm } = await Taro.showModal({ title: '确认删除', content: '删除后该粉丝的所有对话记录也将被清除，确认删除？' })
    if (!confirm) return
    try {
      await Network.request({ url: `/api/fans/${id}`, method: 'DELETE' })
      fetchFans()
      Taro.showToast({ title: '已删除', icon: 'none' })
    } catch (err) {
      console.error('删除粉丝失败:', err)
      Taro.showToast({ title: '删除失败', icon: 'none' })
    }
  }

  const getStageStyle = (stage: string) => STAGE_CONFIG[stage] || STAGE_CONFIG['普通互动']

  // 编辑面板
  if (showEditor) {
    return (
      <View className="min-h-screen" style={{ backgroundColor: '#F8EDEB' }}>
        <View style={{ paddingTop: HEADER_TOP_PADDING, paddingLeft: 20, paddingRight: 20, paddingBottom: 12 }}>
          <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View onClick={() => setShowEditor(false)} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <ArrowLeft size={18} color="#8BA06E" />
              <Text className="block text-sm" style={{ color: '#8BA06E' }}>返回</Text>
            </View>
            <Text className="block text-base font-bold" style={{ color: '#5C3A32' }}>{editFan ? '♡ 编辑档案' : '♡ 添加档案'}</Text>
            <View onClick={handleSave} style={{ opacity: saving ? 0.6 : 1 }}>
              {saving ? <Loader size={16} color="#C49890" /> : <Check size={18} color="#C49890" />}
            </View>
          </View>
        </View>

        <View style={{ flex: 1, paddingLeft: 16, paddingRight: 16, paddingTop: 8 }}>
          {/* 昵称 */}
          <View style={{ marginBottom: 12 }}>
            <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 }}>
              <Users size={12} color="#C49890" />
              <Text className="block text-xs font-bold" style={{ color: '#C49890' }}>昵称 *</Text>
            </View>
            <View style={{ borderRadius: 12, paddingLeft: 12, paddingRight: 12, paddingTop: 8, paddingBottom: 8, backgroundColor: '#FEF3F0', borderWidth: 1, borderColor: '#F0D6CE', borderStyle: 'dashed' }}>
              <Input style={{ fontSize: '14px', width: '100%', backgroundColor: 'transparent' }} placeholder="粉丝的微信昵称或备注名" value={formName} onInput={(e) => setFormName(e.detail.value)} maxlength={128} />
            </View>
          </View>

          {/* 常用称呼 */}
          <View style={{ marginBottom: 12 }}>
            <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 }}>
              <HandHeart size={12} color="#C49890" />
              <Text className="block text-xs font-bold" style={{ color: '#C49890' }}>常用称呼</Text>
            </View>
            <View style={{ borderRadius: 12, paddingLeft: 12, paddingRight: 12, paddingTop: 8, paddingBottom: 8, backgroundColor: '#FFF2EA', borderWidth: 1, borderColor: '#F0D6CE', borderStyle: 'dashed' }}>
              <Input style={{ fontSize: '14px', width: '100%', backgroundColor: 'transparent' }} placeholder="你平时怎么称呼ta，如：宝贝、哥" value={formPreferredName} onInput={(e) => setFormPreferredName(e.detail.value)} maxlength={50} />
            </View>
          </View>

          {/* 关系阶段 */}
          <View style={{ marginBottom: 12 }}>
            <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 }}>
              <Flame size={12} color="#C49890" />
              <Text className="block text-xs font-bold" style={{ color: '#C49890' }}>关系阶段</Text>
            </View>
            <View style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {STAGES.map((stage) => {
                const style = getStageStyle(stage)
                const selected = formStage === stage
                return (
                  <View key={stage} onClick={() => setFormStage(stage)} style={{ paddingTop: 3, paddingBottom: 3, paddingLeft: 8, paddingRight: 8, borderRadius: 12, backgroundColor: selected ? style.bg : '#FFF5F2', borderWidth: 1, borderColor: selected ? style.color : '#F0D6CE', borderStyle: selected ? 'solid' : 'dashed' }}>
                    <Text className="block text-xs font-bold" style={{ color: selected ? style.color : '#999' }}>{stage}</Text>
                  </View>
                )
              })}
            </View>
          </View>

          {/* 消费习惯 */}
          <View style={{ marginBottom: 12 }}>
            <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 }}>
              <Tag size={12} color="#C49890" />
              <Text className="block text-xs font-bold" style={{ color: '#C49890' }}>消费/支持习惯</Text>
            </View>
            <View style={{ borderRadius: 12, paddingLeft: 12, paddingRight: 12, paddingTop: 8, paddingBottom: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F0D6CE', borderStyle: 'dashed' }}>
              <Input style={{ fontSize: '14px', width: '100%', backgroundColor: 'transparent' }} placeholder="如：月消费5k+，爱打赏，偶尔送礼物" value={formSpending} onInput={(e) => setFormSpending(e.detail.value)} maxlength={200} />
            </View>
          </View>

          {/* 聊天偏好 */}
          <View style={{ marginBottom: 12 }}>
            <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 }}>
              <MessageCircleHeart size={12} color="#C49890" />
              <Text className="block text-xs font-bold" style={{ color: '#C49890' }}>聊天偏好</Text>
            </View>
            <View style={{ borderRadius: 12, paddingLeft: 12, paddingRight: 12, paddingTop: 8, paddingBottom: 8, backgroundColor: '#FEF3F0', borderWidth: 1, borderColor: '#F0D6CE', borderStyle: 'dashed' }}>
              <Input style={{ fontSize: '14px', width: '100%', backgroundColor: 'transparent' }} placeholder="如：喜欢被夸、爱聊日常、需要秒回" value={formChatPref} onInput={(e) => setFormChatPref(e.detail.value)} maxlength={200} />
            </View>
          </View>

          {/* 雷点 */}
          <View style={{ marginBottom: 12 }}>
            <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 }}>
              <TriangleAlert size={12} color="#C77A6E" />
              <Text className="block text-xs font-bold" style={{ color: '#C77A6E' }}>雷点/禁忌</Text>
            </View>
            <View style={{ borderRadius: 12, paddingLeft: 12, paddingRight: 12, paddingTop: 8, paddingBottom: 8, backgroundColor: '#FDE8E8', borderWidth: 1, borderColor: '#F0D6CE', borderStyle: 'dashed' }}>
              <Input style={{ fontSize: '14px', width: '100%', backgroundColor: 'transparent' }} placeholder="如：不喜欢被敷衍、讨厌群发、吃醋会闹" value={formRedFlags} onInput={(e) => setFormRedFlags(e.detail.value)} maxlength={200} />
            </View>
          </View>

          {/* 最近互动摘要 */}
          <View style={{ marginBottom: 12 }}>
            <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 }}>
              <NotebookPen size={12} color="#C49890" />
              <Text className="block text-xs font-bold" style={{ color: '#C49890' }}>最近一次互动摘要</Text>
            </View>
            <View style={{ borderRadius: 12, paddingLeft: 12, paddingRight: 12, paddingTop: 8, paddingBottom: 8, backgroundColor: '#FFF5F2', borderWidth: 1, borderColor: '#F0D6CE', borderStyle: 'dashed' }}>
              <Input style={{ fontSize: '14px', width: '100%', backgroundColor: 'transparent' }} placeholder="上次聊了什么，感觉怎么样" value={formLastSummary} onInput={(e) => setFormLastSummary(e.detail.value)} maxlength={300} />
            </View>
          </View>

          {/* 下次维护建议 */}
          <View style={{ marginBottom: 12 }}>
            <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 }}>
              <HandHeart size={12} color="#C49890" />
              <Text className="block text-xs font-bold" style={{ color: '#C49890' }}>下一步维护建议</Text>
            </View>
            <View style={{ borderRadius: 12, paddingLeft: 12, paddingRight: 12, paddingTop: 8, paddingBottom: 8, backgroundColor: '#FFF2EA', borderWidth: 1, borderColor: '#F0D6CE', borderStyle: 'dashed' }}>
              <Input style={{ fontSize: '14px', width: '100%', backgroundColor: 'transparent' }} placeholder="下次可以怎么开场，需要什么铺垫" value={formNextTip} onInput={(e) => setFormNextTip(e.detail.value)} maxlength={300} />
            </View>
          </View>

          {/* 标签 */}
          <View style={{ marginBottom: 12 }}>
            <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 }}>
              <Tag size={12} color="#C49890" />
              <Text className="block text-xs font-bold" style={{ color: '#C49890' }}>标签</Text>
            </View>
            <View style={{ borderRadius: 12, paddingLeft: 12, paddingRight: 12, paddingTop: 8, paddingBottom: 8, backgroundColor: '#FFF2EA', borderWidth: 1, borderColor: '#F0D6CE', borderStyle: 'dashed' }}>
              <Input style={{ fontSize: '14px', width: '100%', backgroundColor: 'transparent' }} placeholder="如：大R, 常互动, 暧昧试探（逗号分隔）" value={formTags} onInput={(e) => setFormTags(e.detail.value)} maxlength={200} />
            </View>
          </View>

          {/* 备注 */}
          <View style={{ marginBottom: 20 }}>
            <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 }}>
              <NotebookPen size={12} color="#C49890" />
              <Text className="block text-xs font-bold" style={{ color: '#C49890' }}>备注</Text>
            </View>
            <View style={{ borderRadius: 12, paddingLeft: 12, paddingRight: 12, paddingTop: 8, paddingBottom: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F0D6CE', borderStyle: 'dashed' }}>
              <Input style={{ fontSize: '14px', width: '100%', backgroundColor: 'transparent' }} placeholder="关于这个粉丝的补充说明..." value={formNotes} onInput={(e) => setFormNotes(e.detail.value)} maxlength={500} />
            </View>
          </View>
        </View>
      </View>
    )
  }

  // 粉丝列表
  return (
    <View className="min-h-screen" style={{ backgroundColor: '#F8EDEB' }}>
      <View style={{ paddingTop: HEADER_TOP_PADDING, paddingLeft: 20, paddingRight: 20, paddingBottom: 12 }}>
        <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <BookHeart size={20} color="#C49890" />
            <Text className="block text-lg font-bold" style={{ color: '#5C3A32' }}>♡ 粉丝档案</Text>
          </View>
          <View onClick={openNewFan} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: 3, paddingBottom: 3, paddingLeft: 10, paddingRight: 10, borderRadius: 16, backgroundColor: '#FEF3F0', borderWidth: 1, borderColor: '#F08C99', borderStyle: 'dashed' }}>
            <UserPlus size={13} color="#F08C99" />
            <Text className="block text-xs font-bold" style={{ color: '#F08C99' }}>添加</Text>
          </View>
        </View>
        <Text className="block text-xs mt-1" style={{ color: '#8BA06E' }}>记录每一个值得用心对待的人 ♡</Text>
      </View>

      <View style={{ flex: 1, paddingLeft: 16, paddingRight: 16, paddingTop: 8, paddingBottom: 24 }}>
        {loading ? (
          <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 64, paddingBottom: 64}}>
            <Loader size={24} color="#F08C99" />
          </View>
        ) : fans.length === 0 ? (
          <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 64, paddingBottom: 64}}>
            <StickyNote size={48} color="#F0D6CE" />
            <Text className="block text-sm mt-4" style={{ color: '#8BA06E' }}>还没有粉丝档案 ♡</Text>
            <Text className="block text-xs mt-1" style={{ color: '#8BA06E' }}>点击右上角，记录第一个用心的人 ♡</Text>
          </View>
        ) : (
          <View style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {fans.map((fan) => {
              const stageStyle = getStageStyle(fan.relationship_stage)
              const tagList = fan.tags ? fan.tags.split(',').map(t => t.trim()).filter(Boolean) : []
              return (
                <View
                  key={fan.id}
                  onClick={() => {
                    Taro.setStorageSync('selectedFanId', fan.id)
                    Taro.switchTab({ url: '/pages/index/index' })
                  }}
                  style={{ borderRadius: 16, paddingLeft: 14, paddingRight: 14, paddingTop: 10, paddingBottom: 10, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F0D6CE', borderStyle: 'dashed' }}
                >
                  <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: stageStyle.bg, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <Text className="text-xs font-bold" style={{ color: stageStyle.color }}>{fan.name.charAt(0)}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text className="block text-sm font-bold" style={{ color: '#5C3A32' }}>{fan.name}</Text>
                          <View style={{ paddingTop: 1, paddingBottom: 1, paddingLeft: 6, paddingRight: 6, borderRadius: 10, backgroundColor: stageStyle.bg }}>
                            <Text className="block text-xs font-bold" style={{ color: stageStyle.color }}>{fan.relationship_stage || '普通互动'}</Text>
                          </View>
                        </View>
                        {fan.preferred_name && (
                          <Text className="block text-xs mt-1" style={{ color: '#8BA06E' }}>称呼：{fan.preferred_name}</Text>
                        )}
                      </View>
                    </View>
                    <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View onClick={(e) => { e.stopPropagation(); openEditFan(fan) }} style={{ width: 26, height: 26, display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: 13, backgroundColor: '#FFF5F2' }}>
                        <PenLine size={12} color="#8BA06E" />
                      </View>
                      <View onClick={(e) => { e.stopPropagation(); handleDelete(fan.id) }} style={{ width: 26, height: 26, display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: 13, backgroundColor: '#FDE8E8' }}>
                        <Trash2 size={12} color="#B55A5A" />
                      </View>
                    </View>
                  </View>

                  {/* 详细信息 */}
                  <View style={{ marginLeft: 40, marginTop: 4 }}>
                    {tagList.length > 0 && (
                      <View style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 3, marginBottom: 4 }}>
                        {tagList.map((tag, i) => (
                          <View key={i} style={{ paddingTop: 1, paddingBottom: 1, paddingLeft: 6, paddingRight: 6, borderRadius: 10, backgroundColor: '#FFF2EA' }}>
                            <Text className="block text-xs" style={{ color: '#C77A6E' }}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    {fan.spending_habit && (
                      <Text className="block text-xs" style={{ color: '#8BA06E' }}>💰 {fan.spending_habit}</Text>
                    )}
                    {fan.last_interaction_summary && (
                      <View style={{ marginTop: 3, paddingTop: 2, paddingBottom: 2, paddingLeft: 8, paddingRight: 8, borderRadius: 6, backgroundColor: '#FFF5F2' }}>
                        <Text className="block text-xs" style={{ color: '#8BA06E' }}>最近：{fan.last_interaction_summary}</Text>
                      </View>
                    )}
                    {fan.next_maintenance_tip && (
                      <Text className="block text-xs mt-1" style={{ color: '#F08C99' }}>→ {fan.next_maintenance_tip}</Text>
                    )}
                    {fan.red_flags && (
                      <Text className="block text-xs mt-1" style={{ color: '#C77A6E' }}>⚠️ 雷点：{fan.red_flags}</Text>
                    )}
                  </View>
                </View>
              )
            })}
          </View>
        )}
      </View>
    </View>
  )
}

export default IndexPage
