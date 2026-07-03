import { Injectable } from '@nestjs/common'
import { LLMClient, Config } from 'coze-coding-dev-sdk'
import { getSupabaseClient } from '../storage/database/supabase-client'
import * as https from 'https'
import * as http from 'http'

/** 聊天模式 */
type ChatMode = 'pre-chat' | 'mid-chat' | 'post-chat'

@Injectable()
export class AnalyzeService {
  private llmClient: LLMClient

  constructor() {
    const config = new Config()
    this.llmClient = new LLMClient(config)
  }

  /** 主分析入口 */
  async analyze(message: string, context?: string, fanId?: string, imageUrl?: string, chatMode: ChatMode = 'mid-chat') {
    // 获取粉丝档案
    let fanProfile = ''
    let recentChats = ''
    if (fanId) {
      try {
        const supabase = getSupabaseClient()
        const { data: fan } = await supabase.from('fans').select('*').eq('id', fanId).single()
        if (fan) {
          fanProfile = this.buildFanProfile(fan)
          const { data: logs } = await supabase
            .from('chat_logs')
            .select('message, context, chat_mode, created_at')
            .eq('fan_id', fanId)
            .order('created_at', { ascending: false })
            .limit(5)
          if (logs && logs.length > 0) {
            recentChats = logs.map((l: any) => `[${l.chat_mode}] ${l.message}`).join('\n')
          }
        }
      } catch (e) {
        console.error('获取粉丝档案失败:', e.message)
      }
    }

    const modePrompt = this.getModePrompt(chatMode)
    const systemPrompt = this.buildSystemPrompt(modePrompt, chatMode)
    const userPrompt = this.buildUserPrompt(message, context, fanProfile, recentChats, chatMode)

    try {
      const messages: any[] = [
        { role: 'system', content: systemPrompt },
      ]

      // 如果有图片，添加到用户消息
      if (imageUrl && chatMode === 'mid-chat') {
        try {
          const base64DataUrl = await this.downloadImageAsBase64(imageUrl)
          messages.push({
            role: 'user',
            content: [
              { type: 'text', text: userPrompt },
              { type: 'image_url', image_url: { url: base64DataUrl, detail: 'high' } },
            ] as any,
          })
        } catch (imgErr) {
          console.error('图片下载失败，仅文字分析:', imgErr.message)
          messages.push({ role: 'user', content: userPrompt })
        }
      } else {
        messages.push({ role: 'user', content: userPrompt })
      }

      const response = await this.llmClient.invoke(messages, {
        model: 'doubao-seed-2-0-lite-260215',
        temperature: 0.75,
      })

      console.log('LLM 原始响应:', response.content)
      const result = this.parseResponse(response.content, chatMode)
      return result
    } catch (error) {
      console.error('LLM 调用失败:', error.message)
      return this.getFallbackResult(chatMode)
    }
  }

  /** 构建粉丝档案文本 */
  private buildFanProfile(fan: any): string {
    const parts = [`昵称：${fan.name}`]
    if (fan.nickname) parts.push(`常用称呼：${fan.nickname}`)
    if (fan.relationship_stage || fan.relationship_level) parts.push(`关系阶段：${fan.relationship_stage || fan.relationship_level}`)
    if (fan.support_habits) parts.push(`消费/支持习惯：${fan.support_habits}`)
    if (fan.chat_preferences) parts.push(`聊天偏好：${fan.chat_preferences}`)
    if (fan.triggers) parts.push(`雷点：${fan.triggers}`)
    if (fan.last_interaction_summary) parts.push(`最近互动摘要：${fan.last_interaction_summary}`)
    if (fan.next_step_suggestion) parts.push(`维护建议：${fan.next_step_suggestion}`)
    if (fan.persona_type) parts.push(`互动人设：${fan.persona_type}`)
    if (fan.tags) parts.push(`标签：${fan.tags}`)
    if (fan.notes) parts.push(`备注：${fan.notes}`)
    return parts.join('\n')
  }

  /** 获取模式专属 prompt */
  private getModePrompt(mode: ChatMode): string {
    switch (mode) {
      case 'pre-chat':
        return `你现在处于"聊前准备"模式。
任务：根据粉丝档案和关系阶段，帮主播做好聊前准备。
需要输出：
1. 关系阶段判断
2. 今日互动目标（1句话）
3. 开场白/破冰话题建议（2-3个）
4. 前5句破冰话术（按顺序：第1句轻松开场 → 第2句情绪承接 → 第3句制造被记住感 → 第4句轻微暧昧/陪伴感 → 第5句引导继续互动）
5. 注意事项（该粉丝的雷点、偏好等提醒）

前5句破冰要根据人设风格调整：
- 温柔陪伴型：温暖关怀、细腻体贴
- 女友感型：撒娇、吃醋、依赖感
- 撒娇型：可爱粘人、小情绪
- 成熟姐姐型：知性包容、偶尔撩一下
- 轻松朋友型：自然随性、开玩笑`

      case 'mid-chat':
        return `你现在处于"聊中分析"模式。
任务：分析粉丝发来的消息，帮主播生成合适的回复。
需要输出：
1. 消息类型（抱怨回复慢/情绪低落/暧昧试探/消费后求关注/上线安排询问/普通互动/冷场唤回/轻微不满/边界试探/其他）
2. 对方情绪
3. 当前关系阶段判断
4. 风险提醒
5. 推荐回复策略（1句话建议怎么回）
6. 三版回复：温柔撒娇版 / 轻松暧昧版 / 甜而不腻版
7. 前5句破冰建议（如果需要重新破冰的话）
8. 聊后复盘建议（本次聊天结束后的总结方向）
9. 粉丝档案更新建议（该更新什么信息）
10. 1条不建议发送的话，以及原因`

      case 'post-chat':
        return `你现在处于"聊后复盘"模式。
任务：根据本轮聊天内容，帮主播做聊后复盘和档案更新。
需要输出：
1. 本轮聊天总结（1-2句话概括互动效果）
2. 对方情绪变化（从什么情绪到什么情绪）
3. 关系变化判断（升温/持平/降温）
4. 粉丝档案更新建议（具体要更新哪些字段）
5. 下次可以怎么开场（2-3个建议）
6. 维护建议（下一步该怎么做）`
    }
  }

  /** 构建系统 prompt */
  private buildSystemPrompt(modePrompt: string, mode: ChatMode): string {
    return `你是一位资深主播私域关系维护顾问，擅长帮助主播维护粉丝关系。

⚠️ 格式要求：你必须严格按照指定的JSON格式返回结果，所有字段都必须包含，不能遗漏任何一个字段。不要添加JSON之外的内容。

${modePrompt}

【回复原则】
1. 你可以根据主播设定生成不同程度的恋爱感、暧昧感、撒娇感回复。
2. 可以表达"想你""在意你""你对我很特别""看到你来我会开心"等人设内亲密表达。
3. 可以营造粉丝被重视、被偏爱、被记住的感觉。
4. 如果用户要求强恋爱感回复，可以生成女友感、暧昧拉扯感、轻微吃醋感的话术。
5. 所有亲密表达默认属于直播/语音陪伴场景下的人设互动，不代表现实恋爱承诺。
6. 不承诺线下见面、现实恋爱关系、私下陪伴绑定、金钱回报或唯一关系。
7. 不使用威胁、羞辱、冷暴力、PUA、卖惨或欺骗方式诱导用户付费。
8. 可以自然引导用户继续互动、来看我、送礼支持，但语气要轻松，不强迫。
9. 回复要像微信聊天，短句、自然、有情绪价值。

【话术红线 - 禁止出现以下词汇】
- 禁止出现"直播"二字（用"来看我""在的时候""上线"替代）
- 禁止出现"播"字（用"在""来"替代）
- 禁止出现"观众"（用"你"直接称呼）
- 禁止出现"粉丝"（用昵称或"你"称呼）

【人设风格对照】
- 温柔陪伴型：温暖关怀，细腻体贴，像知心姐姐
- 女友感型：撒娇依赖，会吃醋，会说"想你了""你怎么才来"
- 撒娇型：可爱粘人，会闹小脾气，"哼你不理我"
- 成熟姐姐型：知性包容，偶尔撩一下，"乖，听话"
- 轻松朋友型：随性自然，开玩笑打闹，不刻意暧昧

【关系阶段说明】
- 普通互动：刚认识不久，互动较浅
- 熟悉陪伴：经常互动，有一定默契
- 暧昧升温：双方有暧昧信号，可以适当升温
- 恋爱感人设：已建立人设内恋爱感，可以深入角色扮演
- 冷淡流失：互动减少，需要唤回
- 风险降温：有边界试探或不当要求，需要降温处理

【输出格式要求】
严格按照以下JSON格式输出，不要添加注释或额外文字：
${this.getOutputFormat(mode)}`
  }

  /** 获取输出格式 */
  private getOutputFormat(mode: ChatMode): string {
    switch (mode) {
      case 'pre-chat':
        return `{
  "relationshipStage": "关系阶段",
  "dailyGoal": "今日互动目标",
  "openers": ["开场白1", "开场白2", "开场白3"],
  "iceBreaker": {
    "1": "轻松开场",
    "2": "情绪承接",
    "3": "制造被记住感",
    "4": "轻微暧昧/陪伴感",
    "5": "引导继续互动"
  },
  "precautions": ["注意1", "注意2"]
}`

      case 'mid-chat':
        return `{
  "messageType": "消息类型",
  "emotion": "对方情绪",
  "relationshipStage": "关系阶段判断",
  "riskWarning": "风险提醒",
  "replyStrategy": "推荐回复策略",
  "gentleReply": "温柔撒娇版回复",
  "casualReply": "轻松暧昧版回复",
  "sweetReply": "甜而不腻版回复",
  "iceBreaker": {
    "1": "轻松开场",
    "2": "情绪承接",
    "3": "制造被记住感",
    "4": "轻微暧昧/陪伴感",
    "5": "引导继续互动"
  },
  "postChatReview": "聊后复盘方向建议",
  "fanProfileUpdate": "粉丝档案更新建议",
  "badReply": "不建议发送的话",
  "badReason": "不建议的原因"
}`

      case 'post-chat':
        return `{
  "chatSummary": "本轮聊天总结",
  "emotionChange": "对方情绪变化",
  "relationshipChange": "关系变化判断",
  "profileUpdateSuggestions": {
    "relationshipStage": "建议更新的关系阶段",
    "lastInteractionSummary": "建议更新的互动摘要",
    "nextStepSuggestion": "建议更新的下一步建议",
    "otherUpdates": "其他需要更新的信息"
  },
  "nextOpeners": ["下次开场1", "下次开场2", "下次开场3"],
  "maintenanceAdvice": "维护建议"
}`
    }
  }

  /** 构建用户 prompt */
  private buildUserPrompt(message: string, context?: string, fanProfile?: string, recentChats?: string, mode?: ChatMode): string {
    let prompt = ''

    if (mode === 'pre-chat') {
      prompt = '请帮我做聊前准备。当前没有收到粉丝消息，请仅根据粉丝档案和关系阶段生成开场白和破冰建议。\n'
    } else if (mode === 'post-chat') {
      prompt = '请帮我做聊后复盘。\n'
      prompt += `本轮聊天内容：${message}\n`
    } else {
      prompt = `粉丝发来的消息：${message}\n`
    }

    if (context) prompt += `补充背景：${context}\n`
    if (fanProfile) prompt += `\n【粉丝档案】\n${fanProfile}\n`
    if (recentChats) prompt += `\n【最近5条互动记录】\n${recentChats}\n`

    return prompt
  }

  /** 获取当前模式的默认值 */
  private getDefaults(mode: ChatMode): any {
    if (mode === 'mid-chat') {
      return {
        messageType: '其他', emotion: '中性', relationshipStage: '普通互动',
        riskWarning: '', replyStrategy: '',
        gentleReply: '我在呢，刚忙完~', casualReply: '嘻嘻，想我了吗？', sweetReply: '你来了我就开心~',
        iceBreaker: { '1': '嘿~', '2': '在干嘛呢', '3': '记得你上次说的', '4': '想你了', '5': '明天还在吗？' },
        postChatReview: '', fanProfileUpdate: '', badReply: '', badReason: ''
      }
    } else if (mode === 'pre-chat') {
      return {
        relationshipStage: '普通互动', dailyGoal: '',
        openers: ['嗨~在吗？', '今天过得怎么样？', '好久没聊了~'],
        iceBreaker: { '1': '嘿~', '2': '在干嘛呢', '3': '记得你上次说的', '4': '想你了', '5': '明天还在吗？' },
        precautions: ['注意粉丝情绪', '避免过于冷淡']
      }
    } else {
      return {
        chatSummary: '', emotionChange: '', relationshipChange: '持平',
        profileUpdateSuggestions: {},
        nextOpeners: ['嗨~', '在吗？', '今天怎样？'],
        maintenanceAdvice: ''
      }
    }
  }

  /** 解析 LLM 响应 */
  private parseResponse(content: string, mode: ChatMode): any {
    try {
      // 尝试直接解析
      const jsonStr = this.extractJson(content)

      if (jsonStr) {
        let parsed = JSON.parse(jsonStr)

        // 字段名映射：兼容 LLM 返回的不同字段名
        if (parsed.boundaryReply && !parsed.sweetReply) {
          parsed.sweetReply = parsed.boundaryReply
        }
        if (parsed.badReply && !parsed.notSuggested) {
          parsed.notSuggested = parsed.badReply
        }
        if (parsed.badReason && !parsed.notSuggestedReason) {
          parsed.notSuggestedReason = parsed.badReason
        }
        if (parsed.doNotSend && !parsed.notSuggested) {
          parsed.notSuggested = parsed.doNotSend
        }
        if (parsed.doNotSendReason && !parsed.notSuggestedReason) {
          parsed.notSuggestedReason = parsed.doNotSendReason
        }
        if (parsed.fanProfileUpdate && !parsed.profileUpdateSuggestions) {
          parsed.profileUpdateSuggestions = parsed.fanProfileUpdate
        }
        // postChatReview 可能是字符串，转为对象
        if (typeof parsed.postChatReview === 'string') {
          parsed.postChatReview = { summary: parsed.postChatReview, nextStep: '' }
        }
        // iceBreaker 可能是 {1:x,2:x} 格式的对象，转为数组
        if (parsed.iceBreaker && typeof parsed.iceBreaker === 'object' && !Array.isArray(parsed.iceBreaker)) {
          const arr = Object.keys(parsed.iceBreaker).sort().map(k => parsed.iceBreaker[k])
          parsed.iceBreaker = arr
        }
        // 合并默认值，确保新字段不为空
        const defaults = this.getDefaults(mode)
        const merged = { ...defaults, ...parsed }
        // 确保 iceBreaker 是数组格式
        if (!Array.isArray(merged.iceBreaker)) {
          merged.iceBreaker = defaults.iceBreaker as string[]
        }
        // 确保 profileUpdateSuggestions 不为空
        if (!merged.profileUpdateSuggestions) {
          merged.profileUpdateSuggestions = defaults.profileUpdateSuggestions
        }
        // 确保 postChatReview 是对象
        if (typeof merged.postChatReview === 'string') {
          merged.postChatReview = { summary: merged.postChatReview, nextStep: '' }
        }
        return { status: 'ok', data: merged, mode }
      }
    } catch (e) {
      console.error('JSON 解析失败，尝试手动提取:', e.message)
    }

    // 手动提取 fallback
    const result: any = { status: 'ok', mode }
    result.data = this.extractFieldsManually(content, mode)
    return result
  }

  /** 提取 JSON 字符串 */
  private extractJson(text: string): string | null {
    // 去掉 markdown 代码块
    let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()

    // 尝试找到 JSON 对象
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')
    if (start !== -1 && end > start) {
      let jsonStr = cleaned.substring(start, end + 1)
      // 修复中文引号
      jsonStr = jsonStr.replace(/[\u201c\u201d]/g, '"').replace(/[\u2018\u2019]/g, "'")
      // 修复嵌入在字符串内的引号 - 将 \" 替换为 '
      jsonStr = jsonStr.replace(/\\\"/g, "'")
      return jsonStr
    }
    return null
  }

  /** 手动提取字段 */
  private extractFieldsManually(content: string, mode: ChatMode): any {
    const result: any = {}

    if (mode === 'mid-chat') {
      result.messageType = this.extractField(content, 'messageType', '消息类型') || '其他'
      result.emotion = this.extractField(content, 'emotion', '情绪') || '中性'
      result.relationshipStage = this.extractField(content, 'relationshipStage', '关系阶段') || '普通互动'
      result.riskWarning = this.extractField(content, 'riskWarning', '风险提醒') || ''
      result.replyStrategy = this.extractField(content, 'replyStrategy', '回复策略') || ''
      result.gentleReply = this.extractField(content, 'gentleReply', '温柔撒娇') || '我在呢，刚忙完~'
      result.casualReply = this.extractField(content, 'casualReply', '轻松暧昧') || '嘻嘻，想我了吗？'
      result.sweetReply = this.extractField(content, 'sweetReply', '甜而不腻') || '你来了我就开心~'
      result.iceBreaker = { '1': '嘿~', '2': '在干嘛呢', '3': '记得你上次说的', '4': '想你了', '5': '明天还在吗？' }
      result.postChatReview = this.extractField(content, 'postChatReview', '复盘') || ''
      result.fanProfileUpdate = this.extractField(content, 'fanProfileUpdate', '档案更新') || ''
      result.badReply = this.extractField(content, 'badReply', '不建议') || ''
      result.badReason = this.extractField(content, 'badReason', '原因') || ''
    } else if (mode === 'pre-chat') {
      result.relationshipStage = this.extractField(content, 'relationshipStage', '关系阶段') || '普通互动'
      result.dailyGoal = this.extractField(content, 'dailyGoal', '互动目标') || ''
      result.openers = ['嗨~在吗？', '今天过得怎么样？', '好久没聊了~']
      result.iceBreaker = { '1': '嘿~', '2': '在干嘛呢', '3': '记得你上次说的', '4': '想你了', '5': '明天还在吗？' }
      result.precautions = ['注意粉丝情绪', '避免过于冷淡']
    } else {
      result.chatSummary = this.extractField(content, 'chatSummary', '聊天总结') || ''
      result.emotionChange = this.extractField(content, 'emotionChange', '情绪变化') || ''
      result.relationshipChange = this.extractField(content, 'relationshipChange', '关系变化') || '持平'
      result.profileUpdateSuggestions = {}
      result.nextOpeners = ['嗨~', '在吗？', '今天怎样？']
      result.maintenanceAdvice = this.extractField(content, 'maintenanceAdvice', '维护建议') || ''
    }

    return result
  }

  /** 从文本中提取单个字段值 */
  private extractField(text: string, fieldKey: string, fieldLabel: string): string {
    // 尝试 JSON key
    const patterns = [
      new RegExp(`"${fieldKey}"\\s*:\\s*"([^"]*?)"`),
      new RegExp(`"${fieldKey}"\\s*:\\s*"([\\s\\S]*?)"`),
      new RegExp(`${fieldLabel}[：:]\\s*(.+?)[\\n,}]`),
    ]
    for (const p of patterns) {
      const m = text.match(p)
      if (m) return m[1].trim()
    }
    return ''
  }

  /** Fallback 结果 */
  private getFallbackResult(mode: ChatMode): any {
    const fallback: any = { status: 'fallback', mode }

    if (mode === 'pre-chat') {
      fallback.data = {
        relationshipStage: '普通互动',
        dailyGoal: '保持互动频率，增加熟悉感',
        openers: ['嗨~在吗？', '今天过得怎么样？'],
        iceBreaker: { '1': '嘿~', '2': '在干嘛呢', '3': '记得你上次说的', '4': '想你了', '5': '明天还在吗？' },
        precautions: ['保持自然', '不要太刻意'],
      }
    } else if (mode === 'mid-chat') {
      fallback.data = {
        messageType: '其他', emotion: '中性',
        relationshipStage: '普通互动', riskWarning: '',
        replyStrategy: '自然回应即可',
        gentleReply: '我在呢，刚忙完~',
        casualReply: '嘻嘻，想我了吗？',
        sweetReply: '你来了我就开心~',
        iceBreaker: { '1': '嘿~', '2': '在干嘛呢', '3': '记得你上次说的', '4': '想你了', '5': '明天还在吗？' },
        postChatReview: '', fanProfileUpdate: '',
        badReply: '', badReason: '',
      }
    } else {
      fallback.data = {
        chatSummary: '互动正常', emotionChange: '情绪平稳',
        relationshipChange: '持平', profileUpdateSuggestions: {},
        nextOpeners: ['嗨~', '在吗？'], maintenanceAdvice: '保持互动频率',
      }
    }

    return fallback
  }

  /** 下载图片并转为 base64 data URL */
  private downloadImageAsBase64(imageUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const client = imageUrl.startsWith('https') ? https : http
      client.get(imageUrl, (res) => {
        if (res.statusCode === 302 || res.statusCode === 301) {
          const redirectUrl = res.headers.location
          if (redirectUrl) {
            this.downloadImageAsBase64(redirectUrl).then(resolve).catch(reject)
            return
          }
        }
        const chunks: Buffer[] = []
        res.on('data', (chunk) => chunks.push(chunk))
        res.on('end', () => {
          const buffer = Buffer.concat(chunks)
          const base64 = buffer.toString('base64')
          const contentType = res.headers['content-type'] || 'image/jpeg'
          const dataUrl = `data:${contentType};base64,${base64}`
          console.log(`图片下载完成: ${buffer.length} bytes, type: ${contentType}`)
          resolve(dataUrl)
        })
        res.on('error', reject)
      }).on('error', reject)
    })
  }
}
