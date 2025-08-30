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

// Función para formatear fechas de manera más legible
function formatearFecha(fechaStr) {
  const [anio, mes, dia] = fechaStr.split("-");
  const fecha = new Date(anio, mes - 1, dia);
  
  const opciones = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    timeZone: 'America/Mexico_City'
  };
  
  return fecha.toLocaleDateString('es-MX', opciones);
}

// Función para calcular días de incapacidad
function calcularDiasIncapacidad(fechaInicio, fechaFinal) {
  const inicio = new Date(fechaInicio);
  const final = new Date(fechaFinal);
  const diferencia = final.getTime() - inicio.getTime();
  return Math.ceil(diferencia / (1000 * 3600 * 24)) + 1; // +1 para incluir ambos días
}

// Función para exportar a PDF una incapacidad específica
async function exportarIncapacidadPDF(incapacidadData) {
  try {
    // Mostrar loading
    Swal.fire({
      title: "Generando PDF...",
      text: "Preparando documento de incapacidad",
      icon: "info",
      allowOutsideClick: false,
      showConfirmButton: false,
      willOpen: () => {
        Swal.showLoading();
      }
    });

    // Obtener datos adicionales del empleado si es necesario
    const response = await fetch(`/api/empleado/${incapacidadData.idUsuario}`);
    const empleadoData = await response.json();

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

    // HEADER - Logo y título de la empresa
    doc.setFillColor(...colorPrimario);
    doc.rect(0, 0, anchoPagina, 25, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORTE DE INCAPACIDAD', anchoPagina / 2, 16, { align: 'center' });

    // Línea decorativa
    doc.setDrawColor(...colorPrimario);
    doc.setLineWidth(2);
    doc.line(margenIzq, 30, anchoPagina - margenDer, 30);

    let yPosition = 45;

    // TÍTULO DEL DOCUMENTO
    doc.setTextColor(...colorTexto);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('CONSTANCIA DE INCAPACIDAD LABORAL', margenIzq, yPosition);
    yPosition += 15;

    // INFORMACIÓN DEL EMPLEADO
    doc.setFillColor(245, 245, 245);
    doc.rect(margenIzq, yPosition, anchoUtil, 8, 'F');
    
    doc.setTextColor(...colorPrimario);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL EMPLEADO', margenIzq + 2, yPosition + 5);
    yPosition += 15;

    doc.setTextColor(...colorTexto);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);

    // Datos del empleado en dos columnas
    const datosEmpleado = [
      [`Nombre completo: ${incapacidadData.nombres} ${incapacidadData.paterno} ${incapacidadData.materno}`],
      [`ID de empleado: ${incapacidadData.idUsuario}`],
      [`Puesto: ${empleadoData.Puesto || 'No especificado'}`],
      [`Fecha de ingreso: ${empleadoData.FechaIngreso ? formatearFecha(empleadoData.FechaIngreso) : 'No disponible'}`]
    ];

    datosEmpleado.forEach(([texto]) => {
      doc.text(texto, margenIzq, yPosition);
      yPosition += 6;
    });

    yPosition += 10;

    // INFORMACIÓN DE LA INCAPACIDAD
    doc.setFillColor(245, 245, 245);
    doc.rect(margenIzq, yPosition, anchoUtil, 8, 'F');
    
    doc.setTextColor(...colorPrimario);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DETALLES DE LA INCAPACIDAD', margenIzq + 2, yPosition + 5);
    yPosition += 15;

    doc.setTextColor(...colorTexto);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);

    const diasIncapacidad = calcularDiasIncapacidad(incapacidadData.fechaInicio, incapacidadData.fechaFinal);
    const fechaInicioFormateada = formatearFecha(incapacidadData.fechaInicio);
    const fechaFinalFormateada = formatearFecha(incapacidadData.fechaFinal);

    const datosIncapacidad = [
      `Tipo de incapacidad: ${incapacidadData.tipo}`,
      `Fecha de inicio: ${fechaInicioFormateada}`,
      `Fecha de término: ${fechaFinalFormateada}`,
      `Duración total: ${diasIncapacidad} día${diasIncapacidad !== 1 ? 's' : ''}`,
      `Estado: ${esActiva(incapacidadData.fechaFinal) ? 'ACTIVA' : 'FINALIZADA'}`
    ];

    datosIncapacidad.forEach((texto) => {
      doc.text(texto, margenIzq, yPosition);
      yPosition += 6;
    });

    yPosition += 10;

    // OBSERVACIONES
    if (incapacidadData.observaciones && incapacidadData.observaciones.trim()) {
      doc.setFillColor(245, 245, 245);
      doc.rect(margenIzq, yPosition, anchoUtil, 8, 'F');
      
      doc.setTextColor(...colorPrimario);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('OBSERVACIONES MÉDICAS', margenIzq + 2, yPosition + 5);
      yPosition += 15;

      doc.setTextColor(...colorTexto);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      // Dividir observaciones largas en líneas
      const observaciones = incapacidadData.observaciones;
      const lineasObservaciones = doc.splitTextToSize(observaciones, anchoUtil - 10);
      
      lineasObservaciones.forEach((linea) => {
        doc.text(linea, margenIzq, yPosition);
        yPosition += 5;
      });

      yPosition += 10;
    }

    // INFORMACIÓN ADICIONAL
    yPosition += 20;
    doc.setFillColor(250, 250, 250);
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
    doc.text('Este documento es una constancia interna de registro de incapacidad laboral.', margenIzq + 2, yPosition + 15);
    doc.text('Para efectos oficiales, consulte con el departamento de Recursos Humanos.', margenIzq + 2, yPosition + 20);

    // FOOTER
    const totalPaginas = doc.internal.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(...colorSecundario);
    doc.text(`Página 1 de ${totalPaginas}`, anchoPagina - margenDer, 285, { align: 'right' });

    // Generar nombre del archivo
    const nombreArchivo = `Incapacidad_${incapacidadData.nombres}_${incapacidadData.paterno}_${incapacidadData.fechaInicio}.pdf`;

    // Guardar el PDF
    doc.save(nombreArchivo);

    // Cerrar loading y mostrar éxito
    Swal.fire({
      title: "¡PDF Generado!",
      text: "El documento de incapacidad se ha descargado correctamente.",
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

async function cargarIncapacidades() {
  const nombreFiltro = document.getElementById("filtro-nombre").value.toLowerCase();
  const estadoFiltro = document.getElementById("filtro-estado").value;

  try {
    const res = await fetch("/api/incapacidades");
    
    if (!res.ok) {
      throw new Error(`Error del servidor: ${res.status}`);
    }

    const data = await res.json();
    const contenedor = document.getElementById("incapacidades-list");
    contenedor.innerHTML = "";

    if (data.error) {
      Swal.fire("Error", data.error, "error");
      return;
    }

    if (data.length === 0) {
      contenedor.innerHTML = '<div class="sin-resultados">No se encontraron incapacidades pendientes</div>';
      return;
    }

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
        card.setAttribute("data-idusuario", item.idUsuario);
        card.setAttribute("data-idincapacidad", item.idIncapacidad);

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
            <span class="reporte-etiqueta">Observaciones:</span> ${item.observaciones || 'Sin observaciones'}
          </div>
          <div class="reporte-acciones">
            <button class="pdf-reporte-btn" title="Exportar a PDF">📄</button>
            <button class="delete-reporte-btn" title="Marcar como enterado">&times;</button>
          </div>
        `;

        // Evento para el botón de exportar PDF
        card.querySelector(".pdf-reporte-btn").addEventListener("click", () => {
          exportarIncapacidadPDF(item);
        });

        // Evento para el botón de marcar como enterado
        card.querySelector(".delete-reporte-btn").addEventListener("click", () => {
          const idIncapacidad = card.getAttribute("data-idincapacidad");
          const nombreEmpleado = `${item.nombres} ${item.paterno} ${item.materno}`;

          Swal.fire({
            title: "¿Estás seguro?",
            text: `La incapacidad de ${nombreEmpleado} se marcará como enterada.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Sí, confirmar",
            cancelButtonText: "Cancelar",
            reverseButtons: true
          }).then((result) => {
            if (!result.isConfirmed) return;

            // Mostrar loading
            Swal.fire({
              title: "Procesando...",
              text: "Marcando incapacidad como enterada",
              icon: "info",
              allowOutsideClick: false,
              showConfirmButton: false,
              willOpen: () => {
                Swal.showLoading();
              }
            });

            fetch(`/api/incapacidades/${idIncapacidad}/enterado`, {
              method: "PUT",
              headers: {
                'Content-Type': 'application/json'
              }
            })
              .then(res => {
                if (!res.ok) {
                  throw new Error(`Error del servidor: ${res.status}`);
                }
                return res.json();
              })
              .then(data => {
                if (data.mensaje) {
                  Swal.fire({
                    title: "¡Actualizado!",
                    text: data.mensaje,
                    icon: "success",
                    timer: 2000,
                    showConfirmButton: false
                  }).then(() => {
                    // Remover la tarjeta con animación suave
                    card.style.transition = "all 0.3s ease";
                    card.style.transform = "translateX(100%)";
                    card.style.opacity = "0";
                    
                    setTimeout(() => {
                      card.remove();
                      
                      // Verificar si quedan tarjetas
                      const tarjetasRestantes = document.querySelectorAll('.reporte-card');
                      if (tarjetasRestantes.length === 0) {
                        contenedor.innerHTML = '<div class="sin-resultados">No hay más incapacidades pendientes</div>';
                      }
                    }, 300);
                  });
                } else {
                  Swal.fire({
                    title: "Error",
                    text: data.error || "No se pudo actualizar la incapacidad.",
                    icon: "error",
                    confirmButtonText: "Entendido"
                  });
                }
              })
              .catch(err => {
                console.error("Error al actualizar incapacidad:", err);
                Swal.fire({
                  title: "Error de conexión",
                  text: "No se pudo conectar con el servidor. Por favor, intenta nuevamente.",
                  icon: "error",
                  confirmButtonText: "Entendido"
                });
              });
          });
        });

        contenedor.appendChild(card);
      }
    });

    // Mostrar mensaje si no hay resultados después del filtrado
    const tarjetasVisibles = document.querySelectorAll('.reporte-card');
    if (tarjetasVisibles.length === 0 && (nombreFiltro || estadoFiltro !== 'todas')) {
      contenedor.innerHTML = '<div class="sin-resultados">No se encontraron incapacidades que coincidan con los filtros aplicados</div>';
    }

  } catch (error) {
    console.error("Error al cargar incapacidades:", error);
    Swal.fire({
      title: "Error al cargar datos",
      text: "No se pudieron cargar las incapacidades. Por favor, recarga la página.",
      icon: "error",
      confirmButtonText: "Recargar página"
    }).then((result) => {
      if (result.isConfirmed) {
        window.location.reload();
      }
    });
  }
}

