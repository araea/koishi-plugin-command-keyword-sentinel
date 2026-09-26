# 指令关键词哨兵

Koishi 插件：命中指定关键词时拦截指令，并按设定时长封印成员。

## 安装

```sh
yarn add koishi-plugin-command-keyword-sentinel
```

在 Koishi 中启用，并在配置中设置 `keywords` 和封印时长 `timeLimit`。

## 指令

| 指令 | 说明 |
| --- | --- |
| `sentinel` | 查看帮助 |
| `sentinel.seal <@成员> [时长]` | 手动封印，时长单位为秒 |
| `sentinel.unseal <@成员>` | 解除封印 |
| `sentinel.list` | 查看封印列表 |

## 许可证

可按 [Apache-2.0](LICENSE-APACHE) 或 [MIT](LICENSE-MIT) 使用。

## 显示与交互

有渲染图时只发图片，不再附带同内容的文字；图片生成失败时才退回文字。作品素材与感官测试的适用边界见 [设计系统](./DESIGN_SYSTEM.md)。

本次更新：主指令在 help 列表里补回描述；去掉「.显示」显示模式指令，有图只发图、出图失败才退回文字；多轮输入不再追加计时说明。

使用 `sentinel.list 2` 查看第二页；每页 10 位，页脚提供后续页入口。
