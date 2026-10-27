/* =========================================================
   棲白 QIBAI Studio — tour.js
   5. 空間導覽：點平面圖上的房間，切換照片與說明
   - 捲到這一區時，平面圖的牆線一筆一筆畫出來（ScrollTrigger）
   - 切換房間時，照片像拉門一樣滑開（圖片切換）
   - 選中的編號出現朱砂漣漪，提示目前位置
   ========================================================= */

(function () {
  'use strict';

  const rooms = TOUR.rooms;
  const hasGsap = !!window.gsap;
  const animate = () => hasGsap && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const section   = document.querySelector('.tour');
  const hotspotEl = section.querySelector('.hotspots');
  const photo     = section.querySelector('.room-photo');
  const stepEl    = section.querySelector('.room-step');
  const nameEl    = section.querySelector('.room-name');
  const descEl    = section.querySelector('.room-desc');
  const matEl     = section.querySelector('.room-materials');
  const prevBtn   = section.querySelector('.room-prev');
  const nextBtn   = section.querySelector('.room-next');
  const roomRects = [...section.querySelectorAll('.room')];

  let current = -1;

  /* ---------- 產生熱點按鈕 ---------- */
  const hotspots = rooms.map((r, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'hotspot';
    b.style.left = r.hotspot[0] + '%';
    b.style.top = r.hotspot[1] + '%';
    b.setAttribute('aria-pressed', 'false');
    b.innerHTML = `<span class="num">${i + 1}<span class="ring"></span></span><span class="label">${r.name}</span>`;

    const rect = roomRects.find((el) => el.dataset.room === r.id);
    b.addEventListener('click', () => select(i));
    b.addEventListener('mouseenter', () => rect && rect.classList.add('is-hover'));
    b.addEventListener('mouseleave', () => rect && rect.classList.remove('is-hover'));
    hotspotEl.appendChild(b);
    return b;
  });

  // 平面圖上的房間色塊也可以直接點
  roomRects.forEach((rect) => {
    const i = rooms.findIndex((r) => r.id === rect.dataset.room);
    if (i < 0) return;
    rect.style.cursor = 'pointer';
    rect.addEventListener('click', () => select(i));
  });

  /* ---------- 切換房間 ---------- */
  function select(i) {
    if (i === current) return;
    const r = rooms[i];
    const first = current === -1;
    current = i;

    hotspots.forEach((b, n) => b.setAttribute('aria-pressed', n === i ? 'true' : 'false'));
    roomRects.forEach((el) => el.classList.toggle('is-active', el.dataset.room === r.id));

    stepEl.textContent = `${i + 1} / ${rooms.length}　${r.size} 坪`;
    nameEl.textContent = r.name;
    descEl.textContent = r.text;
    matEl.innerHTML = r.materials.map((m) => `<li>${m}</li>`).join('');
    prevBtn.disabled = i === 0;
    nextBtn.disabled = i === rooms.length - 1;

    // 換照片：新照片疊在上面
    const oldImg = photo.querySelector('.room-img:last-child');
    const newImg = document.createElement('img');
    newImg.className = 'room-img';
    newImg.src = r.img;
    newImg.alt = r.alt;
    photo.appendChild(newImg);

    const cleanup = () => {
      [...photo.querySelectorAll('.room-img')].slice(0, -1).forEach((el) => el.remove());
    };

    if (first || !animate()) { cleanup(); return; }

    // 動畫：拉門 —— 新照片由右往左滑開，舊照片往左退一點
    gsap.timeline({ onComplete: cleanup })
      .fromTo(newImg,
        { clipPath: 'inset(0% 0% 0% 100%)', scale: 1.08 },
        { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: 1, ease: 'power3.inOut' }, 0)
      .to(oldImg, { xPercent: -12, duration: 1, ease: 'power3.inOut' }, 0)
      .fromTo('.room-text > *',
        { autoAlpha: 0, y: 12 },
        { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.08, ease: 'power2.out' }, 0.35);

    // 選中的編號：朱砂漣漪擴散兩次
    gsap.fromTo(hotspots[i].querySelector('.ring'),
      { scale: 1, opacity: 0.9 },
      { scale: 2, opacity: 0, duration: 1.1, ease: 'power2.out', repeat: 1 });
  }

  prevBtn.addEventListener('click', () => select(Math.max(0, current - 1)));
  nextBtn.addEventListener('click', () => select(Math.min(rooms.length - 1, current + 1)));

  // 先把照片載好，切換時不會空白
  rooms.forEach((r) => { const im = new Image(); im.src = r.img; });

  // 預設顯示第一個空間（玄關），清掉 HTML 裡的預設圖
  photo.querySelectorAll('.room-img').forEach((el) => el.remove());
  select(0);

  /* ---------- 捲到這一區：牆線畫出來、熱點依序出現 ---------- */
  if (animate() && window.ScrollTrigger) {
    const lines = section.querySelectorAll('.walls-outer, .walls-inner path');
    lines.forEach((el) => {
      const len = el.getTotalLength();
      gsap.set(el, { strokeDasharray: len, strokeDashoffset: len });
    });
    gsap.set('.furniture, .room-labels, .window-line, .door', { autoAlpha: 0 });
    const nums = hotspots.map((h) => h.querySelector('.num'));
    gsap.set(hotspots, { autoAlpha: 0 });
    gsap.set(nums, { scale: 0.5 });

    gsap.timeline({
      scrollTrigger: { trigger: '.plan', start: 'top 75%', once: true },
      defaults: { ease: 'power2.inOut' }
    })
      .to(lines, { strokeDashoffset: 0, duration: 1.6, stagger: 0.12 })
      .to('.window-line, .door, .furniture, .room-labels', { autoAlpha: 1, duration: 0.6, stagger: 0.1 }, '-=0.6')
      .to(hotspots, { autoAlpha: 1, duration: 0.4, stagger: 0.12 }, '-=0.3')
      .to(nums, { scale: 1, duration: 0.5, stagger: 0.12, ease: 'back.out(2.5)' }, '<');
  }
})();
