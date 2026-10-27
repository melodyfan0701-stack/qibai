/* =========================================================
   棲白 QIBAI Studio — works.js
   3. 專案圖庫：產生卡片、分類篩選（GSAP Flip）、捲動進場（ScrollTrigger）
   4. 專案詳情面板：滑出／關閉、案例敘事依序出現、細節視角切換
   ========================================================= */

(function () {
  'use strict';

  const hasGsap = !!window.gsap;
  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animate = () => hasGsap && !reduceMotion();

  if (hasGsap && window.Flip) gsap.registerPlugin(Flip, ScrollTrigger);

  /* =====================================================
     3. 專案圖庫
     ===================================================== */
  const grid = document.querySelector('.project-grid');
  const filterBtns = [...document.querySelectorAll('.filter-btn')];
  const statusEl = document.getElementById('filter-status');

  // 依資料產生卡片
  const cards = CASES.map((c) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'project-card';
    card.dataset.id = c.id;
    card.dataset.category = c.category;
    card.innerHTML = `
      <span class="card-photo">
        <img src="${c.img}" alt="${c.alt}" loading="lazy">
        <span class="card-view" aria-hidden="true">查看案例</span>
      </span>
      <span class="card-text">
        <span class="card-title-row">
          <span class="card-name">${c.name}</span>
          <span class="card-year">${c.year}</span>
        </span>
        <span class="card-info">${c.categoryLabel}・${c.location}・${c.size} 坪・${c.style}</span>
      </span>`;
    card.addEventListener('click', () => openPanel(c.id, card));
    grid.appendChild(card);
    return card;
  });

  // 每個分類按鈕顯示案例數量
  filterBtns.forEach((btn) => {
    const f = btn.dataset.filter;
    const n = f === 'all' ? CASES.length : CASES.filter((c) => c.category === f).length;
    btn.querySelector('.count').textContent = n;
  });

  // 右欄卡片往下錯開（只算目前看得到的卡片）
  function updateOffsets() {
    const visible = cards.filter((c) => !c.hidden);
    cards.forEach((c) => c.classList.remove('is-offset'));
    visible.forEach((c, i) => { if (i % 2 === 1) c.classList.add('is-offset'); });
  }
  updateOffsets();

  function applyFilter(filter) {
    filterBtns.forEach((b) => b.setAttribute('aria-pressed', b.dataset.filter === filter ? 'true' : 'false'));

    // 動畫 3：Flip —— 先記錄位置，改變版面，再從舊位置平滑移到新位置
    const state = animate() && window.Flip ? Flip.getState(cards) : null;

    cards.forEach((card) => {
      card.hidden = !(filter === 'all' || card.dataset.category === filter);
    });
    updateOffsets();

    const shown = cards.filter((c) => !c.hidden).length;
    const label = filterBtns.find((b) => b.dataset.filter === filter).firstChild.textContent.trim();
    statusEl.textContent = `顯示 ${shown} 個${filter === 'all' ? '' : label}案例`;

    if (state) {
      Flip.from(state, {
        duration: 0.7,
        ease: 'power2.inOut',
        absolute: true,
        // 新出現的卡片：淡入、從小到大
        onEnter: (els) => gsap.fromTo(els,
          { autoAlpha: 0, scale: 0.94 },
          { autoAlpha: 1, scale: 1, duration: 0.6, delay: 0.2, ease: 'power2.out' }),
        // 被篩掉的卡片：淡出、縮小
        onLeave: (els) => gsap.to(els, { autoAlpha: 0, scale: 0.94, duration: 0.35 }),
        onComplete: () => ScrollTrigger.refresh()
      });
    }
  }

  filterBtns.forEach((btn) => btn.addEventListener('click', () => applyFilter(btn.dataset.filter)));

  // 動畫 2：ScrollTrigger —— 捲到圖庫時，標題與卡片依序浮現
  if (animate()) {
    gsap.from('.works-head > *', {
      autoAlpha: 0,
      y: 24,
      duration: 0.9,
      stagger: 0.15,
      ease: 'power2.out',
      scrollTrigger: { trigger: '.works-head', start: 'top 85%', once: true }
    });

    gsap.set(cards, { autoAlpha: 0, y: 48 });
    ScrollTrigger.batch(cards, {
      start: 'top 88%',
      once: true,
      onEnter: (batch) => gsap.to(batch, {
        autoAlpha: 1,
        y: 0,
        duration: 1,
        stagger: 0.15,
        ease: 'power3.out',
        overwrite: true
      })
    });
  }

  /* =====================================================
     4. 專案詳情面板
     ===================================================== */
  const panel    = document.querySelector('.project-panel');
  const backdrop = document.querySelector('.panel-backdrop');
  const closeBtn = panel.querySelector('.panel-close');
  const scroller = panel.querySelector('.panel-scroll');
  const mainImg  = panel.querySelector('.panel-img');
  const thumbsEl = panel.querySelector('.panel-thumbs');
  const ctaBtn   = panel.querySelector('.panel-cta');

  let lastTrigger = null;    // 關閉後焦點要回到哪張卡片
  let isOpen = false;
  let activeCase = null;

  // 依「細節視角」設定照片的放大位置
  function setView(img, d) {
    img.style.transformOrigin = `${d.x}% ${d.y}%`;
    img.style.transform = `scale(${d.zoom})`;
  }

  function fillPanel(c) {
    activeCase = c;
    panel.querySelector('.panel-eyebrow').textContent = `${c.categoryLabel}　${c.year}`;
    panel.querySelector('.panel-title').textContent = c.name;
    panel.querySelector('.panel-need').textContent = c.need;
    panel.querySelector('.panel-concept').textContent = c.concept;

    const meta = [
      ['類型', c.categoryLabel], ['空間', c.room],
      ['地點', c.location],      ['坪數', `${c.size} 坪`],
      ['年份', c.year],          ['風格', c.style]
    ];
    panel.querySelector('.panel-meta').innerHTML =
      meta.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');

    panel.querySelector('.material-list').innerHTML =
      c.materials.map((m) => `<li>${m}</li>`).join('');

    mainImg.src = c.img;
    mainImg.alt = c.alt;
    setView(mainImg, c.details[0]);

    thumbsEl.innerHTML = '';
    c.details.forEach((d, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'thumb-btn';
      b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
      b.innerHTML = `<span class="thumb-frame"><img src="${c.img}" alt=""></span>${d.label}`;
      setView(b.querySelector('img'), d);
      b.addEventListener('click', () => showDetail(i));
      thumbsEl.appendChild(b);
    });
  }

  // 動畫 4：圖片切換 —— 淡出、換視角、淡入
  function showDetail(i) {
    const d = activeCase.details[i];
    [...thumbsEl.children].forEach((b, n) => b.setAttribute('aria-pressed', n === i ? 'true' : 'false'));
    if (!animate()) { setView(mainImg, d); return; }
    gsap.timeline()
      .to(mainImg, { autoAlpha: 0, duration: 0.25, ease: 'power1.in' })
      .add(() => setView(mainImg, d))
      .fromTo(mainImg, { autoAlpha: 0, scale: d.zoom * 1.04 }, { autoAlpha: 1, scale: d.zoom, duration: 0.6, ease: 'power2.out' });
  }

  function openPanel(id, trigger) {
    const c = CASES.find((x) => x.id === id);
    if (!c) return;
    lastTrigger = trigger || null;
    fillPanel(c);

    panel.hidden = false;
    backdrop.hidden = false;
    document.body.classList.add('panel-open');
    scroller.scrollTop = 0;
    isOpen = true;
    closeBtn.focus({ preventScroll: true });

    if (!animate()) return;

    // 面板滑入，案例敘事依序出現：標題 → 資訊 → 需求 → 理念 → 材料
    gsap.timeline({ defaults: { ease: 'power3.out' } })
      .fromTo(backdrop, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, 0)
      .fromTo(panel, { xPercent: 100 }, { xPercent: 0, duration: 0.6 }, 0)
      .fromTo(mainImg, { autoAlpha: 0, scale: 1.08 }, { autoAlpha: 1, scale: 1, duration: 1 }, 0.25)
      .fromTo('.panel-eyebrow, .panel-title, .panel-meta, .panel-body .story-step',
        { autoAlpha: 0, y: 20 },
        { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.12 }, 0.35);
  }

  function closePanel(after) {
    if (!isOpen) return;
    isOpen = false;

    const finish = () => {
      panel.hidden = true;
      backdrop.hidden = true;
      document.body.classList.remove('panel-open');
      if (lastTrigger) lastTrigger.focus({ preventScroll: true });
      if (typeof after === 'function') after();
    };

    if (!animate()) { finish(); return; }
    gsap.timeline({ onComplete: finish })
      .to(panel, { xPercent: 100, duration: 0.45, ease: 'power3.in' }, 0)
      .to(backdrop, { autoAlpha: 0, duration: 0.4 }, 0.05);
  }

  // 三種關閉方式：關閉按鈕、點遮罩、按 Esc
  closeBtn.addEventListener('click', () => closePanel());
  backdrop.addEventListener('click', () => closePanel());

  document.addEventListener('keydown', (e) => {
    if (!isOpen) return;
    if (e.key === 'Escape') { closePanel(); return; }

    // 面板開啟時，Tab 只在面板裡循環
    if (e.key === 'Tab') {
      const focusables = [...panel.querySelectorAll('button, a[href]')].filter((el) => !el.hidden);
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // 「預約類似的設計」：先關閉面板，再捲到預約表單
  ctaBtn.addEventListener('click', (e) => {
    e.preventDefault();
    lastTrigger = null;
    const c = activeCase;
    closePanel(() => {
      if (window.prefillContact && c) window.prefillContact(c);
      const target = document.querySelector('#contact');
      if (target) target.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth' });
    });
  });

  // Hero 輪播的「看完整案例」：打開目前顯示的那個案例
  const heroOpen = document.querySelector('.case-open');
  if (heroOpen) {
    heroOpen.addEventListener('click', () => {
      const btns = [...document.querySelectorAll('.case-btn')];
      const i = Math.max(0, btns.findIndex((b) => b.getAttribute('aria-pressed') === 'true'));
      openPanel(CASES[i].id, heroOpen);
    });
  }
})();
