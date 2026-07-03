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

const REFERENCE_CASES = `
【参考案例库】以下是经过标注的典型粉丝消息场景，请优先匹配最相似的场景，并参考"回复重点"生成回复：

1. 抱怨回复慢
   - 粉丝消息："你怎么这么久才回我消息？我等了好久" / 背景：大R粉丝，月消费5k+ / 回复重点：表达不是故意忽略，不承诺秒回
   - 粉丝消息："每次给你发消息都要等半天" / 背景：普通粉丝，偶尔打赏 / 回复重点：简短安抚，不制造特殊感

2. 消费后求关注
   - 粉丝消息："今天给你刷了那么多，你都不跟我说说话" / 背景：大R粉丝，月消费1w+ / 回复重点：感谢支持但不暗示特殊关系
   - 粉丝消息："我给你送了礼物你怎么都不回我" / 背景：小R粉丝，首次打赏 / 回复重点：温和感谢，不承诺专属回报

3. 直播安排询问
   - 粉丝消息："今天几点播？我等你" / 背景：忠实粉丝，每天观看 / 回复重点：给出时间或不确定时诚实回答，不暗示"为你而播"
   - 粉丝消息："你明天还播吗？不播的话我就不等你了" / 背景：普通粉丝，偶尔观看 / 回复重点：轻松回复，不因对方威胁式语气而妥协

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
   - 粉丝消息："你今天直播好好看" / 背景：普通粉丝 / 回复重点：简短感谢，自然回应，不过度热情
   - 粉丝消息："哈哈你说的那个段子太搞笑了" / 背景：老粉丝 / 回复重点：轻松互动，可以适当幽默

8. 冷场唤回
   - 粉丝消息："在吗？好久没聊天了" / 背景：曾经活跃的粉丝 / 回复重点：简短回应，不过度热情，不追问为何消失
   - 粉丝消息："最近怎么都没看到你直播" / 背景：偶尔观看的粉丝 / 回复重点：简单解释近况，不渲染思念

9. 轻微不满
   - 粉丝消息："你直播的时候都不看我发的弹幕" / 背景：普通粉丝 / 回复重点：不承认也不否认，轻松带过
   - 粉丝消息："感觉你现在都不怎么跟粉丝互动了" / 背景：老粉丝 / 回复重点：简短回应，不解释过多，不承诺改变
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
7. 语气像真实微信聊天
8. 每条回复控制在30-60字
9. 回复要自然，可以轻松一点，但不能过度讨好
10. 所有回复都只是建议，使用者可以自行修改后发送
11. 优先参考案例库中的同类场景的回复重点来生成回复

${REFERENCE_CASES}

你必须严格按照以下 JSON 格式输出，不要输出任何其他内容：
{
  "messageType": "消息类型，从以下选项中选择：抱怨回复慢 / 情绪低落 / 暧昧试探 / 消费后求关注 / 直播安排询问 / 普通互动 / 冷场唤回 / 轻微不满 / 边界试探 / 其他",
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
