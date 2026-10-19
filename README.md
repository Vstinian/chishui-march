# 赤水行军图

五幕网页游戏的前端框架。技术方案为 Vite、TypeScript、普通 CSS，无后端和账号。当前是可通关的占位版；场景文字、史料卡、路线和视觉素材必须经团队审核后逐步替换。

最新修订已接入 128 段正文、249 个字幕框、六处静态背景叠化转场及内心对白。详见 [修订补充稿接入说明](docs/修订补充稿接入说明.md) 和 [内容统计](docs/修订补充稿内容统计.md)。

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

直接分享给玩家：按 [发布与分享](docs/发布与分享.md) 开启 GitHub Pages。`.github/workflows/deploy.yml` 会在代码合入 `main` 后自动检查、构建与发布，玩家用浏览器打开正式链接即可游玩。

在依赖安装前，也可以用 Node.js 24 运行核心流程冒烟检查：

```bash
npm run smoke
```

## 当前可操作内容

- 全屏报纸首页，20 秒开场结束停在末帧，点击继续进入正文；减少动态模式停留 6 秒。有静音、跳过动画与合成氛围 BGM。
- 集合版与修订补充稿合计 128 段独白和对白（28 / 30 / 23 / 23 / 24），拆为 249 个字幕框；5 名主要角色及 1 名伤员用剪影占位。对话时邓青山在左、其他人在右，旁白显示全屏背景。
- 正文铺满浏览器窗口，透明顶栏使用冲锋号声音图标与三横杠目录图标。每幕进入时约 3.8 秒暗场显示中央幕名，正文隐藏幕标题、页码及底部按钮。
- 对白以打字机效果出现；点击对话框任意处先补全当前句，完整显示后再次点击推进。空格 / Enter 同样可用；打开目录暂停打字，减少动态模式直接显示整句。
- 每幕读完并完成小游戏才解锁下一幕；只可回看已解锁章节，复盘与尾声在五幕后开启。
- 五种小游戏分别为架桥、迷雾寻路、口令攀登、掩护救援、静默夜渡；支持点击与键盘操作。
- 进度自动保存在当前浏览器，刷新后首页可继续；结尾重新开始会清空旧进度。
- 史料札记在每幕正文结束后单独展示，点击继续行军再进入下一幕；支持刷新后续读札记。所有出处目前标为“待核”，不得当作正式引文。
- 第五幕夜渡后进入四个叙事节点的全局复盘，再阅读五段尾声和指导员的信；地图单独标记四次渡河，只表达行动方向。
- 桌面与竖屏手机共用一套页面；目前使用 CSS 场景占位画面，没有外部图片依赖。

## 文件与职责

| 位置 | 用途 | 主要维护人 |
| --- | --- | --- |
| `src/main.ts` | 章节状态、互动、史料卡、页面流程 | 技术负责人 |
| `src/game.ts` | 章节解锁、五种游戏规则、存档 | 技术负责人 |
| `src/audio.ts` | 合成氛围音与正式 BGM 接口 | 技术负责人 |
| `src/typewriter.ts` | 逐字显示、点击补全、暂停及重绑 DOM 后保留进度 | 技术负责人 |
| `src/components/ActEndView.ts` | 幕末史料札记与继续行军入口 | 技术负责人 |
| `src/components/Icons.ts` | 冲锋号和目录 SVG 图标 | 技术美术同学 |
| `src/components/` | 共用章节、选择、史料卡的页面组件 | 技术负责人；视觉修改由技术美术同学交接 |
| `src/types.ts` | 幕、互动、素材、史料类型 | 技术负责人 |
| `src/data/script.ts` | 修订后 128 段正文、字幕断行及分镜元数据，保留原 ID | 技术负责人，按内容组交付接入 |
| `src/data/acts.ts` | 五幕组合、小游戏配置与史料索引 | 技术负责人 |
| `src/data/narrative.ts` | 人物表、表情和场景资源、开场、尾声与信件 | 技术负责人／技术美术 |
| `src/immersive.css` | 暗红米黄沉浸版、报纸动画、角色占位与响应式 | 技术美术同学 |
| `src/style.css` | 复盘地图与史料弹窗基础样式 | 技术美术同学 |
| `public/assets/` | 场景、人物、地图等正式素材 | 技术美术同学 |

每幕保留 `id`、`title`、`story`、`interaction`、`assets`、`sourceIds`、`nextAct` 字段，并新增 `dialogue` 逐句剧本。`story` 是简述；页面实际展示 `dialogue` 中的 `speaker`、`text`、`scene`。`interaction.kind` 为 `bridge`、`fog`、`climb`、`rescue`、`crossing`，`afterLine` 表示读完多少句后进入游戏。五幕正式交付规格与可复制模板见 [文书组剧本交付规格](docs/文书组剧本交付规格.md)。新增历史事实时，先填可定位的 `citation`，经审核后才改为 `verified`。

素材放在 `public/assets/`。逐场景背景在 `scenes` 中填 `assets/scenes/act01-bg01.webp` 这样的相对路径；角色在 `characters.*.expressions` 中按表情填透明 PNG 路径，`portrait` 为通用底图。开篇报纸与四张山水帧已接入 `public/assets/opening/`，原始 PNG 保存在 `art-source/opening/`，路径配置在 `openingArtwork`；映射与动画见 [开篇美术接入说明](docs/开篇美术接入说明.md)。开场视频与音轨仍可在 `opening.video`、`opening.bgm` 填路径；当前未交付视频时使用五张美术图的 CSS 动画，其他场景继续使用立绘剪影和合成氛围音乐。逐句镜头、环境音与音效目前保留为元数据，尚未执行全部分镜调度。交付时同步记录文件名、尺寸、版权或生成来源。

技术组补充说明已同步：当前 50 段旁白（原稿 46 段 + 修订稿新增 4 段）的 `performance` 使用画外音／环境声口径，完整正文仍为 128 段、249 框。录音说明见 [旁白配音交付表](docs/旁白配音交付表.md)；13 张背景的中英提示词、负面词、手机安全区与当前段落映射见 [场景背景图交付](docs/场景背景图交付.md)。正片 13 张背景已接入 `public/assets/scenes/`，`scenes` 配置路径，`sceneFraming` 配置手机取景位置；原图在 `art-source/scenes/originals/`，接入记录见 [场景美术接入说明](docs/场景美术接入说明.md)。角色立绘与正式配音仍待交付。原文转录与适配记录存放于 `art-source/scenes/technical-supplement.json`。

集合版最初的互动插入位置、缺号和错误后继 ID 处理、待核文案与美术接法，见 [集合版剧本接入说明](docs/集合版剧本接入说明.md)。当前存档在原 v3 键内保存 version 5 数据，以段落 ID 和框号兼容新增、重排与刷新续读；v3、v4 的下标与旧攀登进度自动迁移。重看与续读、史料札记核对、六段攀登规则见 [本轮修改记录](docs/本轮修改记录.md)。

## 协作与验收

团队使用 `feat/game-engine` 和 `feat/visual-system` 两个分支。克隆后分别切换到自己的分支：

```bash
git switch feat/game-engine
# 技术美术同学改用：git switch feat/visual-system
```

`main` 只合入构建成功且可从首页走到结尾的版本。不要同时编辑同一文件；共同修改前先确定当天唯一编辑人。GitHub Actions 会检查核心流程、TypeScript 类型和 Vite 构建。

合入前运行 `npm run smoke` 和 `npm run build`，检查开场、章节锁、五种小游戏、复盘、静音和存档，并分别以 390×844 和 1366×768 查看。史实卡、日期、地名、四渡节点顺序须由史实负责人核对。正式剧本按 20～28 分钟目标编写，具体以试玩计时为准。

史实审核与最终文案尚未完成；当前占位版不等同于正式参赛内容。两位技术同学仍需在各自电脑实际启动项目并分别提交改动，确认团队环境一致。
