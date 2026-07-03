import { Injectable } from '@nestjs/common'
import { LLMClient, Config, HeaderUtils, Message } from 'coze-coding-dev-sdk'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL || ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!url || !key) return null
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

export interface AnalysisResult {
  messageType: string
  emotion: string
  warnings: { label: string; detail: string }[]
  gentleReply: string
  casualReply: string
  boundaryReply: string
  badReply: string
  badReason: string
}

const REFERENCE_CASES = `
【参考案例库】以下是经过标注的典型粉丝消息场景，请优先匹配最相似的场景，并参考"回复重点"生成回复：

1. 抱怨回复慢
   - 粉丝消息："你怎么这么久才回我消息？我等了好久" / 背景：大R粉丝，月消费5k+ / 回复重点：表达不是故意忽略，不承诺秒回
   - 粉丝消息："每次给你发消息都要等半天" / 背景：普通粉丝，偶尔打赏 / 回复重点：简短安抚，不制造特殊感

2. 消费后求关注
   - 粉丝消息："今天给你刷了那么多，你都不跟我说说话" / 背景：大R粉丝，月消费1w+ / 回复重点：感谢支持但不暗示特殊关系
   - 粉丝消息："我给你送了礼物你怎么都不回我" / 背景：小R粉丝，首次打赏 / 回复重点：温和感谢，不承诺专属回报

3. 上线安排询问
   - 粉丝消息："今天几点上线？我等你" / 背景：忠实粉丝，每天来看 / 回复重点：给出时间或不确定时诚实回答，不暗示"专门为你"
   - 粉丝消息："你明天还在吗？不在的话我就不等了" / 背景：普通粉丝，偶尔来看 / 回复重点：轻松回复，不因对方威胁式语气而妥协

4. 情绪低落
   - 粉丝消息："今天好累，感觉什么都不想做" / 背景：普通粉丝，偶尔互动 / 回复重点：轻量关怀，不做心理辅导，不承诺陪伴
   - 粉丝消息："感觉最近压力好大，能不能陪我聊聊" / 背景：大R粉丝，月消费5k+ / 回复重点：温暖回应但不做长期情感支撑

5. 暧昧试探
   - 粉丝消息："你有没有想我啊" / 背景：男粉丝，经常打赏 / 回复重点：轻松化解，不回应暧昧，不给错觉
   - 粉丝消息："如果我在你身边就好了" / 背景：新粉丝，开始频繁互动 / 回复重点：礼貌转移话题，不接暧昧暗示

6. 边界试探
   - 粉丝消息："我们能不能线下见一面" / 背景：大R粉丝，月消费1w+ / 回复重点：明确拒绝，不模糊，不解释太多
   - 粉丝消息："你能给我你的私人微信吗" / 背景：普通粉丝，频繁互动 / 回复重点：委婉但坚定拒绝，不道歉

7. 普通互动
   - 粉丝消息："你今天好好看" / 背景：普通粉丝 / 回复重点：简短感谢，自然回应，不过度热情
   - 粉丝消息："哈哈你说的那个段子太搞笑了" / 背景：老粉丝 / 回复重点：轻松互动，可以适当幽默

8. 冷场唤回
   - 粉丝消息："在吗？好久没聊天了" / 背景：曾经活跃的粉丝 / 回复重点：简短回应，不过度热情，不追问为何消失
   - 粉丝消息："最近怎么都没看到你" / 背景：偶尔来的粉丝 / 回复重点：简单解释近况，不渲染思念

9. 轻微不满
   - 粉丝消息："你都不看我的消息" / 背景：普通粉丝 / 回复重点：不承认也不否认，轻松带过
   - 粉丝消息："感觉你现在都不怎么跟大家互动了" / 背景：老粉丝 / 回复重点：简短回应，不解释过多，不承诺改变
`

const SYSTEM_PROMPT = `你是一个直播私域关系维护 AI 助手。

使用者身份：兼职主播、主播运营、直播运营助理、私域运营人员。

你的任务：
根据用户发来的微信消息，判断消息类型、用户情绪、关系风险，并生成自然、有分寸、可修改的微信回复建议。

回复原则：
1. 不冷漠，不敷衍
2. 不油腻，不客服腔
3. 不制造暧昧承诺
4. 不说"只对你""最在意你""只陪你"
5. 不承诺线下见面
6. 不鼓励用户过度情感依赖
7. 语气像真实微信聊天，像朋友之间的自然对话
8. 每条回复控制在30-60字
9. 回复要自然，可以轻松一点，但不能过度讨好
10. 所有回复都只是建议，使用者可以自行修改后发送
11. 优先参考案例库中的同类场景的回复重点来生成回复

【话术红线 - 必须遵守】：
- 回复中**禁止出现"直播"二字**。这是私域微信聊天，不是直播间，提到"直播"会拉远距离感、增加主播与粉丝的边界感
- 替代表达：
  · "直播" → 用"过来""来看我""见我""上线"等自然口语替代
  · "直播的时候" → "在的时候""忙的时候"
  · "看你直播" → "来看我""过来玩""支持我"
  · "直播时间" → "上线时间""我一般在的时间"
  · "不播了" → "不在""休息了"
- 整体语气要像私聊朋友，不是主播对观众说话

${REFERENCE_CASES}

你必须严格按照以下 JSON 格式输出，不要输出任何其他内容：
{
  "messageType": "消息类型，从以下选项中选择：抱怨回复慢 / 情绪低落 / 暧昧试探 / 消费后求关注 / 上线安排询问 / 普通互动 / 冷场唤回 / 轻微不满 / 边界试探 / 其他",
  "emotion": "用一句话判断对方现在的情绪",
  "warnings": [
    {"label": "风险标签，如容易越界/容易敷衍", "detail": "具体说明"}
  ],
  "gentleReply": "温柔安抚版回复，30-60字",
  "casualReply": "轻松互动版回复，30-60字",
  "boundaryReply": "边界清晰版回复，30-60字",
  "badReply": "一条容易踩雷的回复",
  "badReason": "为什么不建议这样回复"
}`

@Injectable()
export class AnalyzeService {
  async analyze(message: string, context: string, fanId?: string, imageUrl?: string): Promise<AnalysisResult> {
    const config = new Config()
    const client = new LLMClient(config)

    // 构建用户记忆上下文
    let memoryContext = ''
    if (fanId) {
      try {
        const supabase = getSupabaseClient()
        if (supabase) {
          // 查询粉丝档案
          const { data: fan } = await supabase
            .from('fans')
            .select('name, tags, notes, relationship_level')
            .eq('id', fanId)
            .single()

          if (fan) {
            memoryContext += `\n\n【当前粉丝档案】\n姓名：${fan.name}\n关系等级：${fan.relationship_level}\n标签：${fan.tags || '无'}\n备注：${fan.notes || '无'}`
          }

          // 查询最近5条对话记录
          const { data: chatLogs } = await supabase
            .from('fan_chat_logs')
            .select('message, analysis_result, created_at')
            .eq('fan_id', fanId)
            .order('created_at', { ascending: false })
            .limit(5)

          if (chatLogs && chatLogs.length > 0) {
            memoryContext += '\n\n【近期对话记录（最新5条）】'
            const logs = [...chatLogs].reverse() // 按时间正序
            for (const log of logs) {
              const analysis = log.analysis_result as Record<string, string> | null
              const typeLabel = analysis?.messageType || ''
              memoryContext += `\n- 粉丝说：「${log.message}」→ 类型：${typeLabel}`
            }
          }
        }
      } catch (err) {
        console.error('获取粉丝记忆失败:', err)
      }
    }

    const userContent = context
      ? `粉丝消息：「${message}」\n粉丝背景：${context}${memoryContext}`
      : `粉丝消息：「${message}」${memoryContext}`

    // 构建消息列表，支持多模态（图片+文字）
    const messages: Message[] = [
      { role: 'system', content: SYSTEM_PROMPT },
    ]

    if (imageUrl) {
      // 下载图片并转为 base64 data URL（豆包模型不支持签名 URL）
      let base64DataUrl = imageUrl
      try {
        const imageResp = await fetch(imageUrl)
        const imageBuffer = Buffer.from(await imageResp.arrayBuffer())
        const mimeType = imageResp.headers.get('content-type') || 'image/jpeg'
        const base64 = imageBuffer.toString('base64')
        base64DataUrl = `data:${mimeType};base64,${base64}`
        console.log('图片已下载并转为 base64, 大小:', imageBuffer.length)
      } catch (e) {
        console.error('下载图片失败，使用原始 URL:', e.message)
      }

      messages.push({
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: base64DataUrl } },
          { type: 'text', text: userContent + '\n\n【附加说明】：用户还上传了一张聊天截图，请结合图片中的对话内容一起分析，生成回复建议。' },
        ],
      })
    } else {
      messages.push({ role: 'user', content: userContent })
    }

    const response = await client.invoke(messages, {
      model: 'doubao-seed-2-0-mini-260215',
      temperature: 0.7,
    })

    console.log('LLM 原始响应:', response.content)

    try {
      // 尝试从响应中提取 JSON
      let jsonStr = response.content.trim()
      // 处理可能的 markdown code block 包裹
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim()
      }
      // 清理中文引号和特殊字符
      jsonStr = jsonStr
        .replace(/[\u201c\u201d\u00ab\u00bb]/g, '\u201c')  // 中文/书名号双引号 → 统一为中文左双引号（避免破坏JSON结构）
        .replace(/[\u2018\u2019]/g, "'")  // 中文单引号 → 英文单引号
        .replace(/,\s*([}\]])/g, '$1')    // 移除尾部多余逗号

      // 尝试直接解析，如果失败则尝试更激进的修复
      type ParsedResult = Record<string, string | Array<{ label: string; detail: string }>>
      let parsed: ParsedResult
      try {
        parsed = JSON.parse(jsonStr) as ParsedResult
      } catch {
        // 如果解析失败，尝试逐字段提取
        console.log('JSON 直接解析失败，尝试逐字段提取...')
        parsed = this.extractFieldsManually(jsonStr)
      }
      return {
        messageType: (parsed.messageType as string) || '其他',
        emotion: (parsed.emotion as string) || '无法判断',
        warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
        gentleReply: (parsed.gentleReply as string) || '',
        casualReply: (parsed.casualReply as string) || '',
        boundaryReply: (parsed.boundaryReply as string) || '',
        badReply: (parsed.badReply as string) || '',
        badReason: (parsed.badReason as string) || '',
      }
    } catch (err) {
      console.error('解析 LLM 响应失败:', err)
      return {
        messageType: '其他',
        emotion: '无法判断',
        warnings: [],
        gentleReply: '收到消息了，稍等回复你～',
        casualReply: '嗨～刚看到，等下回你',
        boundaryReply: '谢谢消息，我这边有点忙，晚点回复你',
        badReply: '（解析失败，请重试）',
        badReason: 'AI 响应解析异常',
      }
    }
  }

  /** 当 JSON.parse 失败时，手动从文本中提取各字段 */
  private extractFieldsManually(text: string): Record<string, string | Array<{ label: string; detail: string }>> {
    const result: Record<string, string | Array<{ label: string; detail: string }>> = {}
    
    // 提取简单字符串字段
    const stringFields = ['messageType', 'emotion', 'gentleReply', 'casualReply', 'boundaryReply', 'badReply', 'badReason']
    for (const field of stringFields) {
      // 匹配 "field": "value" 或 "field": value
      const regex = new RegExp(`"${field}"\\s*:\\s*"([\\s\\S]*?)"\\s*[,}\\n]`)
      const match = text.match(regex)
      if (match) {
        result[field] = match[1].trim()
      }
    }

    // 提取 warnings 数组
    const warningsMatch = text.match(/"warnings"\s*:\s*\[([\s\S]*?)\]/)
    if (warningsMatch) {
      const warnings: Array<{ label: string; detail: string }> = []
      const items = warningsMatch[1].matchAll(/\{[^}]*"label"\s*:\s*"([^"]*?)"[^}]*"detail"\s*:\s*"([^"]*?)"[^}]*\}/g)
      for (const item of items) {
        warnings.push({ label: item[1], detail: item[2] })
      }
      result.warnings = warnings
    }

    return result
  }
}
