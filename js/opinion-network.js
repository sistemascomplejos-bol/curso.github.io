/* ==========================================================================
   Red de opinión — fondo de la portada (index.html)

   Simulación propia (sin librerías) de un modelo del votante sobre una red
   que se mueve:

   · Cada punto es un agente con una opinión: azul (+1) o roja (−1).
   · Dos agentes cercanos quedan conectados por una línea. Las líneas entre
     agentes de la misma opinión toman su color; las que cruzan la frontera
     entre opiniones son grises y tenues (conflicto).
   · Modelo del votante: cada cierto tiempo un agente al azar copia la
     opinión de uno de sus vecinos. Además hay un poco de ruido (cambios
     espontáneos) para que la red nunca se congele en consenso.
   · El cursor "inyecta" una opinión: los agentes dentro del círculo la
     adoptan. Click (o toque) cambia la opinión que inyectas (azul ↔ rojo).
   · La barra de abajo muestra qué porcentaje de agentes tiene cada opinión.

   Para volver a particles.js, ver los comentarios en index.html.
   ========================================================================== */
(function () {
  "use strict";

  /* ---------------------------- CONFIGURACIÓN ---------------------------- */
  var AZUL = [61, 139, 255];
  var ROJO = [255, 59, 79];
  var NEUTRO = [200, 208, 224]; /* líneas entre opiniones distintas */

  var AREA_POR_AGENTE = 11000; /* px² por agente (menor = más puntos) */
  var MIN_AGENTES = 44;
  var MAX_AGENTES = 130;

  var VEL_MIN = 20; /* px/s */
  var VEL_MAX = 50;
  var AGITACION = 40; /* qué tan rápido cambian de rumbo */

  var TASA_VOTO = 0.35; /* actualizaciones de opinión por agente y por segundo */
  var TASA_RUIDO = 0.004; /* cambios espontáneos por agente y por segundo */

  var TASA_INYECCION = 1.8; /* qué tan rápido convence el cursor (1/s) */
  var PROB_CLICK = 0.55; /* fracción que cambia de golpe con un click */

  var SOLO_AZUL_INICIAL = false; /* true = arranca todo azul en vez de dos bandos */

  /* ------------------------------ ELEMENTOS ------------------------------ */
  var seccion = document.getElementById("intro");
  var host = document.getElementById("particles-js") || seccion;
  if (!host || !seccion) return;

  var canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = "display:block;width:100%;height:100%;";
  host.appendChild(canvas);
  var ctx = canvas.getContext("2d");

  var sinMovimiento =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var tactil =
    window.matchMedia && window.matchMedia("(pointer: coarse)").matches;

  /* -------------------------------- ESTADO -------------------------------- */
  var W = 0,
    H = 0,
    dpr = 1;
  var L = 140; /* distancia máxima de enlace */
  var RADIO_CURSOR = tactil ? 90 : 130;
  var agentes = [];
  var accVoto = 0,
    accRuido = 0;
  var opinionCursor = 1; /* +1 azul, −1 rojo */
  var raton = { activo: false, cx: 0, cy: 0 };
  var ondas = []; /* anillos que se expanden al hacer click */
  var pistaAlpha = 0.65;
  var interactuo = false;
  var tiempoPista = 0;

  function azar(a, b) {
    return a + Math.random() * (b - a);
  }

  function crearAgente(x, y, op) {
    var ang = azar(0, Math.PI * 2);
    var vel = azar(VEL_MIN, VEL_MAX);
    return {
      x: x,
      y: y,
      vx: Math.cos(ang) * vel,
      vy: Math.sin(ang) * vel,
      op: op /* opinión real: +1 / −1 */,
      c: op /* valor suavizado para el color */,
      pulso: 0,
      r: azar(2.1, 3.3),
      grado: 0,
      gradoTmp: 0,
    };
  }

  function opinionInicial(x, y) {
    if (SOLO_AZUL_INICIAL) return 1;
    /* dos bandos: azul a la izquierda, rojo a la derecha, con frontera irregular */
    var borde =
      0.5 + 0.07 * Math.sin((y / H) * Math.PI * 3) + azar(-0.04, 0.04);
    return x / W < borde ? 1 : -1;
  }

  function objetivoAgentes() {
    var n = Math.round((W * H) / AREA_POR_AGENTE);
    return Math.max(MIN_AGENTES, Math.min(MAX_AGENTES, n));
  }

  /* ------------------------------ TAMAÑO ------------------------------ */
  function redimensionar() {
    var r = host.getBoundingClientRect();
    var w = Math.max(1, Math.round(r.width));
    var h = Math.max(1, Math.round(r.height));
    if (w === W && h === H) return;

    var antW = W,
      antH = H;
    W = w;
    H = h;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    L = Math.max(100, Math.min(150, Math.min(W, H) * 0.28));

    var i;
    if (antW && antH) {
      for (i = 0; i < agentes.length; i++) {
        agentes[i].x *= W / antW;
        agentes[i].y *= H / antH;
      }
    }

    var n = objetivoAgentes();
    while (agentes.length < n) {
      var x = azar(0, W),
        y = azar(0, H);
      /* primera vez: dos bandos; al agrandar la ventana: copia a un agente existente */
      var op =
        antW && agentes.length
          ? agentes[Math.floor(Math.random() * agentes.length)].op
          : opinionInicial(x, y);
      agentes.push(crearAgente(x, y, op));
    }
    if (agentes.length > n) agentes.length = n;
  }

  /* ------------------------------ DINÁMICA ------------------------------ */
  function cambiarOpinion(a, op) {
    if (a.op === op) return;
    a.op = op;
    a.pulso = 1;
  }

  function vecinosDe(i) {
    var a = agentes[i],
      res = [];
    for (var j = 0; j < agentes.length; j++) {
      if (j === i) continue;
      var dx = agentes[j].x - a.x,
        dy = agentes[j].y - a.y;
      if (dx * dx + dy * dy < L * L) res.push(j);
    }
    return res;
  }

  function paso(dt) {
    var n = agentes.length,
      i,
      a;
    var reducido = sinMovimiento ? 0.25 : 1;

    /* movimiento */
    for (i = 0; i < n; i++) {
      a = agentes[i];
      if (!sinMovimiento) {
        a.vx += azar(-1, 1) * AGITACION * dt;
        a.vy += azar(-1, 1) * AGITACION * dt;
        var v = Math.sqrt(a.vx * a.vx + a.vy * a.vy) || 1;
        var vc = Math.max(VEL_MIN, Math.min(VEL_MAX, v));
        a.vx *= vc / v;
        a.vy *= vc / v;
        a.x += a.vx * dt;
        a.y += a.vy * dt;
        if (a.x < 0) {
          a.x = 0;
          a.vx = Math.abs(a.vx);
        } else if (a.x > W) {
          a.x = W;
          a.vx = -Math.abs(a.vx);
        }
        if (a.y < 0) {
          a.y = 0;
          a.vy = Math.abs(a.vy);
        } else if (a.y > H) {
          a.y = H;
          a.vy = -Math.abs(a.vy);
        }
      }
      a.c += (a.op - a.c) * Math.min(1, dt * 7);
      a.pulso = Math.max(0, a.pulso - dt * 1.6);
    }

    /* modelo del votante: copiar la opinión de un vecino al azar */
    accVoto += TASA_VOTO * reducido * n * dt;
    while (accVoto >= 1) {
      accVoto -= 1;
      var k = Math.floor(Math.random() * n);
      var vec = vecinosDe(k);
      if (vec.length) {
        var j = vec[Math.floor(Math.random() * vec.length)];
        cambiarOpinion(agentes[k], agentes[j].op);
      }
    }

    /* ruido: cambios espontáneos */
    accRuido += TASA_RUIDO * reducido * n * dt;
    while (accRuido >= 1) {
      accRuido -= 1;
      var m = agentes[Math.floor(Math.random() * n)];
      cambiarOpinion(m, -m.op);
    }

    /* el cursor convence a quienes están dentro de su círculo */
    if (raton.activo) {
      var rect = canvas.getBoundingClientRect();
      var mx = raton.cx - rect.left,
        my = raton.cy - rect.top;
      var p = 1 - Math.exp(-TASA_INYECCION * dt);
      for (i = 0; i < n; i++) {
        a = agentes[i];
        var dx = a.x - mx,
          dy = a.y - my;
        if (
          dx * dx + dy * dy < RADIO_CURSOR * RADIO_CURSOR &&
          a.op !== opinionCursor
        ) {
          if (Math.random() < p) cambiarOpinion(a, opinionCursor);
        }
      }
    }

    /* ondas del click */
    for (i = ondas.length - 1; i >= 0; i--) {
      ondas[i].t += dt;
      if (ondas[i].t > 0.7) ondas.splice(i, 1);
    }

    /* texto de ayuda: se apaga después de interactuar */
    if (interactuo) {
      tiempoPista += dt;
      pistaAlpha = Math.max(0, 0.65 - tiempoPista * 0.4);
    }
  }

  /* ------------------------------- DIBUJO ------------------------------- */
  function rgba(rgb, alpha) {
    return (
      "rgba(" +
      rgb[0] +
      "," +
      rgb[1] +
      "," +
      rgb[2] +
      "," +
      alpha.toFixed(3) +
      ")"
    );
  }

  function colorDeValor(c, alpha) {
    var t = (c + 1) / 2; /* 1 = azul, 0 = rojo */
    return (
      "rgba(" +
      Math.round(ROJO[0] + (AZUL[0] - ROJO[0]) * t) +
      "," +
      Math.round(ROJO[1] + (AZUL[1] - ROJO[1]) * t) +
      "," +
      Math.round(ROJO[2] + (AZUL[2] - ROJO[2]) * t) +
      "," +
      alpha.toFixed(3) +
      ")"
    );
  }

  function dibujar() {
    var n = agentes.length,
      i,
      j,
      a,
      b;
    ctx.clearRect(0, 0, W, H);

    for (i = 0; i < n; i++) agentes[i].gradoTmp = 0;

    /* enlaces */
    ctx.lineWidth = 1;
    var L2 = L * L;
    for (i = 0; i < n; i++) {
      a = agentes[i];
      for (j = i + 1; j < n; j++) {
        b = agentes[j];
        var dx = a.x - b.x,
          dy = a.y - b.y;
        var d2 = dx * dx + dy * dy;
        if (d2 >= L2) continue;
        a.gradoTmp++;
        b.gradoTmp++;
        var cercania = 1 - Math.sqrt(d2) / L;
        var prom = (a.c + b.c) / 2;
        var base, alfa;
        if (prom > 0.55) {
          base = AZUL;
          alfa = cercania * 0.55;
        } else if (prom < -0.55) {
          base = ROJO;
          alfa = cercania * 0.55;
        } else {
          base = NEUTRO;
          alfa = cercania * 0.2;
        }
        ctx.strokeStyle = rgba(base, alfa);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    /* agentes */
    for (i = 0; i < n; i++) {
      a = agentes[i];
      a.grado += (a.gradoTmp - a.grado) * 0.1;
      var rad = a.r + Math.min(a.grado, 8) * 0.28;
      ctx.fillStyle = colorDeValor(a.c, 0.95);
      ctx.beginPath();
      ctx.arc(a.x, a.y, rad, 0, Math.PI * 2);
      ctx.fill();
      if (a.pulso > 0) {
        ctx.strokeStyle = colorDeValor(a.c, a.pulso * 0.55);
        ctx.beginPath();
        ctx.arc(a.x, a.y, rad + (1 - a.pulso) * 14, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    /* cursor */
    var rect = canvas.getBoundingClientRect();
    if (raton.activo) {
      var mx = raton.cx - rect.left,
        my = raton.cy - rect.top;
      var col = opinionCursor === 1 ? AZUL : ROJO;
      ctx.strokeStyle = rgba(col, 0.3);
      ctx.beginPath();
      ctx.arc(mx, my, RADIO_CURSOR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = rgba(col, 0.9);
      ctx.beginPath();
      ctx.arc(mx, my, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    for (i = 0; i < ondas.length; i++) {
      var o = ondas[i],
        k = o.t / 0.7;
      ctx.strokeStyle = rgba(o.col, (1 - k) * 0.6);
      ctx.beginPath();
      ctx.arc(o.x, o.y, 6 + k * RADIO_CURSOR * 1.1, 0, Math.PI * 2);
      ctx.stroke();
    }

    dibujarIndicador();
  }

  function dibujarIndicador() {
    var n = agentes.length,
      azules = 0;
    for (var i = 0; i < n; i++) if (agentes[i].op === 1) azules++;
    var pA = n ? azules / n : 0.5;

    var bw = Math.min(280, W * 0.6);
    var x0 = (W - bw) / 2;
    var y = H - 44;
    var gap = 3;
    var wA = Math.max(0, pA * bw - gap / 2);
    var wR = Math.max(0, (1 - pA) * bw - gap / 2);

    ctx.fillStyle = rgba(AZUL, 0.9);
    ctx.fillRect(x0, y, wA, 3);
    ctx.fillStyle = rgba(ROJO, 0.9);
    ctx.fillRect(x0 + bw - wR, y, wR, 3);

    ctx.font = '600 11px "Plus Jakarta Sans", "Helvetica Neue", sans-serif';
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    ctx.fillStyle = rgba(AZUL, 0.9);
    ctx.fillText(Math.round(pA * 100) + "%", x0, y + 9);
    ctx.textAlign = "right";
    ctx.fillStyle = rgba(ROJO, 0.9);
    ctx.fillText(Math.round((1 - pA) * 100) + "%", x0 + bw, y + 9);

    if (pistaAlpha > 0.01) {
      ctx.textAlign = "center";
      ctx.font = '500 12px "Plus Jakarta Sans", "Helvetica Neue", sans-serif';
      ctx.fillStyle = "rgba(215,219,232," + pistaAlpha.toFixed(3) + ")";
      ctx.fillText(
        tactil
          ? "Toca para cambiar de opinión"
          : "Mueve el cursor para influir · click para cambiar de opinión",
        W / 2,
        y - 26,
      );
    }
  }

  /* ----------------------------- INTERACCIÓN ----------------------------- */
  function marcarRaton(e) {
    raton.cx = e.clientX;
    raton.cy = e.clientY;
    raton.activo = true;
  }

  seccion.addEventListener("pointermove", marcarRaton);
  seccion.addEventListener("pointerleave", function () {
    raton.activo = false;
  });
  seccion.addEventListener("pointerup", function (e) {
    if (e.pointerType === "touch") raton.activo = false;
  });
  seccion.addEventListener("pointerdown", function (e) {
    if (e.target.closest && e.target.closest("a, button")) return;
    marcarRaton(e);
    opinionCursor = -opinionCursor;
    interactuo = true;

    var rect = canvas.getBoundingClientRect();
    var mx = e.clientX - rect.left,
      my = e.clientY - rect.top;
    var col = opinionCursor === 1 ? AZUL : ROJO;
    ondas.push({ x: mx, y: my, t: 0, col: col });

    for (var i = 0; i < agentes.length; i++) {
      var a = agentes[i];
      var dx = a.x - mx,
        dy = a.y - my;
      if (
        dx * dx + dy * dy < RADIO_CURSOR * RADIO_CURSOR &&
        Math.random() < PROB_CLICK
      ) {
        cambiarOpinion(a, opinionCursor);
      }
    }
  });

  /* ------------------------------- BUCLE ------------------------------- */
  var corriendo = false,
    ultimo = 0,
    rafId = 0;

  function cuadro(t) {
    if (!corriendo) return;
    var dt = Math.min(0.05, (t - ultimo) / 1000);
    ultimo = t;
    paso(dt);
    dibujar();
    rafId = requestAnimationFrame(cuadro);
  }

  function iniciar() {
    if (corriendo) return;
    corriendo = true;
    ultimo = performance.now();
    rafId = requestAnimationFrame(cuadro);
  }

  function detener() {
    corriendo = false;
    cancelAnimationFrame(rafId);
  }

  redimensionar();

  if ("ResizeObserver" in window) {
    new ResizeObserver(redimensionar).observe(host);
  } else {
    window.addEventListener("resize", redimensionar);
  }

  /* solo anima mientras la portada está a la vista (ahorra batería) */
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entradas) {
      if (entradas[0].isIntersecting) iniciar();
      else detener();
    }).observe(seccion);
  } else {
    iniciar();
  }

  /* útil para depurar desde la consola: opinionNetwork.stats() */
  window.opinionNetwork = {
    stats: function () {
      var az = 0;
      for (var i = 0; i < agentes.length; i++) if (agentes[i].op === 1) az++;
      return {
        agentes: agentes.length,
        azules: az,
        rojos: agentes.length - az,
      };
    },
  };
})();
