# 指令关键词哨兵

Koishi 插件：命中指定关键词时拦截指令并按设定时长封印成员

[![GitHub](https://img.shields.io/badge/GitHub-araea%2Fkoishi--plugin--command--keyword--sentinel-181717?logo=github&logoColor=white)](https://github.com/araea/koishi-plugin-command-keyword-sentinel)
[![npm](https://img.shields.io/npm/v/koishi-plugin-command-keyword-sentinel?logo=npm&logoColor=white&color=CB3837)](https://www.npmjs.com/package/koishi-plugin-command-keyword-sentinel)

## 安装

```sh
npm i koishi-plugin-command-keyword-sentinel
```

启用插件，并在配置中设置关键词 `keywords` 与封印时长 `timeLimit`。

## 快速使用

命中 `keywords` 后按 `action` 拦截指令并封印成员，封印时长由 `timeLimit` 控制。

| 指令 | 说明 |
| --- | --- |
| `sentinel` | 查看帮助 |
| `sentinel.seal <@成员> [时长]` | 手动封印，时长单位为秒 |
| `sentinel.unseal <@成员>` | 解除封印 |
| `sentinel.list [page]` | 查看封印列表，每页 10 位 |

`sentinel.list 2` 查看第二页，页脚提供后续页入口。

## 配置

| 配置项 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `keywords` | string[] | `[]` | 过滤关键词，逐条添加，空行忽略 |
| `useRegExp` | boolean | `false` | 把关键词当作正则匹配，写错的正则会被跳过并在日志提示 |
| `ignoreCase` | boolean | `true` | 匹配时忽略英文大小写 |
| `isMentioned` | boolean | `false` | 额外检测 @ 机器人的普通消息 |
| `exemptUsers` | string[] | `[]` | 豁免名单，填用户 ID |
| `action` | `仅封印无提示` / `仅提示` / `既封印又提示` | `既封印又提示` | 命中后的动作 |
| `timeLimit` | number | `60` | 封印时长（秒），最小 1 |
| `scope` | `全局` / `分频道` | `全局` | 封印范围，`分频道` 只限封印它的频道 |
| `manageAuthority` | number | `2` | 管理指令所需权限等级（1–5），需数据库支持 |
| `managers` | string[] | `[]` | 管理员名单，填用户 ID；非空时仅名单内成员可用管理指令 |
| `triggerMessage` | string | `⚠️ 命中关键词，你已被封印 {remaining} 秒。` | 命中并被封印时的提示 |
| `reminderMessage` | string | `⚠️ 这个关键词已被禁用。` | 命中但不封印时的提示 |
| `bannedMessage` | string | `⏳ 你还在封印中，剩余 {remaining} 秒。` | 封印期间使用指令的提示 |
| `naughtyMemberMessage` | string | `✅ 已封印该成员 {remaining} 秒。` | 手动封印时的提示 |
| `forgiveMessage` | string | `✅ 已解除封印。` | 手动解除封印时的提示 |

## 限制 / 风险

封印状态仅保存在内存，插件重载后清空。

权限等级 `manageAuthority` 需要 `database` 服务；未安装时该项不生效，可改用 `managers` 名单控制管理指令。

## 链接

- [设计系统](DESIGN_SYSTEM.md)
- [MIT](LICENSE-MIT) / [Apache-2.0](LICENSE-APACHE)
