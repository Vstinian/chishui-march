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

项目的 `.npmrc` 使用华为云 npm 镜像，避免本地默认下载源连接失败；不会修改个人的全局 npm 配置。依赖版本和完整性校验仍由 `package-lock.json` 固定。GitHub Actions 使用 npm 官方源。

若 `npm ci` 报 `ECONNRESET`，先确认 VPN／代理或当前网络能连接下载源，安装成功后再运行 `npm run dev`。安装失败时，后续出现“找不到 vite”是依赖尚未装齐。需要临时切换官方源时，可以运行 `npm ci --registry=https://registry.npmjs.org/`。

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

- 全屏报纸首页，点击后播放报纸展开、黑白转彩色、渐暗与中央字幕动画，配合成氛围 BGM；有静音与跳过开场。
- 五幕共 100 条第一人称独白和人物对白，5 名角色用 2D 剪影立绘占位。
- 每幕读完并完成小游戏才解锁下一幕；只可回看已解锁章节，复盘与尾声在五幕后开启。
- 五种小游戏分别为架桥、迷雾寻路、口令攀登、掩护救援、静默夜渡；支持点击与键盘操作。
- 进度自动保存在当前浏览器，刷新后首页可继续；结尾重新开始会清空旧进度。
- 五张史料卡可打开和关闭。所有出处目前标为“待核”，不得当作正式引文。
- 第五幕夜渡后进入独立的四渡全局复盘；地图只表达行动方向，不代表真实地理坐标。
- 桌面与竖屏手机共用一套页面；目前使用 CSS 场景占位画面，没有外部图片依赖。

## 文件与职责

| 位置 | 用途 | 主要维护人 |
| --- | --- | --- |
| `src/main.ts` | 章节状态、互动、史料卡、页面流程 | 技术负责人 |
| `src/game.ts` | 章节解锁、五种游戏规则、存档 | 技术负责人 |
| `src/audio.ts` | 合成氛围音与正式 BGM 接口 | 技术负责人 |
| `src/components/` | 共用章节、选择、史料卡的页面组件 | 技术负责人；视觉修改由技术美术同学交接 |
| `src/types.ts` | 幕、互动、素材、史料类型 | 技术负责人 |
| `src/data/acts.ts` | 五幕对白、游戏配置与史料索引；当前为待审试写稿 | 技术负责人，按内容组交付接入 |
| `src/data/narrative.ts` | 人物表、立绘路径、开场视频与音乐路径 | 技术负责人／技术美术 |
| `src/immersive.css` | 暗红米黄沉浸版、报纸动画、角色占位与响应式 | 技术美术同学 |
| `src/style.css` | 复盘地图与史料弹窗基础样式 | 技术美术同学 |
| `public/assets/` | 场景、人物、地图等正式素材 | 技术美术同学 |

每幕保留 `id`、`title`、`story`、`interaction`、`assets`、`sourceIds`、`nextAct` 字段，并新增 `dialogue` 逐句剧本。`story` 是简述；页面实际展示 `dialogue` 中的 `speaker`、`text`、`scene`。`interaction.kind` 为 `bridge`、`fog`、`climb`、`rescue`、`crossing`，`afterLine` 表示读完多少句后进入游戏。五幕正式交付规格与可复制模板见 [文书组剧本交付规格](docs/文书组剧本交付规格.md)。新增历史事实时，先填可定位的 `citation`，经审核后才改为 `verified`。

素材放在 `public/assets/`。场景在 `assets.scene` 填 `assets/act01-scene.webp` 这样的相对路径，角色在 `characters.*.portrait` 中填透明 PNG 路径。开场影像与音轨在 `opening.video`、`opening.bgm` 填写路径；当前均为 `null`，自动使用 CSS 动画、立绘剪影和合成氛围音乐。逐场景背景与分幕音乐将在正式素材交付后接入。交付时同步记录文件名、像素尺寸、版权或生成来源。

## 协作与验收

团队使用 `feat/game-engine` 和 `feat/visual-system` 两个分支。克隆后分别切换到自己的分支：

```bash
git switch feat/game-engine
# 技术美术同学改用：git switch feat/visual-system
```

`main` 只合入构建成功且可从首页走到结尾的版本。不要同时编辑同一文件；共同修改前先确定当天唯一编辑人。GitHub Actions 会检查核心流程、TypeScript 类型和 Vite 构建。

合入前运行 `npm run smoke` 和 `npm run build`，检查开场、章节锁、五种小游戏、复盘、静音和存档，并分别以 390×844 和 1366×768 查看。史实卡、日期、地名、四渡节点顺序须由史实负责人核对。正式剧本按 20～28 分钟目标编写，具体以试玩计时为准。

史实审核与最终文案尚未完成；当前占位版不等同于正式参赛内容。两位技术同学仍需在各自电脑实际启动项目并分别提交改动，确认团队环境一致。
