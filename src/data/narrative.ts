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
  textStart: 14000,
  lineStagger: 1800,
  lineFade: 1400,
  buttonFade: 900,
  captions: [
    '赤水行軍圖\n一九三五年一月\n紅一軍團行軍記錄',
    '川黔邊境，赤水河兩岸，\n群山連綿，霧氣不散。\n三萬名紅軍，走進了這片山。',
  ],
  monologue: [
    '我不知道為什麼要一次次渡過同一條河。',
    '我只是千千萬萬紅軍裡的一名普通士兵。',
    '跟著隊伍，一步一步往前走。',
  ],
};

export const ending = {
  paragraphs: [
    '游戏里，你是一名无名的战士。历史上，这样无名的战士有成千上万。',
    '他们中的绝大多数，没有留下姓名，只留下一个番号、一双草鞋、一段路。',
    '一次西渡，一次东返；再向西，再折向东。你记得脚下的旧脚印，后来才看懂地图上的选择。每一次转向，都牵着许多人的生死。',
    '赤水河的水今天还在流。当年趟过它的人，大多没能看到它今天的平静。',
    '如果你有机会，去走一走那条路。不用带很多，带一双合脚的鞋就好。',
  ],
  letterTitle: '连队指导员的信（一九三五年，金沙江畔）',
  letter: [
    '邓青山同志：',
    '这一路，你问过“为什么”，也把许多问号藏在了心里。我知道，你想听一个明白的回答。',
    '有些话，我当时不能说，现在也还是不能说全。紧急的部署，往往上午定、下午走，连我，也是接到命令才晓得方向。',
    '你们只看见掉头，看不见地图；只听见口令，听不见缘由。这是我欠你们的——不是不想讲，是来不及讲。',
    '等到能讲的那一天，你会明白：我们四次渡过的同一条河，每一步都是有数的。你在河上走的每一块门板，都没白搭。',
    '把这条命留着。看见那天，替那些没走到的人，多看一眼。',
  ],
};
