/* =========================================================
   棲白 QIBAI Studio — main.js
   目前完成：
   1. Hero 開場：水墨暈開 → 案例照片從墨中浮現 → 標題墨暈進場
   2. 精選案例輪播：每 7 秒以水墨暈染切換，也可以點按鈕切換
   3. 導覽列捲動狀態、案例圖片視差（ScrollTrigger）
   專案圖庫與詳情面板在 works.js
   ========================================================= */

(function () {
  'use strict';

  const root = document.documentElement;

  /* ---------- 案例資料來自 data.js ---------- */
  const cases = CASES;
  const infoText = (c) => `${c.categoryLabel}・${c.city}・${c.size} 坪`;

  /* ---------- 取得元素 ---------- */
  const stage    = document.querySelector('.ink-stage');
  const slots    = [...stage.querySelectorAll('.slot')];
  const masks    = [document.getElementById('mask-a'), document.getElementById('mask-b')];
  const inkGroup = stage.querySelector('.ink');
  const inkWash  = stage.querySelector('.ink-wash');
  const inkCore  = stage.querySelector('.ink-core');
  const inkDots  = [...stage.querySelectorAll('.ink-dot')];
  const nameEl   = document.querySelector('.case-name');
  const infoEl   = document.querySelector('.case-info');
  const switchEl = document.querySelector('.case-switch');

  let current = 0;      // 目前顯示第幾個案例
  let topSlot = 0;      // 目前在上層的是 A(0) 還是 B(1)

  /* ---------- 產生案例切換按鈕 ---------- */
  const buttons = cases.map((c, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'case-btn';
    btn.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
    btn.innerHTML = `${c.name}<span class="progress" aria-hidden="true"></span>`;
    switchEl.appendChild(btn);
    return btn;
  });

  function updateCaption(i) {
    nameEl.textContent = cases[i].name;
    infoEl.textContent = infoText(cases[i]);
    stage.setAttribute('aria-label', cases[i].alt);
    buttons.forEach((b, n) => b.setAttribute('aria-pressed', n === i ? 'true' : 'false'));
  }
  updateCaption(0);

  /* ---------- 沒有 GSAP 時：按鈕直接換圖，網站仍可使用 ---------- */
  if (!window.gsap) {
    root.classList.remove('js');
    const nav = document.querySelector('.site-nav');
    const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    buttons.forEach((btn, i) => btn.addEventListener('click', () => {
      slots[0].querySelector('image').setAttribute('href', cases[i].img);
      updateCaption(i);
    }));
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // 先把照片下載好，暈開時才不會出現空白
  cases.forEach(c => { const im = new Image(); im.src = c.img; });

  /* ---------- 工具：標題拆字 ---------- */
  function splitChars(el) {
    const text = el.textContent;
    el.textContent = '';
    for (const ch of text) {
      const span = document.createElement('span');
      span.className = 'char';
      span.textContent = ch;
      el.appendChild(span);
    }
  }
  document.querySelectorAll('.title-line').forEach(splitChars);

  /* ---------- 工具：計算墨要暈多大才能蓋滿畫面 ---------- */
  function farthestCorner([x, y]) {
    return Math.max(
      Math.hypot(x, y), Math.hypot(800 - x, y),
      Math.hypot(x, 1000 - y), Math.hypot(800 - x, 1000 - y)
    );
  }

  /* ---------- 核心：水墨暈染，讓某一層照片浮現 ----------
     順序：淡墨散開 → 濃墨暈開、濺出墨點 → 照片在墨底下長出來 → 墨慢慢淡去 */
  function inkBloom(slotIndex, caseIndex, speed = 1) {
    const c = cases[caseIndex];
    const [x, y] = c.origin;
    const D = farthestCorner(c.origin);
    const maskMain  = masks[slotIndex].querySelector('.m-main');
    const maskSides = [...masks[slotIndex].querySelectorAll('.m-side')];

    // 新照片放到最上層（但在墨層下面）
    slots[slotIndex].querySelector('image').setAttribute('href', c.img);
    stage.insertBefore(slots[slotIndex], inkGroup);
    gsap.set(slots[slotIndex], { opacity: 1 });

    // 墨與遮罩都從墨滴位置開始
    gsap.set([inkWash, inkCore, maskMain], { attr: { cx: x, cy: y, r: 0 } });
    maskSides.forEach((m, n) => {
      const angle = (n === 0 ? -0.7 : 2.3) + Math.random() * 0.6;
      gsap.set(m, { attr: { cx: x + Math.cos(angle) * D * 0.5, cy: y + Math.sin(angle) * D * 0.5, r: 0 } });
    });
    inkDots.forEach(dot => {
      const angle = Math.random() * Math.PI * 2;
      const dist = D * (0.32 + Math.random() * 0.2);
      gsap.set(dot, { attr: { cx: x + Math.cos(angle) * dist, cy: y + Math.sin(angle) * dist, r: 0 } });
    });

    const tl = gsap.timeline({ defaults: { duration: 1 * speed } });
    tl.set(inkGroup, { opacity: 1 })
      // 淡墨先散開
      .to(inkWash, { attr: { r: D * 0.62 }, duration: 2 * speed, ease: 'power2.out' }, 0)
      // 濃墨暈開
      .to(inkCore, { attr: { r: D * 0.34 }, duration: 1.4 * speed, ease: 'power3.out' }, 0.1 * speed)
      // 濺出的小墨點
      .to(inkDots, {
        attr: { r: () => 10 + Math.random() * 22 },
        duration: 0.6 * speed,
        stagger: 0.08 * speed,
        ease: 'back.out(3)'
      }, 0.2 * speed)
      // 照片從墨裡長出來（遮罩擴大）
      .to(maskMain, { attr: { r: D * 0.82 }, duration: 2.2 * speed, ease: 'power2.inOut' }, 0.5 * speed)
      .to(maskSides, { attr: { r: D * 0.42 }, duration: 1.8 * speed, ease: 'power2.inOut' }, 0.8 * speed)
      // 墨淡去，照片完整出現
      .to(inkGroup, { opacity: 0, duration: 1.3 * speed, ease: 'sine.inOut' }, 1.3 * speed)
      // 完成後把下面那層舊照片的遮罩收起來，四角才會留白
      .add(() => {
        const other = masks[1 - slotIndex].querySelectorAll('circle');
        gsap.set(other, { attr: { r: 0 } });
      });

    topSlot = slotIndex;
    return tl;
  }

  /* ---------- 導覽列：捲動超過 40px 加上底色與細線 ---------- */
  ScrollTrigger.create({
    start: 40,
    end: 'max',
    toggleClass: { targets: '.site-nav', className: 'is-scrolled' }
  });

  /* ---------- 依使用者偏好分開處理 ---------- */
  const mm = gsap.matchMedia();

  mm.add(
    {
      motionOK: '(prefers-reduced-motion: no-preference)',
      reduceMotion: '(prefers-reduced-motion: reduce)'
    },
    (context) => {
      const { motionOK } = context.conditions;

      gsap.set(['.title-line', '.ink-stage'], { autoAlpha: 1 });

      /* ===== 減少動態效果：沒有暈染、沒有自動輪播，點按鈕直接淡入切換 ===== */
      if (!motionOK) {
        gsap.set('[data-intro], .lattice, .title-line .char', { autoAlpha: 1 });
        root.classList.remove('js');

        const onClick = (i) => {
          if (i === current) return;
          const next = 1 - topSlot;
          slots[next].querySelector('image').setAttribute('href', cases[i].img);
          gsap.set(masks[next].querySelector('.m-main'), { attr: { cx: 400, cy: 500, r: 700 } });
          stage.insertBefore(slots[next], inkGroup);
          gsap.fromTo(slots[next], { opacity: 0 }, { opacity: 1, duration: 0.4 });
          topSlot = next;
          current = i;
          updateCaption(i);
        };
        const handlers = buttons.map((btn, i) => {
          const h = () => onClick(i);
          btn.addEventListener('click', h);
          return h;
        });
        return () => buttons.forEach((btn, i) => btn.removeEventListener('click', handlers[i]));
      }

      /* ===== 動畫 1：開場 —— 墨暈開 → 照片浮現 → 標題逐字暈開 ===== */
      const intro = gsap.timeline({ defaults: { ease: 'power2.out' } });

      intro
        .from('[data-intro="nav"]', { autoAlpha: 0, y: -12, duration: 0.8 }, 0.2)
        // 第一個案例從墨裡浮現
        .add(inkBloom(0, 0, 1.1), 0.3)
        // 標題：每個字由模糊變清楚，像墨在紙上暈開
        .from('.title-line .char', {
          autoAlpha: 0,
          filter: 'blur(12px)',
          y: 6,
          duration: 1.1,
          stagger: 0.06,
          ease: 'power1.out',
          clearProps: 'filter'
        }, 1.2)
        // 朱砂印章蓋下去
        .from('[data-intro="seal"]', { autoAlpha: 0, scale: 1.5, duration: 0.45, ease: 'back.out(2.2)' }, '-=0.5')
        .from('[data-intro="side"]', { autoAlpha: 0, y: -24, duration: 0.9 }, '<')
        .from('[data-intro="fade"]', { autoAlpha: 0, y: 16, duration: 0.8, stagger: 0.12 }, '-=0.4')
        .from('.lattice', { autoAlpha: 0, y: 40, duration: 1 }, '<');

      root.classList.remove('js');

      /* ===== 動畫 2：案例輪播（每 7 秒），進度線顯示還有多久切換 ===== */
      const HOLD = 7;
      let timer = null;        // 進度線動畫
      let transition = null;   // 正在進行的暈染

      function startTimer() {
        if (timer) timer.kill();
        const bar = buttons[current].querySelector('.progress');
        timer = gsap.fromTo(bar, { scaleX: 0 }, {
          scaleX: 1,
          duration: HOLD,
          ease: 'none',
          onComplete: () => goTo((current + 1) % cases.length)
        });
      }

      function goTo(i) {
        if (i === current) return;
        if (transition) transition.progress(1);     // 上一次還沒暈完就直接完成
        buttons[current].querySelector('.progress').style.transform = '';
        current = i;
        updateCaption(i);
        gsap.fromTo('.case-now', { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.6, delay: 0.5 });
        transition = inkBloom(1 - topSlot, i, 0.85);
        startTimer();
      }

      // 開場結束後才開始計時
      intro.add(startTimer);

      const clickHandlers = buttons.map((btn, i) => {
        const h = () => goTo(i);
        btn.addEventListener('click', h);
        return h;
      });

      // 滑鼠停在照片上或用鍵盤操作按鈕時暫停輪播，方便看清楚
      const frame = document.querySelector('.ink-frame');
      const pause  = () => timer && timer.pause();
      const resume = () => timer && timer.resume();
      frame.addEventListener('mouseenter', pause);
      frame.addEventListener('mouseleave', resume);
      frame.addEventListener('focusin', pause);
      frame.addEventListener('focusout', resume);

      // Hero 捲出畫面時停止輪播，省電也省效能
      ScrollTrigger.create({
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        onLeave: pause,
        onEnterBack: resume
      });

      // 視窗大小或偏好改變時，移除這組事件，避免重複綁定
      return () => {
        buttons.forEach((btn, i) => btn.removeEventListener('click', clickHandlers[i]));
        frame.removeEventListener('mouseenter', pause);
        frame.removeEventListener('mouseleave', resume);
        frame.removeEventListener('focusin', pause);
        frame.removeEventListener('focusout', resume);
      };
    }
  );

  /* ===== 動畫 3（ScrollTrigger，只在桌面版）：往下捲時圖片移動得比文字慢，產生景深 ===== */
  mm.add('(min-width: 901px) and (prefers-reduced-motion: no-preference)', () => {
    gsap.to('.ink-frame', {
      yPercent: -6,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
  });
})();
