/* =========================================================
   棲白 QIBAI Studio — contact.js
   6. 服務流程：桌面版畫面固定、步驟橫向滑過（手卷）；朱砂進度線經過的步驟會亮起來
   7. 預約表單：即時檢查、錯誤提示、送出中與成功狀態
   ========================================================= */

(function () {
  'use strict';

  const hasGsap = !!window.gsap;
  const animate = () => hasGsap && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =====================================================
     6. 服務流程
     ===================================================== */
  const steps = [...document.querySelectorAll('.step')];
  const progress = document.querySelector('.steps-progress');

  // 讓時間軸線剛好從第 1 個圓心連到最後一個圓心（橫向或直向都適用）
  const track = document.querySelector('.steps-track');
  function sizeTrack() {
    // 用 offsetLeft／offsetTop（不受動畫位移影響）找出圓心位置，相對於 .steps
    const a = steps[0].querySelector('.step-num');
    const b = steps[steps.length - 1].querySelector('.step-num');
    const ax = a.offsetLeft + a.offsetWidth / 2, ay = a.offsetTop + a.offsetHeight / 2;
    const bx = b.offsetLeft + b.offsetWidth / 2, by = b.offsetTop + b.offsetHeight / 2;
    Object.assign(track.style, {
      left: ax + 'px',
      top: ay + 'px',
      width: Math.max(1, bx - ax) + 'px',
      height: Math.max(1, by - ay) + 'px'
    });
  }
  sizeTrack();
  window.addEventListener('resize', sizeTrack);
  if (document.fonts) document.fonts.ready.then(sizeTrack);

  function markReached(p) {
    // p = 0~1，進度線經過第幾個步驟，那個步驟就亮起來
    steps.forEach((step, i) => {
      step.classList.toggle('is-reached', p >= i / (steps.length - 1) - 0.001);
    });
  }

  if (animate() && window.ScrollTrigger) {
    const mm = gsap.matchMedia();
    const section = document.querySelector('.process');
    const inner = section.querySelector('.section-inner');
    const wrap = section.querySelector('.steps-wrap');

    /* ---- 桌面版：橫向手卷 ----
       捲到流程區時畫面固定（pin），繼續往下捲，五個步驟像展開手卷一樣向左滑過 */
    mm.add('(min-width: 901px) and (min-height: 620px)', () => {
      section.classList.add('is-horizontal');
      sizeTrack();

      // 要往左移多少：整條步驟列的寬度 − 可視寬度
      const distance = () => Math.max(0, wrap.scrollWidth - inner.clientWidth);

      const scrollTl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: section,
          pin: true,
          start: 'top top',
          end: () => '+=' + (distance() + window.innerHeight * 0.4),
          scrub: 0.8,
          invalidateOnRefresh: true,
          onUpdate: (self) => markReached(self.progress)
        }
      });
      scrollTl
        .to(wrap, { x: () => -distance() }, 0)
        .fromTo(progress, { scaleX: 0 }, { scaleX: 1 }, 0);
      markReached(0);

      // 每個步驟滑進畫面右側時，文字由淡變清楚（containerAnimation：跟著橫向移動觸發）
      steps.forEach((step) => {
        gsap.from(step.querySelectorAll('h3, .step-time, p'), {
          autoAlpha: 0.12,
          y: 18,
          duration: 0.6,
          stagger: 0.08,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: step,
            containerAnimation: scrollTl,
            start: 'left 85%',
            toggleActions: 'play none none reverse'
          }
        });
      });

      // 離開這個條件（例如視窗縮小）時恢復原本版面
      return () => {
        section.classList.remove('is-horizontal');
        gsap.set(wrap, { clearProps: 'x' });
        sizeTrack();
      };
    });

    /* ---- 其他尺寸：時間軸跟著捲動畫出（平板橫向、手機直向） ---- */
    mm.add('(max-width: 900px), (max-height: 619px)', () => {
      const vertical = window.matchMedia('(max-width: 760px)').matches;
      const axis = vertical ? 'scaleY' : 'scaleX';
      gsap.set(progress, { scaleX: 1, scaleY: 1 });
      sizeTrack();

      gsap.fromTo(progress, { [axis]: 0 }, {
        [axis]: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: '.steps-wrap',
          start: 'top 70%',
          end: vertical ? 'bottom 60%' : 'top 25%',
          scrub: 0.6,
          onUpdate: (self) => markReached(self.progress)
        }
      });
      markReached(0);

      gsap.from(steps, {
        autoAlpha: 0,
        y: 24,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power2.out',
        scrollTrigger: { trigger: '.steps-wrap', start: 'top 85%', once: true }
      });
    });
  } else {
    markReached(1);
  }

  /* =====================================================
     7. 預約表單
     ===================================================== */
  const form    = document.querySelector('.contact-form');
  const success = document.querySelector('.form-success');
  const status  = form.querySelector('.form-status');
  const submit  = form.querySelector('.submit-btn');

  const fields = {
    name:  document.getElementById('f-name'),
    email: document.getElementById('f-email'),
    type:  document.getElementById('f-type'),
    size:  document.getElementById('f-size'),
    msg:   document.getElementById('f-msg')
  };

  // 每個欄位的檢查規則：回傳錯誤訊息，沒錯就回傳空字串
  const rules = {
    name: (v) => v.trim() ? '' : '請填寫姓名。',
    email: (v) => {
      if (!v.trim()) return '請填寫 Email，我們會用它回信給你。';
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Email 格式不正確，例如 name@example.com。';
    },
    type: (v) => v ? '' : '請選擇空間類型。',
    size: (v) => {
      if (!v) return '';
      const n = Number(v);
      return Number.isInteger(n) && n >= 1 && n <= 999 ? '' : '坪數請填 1 到 999 之間的整數。';
    },
    msg: (v) => {
      if (!v.trim()) return '請簡單描述你的需求。';
      return v.trim().length >= 10 ? '' : `再多寫一點，至少 10 個字（目前 ${v.trim().length} 個字）。`;
    }
  };

  const errorIds = { name: 'err-name', email: 'err-email', type: 'err-type', size: 'err-size', msg: 'err-msg' };

  function check(key) {
    const input = fields[key];
    const message = rules[key](input.value);
    const errEl = document.getElementById(errorIds[key]);
    errEl.textContent = message;
    input.closest('.field').classList.toggle('has-error', !!message);
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (message) input.setAttribute('aria-describedby', errorIds[key]);
    else input.removeAttribute('aria-describedby');
    return !message;
  }

  // 離開欄位時檢查；已經出錯的欄位，邊打字邊更新
  Object.keys(fields).forEach((key) => {
    const input = fields[key];
    input.addEventListener('blur', () => { if (input.value || key !== 'size') check(key); });
    input.addEventListener('input', () => {
      if (input.closest('.field').classList.contains('has-error')) check(key);
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const results = Object.keys(fields).map((key) => [key, check(key)]);
    const invalid = results.filter(([, ok]) => !ok).map(([key]) => fields[key]);

    if (invalid.length) {
      status.textContent = `有 ${invalid.length} 個欄位需要修改。`;
      invalid[0].focus();
      // 錯誤的欄位輕輕左右晃一下
      if (animate()) {
        gsap.fromTo(invalid.map((el) => el.closest('.field')),
          { x: 0 },
          { keyframes: { x: [-6, 6, -4, 4, 0] }, duration: 0.4, ease: 'power1.inOut' });
      }
      return;
    }

    // 送出中（這是課堂練習網站，沒有後端，用計時器模擬送出）
    status.textContent = '';
    submit.disabled = true;
    submit.textContent = '傳送中…';

    setTimeout(() => {
      const name = fields.name.value.trim();
      const email = fields.email.value.trim();
      success.querySelector('.success-text').textContent =
        `${name}，謝謝你。我們會在兩個工作天內寄信到 ${email}，和你約諮詢時間。（這是課堂練習網站，資料不會真的送出。）`;
      showSuccess();
    }, 1200);
  });

  function showSuccess() {
    const reveal = () => {
      form.hidden = true;
      success.hidden = false;
      success.focus();
      if (!animate()) return;
      // 印章蓋下 → 文字浮現
      gsap.timeline()
        .fromTo('.success-seal', { autoAlpha: 0, scale: 1.8, rotation: -8 },
          { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.5, ease: 'back.out(2.4)' })
        .fromTo('.form-success > :not(.success-seal)', { autoAlpha: 0, y: 14 },
          { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.12, ease: 'power2.out' }, '-=0.1');
    };
    if (animate()) gsap.to(form, { autoAlpha: 0, y: -10, duration: 0.35, onComplete: reveal });
    else reveal();
  }

  success.querySelector('.success-reset').addEventListener('click', () => {
    form.reset();
    Object.keys(fields).forEach((key) => {
      fields[key].closest('.field').classList.remove('has-error');
      fields[key].removeAttribute('aria-invalid');
      document.getElementById(errorIds[key]).textContent = '';
    });
    submit.disabled = false;
    submit.textContent = '送出預約';
    success.hidden = true;
    form.hidden = false;
    if (hasGsap) gsap.set(form, { autoAlpha: 1, y: 0 });
    fields.name.focus();
  });

  /* 從專案詳情點「預約類似的設計」時，先幫忙填好空間類型與一句話 */
  window.prefillContact = (c) => {
    const map = { teahouse: 'teahouse', minsu: 'minsu' };
    fields.type.value = c.category === 'residential' ? 'residential' : (map[c.id] || 'other');
    if (!fields.msg.value.trim()) fields.msg.value = `想了解類似「${c.name}」的設計。`;
  };
})();
