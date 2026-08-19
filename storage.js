/* ============================================================
   FORGE12 — Persistencia local (localStorage)
   Todo vive en el dispositivo del usuario. Exporta/Importa JSON
   para hacer copia de seguridad o pasar de móvil a escritorio.
   ============================================================ */

const LS_KEY = "forge12_state_v1";

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return freshState();
    const parsed = JSON.parse(raw);
    return { ...freshState(), ...parsed, config: { ...DEFAULT_CONFIG, ...(parsed.config || {}) } };
  } catch (e) {
    console.warn("No se pudo leer el estado guardado, empezando de cero.", e);
    return freshState();
  }
}

function freshState() {
  return {
    config: JSON.parse(JSON.stringify(DEFAULT_CONFIG)),
    cursor: 0,          // índice 0-207 dentro del calendario de 208 sesiones
    history: [],         // sesiones completadas: {key, date, principalWeight, principalReps, rpe, est1RM, tonnage}
    completedDates: {},  // "YYYY-MM-DD" -> true (para el calendario)
  };
}

function saveState(state) {
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}

function todayISO() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function exportBackup(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `forge12-backup-${todayISO()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importBackup(file, onDone) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      saveState(parsed);
      onDone(parsed);
    } catch (e) {
      alert("El archivo no es una copia de seguridad válida de FORGE12.");
    }
  };
  reader.readAsText(file);
}
