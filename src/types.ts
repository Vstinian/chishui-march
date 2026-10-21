export type ActId = 'act01' | 'act02' | 'act03' | 'act04' | 'act05';

export interface ActAssets {
  scene: string | null;
  character: string | null;
}

export interface Act {
  id: ActId;
  title: string;
  subtitle: string;
  story: string[];
  interaction: MiniGame;
  assets: ActAssets;
  sourceIds: string[];
  nextAct: ActId | null;
  dialogue: DialogueLine[];
}

export type CharacterId = 'qingshan' | 'laolei' | 'xiaoman' | 'ahu' | 'instructor' | 'wounded';
export interface Character { name: string; role: string; portrait: string | null; expressions: Record<string, string | null>; }
export interface DialogueLine {
  id: string; shot: string; sceneId: string; scene: string;
  speaker: CharacterId; speakerLabel: string; narration: boolean; expression: string;
  text: string;
  // 制作提示：旁白为画外音/环境声口径，不用于截断正文或自动驱动人物动作。
  performance: string; originalPosition: string;
  camera: string; sound: string; trigger: string; nextId: string;
  provenance: string; status: 'pending' | 'verified';
  inner: boolean;
  subtitleLines: string[];
  longPauses: number[];
}
export interface MiniGame {
  kind: 'bridge' | 'fog' | 'climb' | 'rescue' | 'crossing';
  title: string;
  instruction: string;
  objective: string;
  success: string[];
  completion: string;
  source: string;
  afterLine: number;
}
export interface GameProgress {
  steps: number; selected: string | null; feedback: string;
  mistakes?: number; moves?: number; hints?: number;
  rotation?: number; explored?: number[]; scouting?: boolean;
  recalling?: boolean; balance?: number; observed?: boolean;
}

export interface SourceCard {
  id: string;
  title: string;
  summary: string;
  citation: string | null;
  status: 'pending' | 'verified';
  links?: { title: string; url: string; checked: boolean }[];
  reviewLabel?: string;
}
