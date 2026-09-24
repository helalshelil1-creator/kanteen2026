/* ═══════════════════════════════════════════════════════════
   🎬 CINEMATIC KANTEEN — Animations + Video Swap
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var EASE = 'cubic-bezier(.16,1,.3,1)';
  var FADE_DURATION = 700;
  var DELAY_STEP = 100;

  // ═══════════════════════════════════════════════════════════
  // 1. WORD-BY-WORD BLUR REVEAL للـ Hero
  // ═══════════════════════════════════════════════════════════
  function applyBlurReveal(container) {
    if (!container) return;
    var words = container.querySelectorAll('.k-word');
    if (!words.length) return;

    words.forEach(function (word, i) {
      word.style.filter = 'blur(10px)';
      word.style.opacity = '0';
      word.style.transform = 'translateY(50px)';
      word.style.display = 'inline-block';
      word.style.transition = [
        'filter ' + FADE_DURATION + 'ms ' + EASE + ' ' + (i * DELAY_STEP) + 'ms',
        'opacity ' + FADE_DURATION + 'ms ' + EASE + ' ' + (i * DELAY_STEP) + 'ms',
        'transform ' + FADE_DURATION + 'ms ' + EASE + ' ' + (i * DELAY_STEP) + 'ms'
      ].join(', ');

      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          word.style.filter = 'blur(0)';
          word.style.opacity = '1';
          word.style.transform = 'translateY(0)';
        });
      });
    });
  }

  // ═══════════════════════════════════════════════════════════
  // 2. استبدال فيديو الخلفية بفيديو الفضاء
  // ═══════════════════════════════════════════════════════════
  function swapBackgroundVideo() {
    var video = document.getElementById('k-bg-video');
    if (!video) return;

    // فيديو الفضاء السينمائي من البرومت
    var CINEMATIC_VIDEO = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_080021_d598092b-c4c2-4e53-8e46-94cf9064cd50.mp4';
    var CINEMATIC_POSTER = 'https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/130837c4-0244-4f37-9c61-8d801d93fd29.jpg';

    // غير الفيديو لو لسه مش هو
    var currentSrc = video.getAttribute('src') || '';
    if (currentSrc.indexOf('hf_20260418_080021') === -1) {
      video.setAttribute('src', CINEMATIC_VIDEO);
      video.setAttribute('poster', CINEMATIC_POSTER);
      video.load();
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 3. Init
  // ═══════════════════════════════════════════════════════════
  function init() {
    // 1) Blur reveal على Hero h1
    var heroes = document.querySelectorAll('.k-hero h1');
    heroes.forEach(function (h) { applyBlurReveal(h); });

    // 2) استبدل فيديو الخلفية (مرة واحدة)
    if (!window.__cinematicVideoSwapped) {
      swapBackgroundVideo();
      window.__cinematicVideoSwapped = true;
    }

    // 3) MutationObserver للتعامل مع التنقل بين الصفحات (SPA)
    if (window.MutationObserver && !window.__cinematicObserver) {
      var observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (m) {
          m.addedNodes.forEach(function (node) {
            if (node.nodeType === 1) {
              var newHero = node.querySelector ? node.querySelector('.k-hero h1') : null;
              if (newHero) applyBlurReveal(newHero);
            }
          });
        });
      });
      var main = document.querySelector('#k-main');
      if (main) {
        observer.observe(main, { childList: true, subtree: true });
        window.__cinematicObserver = observer;
      }
    }

    console.log('%c🎬 Cinematic Kanteen loaded', 'background:linear-gradient(135deg,#fff,#999);color:#000;padding:4px 12px;border-radius:6px;font-weight:800;font-size:12px');
  }

  // شغّل عند التحميل
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // شغّل عند hashchange (SPA)
  window.addEventListener('hashchange', function () {
    setTimeout(function () {
      var heroes = document.querySelectorAll('.k-hero h1');
      heroes.forEach(function (h) { applyBlurReveal(h); });
    }, 100);
  });
})();