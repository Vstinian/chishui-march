import type { Act, SourceCard } from '../types';

// 五幕占位文案。内容组定稿、史实组核对后，统一在此替换。
export const acts: Act[] = [
  {
    id: 'act01',
    title: '青杠坡撤离与一渡',
    subtitle: '第一幕 · 河岸',
    story: [
      '队伍接到新的行军命令。你只能看见脚下的山路和前方的河岸。',
      '出发前，背包还能留下一件东西。你会带什么？',
    ],
    interaction: {
      kind: 'choice',
      prompt: '选择一件随身物品',
      options: [
        { id: 'shoes', label: '备用草鞋', feedback: '你把草鞋系紧，跟上前方的队伍。' },
        { id: 'grain', label: '干粮袋', feedback: '你摸了摸干粮袋，继续向河岸走去。' },
        { id: 'cloth', label: '一块布条', feedback: '你收好布条，准备应对漫长的山路。' },
      ],
    },
    assets: { scene: null, character: null },
    sourceIds: ['source-act01'],
    nextAct: 'act02',
  },
  {
    id: 'act02',
    title: '扎西整编与二渡',
    subtitle: '第二幕 · 夜路',
    story: [
      '夜里，命令沿着队伍向后传来。方向变了，原因却无人解释。',
      '沿路有几处模糊的路标。点开它们，拼出你所知道的行程。',
    ],
    interaction: {
      kind: 'reveal',
      prompt: '查看全部路标',
      options: [
        { id: 'sign-1', label: '路标一', feedback: '你记下刚走过的路。具体地名等待史实组核对。' },
        { id: 'sign-2', label: '路标二', feedback: '新的命令传来，队伍再次调整方向。' },
        { id: 'sign-3', label: '路标三', feedback: '眼前只有下一段山路，全局路线仍未显现。' },
      ],
    },
    assets: { scene: null, character: null },
    sourceIds: ['source-act02'],
    nextAct: 'act03',
  },
  {
    id: 'act03',
    title: '娄山关与遵义',
    subtitle: '第三幕 · 山口',
    story: [
      '山口前，战友和你并肩停了一会儿。短短几句话，足以让人记住彼此。',
      '你可以回应他。你们的对话会改变，已经发生的历史不会。',
    ],
    interaction: {
      kind: 'choice',
      prompt: '回应战友',
      options: [
        { id: 'encourage', label: '“跟紧队伍。”', feedback: '战友点了点头，整理好行装。' },
        { id: 'listen', label: '先听他说完', feedback: '你听完他的担忧，随后一起上路。' },
      ],
    },
    assets: { scene: null, character: null },
    sourceIds: ['source-act03'],
    nextAct: 'act04',
  },
  {
    id: 'act04',
    title: '鲁班场与三渡',
    subtitle: '第四幕 · 渡口',
    story: [
      '村落里流传着各种说法。你手里的命令仍然简短，行动的全貌并不清楚。',
      '面对传闻和亲见，你想先查看哪一条线索？',
    ],
    interaction: {
      kind: 'choice',
      prompt: '选择查看的线索',
      options: [
        { id: 'rumor', label: '听到的传闻', feedback: '传闻并不能说明行动意图。请继续查看史料卡。' },
        { id: 'witness', label: '亲眼所见', feedback: '你看到队伍向渡口集结，但仍无法看到全局。' },
      ],
    },
    assets: { scene: null, character: null },
    sourceIds: ['source-act04'],
    nextAct: 'act05',
  },
  {
    id: 'act05',
    title: '四渡与全局复盘',
    subtitle: '第五幕 · 全图',
    story: [
      '走出局部视角，回看四次渡河节点。这里先展示可操作的路线示意。',
      '节点的准确日期、渡口和地图坐标须经史实组核对后再替换。',
    ],
    interaction: {
      kind: 'reveal',
      prompt: '依次查看四次渡河节点',
      options: [
        { id: 'crossing-1', label: '一渡', feedback: '第一处节点已展开。日期与渡口待核。' },
        { id: 'crossing-2', label: '二渡', feedback: '第二处节点已展开。日期与渡口待核。' },
        { id: 'crossing-3', label: '三渡', feedback: '第三处节点已展开。日期与渡口待核。' },
        { id: 'crossing-4', label: '四渡', feedback: '第四处节点已展开。日期与渡口待核。' },
      ],
    },
    assets: { scene: null, character: null },
    sourceIds: ['source-act05'],
    nextAct: null,
  },
];

export const sourceCards: Record<string, SourceCard> = {
  'source-act01': { id: 'source-act01', title: '青杠坡与一渡', summary: '待核：事件时间、地点、撤离与渡河顺序。', citation: null, status: 'pending' },
  'source-act02': { id: 'source-act02', title: '扎西整编与二渡', summary: '待核：整编与二渡回师的时间、地点和表述。', citation: null, status: 'pending' },
  'source-act03': { id: 'source-act03', title: '娄山关与遵义', summary: '待核：相关事件日期、地点和叙事边界。', citation: null, status: 'pending' },
  'source-act04': { id: 'source-act04', title: '鲁班场与三渡', summary: '待核：鲁班场、三渡茅台的地点与先后顺序。', citation: null, status: 'pending' },
  'source-act05': { id: 'source-act05', title: '四渡路线', summary: '待核：四次渡河的日期、渡口、路线和结论来源。', citation: null, status: 'pending' },
};
