document.addEventListener("DOMContentLoaded", function () {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  // --- Ajuste por densidad de píxeles (evita el desenfoque en pantallas Retina/4K) ---
  const dpr = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";
  ctx.scale(dpr, dpr);

  // Leve desenfoque + realce de brillo vía CSS: da un efecto de resplandor (bloom)
  // sin costo extra de cómputo por punto.
  canvas.style.filter = "blur(0.5px) brightness(1.15) saturate(1.2)";

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);

  // ---------- Fractal único: "juego del caos" generalizado, grande y luminoso ----------
  const cx = width / 2;
  const cy = height / 2; // perfectamente centrado en la pantalla
  const R = Math.min(width, height) * 0.46; // grande: ocupa casi toda la pantalla

  // Entre 3 y 7 vértices, con rotación aleatoria y una pequeña irregularidad en el
  // ángulo de cada uno (deja de ser un polígono perfecto -> se ve más orgánico/caótico)
  const n = 3 + Math.floor(Math.random() * 5);
  const rotOffset = Math.random() * Math.PI * 2;
  const angleStep = (2 * Math.PI) / n;
  const vertices = [];
  for (let i = 0; i < n; i++) {
    const jitter = (Math.random() - 0.5) * angleStep * 0.35;
    const angle = rotOffset + i * angleStep + jitter;
    vertices.push([cx + R * Math.cos(angle), cy + R * Math.sin(angle)]);
  }

  // Cada vértice tiene un "peso" distinto: se visita con más o menos frecuencia,
  // lo que rompe la simetría perfecta y da un patrón más caótico cada carga.
  const weights = vertices.map(() => 0.55 + Math.random() * 0.9);

  // Razón de contracción base, con un pequeño temblor aleatorio en cada paso
  // (en vez de una razón fija) para que el patrón no sea perfectamente autosimilar.
  const baseRatio = 0.44 + Math.random() * 0.14; // ~0.44 a 0.58

  // Regla de selección de vértice: se evita repetir el vértice inmediatamente
  // anterior (regla clásica del "juego del caos", la que garantiza un fractal
  // lleno y bien definido para cualquier n), combinada con los pesos aleatorios
  // de arriba para más variedad sin perder densidad/definición.
  function pickVertex() {
    let totalW = 0;
    for (let i = 0; i < n; i++) if (i !== lastIndex) totalW += weights[i];
    let r = Math.random() * totalW;
    let idx = 0;
    for (let i = 0; i < n; i++) {
      if (i === lastIndex) continue;
      if (r < weights[i]) {
        idx = i;
        break;
      }
      r -= weights[i];
      idx = i;
    }
    lastIndex = idx;
    return idx;
  }

  // Paleta aleatoria: hue base + recorrido de color según distancia al centro
  const baseHue = Math.random() * 360;
  const hueSpan = 140 + Math.random() * 120;

  let px = cx,
    py = cy;
  let lastIndex = -1;

  const maxPoints = 300000; // fractal grande y muy definido
  let drawn = 0;
  const pointsPerFrame = 1200;

  // Mezcla normal (no aditiva): cada punto nuevo se combina con lo ya pintado sin
  // acumular brillo sin límite, así el color se mantiene estable en vez de terminar
  // en blanco cuando el patrón se revisita muchas veces.
  ctx.globalCompositeOperation = "source-over";

  // --- "Quemado" inicial: los primeros pasos del juego del caos aún no están sobre
  // el atractor y dejarían una mancha difusa en el centro si se dibujan. Se calculan
  // sin pintarlos, y solo se empieza a dibujar una vez que el punto ya cayó en el patrón. ---
  const burnIn = 60;
  for (let i = 0; i < burnIn; i++) {
    const idx = pickVertex();
    const v = vertices[idx];
    const ratio = baseRatio + (Math.random() - 0.5) * 0.05;
    px = px + (v[0] - px) * ratio;
    py = py + (v[1] - py) * ratio;
  }

  function draw() {
    for (let i = 0; i < pointsPerFrame && drawn < maxPoints; i++, drawn++) {
      const idx = pickVertex();
      const v = vertices[idx];
      const ratio = baseRatio + (Math.random() - 0.5) * 0.05; // temblor por paso
      px = px + (v[0] - px) * ratio;
      py = py + (v[1] - py) * ratio;

      const dist = Math.hypot(px - cx, py - cy) / R;
      const hue = (baseHue + dist * hueSpan) % 360;

      // Halo suave detrás (glow) + núcleo nítido encima, ambos con mezcla normal:
      // da resplandor sin arriesgar que la superposición sature a blanco.
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = `hsl(${hue}, 100%, 65%)`;
      ctx.fillRect(px - 1.2, py - 1.2, 4, 4);

      ctx.globalAlpha = 0.85;
      ctx.fillStyle = `hsl(${hue}, 100%, 58%)`;
      ctx.fillRect(px, py, 1.6, 1.6);
    }
    if (drawn < maxPoints) {
      requestAnimationFrame(draw);
    }
    // Al alcanzar maxPoints el bucle se detiene solo: consumo de recursos vuelve a cero.
  }

  draw();
});
