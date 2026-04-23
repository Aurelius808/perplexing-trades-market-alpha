/* Perplexing Trades — shared interactions
   Boot screen · Lilith voice player · Music player · Scroll reveals */

// ─────── BOOT SCREEN ───────
const BOOT_LINES = [
  { t: 100, text: "PERPLEXING TRADES v2.4 — Boot Sequence" },
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
    // Auto-start Lilith voice shortly after boot
    setTimeout(startLilith, 500);
  }, 2400);
}

// ─────── LILITH VOICE PLAYER (with music ducking) ───────
let lilithAudio, musicAudio, lilithPlaying = false;

function startLilith() {
  if (!lilithAudio) return;
  lilithAudio.currentTime = 0;
  lilithAudio.volume = 1;
  const p = lilithAudio.play();
  if (p !== undefined) p.catch(() => { /* autoplay blocked — user must click */ });
}

function setupPlayers() {
  lilithAudio = document.getElementById('lilith-audio');
  musicAudio = document.getElementById('music-audio');
  if (!lilithAudio || !musicAudio) return;

  const lvpBtn = document.getElementById('lvp-play');
  const lvpRestart = document.getElementById('lvp-restart');
  const wave = document.getElementById('lvp-wave');
  const avatar = document.getElementById('lvp-avatar');

  function duckMusic(on) {
    if (!musicAudio) return;
    const targetVol = on ? 0.15 : 0.65;
    // smooth fade
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
    avatar?.classList.add('speaking');
    lvpBtn.innerHTML = pauseIcon();
    duckMusic(true);
  });
  lilithAudio.addEventListener('pause', () => {
    lilithPlaying = false;
    wave?.classList.remove('active');
    avatar?.classList.remove('speaking');
    lvpBtn.innerHTML = playIcon();
    duckMusic(false);
  });
  lilithAudio.addEventListener('ended', () => {
    wave?.classList.remove('active');
    avatar?.classList.remove('speaking');
    lvpBtn.innerHTML = playIcon();
    duckMusic(false);
  });

  lvpBtn?.addEventListener('click', () => {
    if (lilithPlaying) lilithAudio.pause(); else lilithAudio.play();
  });
  lvpRestart?.addEventListener('click', () => {
    lilithAudio.currentTime = 0;
    lilithAudio.play();
  });

  // ─── Music Player ───
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
      mpTitle.textContent = t.title;
      musicAudio.play().catch(() => {});
      mpBtn.innerHTML = pauseIcon();
    });
  }
  mpBtn?.addEventListener('click', () => {
    if (musicAudio.paused) {
      musicAudio.play().catch(() => {});
      mpBtn.innerHTML = pauseIcon();
    } else {
      musicAudio.pause();
      mpBtn.innerHTML = playIcon();
    }
  });
  musicAudio.volume = 0.65;
}

function playIcon() { return `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 2L11 7L3 12V2Z" fill="currentColor"/></svg>`; }
function pauseIcon() { return `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="3" y="2" width="3" height="10" fill="currentColor"/><rect x="8" y="2" width="3" height="10" fill="currentColor"/></svg>`; }
function restartIcon() { return `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2V6L10 4L7 2Z" fill="currentColor"/><path d="M12 7A5 5 0 1 1 7 2" stroke="currentColor" stroke-width="1.4" fill="none"/></svg>`; }

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
  // Pre-reveal anything already above the fold or scrolled past
  document.querySelectorAll('[data-reveal]').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight * 1.2) el.classList.add('in');
    else io.observe(el);
  });
  // Safety: fail-open after 8s — never leave anything invisible
  setTimeout(() => {
    document.querySelectorAll('[data-reveal]:not(.in)').forEach(el => el.classList.add('in'));
  }, 8000);
}

// ─────── TICKER TAPE (duplicate for seamless scroll) ───────
function tickerLoop() {
  const track = document.querySelector('.ticker-track');
  if (!track) return;
  track.innerHTML += track.innerHTML; // double for seamless loop
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
// Allow ESC to skip boot
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const b = document.getElementById('boot');
    if (b) b.classList.add('done');
    setTimeout(startLilith, 200);
  }
});

document.addEventListener('DOMContentLoaded', () => {
  boot();
  setupPlayers();
  const lvpBtn = document.getElementById('lvp-play');
  const lvpRestart = document.getElementById('lvp-restart');
  const mpBtn = document.getElementById('mp-play');
  if (lvpBtn) lvpBtn.innerHTML = playIcon();
  if (lvpRestart) lvpRestart.innerHTML = restartIcon();
  if (mpBtn) mpBtn.innerHTML = playIcon();
  tickerLoop();
  reveals();
  liveTs();
});
