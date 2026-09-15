---
name: slime-gen
description: >-
  Generate and place Slime Fable art. Use when generating, regenerating, or
  keying game art (GenerateImage, sprites, parallax, props, platforms), or
  when making UI slices for menus, level select, title screens, backgrounds,
  or thumbnails.
---

# 史莱姆寓言 · 生图

## 流程

1. 先读用户参考图（若有），再 `GenerateImage`。整画用 16:9，精灵用 1:1。需要透明时提示写 **PNG 透明底**。有参考就传 `reference_image_paths`。
2. 工具返回的绝对路径用 `Copy-Item` 拷到 `public/assets/<ui|tide|forest|honey|wind|mirror>/`。
3. `Read` 读图，量出摆放坐标，写进代码。
4. 浏览器截图核对：标签压在正确层、不挡主路/瀑布、不与面板重叠。

## UI 切图

- 菜单 / 选关背景：16:9 整画 JPG。
- **画面里不要任何文字、序号、按钮、HUD。** 标签和卡片一律 HTML + CSS 叠上去。
- 缩略图优先用 CSS `background-position` 裁整画，构图糊了再另生。
- 只有需要抠边的素材才用 PNG。

## 分辨率

- 整画 / UI 背景：1280×720。
- 精灵 / 吉祥物：≤1024。
- 关卡可走层：世界像素 1:1，禁止把 1280×720 拉到大世界。

## 禁止的背景

不要玫红、纯绿、纯紫或任何色度键底。不要在提示里写 `#FF00FF`、chroma key、magenta backdrop。品红碎图不要进关卡资源目录。

带海水 / 天空的整图只能当远景（`far` / 整画），禁止当可走甲板。可走结构的画布顶边必须等于碰撞 `solid.y`，左右等于 `x` / `x+w`。

## 空岛条（四五关做法）

- 提示词写死：`strict orthographic side elevation`、`top surface not visible`、`top edge one perfectly straight horizontal line`、`pure flat white background`。带一点俯视顶面就重生。
- 宽岛 16:9 一条、薄台 16:9 一条；地标（门、殿、塔、祭坛）1:1，底边写 `flat horizontal ground line`；石柱 9:16。
- 纯白底用 `kit/slab.ts` 的 `keyWhite` 抠（只从边缘泛洪），浅色石头不会被误抠；不要对这类图用 `punchHoles`。
- 参考图传用户概念图，风格才对得上。
