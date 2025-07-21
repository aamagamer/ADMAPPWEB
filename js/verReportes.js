let reportesGlobal = [];

document.addEventListener("DOMContentLoaded", function () {
  const contenedor = document.getElementById("report-content");
  const inputFiltro = document.getElementById("filtro-empleado");

  // Cargar datos desde el backend
  fetch("/api/reportes-usuarios")
    .then((res) => {
      if (!res.ok) throw new Error("Error al cargar reportes");
      return res.json();
    })
    .then((reportes) => {
      reportesGlobal = reportes;
      mostrarReportes(reportes);
    })
    .catch((err) => {
      console.error("Error:", err);
      contenedor.innerHTML = "<p>Error al cargar los reportes.</p>";
    });

  // Función para renderizar reportes
  function mostrarReportes(reportes) {
    contenedor.innerHTML = "";

    if (reportes.length === 0) {
      contenedor.innerHTML = "<p>No hay reportes registrados.</p>";
      return;
    }

    reportes.forEach((reporte) => {
      const card = document.createElement("div");
      card.classList.add("reporte-card");

      const nombreCompleto = `${reporte.Nombres} ${reporte.Paterno} ${reporte.Materno}`;

      card.innerHTML = `
          <div class="reporte-titulo">${reporte.Asunto}</div>
          <div class="reporte-detalle">
            <span class="reporte-etiqueta">Empleado:</span><br>
            ${nombreCompleto}
          </div>
          <div class="reporte-detalle">
            <span class="reporte-etiqueta">Observaciones:</span><br>
            ${reporte.Observaciones}
          </div>
        `;

      contenedor.appendChild(card);
    });
  }

  // Filtro en tiempo real
  inputFiltro.addEventListener("input", function () {
    const valor = this.value.toLowerCase().trim();

    const filtrados = reportesGlobal.filter((reporte) => {
      const nombreCompleto =
        `${reporte.Nombres} ${reporte.Paterno} ${reporte.Materno}`.toLowerCase();
      return nombreCompleto.includes(valor);
    });

    mostrarReportes(filtrados);
  });
});
