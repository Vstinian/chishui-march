# 赤水行军图

五幕网页游戏的前端框架。技术方案为 Vite、TypeScript、普通 CSS，无后端和账号。当前是可通关的占位版；场景文字、史料卡、路线和视觉素材必须经团队审核后逐步替换。

## 本地运行

需要 Node.js 24 LTS 和 npm。

```bash
git clone https://github.com/Vstinian/chishui-march.git
cd chishui-march
npm ci
npm run dev
```

终端会显示本机访问地址，通常是 `http://localhost:5173/`。两台电脑各自在同一仓库运行上述命令。打包与预览：

```bash
npm run build
npm run preview
```

构建产物在 `dist/`，可部署到静态网站。`vite.config.ts` 已使用相对资源路径，方便放在子目录。

在依赖安装前，也可以用 Node.js 24 运行核心流程冒烟检查：

```bash
npm run smoke
```

## 当前可操作内容

- 首页进入五幕，完成每幕轻交互后前往下一幕，最终进入固定结尾。
- 章节目录可直达任一幕；选择只改变本幕反馈，不改变历史事件或结局。
- 五张史料卡可打开和关闭。所有出处目前标为“待核”，不得当作正式引文。
- 第五幕可点开四个渡河节点。图为交互示意，不代表真实地图坐标。
- 桌面与竖屏手机共用一套页面；目前使用 CSS 场景占位画面，没有外部图片依赖。

## 文件与职责

| 位置 | 用途 | 主要维护人 |
| --- | --- | --- |
| `src/main.ts` | 章节状态、互动、史料卡、页面流程 | 技术负责人 |
| `src/components/` | 共用章节、选择、史料卡的页面组件 | 技术负责人；视觉修改由技术美术同学交接 |
| `src/types.ts` | 幕、互动、素材、史料类型 | 技术负责人 |
| `src/data/acts.ts` | 五幕内容与史料索引；只录入已审定稿 | 技术负责人，按内容组交付接入 |
| `src/style.css` | 字体、色板、响应式和组件样式 | 技术美术同学 |
| `public/assets/` | 场景、人物、地图等正式素材 | 技术美术同学 |

每幕保留 `id`、`title`、`story`、`interaction`、`assets`、`sourceIds`、`nextAct` 七个生产接口字段。`interaction.kind` 为 `choice` 或 `reveal`；所有选项都只写局部反馈。`sourceCards` 使用同一文件中的唯一 ID。新增历史事实时，先填可定位的 `citation`，经审核后才改为 `verified`。

素材建议用 `act01-scene.webp`、`act01-character.png` 等名称，按 `act01` 至 `act05` 编号，放到 `public/assets/`。在 `assets.scene` 等字段填 `assets/act01-scene.webp` 这样的相对路径。交付素材时同步记录文件名、像素尺寸、版权或生成来源。当前资源字段为 `null`，页面自动使用 CSS 占位画面，不会出现破图。

## 协作与验收

团队使用 `feat/game-engine` 和 `feat/visual-system` 两个分支。克隆后分别切换到自己的分支：

```bash
git switch feat/game-engine
# 技术美术同学改用：git switch feat/visual-system
```

`main` 只合入构建成功且可从首页走到结尾的版本。不要同时编辑同一文件；共同修改前先确定当天唯一编辑人。GitHub Actions 会检查核心流程、TypeScript 类型和 Vite 构建。

合入前运行 `npm run build`，检查五幕导航、史料卡、素材引用，并分别在浏览器开发者工具中以 390×844 和 1366×768 查看。史实卡、日期、地名、四渡节点顺序须由史实负责人核对。待正式音效接入后再增加静音控制。

史实审核与最终文案尚未完成；当前占位版不等同于正式参赛内容。两位技术同学仍需在各自电脑实际启动项目并分别提交改动，确认团队环境一致。
