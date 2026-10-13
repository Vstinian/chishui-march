export interface RecapStep {
  number: string;
  title: string;
  date: string;
  direction: string;
  closeView: string;
  fullView: string;
  route: string;
  markerY: number;
}

// 战役节点据新华社报道整理。地图只表达四次转向，不表达真实坐标或逐日行军轨迹。
export const recapSteps: RecapStep[] = [
  {
    number: '01',
    title: '一渡 · 西进',
    date: '1935.01.28 夜—01.29',
    direction: '由黔北向川南',
    closeView: '青杠坡战斗后，队伍连夜撤出。你看到的是渡河与转向。',
    fullView: '原定的北渡长江计划受阻，主力轻装西渡赤水，先摆脱眼前的不利战局。',
    route: 'M 708 72 C 620 71, 528 96, 460 112 S 330 154, 218 160',
    markerY: 112,
  },
  {
    number: '02',
    title: '二渡 · 东返',
    date: '1935.02.18—02.21',
    direction: '由川南回师黔北',
    closeView: '方向再次改变。身在队伍里，只知道眼前是返回赤水河的路。',
    fullView: '敌军向川滇边境集中，黔北防守相对空虚；红军东渡后夺取娄山关、遵义。',
    route: 'M 218 160 C 246 188, 358 214, 460 228 S 616 245, 708 266',
    markerY: 228,
  },
  {
    number: '03',
    title: '三渡 · 再西进',
    date: '1935.03.16—03.17',
    direction: '经茅台向川南',
    closeView: '队伍又来到河边。这一次，渡河行动并不隐蔽。',
    fullView: '红军在茅台及附近西渡并大张旗鼓行军，牵动敌军再次调整部署。',
    route: 'M 708 266 C 640 295, 548 327, 460 342 S 316 363, 218 376',
    markerY: 342,
  },
  {
    number: '04',
    title: '四渡 · 秘密东返',
    date: '1935.03.21 夜—03.22',
    direction: '东返后转向乌江',
    closeView: '夜里再过赤水。直到后来，你才看清前几次往返连成的全局。',
    fullView: '主力隐蔽、迅速地东渡赤水，随后向南渡过乌江，摆脱原有包围态势。',
    route: 'M 218 376 C 308 405, 377 435, 460 452 S 624 476, 708 480',
    markerY: 452,
  },
];

export const recapSource = {
  title: '新华社：《毛泽东为什么称四渡赤水是他的“得意之笔”？》',
  url: 'https://www.xinhuanet.com/politics/2016-08/12/c_1119380984.htm',
};
