import type { Character, CharacterId } from '../types';

// 美术交付后将 null 改为 assets/ 开头的相对路径；未交付时显示剪影。
export const characters: Record<CharacterId, Character> = {
  qingshan: { name: '邓青山', role: '十七岁 · 江西兴国 · 轻机枪副射手', portrait: null, expressions: { neutral: null, tense: null, tired: null } },
  laolei: { name: '老雷', role: '三十岁 · 四川 · 九连班长', portrait: null, expressions: { neutral: null, alert: null, tired: null } },
  xiaoman: { name: '小满', role: '十五岁 · 江西兴国 · 同乡战友', portrait: null, expressions: { anxious: null, smile: null, tired: null } },
  ahu: { name: '阿虎', role: '二十岁 · 川黔交界 · 向导', portrait: null, expressions: { focus: null, alert: null, tired: null } },
  instructor: { name: '指导员', role: '二十四岁 · 福建 · 连队指导员', portrait: null, expressions: { serious: null, neutral: null, soft: null } },
  wounded: { name: '伤员', role: '战友', portrait: null, expressions: { tired: null } },
};

export const scenes: Record<string, string | null> = {
  'a01-bg01': null, 'a01-bg02': null, 'a01-bg03': null, 'a01-bg04': null,
  'a02-bg01': null, 'a02-bg02': null, 'a02-bg03': null,
  'a03-bg01': null, 'a03-bg02': null,
  'a04-bg01': null, 'a04-bg02': null,
  'a05-bg01': null, 'a05-bg02': null,
};

export const opening = {
  video: null as string | null,
  bgm: null as string | null,
  duration: 20000,
  reducedDuration: 6000,
  captions: [
    '赤水行军图　一九三五年一月・红一军团行军记录',
    '川黔边境，赤水河两岸，群山连绵，雾气不散。三万名红军，走进了这片山。',
  ],
  monologue: [
    '我不知道为什么要一次次渡过同一条河。',
    '我只是千千万万红军里的一名普通士兵，跟着队伍，一步一步往前走。',
    '这是我的行军路。',
  ],
};

export const ending = {
  paragraphs: [
    '游戏里，你是一名无名的战士。历史上，这样无名的战士有成千上万。',
    '他们中的绝大多数，没有留下姓名，只留下一个番号、一双草鞋、一段路。',
    '四次渡过同一条河，不是重复，是选择。每一个“向东”的命令背后，都是几十万人的生死。',
    '赤水河的水今天还在流。当年趟过它的人，大多没能看到它今天的平静。',
    '如果你有机会，去走一走那条路。不用带很多，带一双合脚的鞋就好。',
  ],
  letterTitle: '连队指导员的信（一九三五年，金沙江畔）',
  letter: [
    '邓青山同志：',
    '这一路你没问过一句“为什么”，我很清楚，你心里问过无数回。',
    '有些话，我当时不能说，现在也还是不能说全。紧急的部署，往往上午定、下午走，连我，也是接到命令才晓得方向。',
    '你们只看见掉头，看不见地图；只听见口令，听不见缘由。这是我欠你们的——不是不想讲，是来不及讲。',
    '等到能讲的那一天，你会明白：我们四次渡过的同一条河，每一步都是有数的。你在河上走的每一块门板，都没白搭。',
    '把这条命留着。看见那天，替那些没走到的人，多看一眼。',
  ],
};
