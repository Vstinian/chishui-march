const warmedImages = new Set<string>();
// 只预取即将使用的少量图片，避免一次下载五幕全部资源。
export function warmImages(urls: (string | null | undefined)[]): void {
  if (typeof Image === 'undefined') return;
  for (const url of urls) {
    if (!url || warmedImages.has(url)) continue;
    warmedImages.add(url);
    const image = new Image(); image.decoding = 'async'; image.src = url;
  }
}
