// 网页发布用规格；原始素材不受影响。修改规格时会改变缓存键和资源 URL。
export function audioEncoding(source) {
  const voice = source.startsWith('audio/voice/');
  return { version: 1, codec: 'mp3', bitrateKbps: voice ? 64 : 96, sampleRate: 44100, channels: voice ? 1 : 'source' };
}
export function audioEncodingArgs(source) {
  const profile = audioEncoding(source);
  return ['-vn', '-map_metadata', '-1', '-ar', String(profile.sampleRate),
    ...(profile.channels === 1 ? ['-ac', '1'] : []),
    '-c:a', 'libmp3lame', '-b:a', `${profile.bitrateKbps}k`];
}
