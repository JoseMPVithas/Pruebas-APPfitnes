/* ============================================================
   FORGE12 — App principal (estado, navegación, vistas)
   ============================================================ */

let state = loadState();
let schedule = generateSchedule(state.config);
let currentView = "home";
let viewingIndex = state.cursor; // permite mirar otros días sin "completar"
let setsDone = {}; // progreso de checks de la sesión que se está viendo ahora

if (!state.config.startDate) {
  state.config.startDate = todayISO();
  saveState(state);
}

const $view = document.getElementById("view");
const $headerSub = document.getElementById("headerSub");
const $headerWeekPill = document.getElementById("headerWeekPill");

function setView(v) {
  currentView = v;
  document.querySelectorAll("nav.bottomnav button").forEach(b => b.classList.toggle("active", b.dataset.view === v));
  render();
}
document.querySelectorAll("nav.bottomnav button").forEach(b => b.addEventListener("click", () => setView(b.dataset.view)));

function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}

function fmtWeight(v) {
  if (v == null) return "Peso corporal";
  return (Number.isInteger(v) ? v : v.toFixed(1)) + " kg";
}
function fmtRest(sec) {
  if (!sec) return "—";
  const m = Math.floor(sec / 60), s = sec % 60;
  return m > 0 ? `${m} min${s ? " " + s + "s" : ""}` : `${s} seg`;
}

/* ---------------- HOME ---------------- */
function renderHome() {
  const s = schedule[viewingIndex];
  const isToday = viewingIndex === state.cursor;
  $headerSub.textContent = `Mes ${s.month} · Trimestre ${s.trimester}`;
  $headerWeekPill.textContent = `Semana ${s.globalWeek}/52`;

  const phaseColor = PHASE_COLORS[s.phase];
  const blocks = [
    { label: "PRINCIPAL", data: s.principal, key: "principal" },
    { label: "SECUNDARIO", data: s.secundario, key: "secundario" },
    { label: "ACCESORIO 1", data: s.acc1, key: "acc1" },
    { label: "ACCESORIO 2", data: s.acc2, key: "acc2" },
  ];

  $view.innerHTML = `
    <div class="hero" style="background: linear-gradient(135deg, ${phaseColor}33, rgba(6,182,212,0.08))">
      <div class="row-between">
        <span class="eyebrow">${s.dayLabel} · ${s.group}</span>
        ${!isToday ? '<span class="chip">Vista previa</span>' : ""}
      </div>
      <h1>${s.phase}</h1>
      <div class="meta">
        <span class="chip phase" style="background:${phaseColor}">Semana ${s.globalWeek}</span>
        <span class="chip">Mes ${s.month}</span>
      </div>
      <p class="muted" style="margin-top:10px">${s.notes}</p>
    </div>

    ${blocks.map(b => renderExerciseBlock(b)).join("")}

    <div class="spacer-8"></div>
    ${isToday
      ? `<button class="btn btn-primary" id="completeBtn">✓ Completar entrenamiento</button>`
      : `<button class="btn btn-ghost" id="backToTodayBtn">Volver a hoy (semana ${schedule[state.cursor].globalWeek}, ${schedule[state.cursor].dayLabel})</button>`
    }
    <div class="spacer-8"></div>
    <div class="row-between">
      <button class="btn btn-ghost btn-sm" id="prevDayBtn">‹ Día anterior</button>
      <button class="btn btn-ghost btn-sm" id="nextDayBtn">Día siguiente ›</button>
    </div>
  `;

  blocks.forEach(b => wireExerciseBlock(b));
  document.getElementById("prevDayBtn").onclick = () => { viewingIndex = Math.max(0, viewingIndex - 1); setsDone = {}; render(); };
  document.getElementById("nextDayBtn").onclick = () => { viewingIndex = Math.min(schedule.length - 1, viewingIndex + 1); setsDone = {}; render(); };
  if (isToday) {
    document.getElementById("completeBtn").onclick = completeSession;
  } else {
    document.getElementById("backToTodayBtn").onclick = () => { viewingIndex = state.cursor; setsDone = {}; render(); };
  }
}

function renderExerciseBlock(b) {
  const d = b.data;
  const sets = d.sets || 0;
  const doneCount = setsDone[b.key] || 0;
  const setBoxes = Array.from({ length: sets || 0 }, (_, i) => `<div class="set-box ${i < doneCount ? "done" : ""}" data-block="${b.key}" data-idx="${i}">${i + 1}</div>`).join("");
  return `
    <div class="exercise">
      <div class="exrow">
        <div>
          <div class="tag">${b.label}</div>
          <div class="name">${d.name}</div>
        </div>
      </div>
      <div class="stats">
        <div class="stat"><div class="v">${sets || "—"}</div><div class="l">Series</div></div>
        <div class="stat"><div class="v">${d.reps ?? "—"}</div><div class="l">Reps</div></div>
        <div class="stat"><div class="v">${fmtWeight(d.weight)}</div><div class="l">Peso</div></div>
      </div>
      ${setBoxes ? `<div class="sets-row">${setBoxes}</div>` : ""}
      ${d.rest ? `<button class="rest-btn" data-rest="${d.rest}" data-label="${d.name}">⏱ Descanso: ${fmtRest(d.rest)}</button>` : ""}
    </div>
  `;
}

function wireExerciseBlock(b) {
  document.querySelectorAll(`.set-box[data-block="${b.key}"]`).forEach(el => {
    el.addEventListener("click", () => {
      const idx = parseInt(el.dataset.idx);
      const cur = setsDone[b.key] || 0;
      setsDone[b.key] = idx < cur ? idx : idx + 1;
      render();
    });
  });
}
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".rest-btn");
  if (btn) startRestTimer(parseInt(btn.dataset.rest), btn.dataset.label);
});

function completeSession() {
  const s = schedule[state.cursor];
  const date = todayISO();
  state.history.push({
    key: s.key, date, week: s.globalWeek, month: s.month, phase: s.phase,
    principalName: s.principal.name, principalWeight: s.principal.weight,
    principalReps: s.principal.reps, tonnage: (s.principal.weight || 0) * s.principal.sets * s.principal.reps,
  });
  state.completedDates[date] = true;
  state.cursor = (state.cursor + 1) % schedule.length;
  viewingIndex = state.cursor;
  setsDone = {};
  saveState(state);
  toast("¡Sesión completada! 💪");
  render();
}

/* ---------------- PLAN ---------------- */
function renderPlan() {
  $headerSub.textContent = "Plan completo · 12 meses";
  $headerWeekPill.textContent = "52 semanas";

  let html = `<p class="muted">Toca una semana para ver sus 4 días. Esto es solo consulta — tu progreso real se marca en la pestaña Hoy.</p>`;
  for (let month = 1; month <= 12; month++) {
    const [wkStart, wkEnd] = monthWeekRange(month);
    html += `<div class="month-banner"><span>MES ${month}</span><span>Semanas ${wkStart}-${wkEnd}</span></div>`;
    for (let w = wkStart; w <= wkEnd; w++) {
      const sessions = schedule.filter(s => s.globalWeek === w);
      const phase = sessions[0].phase;
      html += `
        <div class="week-group" id="wk-${w}">
          <div class="week-head" data-week="${w}">
            <span>Semana ${w} <span class="muted" style="font-weight:600">· ${phase}</span></span>
            <span>›</span>
          </div>
          <div class="week-body">
            ${sessions.map(s => `<div class="day-mini"><span class="n">${s.dayLabel}</span><span>${s.principal.name} — ${fmtWeight(s.principal.weight)}</span></div>`).join("")}
          </div>
        </div>`;
    }
  }
  $view.innerHTML = html;
  document.querySelectorAll(".week-head").forEach(h => {
    h.addEventListener("click", () => {
      document.getElementById(`wk-${h.dataset.week}`).classList.toggle("open");
    });
  });
}

/* ---------------- PROGRESO ---------------- */
function renderProgreso() {
  $headerSub.textContent = "Tu evolución";
  $headerWeekPill.textContent = `${state.history.length} sesiones`;

  const labels5 = ["Sem 0", "Sem 13", "Sem 26", "Sem 39", "Sem 52"];
  const liftColors = { pressBanca: "#6366f1", sentadilla: "#06b6d4", pesoMuertoConv: "#f43f5e", pesoMuertoRum: "#fb7185", dominadas: "#f59e0b", fondos: "#2dd4bf" };

  // volumen mensual programado
  const monthlyTonnage = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    return schedule.filter(s => s.month === m).reduce((sum, s) => {
      const t1 = (s.principal.weight || 0) * s.principal.sets * s.principal.reps;
      const t2 = s.secundario.tracked ? (s.secundario.weight || 0) * s.secundario.sets * (parseInt(s.secundario.reps) || 0) : 0;
      return sum + t1 + t2;
    }, 0);
  });

  $view.innerHTML = `
    <div class="kpi-grid">
      <div class="card tight kpi"><div class="v">${state.history.length}</div><div class="l">Sesiones completadas</div></div>
      <div class="card tight kpi"><div class="v">${schedule[state.cursor].globalWeek}/52</div><div class="l">Semana actual</div></div>
    </div>

    <div class="section-title">Evolución de 1RM (trimestral)</div>
    <div class="card"><canvas class="chart" id="rmChart"></canvas></div>

    <div class="section-title">Volumen mensual programado (kg)</div>
    <div class="card"><canvas class="chart" id="volChart"></canvas></div>

    <div class="section-title">Objetivos</div>
    <div class="card" id="objetivosCard"></div>

    <div class="section-title">Calendario (últimas semanas)</div>
    <div class="card" id="calCard"></div>
  `;

  const rmSeries = LIFT_KEYS.map(k => ({ data: state.config.oneRM[k], color: liftColors[k] }));
  drawLineChart(document.getElementById("rmChart"), rmSeries, labels5);
  drawBarChart(document.getElementById("volChart"), monthlyTonnage, Array.from({ length: 12 }, (_, i) => "M" + (i + 1)));

  const objCard = document.getElementById("objetivosCard");
  objCard.innerHTML = LIFT_KEYS.map(k => {
    const inicial = state.config.oneRM[k][0];
    const objetivo = state.config.objetivos[k];
    const actual = [...state.config.oneRM[k]].reverse().find(v => v != null && v !== "") ?? inicial;
    const pct = objetivo === inicial ? 0 : Math.max(0, Math.min(100, Math.round(((actual - inicial) / (objetivo - inicial)) * 100)));
    return `
      <div style="margin-bottom:14px">
        <div class="row-between"><span style="font-weight:700;font-size:13.5px">${LIFT_LABELS[k]}</span><span class="muted">${actual} / ${objetivo} kg</span></div>
        <div style="height:8px;background:rgba(255,255,255,0.06);border-radius:99px;margin-top:6px;overflow:hidden">
          <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#6366f1,#06b6d4);border-radius:99px"></div>
        </div>
      </div>`;
  }).join("");

  document.getElementById("calCard").innerHTML = renderCalendarHeatmap();
}

function renderCalendarHeatmap() {
  const days = 35;
  const today = new Date();
  let cells = "";
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const iso = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    const done = !!state.completedDates[iso];
    const isToday = iso === todayISO();
    cells += `<div class="cal-cell ${done ? "done" : ""} ${isToday ? "today" : ""}" title="${iso}"></div>`;
  }
  return `<div class="cal-grid">${cells}</div><p class="muted" style="margin-top:10px">Últimos 35 días. Se marca al completar una sesión en "Hoy".</p>`;
}

/* ---------------- AJUSTES ---------------- */
function renderAjustes() {
  $headerSub.textContent = "Configuración";
  $headerWeekPill.textContent = "";

  const testLabels = ["Inicial", "Test S13", "Test S26", "Test S39", "Test S52 (final)"];

  $view.innerHTML = `
    <div class="card">
      <label class="field">
        <span class="fl">Peso corporal actual (kg)</span>
        <input type="number" step="0.5" id="bwInput" value="${state.config.bodyweight}">
      </label>
      <p class="muted">Se usa para calcular el lastre de dominadas y fondos.</p>
    </div>

    ${LIFT_KEYS.map(k => `
      <div class="card">
        <div style="font-weight:800;margin-bottom:10px">${LIFT_LABELS[k]}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          ${testLabels.map((tl, i) => `
            <label class="field" style="margin-bottom:4px">
              <span class="fl">${tl}</span>
              <input type="number" step="0.5" class="rmInput" data-lift="${k}" data-idx="${i}" value="${state.config.oneRM[k][i] ?? ""}">
            </label>`).join("")}
        </div>
        <label class="field" style="margin-top:4px">
          <span class="fl">Objetivo fin de año (kg)</span>
          <input type="number" step="0.5" class="objInput" data-lift="${k}" value="${state.config.objetivos[k]}">
        </label>
      </div>
    `).join("")}

    <button class="btn btn-primary" id="saveConfigBtn">Guardar cambios</button>
    <div class="spacer-16"></div>

    <div class="card">
      <div style="font-weight:800;margin-bottom:10px">Copia de seguridad</div>
      <p class="muted">Todo se guarda en este dispositivo. Exporta un backup si vas a cambiar de móvil.</p>
      <div class="row-between" style="gap:10px;margin-top:10px">
        <button class="btn btn-ghost" id="exportBtn">Exportar</button>
        <button class="btn btn-ghost" id="importBtn">Importar</button>
      </div>
      <input type="file" id="importFile" accept="application/json" style="display:none">
    </div>

    <div class="card">
      <div style="font-weight:800;margin-bottom:10px;color:#fca5b5">Zona de peligro</div>
      <button class="btn btn-danger" id="resetBtn">Reiniciar progreso (mantiene tus 1RM)</button>
    </div>
  `;

  document.getElementById("saveConfigBtn").onclick = () => {
    state.config.bodyweight = parseFloat(document.getElementById("bwInput").value) || state.config.bodyweight;
    document.querySelectorAll(".rmInput").forEach(inp => {
      const v = inp.value === "" ? null : parseFloat(inp.value);
      state.config.oneRM[inp.dataset.lift][parseInt(inp.dataset.idx)] = v;
    });
    document.querySelectorAll(".objInput").forEach(inp => {
      state.config.objetivos[inp.dataset.lift] = parseFloat(inp.value) || state.config.objetivos[inp.dataset.lift];
    });
    schedule = generateSchedule(state.config);
    saveState(state);
    toast("Configuración guardada");
  };

  document.getElementById("exportBtn").onclick = () => exportBackup(state);
  document.getElementById("importBtn").onclick = () => document.getElementById("importFile").click();
  document.getElementById("importFile").onchange = (e) => {
    if (e.target.files[0]) importBackup(e.target.files[0], (parsed) => {
      state = { ...freshState(), ...parsed, config: { ...DEFAULT_CONFIG, ...(parsed.config || {}) } };
      schedule = generateSchedule(state.config);
      viewingIndex = state.cursor;
      toast("Backup importado");
      render();
    });
  };
  document.getElementById("resetBtn").onclick = () => {
    if (!confirm("¿Reiniciar progreso? Se borrará tu historial y calendario, pero tus 1RM y objetivos se mantienen.")) return;
    state.cursor = 0; state.history = []; state.completedDates = {};
    viewingIndex = 0; setsDone = {};
    saveState(state);
    toast("Progreso reiniciado");
    render();
  };
}

/* ---------------- ROUTER ---------------- */
function render() {
  if (currentView === "home") renderHome();
  else if (currentView === "plan") renderPlan();
  else if (currentView === "progreso") renderProgreso();
  else if (currentView === "ajustes") renderAjustes();
}

render();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  });
}
