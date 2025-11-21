koishi-plugin-command-keyword-sentinel
========================

[<img alt="github" src="https://img.shields.io/badge/github-araea/command_keyword_sentinel-8da0cb?style=for-the-badge&labelColor=555555&logo=github" height="20">](https://github.com/araea/koishi-plugin-command-keyword-sentinel)
[<img alt="npm" src="https://img.shields.io/npm/v/koishi-plugin-command-keyword-sentinel.svg?style=for-the-badge&color=fc8d62&logo=npm" height="20">](https://www.npmjs.com/package/koishi-plugin-command-keyword-sentinel)

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
