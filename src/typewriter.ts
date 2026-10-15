// 打字进度独立于 DOM，打开目录、切换声音或重新渲染都不会重播当前句。
export class Typewriter {
  private key = '';
  private characters: string[] = [];
  private visible = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private paint: (visible: string, remaining: string) => void = () => {};

  get typing(): boolean { return this.visible < this.characters.length; }

  bind(key: string, text: string, paint: (visible: string, remaining: string) => void, instant = false): void {
    this.pause();
    if (key !== this.key) {
      this.key = key;
      this.characters = Array.from(text);
      this.visible = 0;
    }
    this.paint = paint;
    if (instant) this.visible = this.characters.length;
    this.draw();
    this.schedule();
  }

  reveal(): boolean {
    if (!this.typing) return false;
    this.pause();
    this.visible = this.characters.length;
    this.draw();
    return true;
  }

  pause(): void { clearTimeout(this.timer); this.timer = undefined; }

  reset(): void {
    this.pause(); this.key = ''; this.characters = []; this.visible = 0;
    this.paint = () => {};
  }

  private draw(): void {
    this.paint(this.characters.slice(0, this.visible).join(''), this.characters.slice(this.visible).join(''));
  }

  private schedule(): void {
    if (!this.typing) return;
    this.timer = setTimeout(() => { this.visible++; this.draw(); this.schedule(); }, 36);
  }
}
