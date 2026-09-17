# 计分 / 旅行记录 / Toy 适配报告

## 公共接口

- `src/run.ts`：`RunSession`、`ScoreTargets`、`RunResult`。采集 4000 / 事件 2000 / 技巧 1500 / 通关 500 / 速度 2000。
- `src/journal.ts`：独立 `slime-fable-journal`，`encodeCloud` / `mergeCloud` 遵守单值 1024 字节；`toyConsent` 不上云。
- `src/platform/toy.ts`：`ToyService` 映射 forest=1 … mirror=5，按 `runId` 去重，限流有限退避。

## 游戏接入

- 官方五关、非编辑器覆盖、非试玩才 `eligible`。
- 首次点「参与排行」写入 `toyConsent` 后才 `submit`。游客可读榜。
- 击杀按敌人 id 计入 feats（普通 1 / 精英 2 / 首领 5），召唤物不在初始 targets。纪念物权重 5。
- 结算展开徽章、未完成目标和图鉴；标题「旅行记录」可读纪念与未通关。
- 采集按 solids 顶边疏散，新增 dew 为 `bonus`，不挡森林开门。

## 测试

`npx vitest run tests/run.test.ts tests/journal.test.ts tests/toy.test.ts tests/ecology.test.ts`

## 限制

- 客户端校验，不宣称服务端防作弊。
- SDK 缺失时本地可玩，提交返回可展示错误。
