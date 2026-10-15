import { readFileSync, writeFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { runInNewContext } from 'node:vm';

const read = file => stripTypeScriptTypes(readFileSync(new URL(`../src/${file}.ts`, import.meta.url), 'utf8').replace(/^import .*;\s*$/gm, '').replace(/^export /gm, ''), { mode: 'strip' });
const data = runInNewContext(`${['data/script', 'data/narrative', 'data/transitions', 'data/legacyScript', 'data/recap'].map(read).join('\n')}\n({script, opening, ending, storyTransitions, legacyDialogueIds, recapSteps})`);
const count = text => ({ characters: Array.from(text.replace(/\s|（内心）/gu, '')).length, han: (text.replaceAll('（内心）','').match(/\p{Script=Han}/gu) ?? []).length });
const oldIds = new Set(Object.values(data.legacyDialogueIds).flat());
const added = data.script.filter(line => !oldIds.has(line.id));
const rows = [];
for (let i = 1; i <= 5; i++) {
  const lines = data.script.filter(line => line.id.startsWith(`A0${i}-`));
  const stats = count(lines.map(line => line.text).join(''));
  const times = lines.map(line => Number(line.camera.match(/([\d.]+)秒/u)?.[1] ?? 0));
  rows.push(`| 第${i}幕 | ${lines.length} | ${lines.reduce((n,line)=>n+Math.ceil(line.subtitleLines.length/3),0)} | ${stats.characters} | ${stats.han} | ${times.reduce((a,b)=>a+b,0)} |`);
}
const body = count(data.script.map(line=>line.text).join(''));
const extra = count(added.map(line=>line.text).join(''));
const opening = count([...data.opening.captions, ...data.opening.monologue].join(''));
const transition = count(Object.values(data.storyTransitions).flatMap(item=>item.lines).join(''));
const ending = count([...data.ending.paragraphs, data.ending.letterTitle, ...data.ending.letter].join(''));
const recap = count(data.recapSteps.flatMap(step=>[step.title,step.date,step.direction,step.closeView,step.fullView]).join(''));
const report = `# 修订补充稿内容统计

统计对象为当前代码实际展示的叙事内容。字符数含标点与舞台提示，排除空白及“（内心）”标签；汉字数只计汉字。重复分框不重复计数。此表不代表比赛官方的字数要求。

| 范围 | 逻辑段落 | 字幕框 | 字符数 | 汉字数 | 原分镜标注秒数合计 |
| --- | ---: | ---: | ---: | ---: | ---: |
${rows.join('\n')}
| 五幕合计 | ${data.script.length} | ${data.script.reduce((n,line)=>n+Math.ceil(line.subtitleLines.length/3),0)} | ${body.characters} | ${body.han} | — |

新增 11 段共 ${extra.characters} 个字符、${extra.han} 个汉字。原有 117 段仅拆框、统一内心标识及调整第五幕阅读顺序，原句字词通过 SHA-256 一致性检查。

| 其他叙事内容 | 字符数 | 汉字数 |
| --- | ---: | ---: |
| 开场字幕与独白 | ${opening.characters} | ${opening.han} |
| 六处转场文案 | ${transition.characters} | ${transition.han} |
| 四个复盘节点 | ${recap.characters} | ${recap.han} |
| 尾声与指导员信件 | ${ending.characters} | ${ending.han} |

不含按钮、导航、小游戏提示、史料札记、开发说明或重复的角色姓名；这些内容不能混入正文重复统计。PDF 所称“120 条”是 117 段五幕正文加 3 条开场条目，新加 11 段后五幕正文为 128 段。

分镜秒数按 camera 字段提取，为原稿镜头提示的合计，不能作为实际试玩时长。当前文字仍由玩家点击推进，长停顿 750ms、短停顿 250ms；阅读时间还取决于翻框及互动。应通过真实试玩记录实际体验时间。

重新生成：在仓库运行 node tests/story-stats.mjs。
`;
writeFileSync(new URL('../docs/修订补充稿内容统计.md', import.meta.url), report);
console.log(JSON.stringify({paragraphs:data.script.length,frames:data.script.reduce((n,line)=>n+Math.ceil(line.subtitleLines.length/3),0),body,added:extra}));
