---
name: slime-level
description: >-
  Slime Fable level quality bar. Use when creating or refining a chapter:
  layout, collision, parallax, signs, hints, exit linger, or tide-style
  whole-painting worlds. Chapter 1 (forest) is the quality benchmark.
---

# 史莱姆寓言 · 关卡

**品质标杆是第一章，不是灰条，也不是糊掉的整画。**

新关先问用户：横版长关（森林做法）还是一座垂直石廊（潮汐做法）。无论哪条，都要有：

- 远近四层：`sky` / `far` / `middle` / `terrain`，视差倍率对齐森林（0 / 0.15 / 0.38 / 1）
- 出生、岔路、终点三块路牌，画在 `drawDetails`
- 区域 `hint()` 一句操作提示
- 通关区看得见；通关后「继续探索」+「下一关」

横版浮岛 / 叠层 / 水池的碰撞规则见同目录 `platform-patterns.md`。改第四关、第五关或之后的空岛关时必须遵守。

## 薄甲板（硬规则）

- 可走层是薄甲板（约 24–36px）。甲板用正侧视岛体条三段切填满碰撞（`paintSlab`），禁止俯视 / 等距岛图。神殿、风车、晶体、支撑石柱只做点状 dressing，不进 solid。
- 能从下方接近的台：`oneWay`，或薄到跳弧能绕过。禁止 `h>80` 的实心浮岛（底面就是天花板）。
- 水只画一次：`waters[]` 的矩形 = 绘制范围 = 能沉范围。禁止岛图自带一湖再叠一层水膜。
- 先锁跳跃再摆台：本关二段跳/攀爬不变；台间距 hop ≤200；短壁只贴岛沿，不贯穿整层。
- 教学四步：安全见过 → 第一次用 → 加难 → 和旧能力组合。
- 不对称、看得见下一步：岔路和终点要在画面里，不要靠小地图猜。

## 整画即世界（潮汐）

- 可走层必须是**世界像素 1:1** 的图。禁止把 1280×720 拉到 2560×1440。做大世界就四象限分生再拼接。
- `far` / `middle` 另生，只画纵深（光、剪影、沉船、水母），**不要可走石台**
- 碰撞从高清整画量；脚悬空就加大 `solid.y`
- 水池挖盆；瀑布用 `WaterfallSim`；石壁按岩体厚度给爬

## 布局先行（森林）

- 先写 `LevelLayout`，地面用程序苔藓 / 石块，远景用程序或慢视差图
- 不要拿一张带地板的概念图当 `terrain`

## 文件清单

- `src/content/chapterN/<id>.ts`
- `src/<id>-level.ts`
- `src/<id>-art.ts`
- `src/kit/<id>.ts`：把新地形 / 交互草 / 水池 / 摆件 / 纪念品 `register()` 进官方素材库，编辑器才会出现
- `src/catalog.ts`、`src/game.ts` / `src/main.ts` 分支
- `tests/play-systems.test.ts` 脚位与可达测试

## 不要动

见 `.cursor/skills/slime-play/SKILL.md`。

## 自检

脚贴地、水池能踩、从下能跳上叠层台、远景会慢移、路牌看得见、终点能逛
