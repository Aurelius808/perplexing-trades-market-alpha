/* Perplexing Trades — shared interactions
   Boot screen · Voice Briefing player (top-of-page) · Music player · Scroll reveals */

// ─────── BOOT SCREEN ───────
const BOOT_LINES = [
  { t: 100, text: "PERPLEXING TRADES v2.5 — Boot Sequence" },
  { t: 280, text: "» Initializing terminal..", cls: "dim" },
  { t: 420, text: "» Loading Bloomberg feed...                  [ OK ]", cls: "done-l" },
  { t: 560, text: "» Connecting finance_quotes API...           [ OK ]", cls: "done-l" },
  { t: 720, text: "» Fetching insider transactions...           [ OK ]", cls: "done-l" },
  { t: 880, text: "» Parsing LLM Council consensus...           [ OK ]", cls: "done-l" },
  { t: 1020, text: "» Verifying freshness mandate...             [ OK ]", cls: "done-l" },
  { t: 1200, text: "» Compositing macro narrative...             [ OK ]", cls: "done-l" },
  { t: 1360, text: "» Calibrating Lilith voice stream...         [ OK ]", cls: "done-l" },
  { t: 1520, text: "» Signal acquired. Tape is live.", cls: "dim" },
];

function boot() {
  const boot = document.getElementById('boot');
  if (!boot) return;
  const log = document.getElementById('boot-log');
  if (!log) return;
  BOOT_LINES.forEach(line => {
    setTimeout(() => {
      const div = document.createElement('div');
      if (line.cls) div.className = line.cls;
      div.textContent = line.text;
      log.appendChild(div);
    }, line.t);
  });
  setTimeout(() => {
    boot.classList.add('done');
    setTimeout(tryAutoplay, 500);
  }, 2400);
}

// ─────── VOICE BRIEFING PLAYER ───────
let lilithAudio, musicAudio;
let lilithPlaying = false;
let userInteracted = false;
let scrubbing = false;

function tryAutoplay() {
  if (!lilithAudio) return;
  // Only attempt muted-friendly autoplay; if browser blocks, the big play button
  // is the obvious affordance. Do NOT mute (we want the briefing audible) — but
  // gracefully accept rejection.
  lilithAudio.currentTime = 0;
  const p = lilithAudio.play();
  if (p && typeof p.then === 'function') {
    p.catch(() => {
      const status = document.getElementById('vb-status');
      if (status) status.textContent = 'Tap play to start the briefing.';
    });
  }
}

function fmtTime(s) {
  if (!isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function setupPlayers() {
  lilithAudio = document.getElementById('lilith-audio');
  musicAudio = document.getElementById('music-audio');
  if (!lilithAudio) return;

  const playBtn = document.getElementById('vb-play');
  const restartBtn = document.getElementById('vb-restart');
  const wave = document.getElementById('vb-wave');
  const portrait = document.getElementById('vb-portrait-img');
  const scrub = document.getElementById('vb-scrub');
  const cur = document.getElementById('vb-cur');
  const dur = document.getElementById('vb-dur');
  const status = document.getElementById('vb-status');
  const iconPlay = playBtn?.querySelector('.vb-icon-play');
  const iconPause = playBtn?.querySelector('.vb-icon-pause');

  function showPlay(isPlaying) {
    if (!iconPlay || !iconPause) return;
    iconPlay.style.display = isPlaying ? 'none' : '';
    iconPause.style.display = isPlaying ? '' : 'none';
    playBtn.setAttribute('aria-pressed', isPlaying ? 'true' : 'false');
  }

  function duckMusic(on) {
    if (!musicAudio) return;
    const targetVol = on ? 0.15 : 0.65;
    const start = musicAudio.volume;
    const steps = 12;
    let i = 0;
    const id = setInterval(() => {
      i++;
      musicAudio.volume = start + (targetVol - start) * (i / steps);
      if (i >= steps) clearInterval(id);
    }, 40);
  }

  lilithAudio.addEventListener('play', () => {
    lilithPlaying = true;
    wave?.classList.add('active');
    portrait?.classList.add('speaking');
    showPlay(true);
    if (status) status.textContent = 'Now playing — Lilith, live from the desk.';
    duckMusic(true);
  });
  lilithAudio.addEventListener('pause', () => {
    lilithPlaying = false;
    wave?.classList.remove('active');
    portrait?.classList.remove('speaking');
    showPlay(false);
    if (status && !lilithAudio.ended) status.textContent = 'Paused. Resume any time.';
    duckMusic(false);
  });
  lilithAudio.addEventListener('ended', () => {
    wave?.classList.remove('active');
    portrait?.classList.remove('speaking');
    showPlay(false);
    if (status) status.textContent = 'Briefing complete. Restart to replay.';
    duckMusic(false);
  });

  lilithAudio.addEventListener('loadedmetadata', () => {
    if (dur) dur.textContent = fmtTime(lilithAudio.duration);
  });
  function updateProgressFill() {
    if (!scrub) return;
    const pct = (Number(scrub.value) / 1000) * 100;
    scrub.style.setProperty('--vb-progress', pct + '%');
  }

  lilithAudio.addEventListener('timeupdate', () => {
    if (scrubbing) return;
    if (cur) cur.textContent = fmtTime(lilithAudio.currentTime);
    if (scrub && lilithAudio.duration) {
      scrub.value = String(Math.round((lilithAudio.currentTime / lilithAudio.duration) * 1000));
      updateProgressFill();
    }
  });

  playBtn?.addEventListener('click', () => {
    userInteracted = true;
    if (lilithPlaying) {
      lilithAudio.pause();
    } else {
      lilithAudio.play().catch(() => {
        if (status) status.textContent = 'Audio blocked — try the Direct MP3 link.';
      });
    }
  });
  restartBtn?.addEventListener('click', () => {
    userInteracted = true;
    lilithAudio.currentTime = 0;
    lilithAudio.play().catch(() => {});
  });

  if (scrub) {
    const seekFromScrub = () => {
      if (!lilithAudio.duration) return;
      const v = Number(scrub.value) / 1000;
      lilithAudio.currentTime = v * lilithAudio.duration;
      if (cur) cur.textContent = fmtTime(lilithAudio.currentTime);
    };
    scrub.addEventListener('input', () => {
      scrubbing = true;
      updateProgressFill();
      if (!lilithAudio.duration) return;
      const v = Number(scrub.value) / 1000;
      if (cur) cur.textContent = fmtTime(v * lilithAudio.duration);
    });
    scrub.addEventListener('change', () => {
      seekFromScrub();
      scrubbing = false;
    });
    scrub.addEventListener('pointerup', () => { scrubbing = false; });
  }

  // ─── Music Player (legacy, hidden if no UI) ───
  if (musicAudio) {
    const mpBtn = document.getElementById('mp-play');
    const mpSelect = document.getElementById('mp-track');
    const mpTitle = document.getElementById('mp-title');

    const TRACKS = {
      'alright-pacha-mix': { title: 'Alright Pacha Mix', src: 'assets/alright-pacha-mix.mp3' },
      'singularity-spanish': { title: 'Singularity (Spanish)', src: 'assets/singularity-spanish.mp3' },
      'quantum-love-msg': { title: 'Quantum Love MSG', src: 'assets/quantum-love-msg.mp3' },
    };

    if (mpSelect) {
      mpSelect.addEventListener('change', () => {
        const t = TRACKS[mpSelect.value];
        if (!t) return;
        musicAudio.src = t.src;
        if (mpTitle) mpTitle.textContent = t.title;
        musicAudio.play().catch(() => {});
      });
    }
    mpBtn?.addEventListener('click', () => {
      if (musicAudio.paused) musicAudio.play().catch(() => {});
      else musicAudio.pause();
    });
    musicAudio.volume = 0.65;
  }
}

// ─────── SCROLL REVEALS ───────
function reveals() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0, rootMargin: '0px 0px -5% 0px' });
  document.querySelectorAll('[data-reveal]').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight * 1.2) el.classList.add('in');
    else io.observe(el);
  });
  setTimeout(() => {
    document.querySelectorAll('[data-reveal]:not(.in)').forEach(el => el.classList.add('in'));
  }, 8000);
}

// ─────── TICKER TAPE ───────
function tickerLoop() {
  const track = document.querySelector('.ticker-track');
  if (!track) return;
  track.innerHTML += track.innerHTML;
}

// ─────── LIVE TIMESTAMP ───────
function liveTs() {
  const el = document.getElementById('live-ts');
  if (!el) return;
  function update() {
    const d = new Date();
    const hr = d.getHours() % 12 || 12;
    const m = String(d.getMinutes()).padStart(2, '0');
    const s = String(d.getSeconds()).padStart(2, '0');
    const ap = d.getHours() >= 12 ? 'PM' : 'AM';
    el.innerHTML = `<strong>${hr}:${m}:${s}</strong> ${ap} PT`;
  }
  update(); setInterval(update, 1000);
}

// ─────── INIT ───────
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const b = document.getElementById('boot');
    if (b) b.classList.add('done');
    setTimeout(tryAutoplay, 200);
  }
  // Space toggles play when not focused on form input
  if (e.key === ' ' && document.activeElement && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
    const playBtn = document.getElementById('vb-play');
    if (playBtn && document.activeElement !== playBtn) {
      e.preventDefault();
      playBtn.click();
    }
  }
});

document.addEventListener('DOMContentLoaded', () => {
  boot();
  setupPlayers();
  tickerLoop();
  reveals();
  liveTs();
});
