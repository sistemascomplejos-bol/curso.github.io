/* =====================================================================
   Selector de zona horaria para el programa del curso CBSC
   ---------------------------------------------------------------------
   CÓMO ACTUALIZAR EL HORARIO:
   Edita las horas en resumenes.html como siempre, en hora de BOLIVIA
   (ej. <time>14:00 -- 15:15</time>) y el título del día
   (ej. "Lunes 23 de Noviembre"). Este script lee esos textos y
   los convierte solo; no hay que tocar nada más.

   Lo único que hay que cambiar aquí si cambia el año del evento: EVENT_YEAR.
   ===================================================================== */
(function () {
  "use strict";

  var EVENT_YEAR = 2026;
  var BASE_TZ = "America/La_Paz"; // la hora escrita en el HTML es de Bolivia (UTC-4, sin horario de verano)
  var BASE_OFFSET_H = -4; // UTC-4
  var STORAGE_KEY = "cbsc-timezone";

  // Zonas disponibles (IANA: el navegador aplica solo el horario de verano de esas fechas)
  var ZONES = [
    // tz = zona IANA representativa de ese UTC en las fechas del evento (noviembre).
    // cities = ciudades/países que se muestran juntos en la misma fila. Edita libremente.
    {
      tz: "Pacific/Pago_Pago",
      cities: ["Pago Pago (Samoa Americana)", "Alofi (Niue)"],
    },
    {
      tz: "Pacific/Honolulu",
      cities: ["Honolulu (EE. UU.)", "Papeete (Polinesia Francesa)"],
    },
    { tz: "America/Anchorage", cities: ["Anchorage (EE. UU.)"] },
    {
      tz: "America/Los_Angeles",
      cities: [
        "Los Ángeles (EE. UU.)",
        "Vancouver (Canadá)",
        "Tijuana (México)",
      ],
    },
    {
      tz: "America/Phoenix",
      cities: ["Phoenix (EE. UU.)", "Denver (EE. UU.)", "Calgary (Canadá)"],
    },
    {
      tz: "America/Mexico_City",
      cities: [
        "Ciudad de México (México)",
        "Guatemala (Guatemala)",
        "San José (Costa Rica)",
        "Chicago (EE. UU.)",
      ],
    },
    {
      tz: "America/Bogota",
      cities: [
        "Bogotá (Colombia)",
        "Lima (Perú)",
        "Quito (Ecuador)",
        "Nueva York (EE. UU.)",
      ],
    },
    {
      tz: "America/La_Paz",
      cities: [
        "La Paz (Bolivia)",
        "Caracas (Venezuela)",
        "Manaos (Brasil)",
        "Santo Domingo (Rep. Dominicana)",
      ],
    },
    {
      tz: "America/Argentina/Buenos_Aires",
      cities: [
        "Buenos Aires (Argentina)",
        "Santiago (Chile)",
        "Montevideo (Uruguay)",
        "São Paulo (Brasil)",
      ],
    },
    { tz: "America/Nuuk", cities: ["Nuuk (Groenlandia)"] },
    {
      tz: "Atlantic/Cape_Verde",
      cities: ["Praia (Cabo Verde)", "Azores (Portugal)"],
    },
    {
      tz: "Europe/London",
      cities: [
        "Londres (Reino Unido)",
        "Lisboa (Portugal)",
        "Dublín (Irlanda)",
        "Accra (Ghana)",
      ],
    },
    {
      tz: "Europe/Madrid",
      cities: [
        "Madrid (España)",
        "París (Francia)",
        "Berlín (Alemania)",
        "Roma (Italia)",
      ],
    },
    {
      tz: "Africa/Johannesburg",
      cities: [
        "Johannesburgo (Sudáfrica)",
        "El Cairo (Egipto)",
        "Atenas (Grecia)",
        "Jerusalén (Israel)",
      ],
    },
    {
      tz: "Europe/Moscow",
      cities: [
        "Moscú (Rusia)",
        "Estambul (Turquía)",
        "Riad (Arabia Saudita)",
        "Nairobi (Kenia)",
      ],
    },
    { tz: "Asia/Tehran", cities: ["Teherán (Irán)"] },
    {
      tz: "Asia/Dubai",
      cities: [
        "Dubái (Emiratos Árabes Unidos)",
        "Bakú (Azerbaiyán)",
        "Mascate (Omán)",
      ],
    },
    { tz: "Asia/Kabul", cities: ["Kabul (Afganistán)"] },
    {
      tz: "Asia/Karachi",
      cities: ["Karachi (Pakistán)", "Taskent (Uzbekistán)", "Malé (Maldivas)"],
    },
    {
      tz: "Asia/Kolkata",
      cities: ["Nueva Delhi (India)", "Bombay (India)", "Colombo (Sri Lanka)"],
    },
    { tz: "Asia/Kathmandu", cities: ["Katmandú (Nepal)"] },
    {
      tz: "Asia/Dhaka",
      cities: ["Daca (Bangladés)", "Biskek (Kirguistán)", "Timbu (Bután)"],
    },
    { tz: "Asia/Yangon", cities: ["Yangón (Birmania)"] },
    {
      tz: "Asia/Bangkok",
      cities: ["Bangkok (Tailandia)", "Hanói (Vietnam)", "Yakarta (Indonesia)"],
    },
    {
      tz: "Asia/Shanghai",
      cities: [
        "Pekín (China)",
        "Singapur (Singapur)",
        "Manila (Filipinas)",
        "Taipéi (Taiwán)",
      ],
    },
    { tz: "Asia/Tokyo", cities: ["Tokio (Japón)", "Seúl (Corea del Sur)"] },
    { tz: "Australia/Darwin", cities: ["Darwin (Australia)"] },
    {
      tz: "Australia/Brisbane",
      cities: ["Brisbane (Australia)", "Port Moresby (Papúa Nueva Guinea)"],
    },
    {
      tz: "Australia/Sydney",
      cities: [
        "Sídney (Australia)",
        "Melbourne (Australia)",
        "Numea (Nueva Caledonia)",
      ],
    },
    { tz: "Pacific/Fiji", cities: ["Suva (Fiyi)", "Funafuti (Tuvalu)"] },
    {
      tz: "Pacific/Auckland",
      cities: [
        "Auckland (Nueva Zelanda)",
        "Wellington (Nueva Zelanda)",
        "Nukualofa (Tonga)",
      ],
    },
  ];

  var MONTHS = {
    enero: 0,
    febrero: 1,
    marzo: 2,
    abril: 3,
    mayo: 4,
    junio: 5,
    julio: 6,
    agosto: 7,
    septiembre: 8,
    setiembre: 8,
    octubre: 9,
    noviembre: 10,
    diciembre: 11,
  };

  var dayFmtCache = {};
  function fmtFor(tz) {
    if (!dayFmtCache[tz]) {
      dayFmtCache[tz] = new Intl.DateTimeFormat("en-GB", {
        timeZone: tz,
        hour12: false,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return dayFmtCache[tz];
  }

  function parts(date, tz) {
    var o = {};
    fmtFor(tz)
      .formatToParts(date)
      .forEach(function (p) {
        o[p.type] = p.value;
      });
    if (o.hour === "24") o.hour = "00";
    return o;
  }

  function pad(n) {
    return (n < 10 ? "0" : "") + n;
  }

  // Offset (en horas, con decimales) de una zona en un instante dado, para mostrarlo en el selector
  function offsetLabel(tz, date) {
    var p = parts(date, tz);
    var asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute);
    var diff = Math.round(
      (asUTC - Math.floor(date.getTime() / 60000) * 60000) / 60000,
    );
    var sign = diff < 0 ? "-" : "+";
    diff = Math.abs(diff);
    var h = Math.floor(diff / 60),
      m = diff % 60;
    return "UTC" + sign + h + (m ? ":" + pad(m) : "");
  }

  // Convierte una hora de Bolivia (en un día concreto) a la zona elegida
  function convert(y, mo, d, hh, mm, tz) {
    // instante real = hora de Bolivia - offset de Bolivia
    var inst = new Date(Date.UTC(y, mo, d, hh - BASE_OFFSET_H, mm));
    var p = parts(inst, tz);
    var dayDiff = Date.UTC(+p.year, +p.month - 1, +p.day) - Date.UTC(y, mo, d);
    return {
      text: p.hour + ":" + p.minute,
      dayDiff: Math.round(dayDiff / 86400000),
    };
  }

  function dayBadge(diff) {
    if (!diff) return "";
    return (
      ' <span class="tz-daydiff">' +
      (diff > 0 ? "+" : "") +
      diff +
      " día" +
      (Math.abs(diff) > 1 ? "s" : "") +
      "</span>"
    );
  }

  function init() {
    var schedule = document.getElementById("schedule");
    if (!schedule) return;
    var panels = schedule.querySelectorAll(".day-panel");
    if (!panels.length) return;

    // 1) Leer la fecha de cada día desde su título y las horas originales (Bolivia)
    var items = [];
    Array.prototype.forEach.call(panels, function (panel) {
      var title = panel.querySelector(".day-panel-title");
      var m =
        title &&
        title.textContent
          .toLowerCase()
          .match(/(\d{1,2})\s+de\s+([a-záéíóúñ]+)/);
      if (!m || MONTHS[m[2]] === undefined) return;
      var day = +m[1],
        month = MONTHS[m[2]];

      Array.prototype.forEach.call(
        panel.querySelectorAll("time"),
        function (t) {
          var raw = t.textContent.replace(/\s+/g, " ").trim();
          var r = raw.match(
            /(\d{1,2}):(\d{2})(?:\s*[-–—]+\s*(\d{1,2}):(\d{2}))?/,
          );
          if (!r) return;
          items.push({
            el: t,
            day: day,
            month: month,
            start: [+r[1], +r[2]],
            end: r[3] !== undefined ? [+r[3], +r[4]] : null,
          });
        },
      );
    });

    // 2) Construir el selector
    var ref = new Date(
      Date.UTC(
        EVENT_YEAR,
        items.length ? items[0].month : 10,
        items.length ? items[0].day : 23,
        18,
        0,
      ),
    );
    var box = document.createElement("div");
    box.className = "tz-selector";
    var select = document.createElement("select");
    select.id = "tz-select";
    select.setAttribute("aria-label", "Zona horaria");
    ZONES.forEach(function (z) {
      var o = document.createElement("option");
      o.value = z.tz;
      o.textContent = offsetLabel(z.tz, ref) + "  ·  " + z.cities.join(", ");
      select.appendChild(o);
    });
    box.innerHTML =
      '<label for="tz-select"><i class="fa fa-clock-o"></i> Zona horaria:</label>';
    box.appendChild(select);
    var note = document.createElement("p");
    note.className = "tz-note";
    box.appendChild(note);

    var header = schedule.querySelector(".section-header");
    var anchor = schedule.querySelector(".tab-content");
    anchor.parentNode.insertBefore(box, anchor);

    // 3) Pintar horas en la zona elegida
    function render(tz) {
      items.forEach(function (it) {
        var a = convert(
          EVENT_YEAR,
          it.month,
          it.day,
          it.start[0],
          it.start[1],
          tz,
        );
        var html = a.text;
        var diff = a.dayDiff;
        if (it.end) {
          var b = convert(
            EVENT_YEAR,
            it.month,
            it.day,
            it.end[0],
            it.end[1],
            tz,
          );
          html += " -- " + b.text;
        }
        it.el.innerHTML = html + dayBadge(diff);
      });
      note.textContent =
        tz === BASE_TZ
          ? "Horarios en hora de Bolivia (UTC-4)."
          : "Horarios convertidos desde la hora de Bolivia (UTC-4). Los títulos de cada día corresponden a Bolivia; “+1 día” o “-1 día” indica que, en tu zona, esa actividad cae el día siguiente o anterior.";
    }

    var saved = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch (e) {}
    var valid = ZONES.some(function (z) {
      return z.tz === saved;
    });
    var current = valid ? saved : BASE_TZ;
    select.value = current;
    render(current);

    select.addEventListener("change", function () {
      try {
        localStorage.setItem(STORAGE_KEY, select.value);
      } catch (e) {}
      render(select.value);
    });
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else init();
})();
