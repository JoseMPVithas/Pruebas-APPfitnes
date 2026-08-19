# FORGE12 — Programa de Fuerza (12 meses)

App de entrenamiento (PWA) generada a partir del programa de periodización de
fuerza e hipertrofia: 4 días/semana (superior/inferior, empuje/tracción),
52 semanas, con progresión automática de pesos a partir de tu 1RM.

No usa frameworks ni build step — es HTML/CSS/JS puro. Todo el progreso se
guarda en el propio dispositivo (`localStorage`); no hay backend ni cuentas.

## Estructura

```
forge12/
├── index.html
├── manifest.json          # PWA
├── service-worker.js       # caché offline
├── css/styles.css
├── js/
│   ├── data.js             # motor de periodización (1:1 con el Excel)
│   ├── storage.js          # guardado local + backup JSON
│   ├── timer.js             # temporizador de descanso con vibración
│   ├── charts.js            # gráficas en <canvas>, sin librerías
│   └── app.js                # estado, navegación, vistas
└── icons/
```

## Publicar en GitHub Pages

1. Crea un repositorio nuevo (o usa uno existente) y sube el contenido de
   esta carpeta a la raíz (o a una carpeta `/docs`).
2. En GitHub → **Settings → Pages**, elige la rama (`main`) y la carpeta
   (`/` o `/docs`) donde subiste los archivos.
3. Espera 1-2 minutos y tu app estará en
   `https://<tu-usuario>.github.io/<tu-repo>/`.
4. Ábrela en el móvil y usa "Añadir a pantalla de inicio" (iOS/Android)
   para instalarla como app — el `manifest.json` y el `service-worker.js`
   ya están configurados para eso.

## Previsualizar en local

No hace falta servidor, pero el Service Worker funciona mejor con uno:

```bash
cd forge12
python3 -m http.server 8000
# abre http://localhost:8000
```

## Cómo editar tu programa

Todo el contenido del programa (ejercicios, % de 1RM, descansos, coeficientes
de accesorios) vive en `js/data.js`. Es el mismo modelo que el Excel:

- `WEEK_TEMPLATE`: las 13 semanas de un trimestre (% 1RM, series, reps, fase).
- `DAY_TEMPLATES`: los 4 días (principal/secundario/accesorios), con la
  rotación de accesorios por trimestre.
- Tus 1RM, peso corporal y objetivos se editan **desde la app** (pestaña
  Ajustes) — no hace falta tocar código para eso.

## Primer uso

1. Abre la app → pestaña **Ajustes** → introduce tu peso corporal y tus 1RM
   reales (sustituye los valores de ejemplo).
2. Pestaña **Hoy** → tu primera sesión ya está calculada.
3. Al completar un trimestre (semana 13, 26, 39 o 52 = semana de test),
   anota tu nuevo 1RM real en Ajustes: el resto del trimestre se recalcula solo.
4. Tras la semana 52, el ciclo vuelve a la semana 1 (ciclo infinito) — antes
   de empezar de nuevo, actualiza tus 1RM para que el nuevo ciclo parta de
   tu nivel actual.

## Notas

- Los pesos de los ejercicios accesorios son una **estimación de partida**
  (% del peso del principal o de tu peso corporal), no un dato exacto —
  ajústalos la primera semana según tu RPE real.
- Todo el progreso vive en este dispositivo. Usa **Ajustes → Exportar**
  para hacer una copia de seguridad en JSON antes de cambiar de móvil o
  borrar el navegador, e **Importar** para restaurarla.
