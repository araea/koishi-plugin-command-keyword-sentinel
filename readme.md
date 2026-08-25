koishi-plugin-command-keyword-sentinel
========================

[<img alt="github" src="https://img.shields.io/badge/github-araea/command_keyword_sentinel-8da0cb?style=for-the-badge&labelColor=555555&logo=github" height="20">](https://github.com/araea/koishi-plugin-command-keyword-sentinel)
[<img alt="npm" src="https://img.shields.io/npm/v/koishi-plugin-command-keyword-sentinel.svg?style=for-the-badge&color=fc8d62&logo=npm" height="20">](https://www.npmjs.com/package/koishi-plugin-command-keyword-sentinel)

Koishi 的指令关键词哨兵插件。

当用户的指令参数里出现预设关键词时，插件会拦截这条指令，发出提示，并把该用户「封印」一段时间——封印期间他的所有指令都会被挡下。

开箱即用：不需要数据库，不需要任何前置服务，装上填几个关键词就能工作。

## 快速开始

1. 在插件配置的 `keywords` 里逐行填入要过滤的关键词。
2. 按需调整 `action`（动作）和 `timeLimit`（封印时长），其余保持默认即可。

## 指令

| 指令 | 说明 |
| --- | --- |
| `sentinel` | 查看帮助 |
| `sentinel.seal <@成员> [时长]` | 手动封印，时长单位为秒，省略则使用配置里的默认时长 |
| `sentinel.unseal <@成员>` | 解除封印 |
| `sentinel.list` | 查看当前被封印的成员及剩余时间 |

旧版指令名 `commandKeywordSentinel.你不乖哦` / `commandKeywordSentinel.我原谅你啦` 仍然可用。

### 谁能使用这些指令

管理指令默认要求 **2 级权限**（配置项 `manageAuthority`）。

⚠️ 权限等级依赖数据库，**没有安装数据库时这项限制不会生效**，任何人都能封印任何人。这种情况下请在 `managers` 里填上管理员的用户 ID，只有名单内的人才能使用管理指令。装了数据库的话，用 `admin` 插件执行 `authorize -u @某人 2` 授权即可。

## 配置

### 关键词

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `keywords` | `[]` | 过滤关键词，逐行添加，空行会被忽略 |
| `useRegExp` | `false` | 把关键词当作正则表达式匹配，写错的正则会被跳过并在日志里提示 |
| `ignoreCase` | `true` | 匹配时忽略英文大小写 |
| `isMentioned` | `false` | 额外检测「@ 机器人」的普通消息 |
| `exemptUsers` | `[]` | 豁免名单，名单内的成员不会被检测或封印 |

### 封印

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `action` | `既封印又提示` | `仅提示` 只发提示不封印；`仅封印无提示` 静默封印，全程不发消息 |
| `timeLimit` | `60` | 封印时长（秒） |
| `scope` | `全局` | `全局` 表示在任意群被封印后处处生效；`分群` 表示只在触发的那个群生效 |
| `manageAuthority` | `2` | 使用管理指令所需的权限等级 |
| `managers` | `[]` | 管理员名单，非空时只有名单内的成员可以使用管理指令 |

### 消息

五条提示文案均可自定义，支持以下占位符：

| 占位符 | 含义 |
| --- | --- |
| `{remaining}` | 剩余封印秒数 |
| `{keyword}` | 命中的关键词 |
| `{user}` | 用户名 |

旧写法 `《剩余时间》` 等价于 `{remaining}`，仍然可用。

## 从 0.0.2 升级

1.0.0 移除了两项与关键词过滤无关的功能：

- **「神秘功能」**：把群成员的 QQ 号拼成邮箱地址，上报到第三方邮件列表服务 `mail.com.so`。
- **「神秘功能2」**：向机器人的全部好友和全部群定时群发消息，并可自动撤回。

同时移除了它们带来的负担：插件不再需要 `notifier`、`database`、`markdownToImage` 服务，也不再依赖 `@satorijs/element` 与 OneBot 适配器。

其它变化：

- `仅封印无提示` 现在真的不发任何消息（0.0.2 在触发时仍会发一条提示，与选项名矛盾）。
- 管理指令新增权限限制，0.0.2 中任何人都可以封印任何人。
- 修复空关键词会命中所有消息的问题。
- 修复封印记录在插件重载后残留、且从不清理的问题。
- 指令选项的值现在也会被检测。
- 核心配置项名称保持不变，原有配置可直接沿用。

## 致谢

- [Koishi](https://koishi.chat/)
- [melinoe](https://forum.koishi.xyz/t/topic/4578)：来源

## QQ 群

- 956758505

<br>

#### License

<sup>
Licensed under either of <a href="LICENSE-APACHE">Apache License, Version
2.0</a> or <a href="LICENSE-MIT">MIT license</a> at your option.
</sup>

<br>

<sub>
Unless you explicitly state otherwise, any contribution intentionally submitted
for inclusion in this crate by you, as defined in the Apache-2.0 license, shall
be dual licensed as above, without any additional terms or conditions.
</sub>
