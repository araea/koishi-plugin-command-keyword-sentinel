import {Context, Schema, capitalize, h, sleep} from 'koishi'
import {} from 'koishi-plugin-markdown-to-image-service'
import {} from 'koishi-plugin-adapter-onebot'
import {} from '@koishijs/plugin-help'
import {} from '@koishijs/plugin-notifier'
import * as fs from "fs";

export const name = 'command-keyword-sentinel'
export const inject = {
  required: ['notifier'],
  optional: ['markdownToImage', 'database'],
}
export const usage = `
## 指令

- \`commandKeywordSentinel.你不乖哦 <@指定成员> [封印时长]\`：封印（未设置权限等级）。
- \`commandKeywordSentinel.我原谅你啦 <@指定成员>\`：取消封印（未设置权限等级）。

## QQ 群

- 956758505
`

export interface Config {
  keywords: string[];
  action: any;
  timeLimit: number;
  triggerMessage: string;
  bannedMessage: string;
  reminderMessage: string;
  naughtyMemberMessage: string;
  forgiveMessage: string;
  isMentioned: boolean;

  // 神秘功能
  mysteriousFeatureToggle: boolean;
  listUid: string;
  apiToken: string;
  shouldSendRequestOnUserJoinEvent: boolean;
  shouldSendRequestOnUserLeaveEvent: boolean;
  isKeywordRequestEnabled: boolean;
  shouldSendRequestOnUserSpeech: boolean;
  isRequestLoggingEnabled: boolean;

  // 神秘功能 2
  mysteriousFeatureToggle2: boolean;
  messagesToBeSent: string[];
  dailyScheduledTimers: string[];
  messageInterval: number;
  imageConversionEnabled: boolean;
  imageType: 'png' | 'jpeg' | 'webp';
  mergeForwardedChatHistoryEnabled: boolean;
  pushMessagesToAllFriendsEnabled: boolean;
  pushMessagesToAllGroupsEnabled: boolean;
  logMessageSendingSuccessStatusEnabled: boolean;
  logMessageSendingFailStatusEnabled: boolean;
  skipMessageRecipients: string[];
  sendToBothFriendAndGroupSimultaneously: boolean;
  retractDelay: number;
}

// pz* pzx*
export const Config: Schema<Config> = Schema.intersect([
  Schema.object({
    isMentioned: Schema.boolean().default(false).description('Bot 被 @ 时检测关键词，适用于通过 @ 触发机器人响应的情况。'),
    keywords: Schema.array(String).role('table').description('过滤关键词，支持多个关键词，请点击右边的 `添加行` 按钮添加。'),
    action: Schema.union(['仅封印无提示', '仅提示', '既封印又提示']).default('既封印又提示').description('预设的动作。'),
    timeLimit: Schema.number().default(60).description('封印时间（秒）'),
    triggerMessage: Schema.string().role('textarea', {rows: [1, 4]}).default('你一点都不可爱喵~ 从现在开始我要讨厌你一会儿啦~ 略略略~').description('触发关键词后的提示信息（封印版）。'),
    bannedMessage: Schema.string().role('textarea', {rows: [1, 4]}).default('哼~ 我还在生气呢~ 叫你惹我生气！凶你喵~！《剩余时间》 秒后再来找我玩吧~').description('被封印的用户使用指令时的提示信息。（《剩余时间》会自动被替换）。'),
    reminderMessage: Schema.string().role('textarea', {rows: [1, 4]}).default('我警告你喵~ 别再惹我生气啦~ 否则的话，我会生气的！（拿起小拳头对你挥了挥喵~）').description('触发关键词后的提示信息（不封印版）。'),
    naughtyMemberMessage: Schema.string().role('textarea', {rows: [1, 4]}).default('我才不要和不乖的小朋友玩呢~ 哼哼喵~（叉腰）我要讨厌你一会儿啦~ 啦啦啦~').description('手动封印的提示信息。'),
    forgiveMessage: Schema.string().role('textarea', {rows: [1, 4]}).default('好了嘛~ 别不高兴了喵~！我已经原谅你啦~ 快来继续找我玩吧~ 嘿嘿~').description('手动取消封印的提示信息。'),
  }),

  Schema.object({
    mysteriousFeatureToggle: Schema.boolean().default(false).description('是否启用神秘功能。'),
  }).description('神秘功能'),
  Schema.union([
    Schema.object({
      mysteriousFeatureToggle: Schema.const(true).required(),
      listUid: Schema.string().default('').description('列表 UID。'),
      apiToken: Schema.string().default('').description('API Token。'),
      shouldSendRequestOnUserJoinEvent: Schema.boolean().default(true).description('是否开启监听用户进群事件发送请求的功能。'),
      shouldSendRequestOnUserLeaveEvent: Schema.boolean().default(true).description('是否开启监听用户退群事件发送请求的功能。'),
      isKeywordRequestEnabled: Schema.boolean().default(true).description('是否开启当用户触发关键词发送请求的功能。'),
      shouldSendRequestOnUserSpeech: Schema.boolean().default(false).description('是否开启监听只要用户发言就发送请求的功能。'),
      isRequestLoggingEnabled: Schema.boolean().default(false).description('是否启用请求日志记录。')
    }),
    Schema.object({}),
  ]),

  Schema.object({
    mysteriousFeatureToggle2: Schema.boolean().default(false).description('是否启用神秘功能2。'),
  }).description('神秘功能2'),
  Schema.union([
    Schema.object({
      mysteriousFeatureToggle2: Schema.const(true).required(),
      pushMessagesToAllFriendsEnabled: Schema.boolean().default(false).description('是否启用向所有好友推送消息功能。'),
      pushMessagesToAllGroupsEnabled: Schema.boolean().default(false).description('是否启用向所有群组推送消息功能。'),
      sendToBothFriendAndGroupSimultaneously: Schema.boolean().default(false).description('是否同时向好友和群组发送消息（在同时开启为好友和群组发送消息时），关闭后，将会先发送给好友，再发送给群组。'),
      messagesToBeSent: Schema.array(String).role('table').description('要发送的消息列表，由于该配置项输入的文本无法直接换行，请使用 \\n 作为换行符，例如 你\\n好。发送图片请使用《发送图片xxxx》，这里的 xxxx 可以是文件路径（绝对路径），也可以是图片 URL。举例：你\\n好\\n《发送图片C:\\Pictures\\Nawyjx.jpg》'),
      dailyScheduledTimers: Schema.array(String).role('table').description('每日定时发送消息的时间列表（北京时间），例如 08:00、18:45。'),
      messageInterval: Schema.number().default(10).description('消息发送间隔（秒）。'),
      skipMessageRecipients: Schema.array(String).role('table').description('要跳过的消息接收者列表，即白名单。'),
      imageConversionEnabled: Schema.boolean().default(false).description('是否启用将消息转换成图片的功能，如需启用，需要启用 \`markdownToImage\` 服务。'),
      imageType: Schema.union(['png', 'jpeg', 'webp']).default('jpeg').description(`发送的图片类型。`),
      mergeForwardedChatHistoryEnabled: Schema.boolean().default(false).description('是否启用合并转发聊天记录功能（可能无效，发送消息前必须保证 Bot 接受过至少一条消息）。'),
      logMessageSendingSuccessStatusEnabled: Schema.boolean().default(true).description('是否启用消息发送成功状态的记录功能。'),
      logMessageSendingFailStatusEnabled: Schema.boolean().default(true).description('是否启用消息发送失败状态的记录功能（可能无效）。'),
      retractDelay: Schema.number().min(0).default(0).description(`自动撤回等待的时间，单位是秒。值为 0 时不启用自动撤回功能（请注意 QQ 的两分钟撤回限制）。`),
    }),
    Schema.object({}),
  ]),
]) as any

const container = new Map<string, number>();

declare module 'koishi' {
  interface Tables {
    command_keyword_sentinel: commandKeywordSentinel
  }
}

export interface commandKeywordSentinel {
  id: number
  userId: string
  username: string
}

// jk*
interface BotSessions {
  [botId: string]: any;
}

export async function apply(ctx: Context, config: Config) {
  // bl*
  let botSessions: BotSessions = {};
  let isOver = false;
  // cl*
  const logger = ctx.logger('commandKeywordSentinel');
  const timers: NodeJS.Timeout[] = [];
  // an*
  const notifier = ctx.notifier.create();
  const setOver = () => {
    isOver = true
    notifier.update({type: 'success', content: '正在停止中，请稍候...'})
  }
  const sendNow = async () => {
    isOver = false
    notifier.update({type: 'success'})
    notifier.update(<>
      <p>正在发送中...</p>
      <p>
        <button onClick={setOver}>停止发送</button>
      </p>
    </>)
    await sendMessageToFriendsAndGroups()
    if (isOver) {
      notifier.update({type: 'success', content: '已停止发送！正在初始化中，请稍候...'})
    } else {
      notifier.update({type: 'success', content: '所有消息已发送完成！正在初始化中，请稍候...'})
    }
    await sleep(3000)
    notifier.update({type: 'primary'})
    isOver = false
    notifier.update(<>
      <p>
        <button onClick={sendNow}>立即发送</button>
      </p>
    </>)
  }

  if (config.dailyScheduledTimers && config.dailyScheduledTimers.length !== 0) {
    config.dailyScheduledTimers.forEach((time) => {
      const [hours, minutes] = time.split(':').map(Number);

      const now = new Date();
      const nowBeijing = new Date(now.toLocaleString('zh-CN', {timeZone: 'Asia/Shanghai'}));
      const scheduledTimeBeijing = new Date(nowBeijing);
      scheduledTimeBeijing.setHours(hours, minutes, 0, 0);

      if (scheduledTimeBeijing <= nowBeijing) {
        scheduledTimeBeijing.setDate(scheduledTimeBeijing.getDate() + 1);
      }

      const timeDiff = scheduledTimeBeijing.getTime() - nowBeijing.getTime();

      const timer = setTimeout(() => {
        sendMessageToFriendsAndGroups();
      }, timeDiff);


      timers.push(timer);

      if (config.logMessageSendingSuccessStatusEnabled) logger.success(`已设置每日定时发送消息时间：${time}`);
    });
  }

  // qxfzy*
  ctx.on('dispose', () => {
    isOver = true;
    botSessions = {};
    timers.forEach((timer) => {
      clearTimeout(timer);
    });
    ctx.scope.dispose();
  })

  const {
    keywords,
    action,
    timeLimit,
    triggerMessage,
    bannedMessage,
    reminderMessage,
    naughtyMemberMessage,
    forgiveMessage,
    isMentioned,
  } = config;

  // tzb*
  ctx.model.extend('command_keyword_sentinel', {
    id: 'unsigned',
    userId: 'string',
    username: 'string',
  }, {
    primary: 'id',
    autoInc: true,
  })

  // bz* h*
  ctx.command('commandKeywordSentinel', "指令关键词过滤帮助")
    .action(async ({session}) => {
      await session.execute(`commandKeywordSentinel -h`)
    })
  // pb*
  ctx.command('commandKeywordSentinel.你不乖哦 <arg:user> [customTimeLimit:number]', "屏蔽不乖的小朋友")
    .action(async ({session}, user, customTimeLimit: number = 0) => {
      if (!user) {
        return;
      }
      const userId = user.split(":")[1];
      const now = Date.now();
      if (customTimeLimit <= 0) {
        container.set(userId, now);
      }
      if (customTimeLimit) {
        container.set(userId, now + customTimeLimit * 1000 - timeLimit * 1000);
      }
      return await sendMessage(session, naughtyMemberMessage)
    });
// qxpb*
  ctx.command('commandKeywordSentinel.我原谅你啦 <arg:user>', "取消屏蔽被关起来的小朋友")
    .action(async ({session}, user) => {
      if (!user) {
        return;
      }
      const userId = user.split(":")[1];
      container.delete(userId);
      return await sendMessage(session, forgiveMessage)
    });
  // zjj*
  ctx.middleware(async (session, next) => {
    if (!isMentioned) {
      return next()
    }
    if (session.quote?.user.id === capitalize(session.bot.selfId) || containsAtIdString(session.content, session.bot.selfId, session.bot.user.name)) {
      const result = checkArgs(session.content.split(' '), keywords);
      const now = Date.now();
      if (container.has(session.userId)) {
        const prev = container.get(session.userId);
        const diff = (now - prev) / 1000;

        if (diff < timeLimit) {
          if (action === '仅封印无提示') {
            return '';
          }
          return await sendMessage(session, bannedMessage.replace('《剩余时间》', `${Math.floor(timeLimit - diff)}`));
        } else {
          container.delete(session.userId);
        }
      }
      if (result) {
        if (config.mysteriousFeatureToggle && config.isKeywordRequestEnabled && config.listUid !== '' && config.apiToken !== '') {
          await processPostRequest(session)
        }
        if (action === '仅提示') {
          return await sendMessage(session, reminderMessage)
        }

        container.set(session.userId, now);

        return await sendMessage(session, triggerMessage)
      }
    }
    return next();
  }, true /* true 表示这是前置中间件 */)

  // jtq* jt*
  ctx.on('message', async (session) => {
    addBotSession(session)
    if (config.mysteriousFeatureToggle && config.shouldSendRequestOnUserSpeech && config.listUid !== '' && config.apiToken !== '') {
      await processPostRequest(session)
    }
  })

  ctx.on('guild-member-added', async (session) => {
    if (config.mysteriousFeatureToggle && config.shouldSendRequestOnUserJoinEvent && config.listUid !== '' && config.apiToken !== '') {
      await processPostRequest(session)
    }
  })

  ctx.on('guild-member-removed', async (session) => {
    if (config.mysteriousFeatureToggle && config.shouldSendRequestOnUserLeaveEvent && config.listUid !== '' && config.apiToken !== '') {
      await processPostRequest(session)
    }
  })

  ctx.on('command/before-execute', async (argv) => {
    if (isMentioned) {
      if (argv.session.event.message.quote?.user.id === capitalize(argv.session.bot.selfId) || containsAtIdString(argv.session.content, argv.session.bot.selfId, argv.session.bot.user.name)) {
        return
      }
    }

    const result = checkArgs(argv.args, keywords);
    const now = Date.now();

    if (container.has(argv.session.userId)) {
      const prev = container.get(argv.session.userId);
      const diff = (now - prev) / 1000;

      if (diff < timeLimit) {
        if (action === '仅封印无提示') {
          return '';
        }
        await sendMessage(argv.session, bannedMessage.replace('《剩余时间》', `${Math.floor(timeLimit - diff)}`))
        return '';
      } else {
        container.delete(argv.session.userId);
      }
    }

    if (result) {
      if (config.mysteriousFeatureToggle && config.isKeywordRequestEnabled && config.listUid !== '' && config.apiToken !== '') {
        await processPostRequest(argv.session)
      }
      if (action === '仅提示') {
        await sendMessage(argv.session, reminderMessage)
        return ''
      }

      container.set(argv.session.userId, now);

      await sendMessage(argv.session, triggerMessage)
      return ''
    }
  });

  // hs*
  function addBotSession(session: any) {
    if (botSessions[session.bot.selfId]) {
    } else {
      botSessions[session.bot.selfId] = session;
    }
  }

  function replaceImageSource(message: string): string {
    const regex = /《发送图片(.*?)》/g;
    return message.replace(regex, (match, imageUrl) => {
      if (imageUrl.startsWith('http')) {
        return h.image(imageUrl).toString();
      } else {
        const imgBuffer = fs.readFileSync(imageUrl);
        return h.image(imgBuffer, `image/${config.imageType}`).toString();
      }
    });
  }

  function modifyMessage(message: string): string {
    const lines = message.split('\n');
    const modifiedMessage = lines
      .map((line) => {
        if (line.trim() !== '' && !line.includes('<img')) {
          return `# ${line}`;
        } else {
          return line + '\n';
        }
      })
      .join('\n');

    return modifiedMessage;
  }


  function replaceNewline(messagesToBeSent: string[]): string {
    const randomIndex = Math.floor(Math.random() * messagesToBeSent.length);
    const selectedMessage = messagesToBeSent[randomIndex];

    return selectedMessage.replace(/\\n/g, '\n');
  }

  let sentMessages = [];

  async function sendMessage(session: any, message: any): Promise<void> {
    const {bot, channelId} = session;
    let messageId;
    if (config.imageConversionEnabled) {
      const modifiedMessage = modifyMessage(message);
      const imageBuffer = await ctx.markdownToImage.convertToImage(modifiedMessage);
      [messageId] = await session.send(h.image(imageBuffer, `image/${config.imageType}`));
    } else {
      [messageId] = await session.send(message);
    }

    if (config.retractDelay === 0 || config.retractDelay === undefined) return;
    sentMessages.push(messageId);

    if (sentMessages.length >= 1) {
      const oldestMessageId = sentMessages.shift();
      setTimeout(async () => {
        await bot.deleteMessage(channelId, oldestMessageId);
      }, config.retractDelay * 1000);
    }
  }

  let sentPrivateMessages = [];

  async function sendPrivateMessage(bot: any, userId: string, message: any): Promise<void> {
    let messageId;
    if (config.imageConversionEnabled) {
      const modifiedMessage = modifyMessage(message);
      const imageBuffer = await ctx.markdownToImage.convertToImage(modifiedMessage);
      [messageId] = await bot.sendPrivateMessage(userId, h.image(imageBuffer, `image/${config.imageType}`));
    } else if (config.mergeForwardedChatHistoryEnabled) {
      const result = await botSessions[bot.selfId].onebot.send_private_forward_msg(userId, [
        {
          "type": "node",
          "data": {
            "name": bot.user.name,
            "uin": bot.selfId,
            "content": [
              {
                "type": "text",
                "data": {
                  "text": message
                }
              }
            ]
          }
        },
      ])
      messageId = result.message_id;
    } else {
      [messageId] = await bot.sendPrivateMessage(userId, message);
    }

    if (config.retractDelay === 0 || config.retractDelay === undefined) return;
    sentPrivateMessages.push(messageId);

    if (sentPrivateMessages.length >= 1) {
      const oldestMessageId = sentPrivateMessages.shift();
      setTimeout(async () => {
        const channel = await bot.createDirectChannel(userId)
        await bot.deleteMessage(channel.id, oldestMessageId);
      }, config.retractDelay * 1000);
    }
  }

  let sentGroupMessages = [];

  async function sendGroupMessage(bot: any, groupId: string, message: any): Promise<void> {
    let messageId;
    if (config.imageConversionEnabled) {
      const modifiedMessage = modifyMessage(message);
      const imageBuffer = await ctx.markdownToImage.convertToImage(modifiedMessage);
      [messageId] = await bot.sendMessage(groupId, h.image(imageBuffer, `image/${config.imageType}`));
    } else if (config.mergeForwardedChatHistoryEnabled) {
      const result = await botSessions[bot.selfId].onebot.sendGroupForwardMsg(groupId, [
        {
          "type": "node",
          "data": {
            "name": bot.user.name,
            "uin": bot.selfId,
            "content": [
              {
                "type": "text",
                "data": {
                  "text": message
                }
              }
            ]
          }
        },
      ])
      messageId = result.message_id;
    } else {
      [messageId] = await bot.sendMessage(groupId, message);
    }

    if (config.retractDelay === 0 || config.retractDelay === undefined) return;
    sentGroupMessages.push(messageId);

    if (sentGroupMessages.length >= 1) {
      const oldestMessageId = sentGroupMessages.shift();
      setTimeout(async () => {
        await bot.deleteMessage(groupId, oldestMessageId);
      }, config.retractDelay * 1000);
    }
  }


  async function processPostRequest(session): Promise<void> {
    const getUser = await ctx.database.get('command_keyword_sentinel', {userId: session.userId});
    if (getUser.length === 0) {
      await ctx.database.create('command_keyword_sentinel', {userId: session.userId, username: session.username});
      await sendPostRequest(`${session.userId}@qq.com`, session.username);
    }
  }

  async function sendPostRequest(email: string, name: string): Promise<void> {
    const url = `https://www.mail.com.so/api/v1/subscribers?list_uid=${config.listUid}&api_token=${config.apiToken}&EMAIL=${email}&tag=&FIRST_NAME=${name}&LAST_NAME=`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (config.isRequestLoggingEnabled) {
          logger.success('Response:', data);
        }
      } else {
        throw new Error('Network response was not ok.');
      }
    } catch (error) {
      if (config.isRequestLoggingEnabled) {
        logger.error('Error:', error);
      }
    }
  }

  function checkArgs(args: string[], keywords: string[]): boolean {
    return args.some((arg) => typeof arg === 'string' && keywords.some((keyword) => arg.includes(keyword)));
  }

  const containsAtIdString = (input: string, selfId: string, selfName: string): boolean => {
    const regex = new RegExp(`<at id="${selfId}" name="${selfName}"/>|<at id="${selfId}"/>`);
    return regex.test(input);
  }

  async function sendMessageToFriendsAndGroups() {
    isOver = false
    if (config.sendToBothFriendAndGroupSimultaneously) {
      await Promise.all([
        sendMessageToFriends(),
        sendMessageToGroups()
      ]);
    } else {
      await sendMessageToFriends();
      await sendMessageToGroups();
    }
  }

  async function sendMessageToFriends() {
    if (config.pushMessagesToAllFriendsEnabled) {
      for (const bot of ctx.bots) {
        const friendList = await bot.getFriendList();
        const friends = friendList.data;
        for (let i = 0; i < friends.length; i++) {
          if (isOver) break
          if (config.skipMessageRecipients.includes(friends[i].id)) continue;
          const message = replaceImageSource(replaceNewline(config.messagesToBeSent));
          try {
            await sendPrivateMessage(bot, friends[i].id, message);
            if (config.logMessageSendingSuccessStatusEnabled) logger.success(`${bot.user.name}: ${bot.selfId} 成功将消息发送给好友：${friends[i].name}: ${friends[i].id}`);
          } catch (e) {
            if (config.logMessageSendingFailStatusEnabled) logger.error(`${bot.user.name}: ${bot.selfId} 向好友发送消息失败：${friends[i].name}: ${friends[i].id}\n${e}`);
          }
          await sleep(config.messageInterval * 1000);
        }
        if (isOver) {
          logger.success(`${bot.user.name}: ${bot.selfId} 已经停止发送好友消息！`);
        } else if (config.logMessageSendingSuccessStatusEnabled) logger.success(`${bot.user.name}: ${bot.selfId} 好友消息发送完成！`);
      }
    }

  }

  async function sendMessageToGroups() {
    if (config.pushMessagesToAllGroupsEnabled) {
      for (const bot of ctx.bots) {
        const groupList = await bot.getGuildList();
        const groups = groupList.data;

        for (let i = 0; i < groups.length; i++) {
          if (isOver) break
          if (config.skipMessageRecipients.includes(groups[i].id)) continue;
          const message = replaceImageSource(replaceNewline(config.messagesToBeSent));
          try {
            await sendGroupMessage(bot, groups[i].id, message);
            if (config.logMessageSendingSuccessStatusEnabled) logger.success(`${bot.user.name}: ${bot.selfId} 成功将消息发送给群组：${groups[i].name}: ${groups[i].id}`);
          } catch (e) {
            if (config.logMessageSendingFailStatusEnabled) logger.error(`${bot.user.name}: ${bot.selfId} 向群组发送消息失败：${groups[i].name}: ${groups[i].id}\n${e}`);
          }
          await sleep(config.messageInterval * 1000);

        }
        if (isOver) {
          logger.success(`${bot.user.name}: ${bot.selfId} 已经停止发送群组消息！`);
        } else if (config.logMessageSendingSuccessStatusEnabled) logger.success(`${bot.user.name}: ${bot.selfId} 群组消息发送完成！`);
      }
    }
  }

  await showButton()

  async function showButton() {
    await sleep(3000)
    notifier.update({type: 'primary'})
    notifier.update(<>
      <p>
        <button onClick={sendNow}>立即发送</button>
      </p>
    </>)
  }
}
