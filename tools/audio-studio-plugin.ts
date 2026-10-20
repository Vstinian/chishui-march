import type { Plugin } from 'vite';
import path from 'node:path';
import { readFile, access } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { atomicJson, readJson, digest, importSound, scanSounds } from './audio-library.mjs';

export function audioStudioPlugin(): Plugin {
  const token = randomUUID();
  let saving = false;
  return {
    name: 'local-audio-studio',
    configureServer(server) {
      const root = server.config.root;
      const configFile = path.join(root, 'public/audio/cues.json');
      server.watcher.add(path.join(root, 'public/audio'));
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/__audio-studio/')) return next();
        const reply = (code: number, data: unknown) => { res.statusCode = code; res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify(data)); };
        const loopback = ['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress ?? '');
        if (!loopback) return reply(403, { error: '编排与写回仅允许在本机打开' });
        if (req.headers.origin && req.headers.origin !== `http://${req.headers.host}`) return reply(403, { error: '请求来源不匹配' });
        try {
          const endpoint = req.url.split('?')[0];
          if (req.method === 'GET' && endpoint === '/__audio-studio/state') {
            const bytes = await readFile(configFile);
            return reply(200, { token, revision: digest(bytes), config: JSON.parse(bytes.toString()), library: await readJson(path.join(root, 'public/audio/library.json'), []) });
          }
          if (req.method !== 'POST' || req.headers['x-studio-token'] !== token) return reply(403, { error: '请刷新本机编排器后重试' });
          if (saving) return reply(409, { error: '另一次写入正在进行，请稍后保存' });
          saving = true;
          try {
            const parts: Buffer[] = []; let length = 0;
            const limit = endpoint.endsWith('/import') ? 64 * 1024 * 1024 : 2 * 1024 * 1024;
            for await (const chunk of req) { length += chunk.length; if (length > limit) return reply(413, { error: '上传内容过大' }); parts.push(chunk); }
            const body = Buffer.concat(parts);
            if (endpoint === '/__audio-studio/save') {
              const payload = JSON.parse(body.toString());
              const before = await readFile(configFile);
              if (digest(before) !== payload.revision) return reply(409, { error: '项目文件已被其他窗口或成员修改，请先导出草稿，再重新读取项目' });
              const { script } = await server.ssrLoadModule('/src/data/script.ts');
              const { validateSoundConfig } = await server.ssrLoadModule('/src/sound/schema.ts');
              const errors: string[] = validateSoundConfig(payload.config, script);
              if (errors.length) return reply(422, { error: errors.join('\n') });
              for (const cue of payload.config.cues) await access(path.join(root, 'public', cue.asset));
              await atomicJson(path.join(root, 'art-source/audio/cues.previous.json'), JSON.parse(before.toString()));
              await atomicJson(configFile, payload.config);
              return reply(200, { revision: digest(await readFile(configFile)), savedAt: new Date().toISOString() });
            }
            if (endpoint === '/__audio-studio/import') {
              const name = decodeURIComponent(String(req.headers['x-audio-name'] ?? 'audio.wav'));
              const asset = await importSound(root, path.basename(name), body);
              return reply(200, { asset });
            }
            if (endpoint === '/__audio-studio/scan') return reply(200, { assets: await scanSounds(root) });
            reply(404, { error: '未知操作' });
          } finally { saving = false; }
        } catch (error) { reply(400, { error: error instanceof Error ? error.message : '操作失败' }); }
      });
    },
    hotUpdate(context) {
      if (/\/public\/(audio|assets\/audio)\//.test(context.file.replaceAll('\\', '/'))) return [];
    },
  };
}
