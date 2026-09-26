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

使用 `sentinel.list 2` 查看第二页；每页 10 位，页脚提供后续页入口。

## 许可证

可按 [Apache-2.0](LICENSE-APACHE) 或 [MIT](LICENSE-MIT) 使用。
