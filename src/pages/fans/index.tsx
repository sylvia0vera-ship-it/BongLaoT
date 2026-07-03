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
  Star,
  Check,
  ArrowLeft,
  Tag,
  NotebookPen,
  Loader,
  BookHeart,
  StickyNote,
} from 'lucide-react-taro'

/** 安全区顶部高度（状态栏 + 胶囊按钮区域 + 间距） */
const HEADER_TOP_PADDING = (() => {
  try {
    const sysInfo = Taro.getSystemInfoSync()
    const statusBarH = sysInfo.statusBarHeight || 0
    // 微信胶囊按钮高度约32px，加上底部间距8px
    const capsuleHeight = 40
    return statusBarH + capsuleHeight + 8
  } catch { return 60 }
})()

/** 粉丝档案类型 */
interface FanProfile {
  id: string
  name: string
  tags: string | null
  notes: string | null
  relationship_level: string
  created_at: string
  updated_at: string | null
}

const LEVEL_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  '新粉': { color: '#6B8EB5', bg: '#E8F0F8', label: '新粉' },
  '普通': { color: '#7A8061', bg: '#F0EDE4', label: '普通' },
  '忠实': { color: '#5B8A72', bg: '#E8F5EE', label: '忠实' },
  '重点': { color: '#D98C9A', bg: '#FDE2E4', label: '重点' },
}

const LEVELS = ['新粉', '普通', '忠实', '重点']

const IndexPage = () => {
  const [fans, setFans] = useState<FanProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditor, setShowEditor] = useState(false)
  const [editFan, setEditFan] = useState<FanProfile | null>(null)
  const [formName, setFormName] = useState('')
  const [formTags, setFormTags] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [formLevel, setFormLevel] = useState('普通')
  const [saving, setSaving] = useState(false)

  const fetchFans = async () => {
    try {
      const res = await Network.request({ url: '/api/fans' })
      console.log('粉丝列表响应:', res.data)
      const data = res.data?.data
      if (data) {
        setFans(data)
      }
    } catch (err) {
      console.error('获取粉丝列表失败:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFans()
  }, [])

  const openNewFan = () => {
    setEditFan(null)
    setFormName('')
    setFormTags('')
    setFormNotes('')
    setFormLevel('普通')
    setShowEditor(true)
  }

  const openEditFan = (fan: FanProfile) => {
    setEditFan(fan)
    setFormName(fan.name)
    setFormTags(fan.tags || '')
    setFormNotes(fan.notes || '')
    setFormLevel(fan.relationship_level)
    setShowEditor(true)
  }

  const handleSave = async () => {
    if (!formName.trim()) {
      Taro.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }
    setSaving(true)
    try {
      if (editFan) {
        const res = await Network.request({
          url: `/api/fans/${editFan.id}`,
          method: 'PUT',
          data: {
            name: formName.trim(),
            tags: formTags.trim(),
            notes: formNotes.trim(),
            relationship_level: formLevel,
          },
        })
        console.log('更新粉丝响应:', res.data)
      } else {
        const res = await Network.request({
          url: '/api/fans',
          method: 'POST',
          data: {
            name: formName.trim(),
            tags: formTags.trim(),
            notes: formNotes.trim(),
            relationship_level: formLevel,
          },
        })
        console.log('创建粉丝响应:', res.data)
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
    const { confirm } = await Taro.showModal({
      title: '确认删除',
      content: '删除后该粉丝的所有对话记录也将被清除，确认删除？',
    })
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

  const getLevelStyle = (level: string) => {
    return LEVEL_CONFIG[level] || LEVEL_CONFIG['普通']
  }

  // 编辑面板 - 便签风格
  if (showEditor) {
    return (
      <View className="flex flex-col min-h-screen" style={{ backgroundColor: '#F8EDEB' }}>
        <View
          className="px-5 pb-3"
          style={{ paddingTop: `${HEADER_TOP_PADDING}px` }}
        >
          <View className="flex flex-row items-center justify-between">
            <View onClick={() => setShowEditor(false)} className="flex flex-row items-center gap-1">
              <ArrowLeft size={18} color="#7A8061" />
              <Text className="block text-sm" style={{ color: '#7A8061' }}>返回</Text>
            </View>
            <Text className="block text-base font-bold" style={{ color: '#2F2523' }}>{editFan ? '编辑粉丝' : '添加粉丝'}</Text>
            <View onClick={handleSave} style={{ opacity: saving ? 0.6 : 1 }}>
              {saving ? <Loader size={16} color="#A85D6A" className="animate-spin" /> : <Check size={18} color="#A85D6A" />}
            </View>
          </View>
        </View>

        <View className="flex-1 px-5 pt-2">
          {/* 昵称 - 浅粉便签 */}
          <View className="mb-4">
            <View className="flex flex-row items-center gap-1 mb-2">
              <Users size={12} color="#A85D6A" />
              <Text className="block text-xs font-bold" style={{ color: '#A85D6A' }}>昵称 *</Text>
            </View>
            <View
              className="rounded-xl px-3 py-2"
              style={{ backgroundColor: '#FDE2E4', border: '1px dashed #E8C9C4' }}
            >
              <Input
                className="bg-transparent border-none p-0 shadow-none ring-0"
                style={{ fontSize: '14px', width: '100%' }}
                placeholder="粉丝的微信昵称或备注名"
                placeholderClass="text-gray-400"
                value={formName}
                onInput={(e) => setFormName(e.detail.value)}
                maxlength={128}
              />
            </View>
          </View>

          {/* 关系等级 - 手写标签 */}
          <View className="mb-4">
            <View className="flex flex-row items-center gap-1 mb-2">
              <Star size={12} color="#A85D6A" />
              <Text className="block text-xs font-bold" style={{ color: '#A85D6A' }}>关系等级</Text>
            </View>
            <View className="flex flex-row gap-2">
              {LEVELS.map((level) => {
                const style = getLevelStyle(level)
                const selected = formLevel === level
                return (
                  <View
                    key={level}
                    onClick={() => setFormLevel(level)}
                    className="rounded-full px-3 py-1"
                    style={{
                      backgroundColor: selected ? style.bg : '#FFF7F2',
                      border: selected ? `1px solid ${style.color}` : '1px dashed #E8C9C4',
                    }}
                  >
                    <Text className="text-xs font-bold" style={{ color: selected ? style.color : '#999' }}>{level}</Text>
                  </View>
                )
              })}
            </View>
          </View>

          {/* 标签 - 奶油便签 */}
          <View className="mb-4">
            <View className="flex flex-row items-center gap-1 mb-2">
              <Tag size={12} color="#A85D6A" />
              <Text className="block text-xs font-bold" style={{ color: '#A85D6A' }}>标签</Text>
            </View>
            <View
              className="rounded-xl px-3 py-2"
              style={{ backgroundColor: '#FFF1DE', border: '1px dashed #E8C9C4' }}
            >
              <Input
                className="bg-transparent border-none p-0 shadow-none ring-0"
                style={{ fontSize: '14px', width: '100%' }}
                placeholder="如：大R, 常互动, 暧昧试探（逗号分隔）"
                placeholderClass="text-gray-400"
                value={formTags}
                onInput={(e) => setFormTags(e.detail.value)}
                maxlength={200}
              />
            </View>
          </View>

          {/* 备注 - 白色便签 */}
          <View className="mb-4">
            <View className="flex flex-row items-center gap-1 mb-2">
              <NotebookPen size={12} color="#A85D6A" />
              <Text className="block text-xs font-bold" style={{ color: '#A85D6A' }}>备注</Text>
            </View>
            <View
              className="rounded-xl px-3 py-2"
              style={{ backgroundColor: '#ffffff', border: '1px dashed #E8C9C4' }}
            >
              <Input
                className="bg-transparent border-none p-0 shadow-none ring-0"
                style={{ fontSize: '14px', width: '100%' }}
                placeholder="关于这个粉丝的补充说明..."
                placeholderClass="text-gray-400"
                value={formNotes}
                onInput={(e) => setFormNotes(e.detail.value)}
                maxlength={500}
              />
            </View>
          </View>
        </View>
      </View>
    )
  }

  // 粉丝列表
  return (
    <View className="flex flex-col min-h-screen" style={{ backgroundColor: '#F8EDEB' }}>
      <View
        className="px-5 pb-3"
        style={{ paddingTop: `${HEADER_TOP_PADDING}px` }}
      >
        <View className="flex flex-row items-center justify-between">
          <View className="flex flex-row items-center gap-2">
            <BookHeart size={20} color="#A85D6A" />
            <Text className="block text-lg font-bold" style={{ color: '#2F2523' }}>粉丝档案</Text>
          </View>
          <View
            onClick={openNewFan}
            className="flex flex-row items-center gap-1 rounded-full px-3 py-1"
            style={{ backgroundColor: '#FDE2E4', border: '1px dashed #D98C9A' }}
          >
            <UserPlus size={13} color="#D98C9A" />
            <Text className="text-xs font-bold" style={{ color: '#D98C9A' }}>添加</Text>
          </View>
        </View>
        <Text className="block text-xs mt-1" style={{ color: '#7A8061' }}>管理粉丝档案，分析时自动带入记忆</Text>
      </View>

      <View className="flex-1 overflow-y-auto px-5 pt-2 pb-6">
        {loading ? (
          <View className="flex items-center justify-center py-16">
            <Loader size={24} color="#D98C9A" className="animate-spin" />
          </View>
        ) : fans.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-16">
            <StickyNote size={48} color="#E8C9C4" />
            <Text className="block text-sm mt-4" style={{ color: '#7A8061' }}>还没有粉丝档案</Text>
            <Text className="block text-xs mt-1" style={{ color: '#7A8061' }}>点击右上角添加你的第一个粉丝</Text>
          </View>
        ) : (
          <View className="flex flex-col gap-3">
            {fans.map((fan) => {
              const levelStyle = getLevelStyle(fan.relationship_level)
              const tagList = fan.tags ? fan.tags.split(',').map(t => t.trim()).filter(Boolean) : []
              return (
                <View
                  key={fan.id}
                  className="rounded-2xl px-4 py-3"
                  style={{ backgroundColor: '#ffffff', border: '1px dashed #E8C9C4' }}
                >
                  <View className="flex flex-row items-center justify-between">
                    <View className="flex flex-row items-center gap-2 flex-1">
                      <View className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: levelStyle.bg }}>
                        <Text className="text-xs font-bold" style={{ color: levelStyle.color }}>
                          {fan.name.charAt(0)}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <View className="flex flex-row items-center gap-2">
                          <Text className="block text-sm font-bold" style={{ color: '#2F2523' }}>{fan.name}</Text>
                          <View
                            className="inline-flex items-center px-2 py-0 rounded-full"
                            style={{ backgroundColor: levelStyle.bg }}
                          >
                            <Text className="text-xs font-bold" style={{ color: levelStyle.color }}>
                              {fan.relationship_level}
                            </Text>
                          </View>
                        </View>
                        {tagList.length > 0 && (
                          <View className="flex flex-row flex-wrap gap-1 mt-1">
                            {tagList.map((tag, i) => (
                              <View key={i} className="rounded-full px-2 py-0" style={{ backgroundColor: '#FFF1DE' }}>
                                <Text className="text-xs" style={{ color: '#C77763' }}>{tag}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    </View>
                    <View className="flex flex-row items-center gap-2">
                      <View
                        onClick={() => openEditFan(fan)}
                        className="w-7 h-7 flex items-center justify-center rounded-full"
                        style={{ backgroundColor: '#FFF7F2' }}
                      >
                        <PenLine size={12} color="#7A8061" />
                      </View>
                      <View
                        onClick={() => handleDelete(fan.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-full"
                        style={{ backgroundColor: '#FDE8E8' }}
                      >
                        <Trash2 size={12} color="#B55A5A" />
                      </View>
                    </View>
                  </View>
                  {fan.notes && (
                    <View className="mt-2 ml-10 rounded-lg px-2 py-1" style={{ backgroundColor: '#FFF7F2' }}>
                      <Text className="block text-xs" style={{ color: '#7A8061' }}>{fan.notes}</Text>
                    </View>
                  )}
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
