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
  text: string; performance: string; originalPosition: string;
  camera: string; sound: string; trigger: string; nextId: string;
  provenance: string; status: 'pending' | 'verified';
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
export interface GameProgress { steps: number; selected: string | null; feedback: string; }

export interface SourceCard {
  id: string;
  title: string;
  summary: string;
  citation: string | null;
  status: 'pending' | 'verified';
}
