# koishi-plugin-command-keyword-sentinel

指令关键词过滤：命中关键词时拦截指令并暂时封印用户

## 安装

```sh
yarn add koishi-plugin-command-keyword-sentinel
```

在 Koishi 配置中启用。关键词填入 `keywords`，封印时长由 `timeLimit` 控制。

## 指令

| 指令 | 说明 |
| --- | --- |
| `sentinel` | 帮助 |
| `sentinel.seal <@成员> [时长]` | 手动封印，时长单位为秒 |
| `sentinel.unseal <@成员>` | 解除封印 |
| `sentinel.list` | 封印列表 |

## 许可证

可按 [Apache-2.0](LICENSE-APACHE) 或 [MIT](LICENSE-MIT) 使用。
