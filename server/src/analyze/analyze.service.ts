import { Injectable } from '@nestjs/common'
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk'

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
7. 语气像真实微信聊天
8. 每条回复控制在30-60字
9. 回复要自然，可以轻松一点，但不能过度讨好
10. 所有回复都只是建议，使用者可以自行修改后发送

你必须严格按照以下 JSON 格式输出，不要输出任何其他内容：
{
  "messageType": "消息类型，从以下选项中选择：抱怨回复慢 / 情绪低落 / 暧昧试探 / 消费后求关注 / 直播安排询问 / 普通互动 / 其他",
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
  async analyze(message: string, context: string): Promise<AnalysisResult> {
    const config = new Config()
    const client = new LLMClient(config)

    const userContent = context
      ? `粉丝消息：「${message}」\n粉丝背景：${context}`
      : `粉丝消息：「${message}」`

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userContent },
    ]

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
      const parsed = JSON.parse(jsonStr)
      return {
        messageType: parsed.messageType || '其他',
        emotion: parsed.emotion || '无法判断',
        warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
        gentleReply: parsed.gentleReply || '',
        casualReply: parsed.casualReply || '',
        boundaryReply: parsed.boundaryReply || '',
        badReply: parsed.badReply || '',
        badReason: parsed.badReason || '',
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
}
