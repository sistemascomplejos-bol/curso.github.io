/* Altura de cada actividad proporcional a su duración.
   La escala (px por minuto) se calcula sola: es la mínima con la que
   el bloque que más espacio necesita cabe sin desbordarse. Todos los
   días usan la misma escala, así que la misma hora queda a la misma
   altura en todas las columnas. */
(function () {
  "use strict";
  var MIN_PX_PER_MIN = 2.5; // piso, por si todo el contenido fuera muy corto
  // Tope de la escala. Si un bloque necesita más espacio del que le toca
  // (título largo en pocos minutos), crece lo justo y no obliga a estirar
  // todos los demás. Pon Infinity para proporcionalidad estricta (más alto).
  var MAX_PX_PER_MIN = 4;

  function minutes(timeEl) {
    var m = timeEl.textContent.match(
      /(\d{1,2}):(\d{2})\s*[-–—]+\s*(\d{1,2}):(\d{2})/,
    );
    if (!m) return null;
    var s = +m[1] * 60 + +m[2],
      e = +m[3] * 60 + +m[4];
    if (e <= s) e += 1440; // cruza medianoche en otra zona horaria
    return e - s;
  }

  function layout() {
    var items = Array.prototype.slice.call(
      document.querySelectorAll("#schedule .schedule-item"),
    );
    var data = [],
      scale = MIN_PX_PER_MIN;

    // 1) altura natural de cada bloque
    items.forEach(function (it) {
      it.style.height = "auto";
    });
    items.forEach(function (it) {
      var t = it.querySelector("time");
      var d = t && minutes(t);
      if (!d) return;
      data.push({ el: it, d: d, natural: it.offsetHeight });
      scale = Math.max(scale, it.offsetHeight / d);
    });
    scale = Math.min(scale, MAX_PX_PER_MIN);

    // 2) misma escala para todos (nunca menos que lo que el texto necesita)
    data.forEach(function (x) {
      x.el.style.height = Math.max(x.d * scale, x.natural) + "px";
    });
  }

  var pending;
  function schedule() {
    cancelAnimationFrame(pending);
    pending = requestAnimationFrame(layout);
  }

  window.addEventListener("load", schedule);
  window.addEventListener("resize", schedule);
  document.addEventListener("change", function (e) {
    if (e.target && e.target.id === "tz-select") schedule(); // el aviso "+1 día" puede cambiar el alto
  });
  if (document.fonts && document.fonts.ready)
    document.fonts.ready.then(schedule);
  if (document.readyState !== "loading") schedule();
  else document.addEventListener("DOMContentLoaded", schedule);
})();
