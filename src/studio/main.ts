import './studio.css';
import { script } from '../data/script';
import { acts } from '../data/acts';
import { characters } from '../data/narrative';
import { subtitleFrames } from '../subtitles';
import { escapeHtml } from '../utils/html';
import { defaultSoundConfig, soundFingerprint, validateSoundConfig } from '../sound/schema';
import { replaceSoundAssets } from '../sound/assets';
import type { AudioBus, SoundAsset, SoundConfig, SoundCue } from '../sound/schema';

const root = document.querySelector<HTMLDivElement>('#studio')!;
const esc = escapeHtml;
const fingerprint = soundFingerprint(script);
let config = defaultSoundConfig();
config.scriptFingerprint = fingerprint;
let library: SoundAsset[] = [];
let token = '', revision = '', savedSnapshot = '', writable = false, busy = false, queued = false, conflict = false;
let selectedLine = script[0].id, selectedFrame = 0, selectedCue = '', bus: AudioBus = 'sfx', paused = false;
let frameReady = false, saveTimer: ReturnType<typeof setTimeout> | undefined;
let sourceAudio: HTMLAudioElement | null = null;
let undoStack: string[] = [], redoStack: string[] = [];
const busNames = { voice: '人物配音', sfx: '环境与音效', music: '背景音乐' };
const draftKey = 'chishui-audio-studio-draft-v1';
const friendly = (asset?: SoundAsset) => {
  if (!asset) return '请选择音频';
  const hints: [string, string][] = [['bullet_whiz', '子弹掠过'], ['distant-ww2', '远处枪声'], ['wood-stomp', '泥地脚步'], ['wind-through', '风穿树林'], ['mosin-nagant', '拉动枪栓'], ['rain_heavy', '暴雨与雷声'], ['machine-gun', '机枪连射'], ['distant-cannon', '远处炮声']];
  const match = hints.find(([part]) => asset.name.includes(part));
  return match ? `${match[1]} · ${asset.name}` : asset.name;
};
const currentLine = () => script.find(line => line.id === selectedLine)!;
const selected = () => config.cues.find(cue => cue.id === selectedCue);
const lineIndex = new Map(script.map((line, i) => [line.id, i]));
function continuesAt(cue: SoundCue, lineId: string): boolean {
  const start = lineIndex.get(cue.lineId) ?? -1, here = lineIndex.get(lineId) ?? -1;
  if (!cue.enabled || here <= start || cue.lineId.split('-')[0] !== lineId.split('-')[0]) return false;
  return cue.scope === 'act' || (cue.scope === 'range' && here <= (lineIndex.get(cue.endLineId ?? '') ?? -1));
}
const rangeLabel = (cue: SoundCue) => cue.scope === 'range' ? `持续至 ${cue.endLineId ?? '待选择'}${cue.endTrigger === 'keyword' ? `「${cue.endKeyword ?? ''}」出现` : ' 结束后'}` : cue.scope === 'act' ? '持续至本幕结束' : '';
const iframe = () => document.querySelector<HTMLIFrameElement>('#game-preview')!;
const snapshot = () => JSON.stringify(config);
const status = (message: string, kind = '') => { const element = document.querySelector<HTMLElement>('#save-status')!; element.textContent = message; element.dataset.kind = kind; };
function send(data: object): void { if (frameReady) iframe().contentWindow?.postMessage({ source: 'chishui-studio', ...data }, location.origin); }
function setPreview(): void { send({ type: 'config', config }); }
function remember(): void { undoStack.push(snapshot()); if (undoStack.length > 50) undoStack.shift(); redoStack = []; }
function errors(): string[] { return validateSoundConfig(config, script); }
function changed(): void {
  try { localStorage.setItem(draftKey, snapshot()); } catch { /* 项目文件保存仍可继续 */ }
  const issues = errors();
  document.querySelector<HTMLElement>('#validation')!.textContent = issues.slice(0, 4).join('；');
  document.querySelector<HTMLElement>('#cue-count')!.textContent = `${config.cues.length} 个绑定`;
  if (!issues.length) setPreview();
  status(issues.length ? '有待修正项，暂未写入项目' : writable ? '修改待保存' : '浏览模式：可导出配置，本机开发服务支持写回', issues.length ? 'error' : 'pending');
  clearTimeout(saveTimer);
  if (writable && !conflict && !issues.length && document.querySelector<HTMLInputElement>('#autosave')!.checked) saveTimer = setTimeout(() => { void save(); }, 800);
  renderList();
}
async function api(endpoint: string, body?: BodyInit, headers: Record<string, string> = {}) {
  const response = await fetch(`/__audio-studio/${endpoint}`, { method: body === undefined ? 'GET' : 'POST', headers: { 'X-Studio-Token': token, ...headers }, body });
  let result;
  try { result = await response.json(); } catch { throw new Error('项目写回需要本机开发服务。请用 npm run dev 打开本页。'); }
  if (!response.ok) { if (response.status === 409 && endpoint === 'save') conflict = true; throw new Error(result.error ?? '请求失败'); }
  return result;
}
async function save(): Promise<void> {
  clearTimeout(saveTimer);
  if (!writable) { status('本页未连接本机写回服务，可先导出 JSON', 'error'); return; }
  const issues = errors(); if (issues.length) { status(issues[0], 'error'); return; }
  if (conflict) { status('文件有冲突，请先导出草稿，再重新读取项目', 'error'); return; }
  if (busy) { queued = true; return; }
  const content = snapshot();
  if (content === savedSnapshot) { status('已同步到项目文件', 'saved'); return; }
  busy = true; status('正在写入项目…', 'pending');
  try {
    const result = await api('save', JSON.stringify({ config: JSON.parse(content), revision }), { 'Content-Type': 'application/json' });
    revision = result.revision; savedSnapshot = content;
    status(`已同步到项目 · ${new Date(result.savedAt).toLocaleTimeString('zh-CN', { hour12: false })}`, 'saved');
    if (snapshot() === content) localStorage.removeItem(draftKey); else queued = true;
  } catch (error) { status(String(error instanceof Error ? error.message : error), 'error'); }
  finally { busy = false; if (queued && !conflict) { queued = false; void save(); } }
}
async function load(): Promise<void> {
  try {
    const data = await api('state'); token = data.token; revision = data.revision;
    config = data.config; library = data.library; writable = true;
  } catch {
    writable = false;
    try { config = await (await fetch('audio/cues.json')).json(); library = await (await fetch('audio/library.json')).json(); } catch { config = defaultSoundConfig(); }
  }
  if (!config.scriptFingerprint && config.cues.length === 0) config.scriptFingerprint = fingerprint;
  savedSnapshot = snapshot(); conflict = false;
  renderList(); renderInspector(); renderMix(); renderLibrary(); setPreview();
  document.querySelector<HTMLElement>('#cue-count')!.textContent = `${config.cues.length} 个绑定`;
  document.querySelector<HTMLElement>('#validation')!.textContent = errors().join('；');
  status(writable ? '项目已连接 · 修改自动写回本机文件' : '浏览模式 · 用本机 npm run dev 启用文件写回', writable ? 'saved' : 'pending');
}
function selectLine(id: string, frame = 0, seek = true, play = true): void {
  selectedLine = id; selectedFrame = frame;
  const first = config.cues.find(c => c.lineId === id && c.bus === bus); selectedCue = first?.id ?? '';
  if (seek) { sourceAudio?.pause(); paused = false; document.querySelector('#pause')!.textContent = '暂停'; setPreview(); send({ type: 'seek', lineId: id, frame, play }); }
  renderList(); renderInspector(); renderCaption();
}
function renderList(): void {
  const query = document.querySelector<HTMLInputElement>('#search')!.value.trim().toLowerCase();
  const act = document.querySelector<HTMLSelectElement>('#act-filter')!.value;
  const list = script.filter(line => (!act || line.id.startsWith(act)) && (!query || `${line.id} ${characters[line.speaker].name} ${line.text}`.toLowerCase().includes(query)));
  document.querySelector('#line-list')!.innerHTML = list.map(line => {
    const count = config.cues.filter(c => c.lineId === line.id).length;
    const carried = config.cues.filter(c => continuesAt(c, line.id)).length;
    return `<button class="line-item ${line.id === selectedLine ? 'selected' : ''}" data-line="${line.id}" aria-current="${line.id === selectedLine}"><span class="line-meta"><b>${line.id}</b><span>${line.narration ? '独白' : line.inner ? '内心' : esc(characters[line.speaker].name)}</span>${count ? `<i>${count} 音轨</i>` : ''}${carried ? `<i>延续 ${carried}</i>` : ''}</span><span class="line-copy">${esc(line.text)}</span></button>`;
  }).join('') || '<p class="empty">没有匹配的对白</p>';
  document.querySelector('#line-total')!.textContent = `${list.length} 段`;
}
function renderCaption(): void {
  const line = currentLine(), frames = subtitleFrames(line);
  document.querySelector('#selected-label')!.textContent = `${line.id} · ${characters[line.speaker].name}`;
  document.querySelector('#current-copy')!.innerHTML = frames.map((frame, i) => `<button class="frame-copy ${i === selectedFrame ? 'active' : ''}" data-frame="${i}"><span>字幕框 ${i+1}</span>${esc(frame.text).replaceAll('\n','<br>')}</button>`).join('');
  document.querySelector('#scene-label')!.textContent = line.scene;
}
function renderMix(): void {
  const names = { master: '总音量', voice: '配音', sfx: '音效', music: '音乐', ducking: '配音期间音乐保留' };
  document.querySelector('#mix-controls')!.innerHTML = (Object.keys(names) as (keyof typeof names)[]).map(key => `<label class="mix-row"><span>${names[key]}</span><input aria-label="${names[key]}" data-mix="${key}" type="range" min="0" max="1" step="0.01" value="${config.mix[key]}"><output>${Math.round(config.mix[key]*100)}%</output></label>`).join('');
}
function renderInspector(): void {
  const cues = config.cues.filter(c => c.lineId === selectedLine && c.bus === bus);
  document.querySelectorAll<HTMLButtonElement>('[data-bus]').forEach(el => { el.classList.toggle('active', el.dataset.bus === bus); el.setAttribute('aria-selected', String(el.dataset.bus === bus)); });
  const carried = config.cues.filter(c => c.bus === bus && continuesAt(c, selectedLine));
  document.querySelector('#bindings')!.innerHTML = (cues.map(c => `<button data-cue="${c.id}" class="cue-item ${c.id === selectedCue ? 'active' : ''}"><span>${c.enabled ? '●' : '○'} ${esc(friendly(library.find(a=>a.path===c.asset)))}</span><small>${c.trigger === 'line' ? '进入段落' : c.trigger === 'frame' ? `字幕框 ${c.frame+1}` : `出现「${esc(c.keyword)}」`}${rangeLabel(c) ? ` · ${esc(rangeLabel(c))}` : ''}</small></button>`).join('') || `<p class="empty">这段尚未新增${busNames[bus]}。</p>`) + (carried.length ? `<p class="hint">以下音轨的设定范围覆盖本段；实际播放以中间状态为准。点击返回起点编辑、连续试听。</p>${carried.map(c => `<button class="cue-item" data-carried="${c.id}"><span>↳ ${esc(friendly(library.find(a=>a.path===c.asset)))}</span><small>来自 ${esc(c.lineId)} · ${esc(rangeLabel(c))}</small></button>`).join('')}` : '');
  const cue = selected();
  if (!cue || cue.lineId !== selectedLine || cue.bus !== bus) { document.querySelector('#cue-editor')!.innerHTML = ''; return; }
  const frames = subtitleFrames(currentLine());
  const endLines = script.filter((line, index) => index >= lineIndex.get(cue.lineId)! && line.id.split('-')[0] === cue.lineId.split('-')[0]);
  const options = library.map(a => `<option value="${esc(a.path)}" ${cue.asset===a.path?'selected':''}>${esc(friendly(a))}</option>`).join('');
  const numeric = (key: keyof SoundCue, label: string, max: number, step: number, min = 0) => `<label>${label}<input type="number" data-field="${key}" min="${min}" max="${max}" step="${step}" value="${cue[key]}"></label>`;
  document.querySelector('#cue-editor')!.innerHTML = `<div class="editor-title"><b>${busNames[bus]}设置</b><label class="check"><input type="checkbox" data-field="enabled" ${cue.enabled?'checked':''}>启用</label></div>
    <label>音频素材<select data-field="asset"><option value="">选择素材</option>${options}</select></label>
    <div class="inline-actions"><button data-action="audition">试听原素材</button><button data-action="audition-stop">停止试听</button></div>
    <label>开始播放的时机<select data-field="trigger"><option value="line" ${cue.trigger==='line'?'selected':''}>进入这一段对白</option><option value="frame" ${cue.trigger==='frame'?'selected':''}>进入指定字幕框</option><option value="keyword" ${cue.trigger==='keyword'?'selected':''}>打字显示到关键词末尾</option></select></label>
    ${cue.trigger==='frame'?`<label>字幕框<select data-field="frame">${frames.map((f,i)=>`<option value="${i}" ${cue.frame===i?'selected':''}>${i+1} · ${esc(f.text.slice(0,20))}</option>`).join('')}</select></label>`:''}
    ${cue.trigger==='keyword'?`<label>关键词（按本段原文匹配）<input data-field="keyword" value="${esc(cue.keyword)}" placeholder="例如：枪声"></label>${numeric('occurrence','第几次出现',100,1,1)}`:''}
    <div class="field-grid">${numeric('delay','触发后延迟 / 秒',3600,.1)}${numeric('volume','片段音量 / 0 至 1',1,.05)}${numeric('fadeIn','渐强时长 / 秒',3600,.1)}${numeric('fadeOut','渐弱时长 / 秒',3600,.1)}${numeric('trimStart','截取起点 / 秒',3600,.1)}${numeric('trimEnd','截取终点 / 0 为结尾',3600,.1)}${numeric('rate','播放速度',2,.05,.5)}<label class="check loop-check"><input type="checkbox" data-field="loop" ${cue.loop?'checked':''}>循环播放</label></div>
    <label>声音持续范围<select data-field="scope"><option value="frame" ${cue.scope==='frame'?'selected':''}>当前字幕框</option><option value="line" ${cue.scope==='line'?'selected':''}>当前段落</option><option value="range" ${cue.scope==='range'?'selected':''}>指定连续段落（跨段播放）</option><option value="act" ${cue.scope==='act'?'selected':''}>从起点持续到本幕结束</option></select></label>
    ${cue.scope==='range'?`<div class="range-settings"><p class="hint">开始：${esc(cue.lineId)}。按真实剧情顺序选择终点；中间换对白不会重播。</p><label>结束段落<select data-field="endLineId">${endLines.map(l=>`<option value="${l.id}" ${cue.endLineId===l.id?'selected':''}>${l.id} · ${esc(characters[l.speaker].name)} · ${esc(l.text.slice(0,26))}</option>`).join('')}</select></label><label>结束方式<select data-field="endTrigger"><option value="leave" ${cue.endTrigger==='leave'?'selected':''}>读完结束段落，离开时渐弱</option><option value="keyword" ${cue.endTrigger==='keyword'?'selected':''}>结束段落的关键词出现时渐弱</option></select></label>${cue.endTrigger==='keyword'?`<p class="hint">结束段原文：${esc(script.find(l=>l.id===cue.endLineId)?.subtitleLines.join('')??'')}</p><label>结束关键词<input data-field="endKeyword" value="${esc(cue.endKeyword??'')}" placeholder="填写结束段落中的原词"></label>${numeric('endOccurrence','结束关键词第几次出现',100,1,1)}`:''}<p class="hint">${cue.loop?'已开启循环：素材播完后接着播放，直到终点。':'未开启循环：素材可能先于剧情终点播完。雨声、持续配乐建议勾选“循环播放”。'} 终点触发后按“渐弱时长”退出；小游戏、转场和札记会清理声音。</p></div>`:''}
    <p class="hint">配音和音乐各保持一条主轨，新片段接替旧片段；音效允许叠加。音乐会按“音乐保留”比例自动避让配音。</p>
    <div class="inline-actions"><button data-action="duplicate">复制绑定</button><button class="danger" data-action="remove">删除绑定</button></div>`;
}
function renderLibrary(): void {
  document.querySelector('#asset-choice')!.innerHTML = `<option value="">先选择素材</option>${library.map(a=>`<option value="${esc(a.path)}">${esc(friendly(a))}</option>`).join('')}`;
  document.querySelector('#library-count')!.textContent = `${library.length} 个文件`;
  document.querySelector('#library-list')!.innerHTML = library.map(a => `<div class="asset-row"><div><b>${esc(friendly(a))}</b><small>${(a.bytes/1024).toFixed(0)} KB · ${a.path.endsWith('.wav')?'WAV，发布前建议压缩':'网页音频'}<br>${esc(a.path)}</small></div><button data-audition="${esc(a.path)}">试听</button></div>`).join('') || '<p class="empty">导入音频，或扫描项目 audio 文件夹。</p>';
}
function audition(path: string): void { sourceAudio?.pause();send({type:'stop'});paused=true;document.querySelector('#pause')!.textContent='继续'; sourceAudio = new Audio(path); sourceAudio.volume = 1; void sourceAudio.play().catch(()=>status('无法播放该素材，请检查格式或再点击一次试听', 'error')); }
function exportConfig(): void {
  const url = URL.createObjectURL(new Blob([JSON.stringify(config,null,2)],{type:'application/json'}));
  const link = document.createElement('a'); link.href=url; link.download='chishui-audio-cues.json'; link.click(); URL.revokeObjectURL(url);
}

root.innerHTML = `<header class="studio-header"><div class="studio-brand"><span class="brand-square">声</span><div><h1>声音编排台</h1><p>赤水行军图 / AUDIO STUDIO</p></div></div><div class="save-area"><span id="save-status" role="status">连接项目…</span><label class="check"><input id="autosave" type="checkbox" checked>自动保存</label><button id="save" class="primary">保存到项目</button><button id="export">导出 JSON</button></div></header>
<div class="version-strip"><span>运行剧本：src/data/script.ts · ${script.length} 段正文 / ${script.filter(l=>!l.narration&&!l.inner).length} 段人物对白</span><span>与 117 段 lines.js 定稿不同，正式配音前请先统一版本。</span><button id="confirm-version">确认当前版本的绑定</button></div>
<main class="studio-layout"><aside class="script-panel"><div class="panel-heading"><h2>文稿对白</h2><span id="line-total"></span></div><select id="act-filter" aria-label="筛选幕"><option value="">全部五幕</option>${acts.map((a,i)=>`<option value="A0${i+1}">${esc(a.title)}</option>`).join('')}</select><input id="search" type="search" placeholder="搜索人物、关键词或段落 ID" aria-label="搜索对白"><div id="line-list"></div></aside>
<section class="preview-panel"><div class="preview-bar"><div><b id="selected-label"></b><small id="scene-label"></small></div><span class="preview-tag">游戏实景预览</span></div><div class="game-window"><iframe id="game-preview" title="游戏预览" allow="autoplay" src="./?audioStudioPreview=1"></iframe></div><div class="transport"><button id="replay" class="primary">↺ 从本段试听</button><button id="pause">暂停</button><button id="next">补全 / 下一框 →</button><button id="stop">停止声音</button><label class="check"><input id="phone" type="checkbox">竖屏预览</label></div><div id="current-copy"></div><div class="live-panel"><div class="panel-heading"><h2>正在播放</h2><span id="cue-count">0 个绑定</span></div><div id="activity"><p class="empty">选择对白，添加音轨后点击“从本段试听”。</p></div></div><details class="instructions"><summary>使用顺序与保存说明</summary><p>① 左侧选择对白 → ② 右侧选择配音、音效或音乐 → ③ 选择素材并添加 → ④ 设置段落 / 字幕框 / 关键词触发 → ⑤ 在中间从头试听。</p><p>自动保存写入 public/audio/cues.json；音频存入 public/assets/audio/。发布前需提交文件并重新部署。预览使用独立进度，不会覆盖玩家存档。</p><p>点击补全文字会立即触发该框尚未出现的关键词。声音编排基于当前运行剧本；更换剧本后需要重新核对绑定。</p><div class="inline-actions"><button id="reload">重新读取项目</button><button id="restore">恢复未保存草稿</button><button id="import-json">导入 JSON</button></div></details></section>
<aside class="audio-panel"><div class="panel-heading"><h2>声音编辑</h2><button id="library-open">素材库 <span id="library-count">0</span></button></div><div class="bus-tabs" role="tablist">${(['voice','sfx','music'] as AudioBus[]).map(b=>`<button role="tab" data-bus="${b}">${busNames[b]}</button>`).join('')}</div><div class="add-cue"><select id="asset-choice" aria-label="添加用音频素材"></select><button id="add" class="primary">＋ 添加到这一段</button></div><div id="bindings"></div><div id="cue-editor"></div><div id="validation" role="alert"></div><section class="mixer"><div class="panel-heading"><h2>三轨混音</h2><div><button id="undo" title="撤销">↶</button><button id="redo" title="重做">↷</button></div></div><div id="mix-controls"></div></section></aside></main>
<dialog id="library-dialog"><div class="panel-heading"><h2>音频素材库</h2><button id="library-close">关闭 ×</button></div><p class="hint">支持 MP3 / WAV / OGG / M4A。导入时保留源文件；已配置 FFmpeg 时自动把 WAV 转为 MP3。</p><div class="inline-actions"><button id="upload" class="primary">导入音频文件</button><button id="scan">扫描项目 audio 文件夹</button><button id="library-stop">停止试听</button></div><p id="import-status" role="status"></p><div id="library-list"></div></dialog><input id="file-input" type="file" accept=".mp3,.wav,.ogg,.m4a" multiple hidden><input id="json-input" type="file" accept=".json" hidden>`;

root.addEventListener('click', event => {
  const button = (event.target as HTMLElement).closest<HTMLElement>('button'); if (!button) return;
  if (button.dataset.line) { selectLine(button.dataset.line); return; }
  if (button.dataset.frame !== undefined) { selectLine(selectedLine, Number(button.dataset.frame)); return; }
  if (button.dataset.bus) { bus = button.dataset.bus as AudioBus; selectedCue = config.cues.find(c=>c.lineId===selectedLine&&c.bus===bus)?.id??''; renderInspector(); return; }
  if (button.dataset.cue) { selectedCue=button.dataset.cue; renderInspector(); return; }
  if (button.dataset.carried) { const carried=config.cues.find(c=>c.id===button.dataset.carried);if(carried){selectLine(carried.lineId);selectedCue=carried.id;renderInspector();}return; }
  if (button.dataset.audition) { audition(button.dataset.audition); return; }
  const cue = selected();
  if (button.dataset.action === 'audition' && cue?.asset) audition(cue.asset);
  if (button.dataset.action === 'audition-stop') sourceAudio?.pause();
  if (button.dataset.action === 'duplicate' && cue) { remember(); const copy={...cue,id:crypto.randomUUID()}; config.cues.push(copy);selectedCue=copy.id;changed();renderInspector(); }
  if (button.dataset.action === 'remove' && cue) { remember();config.cues=config.cues.filter(c=>c.id!==cue.id);selectedCue='';changed();renderInspector(); }
});
document.querySelector('#search')!.addEventListener('input', renderList);
document.querySelector('#act-filter')!.addEventListener('change', renderList);
document.querySelector('#add')!.addEventListener('click', () => {
  const asset = document.querySelector<HTMLSelectElement>('#asset-choice')!.value;
  if (!asset) { status('请先选择音频素材；可在素材库导入', 'error'); return; }
  if (library.find(a=>a.path===asset)?.source?.startsWith('audio/voice/')) bus='voice';
  const existing = bus==='voice' ? config.cues.find(c=>c.lineId===selectedLine&&c.bus==='voice'&&c.asset===asset) : undefined;
  if(existing){selectedCue=existing.id;renderInspector();status('这段已绑定该人物配音，已定位现有绑定；可直接调整参数');return;}
  remember();
  const cue: SoundCue = { id:crypto.randomUUID(),lineId:selectedLine,bus,asset,enabled:true,trigger:'line',frame:0,keyword:'',occurrence:1,delay:0,volume:bus==='voice'?1:.6,fadeIn:bus==='music'?1.5:0,fadeOut:bus==='music'?1:0,trimStart:0,trimEnd:0,rate:1,loop:bus==='music',scope:bus==='music'?'act':'line' };
  config.cues.push(cue);selectedCue=cue.id;changed();renderInspector();
});
document.querySelector('#cue-editor')!.addEventListener('input', event => {
  const el=event.target as HTMLInputElement|HTMLSelectElement, field=el.dataset.field as keyof SoundCue;
  const cue=selected();if(!cue||!field)return;
  remember();
  const value = el instanceof HTMLInputElement && el.type==='checkbox' ? el.checked : ['frame','occurrence','endOccurrence','delay','volume','fadeIn','fadeOut','trimStart','trimEnd','rate'].includes(field) ? Number(el.value) : el.value;
  Object.assign(cue,{[field]:value});
  if(field==='scope'&&cue.scope==='range') { cue.endLineId ??= cue.lineId;cue.endTrigger ??= 'leave';cue.endKeyword ??= '';cue.endOccurrence ??= 1; }
  if(field==='endLineId') { cue.endKeyword='';cue.endOccurrence=1; }
  changed();
  if(['trigger','scope','endLineId','endTrigger','loop'].includes(field))renderInspector();
});
document.querySelector('#mix-controls')!.addEventListener('input', event=>{
  const el=event.target as HTMLInputElement, key=el.dataset.mix as keyof SoundConfig['mix'];if(!key)return;
  remember();config.mix[key]=Number(el.value);el.nextElementSibling!.textContent=`${Math.round(Number(el.value)*100)}%`;changed();
});
document.querySelector('#save')!.addEventListener('click',()=>void save());
document.querySelector('#autosave')!.addEventListener('change',()=>{if(document.querySelector<HTMLInputElement>('#autosave')!.checked)void save();else clearTimeout(saveTimer);});
document.querySelector('#export')!.addEventListener('click',exportConfig);
document.querySelector('#replay')!.addEventListener('click',()=>selectLine(selectedLine));
document.querySelector('#next')!.addEventListener('click',()=>send({type:'advance'}));
document.querySelector('#pause')!.addEventListener('click',()=>{paused=!paused;send({type:'pause',paused});document.querySelector('#pause')!.textContent=paused?'继续':'暂停';});
document.querySelector('#stop')!.addEventListener('click',()=>{sourceAudio?.pause();paused=true;send({type:'stop'});document.querySelector('#pause')!.textContent='继续';});
document.querySelector('#phone')!.addEventListener('change',event=>document.querySelector('.game-window')!.classList.toggle('phone',(event.target as HTMLInputElement).checked));
document.querySelector('#confirm-version')!.addEventListener('click',()=>{remember();config.scriptFingerprint=fingerprint;changed();});
for(const kind of ['undo','redo'])document.querySelector(`#${kind}`)!.addEventListener('click',()=>{
  const from=kind==='undo'?undoStack:redoStack,to=kind==='undo'?redoStack:undoStack;if(!from.length)return;
  to.push(snapshot());config=JSON.parse(from.pop()!);changed();renderInspector();renderMix();
});
document.querySelector('#reload')!.addEventListener('click',()=>{if(snapshot()!==savedSnapshot&&!confirm('将重新读取项目文件。未保存草稿请先导出，是否继续？'))return;undoStack=[];redoStack=[];void load();});
document.querySelector('#restore')!.addEventListener('click',()=>{const draft=localStorage.getItem(draftKey);if(!draft){status('没有待恢复的本地草稿');return;}remember();config=JSON.parse(draft);changed();renderInspector();renderMix();});
const dialog=document.querySelector<HTMLDialogElement>('#library-dialog')!;
document.querySelector('#library-open')!.addEventListener('click',()=>dialog.showModal());
document.querySelector('#library-close')!.addEventListener('click',()=>{sourceAudio?.pause();dialog.close();});
document.querySelector('#library-stop')!.addEventListener('click',()=>sourceAudio?.pause());
document.querySelector('#upload')!.addEventListener('click',()=>document.querySelector<HTMLInputElement>('#file-input')!.click());
document.querySelector('#file-input')!.addEventListener('change',async event=>{
  const input=event.target as HTMLInputElement, info=document.querySelector('#import-status')!;
  for(const file of Array.from(input.files??[])){
    info.textContent=`正在导入 ${file.name}…`;
    try { const {asset}=await api('import',file,{'X-Audio-Name':encodeURIComponent(file.name)});library=library.filter(a=>a.path!==asset.path);library.push(asset);renderLibrary();renderInspector();info.textContent=`已导入 ${file.name}`; }
    catch(error){info.textContent=String(error);break;}
  }
  input.value='';
});
document.querySelector('#scan')!.addEventListener('click',async()=>{
  const info=document.querySelector('#import-status')!,button=document.querySelector<HTMLButtonElement>('#scan')!;
  if(busy){info.textContent='正在保存项目，请稍后扫描';return;}
  busy=true;button.disabled=true;clearTimeout(saveTimer);info.textContent='正在扫描并整理项目 audio 文件夹…';
  try{
    const result=await api('scan','{}');
    library=result.library;
    const before=snapshot(),updated=replaceSoundAssets(config,library);
    sourceAudio?.pause();send({type:'stop'});
    if(updated){undoStack.push(before);if(undoStack.length>50)undoStack.shift();redoStack=[];changed();}else setPreview();
    renderLibrary();renderInspector();
    info.textContent=`已整理 ${result.assets.length} 个音频文件，更新 ${updated} 条旧版素材绑定${updated?'；请从本段重新试听':''}`;
  }catch(error){info.textContent=String(error);}
  finally{
    busy=false;button.disabled=false;
    if(queued||(snapshot()!==savedSnapshot&&document.querySelector<HTMLInputElement>('#autosave')!.checked)){queued=false;if(!conflict)void save();}
  }
});
document.querySelector('#import-json')!.addEventListener('click',()=>document.querySelector<HTMLInputElement>('#json-input')!.click());
document.querySelector('#json-input')!.addEventListener('change',async event=>{
  const input=event.target as HTMLInputElement,file=input.files?.[0];if(!file)return;
  try{const value=JSON.parse(await file.text());const issues=validateSoundConfig(value,script);if(issues.length)throw new Error(issues.join('；'));remember();config=value;changed();renderInspector();renderMix();}catch(error){status(String(error),'error');}input.value='';
});
window.addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==iframe().contentWindow||event.data?.source!=='chishui-preview')return;
  const data=event.data;
  if(data.type==='ready'){frameReady=true;setPreview();selectLine(selectedLine,0,true,false);}
  if(data.type==='position'&&script.some(l=>l.id===data.lineId)){if(selectedLine!==data.lineId)selectLine(data.lineId,data.frame,false);else{selectedFrame=data.frame;renderCaption();}}
  if(data.type==='activity')document.querySelector('#activity')!.innerHTML=data.items.length?data.items.map((item:{bus:AudioBus;name:string;time:number;volume:number})=>`<div class="playing-track ${item.bus}"><b>${busNames[item.bus]}</b><span>${esc(friendly(library.find(a=>a.path.endsWith(item.name))))}</span><time>${item.time.toFixed(1)}s</time><meter min="0" max="1" value="${item.volume}"></meter></div>`).join(''):'<p class="empty">当前没有正在播放的绑定音频。</p>';
  if(data.type==='audio-error')status(data.message,'error');
});
window.addEventListener('beforeunload',event=>{if(snapshot()!==savedSnapshot){event.preventDefault();event.returnValue='';}});
renderList();renderCaption();renderInspector();renderMix();renderLibrary();void load();
