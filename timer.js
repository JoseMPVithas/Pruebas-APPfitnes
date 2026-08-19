/* ============================================================
   FORGE12 — Temporizador de descanso con vibración
   ============================================================ */

let timerInterval = null;

function startRestTimer(seconds, label) {
  if (!seconds || seconds <= 0) return;
  stopRestTimer();

  const overlay = document.createElement("div");
  overlay.className = "timer-overlay";
  overlay.id = "timerOverlay";
  const R = 96, C = 2 * Math.PI * R;
  overlay.innerHTML = `
    <div class="timer-ring">
      <svg width="220" height="220">
        <defs>
          <linearGradient id="tgrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#6366f1"/>
            <stop offset="100%" stop-color="#06b6d4"/>
          </linearGradient>
        </defs>
        <circle class="bg" cx="110" cy="110" r="${R}" fill="none" stroke-width="10"></circle>
        <circle class="fg" id="timerCircle" cx="110" cy="110" r="${R}" fill="none" stroke-width="10"
          stroke-dasharray="${C}" stroke-dashoffset="0"></circle>
      </svg>
      <div class="timer-num" id="timerNum">${seconds}</div>
    </div>
    <div class="timer-label">${label || "Descanso"}</div>
    <div class="timer-actions">
      <button class="btn btn-ghost btn-sm" id="timerMinus15">−15s</button>
      <button class="btn btn-primary btn-sm" id="timerSkip">Saltar</button>
      <button class="btn btn-ghost btn-sm" id="timerPlus15">+15s</button>
    </div>
  `;
  document.body.appendChild(overlay);

  let remaining = seconds;
  const total = seconds;
  const circle = overlay.querySelector("#timerCircle");
  const num = overlay.querySelector("#timerNum");

  function render() {
    num.textContent = remaining;
    const offset = C * (1 - remaining / total);
    circle.style.strokeDashoffset = offset;
  }
  render();

  timerInterval = setInterval(() => {
    remaining -= 1;
    if (remaining <= 0) {
      if (navigator.vibrate) navigator.vibrate([200, 80, 200, 80, 300]);
      stopRestTimer();
      return;
    }
    if (remaining <= 3 && navigator.vibrate) navigator.vibrate(60);
    render();
  }, 1000);

  overlay.querySelector("#timerSkip").onclick = stopRestTimer;
  overlay.querySelector("#timerPlus15").onclick = () => { remaining += 15; render(); };
  overlay.querySelector("#timerMinus15").onclick = () => { remaining = Math.max(1, remaining - 15); render(); };
  overlay.addEventListener("click", (e) => { if (e.target === overlay) stopRestTimer(); });
}

function stopRestTimer() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  const overlay = document.getElementById("timerOverlay");
  if (overlay) overlay.remove();
}
