export interface StoryTransition {
  id: string;
  from: string;
  to: string;
  duration: number;
  tone: 'mist' | 'camp' | 'frost' | 'smoke' | 'night' | 'paper';
  lines: string[];
  artDirection: string;
  soundDirection: string;
  musicLevel: number;
}

// 依据补充稿；地理、时间压缩及东西渡方向经用户确认校正。
export const storyTransitions: Record<string, StoryTransition> = {
  'TR-00': {
    id: 'TR-00', from: 'opening', to: 'a01-bg01', duration: 1500, tone: 'mist', musicLevel: 1,
    lines: ['报纸上的字，慢慢淡下去；', '风一吹，河谷的雾，飘了起来。', '我的路，从那片雾里，开始了。'],
    artDirection: '灰度报纸层向河谷雾层叠化；雾极缓右移，暗红微透。',
    soundDirection: '纸张摩擦淡出，松林风与山涧水淡入；BGM 延续。',
  },
  'TR-12': {
    id: 'TR-12', from: 'a01-bg04', to: 'a02-bg01', duration: 1500, tone: 'camp', musicLevel: .8,
    lines: ['过了河，队伍一路辗转。', '走到扎西，我头一回，', '睡了个整觉。'],
    artDirection: '雨夜浮桥向扎西营地叠化；半透明雨层下移，冷灰转米黄。',
    soundDirection: '雨与水声交叉淡出，柴火与雨落帐篷淡入；BGM 稍缓。',
  },
  'TR-23': {
    id: 'TR-23', from: 'a02-bg03', to: 'a03-bg01', duration: 1800, tone: 'frost', musicLevel: 1,
    lines: ['往东，再往东。', '雾散的那天，', '前头立着一道关——娄山关。'],
    artDirection: '雾中行军道向晨霜崖壁叠化；缓推静态崖壁，冷青配暗红。',
    soundDirection: '脚步声渐隐，山风与远处口令淡入；BGM 延续。',
  },
  'TR-34': {
    id: 'TR-34', from: 'a03-bg02', to: 'a04-bg01', duration: 1500, tone: 'smoke', musicLevel: .85,
    lines: ['离开遵义，又走了些日子。', '下一仗的地方，叫鲁班场。'],
    artDirection: '遵义街市向硝烟山岗叠化；半透明烟层缓升，色彩压向暗红。',
    soundDirection: '市井人声淡出，远处炮声与机枪声淡入；BGM 压低。',
  },
  'TR-45': {
    id: 'TR-45', from: 'a04-bg02', to: 'a05-bg01', duration: 1800, tone: 'night', musicLevel: .35,
    lines: ['从茅台西渡后，没过几天，', '队伍又回到了河边。', '这一回，没人吹号，没人点灯。'],
    artDirection: '白昼河滩向深夜浮桥叠化；整体压暗，水面留一线微光。',
    soundDirection: '河水声延续，飞机声止；BGM 收至极轻。',
  },
  'TR-5E': {
    id: 'TR-5E', from: 'a05-bg02', to: 'recap', duration: 1800, tone: 'paper', musicLevel: .45,
    lines: ['晨光爬上山脊，', '把影子拉得很长。', '五幕行军，走过那个春天。'],
    artDirection: '黎明河岸向史料版面叠化；晨光缓扫，暗调渐亮至米黄。',
    soundDirection: 'BGM 收束延续，环境音渐弱至零。',
  },
};

// 素材到位后填写相对 URL，播放器会在对应场景间交叉淡化。
export const ambientTracks: Record<string, string | null> = {
  opening: null, 'a01-bg01': null, 'a02-bg01': null, 'a03-bg01': null,
  'a04-bg01': null, 'a05-bg01': null, recap: null,
};
