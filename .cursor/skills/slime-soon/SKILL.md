---
name: slime-soon
description: >-
  Generate or export Slime Fable characters, frame VFX, and scene art via
  Soonjy (极逸 / Soon). Use when the user mentions 极逸, Soon, soonjy, 特效库,
  atlasImg, SPI2, soon-2061, or wants a new character skeleton, combat
  effect, or Soonjy scene export for this repo.
---

# 史莱姆寓言 · 极逸素材

新素材按类型分流。关卡可走地面仍遵守 `slime-gen` / `slime-level`；极逸只补角色骨骼和帧特效。

- 角色骨骼 → 极逸角色页，导出后对照 `soon-2061`。
- 帧特效 → 极逸特效页，产物是 atlas png + 帧 JSON，不是 Spine。
- 关卡贴图 → Cursor GenerateImage，或极逸场景只当远景。

项目：https://main.soonjy.com/project/6a1e38326c305a492e9ea6a7  
公开库：https://games.soonjy.com/public/effectExamples/  
对照：`ref/soon-effects/examples/effects.json`、`ref/soon-effects/mine/*/prompt.txt`、同目录 `prompts.md`。

## 先入库，用户说「接上」再拷

不要把新图集直接丢进 `public/assets`（游戏包会膨胀）。先放 `ref/soon-effects/`。

| 类型 | 极逸产物 | 入库 | 接入游戏 |
|---|---|---|---|
| 帧特效 | `atlasImg` + 帧 JSON，不是 Spine | `ref/soon-effects/mine/` | 用户说接上 → `public/assets/vfx/` |
| 角色 | Spine `json` / `atlas` / `png` | 先对照 `soon-2061` | 用户说接上 → `public/assets/spine/` |
| 场景整画 | 远景图 | 关卡资源目录 | 只当 `far` / 整画，不当甲板 |

## 特效提示词

主体 + 运动 + 材质 +「黑色背景」。公开库几乎都这样写。底色规则见 `slime-gen`。

太短的提示（「剑气战斗特效」）能出图，但稳定度不如带材质和黑色背景的完整句。写新词先读 `prompts.md`。

## 角色

1. 先出统一 Q 版部件，再走骨骼动画。
2. 导出走已验证路径：item list API + TOS。解码：`node .cursor/skills/slime-soon/scripts/decode-spi2.mjs <in.bin2> <outDir>`。口令用环境变量 `SOON_SPI2_KEY`。脚本先看文件头 magic；不是 `SPI2` / `SPIN` 才 XOR 前 64 字节。`.dat` PNG 走这条 XOR；`bin2` 本身常已是 SPI2。
3. 骨架 JSON 可套模板 `100003`（与 `soon-2061` 相同的 36 条动画）。
4. 图集直通透明：`pma: false`。离屏 WebGL 再贴 2D（参考 `src/vfx/hive.ts` / `nangong.ts`），避免边缘光晕。

## 场景

可走地面仍走 `slime-level`（顶边对齐碰撞）。极逸地图只当远景/整画，不要当甲板。

## 接口（已登录页才能拉 TOS）

- 特效：`/soon/module-project/v2/item/list?projectId=6a1e38326c305a492e9ea6a7&size=50&pageType=special_effect`
- 字段：`userInput`、`resultContent.atlasImg`、`resultContent.atlasJson`、`resultContent.previewImg`
