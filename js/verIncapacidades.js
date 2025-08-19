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
        card.setAttribute("data-idincapacidad", item.idIncapacidad); // 👈 ID específico de la incapacidad

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
            <button class="delete-reporte-btn" title="Marcar como enterado">&times;</button>
          </div>
        `;

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

async function exportarExcelDesdeVista() {
  try {
    

    const response = await fetch('/api/incapacidadesExcel');
    
    if (!response.ok) {
      throw new Error(`Error del servidor: ${response.status}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Generar nombre con fecha actual
    const fecha = new Date().toISOString().split('T')[0];
    a.download = `Incapacidades_${fecha}.xlsx`;
    
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);

    

  } catch (error) {
    console.error("Error al exportar Excel:", error);
    Swal.fire({
      title: "Error en la descarga",
      text: "No se pudo descargar el archivo Excel. Por favor, intenta nuevamente.",
      icon: "error",
      confirmButtonText: "Entendido"
    });
  }
}