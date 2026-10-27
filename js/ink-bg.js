/* =========================================================
   棲白 QIBAI Studio — ink-bg.js
   全站水墨背景：竹 → 梅 → 松，隨著捲動自然替換
   - 開場與設計理念：竹（竹竿由下往上一節一節長出，竹葉展開後隨風輕擺）
   - 專案圖庫與空間導覽：梅（枝幹一筆一筆畫出，梅花綻放，花瓣緩緩飄落）
   - 服務流程與預約：松（橫生的松枝畫出，松針一簇一簇展開）
   畫作是用程式「畫」出來的 SVG：用固定的亂數種子，所以每次打開都長得一樣。
   ========================================================= */

(function () {
  'use strict';

  const layer = document.querySelector('.ink-bg');
  if (!layer) return;

  const NS = 'http://www.w3.org/2000/svg';
  const INK = '#1F1D1B';
  const hasGsap = !!window.gsap;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animate = hasGsap && !reduce;

  /* ---------- 工具 ---------- */

  // 固定種子的亂數：同一個種子每次都產生同樣的數字序列
  function seeded(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function el(tag, attrs, parent) {
    const node = document.createElementNS(NS, tag);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(node);
    return node;
  }

  function makeSvg(cls, w, h) {
    const svg = el('svg', { class: 'ink-painting ' + cls, viewBox: `0 0 ${w} ${h}`, 'aria-hidden': 'true' });
    layer.appendChild(svg);
    return svg;
  }

  // 毛筆線條：沿著一串點，畫出由粗到細的筆觸（每一小段一條線，粗細逐段遞減）
  // 回傳每一小段，之後用來做「一筆一筆畫出來」的動畫
  function brush(parent, pts, w0, w1, opacity) {
    const segs = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const t = i / Math.max(1, pts.length - 2);
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[i + 1];
      const seg = el('path', {
        d: `M${x0.toFixed(1)} ${y0.toFixed(1)} L${x1.toFixed(1)} ${y1.toFixed(1)}`,
        stroke: INK,
        'stroke-width': (w0 + (w1 - w0) * t).toFixed(2),
        'stroke-linecap': 'round',
        fill: 'none',
        opacity
      }, parent);
      seg._len = Math.hypot(x1 - x0, y1 - y0);
      segs.push(seg);
    }
    return segs;
  }

  // 把一串線段加進時間軸：依序畫出（像筆在紙上移動）
  function drawInto(tl, segs, start, speed) {
    let t = start;
    segs.forEach((s) => {
      const len = s._len + 1;
      s.setAttribute('stroke-dasharray', len);
      s.setAttribute('stroke-dashoffset', len);
      const d = len / speed;
      tl.to(s, { attr: { 'stroke-dashoffset': 0 }, duration: d, ease: 'none' }, t);
      t += d;
    });
    return t;   // 回傳畫完的時間
  }

  // 共用濾鏡：乾筆的粗糙邊緣、遠景的模糊、松針下的淡墨
  const defsSvg = el('svg', { width: 0, height: 0, 'aria-hidden': 'true', style: 'position:absolute' }, layer);
  defsSvg.innerHTML = `
    <filter id="brushRough" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="1" seed="5" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="3" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <filter id="farBlur"><feGaussianBlur stdDeviation="2.2"/></filter>
    <filter id="washBlur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10"/></filter>`;

  /* =====================================================
     竹
     ===================================================== */
  function paintBamboo() {
    const r = seeded(17);
    const W = 600, H = 1000;
    const svg = makeSvg('bamboo', W, H);
    const art = el('g', { opacity: 0.34 }, svg);
    const tl = gsap.timeline({ paused: true });
    const sway = [];

    // [x, 傾斜, 粗細, 竹梢高度, 濃淡, 是否為遠景]
    const stalks = [
      [250, 0.06, 10, 380, 0.5, true],
      [370, -0.03, 17, 110, 0.95, false],
      [470, 0.02, 13, 240, 0.75, false]
    ];

    stalks.forEach(([x0, lean, w, top, tone, far], si) => {
      const g = el('g', { filter: far ? 'url(#farBlur)' : 'url(#brushRough)' }, art);
      const xAt = (y) => x0 + lean * (H - y) + Math.sin(y / 180) * 3;
      let y = H + 10;
      let t = si * 0.35;
      let nodeIndex = 0;

      while (y > top) {
        const segLen = 95 + r() * 45;
        const y2 = Math.max(top, y - segLen);
        // 竹節之間留一點空隙
        const pts = [];
        for (let k = 0; k <= 6; k++) {
          const yy = (y - 4) + ((y2 + 4) - (y - 4)) * (k / 6);
          pts.push([xAt(yy), yy]);
        }
        const seg = brush(g, pts, w, w * 0.94, tone);
        t = drawInto(tl, seg, t, 420);

        // 竹節：一道短短的深色弧線
        const nx = xAt(y2);
        const node = el('path', {
          d: `M${nx - w / 2 - 4} ${y2 + 2} Q${nx} ${y2 - 4} ${nx + w / 2 + 4} ${y2 + 2}`,
          stroke: INK, 'stroke-width': 3.2, fill: 'none', 'stroke-linecap': 'round', opacity: Math.min(1, tone + 0.1)
        }, g);
        tl.from(node, { opacity: 0, duration: 0.2 }, t);

        // 上半部的竹節長出細枝與竹葉
        if (!far && y2 < H * 0.62 && r() < 0.75) {
          const side = nodeIndex % 2 ? 1 : -1;
          addTwig(nx, y2, side, t, tone);
        }
        nodeIndex++;
        y = y2;
      }
      // 竹梢再長一簇葉子
      if (!far) addLeaves(xAt(top), top, 0, t, tone, 6);
    });

    function addTwig(x, y, side, t0, tone) {
      const g = el('g', { filter: 'url(#brushRough)' }, art);
      const len = 50 + r() * 70;
      const ang = -Math.PI / 2 + side * (0.75 + r() * 0.35);
      const pts = [];
      for (let k = 0; k <= 5; k++) {
        const d = (len * k) / 5;
        pts.push([x + Math.cos(ang) * d + side * Math.sin(k) * 2, y + Math.sin(ang) * d]);
      }
      const t1 = drawInto(tl, brush(g, pts, 3.2, 1.2, tone), t0, 260);
      const [ex, ey] = pts[pts.length - 1];
      addLeaves(ex, ey, side, t1, tone, 4 + Math.floor(r() * 3));
    }

    // 竹葉：細長、尖端下垂的葉片，一簇一簇
    function addLeaves(x, y, side, t0, tone, count) {
      const cluster = el('g', {}, art);
      for (let i = 0; i < count; i++) {
        const L = 75 + r() * 60;
        const Wd = 11 + r() * 6;
        // 竹葉大多往下垂：右邊的往右下、左邊的往左下，同一簇的葉子方向相近
        const base = side === 0 ? (i % 2 ? 30 : 150) : side > 0 ? 40 : 140;
        const angle = base + (i - count / 2) * 16 + (r() - 0.5) * 14;
        const holder = el('g', { transform: `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${angle.toFixed(1)})` }, cluster);
        const leaf = el('path', {
          d: `M0 0 C${L * 0.25} ${-Wd} ${L * 0.65} ${-Wd * 0.7} ${L} 0 C${L * 0.65} ${Wd * 0.25} ${L * 0.25} ${Wd * 0.45} 0 0Z`,
          fill: INK,
          opacity: (tone * (0.55 + r() * 0.45)).toFixed(2)
        }, holder);
        tl.from(leaf, { scale: 0, transformOrigin: '0% 50%', duration: 0.7, ease: 'back.out(1.6)' }, t0 + i * 0.08);
      }
      // 每一簇各自隨風輕擺，速度不同才自然
      sway.push(gsap.to(cluster, {
        rotation: (r() < 0.5 ? -1 : 1) * (2 + r() * 2.5),
        svgOrigin: `${x} ${y}`,
        duration: 2.8 + r() * 2.4,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        paused: true
      }));
    }

    return { svg, grow: tl, sway };
  }

  /* =====================================================
     梅
     ===================================================== */
  function paintPlum() {
    const r = seeded(29);
    const W = 760, H = 620;
    const svg = makeSvg('plum', W, H);
    const art = el('g', { opacity: 0.55 }, svg);
    const branchLayer = el('g', { filter: 'url(#brushRough)' }, art);
    const flowerLayer = el('g', {}, art);
    const petalLayer = el('g', {}, art);
    const tl = gsap.timeline({ paused: true });
    const flowers = [];
    const PETAL = ['#9B3B2E', '#B04A3C', '#C26355'];

    // 梅枝：轉折明顯、像折線一樣的枝幹，粗細由根部到枝梢遞減
    function branch(x, y, ang, len, w, depth, t0) {
      const steps = Math.max(3, Math.round(len / 16));
      const pts = [[x, y]];
      for (let i = 0; i < steps; i++) {
        const jitter = depth === 0 ? 0.16 : 0.35;              // 主枝較穩，細枝較曲折
        ang += (r() - 0.5) * jitter;
        if (r() < (depth === 0 ? 0.1 : 0.18)) ang += (r() < 0.5 ? -1 : 1) * 0.45;   // 梅枝特有的急轉
        if (y < 40) ang += 0.25;                              // 太靠上就往下彎，留在畫面裡
        if (y > H - 40) ang -= 0.25;
        x += Math.cos(ang) * 16;
        y += Math.sin(ang) * 16;
        pts.push([x, y]);
      }
      const segs = brush(branchLayer, pts, w, Math.max(1.2, w * 0.3), depth === 0 ? 0.95 : 0.85);
      const tEnd = drawInto(tl, segs, t0, 300);
      const segDur = (tEnd - t0) / segs.length;

      // 側枝：從主枝中段長出，往上斜
      if (depth < 3) {
        const n = depth === 0 ? 4 : depth === 1 ? 2 : 1;
        for (let c = 0; c < n; c++) {
          const at = Math.floor(steps * (0.25 + r() * 0.6));
          const [bx, by] = pts[at];
          const wAt = w + (Math.max(1.2, w * 0.3) - w) * (at / steps);
          const dir = r() < 0.65 ? -1 : 1;               // 大多往上長
          branch(bx, by, ang + dir * (0.5 + r() * 0.5) - 0.2, len * (0.35 + r() * 0.3), wAt * 0.6, depth + 1, t0 + at * segDur);
        }
      }

      // 梅花：枝梢一定開，枝上隨機開
      const [tx, ty] = pts[pts.length - 1];
      addFlower(tx, ty, tEnd, depth >= 1 ? 1 : 0.8);
      pts.forEach((p, i) => {
        if (i > 2 && depth >= 1 && r() < 0.2) addFlower(p[0] + (r() - 0.5) * 10, p[1] + (r() - 0.5) * 10, t0 + i * segDur, 0.7 + r() * 0.3);
        else if (i > 2 && r() < 0.08) addBud(p[0], p[1], t0 + i * segDur);
      });
    }

    function addFlower(x, y, t, scale) {
      const g = el('g', { transform: `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(r() * 72).toFixed(0)}) scale(${scale.toFixed(2)})` }, flowerLayer);
      const inner = el('g', {}, g);
      const color = PETAL[Math.floor(r() * PETAL.length)];
      for (let i = 0; i < 5; i++) {
        const a = (i * 72 * Math.PI) / 180;
        el('circle', { cx: (Math.cos(a) * 6.5).toFixed(1), cy: (Math.sin(a) * 6.5).toFixed(1), r: (6 + r() * 1.8).toFixed(1), fill: color, opacity: (0.7 + r() * 0.25).toFixed(2) }, inner);
      }
      // 花蕊：細線加小墨點
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + 0.3;
        const ex = Math.cos(a) * 8, ey = Math.sin(a) * 8;
        el('line', { x1: 0, y1: 0, x2: ex.toFixed(1), y2: ey.toFixed(1), stroke: INK, 'stroke-width': 0.6, opacity: 0.8 }, inner);
        el('circle', { cx: ex.toFixed(1), cy: ey.toFixed(1), r: 0.9, fill: INK }, inner);
      }
      el('circle', { r: 2, fill: '#5A1E16' }, inner);
      tl.from(inner, { scale: 0, rotation: -40, transformOrigin: '50% 50%', duration: 0.6, ease: 'back.out(2)' }, t);
      flowers.push([x, y, color]);
    }

    function addBud(x, y, t) {
      const bud = el('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: 3.4, fill: '#7E2E23', opacity: 0.85 }, flowerLayer);
      tl.from(bud, { scale: 0, transformOrigin: '50% 50%', duration: 0.4, ease: 'back.out(2)' }, t);
    }

    // 兩根主枝從左上角伸進來
    branch(-10, 470, -0.42, 720, 26, 0, 0);
    branch(-10, 250, -0.12, 380, 13, 1, 0.6);

    // 花瓣飄落：從某朵花的位置落下，左右飄、旋轉、慢慢變淡
    let petalTimer = null;
    function dropPetal() {
      const [x, y, color] = flowers[Math.floor(Math.random() * flowers.length)];
      const p = el('ellipse', { cx: 0, cy: 0, rx: 4.2, ry: 2.8, fill: color, opacity: 0.8 }, petalLayer);
      const drift = 40 + Math.random() * 120;
      gsap.set(p, { x, y });
      gsap.timeline({ onComplete: () => p.remove() })
        .to(p, { y: y + 380 + Math.random() * 260, duration: 7 + Math.random() * 3, ease: 'none' }, 0)
        .to(p, { x: x + drift, duration: 7, ease: 'sine.inOut' }, 0)
        .to(p, { rotation: 200 + Math.random() * 300, duration: 7, ease: 'none' }, 0)
        .to(p, { opacity: 0, duration: 2.5 }, 5);
      petalTimer = gsap.delayedCall(1 + Math.random() * 1.6, dropPetal);
    }

    return {
      svg,
      grow: tl,
      sway: [],
      start() { if (!petalTimer && flowers.length) petalTimer = gsap.delayedCall(1.5, dropPetal); },
      stop() { if (petalTimer) { petalTimer.kill(); petalTimer = null; } }
    };
  }

  /* =====================================================
     松
     ===================================================== */
  function paintPine() {
    const r = seeded(41);
    const W = 900, H = 640;
    const svg = makeSvg('pine', W, H);
    const art = el('g', { opacity: 0.46 }, svg);
    const washLayer = el('g', { filter: 'url(#washBlur)' }, art);
    const trunkLayer = el('g', { filter: 'url(#brushRough)' }, art);
    const needleLayer = el('g', {}, art);
    const tl = gsap.timeline({ paused: true });
    const sway = [];

    // 主幹：從右邊伸出、向左橫生，先微微下垂再上揚（迎客松的姿態）
    const main = [];
    let x = W + 20, y = 150, ang = Math.PI + 0.1;
    for (let i = 0; i < 46; i++) {
      ang += (r() - 0.5) * 0.12 + (i > 28 ? -0.012 : 0.004);
      x += Math.cos(ang) * 15;
      y += Math.sin(ang) * 15;
      main.push([x, y]);
    }
    main.unshift([W + 20, 150]);
    const mainSegs = brush(trunkLayer, main, 34, 7, 0.95);
    const tMain = drawInto(tl, mainSegs, 0, 360);
    const segDur = tMain / mainSegs.length;

    // 樹皮：沿著枝幹的鱗片狀短弧
    for (let i = 2; i < main.length - 8; i += 2) {
      const [px, py] = main[i];
      const w = 34 - (27 * i) / main.length;
      const off = (r() - 0.5) * w * 0.6;
      const scale = el('path', {
        d: `M${(px - 6).toFixed(1)} ${(py + off).toFixed(1)} q6 ${(-4 - r() * 3).toFixed(1)} 12 0`,
        stroke: '#F5F1EA', 'stroke-width': 1.3, fill: 'none', opacity: 0.55
      }, trunkLayer);
      tl.from(scale, { opacity: 0, duration: 0.3 }, i * segDur + 0.2);
    }

    // 側枝與松針
    for (let i = 6; i < main.length; i += 5 + Math.floor(r() * 3)) {
      const [bx, by] = main[i];
      const up = (i / 5) % 2 < 1;
      const bAng = Math.PI + (up ? -0.9 : 0.55) + (r() - 0.5) * 0.4;
      const len = 60 + r() * 90;
      const pts = [[bx, by]];
      let cx = bx, cy = by, a = bAng;
      for (let k = 0; k < 6; k++) {
        a += (r() - 0.5) * 0.3;
        cx += Math.cos(a) * (len / 6);
        cy += Math.sin(a) * (len / 6);
        pts.push([cx, cy]);
      }
      const t0 = i * segDur;
      const t1 = drawInto(tl, brush(trunkLayer, pts, 7, 2.2, 0.9), t0, 260);
      addNeedles(cx, cy, t1);
      // 枝幹中段也長一簇
      const [mx, my] = pts[3];
      if (r() < 0.6) addNeedles(mx, my - 6, t0 + 0.4, 0.75);
    }
    addNeedles(main[main.length - 1][0], main[main.length - 1][1], tMain, 1.15);

    // 松針：放射狀的細線排成扇形，下方墊一層淡墨，表現松針的濃密
    function addNeedles(x, y, t, size = 1) {
      const R = (32 + r() * 16) * size;
      el('ellipse', { cx: x.toFixed(1), cy: (y - R * 0.3).toFixed(1), rx: (R * 1.5).toFixed(1), ry: (R * 0.6).toFixed(1), fill: INK, opacity: 0.32 }, washLayer);
      const cluster = el('g', {}, needleLayer);
      for (let f = 0; f < 2; f++) {
        const fan = el('g', { transform: `translate(${(x + (f ? R * 0.7 : 0)).toFixed(1)} ${(y + (f ? 6 : 0)).toFixed(1)})` }, cluster);
        const inner = el('g', {}, fan);
        const n = 28 + Math.floor(r() * 10);
        for (let k = 0; k < n; k++) {
          const a = Math.PI + (k / (n - 1)) * Math.PI;       // 上半圓的扇形
          const len = R * (0.75 + r() * 0.3) * (f ? 0.8 : 1);
          el('line', {
            x1: 0, y1: 0,
            x2: (Math.cos(a) * len).toFixed(1), y2: (Math.sin(a) * len * 0.8).toFixed(1),
            stroke: INK, 'stroke-width': 1.6, 'stroke-linecap': 'round', opacity: (0.75 + r() * 0.25).toFixed(2)
          }, inner);
        }
        tl.from(inner, { scale: 0, transformOrigin: '50% 100%', duration: 0.7, ease: 'back.out(1.8)' }, t + f * 0.12);
      }
      sway.push(gsap.to(cluster, {
        rotation: (r() < 0.5 ? -1 : 1) * (1.2 + r() * 1.5),
        svgOrigin: `${x} ${y}`,
        duration: 3 + r() * 2.5,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        paused: true
      }));
    }
    tl.from(washLayer.children, { opacity: 0, duration: 1.2, stagger: 0.05 }, tMain * 0.5);

    return { svg, grow: tl, sway };
  }

  /* =====================================================
     依捲動位置切換：竹 → 梅 → 松
     ===================================================== */

  // 沒有 GSAP 時不顯示背景畫（內容不受影響）
  if (!hasGsap) return;

  const paintings = [paintBamboo(), paintPlum(), paintPine()];
  let active = -1;

  paintings.forEach((p) => gsap.set(p.svg, { autoAlpha: 0 }));

  function show(p) {
    const wasHidden = gsap.getProperty(p.svg, 'opacity') < 0.05;
    gsap.to(p.svg, { autoAlpha: 1, duration: 1.2, ease: 'sine.out', overwrite: 'auto' });
    if (!animate) { p.grow.progress(1); return; }
    // 完全消失後再回來，就重新長一次；還在淡出中就直接接上
    if (wasHidden) p.grow.restart(); else p.grow.play();
    p.sway.forEach((t) => t.play());
    if (p.start) p.start();
  }

  function hide(p) {
    gsap.to(p.svg, {
      autoAlpha: 0,
      duration: animate ? 1.6 : 0.01,
      ease: 'sine.inOut',
      overwrite: 'auto',
      onComplete: () => p.sway.forEach((t) => t.pause())
    });
    if (p.stop) p.stop();
  }

  function go(i) {
    if (i === active) return;
    if (active >= 0) hide(paintings[active]);
    active = i;
    show(paintings[i]);
  }

  if (!window.ScrollTrigger) { go(0); return; }

  // 兩條分界線：專案圖庫的頂端、服務流程的頂端
  const toPlum = ScrollTrigger.create({
    trigger: '#works', start: 'top 55%',
    onEnter: () => go(1), onLeaveBack: () => go(0)
  });
  const toPine = ScrollTrigger.create({
    trigger: '#process', start: 'top 55%',
    onEnter: () => go(2), onLeaveBack: () => go(1)
  });

  // 背景跟著捲動微微上移，增加層次
  paintings.forEach((p) => {
    gsap.to(p.svg, { yPercent: animate ? -4 : 0, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: true } });
  });

  // 依目前的捲動位置決定一開始顯示哪一幅；在頁面頂端時，等開場水墨暈完再長出竹子
  function initial() {
    const y = window.scrollY;
    const i = y >= toPine.start ? 2 : y >= toPlum.start ? 1 : 0;
    if (i === 0 && y < 50 && animate) gsap.delayedCall(2.2, () => { if (active === -1) go(0); });
    else go(i);
  }
  if (document.readyState === 'complete') initial();
  else window.addEventListener('load', initial);
})();
