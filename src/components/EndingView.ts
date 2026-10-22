import { ending } from '../data/narrative';
import { escapeHtml } from '../utils/html';

export function renderEnding(): string {
  return `<main id="main-content" class="ending-screen" tabindex="-1"><div class="ending-card paper-panel">
    <span class="eyebrow">五幕终 · 记忆仍在</span><h1>纸上的线<br>脚下的路</h1>
    ${ending.paragraphs.map(text => `<p>${escapeHtml(text)}</p>`).join('')}
    <section class="ending-correspondence" aria-labelledby="letter-title">
      <div class="letter-section-heading"><span class="tiny-label">行军书信 · 留给青山</span><h2 id="letter-title">${escapeHtml(ending.letterTitle)}</h2><small>文学虚构 · 非史料原件</small></div>
      <details class="letter-envelope">
        <summary aria-label="展开或收起连队指导员的信">
          <span class="envelope-back" aria-hidden="true"></span><span class="envelope-flap" aria-hidden="true"></span><span class="envelope-fold" aria-hidden="true"></span>
          <span class="envelope-address">邓青山同志 <span>亲启</span></span><span class="envelope-seal" aria-hidden="true">信</span>
          <span class="envelope-prompt"><span class="when-closed">轻触拆信</span><span class="when-open">收起信纸</span><span aria-hidden="true"> ↗</span></span>
        </summary>
        <article class="letter-paper" aria-label="连队指导员的信正文">
          <div class="letter-paper-rule" aria-hidden="true"></div>
          ${ending.letter.map((text, index) => `<p class="${index === 0 ? 'letter-salutation' : 'letter-paragraph'}">${escapeHtml(text)}</p>`).join('')}
          <footer class="letter-signature"><p>连队指导员</p><p>一九三五年 · 金沙江畔</p></footer>
        </article>
      </details>
    </section>
    <p class="review-note">人物与对白为文学虚构；历史事件与数字待史实组逐项复核。</p>
    <div class="ending-actions"><button class="primary-button" data-action="recap">再看全图</button><button class="secondary-button" data-action="restart">重新开始</button></div>
  </div></main>`;
}
