/* ═══════════════════════════════════════════════════════════
   🎵 KANTEEN SIGNATURE SOUND ENGINE
   أصوات توقيعية فريدة لمشروع كانتِين — Web Audio API
   ═══════════════════════════════════════════════════════════ */

(function(){
  'use strict';

  var _audioCtx = null;
  var _isEnabled = true;
  var _volume = 0.35;

  function getCtx(){
    if (!_audioCtx){
      try {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch(e){
        console.warn('❌ AudioContext not supported');
        return null;
      }
    }
    if (_audioCtx.state === 'suspended'){
      _audioCtx.resume().catch(function(){});
    }
    return _audioCtx;
  }

  function playTone(freq, startTime, duration, volume, type){
    var ctx = getCtx();
    if (!ctx) return;

    var osc = ctx.createOscillator();
    var gain = ctx.createGain();

    osc.type = type || 'sine';
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume * _volume, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(volume * _volume * 0.7, startTime + duration * 0.3);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  }

  function playToneVibrato(freq, startTime, duration, volume, vibratoHz, vibratoDepth){
    var ctx = getCtx();
    if (!ctx) return;

    var osc = ctx.createOscillator();
    var lfo = ctx.createOscillator();
    var lfoGain = ctx.createGain();
    var gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.value = freq;

    lfo.type = 'sine';
    lfo.frequency.value = vibratoHz || 5;
    lfoGain.gain.value = vibratoDepth || 3;

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume * _volume, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(volume * _volume * 0.6, startTime + duration * 0.25);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime); lfo.start(startTime);
    osc.stop(startTime + duration + 0.05);
    lfo.stop(startTime + duration + 0.05);
  }

  function playBell(freq, startTime, duration, volume){
    var ctx = getCtx();
    if (!ctx) return;

    playTone(freq, startTime, duration, volume, 'sine');
    playTone(freq * 2, startTime, duration * 0.6, volume * 0.4, 'sine');
    playTone(freq * 1.5, startTime, duration * 0.5, volume * 0.25, 'sine');
    playTone(freq * 3.2, startTime + 0.02, 0.15, volume * 0.15, 'triangle');
  }

  function playSparkle(startTime, count){
    var ctx = getCtx();
    if (!ctx) return;
    count = count || 3;
    var notes = [1568, 1975, 2349, 2637];
    for (var i = 0; i < count; i++){
      var freq = notes[Math.floor(Math.random() * notes.length)];
      var offset = startTime + 0.03 + i * 0.04;
      playTone(freq, offset, 0.15, 0.08, 'sine');
    }
  }

  function ktPlayChime(){
    if (!_isEnabled) return;
    var ctx = getCtx();
    if (!ctx) return;
    var now = ctx.currentTime;

    playBell(587.33, now, 0.9, 0.85);
    playBell(739.99, now + 0.10, 0.8, 0.75);
    playBell(880, now + 0.22, 0.9, 0.7);
    playBell(1174.66, now + 0.34, 1.2, 0.6);

    playSparkle(now + 0.45, 4);
    playTone(880, now + 0.9, 0.4, 0.15, 'sine');
  }

  function ktPlaySuccess(){
    if (!_isEnabled) return;
    var ctx = getCtx();
    if (!ctx) return;
    var now = ctx.currentTime;

    playTone(523.25, now + 0.00, 0.25, 0.6, 'triangle');
    playTone(659.25, now + 0.10, 0.25, 0.6, 'triangle');
    playTone(783.99, now + 0.20, 0.30, 0.65, 'triangle');
    playTone(1046.50, now + 0.32, 0.55, 0.7, 'triangle');

    playTone(523.25, now + 0.00, 0.25, 0.3, 'sine');
    playTone(659.25, now + 0.10, 0.25, 0.3, 'sine');
    playTone(783.99, now + 0.20, 0.30, 0.35, 'sine');
    playTone(1046.50, now + 0.32, 0.55, 0.4, 'sine');

    playSparkle(now + 0.55, 5);
  }

  function ktPlayAlert(){
    if (!_isEnabled) return;
    var ctx = getCtx();
    if (!ctx) return;
    var now = ctx.currentTime;

    playToneVibrato(880, now, 0.35, 0.9, 12, 20);
    playToneVibrato(659.25, now + 0.20, 0.35, 0.9, 12, 20);
    playToneVibrato(880, now + 0.42, 0.35, 0.9, 12, 20);
    playToneVibrato(659.25, now + 0.62, 0.55, 0.9, 12, 20);
  }

  function ktPlayWelcome(){
    if (!_isEnabled) return;
    var ctx = getCtx();
    if (!ctx) return;
    var now = ctx.currentTime;

    playBell(659.25, now + 0.0, 0.6, 0.5);
    playBell(880, now + 0.18, 0.9, 0.55);
    playSparkle(now + 0.3, 3);
  }

  function ktPlayMessage(){
    if (!_isEnabled) return;
    var ctx = getCtx();
    if (!ctx) return;
    var now = ctx.currentTime;

    playTone(1318.51, now + 0.00, 0.10, 0.55, 'sine');
    playTone(1760.00, now + 0.08, 0.18, 0.6, 'sine');
    playTone(1318.51, now + 0.22, 0.14, 0.35, 'sine');
  }

  function ktPlayCash(){
    if (!_isEnabled) return;
    var ctx = getCtx();
    if (!ctx) return;
    var now = ctx.currentTime;

    playTone(1568, now + 0.00, 0.35, 0.7, 'triangle');
    playTone(2093, now + 0.08, 0.30, 0.6, 'triangle');
    playTone(2637, now + 0.16, 0.55, 0.65, 'triangle');
    playTone(3136, now + 0.24, 0.6, 0.45, 'sine');
    playSparkle(now + 0.32, 4);
  }

  window.KT_SOUND = {
    chime:   ktPlayChime,
    success: ktPlaySuccess,
    alert:   ktPlayAlert,
    welcome: ktPlayWelcome,
    message: ktPlayMessage,
    cash:    ktPlayCash,

    enable:  function(){ _isEnabled = true; },
    disable: function(){ _isEnabled = false; },
    isEnabled: function(){ return _isEnabled; },
    setVolume: function(v){ _volume = Math.max(0, Math.min(1, v)); },
    getVolume: function(){ return _volume; },
    playTone: playTone,

    test: function(){
      console.log('🎵 Testing Kanteen Signature Sound...');
      ktPlayChime();
      setTimeout(ktPlaySuccess, 1800);
      setTimeout(ktPlayMessage, 3000);
      setTimeout(ktPlayCash, 4000);
    }
  };

  // ✅ Resume AudioContext على أول تفاعل (لتفادي تحذير Chrome/Edge)
  ['click','touchstart','keydown'].forEach(function(evt){
    document.addEventListener(evt, function(){
      try {
        var ctx = window.__ktAudioCtx;
        if (!ctx){
          var Ctx = window.AudioContext || window.webkitAudioContext;
          if (Ctx) { window.__ktAudioCtx = new Ctx(); ctx = window.__ktAudioCtx; }
        }
        if (ctx && ctx.state === 'suspended') ctx.resume();
      } catch(e){}
    }, { once: true, passive: true });
  });

  console.log('%c🎵 Kanteen Sound Engine Loaded', 'background:linear-gradient(135deg,#a78bfa,#7c3aed);color:#fff;padding:4px 12px;border-radius:6px;font-weight:800;font-size:12px');
})();