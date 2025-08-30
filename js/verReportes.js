let reportesGlobal = [];

document.addEventListener("DOMContentLoaded", function () {
  const contenedor = document.getElementById("report-content");
  const inputFiltro = document.getElementById("filtro-empleado");
  const selectAsunto = document.getElementById("subject");
  const selectAnio = document.getElementById("filtro-anio");
  const selectMes = document.getElementById("filtro-mes");

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
    // Mostrar loading
    Swal.fire({
      title: "Generando PDF...",
      text: "Preparando documento de reporte",
      icon: "info",
      allowOutsideClick: false,
      showConfirmButton: false,
      willOpen: () => {
        Swal.showLoading();
      }
    });

    // Obtener datos adicionales del empleado si es necesario
    const response = await fetch(`/api/empleado/${reporteData.idUsuario}`);
    let empleadoData = {};
    if (response.ok) {
      empleadoData = await response.json();
    }

    // Crear el contenido del PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Configuración de márgenes y dimensiones
    const margenIzq = 20;
    const margenDer = 20;
    const anchoPagina = 210; // A4 width in mm
    const anchoUtil = anchoPagina - margenIzq - margenDer;
    
    // Colores
    const colorPrimario = [0, 102, 204]; // Azul corporativo
    const colorSecundario = [102, 102, 102]; // Gris
    const colorTexto = [33, 37, 41]; // Negro suave
    const colorAlerta = [220, 53, 69]; // Rojo para reportes

    // HEADER - Logo y título de la empresa
    doc.setFillColor(...colorAlerta);
    doc.rect(0, 0, anchoPagina, 25, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORTE DE INCIDENCIA', anchoPagina / 2, 16, { align: 'center' });

    // Línea decorativa
    doc.setDrawColor(...colorAlerta);
    doc.setLineWidth(2);
    doc.line(margenIzq, 30, anchoPagina - margenDer, 30);

    let yPosition = 45;

    // TÍTULO DEL DOCUMENTO
    doc.setTextColor(...colorTexto);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('DOCUMENTO OFICIAL DE REPORTE', margenIzq, yPosition);
    yPosition += 15;

    // INFORMACIÓN DEL EMPLEADO
    doc.setFillColor(245, 245, 245);
    doc.rect(margenIzq, yPosition, anchoUtil, 8, 'F');
    
    doc.setTextColor(...colorPrimario);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL EMPLEADO REPORTADO', margenIzq + 2, yPosition + 5);
    yPosition += 15;

    doc.setTextColor(...colorTexto);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);

    // Datos del empleado - usando los campos correctos del endpoint
    const nombreCompleto = `${reporteData.Nombres || ''} ${reporteData.Paterno || ''} ${reporteData.Materno || ''}`.trim();
    
    // ID: del endpoint principal
    const idEmpleado = reporteData.idUsuario || 'No disponible';
    
    // Puesto: del endpoint adicional de empleado
    const puestoEmpleado = empleadoData.Puesto || 'No especificado';
    
    // Área: del endpoint adicional de empleado
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

    datosEmpleado.forEach((texto) => {
      doc.text(texto, margenIzq, yPosition);
      yPosition += 6;
    });

    yPosition += 10;

    // INFORMACIÓN DEL REPORTE
    doc.setFillColor(245, 245, 245);
    doc.rect(margenIzq, yPosition, anchoUtil, 8, 'F');
    
    doc.setTextColor(...colorAlerta);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DETALLES DEL REPORTE', margenIzq + 2, yPosition + 5);
    yPosition += 15;

    doc.setTextColor(...colorTexto);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);

    // Formatear fecha - el endpoint devuelve formato YYYY-MM-DD
    let fechaFormateada = 'No disponible';
    if (reporteData.FechaReporte) {
      try {
        // Si viene en formato YYYY-MM-DD, crear la fecha correctamente
        const fechaParts = reporteData.FechaReporte.split('-');
        if (fechaParts.length === 3) {
          const fecha = new Date(fechaParts[0], fechaParts[1] - 1, fechaParts[2]);
          const opciones = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            timeZone: 'America/Mexico_City'
          };
          fechaFormateada = fecha.toLocaleDateString('es-MX', opciones);
        } else {
          // Fallback para otros formatos
          fechaFormateada = formatearFecha(reporteData.FechaReporte);
        }
      } catch (error) {
        console.warn('Error al formatear fecha:', error);
        fechaFormateada = reporteData.FechaReporte; // Usar fecha sin formatear
      }
    }

    const datosReporte = [
      `Asunto del reporte: ${reporteData.Asunto || 'No especificado'}`,
      `Fecha del reporte: ${fechaFormateada}`,
      `ID del reporte: ${reporteData.idReporte || 'No disponible'}`
    ];

    datosReporte.forEach((texto) => {
      doc.text(texto, margenIzq, yPosition);
      yPosition += 6;
    });

    yPosition += 10;

    // OBSERVACIONES DETALLADAS
    doc.setFillColor(252, 248, 227);
    doc.rect(margenIzq, yPosition, anchoUtil, 8, 'F');
    
    doc.setTextColor(...colorAlerta);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('OBSERVACIONES Y DETALLES', margenIzq + 2, yPosition + 5);
    yPosition += 15;

    doc.setTextColor(...colorTexto);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    // Dividir observaciones largas en líneas
    const observaciones = reporteData.Observaciones || 'Sin observaciones registradas';
    const lineasObservaciones = doc.splitTextToSize(observaciones, anchoUtil - 10);
    
    // Crear un marco para las observaciones
    const alturaObservaciones = lineasObservaciones.length * 5 + 10;
    doc.setFillColor(255, 255, 255);
    doc.rect(margenIzq, yPosition - 5, anchoUtil, alturaObservaciones, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.rect(margenIzq, yPosition - 5, anchoUtil, alturaObservaciones, 'S');
    
    lineasObservaciones.forEach((linea) => {
      doc.text(linea, margenIzq + 5, yPosition);
      yPosition += 5;
    });

    yPosition += 15;

    // SECCIÓN DE SEGUIMIENTO
    doc.setFillColor(240, 248, 255);
    doc.rect(margenIzq, yPosition, anchoUtil, 35, 'F');
    
    doc.setTextColor(...colorPrimario);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('ESPACIO PARA SEGUIMIENTO', margenIzq + 2, yPosition + 8);
    
    doc.setTextColor(...colorSecundario);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text('Acciones tomadas:', margenIzq + 2, yPosition + 18);
    
    // Líneas para completar manualmente
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.5);
    for (let i = 0; i < 3; i++) {
      const lineY = yPosition + 25 + (i * 4);
      doc.line(margenIzq + 2, lineY, anchoPagina - margenDer - 2, lineY);
    }

    yPosition += 45;

    // INFORMACIÓN ADICIONAL
    doc.setFillColor(248, 249, 250);
    doc.rect(margenIzq, yPosition, anchoUtil, 25, 'F');
    
    doc.setTextColor(...colorSecundario);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    
    const fechaGeneracion = new Date().toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Mexico_City'
    });

    doc.text(`Documento generado el: ${fechaGeneracion}`, margenIzq + 2, yPosition + 8);
    doc.text('Este documento constituye un registro oficial del reporte de incidencia.', margenIzq + 2, yPosition + 15);
    doc.text('Para seguimiento y resolución, contacte con el departamento de Recursos Humanos.', margenIzq + 2, yPosition + 20);

    // FOOTER con información de contacto
    yPosition = 280;
    doc.setDrawColor(...colorPrimario);
    doc.setLineWidth(1);
    doc.line(margenIzq, yPosition, anchoPagina - margenDer, yPosition);
    
    doc.setFontSize(8);
    doc.setTextColor(...colorSecundario);
    doc.text('Recursos Humanos | Documento confidencial', margenIzq, yPosition + 5);
    
    const totalPaginas = doc.internal.getNumberOfPages();
    doc.text(`Página 1 de ${totalPaginas}`, anchoPagina - margenDer, yPosition + 5, { align: 'right' });

    // Generar nombre del archivo
    const fechaLimpia = reporteData.FechaReporte || 'sin_fecha';
    const nombreLimpio = nombreCompleto.replace(/\s+/g, '_') || 'empleado_desconocido';
    const asuntoLimpio = (reporteData.Asunto || 'reporte').replace(/\s+/g, '_').substring(0, 20);
    const nombreArchivo = `Reporte_${nombreLimpio}_${asuntoLimpio}_${fechaLimpia}.pdf`;

    // Guardar el PDF
    doc.save(nombreArchivo);

    // Cerrar loading y mostrar éxito
    Swal.fire({
      title: "PDF Generado!",
      text: "El documento de reporte se ha descargado correctamente.",
      icon: "success",
      timer: 2000,
      showConfirmButton: false
    });

  } catch (error) {
    console.error("Error al generar PDF:", error);
    Swal.fire({
      title: "Error al generar PDF",
      text: "No se pudo generar el documento. Por favor, intenta nuevamente.",
      icon: "error",
      confirmButtonText: "Entendido"
    });
  }
}

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

  // Cargar datos desde el backend - VERSIÓN CORREGIDA
fetch("/api/reportes")
  .then((res) => {
    if (!res.ok) throw new Error("Error al cargar reportes");
    return res.json();
  })
  .then((response) => {
    // El endpoint devuelve { success: true, data: [...] }
    if (response.success && response.data) {
      reportesGlobal = response.data;
      mostrarReportes(response.data);
      llenarFiltroAnios(response.data);
    } else {
      throw new Error(response.error || "Formato de respuesta inválido");
    }
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
        <div class="reporte-acciones">
          <button class="pdf-reporte-btn" title="Exportar a PDF">📄</button>
          <button class="delete-reporte-btn" title="Eliminar reporte">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
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

    // Agregar eventos para exportar PDF
    document.querySelectorAll(".pdf-reporte-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const tarjeta = btn.closest(".reporte-card");
        const id = tarjeta.getAttribute("data-id");
        const reporte = reportesGlobal.find(r => r.idReporte.toString() === id);
        
        if (reporte) {
          exportarReportePDF(reporte);
        } else {
          Swal.fire("Error", "No se encontró la información del reporte", "error");
        }
      });
    });

    // Agregar eventos para marcar como enterado
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