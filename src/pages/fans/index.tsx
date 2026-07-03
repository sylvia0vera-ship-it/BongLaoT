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
} from 'lucide-react-taro'

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

  // 编辑面板
  if (showEditor) {
    return (
      <View className="flex flex-col min-h-screen bg-background">
        <View className="bg-background sticky top-0 z-40 px-4 pt-4 pb-2">
          <View className="flex flex-row items-center justify-between">
            <View onClick={() => setShowEditor(false)} className="flex flex-row items-center gap-1">
              <ArrowLeft size={18} color="#7A8061" />
              <Text className="block text-sm text-muted-foreground">返回</Text>
            </View>
            <Text className="block text-base font-bold text-foreground">{editFan ? '编辑粉丝' : '添加粉丝'}</Text>
            <View onClick={handleSave} style={{ opacity: saving ? 0.6 : 1 }}>
              {saving ? <Loader size={16} color="#D98C9A" className="animate-spin" /> : <Check size={18} color="#D98C9A" />}
            </View>
          </View>
        </View>

        <View className="flex-1 px-4 pt-4">
          {/* 昵称 */}
          <View className="mb-4">
            <View className="flex flex-row items-center gap-1 mb-2">
              <Users size={12} color="#D98C9A" />
              <Text className="block text-xs font-semibold text-muted-foreground">昵称 *</Text>
            </View>
            <View className="bg-card rounded-xl px-4 py-3" style={{ boxShadow: '0 1px 4px rgba(217,140,154,0.06)' }}>
              <Input
                className="w-full bg-transparent border-none p-0 shadow-none ring-0"
                style={{ fontSize: '14px' }}
                placeholder="粉丝的微信昵称或备注名"
                placeholderClass="text-gray-400"
                value={formName}
                onInput={(e) => setFormName(e.detail.value)}
                maxlength={128}
              />
            </View>
          </View>

          {/* 关系等级 */}
          <View className="mb-4">
            <View className="flex flex-row items-center gap-1 mb-2">
              <Star size={12} color="#D98C9A" />
              <Text className="block text-xs font-semibold text-muted-foreground">关系等级</Text>
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
                      backgroundColor: selected ? style.bg : '#f5f5f5',
                      borderWidth: selected ? '1px' : '1px',
                      borderColor: selected ? style.color : '#e5e5e5',
                    }}
                  >
                    <Text className="text-xs" style={{ color: selected ? style.color : '#999' }}>{level}</Text>
                  </View>
                )
              })}
            </View>
          </View>

          {/* 标签 */}
          <View className="mb-4">
            <View className="flex flex-row items-center gap-1 mb-2">
              <Tag size={12} color="#D98C9A" />
              <Text className="block text-xs font-semibold text-muted-foreground">标签</Text>
            </View>
            <View className="bg-card rounded-xl px-4 py-3" style={{ boxShadow: '0 1px 4px rgba(217,140,154,0.06)' }}>
              <Input
                className="w-full bg-transparent border-none p-0 shadow-none ring-0"
                style={{ fontSize: '14px' }}
                placeholder="如：大R, 常互动, 暧昧试探（逗号分隔）"
                placeholderClass="text-gray-400"
                value={formTags}
                onInput={(e) => setFormTags(e.detail.value)}
                maxlength={200}
              />
            </View>
          </View>

          {/* 备注 */}
          <View className="mb-4">
            <View className="flex flex-row items-center gap-1 mb-2">
              <NotebookPen size={12} color="#D98C9A" />
              <Text className="block text-xs font-semibold text-muted-foreground">备注</Text>
            </View>
            <View className="bg-card rounded-xl px-4 py-3" style={{ boxShadow: '0 1px 4px rgba(217,140,154,0.06)' }}>
              <Input
                className="w-full bg-transparent border-none p-0 shadow-none ring-0"
                style={{ fontSize: '14px' }}
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
    <View className="flex flex-col min-h-screen bg-background">
      <View className="bg-background sticky top-0 z-40 px-4 pt-4 pb-2">
        <View className="flex flex-row items-center justify-between">
          <View className="flex flex-row items-center gap-2">
            <Users size={20} color="#D98C9A" />
            <Text className="block text-base font-bold text-foreground">粉丝管理</Text>
          </View>
          <View
            onClick={openNewFan}
            className="flex flex-row items-center gap-1 rounded-full px-3 py-1"
            style={{ backgroundColor: '#FDE2E4' }}
          >
            <UserPlus size={14} color="#D98C9A" />
            <Text className="text-xs font-bold" style={{ color: '#D98C9A' }}>添加</Text>
          </View>
        </View>
        <Text className="block text-xs text-muted-foreground mt-1">管理粉丝档案，分析时自动带入记忆</Text>
      </View>

      <View className="flex-1 overflow-y-auto px-4 pt-2 pb-6">
        {loading ? (
          <View className="flex items-center justify-center py-16">
            <Loader size={24} color="#D98C9A" className="animate-spin" />
          </View>
        ) : fans.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-16">
            <Users size={48} color="#e5e5e5" />
            <Text className="block text-sm text-muted-foreground mt-4">还没有粉丝档案</Text>
            <Text className="block text-xs text-muted-foreground mt-1">点击右上角添加你的第一个粉丝</Text>
          </View>
        ) : (
          <View className="flex flex-col gap-2">
            {fans.map((fan) => {
              const levelStyle = getLevelStyle(fan.relationship_level)
              const tagList = fan.tags ? fan.tags.split(',').map(t => t.trim()).filter(Boolean) : []
              return (
                <View
                  key={fan.id}
                  className="bg-card rounded-2xl px-4 py-3"
                  style={{ boxShadow: '0 2px 8px rgba(217,140,154,0.06)' }}
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
                          <Text className="block text-sm font-bold text-foreground">{fan.name}</Text>
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
                              <View key={i} className="rounded-full px-2 py-0 bg-muted">
                                <Text className="text-xs text-muted-foreground">{tag}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    </View>
                    <View className="flex flex-row items-center gap-2">
                      <View
                        onClick={() => openEditFan(fan)}
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-muted"
                      >
                        <PenLine size={12} color="#7A8061" />
                      </View>
                      <View
                        onClick={() => handleDelete(fan.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-muted"
                      >
                        <Trash2 size={12} color="#B55A5A" />
                      </View>
                    </View>
                  </View>
                  {fan.notes && (
                    <Text className="block text-xs text-muted-foreground mt-2 pl-10">{fan.notes}</Text>
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
