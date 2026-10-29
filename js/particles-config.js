/* Red de partículas del fondo de la portada (index.html).
   Basado en la configuración de LAWNP 2019.
   Dos polos de opinión: azul y rojo.
   Ajusta aquí cantidad, velocidad y colores. */

(function () {
  var esCelular = window.innerWidth < 768;

  var AZUL = "#3d8bff";
  var ROJO = "#ff3b4f";

  var PUSH = 2; /* partículas nuevas por click */
  var MAX_EXTRAS = esCelular
    ? 15
    : 40; /* tope de partículas agregadas con click */

  particlesJS("particles-js", {
    particles: {
      number: {
        value: 80 /* la densidad se adapta sola: pantalla chica = menos puntos */,
        density: { enable: true, value_area: 800 },
      },
      color: { value: [AZUL, ROJO] } /* cada punto nace azul o rojo */,
      shape: { type: "circle" },
      opacity: { value: 0.8, random: false },
      size: { value: 4, random: true },
      line_linked: {
        enable: true,
        distance: esCelular ? 120 : 150,
        color: "#ffffff" /* líneas neutras para no favorecer a ningún polo */,
        opacity: 0.25,
        width: 1,
      },
      move: {
        enable: true,
        speed: esCelular ? 2 : 3,
        direction: "none",
        random: false,
        straight: false,
        out_mode: "out",
      },
    },
    interactivity: {
      detect_on: "canvas",
      events: {
        onhover: {
          enable: true,
          mode: "grab",
        } /* el cursor se conecta a los puntos */,
        onclick: { enable: true, mode: "push" },
        resize: true,
      },
      modes: {
        grab: { distance: 180, line_linked: { opacity: 0.7 } },
        push: { particles_nb: PUSH } /* antes 4 */,
      },
    },
    retina_detect: true,
  });

  /* Tope de partículas agregadas con click: la red original se conserva y,
     al pasar el límite, se descartan primero las que se agregaron antes. */
  document
    .getElementById("particles-js")
    .addEventListener("click", function () {
      var inst = window.pJSDom && window.pJSDom[0];
      if (!inst) return;
      var arr = inst.pJS.particles.array;

      for (var i = Math.max(0, arr.length - PUSH); i < arr.length; i++) {
        arr[i].extra = true;
      }

      var extras = 0;
      for (var j = 0; j < arr.length; j++) if (arr[j].extra) extras++;

      var sobran = extras - MAX_EXTRAS;
      for (var k = 0; k < arr.length && sobran > 0; k++) {
        if (arr[k].extra) {
          arr.splice(k, 1);
          k--;
          sobran--;
        }
      }
    });
})();
