let reportesGlobal = [];

document.addEventListener("DOMContentLoaded", function () {
  const contenedor = document.getElementById("report-content");
  const inputFiltro = document.getElementById("filtro-empleado");
  const selectAsunto = document.getElementById("subject");
  const selectAnio = document.getElementById("filtro-anio");
  const selectMes = document.getElementById("filtro-mes");

  // Función para exportar Excel
  window.exportarExcelDesdeVista = function () {
    const tarjetas = document.querySelectorAll(".reporte-card");
    if (tarjetas.length === 0) {
      alert("No hay reportes visibles para exportar.");
      return;
    }

    const datosExportar = [];

    tarjetas.forEach((card) => {
      const asunto = card.querySelector(".reporte-titulo")?.innerText || "";
      const empleado =
        card
          .querySelectorAll(".reporte-detalle")[1] // Índice 1 porque fecha es índice 0
          ?.innerText.replace("Empleado:", "")
          .trim() || "";
      const observaciones =
        card
          .querySelectorAll(".reporte-detalle")[2] // Índice 2 porque empleado es índice 1
          ?.innerText.replace("Observaciones:", "")
          .trim() || "";
      const fecha =
        card
          .querySelectorAll(".reporte-detalle")[0] // Índice 0 para fecha
          ?.innerText.replace("Fecha:", "")
          .trim() || "";

      datosExportar.push({
        Asunto: asunto,
        Empleado: empleado,
        Observaciones: observaciones,
        Fecha: fecha
      });
    });

    fetch("/api/exportar-reportes-vista", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(datosExportar),
    })
      .then((response) => {
        if (!response.ok) throw new Error("Error al generar el archivo.");
        return response.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "Reportes_Visibles.xlsx";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      })
      .catch((err) => {
        console.error("Error:", err);
        alert("Hubo un error al exportar los reportes.");
      });
  };

  // Cargar datos desde el backend
  fetch("/api/reportes-usuarios")
    .then((res) => {
      if (!res.ok) throw new Error("Error al cargar reportes");
      return res.json();
    })
    .then((reportes) => {
      reportesGlobal = reportes;
      mostrarReportes(reportes);
      llenarFiltroAnios(reportes);
    })
    .catch((err) => {
      console.error("Error:", err);
      contenedor.innerHTML = "<p>Error al cargar los reportes.</p>";
    });

  // Función para llenar el filtro de años basado en los reportes
  function llenarFiltroAnios(reportes) {
    const aniosUnicos = [...new Set(
      reportes
        .map(reporte => new Date(reporte.FechaReporte).getFullYear())
        .filter(anio => !isNaN(anio))
    )].sort((a, b) => b - a); // Ordenar descendente

    selectAnio.innerHTML = '<option value="">Seleccionar año...</option>';
    aniosUnicos.forEach(anio => {
      const option = document.createElement("option");
      option.value = anio;
      option.textContent = anio;
      selectAnio.appendChild(option);
    });
  }

  function mostrarReportes(reportes) {
    contenedor.innerHTML = "";

    if (reportes.length === 0) {
      contenedor.innerHTML = "<p>No hay reportes registrados.</p>";
      return;
    }

    reportes.forEach((reporte) => {
      const card = document.createElement("div");
      card.classList.add("reporte-card");
      card.setAttribute("data-id", reporte.idReporte);

      const nombreCompleto = `${reporte.Nombres} ${reporte.Paterno} ${reporte.Materno}`;

      card.innerHTML = `
      <div class="reporte-header">
        <div class="reporte-titulo">${reporte.Asunto}</div>
        <button class="delete-reporte-btn" title="Eliminar reporte">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>

      <div class="reporte-detalle">
        <span class="reporte-etiqueta">Fecha:</span><br>
        ${reporte.FechaReporte}
      </div>
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

    // Agregar eventos para marcar como enterado
    document.querySelectorAll(".delete-reporte-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const tarjeta = btn.closest(".reporte-card");
        const id = tarjeta.getAttribute("data-id");

        if (!confirm("¿Marcar este reporte como enterado?")) return;

        fetch(`/api/reportes/${id}/enterado`, {
          method: "PUT"
        })
          .then(res => res.json())
          .then(data => {
            if (data.mensaje) {
              tarjeta.remove();
            } else {
              alert("Error al actualizar: " + (data.error || "desconocido"));
            }
          })
          .catch(err => {
            console.error("Error al actualizar:", err);
            alert("No se pudo marcar el reporte.");
          });
      });
    });
  }

  // Función unificada para aplicar todos los filtros
  function aplicarFiltros() {
    const valorEmpleado = inputFiltro.value.toLowerCase().trim();
    const valorAsunto = selectAsunto.value;
    const valorAnio = selectAnio.value;
    const valorMes = selectMes.value;

    const filtrados = reportesGlobal.filter((reporte) => {
      // Filtro por nombre de empleado
      const nombreCompleto = `${reporte.Nombres} ${reporte.Paterno} ${reporte.Materno}`.toLowerCase();
      const pasaFiltroEmpleado = nombreCompleto.includes(valorEmpleado);

      // Filtro por asunto
      const pasaFiltroAsunto = !valorAsunto || reporte.Asunto === valorAsunto;

      // Filtro por año
      let pasaFiltroAnio = true;
      if (valorAnio) {
        const fechaReporte = new Date(reporte.FechaReporte);
        pasaFiltroAnio = fechaReporte.getFullYear().toString() === valorAnio;
      }

      // Filtro por mes
      let pasaFiltroMes = true;
      if (valorMes) {
        const fechaReporte = new Date(reporte.FechaReporte);
        const mesReporte = (fechaReporte.getMonth() + 1).toString().padStart(2, '0');
        pasaFiltroMes = mesReporte === valorMes;
      }

      return pasaFiltroEmpleado && pasaFiltroAsunto && pasaFiltroAnio && pasaFiltroMes;
    });

    mostrarReportes(filtrados);
  }

  // Event listeners para todos los filtros
  inputFiltro.addEventListener("input", aplicarFiltros);
  selectAsunto.addEventListener("change", aplicarFiltros);
  selectAnio.addEventListener("change", aplicarFiltros);
  selectMes.addEventListener("change", aplicarFiltros);

  // Cargar asuntos en el select
  cargarAsuntos();
});

// Función para cargar asuntos
async function cargarAsuntos() {
  const selectAsunto = document.getElementById("subject");
  try {
    const res = await fetch("/api/asuntos");
    const data = await res.json();
    
    // Limpiar opciones existentes excepto la primera
    selectAsunto.innerHTML = '<option value="">Filtrar por asunto...</option>';
    
    data.forEach((asunto) => {
      const option = document.createElement("option");
      // Usar el campo correcto según tu estructura de datos
      option.value = asunto.TipoAsunto || asunto.texto; 
      option.textContent = asunto.TipoAsunto || asunto.texto;
      selectAsunto.appendChild(option);
    });
  } catch (err) {
    console.error("Error al cargar asuntos:", err);
  }
}