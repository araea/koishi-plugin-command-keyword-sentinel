# koishi-plugin-command-keyword-sentinel

[![npm](https://img.shields.io/npm/v/koishi-plugin-command-keyword-sentinel?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-command-keyword-sentinel)

## 介绍

Koishi 的指令过滤插件。

当指令参数中包含预设的关键词，会触发预设的动作。

预设动作如下（可多选）：

1. 提示该用户不乖。
2. 封印用户使用指令的权限（限定时间内）。

## 指令

- `commandKeywordSentinel.你不乖哦 <arg:user> [customTimeLimit:number]`：屏蔽不乖的小朋友（未设置权限等级）。

  - `arg`：必选参数，@某个成员。
  - `customTimeLimit`：可选参数，单位是秒。默认为配置项中 timeLimit 的值。

- `commandKeywordSentinel.我原谅你啦 <arg:user>`：取消屏蔽被关起来的小朋友（未设置权限等级）。
  - `arg`：必选参数，@某个成员。

## 配置项

- `keywords`：关键词列表。
- `action`：预设的动作。
- `timeLimit`：封印时间（秒）。
- `triggerMessage`：触发关键词后的提示信息（封印版）。
- `reminderMessage`：触发关键词后的提示信息（不封印版）。
- `bannedMessage`：被封印的用户使用指令时的提示信息。
- `naughtyMemberMessage`：手动屏蔽不乖的成员的提示信息。
- `forgiveMessage`：手动取消屏蔽某个成员的提示信息。
- `isMentioned`：Bot 被 @ 时检测关键词，适用于通过 @ 触发机器人响应的情况。

## 致谢

- [Koishi](https://koishi.chat/)：优秀的机器人框架。
- [melinoe](https://forum.koishi.xyz/t/topic/4578)：插件的来源。

## QQ 群

- 956758505

## License

MIT License © 2024

