---
name: slime-play
description: >-
  Slime Fable project workflow. Use when editing this Slime repo: combat,
  HUD, forest/honey layout, slime art, play features, UI, menus, level
  select, HUD styles, or style.css. Follows the project's verification
  split: the user owns playtesting.
---

# 史莱姆寓言

## 验证分工

测试、视觉验证的工作交给我，只有涉及美术和场景布局的，需要你检查有没有错位重叠，其他的战斗和跑图不需要你测。

- 不要用浏览器去打怪、连招、跑图、验证手感。
- 改了地形、装饰、HUD 锚点、小地图、植物/水体摆放时：对照关卡坐标，检查重叠、穿帮、挡住主路。
- 菜单 / 选关 / HUD 改版：用浏览器截图核对布局重叠与可读性，手感和流程交用户。
- 不要为了验证战斗或跑图而改键、传送、开调试入口。

## 不要动

- 计划文件、蜜穴通关流程、蜜穴 WFC。
- 手柄脸键：A 跳、B 挤、X 合、Y 分。近战/远程只用 LT/RT。
- 补弹只认森林 `level.water` + `features.ammoRefill`。
- 森林 `inForestWater()`。
- 不要为了对齐第三章去改第一章路牌和视差。

## 代码约定

- 紧凑 TS（无多余空格）、单行 CSS。尺寸一律 `calc(Npx * var(--ui-scale))`。
- DOM 用 `el()`，资源用 `asset()`，叠层用 `showOverlay()`。
- 进度：`progress={...progress,x}` 后 `persist()`，不要原地改字段。
- 选关按钮用 `[data-id]`，`mouseenter` / `focus` 预览，`click` 进入。
- 关卡/精灵出图走 `.cursor/skills/slime-gen/SKILL.md`。极逸角色/特效走 `.cursor/skills/slime-soon/SKILL.md`。
- 做新关或改关卡结构先读 `.cursor/skills/slime-level/SKILL.md`。品质标杆是第一章。叠层浮岛和水池同时遵守 `platform-patterns.md`。

## 验证命令

- 开发：`npm run dev`（`127.0.0.1:5173`）
- 类型：`npx tsc --noEmit`
- 单测：`npx vitest run`
- 临时脚本 / 截图放系统临时目录，不进仓库。

## 实现时

- 用现有模块：`combat/`、`face/mood.ts`、`minimap.ts`、`ForestArt.gust`、`WaterSimulation.impact`。
- 表情走 `MoodDirector`，不要在 `slime-view` 里写死新状态。
- 通知进 `notices` 队列，不要互相覆盖。
