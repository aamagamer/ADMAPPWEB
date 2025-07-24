document.addEventListener("DOMContentLoaded", async () => {
  await cargarIncapacidades();

  document.getElementById("filtro-nombre").addEventListener("input", cargarIncapacidades);
  document.getElementById("filtro-estado").addEventListener("change", cargarIncapacidades);
});

async function cargarIncapacidades() {
  const nombreFiltro = document.getElementById("filtro-nombre").value.toLowerCase();
  const estadoFiltro = document.getElementById("filtro-estado").value;

  const res = await fetch("/api/incapacidades");
  const data = await res.json();
  const contenedor = document.getElementById("incapacidades-list");
  contenedor.innerHTML = "";

  const hoy = new Date();

  data.forEach((item) => {
    const nombreCompleto = `${item.nombres} ${item.paterno} ${item.materno}`.toLowerCase();
    const fin = new Date(item.fechaFinal);
    const estaActiva = fin >= hoy;

    const pasaFiltroNombre = nombreCompleto.includes(nombreFiltro);
    const pasaFiltroEstado =
      estadoFiltro === "todas" ||
      (estadoFiltro === "activas" && estaActiva) ||
      (estadoFiltro === "inactivas" && !estaActiva);

    if (pasaFiltroNombre && pasaFiltroEstado) {
      const card = document.createElement("div");
      card.classList.add("reporte-card");
      card.innerHTML = `
        <div class="reporte-titulo">${item.tipo}</div>
        <div class="reporte-detalle"><span class="reporte-etiqueta">Empleado:</span> ${item.nombres} ${item.paterno} ${item.materno}</div>
        <div class="reporte-detalle"><span class="reporte-etiqueta">Inicio:</span> ${item.fechaInicio}</div>
        <div class="reporte-detalle"><span class="reporte-etiqueta">Fin:</span> ${item.fechaFinal}</div>
        <div class="reporte-detalle"><span class="reporte-etiqueta">Observaciones:</span> ${item.observaciones}</div>
      `;
      contenedor.appendChild(card);
    }
  });
}


function exportarExcel() {
  window.location.href = "/api/incapacidadesExcel"; // Puedes cambiar este endpoint a tu gusto
}
