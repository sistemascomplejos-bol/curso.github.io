document.addEventListener("DOMContentLoaded", function() {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const sigma = 10;
    const rho = 28;
    const beta = 8 / 3;
    const dt = 0.01;

    let x = 0.1;
    let y = 0;
    let z = 0;

    // Fondo negro inicial
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Variables para almacenar las posiciones anteriores
    let prevX = canvas.width / 2 + x * 10;
    let prevY = canvas.height / 2 - z * 10;

    function draw() {
        const dx = sigma * (y - x) * dt;
        const dy = (x * (rho - z) - y) * dt;
        const dz = (x * y - beta * z) * dt;
        x += dx;
        y += dy;
        z += dz;

        const newX = canvas.width / 2 + x * 10;
        const newY = canvas.height / 2 - z * 10;

        // Dibujar una línea desde la posición anterior a la nueva posición
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2; // Aumentar el ancho de la línea para mayor visibilidad
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(newX, newY);
        ctx.stroke();

        // Actualizar las posiciones anteriores
        prevX = newX;
        prevY = newY;

        requestAnimationFrame(draw);
    }

    draw();
});
