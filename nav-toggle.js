document.addEventListener("DOMContentLoaded", function () {
  const header = document.getElementById("header");
  const toggle = document.getElementById("navToggle");
  const menu = document.getElementById("nav-menu-container");
  if (!header || !toggle || !menu) return;

  function closeMenu() {
    header.classList.remove("nav-open");
    toggle.setAttribute("aria-expanded", "false");
  }

  toggle.addEventListener("click", function (e) {
    e.stopPropagation();
    const isOpen = header.classList.toggle("nav-open");
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  // Cierra el menú al hacer clic en un enlace
  menu.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", closeMenu);
  });

  // Cierra el menú al hacer clic fuera de él
  document.addEventListener("click", function (e) {
    if (header.classList.contains("nav-open") && !header.contains(e.target)) {
      closeMenu();
    }
  });

  // Cierra el menú si la ventana vuelve a tamaño de escritorio
  window.addEventListener("resize", function () {
    if (window.innerWidth > 900) closeMenu();
  });
});
