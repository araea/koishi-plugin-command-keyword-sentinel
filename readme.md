koishi-plugin-command-keyword-sentinel
======================================

[<img alt="github" src="https://img.shields.io/badge/github-araea/koishi__plugin__command__keyword__sentinel-8da0cb?style=for-the-badge&labelColor=555555&logo=github" height="20">](https://github.com/araea/koishi-plugin-command-keyword-sentinel)
[<img alt="npm" src="https://img.shields.io/npm/v/koishi-plugin-command-keyword-sentinel.svg?style=for-the-badge&color=fc8d62&logo=npm" height="20">](https://www.npmjs.com/package/koishi-plugin-command-keyword-sentinel)

Koishi 的指令关键词过滤插件。

## 使用

在 `keywords` 中填入关键词。命中时拦截指令并封印用户，时长由 `timeLimit` 控制。

## 指令

| 指令 | 说明 |
| --- | --- |
| `sentinel` | 查看帮助 |
| `sentinel.seal <@成员> [时长]` | 手动封印（秒） |
| `sentinel.unseal <@成员>` | 解除封印 |
| `sentinel.list` | 查看封印列表 |

## QQ 群

956758505

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
