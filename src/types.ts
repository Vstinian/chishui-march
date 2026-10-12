export type ActId = 'act01' | 'act02' | 'act03' | 'act04' | 'act05';

export interface InteractionOption {
  id: string;
  label: string;
  feedback: string;
}

export interface Interaction {
  kind: 'choice' | 'reveal';
  prompt: string;
  options: InteractionOption[];
}

export interface ActAssets {
  scene: string | null;
  character: string | null;
}

export interface Act {
  id: ActId;
  title: string;
  subtitle: string;
  story: string[];
  interaction: Interaction;
  assets: ActAssets;
  sourceIds: string[];
  nextAct: ActId | null;
}

export interface SourceCard {
  id: string;
  title: string;
  summary: string;
  citation: string | null;
  status: 'pending' | 'verified';
}
