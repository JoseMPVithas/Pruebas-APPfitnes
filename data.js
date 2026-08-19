/* ============================================================
   FORGE12 — Motor de datos del programa
   Puerto 1:1 de la lógica del Excel (Config / Programa Anual):
   4 trimestres de 13 semanas, 4 días/semana, %1RM por fase,
   accesorios estimados por coeficiente, descansos por fase.
   ============================================================ */

const WEEK_TEMPLATE = [
  // [pct, sets, reps, phase]
  [0.65, 4, 10, "Hipertrofia"],
  [0.68, 4, 9, "Hipertrofia"],
  [0.72, 4, 8, "Hipertrofia"],
  [0.55, 3, 10, "Descarga"],
  [0.70, 4, 8, "Fuerza-Hipertrofia"],
  [0.75, 4, 6, "Fuerza-Hipertrofia"],
  [0.78, 4, 6, "Fuerza-Hipertrofia"],
  [0.55, 3, 8, "Descarga"],
  [0.80, 5, 5, "Fuerza"],
  [0.85, 5, 3, "Fuerza"],
  [0.88, 5, 2, "Fuerza"],
  [0.60, 3, 6, "Descarga"],
  [0.95, 1, 1, "Test 1RM"],
];

const PHASE_COLORS = {
  "Hipertrofia": "#2dd4bf",
  "Fuerza-Hipertrofia": "#f59e0b",
  "Fuerza": "#f43f5e",
  "Descarga": "#38bdf8",
  "Test 1RM": "#eab308",
};

const NOTAS_FASE = {
  "Hipertrofia": "Bloque de volumen. Tempo 2-0-2, deja 1-2 reps en reserva.",
  "Fuerza-Hipertrofia": "Bloque mixto. Algo más de intensidad, técnica estricta.",
  "Fuerza": "Bloque de fuerza. Descansos largos, técnica antes que velocidad.",
  "Descarga": "Semana de descarga. RPE 6-7, prioriza movilidad y técnica.",
  "Test 1RM": "Semana de test. Calienta en progresión y busca un nuevo 1RM real. Actualízalo en Ajustes.",
};

const REST_PRINCIPAL = { "Hipertrofia": 105, "Fuerza-Hipertrofia": 150, "Fuerza": 210, "Descarga": 90, "Test 1RM": 270 };
const REST_SECUNDARIO = { "Hipertrofia": 90, "Fuerza-Hipertrofia": 105, "Fuerza": 150, "Descarga": 75, "Test 1RM": 150 };
const REST_ACCESORIO = { "Hipertrofia": 68, "Fuerza-Hipertrofia": 75, "Fuerza": 83, "Descarga": 60, "Test 1RM": 0 };

const LIFT_KEYS = ["pressBanca", "sentadilla", "pesoMuertoConv", "pesoMuertoRum", "dominadas", "fondos"];
const LIFT_LABELS = {
  pressBanca: "Press de Banca con Barra",
  sentadilla: "Sentadilla Trasera con Barra",
  pesoMuertoConv: "Peso Muerto Convencional",
  pesoMuertoRum: "Peso Muerto Rumano",
  dominadas: "Dominadas Lastradas",
  fondos: "Fondos Lastrados (paralelas)",
};
const BODYWEIGHT_LIFTS = new Set(["dominadas", "fondos"]);

const DEFAULT_CONFIG = {
  bodyweight: 62,
  oneRM: {
    pressBanca: [100, 102.5, 105, 107.5, 109],
    sentadilla: [140, 143.5, 147, 150.5, 153],
    pesoMuertoConv: [170, 174, 178.5, 183, 185.5],
    pesoMuertoRum: [145, 148.5, 152, 156, 158],
    dominadas: [105, 107.5, 110, 113, 114.5],
    fondos: [120, 123, 126, 129, 131],
  },
  objetivos: {
    pressBanca: 112.5, sentadilla: 155, pesoMuertoConv: 190,
    pesoMuertoRum: 160, dominadas: 117.5, fondos: 132.5,
  },
  startDate: null, // se fija la primera vez que el usuario abre la app
};

function round(v, inc) { return Math.round(v / inc) * inc; }

// Peso objetivo de un lift trackeado (barra o lastre de calistenia con peso)
function trackedWeight(liftKey, pct, cfg, trimIdx) {
  const oneRM = cfg.oneRM[liftKey][trimIdx];
  if (BODYWEIGHT_LIFTS.has(liftKey)) {
    return Math.max(round(oneRM * pct - cfg.bodyweight, 2.5), 0);
  }
  return round(oneRM * pct, 2.5);
}

// Plantillas de día: accesorios NO trackeados llevan {name, coef, basis, round}
// basis "L" = peso del principal ese día · "BW" = peso corporal
const DAY_TEMPLATES = [
  { // Día 1
    dia: "Día 1", grupo: "Tren Superior — Empuje",
    principalKey: "pressBanca",
    secundarioKey: "fondos",
    acc1: [
      { name: "Press Militar con Barra de pie", coef: 0.55, basis: "L", round: 2.5 },
      { name: "Press Arnold con Mancuernas (por mano)", coef: 0.20, basis: "L", round: 1 },
      { name: "Press Militar con Barra de pie", coef: 0.55, basis: "L", round: 2.5 },
      { name: "Press Inclinado con Mancuernas (por mano)", coef: 0.22, basis: "L", round: 1 },
    ],
    acc1SR: "3x8-10",
    acc2: [
      { name: "Elevaciones Laterales con Mancuernas (por mano)", coef: 0.045, basis: "BW", round: 1 },
      { name: "Face Pull en Polea", coef: 0.18, basis: "BW", round: 2.5 },
      { name: "Elevaciones Laterales en Polea (por mano)", coef: 0.04, basis: "BW", round: 1 },
      { name: "Pájaros con Mancuernas (por mano)", coef: 0.035, basis: "BW", round: 1 },
    ],
    acc2SR: "3x12-15",
  },
  { // Día 2
    dia: "Día 2", grupo: "Tren Inferior — Empuje (rodilla)",
    principalKey: "sentadilla",
    secundarioKey: null,
    secundario: [
      { name: "Prensa de Piernas 45°", coef: 2.20, basis: "L", round: 5 },
      { name: "Sentadilla Frontal con Barra", coef: 0.80, basis: "L", round: 2.5 },
      { name: "Zancadas Caminando con Mancuernas (por mano)", coef: 0.18, basis: "L", round: 1 },
      { name: "Prensa de Piernas 45°", coef: 2.20, basis: "L", round: 5 },
    ],
    secundarioSR: "3x10-12",
    acc1: [
      { name: "Extensión de Cuádriceps en Máquina", coef: 0.35, basis: "BW", round: 2.5 },
      { name: "Sentadilla Búlgara con Mancuernas (por mano)", coef: 0.20, basis: "L", round: 1 },
      { name: "Extensión de Cuádriceps en Máquina", coef: 0.35, basis: "BW", round: 2.5 },
      { name: "Zancadas Caminando con Mancuernas (por mano)", coef: 0.18, basis: "L", round: 1 },
    ],
    acc1SR: "3x12-15",
    acc2: Array(4).fill({ name: "Elevación de Talones de Pie (gemelo)", coef: 0.90, basis: "BW", round: 2.5 }),
    acc2SR: "4x15-20",
  },
  { // Día 3
    dia: "Día 3", grupo: "Tren Superior — Tracción",
    principalKey: "dominadas",
    secundarioKey: null,
    secundario: [
      { name: "Remo Pendlay con Barra", coef: 0.65, basis: "BW", round: 2.5 },
      { name: "Remo Pendlay con Barra", coef: 0.65, basis: "BW", round: 2.5 },
      { name: "Remo en Máquina Agarre Neutro", coef: 0.65, basis: "BW", round: 2.5 },
      { name: "Remo Pendlay con Barra", coef: 0.65, basis: "BW", round: 2.5 },
    ],
    secundarioSR: "3x8-10",
    acc1: [
      { name: "Jalón al Pecho Agarre Cerrado", coef: 0.55, basis: "BW", round: 2.5 },
      { name: "Remo con Mancuerna a Una Mano (por mano)", coef: 0.35, basis: "BW", round: 1 },
      { name: "Jalón al Pecho Agarre Supino", coef: 0.55, basis: "BW", round: 2.5 },
      { name: "Remo en Polea Baja Agarre Estrecho", coef: 0.55, basis: "BW", round: 2.5 },
    ],
    acc1SR: "3x10-12",
    acc2: [
      { name: "Curl de Bíceps con Barra Z", coef: 0.25, basis: "BW", round: 2.5 },
      { name: "Curl Martillo con Mancuernas (por mano)", coef: 0.12, basis: "BW", round: 1 },
      { name: "Curl de Bíceps con Barra Z", coef: 0.25, basis: "BW", round: 2.5 },
      { name: "Curl en Banco Scott", coef: 0.20, basis: "BW", round: 2.5 },
    ],
    acc2SR: "3x12-15",
  },
  { // Día 4 — principal alterna Convencional/Rumano por paridad de semana
    dia: "Día 4", grupo: "Tren Inferior — Tracción (cadera)",
    principalKey: null,
    secundarioKey: null,
    secundario: Array(4).fill({ name: "Hip Thrust con Barra", coef: 1.30, basis: "L", round: 2.5 }),
    secundarioSR: "3x10-12",
    acc1: [
      { name: "Curl Femoral Tumbado en Máquina", coef: 0.35, basis: "BW", round: 2.5 },
      { name: "Peso Muerto Rumano a Una Pierna (ligero, por mano)", coef: 0.15, basis: "L", round: 1 },
      { name: "Curl Femoral Sentado en Máquina", coef: 0.35, basis: "BW", round: 2.5 },
      { name: "Buenos Días con Barra (ligero)", coef: 0.35, basis: "L", round: 2.5 },
    ],
    acc1SR: "3x12-15",
    acc2: Array(4).fill({ name: "Hiperextensiones (lumbar)", coef: null, basis: null, round: null }),
    acc2SR: "3x15",
  },
];

function accWeight(entry, principalWeight, cfg) {
  if (!entry || entry.coef == null) return null;
  const base = entry.basis === "L" ? principalWeight : cfg.bodyweight;
  return round(base * entry.coef, entry.round);
}

const MONTH_PATTERN = [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3];

/**
 * Genera las 52 semanas x 4 días (208 sesiones) a partir de la config actual.
 * Cada sesión: { globalWeek, month, trimester, phase, dayLabel, group,
 *                principal:{name,pct,sets,reps,weight,rest},
 *                secundario:{...}, acc1:{...}, acc2:{...}, notes, key }
 */
function generateSchedule(cfg) {
  const schedule = [];
  for (let trimester = 1; trimester <= 4; trimester++) {
    const trimIdx = trimester - 1;
    for (let weekInTrim = 1; weekInTrim <= 13; weekInTrim++) {
      const globalWeek = (trimester - 1) * 13 + weekInTrim;
      const [pct, setsP, repsP, phase] = WEEK_TEMPLATE[weekInTrim - 1];
      const month = (trimester - 1) * 3 + MONTH_PATTERN[weekInTrim - 1];
      const isTest = phase === "Test 1RM";
      const restP = REST_PRINCIPAL[phase], restS = REST_SECUNDARIO[phase], restA = REST_ACCESORIO[phase];

      DAY_TEMPLATES.forEach((day, dayIdx) => {
        const dayNum = dayIdx + 1;
        let principalKey = day.principalKey;
        let principalName;
        if (dayNum === 4) {
          principalKey = globalWeek % 2 === 1 ? "pesoMuertoConv" : "pesoMuertoRum";
          principalName = LIFT_LABELS[principalKey];
        } else {
          principalName = LIFT_LABELS[principalKey];
        }
        const principalWeight = trackedWeight(principalKey, pct, cfg, trimIdx);

        let secundario;
        if (day.secundarioKey) {
          const w = trackedWeight(day.secundarioKey, pct, cfg, trimIdx);
          secundario = { name: LIFT_LABELS[day.secundarioKey], sets: setsP, reps: repsP, weight: w, rest: restS, tracked: true };
        } else {
          const entry = day.secundario[trimIdx];
          const [sSets, sReps] = day.secundarioSR.split("x");
          secundario = {
            name: entry.name, sets: parseInt(sSets), reps: sReps, rest: restS, tracked: false,
            weight: accWeight(entry, principalWeight, cfg),
          };
        }

        const acc1Entry = day.acc1[trimIdx], acc2Entry = day.acc2[trimIdx];
        const parseSR = (sr) => { const [se, re] = sr.split("x"); return [parseInt(se), re]; };
        const acc1 = isTest
          ? { name: "Movilidad / activación", sets: 0, reps: "—", weight: null, rest: 0 }
          : (([se, re]) => ({ name: acc1Entry.name, sets: se, reps: re, weight: accWeight(acc1Entry, principalWeight, cfg), rest: restA }))(parseSR(day.acc1SR));
        const acc2 = isTest
          ? { name: "Movilidad / activación", sets: 0, reps: "—", weight: null, rest: 0 }
          : (([se, re]) => ({ name: acc2Entry.name, sets: se, reps: re, weight: accWeight(acc2Entry, principalWeight, cfg), rest: restA }))(parseSR(day.acc2SR));

        schedule.push({
          key: `${globalWeek}-${dayNum}`,
          globalWeek, month, trimester, phase, isTest,
          dayLabel: day.dia, dayNum, group: day.grupo,
          principal: { name: principalName, pct, sets: setsP, reps: repsP, weight: principalWeight, rest: restP, key: principalKey },
          secundario, acc1, acc2,
          notes: NOTAS_FASE[phase],
        });
      });
    }
  }
  return schedule;
}

// Rango de semanas por mes (para cabeceras de sección en la vista Plan)
function monthWeekRange(month) {
  const weeks = [];
  for (let t = 1; t <= 4; t++) for (let w = 1; w <= 13; w++) {
    const gw = (t - 1) * 13 + w;
    const mo = (t - 1) * 3 + MONTH_PATTERN[w - 1];
    if (mo === month) weeks.push(gw);
  }
  return [Math.min(...weeks), Math.max(...weeks)];
}
