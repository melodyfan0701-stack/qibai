/* =========================================================
   棲白 QIBAI Studio — effects.js
   全站共用的小動畫：
   1. 區塊間水墨轉場：捲到每個區塊標題時，先滴下一滴墨、再暈開，最後淡成紙上的墨痕
   2. 墨點游標（只在有滑鼠的桌面裝置）：游標是一顆小墨點，
      移到按鈕上變成圓圈，移到照片上放大成朱砂圓並出現「看」字
   ========================================================= */

(function () {
  'use strict';

  if (!window.gsap) return;

  const mm = gsap.matchMedia();

  /* -----------------------------------------------------
     共用的小尺寸水墨濾鏡（標題墨痕用）
     ----------------------------------------------------- */
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  defs.setAttribute('aria-hidden', 'true');
  defs.setAttribute('width', '0');
  defs.setAttribute('height', '0');
  defs.style.position = 'absolute';
  defs.innerHTML = `
    <filter id="inkSmall" x="-50%" y="-50%" width="200%" height="200%">
      <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="2" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="26" xChannelSelector="R" yChannelSelector="G"/>
      <feGaussianBlur stdDeviation="1.6"/>
    </filter>
    <filter id="inkSmallWash" x="-50%" y="-50%" width="200%" height="200%">
      <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" seed="8" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="46" xChannelSelector="R" yChannelSelector="G"/>
      <feGaussianBlur stdDeviation="9"/>
    </filter>`;
  document.body.appendChild(defs);

  /* =====================================================
     1. 區塊間水墨轉場
     ===================================================== */
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const titles = document.querySelectorAll('.section-title, .philo-title');
    const added = [];

    titles.forEach((title) => {
      // 在標題後面放一小塊 SVG，畫墨滴與暈開的淡墨
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'title-ink');
      svg.setAttribute('viewBox', '0 0 260 200');
      svg.setAttribute('aria-hidden', 'true');
      svg.innerHTML = `
        <circle class="ti-wash" cx="96" cy="100" r="0" filter="url(#inkSmallWash)"/>
        <circle class="ti-core" cx="84" cy="96"  r="0" filter="url(#inkSmall)"/>
        <circle class="ti-drop" cx="150" cy="70" r="0" filter="url(#inkSmall)"/>
        <circle class="ti-drop" cx="46"  cy="140" r="0" filter="url(#inkSmall)"/>`;
      title.prepend(svg);
      added.push(svg);

      const wash = svg.querySelector('.ti-wash');
      const core = svg.querySelector('.ti-core');
      const drops = svg.querySelectorAll('.ti-drop');

      gsap.timeline({
        scrollTrigger: { trigger: title, start: 'top 85%', once: true }
      })
        // 墨滴落下
        .fromTo(core, { attr: { r: 0 }, opacity: 0.75 }, { attr: { r: 30 }, duration: 0.5, ease: 'power3.out' })
        .to(drops, { attr: { r: (i) => (i ? 6 : 9) }, duration: 0.4, stagger: 0.08, ease: 'back.out(3)' }, 0.1)
        // 淡墨往外暈開
        .fromTo(wash, { attr: { r: 0 }, opacity: 0.4 }, { attr: { r: 96 }, duration: 1.8, ease: 'power2.out' }, 0.15)
        // 墨被紙吸收，留下淡淡的痕跡
        .to(core, { opacity: 0.16, duration: 1.6, ease: 'sine.inOut' }, 0.7)
        .to(wash, { opacity: 0.1, duration: 1.6, ease: 'sine.inOut' }, 0.9)
        .to(drops, { opacity: 0.2, duration: 1.2 }, 0.9);
    });

    return () => added.forEach((svg) => svg.remove());
  });

  /* =====================================================
     2. 墨點游標
     只在「有滑鼠、可 hover」且沒有開啟減少動態效果的裝置啟用；手機、平板不會出現
     ===================================================== */
  mm.add('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
    const root = document.documentElement;
    const cursor = document.createElement('div');
    cursor.className = 'ink-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.innerHTML = '<span class="cursor-label">看</span>';
    document.body.appendChild(cursor);
    root.classList.add('has-ink-cursor');

    const label = cursor.querySelector('.cursor-label');
    gsap.set(cursor, { xPercent: -50, yPercent: -50, autoAlpha: 0 });

    // quickTo：每次滑鼠移動只更新目標位置，GSAP 會平滑地追上去（有一點拖墨的延遲感）
    const xTo = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' });
    const yTo = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' });

    const states = {
      dot:    { width: 12, height: 12, autoAlpha: 1, labelAlpha: 0 },
      link:   { width: 40, height: 40, autoAlpha: 1, labelAlpha: 0 },
      view:   { width: 84, height: 84, autoAlpha: 1, labelAlpha: 1 },
      hidden: { width: 12, height: 12, autoAlpha: 0, labelAlpha: 0 }
    };
    let current = '';
    let visible = false;

    function setState(name) {
      if (name === current) return;
      current = name;
      const s = states[name];
      cursor.dataset.state = name;
      gsap.to(cursor, { width: s.width, height: s.height, autoAlpha: visible ? s.autoAlpha : 0, duration: 0.35, ease: 'power3.out', overwrite: 'auto' });
      gsap.to(label, { autoAlpha: s.labelAlpha, scale: s.labelAlpha ? 1 : 0.6, duration: 0.25 });
    }

    // 依滑鼠下方的元素決定游標樣子
    function stateFor(el) {
      if (!el || !el.closest) return 'dot';
      if (el.closest('input, textarea, select')) return 'hidden';
      if (el.closest('.project-card, .ink-stage, .concept-photo, .room-photo, .panel-photo')) return 'view';
      if (el.closest('a, button, .room, label')) return 'link';
      return 'dot';
    }

    const onMove = (e) => {
      if (!visible) {
        visible = true;
        gsap.set(cursor, { x: e.clientX, y: e.clientY });
        gsap.to(cursor, { autoAlpha: states[current || 'dot'].autoAlpha, duration: 0.3 });
      }
      xTo(e.clientX);
      yTo(e.clientY);
    };
    const onOver = (e) => setState(stateFor(e.target));
    const onLeave = () => { visible = false; gsap.to(cursor, { autoAlpha: 0, duration: 0.3 }); };
    const onDown = () => gsap.to(cursor, { scale: 0.8, duration: 0.15 });
    const onUp = () => gsap.to(cursor, { scale: 1, duration: 0.3, ease: 'back.out(3)' });

    setState('dot');
    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseover', onOver);
    document.documentElement.addEventListener('mouseleave', onLeave);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);

    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
      document.documentElement.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      root.classList.remove('has-ink-cursor');
      cursor.remove();
    };
  });
})();
