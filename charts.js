/* ============================================================
   FORGE12 — Gráficas ligeras en <canvas>, sin librerías externas
   ============================================================ */

function drawLineChart(canvas, series, labels, opts = {}) {
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth, h = canvas.clientHeight;
  canvas.width = w * dpr; canvas.height = h * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  const padL = 34, padR = 10, padT = 14, padB = 22;
  const plotW = w - padL - padR, plotH = h - padT - padB;

  const allVals = series.flatMap(s => s.data).filter(v => v != null);
  if (!allVals.length) return;
  let min = Math.min(...allVals), max = Math.max(...allVals);
  if (min === max) { min -= 1; max += 1; }
  const pad = (max - min) * 0.12;
  min -= pad; max += pad;

  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  ctx.font = "10px system-ui";
  ctx.fillStyle = "#8b93a7";
  const gridLines = 4;
  for (let i = 0; i <= gridLines; i++) {
    const y = padT + (plotH * i) / gridLines;
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(w - padR, y); ctx.stroke();
    const val = max - ((max - min) * i) / gridLines;
    ctx.fillText(Math.round(val), 2, y + 3);
  }

  const n = labels.length;
  const xFor = (i) => padL + (n === 1 ? plotW / 2 : (plotW * i) / (n - 1));
  const yFor = (v) => padT + plotH - ((v - min) / (max - min)) * plotH;

  ctx.font = "10px system-ui";
  ctx.fillStyle = "#8b93a7";
  labels.forEach((l, i) => {
    if (n > 8 && i % Math.ceil(n / 6) !== 0 && i !== n - 1) return;
    ctx.fillText(l, xFor(i) - 6, h - 6);
  });

  series.forEach((s) => {
    ctx.beginPath();
    let started = false;
    s.data.forEach((v, i) => {
      if (v == null) return;
      const x = xFor(i), y = yFor(v);
      if (!started) { ctx.moveTo(x, y); started = true; } else { ctx.lineTo(x, y); }
    });
    ctx.strokeStyle = s.color || "#6366f1";
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.stroke();
    s.data.forEach((v, i) => {
      if (v == null) return;
      const x = xFor(i), y = yFor(v);
      ctx.beginPath(); ctx.arc(x, y, 3, 0, 7);
      ctx.fillStyle = s.color || "#6366f1";
      ctx.fill();
    });
  });
}

function drawBarChart(canvas, values, labels, opts = {}) {
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth, h = canvas.clientHeight;
  canvas.width = w * dpr; canvas.height = h * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  const padL = 34, padR = 8, padT = 14, padB = 20;
  const plotW = w - padL - padR, plotH = h - padT - padB;
  const max = Math.max(...values, 1) * 1.15;

  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.font = "10px system-ui";
  ctx.fillStyle = "#8b93a7";
  for (let i = 0; i <= 3; i++) {
    const y = padT + (plotH * i) / 3;
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(w - padR, y); ctx.stroke();
    ctx.fillText(Math.round(max - (max * i) / 3), 2, y + 3);
  }

  const n = values.length;
  const gap = 6;
  const barW = (plotW - gap * (n - 1)) / n;
  const grad = ctx.createLinearGradient(0, padT, 0, padT + plotH);
  grad.addColorStop(0, "#06b6d4"); grad.addColorStop(1, "#6366f1");

  values.forEach((v, i) => {
    const x = padL + i * (barW + gap);
    const bh = (v / max) * plotH;
    const y = padT + plotH - bh;
    ctx.fillStyle = grad;
    const r = Math.min(6, barW / 2);
    ctx.beginPath();
    ctx.moveTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.arcTo(x + barW, y, x + barW, y + r, r);
    ctx.lineTo(x + barW, padT + plotH);
    ctx.lineTo(x, padT + plotH);
    ctx.closePath();
    ctx.fill();
    if (n <= 13) {
      ctx.fillStyle = "#8b93a7";
      ctx.font = "9.5px system-ui";
      ctx.fillText(labels[i], x + barW / 2 - 5, h - 6);
    }
  });
}
