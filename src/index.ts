import { Context, Schema, Session, Time } from 'koishi'

export const name = 'command-keyword-sentinel'

export const usage = `## 使用

在 \`keywords\` 中填入关键词。命中时拦截指令并封印用户，时长由 \`timeLimit\` 控制。

## 指令

| 指令 | 说明 |
| --- | --- |
| \`sentinel\` | 查看帮助 |
| \`sentinel.seal <@成员> [时长]\` | 手动封印（秒） |
| \`sentinel.unseal <@成员>\` | 解除封印 |
| \`sentinel.list\` | 查看封印列表 |`

export interface Config {
  keywords: string[]
  useRegExp: boolean
  ignoreCase: boolean
  isMentioned: boolean
  exemptUsers: string[]

  action: '仅封印无提示' | '仅提示' | '既封印又提示'
  timeLimit: number
  scope: '全局' | '分群'
  manageAuthority: number
  managers: string[]

  triggerMessage: string
  reminderMessage: string
  bannedMessage: string
  naughtyMemberMessage: string
  forgiveMessage: string
}

export const Config: Schema<Config> = Schema.intersect([
  Schema.object({
    keywords: Schema.array(String).role('table').default([])
      .description('过滤关键词，点击右侧 `添加行` 逐条添加。空行会被忽略。'),
    useRegExp: Schema.boolean().default(false)
      .description('把关键词当作正则表达式匹配。写错的正则会被跳过并在日志里提示。'),
    ignoreCase: Schema.boolean().default(true)
      .description('匹配时忽略英文大小写。'),
    isMentioned: Schema.boolean().default(false)
      .description('额外检测「@ 机器人」的普通消息，适用于通过 @ 触发机器人响应的情况。'),
    exemptUsers: Schema.array(String).role('table').default([])
      .description('豁免名单，填用户 ID，名单内的成员不会被检测或封印。'),
  }).description('关键词'),

  Schema.object({
    action: Schema.union(['仅封印无提示', '仅提示', '既封印又提示']).default('既封印又提示')
      .description('命中关键词后的动作。`仅提示` 只发提示不封印；`仅封印无提示` 静默封印，全程不发任何消息。'),
    timeLimit: Schema.natural().min(1).default(60)
      .description('封印时长（秒）。'),
    scope: Schema.union(['全局', '分群']).default('全局')
      .description('封印范围。`全局` 表示在任意群被封印后处处生效；`分群` 表示只在触发的那个群生效。'),
    manageAuthority: Schema.natural().min(1).max(5).default(2)
      .description('使用封印 / 解封 / 列表指令所需的权限等级。设为 1 表示所有人可用。注意：权限等级需要数据库支持，未安装数据库时该项不生效，请改用下面的管理员名单。'),
    managers: Schema.array(String).role('table').default([])
      .description('管理员名单，填用户 ID。名单非空时，只有名单内的成员可以使用封印 / 解封 / 列表指令；留空则只依赖上面的权限等级。'),
  }).description('封印'),

  Schema.object({
    triggerMessage: Schema.string().role('textarea', { rows: [1, 4] })
      .default('⚠️ 命中关键词，你已被封印 {remaining} 秒。')
      .description('命中关键词并被封印时的提示。'),
    reminderMessage: Schema.string().role('textarea', { rows: [1, 4] })
      .default('⚠️ 请不要使用这个关键词。')
      .description('命中关键词但不封印时的提示（动作为 `仅提示` 时使用）。'),
    bannedMessage: Schema.string().role('textarea', { rows: [1, 4] })
      .default('⚠️ 你还在封印中，剩余 {remaining} 秒。')
      .description('封印期间使用指令时的提示。'),
    naughtyMemberMessage: Schema.string().role('textarea', { rows: [1, 4] })
      .default('✅ 已封印该成员 {remaining} 秒。')
      .description('手动封印时的提示。'),
    forgiveMessage: Schema.string().role('textarea', { rows: [1, 4] })
      .default('✅ 已解除封印。')
      .description('手动解除封印时的提示。'),
  }).description('消息'),
])

interface Matcher {
  keyword: string
  test(text: string): boolean
}

export function apply(ctx: Context, config: Config) {
  const logger = ctx.logger(name)
  /** key -> 封印到期的时间戳（毫秒） */
  const seals = new Map<string, number>()
  const matchers = compile()

  function compile(): Matcher[] {
    const result: Matcher[] = []
    for (const raw of config.keywords ?? []) {
      // 空关键词会命中一切，必须跳过
      const keyword = raw?.trim()
      if (!keyword) continue
      if (config.useRegExp) {
        try {
          const regExp = new RegExp(keyword, config.ignoreCase ? 'i' : '')
          result.push({ keyword, test: (text) => regExp.test(text) })
        } catch (error) {
          logger.warn('跳过无效的正则关键词 %c：%s', keyword, error.message)
        }
      } else if (config.ignoreCase) {
        const lower = keyword.toLowerCase()
        result.push({ keyword, test: (text) => text.toLowerCase().includes(lower) })
      } else {
        result.push({ keyword, test: (text) => text.includes(keyword) })
      }
    }
    return result
  }

  function match(texts: string[]): string {
    for (const text of texts) {
      if (typeof text !== 'string' || !text) continue
      for (const matcher of matchers) {
        if (matcher.test(text)) return matcher.keyword
      }
    }
    return null
  }

  function keyOf(session: Session, userId = session.userId) {
    if (config.scope !== '分群') return userId
    return `${session.guildId || session.channelId}:${userId}`
  }

  /** 剩余封印秒数，未被封印或已过期时返回 0 */
  function remaining(key: string) {
    const expireAt = seals.get(key)
    if (!expireAt) return 0
    const left = expireAt - Date.now()
    if (left <= 0) {
      seals.delete(key)
      return 0
    }
    return Math.ceil(left / 1000)
  }

  function render(template: string, data: Record<string, string | number>) {
    return (template ?? '')
      .replace(/《剩余时间》/g, `${data.remaining ?? ''}`)
      .replace(/\{(\w+)}/g, (source, key) => key in data ? `${data[key]}` : source)
  }

  /** 返回 null 表示放行，返回字符串表示拦截并回复该内容（空串为静默拦截） */
  function inspect(session: Session, texts: string[]): string {
    if (config.exemptUsers?.includes(session.userId)) return null

    const key = keyOf(session)
    const left = remaining(key)
    if (left > 0) {
      if (config.action === '仅封印无提示') return ''
      return render(config.bannedMessage, { remaining: left, user: session.username })
    }

    const keyword = match(texts)
    if (!keyword) return null

    const data = { keyword, user: session.username, remaining: config.timeLimit }
    if (config.action === '仅提示') return render(config.reminderMessage, data)

    seals.set(key, Date.now() + config.timeLimit * 1000)
    if (config.action === '仅封印无提示') return ''
    return render(config.triggerMessage, data)
  }

  function mentionsSelf(session: Session) {
    const { stripped } = session
    if (stripped?.atSelf || stripped?.appel) return true
    const quoted = session.quote?.user?.id
    return !!quoted && quoted.toLowerCase() === session.bot.selfId.toLowerCase()
  }

  // 定期清理过期条目，避免长期运行时 Map 无限增长
  ctx.setInterval(() => {
    const now = Date.now()
    for (const [key, expireAt] of seals) {
      if (expireAt <= now) seals.delete(key)
    }
  }, Time.minute)

  // @ 机器人的普通消息：只有开启 isMentioned 时才检测
  ctx.middleware((session, next) => {
    if (!config.isMentioned || !mentionsSelf(session)) return next()
    // 走引用回复这条路径时 stripped 可能不存在，退回原始内容
    const result = inspect(session, [session.stripped?.content ?? session.content])
    return result === null ? next() : result
  }, true)

  // 指令：检测参数与选项值
  ctx.on('command/before-execute', (argv) => {
    // 被 @ 的消息已由上面的中间件处理，避免重复拦截
    if (config.isMentioned && mentionsSelf(argv.session)) return
    const texts = (argv.args ?? []).filter((arg) => typeof arg === 'string')
    for (const value of Object.values(argv.options ?? {})) {
      if (typeof value === 'string') texts.push(value)
    }
    return inspect(argv.session, texts)
  })

  /** 管理员名单非空时的守卫，返回字符串表示拒绝 */
  function forbid(session: Session) {
    if (!config.managers?.length) return null
    if (config.managers.includes(session.userId)) return null
    return '⚠️ 你没有权限使用这个指令。'
  }

  const cmd = ctx.command('sentinel', '指令关键词哨兵')
    .alias('commandKeywordSentinel')

  cmd.subcommand('.seal <target:user> [duration:posint]', '封印一位成员', { authority: config.manageAuthority })
    .alias('.你不乖哦')
    .usage('时长单位为秒，省略则使用配置里的默认封印时长。')
    .example('sentinel.seal @小明 300')
    .action(({ session }, target, duration) => {
      const denied = forbid(session)
      if (denied) return denied
      if (!target) return '⚠️ 请指定要封印的成员。例：sentinel.seal @小明'
      const userId = target.split(':')[1]
      seals.set(keyOf(session, userId), Date.now() + (duration || config.timeLimit) * 1000)
      return render(config.naughtyMemberMessage, { remaining: duration || config.timeLimit })
    })

  cmd.subcommand('.unseal <target:user>', '解除一位成员的封印', { authority: config.manageAuthority })
    .alias('.我原谅你啦')
    .action(({ session }, target) => {
      const denied = forbid(session)
      if (denied) return denied
      if (!target) return '⚠️ 请指定要解除封印的成员。例：sentinel.unseal @小明'
      seals.delete(keyOf(session, target.split(':')[1]))
      return render(config.forgiveMessage, {})
    })

  cmd.subcommand('.list', '查看当前被封印的成员', { authority: config.manageAuthority })
    .alias('.封印列表')
    .action(({ session }) => {
      const denied = forbid(session)
      if (denied) return denied
      const prefix = config.scope === '分群' ? `${session.guildId || session.channelId}:` : ''
      const lines: string[] = []
      for (const key of seals.keys()) {
        if (!key.startsWith(prefix)) continue
        const left = remaining(key)
        if (left > 0) lines.push(`${key.slice(prefix.length)}（剩余 ${left} 秒）`)
      }
      if (!lines.length) return '⚠️ 当前没有被封印的成员。'
      return `📋 当前被封印的成员：\n${lines.join('\n')}`
    })

}
