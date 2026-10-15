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
    "closeView": "你在山窝里整编，然后掉头向东。",
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
    "closeView": "你没拿下鲁班场，又大白天渡了回河，最后趁夜走了。",
    "fullView": "红军进攻鲁班场未克，伤亡重大；随后由茅台三渡赤水，故意示形于敌；再趁敌重兵西调之机，秘密四渡赤水，南渡乌江，直逼贵阳，最终摆脱数十万敌军的围追堵截。",
    "routeIndices": [
      2,
      3
    ]
  }
];

export const crossingRoutes = [
  {
    "number": "一渡",
    "route": "M 708 72 C 620 71, 528 96, 460 112 S 330 154, 218 160",
    "markerY": 112
  },
  {
    "number": "二渡",
    "route": "M 218 160 C 246 188, 358 214, 460 228 S 616 245, 708 266",
    "markerY": 228
  },
  {
    "number": "三渡",
    "route": "M 708 266 C 640 295, 548 327, 460 342 S 316 363, 218 376",
    "markerY": 342
  },
  {
    "number": "四渡",
    "route": "M 218 376 C 308 405, 377 435, 460 452 S 624 476, 708 480",
    "markerY": 452
  }
];

export const recapSource = {
  title: '新华社：《毛泽东为什么称四渡赤水是他的“得意之笔”？》',
  url: 'https://www.xinhuanet.com/politics/2016-08/12/c_1119380984.htm',
};
