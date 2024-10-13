# koishi-plugin-command-keyword-sentinel

[![npm](https://img.shields.io/npm/v/koishi-plugin-command-keyword-sentinel?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-command-keyword-sentinel)

## 介绍

Koishi 的指令过滤插件。

当指令参数中包含预设的关键词，会触发预设的动作。

预设动作如下（可多选）：

1. 提示该用户不乖。
2. 封印用户使用指令的权限（限定时间内）。

## 指令

- `commandKeywordSentinel.你不乖哦 <@指定成员> [封印时长]`：封印（未设置权限等级）。
- `commandKeywordSentinel.我原谅你啦 <@指定成员>`：取消封印（未设置权限等级）。

## 致谢

- [Koishi](https://koishi.chat/)
- [melinoe](https://forum.koishi.xyz/t/topic/4578)：来源

## QQ 群

- 956758505

## License

MIT License © 2024

