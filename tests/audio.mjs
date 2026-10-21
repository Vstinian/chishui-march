import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { runInNewContext } from 'node:vm';
const source = name => stripTypeScriptTypes(readFileSync(new URL(`../src/sound/${name}.ts`,import.meta.url),'utf8').replace(/^import .*;\s*$/gm,'').replace(/^export /gm,''),{mode:'strip'});
let now=0;const timers=new Set();const audios=[];
class MockAudio {
  constructor(src){this.src=src;this.volume=0;this.paused=true;this.currentTime=0;this.duration=20;this.listeners={};audios.push(this);}
  addEventListener(type,fn){this.listeners[type]=fn;}
  play(){this.paused=false;return Promise.resolve();}
  pause(){this.paused=true;}
  removeAttribute(){this.src='';}
  load(){}
}
const ctx={console,Audio:MockAudio,Date:{now:()=>now},setInterval:fn=>{timers.add(fn);return fn;},clearInterval:fn=>timers.delete(fn)};
runInNewContext(`${source('schema')}\n${source('engine')}\nglobalThis.Player=CuePlayer;globalThis.defaults=defaultSoundConfig;globalThis.validate=validateSoundConfig;globalThis.fingerprint=soundFingerprint;`,ctx);
const tick=(seconds=.1)=>{for(let i=0;i<seconds*10;i++){now+=100;for(const fn of [...timers])fn();}};
const line={id:'A01-D001',text:'风吹来了。枪声响起。',subtitleLines:['风吹来了。','枪声响起。']};
const cue=(overrides={})=>({id:'test',lineId:line.id,bus:'sfx',asset:'assets/audio/test.mp3',enabled:true,trigger:'keyword',frame:0,keyword:'枪声',occurrence:1,delay:0,volume:.5,fadeIn:0,fadeOut:0,trimStart:0,trimEnd:0,rate:1,loop:false,scope:'line',...overrides});
const position=(shown,lineId=line.id,frame=0)=>({actId:'act01',lineId,frame,frames:['风吹来了。枪声响起。'],shown});
const config=ctx.defaults();config.scriptFingerprint=ctx.fingerprint([line]);config.cues=[cue()];
assert.equal(ctx.validate(config,[line]).length,0);
assert.ok(ctx.validate({...config,cues:[cue({keyword:'没有这个词'})]},[line]).length);
assert.ok(ctx.validate({...config,cues:[cue({asset:'../../secret.wav'})]},[line]).length);
assert.ok(ctx.validate({...config,cues:[cue({trimStart:4,trimEnd:2})]},[line]).length);
assert.ok(ctx.validate({...config,scriptFingerprint:'old'},[line]).length);
const player=new ctx.Player();player.configure(config);player.update(position('风吹来了。枪'));assert.equal(audios.length,0);
player.update(position('风吹来了。枪声'));assert.equal(audios.length,1);assert.equal(audios[0].paused,false);
player.update(position(line.text));player.configure(config);player.update(position(line.text));assert.equal(audios.length,1,'重绘、保存、补全不会重复触发');
player.setPaused(true);assert.equal(audios[0].paused,true);player.setPaused(false);assert.equal(audios[0].paused,false);
player.update(position('下一段','A01-D002'));assert.equal(audios[0].src,'','离段停止声音');
player.reset();config.cues=[cue({id:'delay',trigger:'line',delay:1})];player.configure(config);player.update(position(''));const delayed=audios.at(-1);assert.equal(delayed.paused,true);player.update(position('','A01-D002'));tick(2);assert.equal(delayed.paused,true,'离开后取消延迟播放');
player.reset();config.cues=[cue({id:'music',bus:'music',trigger:'line',scope:'act',loop:true,fadeIn:1,fadeOut:1}),cue({id:'voice',bus:'voice',trigger:'line'})];player.configure(config);player.update(position(''));tick(.5);const bgm=audios.at(-2),voice=audios.at(-1);assert.ok(bgm.volume>0);assert.ok(bgm.volume<.8*.45*.5,'配音压低音乐');
player.setMuted(true);assert.equal(bgm.muted,true);assert.equal(voice.muted,true);player.setMuted(false);player.update(position('','A01-D002'));assert.equal(voice.paused,true);assert.equal(bgm.paused,false,'音乐可跨段');
player.update({...position('','A02-D001'),actId:'act02'});tick(1.2);assert.equal(bgm.paused,true,'跨幕渐弱停止');
player.reset();assert.equal(timers.size,0);
const dialoguePlayer=new ctx.Player();const voicesConfig={...ctx.defaults(),cues:[cue({id:'first-voice',bus:'voice',trigger:'line',fadeOut:2}),cue({id:'next-voice',lineId:'A01-D002',bus:'voice',trigger:'line'})]};
dialoguePlayer.configure(voicesConfig);dialoguePlayer.update(position(''));const firstVoice=audios.at(-1);dialoguePlayer.update(position('下一段','A01-D002'));const nextVoice=audios.at(-1);
assert.equal(firstVoice.src,'','新配音开始前立即停止旧配音，避免渐弱叠出两道声音');assert.equal(nextVoice.paused,false);dialoguePlayer.reset();
// 补充稿 ID 不按数值顺序排列；覆盖范围必须遵循实际剧本顺序。
const lines=[line,{...line,id:'A01-D020'},{...line,id:'A01-D003'},{...line,id:'A01-D004'},{...line,id:'A02-D001'}];
const rangeCue=cue({trigger:'line',scope:'range',endLineId:'A01-D003',endTrigger:'leave',loop:true,fadeOut:1});
const rangeConfig={...ctx.defaults(),scriptFingerprint:ctx.fingerprint(lines),cues:[rangeCue]};
assert.equal(ctx.validate(rangeConfig,lines).length,0);
for(const patch of [{endLineId:'missing'},{endLineId:'A02-D001'},{lineId:'A01-D003',endLineId:'A01-D020'},{endTrigger:'bad'},{endTrigger:'keyword',endKeyword:'不存在',endOccurrence:1},{endTrigger:'keyword',endKeyword:'枪声',endOccurrence:0},{endLineId:line.id,trigger:'keyword',keyword:'枪声',endTrigger:'keyword',endKeyword:'风吹',endOccurrence:1}])assert.ok(ctx.validate({...rangeConfig,cues:[{...rangeCue,...patch}]},lines).length,JSON.stringify(patch));
const ranged=new ctx.Player(lines.map(l=>l.id));ranged.configure(rangeConfig);ranged.update(position(''));const rain=audios.at(-1),count=audios.length;rain.currentTime=4;
ranged.update(position('下一段','A01-D020'));ranged.configure(rangeConfig);ranged.update(position('再下一段','A01-D003'));assert.equal(audios.length,count,'跨段和保存不能重新创建雨声');assert.equal(rain.currentTime,4,'跨段不重置播放进度');assert.equal(rain.paused,false);
ranged.update(position('离开终点','A01-D004'));tick(.5);const halfVolume=rain.volume;assert.ok(halfVolume>0);ranged.update(position('继续打字','A01-D004'));tick(.6);assert.equal(rain.src,'','终点渐弱不会被打字重复延长');
ranged.reset();ranged.update(position(''));const skipped=audios.at(-1);ranged.update(position('跳过终点','A01-D004'));tick(1.2);assert.equal(skipped.src,'','跳过终点也结束');
ranged.reset();rangeConfig.cues=[{...rangeCue,endTrigger:'keyword',endKeyword:'枪声',endOccurrence:1,fadeOut:0}];ranged.configure(rangeConfig);ranged.update(position(''));const keywordRain=audios.at(-1);ranged.update(position('风吹来了。枪','A01-D003'));assert.equal(keywordRain.paused,false);ranged.update(position('风吹来了。枪声','A01-D003'));assert.equal(keywordRain.src,'','结束关键词到达后停止');
ranged.reset();rangeConfig.cues=[{...rangeCue,delay:4,fadeOut:0}];ranged.configure(rangeConfig);ranged.update(position(''));const pending=audios.at(-1);ranged.update(position('','A01-D004'));tick(5);assert.equal(pending.src,'','到终点前未开始的延迟声音应取消');
ranged.reset();rangeConfig.cues=[{...rangeCue,fadeIn:1,trimEnd:10}];ranged.configure(rangeConfig);ranged.update(position(''));const looped=audios.at(-1);tick(1.2);const fullVolume=looped.volume;looped.currentTime=10;tick();assert.equal(looped.currentTime,0);assert.equal(looped.volume,fullVolume,'循环接续不再次渐强');
ranged.reset();assert.equal(timers.size,0);
// 从存档、中途选段及小游戏返回时补回 BGM；一次性声音仍只在原触发点播放。
const restored=new ctx.Player(lines.map(l=>l.id));
const musicConfig={...rangeConfig,cues:[{...rangeCue,id:'background',bus:'music',fadeOut:0},cue({id:'shot',trigger:'line'})]};
restored.configure(musicConfig);let baseline=audios.length;
restored.update(position('中途续读','A01-D020'));const resumedMusic=audios.at(-1);
assert.equal(audios.length,baseline+1,'中途续读只恢复音乐，不重播起始段音效');assert.equal(resumedMusic.paused,false);
restored.update(position('继续打字','A01-D020'));restored.configure(musicConfig);restored.update(position('下一段','A01-D003'));
assert.equal(audios.length,baseline+1,'保存配置和连续阅读不重复恢复音乐');
restored.update(position('范围之后','A01-D004'));assert.equal(resumedMusic.src,'');
restored.reset();baseline=audios.length;restored.update(position('范围之后','A01-D004'));assert.equal(audios.length,baseline,'不恢复已经结束的音乐');
restored.reset();baseline=audios.length;restored.update({...position('新一幕','A02-D001'),actId:'act02'});assert.equal(audios.length,baseline,'不恢复上一幕音乐');
restored.reset();restored.configure({...musicConfig,cues:[]});restored.update(position('配置尚未到达','A01-D020'));baseline=audios.length;restored.configure(musicConfig);
assert.equal(audios.length,baseline+1,'配置加载较晚时立即补回当前覆盖范围的音乐');
restored.reset();baseline=audios.length;restored.update({...position('同段后续字幕'),frame:1});assert.equal(audios.length,baseline+1,'从同段后续字幕框续读也能恢复音乐');
restored.reset();restored.configure({...musicConfig,cues:[...musicConfig.cues,{...rangeCue,id:'later-music',lineId:'A01-D020',endLineId:'A01-D004',bus:'music',fadeOut:0}]});baseline=audios.length;
restored.update(position('两个范围重叠','A01-D003'));assert.equal(audios.length,baseline+1);const latestMusic=audios.at(-1);
restored.update(position('旧范围已经结束','A01-D004'));assert.equal(latestMusic.paused,false,'恢复最后一条已触发配乐，不复活较早的配乐');
restored.reset();restored.configure({...musicConfig,cues:[{...musicConfig.cues[0],endTrigger:'keyword',endKeyword:'枪声',endOccurrence:1}]});baseline=audios.length;
restored.update(position('风吹来了。枪声','A01-D003'));assert.equal(audios.length,baseline,'不恢复已经越过终点关键词的音乐');
restored.reset();restored.configure({...musicConfig,cues:[{...musicConfig.cues[0],trigger:'keyword',keyword:'枪声'}]});baseline=audios.length;
restored.update(position('风吹来了。枪'));assert.equal(audios.length,baseline,'音乐关键词未到达时不提前恢复');restored.update(position('风吹来了。枪声'));assert.equal(audios.length,baseline+1);
restored.reset();const oneShotMusic={...musicConfig,cues:[{...musicConfig.cues[0],loop:false}]};restored.configure(oneShotMusic);restored.update(position('中途续读','A01-D020'));const endedMusic=audios.at(-1);endedMusic.listeners.ended();baseline=audios.length;
restored.configure(oneShotMusic);restored.update(position('继续阅读','A01-D020'));assert.equal(audios.length,baseline,'保存配置不能重播已结束的非循环音乐');
restored.reset();assert.equal(timers.size,0);
console.log('通过：关键词到达、去重、暂停恢复、静音、延迟取消、跨段音乐、跨幕渐弱、三轨混音、无效资源与剧本版本校验。');
console.log('通过：指定段落范围、非递增 ID、跨段不断音不重播、结束关键词、终点渐弱、跳过终点、延迟取消、循环音量保持、范围配置校验。');
console.log('通过：续读与中途选段恢复 BGM、同段字幕续读、配置延迟加载、恢复去重、最后音乐优先、终点及跨幕边界、关键词时机。');
