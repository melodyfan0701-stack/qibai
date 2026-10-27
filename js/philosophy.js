/* =========================================================
   棲白 QIBAI Studio — philosophy.js
   2. 設計理念：捲動到這一區時的動畫（ScrollTrigger）
   - 直書標題逐字由模糊變清楚（和 Hero 標題同一種墨暈效果）
   - 三張照片像卷軸一樣由右往左展開
   - 照片在框裡隨捲動慢慢移動，產生景深
   ========================================================= */

(function () {
  'use strict';

  if (!window.gsap || !window.ScrollTrigger) return;

  // 直書標題拆字
  const titleText = document.querySelector('.philo-title-text');
  const chars = [...titleText.textContent];
  titleText.innerHTML = chars.map((ch) => `<span class="char">${ch}</span>`).join('');

  const mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: no-preference)', () => {

    // 標題：逐字墨暈
    gsap.from('.philo-title-text .char', {
      autoAlpha: 0,
      filter: 'blur(10px)',
      y: -10,
      duration: 1,
      stagger: 0.12,
      ease: 'power1.out',
      clearProps: 'filter',
      scrollTrigger: { trigger: '.philosophy', start: 'top 70%', once: true }
    });

    // 主張文字
    gsap.from('.philo-main > .eyebrow, .philo-statement', {
      autoAlpha: 0,
      y: 24,
      duration: 1,
      stagger: 0.15,
      ease: 'power2.out',
      scrollTrigger: { trigger: '.philo-statement', start: 'top 85%', once: true }
    });

    // 三個理念：卷軸展開 → 浮水印字 → 標題與說明
    document.querySelectorAll('.concept').forEach((concept) => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: concept, start: 'top 85%', once: true }
      });
      tl.fromTo(concept.querySelector('.concept-photo'),
          { clipPath: 'inset(0% 0% 0% 100%)' },
          { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'power3.inOut' })
        .from(concept.querySelector('.concept-mark'),
          { autoAlpha: 0, scale: 1.4, duration: 0.5, ease: 'back.out(2)' }, '-=0.4')
        .from(concept.querySelectorAll('h3, p'),
          { autoAlpha: 0, y: 16, duration: 0.7, stagger: 0.1, ease: 'power2.out' }, '-=0.3');

      // 照片在框裡隨捲動慢慢移動
      gsap.fromTo(concept.querySelector('img'),
        { yPercent: -6 },
        {
          yPercent: 6,
          ease: 'none',
          scrollTrigger: { trigger: concept, start: 'top bottom', end: 'bottom top', scrub: true }
        });
    });
  });
})();
