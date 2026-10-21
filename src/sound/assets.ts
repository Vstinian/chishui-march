import type { SoundAsset, SoundConfig } from './schema';

// 源文件同路径的新版本接替旧文件，仅迁移引用，保留每条编排的参数。
export function replaceSoundAssets(config: SoundConfig, assets: SoundAsset[]): number {
  const replacements = new Map<string, string>();
  for (const asset of assets) for (const previous of asset.previousPaths ?? []) replacements.set(previous, asset.path);
  let updated = 0;
  for (const cue of config.cues) {
    const next = replacements.get(cue.asset);
    if (next && next !== cue.asset) { cue.asset = next; updated++; }
  }
  return updated;
}
