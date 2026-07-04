import { Injectable } from '@nestjs/common'
import { LLMClient, Config } from 'coze-coding-dev-sdk'

@Injectable()
export class LocationService {
  private llmClient: LLMClient

  constructor() {
    const config = new Config()
    this.llmClient = new LLMClient(config)
  }

  async search(query: string) {
    if (!query || query.trim().length === 0) {
      return { specialties: [], attractions: [], chatTopics: [] }
    }

    const systemPrompt = `你是一个中国本地生活助手，熟悉全国各地的特产、美食和景点。
用户会输入一个地名，你需要返回该地点附近的特产和景点信息，以及适合主播跟粉丝聊这个地点的话题。

请以 JSON 格式返回，不要加任何注释或说明：
{
  "specialties": ["特产1", "特产2", "特产3"],
  "attractions": [
    {"name": "景点名称", "description": "一句话介绍"}
  ],
  "chatTopics": ["话题1", "话题2", "话题3"]
}

要求：
- specialties 至少3个，最多6个，只写名称
- attractions 至少2个，最多5个，每个有name和description
- chatTopics 是3个适合主播跟粉丝聊天的自然话题，比如"你吃过XX吗"、"下次来我带你去"
- 信息要真实准确，如果不确定就标注"待确认"
- 聊天话题要自然、亲切，适合私域聊天场景`

    const userPrompt = `请搜索"${query}"附近的特产和景点`

    try {
      const response = await this.llmClient.invoke(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        { model: 'doubao-seed-2-0-lite-260215', temperature: 0.3 }
      )

      console.log('[LocationService] LLM 原始响应:', response.content?.substring(0, 200))

      const content = response.content || ''
      let parsed: any = null

      // 尝试直接解析
      try {
        parsed = JSON.parse(content)
      } catch {
        // 提取 JSON
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[0])
          } catch {
            // 尝试修复中文引号
            const fixed = jsonMatch[0]
              .replace(/[\u201c\u201d]/g, '"')
              .replace(/[\u2018\u2019]/g, "'")
            try { parsed = JSON.parse(fixed) } catch {}
          }
        }
      }

      if (parsed && (parsed.specialties || parsed.attractions)) {
        return {
          specialties: Array.isArray(parsed.specialties) ? parsed.specialties : [],
          attractions: Array.isArray(parsed.attractions) ? parsed.attractions : [],
          chatTopics: Array.isArray(parsed.chatTopics) ? parsed.chatTopics : [],
        }
      }

      return { specialties: [], attractions: [], chatTopics: [] }
    } catch (error) {
      console.error('[LocationService] 搜索失败:', error.message)
      return { specialties: [], attractions: [], chatTopics: [] }
    }
  }
}
