import type { Act, SourceCard } from '../types';
import { script } from './script';

// afterLine 指向互动完成后的第一句，正文按 PDF 顺序播放。
export const acts: Act[] = [
  {
    "id": "act01",
    "title": "青杠坡撤离与一渡",
    "subtitle": "第一幕 · 河岸",
    "interaction": {
      "kind": "bridge",
      "title": "雨夜架桥",
      "instruction": "点一下岸边的门板，再点一下水面上标亮的桥位。",
      "objective": "取三块门板，依次放上桥位。",
      "success": [
        "门板卡进了桥桩，稳住了。",
        "又一块扣上了，桥面在往前伸。",
        "水路接上了，队伍能过。"
      ],
      "completion": "桥搭好了，三万人从这门板上过去。",
      "source": "S1 · 集合版互动",
      "afterLine": 25
    },
    "dialogue": script.filter(line => line.id.startsWith('A01-')),
    "story": [],
    "assets": {
      "scene": null,
      "character": null
    },
    "sourceIds": [
      "source-act01"
    ],
    "nextAct": "act02"
  },
  {
    "id": "act02",
    "title": "扎西整编与二渡",
    "subtitle": "第二幕 · 夜路",
    "interaction": {
      "kind": "fog",
      "title": "循声归队",
      "instruction": "点相邻的格子往前走，探过的路会亮起来。",
      "objective": "探明相邻的格子，找到归队的那一格。",
      "success": [
        "这一格是实地，踩得稳。",
        "探到队伍的脚印了，跟上去。",
        "方向对了，前头有人声。"
      ],
      "completion": "雾里摸出一条路，你跟上了队伍。",
      "source": "S3 · 集合版互动",
      "afterLine": 19
    },
    "dialogue": script.filter(line => line.id.startsWith('A02-')),
    "story": [],
    "assets": {
      "scene": null,
      "character": null
    },
    "sourceIds": [
      "source-act02"
    ],
    "nextAct": "act03"
  },
  {
    "id": "act03",
    "title": "娄山关与遵义",
    "subtitle": "第三幕 · 山口",
    "interaction": {
      "kind": "climb",
      "title": "越过山口",
      "instruction": "屏幕上依次出现口令，按顺序点对应的按钮。听错口令会滑下一段。",
      "objective": "按口令顺序，完成六道口令。",
      "success": [
        "掩护到位了。",
        "攀登的步子踩稳了。",
        "伏低、跟进，跟上去了。"
      ],
      "completion": "六道口令走完，红旗就在你眼前。",
      "source": "S4 · 集合版互动",
      "afterLine": 8
    },
    "dialogue": script.filter(line => line.id.startsWith('A03-')),
    "story": [],
    "assets": {
      "scene": null,
      "character": null
    },
    "sourceIds": [
      "source-act03"
    ],
    "nextAct": "act04"
  },
  {
    "id": "act04",
    "title": "鲁班场与三渡",
    "subtitle": "第四幕 · 渡口",
    "interaction": {
      "kind": "rescue",
      "title": "把战友带回掩体",
      "instruction": "先点战友锁定，再点掩体把他拖过来。",
      "objective": "选中战友，再移到掩体，分三段完成。",
      "success": [
        "第一段拖过水沟了。",
        "第二段拖到了掩体后。",
        "第三段，快到了。"
      ],
      "completion": "三段拖完，战友回到了掩体后面。",
      "source": "S5 · 集合版互动",
      "afterLine": 5
    },
    "dialogue": script.filter(line => line.id.startsWith('A04-')),
    "story": [],
    "assets": {
      "scene": null,
      "character": null
    },
    "sourceIds": [
      "source-act04"
    ],
    "nextAct": "act05"
  },
  {
    "id": "act05",
    "title": "四渡：夜行东返",
    "subtitle": "第五幕 · 夜渡",
    "interaction": {
      "kind": "crossing",
      "title": "再向前一步",
      "instruction": "轻点一下，即向前走一步，共八步。",
      "objective": "不出声地走完八步，渡过浮桥。",
      "success": [
        "第一步，木板没响。",
        "第四步，稳住了。",
        "最后一步，上岸了。"
      ],
      "completion": "八步走完，你到了对岸。",
      "source": "S6 · 集合版互动",
      "afterLine": 5
    },
    "dialogue": script.filter(line => line.id.startsWith('A05-')),
    "story": [],
    "assets": {
      "scene": null,
      "character": null
    },
    "sourceIds": [
      "source-act05"
    ],
    "nextAct": null
  }
];

export const sourceCards: Record<string, SourceCard> = {
  'source-act01': { id: 'source-act01', title: '青杠坡与一渡', summary: '待核：事件时间、地点、撤离与渡河顺序。', citation: null, status: 'pending' },
  'source-act02': { id: 'source-act02', title: '扎西整编与二渡', summary: '待核：整编与二渡回师的时间、地点和表述。', citation: null, status: 'pending' },
  'source-act03': { id: 'source-act03', title: '娄山关与遵义', summary: '待核：相关事件日期、地点和叙事边界。', citation: null, status: 'pending' },
  'source-act04': { id: 'source-act04', title: '鲁班场与三渡', summary: '待核：鲁班场、三渡茅台的地点与先后顺序。', citation: null, status: 'pending' },
  'source-act05': { id: 'source-act05', title: '四渡与南行', summary: '待核：四渡的时间、渡口、夜渡与后续南行的叙事表述。', citation: null, status: 'pending' },
};
