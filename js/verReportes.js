let reportesGlobal = [];

document.addEventListener("DOMContentLoaded", function () {
  const contenedor = document.getElementById("report-content");

  // Función para formatear fechas de manera más legible
  function formatearFecha(fechaStr) {
    const fecha = new Date(fechaStr);
    const opciones = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      timeZone: 'America/Mexico_City'
    };
    return fecha.toLocaleDateString('es-MX', opciones);
  }

  // Función para exportar un reporte específico a PDF
  async function exportarReportePDF(reporteData) {
    try {
      Swal.fire({
        title: "Generando PDF...",
        text: "Preparando documento de reporte",
        icon: "info",
        allowOutsideClick: false,
        showConfirmButton: false,
        willOpen: () => Swal.showLoading()
      });

      // Obtener datos adicionales del empleado
      const response = await fetch(`/api/empleado/${reporteData.idUsuario}`);
      let empleadoData = {};
      if (response.ok) {
        empleadoData = await response.json();
      }

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      const margenIzq = 20;
      const margenDer = 20;
      const anchoPagina = 210; 
      const anchoUtil = anchoPagina - margenIzq - margenDer;

      const colorPrimario = [0, 102, 204];
      const colorSecundario = [102, 102, 102];
      const colorTexto = [33, 37, 41];
      const colorAlerta = [220, 53, 69];

      // HEADER
      doc.setFillColor(...colorAlerta);
      doc.rect(0, 0, anchoPagina, 25, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('REPORTE DE INCIDENCIA', anchoPagina / 2, 16, { align: 'center' });

      doc.setDrawColor(...colorAlerta);
      doc.setLineWidth(2);
      doc.line(margenIzq, 30, anchoPagina - margenDer, 30);

      let yPosition = 45;

      // Título documento
      doc.setTextColor(...colorTexto);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('DOCUMENTO OFICIAL DE REPORTE', margenIzq, yPosition);
      yPosition += 15;

      // Datos del empleado
      doc.setFillColor(245, 245, 245);
      doc.rect(margenIzq, yPosition, anchoUtil, 8, 'F');
      doc.setTextColor(...colorPrimario);
      doc.setFontSize(12);
      doc.text('DATOS DEL EMPLEADO REPORTADO', margenIzq + 2, yPosition + 5);
      yPosition += 15;

      const nombreCompleto = `${reporteData.Nombres || ''} ${reporteData.Paterno || ''} ${reporteData.Materno || ''}`.trim();
      const idEmpleado = reporteData.idUsuario || 'No disponible';
      const puestoEmpleado = empleadoData.Puesto || 'No especificado';

      let areaEmpleado = 'No asignada';
      if (empleadoData.Areas && empleadoData.Areas.length > 0) {
        areaEmpleado = empleadoData.Areas.map(area => area.NombreArea).join(', ');
      } else if (empleadoData.Area) {
        areaEmpleado = empleadoData.Area;
      }

      const datosEmpleado = [
        `Nombre completo: ${nombreCompleto}`,
        `ID de empleado: ${idEmpleado}`,
        `Puesto: ${puestoEmpleado}`,
        `Área: ${areaEmpleado}`
      ];
      doc.setTextColor(...colorTexto);
      doc.setFontSize(11);
      datosEmpleado.forEach((t) => { doc.text(t, margenIzq, yPosition); yPosition += 6; });
      yPosition += 10;

      // Detalles del reporte
      doc.setFillColor(245, 245, 245);
      doc.rect(margenIzq, yPosition, anchoUtil, 8, 'F');
      doc.setTextColor(...colorAlerta);
      doc.setFontSize(12);
      doc.text('DETALLES DEL REPORTE', margenIzq + 2, yPosition + 5);
      yPosition += 15;

      let fechaFormateada = reporteData.FechaReporte ? formatearFecha(reporteData.FechaReporte) : 'No disponible';
      const datosReporte = [
        `Asunto del reporte: ${reporteData.Asunto || 'No especificado'}`,
        `Fecha del reporte: ${fechaFormateada}`,
        `ID del reporte: ${reporteData.idReporte || 'No disponible'}`
      ];
      doc.setTextColor(...colorTexto);
      doc.setFontSize(11);
      datosReporte.forEach((t) => { doc.text(t, margenIzq, yPosition); yPosition += 6; });
      yPosition += 10;

      // Observaciones
      doc.setFillColor(252, 248, 227);
      doc.rect(margenIzq, yPosition, anchoUtil, 8, 'F');
      doc.setTextColor(...colorAlerta);
      doc.setFontSize(12);
      doc.text('OBSERVACIONES Y DETALLES', margenIzq + 2, yPosition + 5);
      yPosition += 15;

      doc.setTextColor(...colorTexto);
      doc.setFontSize(10);
      const observaciones = reporteData.Observaciones || 'Sin observaciones registradas';
      const lineasObs = doc.splitTextToSize(observaciones, anchoUtil - 10);
      const alturaObs = lineasObs.length * 5 + 10;
      doc.setFillColor(255, 255, 255);
      doc.rect(margenIzq, yPosition - 5, anchoUtil, alturaObs, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.rect(margenIzq, yPosition - 5, anchoUtil, alturaObs, 'S');
      lineasObs.forEach((l) => { doc.text(l, margenIzq + 5, yPosition); yPosition += 5; });
      yPosition += 15;

      // Seguimiento
      doc.setFillColor(240, 248, 255);
      doc.rect(margenIzq, yPosition, anchoUtil, 35, 'F');
      doc.setTextColor(...colorPrimario);
      doc.setFontSize(12);
      doc.text('ESPACIO PARA SEGUIMIENTO', margenIzq + 2, yPosition + 8);
      doc.setTextColor(...colorSecundario);
      doc.setFontSize(9);
      doc.text('Acciones tomadas:', margenIzq + 2, yPosition + 18);
      doc.setDrawColor(180, 180, 180);
      for (let i = 0; i < 3; i++) {
        const lineY = yPosition + 25 + (i * 4);
        doc.line(margenIzq + 2, lineY, anchoPagina - margenDer - 2, lineY);
      }
      yPosition += 45;

      // Footer
      const fechaGeneracion = new Date().toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Mexico_City'
      });
      yPosition = 280;
      doc.setDrawColor(...colorPrimario);
      doc.line(margenIzq, yPosition, anchoPagina - margenDer, yPosition);
      doc.setFontSize(8);
      doc.setTextColor(...colorSecundario);
      doc.text('Recursos Humanos | Documento confidencial', margenIzq, yPosition + 5);
      const totalPaginas = doc.internal.getNumberOfPages();
      doc.text(`Página 1 de ${totalPaginas}`, anchoPagina - margenDer, yPosition + 5, { align: 'right' });

      // Guardar PDF
      const nombreArchivo = `Reporte_${nombreCompleto.replace(/\s+/g, '_') || 'empleado'}_${reporteData.idReporte || 'id'}.pdf`;
      doc.save(nombreArchivo);

      Swal.fire({ title: "PDF Generado!", text: "Se descargó correctamente.", icon: "success", timer: 2000, showConfirmButton: false });
    } catch (error) {
      console.error("Error al generar PDF:", error);
      Swal.fire("Error", "No se pudo generar el documento.", "error");
    }
  }

  // Cargar y mostrar reportes
  fetch("/api/reportes")
    .then(res => res.json())
    .then(response => {
      if (response.success && response.data) {
        reportesGlobal = response.data;
        mostrarReportes(response.data);
      } else {
        throw new Error(response.error || "Formato inválido");
      }
    })
    .catch(err => {
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
          <div class="reporte-acciones">
            <button class="pdf-reporte-btn" title="Exportar a PDF">📄</button>
            <button class="delete-reporte-btn" title="Eliminar reporte">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
        </div>
        <div class="reporte-detalle"><span class="reporte-etiqueta">Fecha:</span><br>${reporte.FechaReporte}</div>
        <div class="reporte-detalle"><span class="reporte-etiqueta">Empleado:</span><br>${nombreCompleto}</div>
        <div class="reporte-detalle"><span class="reporte-etiqueta">Observaciones:</span><br>${reporte.Observaciones}</div>
      `;

      contenedor.appendChild(card);
    });

    // Eventos PDF
    document.querySelectorAll(".pdf-reporte-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const tarjeta = btn.closest(".reporte-card");
        const id = tarjeta.getAttribute("data-id");
        const reporte = reportesGlobal.find(r => r.idReporte.toString() === id);
        if (reporte) {
          exportarReportePDF(reporte);
        }
      });
    });

    // Eventos eliminar/enterado
    document.querySelectorAll(".delete-reporte-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const tarjeta = btn.closest(".reporte-card");
        const id = tarjeta.getAttribute("data-id");

        Swal.fire({
          title: "¿Marcar este reporte como enterado?",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Sí, marcar",
          cancelButtonText: "Cancelar"
        }).then(result => {
          if (!result.isConfirmed) return;

          fetch(`/api/reportes/${id}/enterado`, { method: "PUT" })
            .then(res => res.json())
            .then(data => {
              if (data.mensaje) {
                Swal.fire("Reporte actualizado", data.mensaje, "success").then(() => {
                  tarjeta.remove();
                });
              } else {
                Swal.fire("Error", data.error || "desconocido", "error");
              }
            })
            .catch(err => {
              console.error("Error al actualizar:", err);
              Swal.fire("Error", "No se pudo marcar el reporte.", "error");
            });
        });
      });
    });
  }
});
