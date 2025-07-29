let reportesGlobal = [];

document.addEventListener("DOMContentLoaded", function () {
  const contenedor = document.getElementById("report-content");
  const inputFiltro = document.getElementById("filtro-empleado");

window.exportarExcelDesdeVista = function () {
  const tarjetas = document.querySelectorAll(".reporte-card");
  if (tarjetas.length === 0) {
    alert("No hay reportes visibles para exportar.");
    return;
  }

  const datosExportar = [];

  tarjetas.forEach((card) => {
    const asunto = card.querySelector(".reporte-titulo")?.innerText || "";
    const empleado = card.querySelectorAll(".reporte-detalle")[0]?.innerText.replace("Empleado:", "").trim() || "";
    const observaciones = card.querySelectorAll(".reporte-detalle")[1]?.innerText.replace("Observaciones:", "").trim() || "";

    datosExportar.push({
      "Asunto": asunto,
      "Empleado": empleado,
      "Observaciones": observaciones
    });
  });

  fetch('/api/exportar-reportes-vista', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(datosExportar)
  })
    .then(response => {
      if (!response.ok) throw new Error("Error al generar el archivo.");
      return response.blob();
    })
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Reportes_Visibles.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    })
    .catch(err => {
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
    })
    .catch((err) => {
      console.error("Error:", err);
      contenedor.innerHTML = "<p>Error al cargar los reportes.</p>";
    });

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

  // Agregar eventos de eliminación
  document.querySelectorAll(".delete-reporte-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const tarjeta = btn.closest(".reporte-card");
      const id = tarjeta.getAttribute("data-id");

      if (!confirm("¿Estás seguro de eliminar este reporte?")) return;

      fetch(`/api/reportes/eliminar/${id}`, {
        method: "DELETE"
      })
        .then(res => res.json())
        .then(data => {
          if (data.mensaje) {
            tarjeta.remove();
          } else {
            alert("Error al eliminar: " + (data.error || "desconocido"));
          }
        })
        .catch(err => {
          console.error("Error al eliminar:", err);
          alert("No se pudo eliminar el reporte.");
        });
    });
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
