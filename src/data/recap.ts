export interface RecapStep {
  number: string; title: string; date: string; direction: string;
  closeView: string; fullView: string; routeIndices: number[];
}

// 文字源于集合版剧本第 71 页，史实与数字待核。四个叙事节点不等同四次渡河。
export const recapSteps: RecapStep[] = [
  {
    "number": "01",
    "title": "一渡赤水",
    "date": "1935年1月29日",
    "direction": "土城 · 浑溪口",
    "closeView": "你在雨夜架起浮桥，把三万人渡过了河。",
    "fullView": "土城青杠坡战斗失利后，中央红军由土城、元厚场等渡口西渡赤水，进入川南。周恩来亲自指挥在浑溪口架设浮桥，当地群众拆下门板支援红军。",
    "routeIndices": [
      0
    ]
  },
  {
    "number": "02",
    "title": "扎西整编 · 二渡",
    "date": "1935年2月9日至21日",
    "direction": "云南扎西 · 太平渡",
    "closeView": "你在扎西整编，记着来时的脚印，再随队伍掉头向东。",
    "fullView": "中央红军在扎西完成整编，随后由太平渡、二郎滩二渡赤水，回师黔北。这是“四渡赤水”中转折性的一步，红军由此跳出包围，转向主动。",
    "routeIndices": [
      1
    ]
  },
  {
    "number": "03",
    "title": "娄山关 · 遵义",
    "date": "1935年2月25日至28日",
    "direction": "娄山关 · 遵义",
    "closeView": "你从崖缝爬上山顶，看见红旗在关顶翻卷。",
    "fullView": "红军攻克娄山关，再夺遵义城，取得长征以来最大一次胜利，共歼敌两个师又八个团。娄山关战斗是遵义战役的关键一仗。",
    "routeIndices": [
      1
    ]
  },
  {
    "number": "04",
    "title": "鲁班场 · 三渡 · 四渡",
    "date": "1935年3月15日至22日",
    "direction": "鲁班场 · 茅台 · 太平渡",
    "closeView": "鲁班场之后，你从茅台西渡。几天后，队伍又在夜里折向东岸；你问过缘由，仍须跟着口令往前走。",
    "fullView": "鲁班场战斗后，红军于3月16—17日从茅台一带西渡赤水，调动敌军；3月21—22日再从二郎滩、太平渡、淋滩等渡口东渡。随后南渡乌江、威逼贵阳、西进云南，最终通过巧渡金沙江摆脱大规模围追堵截。",
    "routeIndices": [
      2,
      3
    ]
  }
];

// 参考 sidu-red-river-master 的分层山川、箭头与阶段路线呈现；为手机重新排布的示意坐标。
export const crossingRoutes = [
  { number: '一渡', label: '西渡 · 入川南', route: 'M 370 190 Q 330 173 295 205 Q 245 227 190 258 Q 120 292 100 375', markerX: 303, markerY: 203, labelX: 250, labelY: 152, step: 0 },
  { number: '二渡', label: '东返 · 回黔北', route: 'M 100 375 Q 170 352 225 323 Q 288 295 340 292 Q 420 280 490 310', markerX: 340, markerY: 292, labelX: 388, labelY: 249, step: 1 },
  { number: '三渡', label: '西进 · 调动敌军', route: 'M 395 510 Q 375 465 352 438 Q 310 396 270 360 Q 226 326 190 258', markerX: 352, markerY: 438, labelX: 262, labelY: 490, step: 3 },
  { number: '四渡', label: '再东渡 · 转向南下', route: 'M 190 258 Q 246 249 295 273 Q 321 288 347 313 Q 402 342 440 401 Q 470 465 475 575', markerX: 347, markerY: 313, labelX: 419, labelY: 359, step: 3 },
];

export const recapPlaces = [
  { name: '土城', x: 370, y: 190, dx: 13, dy: -10 },
  { name: '叙永', x: 145, y: 202, dx: -14, dy: -14 },
  { name: '古蔺', x: 190, y: 258, dx: -48, dy: -4 },
  { name: '扎西', x: 100, y: 375, dx: -24, dy: 32 },
  { name: '太平渡 · 二郎滩', x: 340, y: 292, dx: 55, dy: -75 },
  { name: '桐梓', x: 490, y: 310, dx: 12, dy: 3 },
  { name: '娄山关', x: 490, y: 391, dx: 15, dy: -3 },
  { name: '遵义', x: 510, y: 461, dx: 15, dy: 4 },
  { name: '茅台', x: 352, y: 438, dx: -56, dy: -8 },
  { name: '鲁班场', x: 395, y: 510, dx: -68, dy: 28 },
];

export const recapSource = {
  title: '新华社：《毛泽东为什么称四渡赤水是他的“得意之笔”？》',
  url: 'https://www.xinhuanet.com/politics/2016-08/12/c_1119380984.htm',
};
