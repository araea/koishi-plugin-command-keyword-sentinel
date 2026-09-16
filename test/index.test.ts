import { Context } from 'koishi'
import mock from '@koishijs/plugin-mock'
import test from 'node:test'
import assert from 'node:assert/strict'
import * as sentinel from '../src'

async function setup(config: Partial<sentinel.Config> = {}) {
  const app = new Context()
  app.plugin(mock)
  app.command('echo <text:text>').action((_, text) => `echo:${text}`)
  app.command('note').option('memo', '-m <memo:string>').action(({ options }) => `note:${options.memo}`)
  app.plugin(sentinel, {
    keywords: ['坏蛋'],
    timeLimit: 60,
    manageAuthority: 1,
    triggerMessage: '封印你 {remaining} 秒，命中 {keyword}',
    reminderMessage: '警告你，命中 {keyword}',
    bannedMessage: '还剩 {remaining} 秒',
    naughtyMemberMessage: '手动封印',
    forgiveMessage: '原谅你了',
    ...config,
  })
  await app.start()
  return app
}

test('命中关键词：拦截指令并封印', async () => {
  const app = await setup()
  const client = app.mock.client('u1', 'g1')
  assert.deepEqual(await client.receive('echo 你是坏蛋'), ['封印你 60 秒，命中 坏蛋'])
  // 封印期间的其它指令同样被拦截
  const [reply] = await client.receive('echo 早上好')
  assert.match(reply, /^还剩 \d+ 秒$/)
  await app.stop()
})

test('未命中关键词：指令正常执行', async () => {
  const app = await setup()
  const client = app.mock.client('u2', 'g1')
  assert.deepEqual(await client.receive('echo 早上好'), ['echo:早上好'])
  await app.stop()
})

test('空关键词被忽略，不会命中所有消息', async () => {
  const app = await setup({ keywords: ['', '   '] })
  const client = app.mock.client('u3', 'g1')
  assert.deepEqual(await client.receive('echo 随便说点什么'), ['echo:随便说点什么'])
  await app.stop()
})

test('正则关键词', async () => {
  const app = await setup({ keywords: ['^坏.{0,2}蛋$'], useRegExp: true })
  const client = app.mock.client('u4', 'g1')
  assert.deepEqual(await client.receive('echo 坏透了蛋'), ['封印你 60 秒，命中 ^坏.{0,2}蛋$'])
  const other = app.mock.client('u5', 'g1')
  assert.deepEqual(await other.receive('echo 他是坏蛋吗'), ['echo:他是坏蛋吗'])
  await app.stop()
})

test('无效正则被跳过而不是让插件崩溃', async () => {
  const app = await setup({ keywords: ['([', '坏蛋'], useRegExp: true })
  const client = app.mock.client('u6', 'g1')
  assert.deepEqual(await client.receive('echo 你是坏蛋'), ['封印你 60 秒，命中 坏蛋'])
  await app.stop()
})

test('忽略大小写', async () => {
  const app = await setup({ keywords: ['BadGuy'], ignoreCase: true })
  const client = app.mock.client('u7', 'g1')
  assert.deepEqual(await client.receive('echo you badguy'), ['封印你 60 秒，命中 BadGuy'])
  await app.stop()
})

test('选项值也会被检测', async () => {
  const app = await setup()
  const client = app.mock.client('u8', 'g1')
  assert.deepEqual(await client.receive('note -m 坏蛋'), ['封印你 60 秒，命中 坏蛋'])
  await app.stop()
})

test('仅提示：不封印', async () => {
  const app = await setup({ action: '仅提示' })
  const client = app.mock.client('u9', 'g1')
  assert.deepEqual(await client.receive('echo 你是坏蛋'), ['警告你，命中 坏蛋'])
  assert.deepEqual(await client.receive('echo 早上好'), ['echo:早上好'])
  await app.stop()
})

test('仅封印无提示：全程静默', async () => {
  const app = await setup({ action: '仅封印无提示' })
  const client = app.mock.client('u10', 'g1')
  assert.deepEqual(await client.receive('echo 你是坏蛋'), [])
  assert.deepEqual(await client.receive('echo 早上好'), [])
  await app.stop()
})

test('豁免名单', async () => {
  const app = await setup({ exemptUsers: ['u11'] })
  const client = app.mock.client('u11', 'g1')
  assert.deepEqual(await client.receive('echo 你是坏蛋'), ['echo:你是坏蛋'])
  await app.stop()
})

test('封印到期后自动解除', async () => {
  const app = await setup({ timeLimit: 1 })
  const client = app.mock.client('u12', 'g1')
  assert.deepEqual(await client.receive('echo 你是坏蛋'), ['封印你 1 秒，命中 坏蛋'])
  await new Promise((resolve) => setTimeout(resolve, 1100))
  assert.deepEqual(await client.receive('echo 早上好'), ['echo:早上好'])
  await app.stop()
})

test('分频道封印互不影响，全局封印处处生效', async () => {
  const guild = await setup({ scope: '分频道' })
  assert.deepEqual(await guild.mock.client('u13', 'g1').receive('echo 你是坏蛋'), ['封印你 60 秒，命中 坏蛋'])
  assert.deepEqual(await guild.mock.client('u13', 'g2').receive('echo 早上好'), ['echo:早上好'])
  await guild.stop()

  const global = await setup({ scope: '全局' })
  assert.deepEqual(await global.mock.client('u14', 'g1').receive('echo 你是坏蛋'), ['封印你 60 秒，命中 坏蛋'])
  const [reply] = await global.mock.client('u14', 'g2').receive('echo 早上好')
  assert.match(reply, /^还剩 \d+ 秒$/)
  await global.stop()
})

test('手动封印 / 解封 / 列表', async () => {
  const app = await setup()
  const admin = app.mock.client('admin', 'g1')
  assert.deepEqual(await admin.receive('sentinel.seal @u15 300'), ['手动封印'])
  const [list] = await admin.receive('sentinel.list')
  assert.match(list, /u15（剩余 \d+ 秒）/)

  const victim = app.mock.client('u15', 'g1')
  const [banned] = await victim.receive('echo 早上好')
  assert.match(banned, /^还剩 \d+ 秒$/)

  assert.deepEqual(await admin.receive('sentinel.unseal @u15'), ['原谅你了'])
  assert.deepEqual(await victim.receive('echo 早上好'), ['echo:早上好'])
  assert.deepEqual(await admin.receive('sentinel.list'), [
    '📋 当前没有被封印的成员\n名单会在有成员被封印后出现在这里。\n发送「sentinel.seal @某人」封印一位成员。',
  ])
  await app.stop()
})

test('旧版中文指令名仍然可用', async () => {
  const app = await setup()
  const admin = app.mock.client('admin2', 'g1')
  assert.deepEqual(await admin.receive('sentinel.seal @u16 30'), ['手动封印'])
  assert.deepEqual(await admin.receive('sentinel.unseal @u16'), ['原谅你了'])
  await app.stop()
})

test('@ 机器人的普通消息（isMentioned）', async () => {
  const app = await setup({ isMentioned: true })
  const client = app.mock.client('u17', 'g1')
  assert.deepEqual(await client.receive(`<at id="${app.mock.bots[0].selfId}"/> 你是坏蛋`), ['封印你 60 秒，命中 坏蛋'])
  await app.stop()
})

test('管理员名单：名单外的人无法使用管理指令', async () => {
  const app = await setup({ managers: ['boss'] })
  const stranger = app.mock.client('nobody', 'g1')
  assert.deepEqual(await stranger.receive('sentinel.seal @u18'), [
    '⚠️ 权限不够\n这条指令只对管理员开放。',
  ])
  assert.deepEqual(await stranger.receive('sentinel.list'), [
    '⚠️ 权限不够\n这条指令只对管理员开放。',
  ])
  const boss = app.mock.client('boss', 'g1')
  assert.deepEqual(await boss.receive('sentinel.seal @u18'), ['手动封印'])
  await app.stop()
})

test('管理员名单为空时不做额外限制', async () => {
  const app = await setup({ managers: [] })
  const anyone = app.mock.client('anyone', 'g1')
  assert.deepEqual(await anyone.receive('sentinel.seal @u19'), ['手动封印'])
  await app.stop()
})
