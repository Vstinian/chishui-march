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
      "instruction": "每段依次完成「掩护、攀登、伏低、跟进」，共六段。点错回到上一段起点；第一段点错从本段起点重来。",
      "objective": "听清当前口令，走完六段、共二十四步。",
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

// 按团队《史料札记内容》补入；网页核对与待核书目分开标明，详见 docs/本轮修改记录.md。
export const sourceCards: Record<string, SourceCard> = {
  "source-act01": {
    "id": "source-act01",
    "title": "青杠坡与一渡",
    "summary": "1935年1月28日，红军在贵州习水土城青杠坡与川军交战。原计划北渡长江，因实际敌情超出预判、战斗陷入僵持，中革军委决定撤出战斗。\n\n1月28日夜至29日拂晓，红军脱离战场；1月29日凌晨，主力从土城、元厚（猿猴场）等渡口西渡赤水河，向川南古蔺、叙永地区机动。这是四渡赤水的开端。",
    "citation": "《红军长征史》，中共党史出版社，2006版，P172-P178\n《四渡赤水》，谭智勇，人民出版社，2014版，P42-P51",
    "status": "pending",
    "reviewLabel": "网页已核对 · 书目页码待复核",
    "links": [
      {
        "title": "中央党史和文献研究院 · 中央红军长征在贵州",
        "url": "https://www.dswxyjy.org.cn/n1/2026/0722/c244516-40765893.html",
        "checked": true
      }
    ]
  },
  "source-act02": {
    "id": "source-act02",
    "title": "扎西整编与二渡",
    "summary": "1935年2月上旬，中央红军在云南威信扎西地区集结。扎西会议期间，部队精简编制、充实基层连队，以适应机动作战。面对敌军合围，中革军委决定回师东进。\n\n二渡赤水：1935年2月18—21日，红军经太平渡、二郎滩、九溪口等渡口东渡赤水河，重返黔北，继而攻占娄山关、再占遵义。",
    "citation": "《红军长征史》，中共党史出版社，2006版，P182-P189\n《四渡赤水》，谭智勇，人民出版社，2014版，P67-P76",
    "status": "pending",
    "reviewLabel": "网页已核对 · 书目页码待复核",
    "links": [
      {
        "title": "人民网 · 原文档所列参考链接",
        "url": "http://military.people.com.cn/GB/n1/2016/0731/c406225-28598421.html",
        "checked": false
      },
      {
        "title": "补充核对 · 四渡赤水 神来之笔",
        "url": "http://cpc.people.com.cn/BIG5/n1/2026/0903/c443712-40791573.html",
        "checked": true
      }
    ]
  },
  "source-act03": {
    "id": "source-act03",
    "title": "娄山关与遵义",
    "summary": "娄山关战斗：1935年2月25—26日，红军在贵州遵义娄山关作战，打开了通向遵义的道路。\n\n遵义战役：2月27—28日，红军乘胜进攻并收复遵义，取得长征以来的一次重大胜利。具体战果统计须区分整个战役与单场战斗。\n\n叙事边界：娄山关战斗和遵义战役属于二渡赤水之后的作战成果，不是此前1935年1月召开的遵义会议。",
    "citation": "《红军长征史》，中共党史出版社，2006版，P190-P196\n《四渡赤水》，谭智勇，人民出版社，2014版，P81-P90",
    "status": "pending",
    "reviewLabel": "网页已核对 · 书目页码待复核",
    "links": [
      {
        "title": "中央党史和文献研究院 · 中央红军长征在贵州",
        "url": "https://www.dswxyjy.org.cn/n1/2026/0722/c244516-40765893.html",
        "checked": true
      },
      {
        "title": "补充核对 · 四渡赤水 神来之笔",
        "url": "http://cpc.people.com.cn/BIG5/n1/2026/0903/c443712-40791573.html",
        "checked": true
      }
    ]
  },
  "source-act04": {
    "id": "source-act04",
    "title": "鲁班场与三渡",
    "summary": "先后顺序：鲁班场战斗 → 三渡赤水。\n\n1935年3月15日，红军在贵州仁怀鲁班场进攻周浑元部，未能攻克，随后转向茅台地区机动。\n\n3月16—17日，红军从茅台及附近渡口西渡赤水河，再入川南，制造北渡长江的态势，调动敌军向西追击。",
    "citation": "《红军长征史》，中共党史出版社，2006版，P198-P204\n《四渡赤水》，谭智勇，人民出版社，2014版，P102-P110",
    "status": "pending",
    "reviewLabel": "网页已核对 · 书目页码待复核",
    "links": [
      {
        "title": "人民网党史 · 原文档所列参考链接",
        "url": "http://dangshi.people.com.cn/n1/2016/1006/c85037-28757551.html",
        "checked": false
      },
      {
        "title": "补充核对 · 中央红军长征在贵州",
        "url": "https://www.dswxyjy.org.cn/n1/2026/0722/c244516-40765893.html",
        "checked": true
      },
      {
        "title": "补充核对 · 四渡赤水 神来之笔",
        "url": "http://cpc.people.com.cn/BIG5/n1/2026/0903/c443712-40791573.html",
        "checked": true
      }
    ]
  },
  "source-act05": {
    "id": "source-act05",
    "title": "四渡与南行",
    "summary": "四渡赤水：1935年3月21日夜至22日，红军从二郎滩、太平渡、淋滩等渡口再次东渡赤水河。\n\n三渡后，红军将敌军主力调向川南，再隐蔽东返、穿插南下。随后主力南渡乌江、威逼贵阳，调出滇军，为西进云南创造条件。\n\n四渡后的南行是后续机动的一部分；最终摆脱大规模围追堵截，还包括后来巧渡金沙江的过程。",
    "citation": "《红军长征史》，中共党史出版社，2006版，P205-P211\n《四渡赤水》，谭智勇，人民出版社，2014版，P114-P123",
    "status": "pending",
    "reviewLabel": "网页已核对 · 书目页码待复核",
    "links": [
      {
        "title": "中国共产党新闻网 · 四渡赤水 神来之笔",
        "url": "http://cpc.people.com.cn/BIG5/n1/2026/0903/c443712-40791573.html",
        "checked": true
      },
      {
        "title": "补充核对 · 中央红军长征在贵州",
        "url": "https://www.dswxyjy.org.cn/n1/2026/0722/c244516-40765893.html",
        "checked": true
      }
    ]
  }
};
