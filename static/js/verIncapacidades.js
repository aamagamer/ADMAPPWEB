document.addEventListener("DOMContentLoaded", async () => {
  await cargarIncapacidades();

  document.getElementById("filtro-nombre").addEventListener("input", cargarIncapacidades);
  document.getElementById("filtro-estado").addEventListener("change", cargarIncapacidades);

  document.getElementById("btn-exportar").addEventListener("click", exportarExcelDesdeVista);
});

function esMismaFecha(fecha1, fecha2) {
  return (
    fecha1.getFullYear() === fecha2.getFullYear() &&
    fecha1.getMonth() === fecha2.getMonth() &&
    fecha1.getDate() === fecha2.getDate()
  );
}

function esActiva(fechaFinalStr) {
  const [anio, mes, dia] = fechaFinalStr.split("-").map(Number);
  const fechaFinalLocal = new Date(anio, mes - 1, dia); // mes va de 0 a 11

  const hoy = new Date();
  const hoyLocal = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

  return fechaFinalLocal >= hoyLocal;
}


async function cargarIncapacidades() {
  const nombreFiltro = document.getElementById("filtro-nombre").value.toLowerCase();
  const estadoFiltro = document.getElementById("filtro-estado").value;

  const res = await fetch("/api/incapacidades");
  const data = await res.json();
  const contenedor = document.getElementById("incapacidades-list");
  contenedor.innerHTML = "";

  data.forEach((item) => {
    const nombreCompleto = `${item.nombres} ${item.paterno} ${item.materno}`.toLowerCase();
    const estaActiva = esActiva(item.fechaFinal);

    const pasaFiltroNombre = nombreCompleto.includes(nombreFiltro);
    const pasaFiltroEstado =
      estadoFiltro === "todas" ||
      (estadoFiltro === "activas" && estaActiva) ||
      (estadoFiltro === "inactivas" && !estaActiva);

    if (pasaFiltroNombre && pasaFiltroEstado) {
      const card = document.createElement("div");
      card.classList.add("reporte-card");
      card.innerHTML = `
        <div class="reporte-titulo tipo-incapacidad">${item.tipo}</div>
        <div class="reporte-detalle nombre-empleado">
          <span class="reporte-etiqueta">Empleado:</span> ${item.nombres} ${item.paterno} ${item.materno}
        </div>
        <div class="reporte-detalle fecha-inicio">
          <span class="reporte-etiqueta">Inicio:</span> ${item.fechaInicio}
        </div>
        <div class="reporte-detalle fecha-final">
          <span class="reporte-etiqueta">Fin:</span> ${item.fechaFinal}
        </div>
        <div class="reporte-detalle observaciones">
          <span class="reporte-etiqueta">Observaciones:</span> ${item.observaciones}
        </div>
      `;
      contenedor.appendChild(card);
    }
  });
}

async function exportarExcelDesdeVista() {
  try {
    const response = await fetch('/api/incapacidadesExcel');
    if (!response.ok) {
      alert('Error al descargar el archivo Excel del servidor');
      return;
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Incapacidades.xlsx';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    alert('Error al descargar el archivo: ' + error.message);
  }
}
