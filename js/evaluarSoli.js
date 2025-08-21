const idUsuario = localStorage.getItem("idUsuario")

// Envuelve el código inicial de carga de datos en un listener DOMContentLoaded
// para asegurar que los elementos del DOM estén disponibles.
document.addEventListener("DOMContentLoaded", () => {
  if (idUsuario) {
    fetch(`/api/usuario/${idUsuario}/rol`)
      .then((res) => res.json())
      .then((data) => {
        if (data.idRol !== undefined) {
          localStorage.setItem("idRol", data.idRol)
        } else {
          console.error("No se pudo obtener el rol del usuario:", data.error)
        }
      })
      .catch((err) => {
        console.error("Error al obtener el rol del usuario:", err)
      })

    // ------------------------ Cargar VACACIONES ------------------------
    fetch(`/api/usuario/${idUsuario}/area`)
      .then((res) => res.json())
      .then((areas) => {
        const ids = areas.map((a) => a.idArea).join(",")
        return fetch(`/api/vacaciones/area/${ids}?idUsuario=${idUsuario}`)
      })
      .then((res) => res.json())
      .then((data) => {
        const box = document.getElementById("vacaciones-box")
        if (!box) {
          console.error("Element with id 'vacaciones-box' not found.")
          return
        }
        if (!Array.isArray(data)) {
          box.innerHTML = "Error al obtener las solicitudes."
          console.error("Respuesta inesperada:", data)
          return
        }
        if (data.length === 0) {
          box.innerHTML = "No hay solicitudes de vacaciones."
          return
        }
        box.innerHTML = ""
        data.forEach((vacacion) => {
          const card = document.createElement("div")
          card.classList.add("vacacion-card")
          const info = document.createElement("div")
          info.classList.add("vacacion-info")
          info.innerHTML = `
            <strong>${vacacion.nombre}</strong><br/>
            Del <strong>${formatearFechaConsistente(vacacion.inicio)}</strong>
            al <strong>${formatearFechaConsistente(vacacion.fin)}</strong><br/>
          `
          const btnGroup = document.createElement("div")
          btnGroup.classList.add("btn-group")
          const btnAceptar = document.createElement("button")
          btnAceptar.classList.add("btn-aceptar")
          btnAceptar.title = "Aceptar"
          btnAceptar.innerHTML = "✔️"
          btnAceptar.onclick = () => mostrarModal("aceptar", vacacion, "vacacion")
          const btnRechazar = document.createElement("button")
          btnRechazar.classList.add("btn-rechazar")
          btnRechazar.title = "Rechazar"
          btnRechazar.innerHTML = "❌"
          btnRechazar.onclick = () => mostrarModal("rechazar", vacacion, "vacacion")
          btnGroup.appendChild(btnAceptar)
          btnGroup.appendChild(btnRechazar)
          card.appendChild(info)
          card.appendChild(btnGroup)
          box.appendChild(card)
        })
      })
      .catch((error) => {
        const box = document.getElementById("vacaciones-box")
        if (box) {
          box.innerHTML = "Error al cargar datos."
        }
        console.error("Error:", error)
      })

    // ------------------------ Cargar PERMISOS ------------------------
    fetch(`/api/usuario/${idUsuario}/area`)
      .then((res) => res.json())
      .then((areas) => {
        const ids = areas.map((a) => a.idArea).join(",")
        return fetch(`/api/permisos/area/${ids}?idUsuario=${idUsuario}`)
      })
      .then((res) => res.json())
      .then((permisos) => {
        const box = document.getElementById("permisos-box")
        if (!box) {
          console.error("Element with id 'permisos-box' not found.")
          return
        }
        if (!Array.isArray(permisos)) {
          box.innerHTML = "Error al obtener los permisos."
          console.error("Respuesta inesperada:", permisos)
          return
        }
        if (permisos.length === 0) {
          box.innerHTML = "No hay solicitudes de permisos."
          return
        }
        box.innerHTML = ""
        permisos.forEach((permiso) => {
          const card = document.createElement("div")
          card.classList.add("vacacion-card")
          const info = document.createElement("div")
          info.classList.add("vacacion-info")
          info.innerHTML = `
            <strong>${permiso.nombre}</strong><br/>
            ${formatearFechaConsistente(permiso.fecha)}<br/>
            ${permiso.inicio} - ${permiso.fin}<br/>
            <em>${permiso.razon}</em><br/>
            <small>${permiso.compensacion}</small>
          `
          const btnGroup = document.createElement("div")
          btnGroup.classList.add("btn-group")
          const btnAceptar = document.createElement("button")
          btnAceptar.classList.add("btn-aceptar")
          btnAceptar.title = "Aceptar"
          btnAceptar.innerHTML = "✔️"
          btnAceptar.onclick = () => mostrarModal("aceptar", permiso, "permiso")
          const btnRechazar = document.createElement("button")
          btnRechazar.classList.add("btn-rechazar")
          btnRechazar.title = "Rechazar"
          btnRechazar.innerHTML = "❌"
          btnRechazar.onclick = () => mostrarModal("rechazar", permiso, "permiso")
          btnGroup.appendChild(btnAceptar)
          btnGroup.appendChild(btnRechazar)
          card.appendChild(info)
          card.appendChild(btnGroup)
          box.appendChild(card)
        })
      })
      .catch((error) => {
        const box = document.getElementById("permisos-box")
        if (box) {
          box.innerHTML = "Error al cargar permisos."
        }
        console.error("Error:", error)
      })
  } else {
    console.warn("idUsuario no encontrado en localStorage. No se puede obtener el rol del usuario o las solicitudes.")
    
  }
})

let accionPendiente = null

function mostrarModal(tipo, datos, tipoSolicitud) {
  const modal = document.getElementById("modal-confirmacion")
  const contenido = document.getElementById("modal-contenido")
  if (!modal || !contenido) {
    console.error("Elementos del modal no encontrados.")
    return
  }

  modal.style.cssText = `
    display: flex;
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    justify-content: center;
    align-items: center;
    z-index: 10000;
    animation: fadeIn 0.3s ease-out;
    padding: 20px;
    box-sizing: border-box;
  `

  contenido.style.cssText = `
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    max-width: 500px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
    transform: scale(1);
    animation: modalSlideIn 0.3s ease-out;
    margin: 0;
  `

  let resumen = `<div style="text-align: center; margin-bottom: 1.5rem;">
    <h3 style="color: #2c1e87; margin: 0 0 0.5rem 0; font-size: 1.4rem; font-weight: 600;">
      ${tipo === "aceptar" ? "✅ Confirmar Aprobación" : "❌ Confirmar Rechazo"}
    </h3>
    <div style="height: 2px; background: linear-gradient(90deg, #2c1e87, #4f46e5); margin: 0 auto; width: 60px; border-radius: 1px;"></div>
  </div>`

  resumen += `<div style="background: #f8f9fa; padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem; border-left: 4px solid #2c1e87;">
    <div style="font-weight: 600; color: #2c1e87; margin-bottom: 0.5rem; font-size: 1.1rem;">👤 ${datos.nombre}</div>`

  if (tipoSolicitud === "vacacion") {
    const fechaInicio = formatearFechaConsistente(datos.inicio)
    const fechaFin = formatearFechaConsistente(datos.fin)
    resumen += `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;">
        <div style="text-align: center; padding: 0.75rem; background: white; border-radius: 6px; border: 1px solid #e9ecef;">
          <div style="font-size: 0.85rem; color: #6c757d; font-weight: 500; margin-bottom: 0.25rem;">📅 INICIO</div>
          <div style="font-weight: 600; color: #2c1e87;">${fechaInicio}</div>
        </div>
        <div style="text-align: center; padding: 0.75rem; background: white; border-radius: 6px; border: 1px solid #e9ecef;">
          <div style="font-size: 0.85rem; color: #6c757d; font-weight: 500; margin-bottom: 0.25rem;">📅 FIN</div>
          <div style="font-weight: 600; color: #2c1e87;">${fechaFin}</div>
        </div>
      </div>
    `
  } else if (tipoSolicitud === "permiso") {
    const fechaPermiso = formatearFechaConsistente(datos.fecha)
    resumen += `
      <div style="margin-top: 1rem; display: grid; gap: 0.75rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: white; border-radius: 4px;">
          <span style="color: #6c757d; font-weight: 500;">📅 Fecha:</span>
          <span style="font-weight: 600; color: #2c1e87;">${fechaPermiso}</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: white; border-radius: 4px;">
          <span style="color: #6c757d; font-weight: 500;">🕐 Horario:</span>
          <span style="font-weight: 600; color: #2c1e87;">${datos.inicio} - ${datos.fin}</span>
        </div>
        <div style="padding: 0.75rem; background: white; border-radius: 4px;">
          <div style="color: #6c757d; font-weight: 500; margin-bottom: 0.5rem;">💭 Motivo:</div>
          <div style="font-style: italic; color: #495057;">${datos.razon}</div>
        </div>
        <div style="padding: 0.75rem; background: white; border-radius: 4px;">
          <div style="color: #6c757d; font-weight: 500; margin-bottom: 0.5rem;">⚖️ Compensación:</div>
          <div style="color: #495057;">${datos.compensacion}</div>
        </div>
      </div>
    `
  }

  resumen += `</div>`

  resumen += `<div style="text-align: center; margin: 1.5rem 0; padding: 1rem; background: ${tipo === "aceptar" ? "#d4edda" : "#f8d7da"}; border-radius: 8px; border: 1px solid ${tipo === "aceptar" ? "#c3e6cb" : "#f5c6cb"};">
    <div style="font-size: 1.1rem; font-weight: 600; color: ${tipo === "aceptar" ? "#155724" : "#721c24"};">
      ¿Confirmas que deseas <strong>${tipo === "aceptar" ? "APROBAR" : "RECHAZAR"}</strong> esta solicitud?
    </div>
  </div>`

  const idRol = Number(localStorage.getItem("idRol"))
  const usuarioEsRH_O_Admin = idRol === 2 || idRol === 3

  if (usuarioEsRH_O_Admin) {
    resumen += `
      <div style="background: #e3f2fd; border: 1px solid #bbdefb; border-radius: 8px; padding: 1.25rem; margin-top: 1rem;">
        <label style="display: flex; align-items: center; gap: 12px; cursor: pointer; user-select: none;">
          <input type="checkbox" id="enviar-whatsapp" checked style="width: 18px; height: 18px; accent-color: #25d366; cursor: pointer;">
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 8px; font-weight: 600; color: #1565c0; margin-bottom: 4px;">
              <span style="font-size: 1.2rem;">📱</span>
              <span>Notificar por WhatsApp</span>
            </div>
            <div style="font-size: 0.9rem; color: #1976d2; line-height: 1.4;">
              ${tipo === "rechazar" ? "Se abrirá WhatsApp para que puedas escribir el motivo del rechazo" : "Se enviará una notificación automática de aprobación"}
            </div>
          </div>
        </label>
      </div>
    `
  }

  resumen += `
    <div style="display: flex; gap: 1rem; margin-top: 2rem; justify-content: center;">
      <button onclick="cerrarModal()" style="padding: 0.75rem 1.5rem; background: #6c757d; color: white; border: none; border-radius: 6px; font-weight: 500; cursor: pointer; transition: all 0.2s; min-width: 100px;" onmouseover="this.style.background='#5a6268'" onmouseout="this.style.background='#6c757d'">
        Cancelar
      </button>
      <button onclick="confirmarAccion()" style="padding: 0.75rem 1.5rem; background: ${tipo === "aceptar" ? "#28a745" : "#dc3545"}; color: white; border: none; border-radius: 6px; font-weight: 500; cursor: pointer; transition: all 0.2s; min-width: 100px;" onmouseover="this.style.background='${tipo === "aceptar" ? "#218838" : "#c82333"}'" onmouseout="this.style.background='${tipo === "aceptar" ? "#28a745" : "#dc3545"}'">
        ${tipo === "aceptar" ? "✅ Aprobar" : "❌ Rechazar"}
      </button>
    </div>
  `

  contenido.innerHTML = resumen

  if (!document.getElementById("modal-animations")) {
    const style = document.createElement("style")
    style.id = "modal-animations"
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes modalSlideIn {
        from { opacity: 0; transform: scale(0.9) translateY(-20px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
      }
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
    `
    document.head.appendChild(style)
  }

  accionPendiente = () => {
    const url = tipoSolicitud === "vacacion" ? "/api/actualizarEstadoSolicitud" : "/api/actualizarEstadoPermiso"
    const payload =
      tipoSolicitud === "vacacion"
        ? {
            idVacaciones: datos.id,
            accion: tipo === "aceptar" ? "aceptar" : "rechazar",
            idUsuario: idUsuario,
          }
        : {
            idPermiso: datos.id,
            accion: tipo === "aceptar" ? "aceptar" : "rechazar",
            idUsuario: idUsuario,
          }

    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then(async (result) => {
        if (result && result.ok !== false) {
          const idRol = Number(localStorage.getItem("idRol"))
          const usuarioEsRH_O_Admin = idRol === 2 || idRol === 3

          const enviarWhatsApp = usuarioEsRH_O_Admin && document.getElementById("enviar-whatsapp")?.checked

          if (tipoSolicitud === "vacacion" && tipo === "aceptar" && usuarioEsRH_O_Admin) {
            await generarPDFVacaciones(datos)
          } else if (tipoSolicitud === "permiso" && tipo === "aceptar" && usuarioEsRH_O_Admin) {
            await generarPDFPermiso(datos)
          }

          if (enviarWhatsApp) {
            await notificarPorWhatsApp(tipoSolicitud, datos.id, tipo === "aceptar" ? "aprobado" : "rechazado")
          }

          location.reload()
        } else {
          alert(result.error || "Ocurrió un error.")
        }
      })
      .catch((err) => {
        console.error("Error:", err)
        alert("Error de red.")
      })
  }
}

function cerrarModal() {
  const modal = document.getElementById("modal-confirmacion")
  if (modal) {
    modal.style.animation = "fadeOut 0.2s ease-in"
    setTimeout(() => {
      modal.style.display = "none"
      modal.style.animation = ""
    }, 200)
  }
  accionPendiente = null
}

function confirmarAccion() {
  if (accionPendiente) accionPendiente()
  cerrarModal()
}

// ------------------------ Función para generar PDF de VACACIONES ------------------------
async function generarPDFVacaciones(datos) {
    try {
        const responseUsuario = await fetch(`/api/solicitud/vacacion/${datos.id}/usuario`)
        const dataUsuario = await responseUsuario.json()
        
        if (!responseUsuario.ok || !dataUsuario.idUsuario) {
            console.error("Error al obtener idUsuario:", dataUsuario.error || "Sin respuesta válida")
            var empleadoIdFallback = datos.id
        } else {
            var empleadoId = dataUsuario.idUsuario
        }

        const { jsPDF } = window.jspdf
        const doc = new jsPDF()

        const crearFechaSegura = (fechaString) => {
            if (typeof fechaString === "string" && fechaString.includes("-")) {
                const [año, mes, dia] = fechaString.split("-").map(Number)
                return new Date(año, mes - 1, dia)
            }
            return new Date(fechaString)
        }

        // Configuración de colores y estilos
        const colores = {
            azulPrincipal: [44, 30, 135],
            azulClaro: [66, 100, 255],
            grisTexto: [52, 58, 64],
            grisClaro: [248, 249, 250],
            verdeAprobado: [40, 167, 69],
            blanco: [255, 255, 255],
            grisLineas: [206, 212, 218],
        }

        // Configuración de márgenes y dimensiones
        const margen = 20;
        const anchoPagina = 210;
        const anchoContenido = anchoPagina - (margen * 2);
        let currentY = margen;

        // Fondo del documento
        doc.setFillColor(...colores.blanco);
        doc.rect(0, 0, anchoPagina, 297, "F");

        // Encabezado con gradiente
        doc.setFillColor(...colores.azulPrincipal);
        doc.rect(0, 0, anchoPagina, 50, "F");
        
        // Título
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.text("SOLICITUD DE VACACIONES", anchoPagina / 2, 25, { align: "center" });
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("Departamento de Recursos Humanos", anchoPagina / 2, 35, { align: "center" });

        currentY = 60;

        // Información del empleado
        doc.setFillColor(...colores.grisClaro);
        doc.roundedRect(margen, currentY, anchoContenido, 25, 3, 3, "F");
        doc.setTextColor(...colores.azulPrincipal);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("INFORMACIÓN DEL EMPLEADO", anchoPagina / 2, currentY + 8, { align: "center" });

        currentY += 20;
        doc.setTextColor(...colores.grisTexto);
        doc.setFontSize(11);
        doc.text("Nombre del empleado:", margen + 20, currentY + 8);
        doc.setFont("helvetica", "bold");
        doc.text(datos.nombre.toUpperCase(), margen + 70, currentY + 8);

        currentY += 20;

        // Período de vacaciones
        doc.setFillColor(...colores.grisClaro);
        doc.roundedRect(margen, currentY, anchoContenido, 25, 3, 3, "F");
        doc.setTextColor(...colores.azulPrincipal);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("PERÍODO SOLICITADO", anchoPagina / 2, currentY + 8, { align: "center" });

        currentY += 20;

        // Fechas
        const inicio = crearFechaSegura(datos.inicio).toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
        const fin = crearFechaSegura(datos.fin).toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });

        const fechaActual = new Date().toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });

        // Cajas de fechas
        const anchoCaja = (anchoContenido - 10) / 2;
        
        // Fecha de inicio
        doc.setDrawColor(...colores.azulPrincipal);
        doc.setFillColor(...colores.blanco);
        doc.roundedRect(margen, currentY, anchoCaja, 30, 3, 3, "FD");
        doc.setTextColor(...colores.azulPrincipal);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("FECHA DE INICIO", margen + (anchoCaja / 2), currentY + 8, { align: "center" });
        doc.setTextColor(...colores.grisTexto);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(inicio, margen + (anchoCaja / 2), currentY + 18, { align: "center" });

        // Fecha de fin
        doc.setDrawColor(...colores.azulPrincipal);
        doc.setFillColor(...colores.blanco);
        doc.roundedRect(margen + anchoCaja + 10, currentY, anchoCaja, 30, 3, 3, "FD");
        doc.setTextColor(...colores.azulPrincipal);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("FECHA DE REGRESO", margen + anchoCaja + 10 + (anchoCaja / 2), currentY + 8, { align: "center" });
        doc.setTextColor(...colores.grisTexto);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(fin, margen + anchoCaja + 10 + (anchoCaja / 2), currentY + 18, { align: "center" });

        currentY += 40;

        // Estado de la solicitud
        doc.setFillColor(...colores.verdeAprobado);
        doc.roundedRect(margen, currentY, anchoContenido, 15, 3, 3, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("SOLICITUD APROBADA", anchoPagina / 2, currentY + 10, { align: "center" });

        currentY += 20;
        doc.setTextColor(...colores.grisTexto);
        doc.setFont("helvetica", "italic");
        doc.setFontSize(10);
        doc.text(`Aprobado el: ${fechaActual}`, anchoPagina / 2, currentY, { align: "center" });

        currentY += 15;

        // Declaración
        doc.setDrawColor(...colores.grisLineas);
        doc.setLineWidth(0.5);
        doc.line(margen, currentY, margen + anchoContenido, currentY);
        
        currentY += 10;
        doc.setTextColor(...colores.grisTexto);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("DECLARACIÓN:", margen, currentY);
        
        currentY += 7;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        const declaracion = `Yo, ${datos.nombre.toUpperCase()}, declaro que la información proporcionada es verídica y que solicité estas vacaciones de acuerdo con lo establecido en la Ley Federal del Trabajo vigente.`;
        const lineasDeclaracion = doc.splitTextToSize(declaracion, anchoContenido);
        doc.text(lineasDeclaracion, margen, currentY);
        
        currentY += (lineasDeclaracion.length * 5) + 15;

        // Firmas
        const anchoFirma = (anchoContenido - 20) / 2;
        
        // Firma del empleado
        doc.setDrawColor(...colores.grisLineas);
        doc.setLineWidth(0.5);
        doc.line(margen, currentY, margen + anchoFirma, currentY);
        doc.setTextColor(...colores.grisTexto);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text("Firma y huella del empleado", margen + (anchoFirma / 2), currentY + 5, { align: "center" });
        
        // Firma y sello de RH
        doc.setDrawColor(...colores.grisLineas);
        doc.line(margen + anchoFirma + 20, currentY, margen + anchoFirma + 20 + anchoFirma, currentY);
        doc.text("Firma y sello de Recursos Humanos", margen + anchoFirma + 20 + (anchoFirma / 2), currentY + 5, { align: "center" });

        currentY += 20;

        // Pie de página
        doc.setDrawColor(...colores.grisLineas);
        doc.setLineWidth(0.5);
        doc.line(margen, currentY, margen + anchoContenido, currentY);
        
        currentY += 5;
        doc.setTextColor(...colores.grisTexto);
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8);
        doc.text("Este documento es una autorización oficial para el período de vacaciones solicitado.", anchoPagina / 2, currentY, { align: "center" });
        doc.text("Cualquier modificación debe ser notificada y aprobada por el Departamento de Recursos Humanos.", anchoPagina / 2, currentY + 5, { align: "center" });

        // Generar y guardar el PDF
        const pdfBlob = doc.output("blob");
        const nombreArchivo = `Solicitud_Vacaciones_${datos.nombre.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;

        if (window.showSaveFilePicker) {
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: nombreArchivo,
                    types: [{
                        description: "Archivo PDF",
                        accept: { "application/pdf": [".pdf"] }
                    }],
                });
                const writable = await handle.createWritable();
                await writable.write(pdfBlob);
                await writable.close();
            } catch (err) {
                // Fallback para navegadores que no soportan showSaveFilePicker
                doc.save(nombreArchivo);
            }
        } else {
            doc.save(nombreArchivo);
        }
    } catch (error) {
        console.error("Error al generar PDF de vacaciones:", error);
        alert("Error al generar el PDF. Por favor, intenta nuevamente.");
    }
}

// ------------------------ Función para generar PDF de PERMISOS ------------------------
async function generarPDFPermiso(datos) {
    try {
        const responseUsuario = await fetch(`/api/solicitud/permiso/${datos.id}/usuario`)
        const dataUsuario = await responseUsuario.json()
        
        if (!responseUsuario.ok || !dataUsuario.idUsuario) {
            console.error("Error al obtener idUsuario:", dataUsuario.error || "Sin respuesta válida")
            var empleadoIdFallback = datos.id
        } else {
            var empleadoId = dataUsuario.idUsuario
        }

        const { jsPDF } = window.jspdf
        const doc = new jsPDF()

        const crearFechaSegura = (fechaString) => {
            if (typeof fechaString === "string" && fechaString.includes("-")) {
                const [año, mes, dia] = fechaString.split("-").map(Number)
                return new Date(año, mes - 1, dia)
            }
            return new Date(fechaString)
        }

        // Configuración de colores y estilos
        const colores = {
            azulPrincipal: [44, 30, 135],
            azulClaro: [66, 100, 255],
            grisTexto: [52, 58, 64],
            grisClaro: [248, 249, 250],
            verdeAprobado: [40, 167, 69],
            blanco: [255, 255, 255],
            grisLineas: [206, 212, 218],
        }

        // Configuración de márgenes y dimensiones
        const margen = 20;
        const anchoPagina = 210;
        const anchoContenido = anchoPagina - (margen * 2);
        let currentY = margen;

        // Fondo del documento
        doc.setFillColor(...colores.blanco);
        doc.rect(0, 0, anchoPagina, 297, "F");

        // Encabezado con gradiente
        doc.setFillColor(...colores.azulPrincipal);
        doc.rect(0, 0, anchoPagina, 50, "F");
        
        // Título
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.text("SOLICITUD DE PERMISO", anchoPagina / 2, 25, { align: "center" });
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("Departamento de Recursos Humanos", anchoPagina / 2, 35, { align: "center" });

        currentY = 60;

        // Información del empleado
        doc.setFillColor(...colores.grisClaro);
        doc.roundedRect(margen, currentY, anchoContenido, 25, 3, 3, "F");
        doc.setTextColor(...colores.azulPrincipal);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("INFORMACIÓN DEL EMPLEADO", anchoPagina / 2, currentY + 8, { align: "center" });

        currentY += 20;
        doc.setTextColor(...colores.grisTexto);
        doc.setFontSize(11);
        doc.text("Nombre del empleado:", margen + 5, currentY + 8);
        doc.setFont("helvetica", "bold");
        doc.text(datos.nombre.toUpperCase(), margen + 50, currentY + 8);

        currentY += 20;

        // Detalles del permiso
        doc.setFillColor(...colores.grisClaro);
        doc.roundedRect(margen, currentY, anchoContenido, 25, 3, 3, "F");
        doc.setTextColor(...colores.azulPrincipal);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("DETALLES DEL PERMISO", anchoPagina / 2, currentY + 8, { align: "center" });

        currentY += 20;

        // Fecha del permiso
        const fechaPermiso = crearFechaSegura(datos.fecha).toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
        
        doc.setTextColor(...colores.grisTexto);
        doc.setFontSize(11);
        doc.text("Fecha:", margen + 5, currentY + 8);
        doc.setFont("helvetica", "bold");
        doc.text(fechaPermiso, margen + 20, currentY + 8);

        // Horario
        doc.setFont("helvetica", "normal");
        doc.text("Horario:", margen + 100, currentY + 8);
        doc.setFont("helvetica", "bold");
        doc.text(`${datos.inicio} - ${datos.fin}`, margen + 120, currentY + 8);

        currentY += 15;

        // Motivo
        doc.setFont("helvetica", "normal");
        doc.text("Motivo:", margen + 5, currentY + 8);
        const motivoLineas = doc.splitTextToSize(datos.razon, anchoContenido - 30);
        doc.setFont("helvetica", "bold");
        doc.text(motivoLineas, margen + 20, currentY + 8);
        currentY += (motivoLineas.length * 5) + 10;

        // Compensación
        doc.setFont("helvetica", "normal");
        doc.text("Compensación:", margen + 5, currentY + 8);
        const compensacionLineas = doc.splitTextToSize(datos.compensacion, anchoContenido - 30);
        doc.setFont("helvetica", "bold");
        doc.text(compensacionLineas, margen + 35, currentY + 8);
        currentY += (compensacionLineas.length * 5) + 20;

        // Estado de la solicitud
        const fechaActual = new Date().toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });

        doc.setFillColor(...colores.verdeAprobado);
        doc.roundedRect(margen, currentY, anchoContenido, 15, 3, 3, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("SOLICITUD APROBADA", anchoPagina / 2, currentY + 10, { align: "center" });

        currentY += 20;
        doc.setTextColor(...colores.grisTexto);
        doc.setFont("helvetica", "italic");
        doc.setFontSize(10);
        doc.text(`Aprobado el: ${fechaActual}`, anchoPagina / 2, currentY, { align: "center" });

        currentY += 15;

        // Declaración
        doc.setDrawColor(...colores.grisLineas);
        doc.setLineWidth(0.5);
        doc.line(margen, currentY, margen + anchoContenido, currentY);
        
        currentY += 10;
        doc.setTextColor(...colores.grisTexto);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("DECLARACIÓN:", margen, currentY);
        
        currentY += 7;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        const declaracion = `Yo, ${datos.nombre.toUpperCase()}, declaro que la información proporcionada es verídica y que solicité este permiso de acuerdo con lo establecido en la Ley Federal del Trabajo vigente.`;
        const lineasDeclaracion = doc.splitTextToSize(declaracion, anchoContenido);
        doc.text(lineasDeclaracion, margen, currentY);
        
        currentY += (lineasDeclaracion.length * 5) + 15;

        // Firmas
        const anchoFirma = (anchoContenido - 20) / 2;
        
        // Firma del empleado
        doc.setDrawColor(...colores.grisLineas);
        doc.setLineWidth(0.5);
        doc.line(margen, currentY, margen + anchoFirma, currentY);
        doc.setTextColor(...colores.grisTexto);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text("Firma y huella del empleado", margen + (anchoFirma / 2), currentY + 5, { align: "center" });
        
        // Firma y sello de RH
        doc.setDrawColor(...colores.grisLineas);
        doc.line(margen + anchoFirma + 20, currentY, margen + anchoFirma + 20 + anchoFirma, currentY);
        doc.text("Firma y sello de Recursos Humanos", margen + anchoFirma + 20 + (anchoFirma / 2), currentY + 5, { align: "center" });

        currentY += 20;

        // Pie de página
        doc.setDrawColor(...colores.grisLineas);
        doc.setLineWidth(0.5);
        doc.line(margen, currentY, margen + anchoContenido, currentY);
        
        currentY += 5;
        doc.setTextColor(...colores.grisTexto);
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8);
        doc.text("Este documento es una autorización oficial para el permiso solicitado.", anchoPagina / 2, currentY, { align: "center" });
        doc.text("Cualquier modificación debe ser notificada y aprobada por el Departamento de Recursos Humanos.", anchoPagina / 2, currentY + 5, { align: "center" });

        // Generar y guardar el PDF
        const pdfBlob = doc.output("blob");
        const nombreArchivo = `Solicitud_Permiso_${datos.nombre.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;

        if (window.showSaveFilePicker) {
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: nombreArchivo,
                    types: [{
                        description: "Archivo PDF",
                        accept: { "application/pdf": [".pdf"] }
                    }],
                });
                const writable = await handle.createWritable();
                await writable.write(pdfBlob);
                await writable.close();
            } catch (err) {
                // Fallback para navegadores que no soportan showSaveFilePicker
                doc.save(nombreArchivo);
            }
        } else {
            doc.save(nombreArchivo);
        }
    } catch (error) {
        console.error("Error al generar PDF de permiso:", error);
        alert("Error al generar el PDF. Por favor, intenta nuevamente.");
    }
}

async function notificarPorWhatsApp(tipoSolicitud, idSolicitud, estado) {
  try {
    const res = await fetch(`/api/solicitud/${tipoSolicitud}/${idSolicitud}/usuario`)
    const usuario = await res.json()

    if (!usuario.telefono) {
      console.error("Empleado sin teléfono")
      alert("El empleado no tiene número de teléfono registrado.")
      return
    }

    let mensaje
    if (estado === "rechazado") {
      mensaje = `Hola ${usuario.nombre}, lo sentimos. Tu solicitud de ${tipoSolicitud} ha sido *rechazada*. Por favor, escribe aquí el motivo del rechazo...`
    } else {
      mensaje = `Hola ${usuario.nombre}, tu solicitud de ${tipoSolicitud} ha sido *aprobada*. Acercate a Recursos Humanos a firmar tu constancia por favor.`
    }

    const url = `https://wa.me/${usuario.telefono}?text=${encodeURIComponent(mensaje)}`
    window.open(url, "_blank")
  } catch (err) {
    console.error("Error notificando por WhatsApp:", err)
    alert("Error al abrir WhatsApp. Verifica que el empleado tenga teléfono registrado.")
  }
}

function formatearFechaConsistente(fechaString) {
  if (typeof fechaString === "string" && fechaString.includes("-")) {
    const [año, mes, dia] = fechaString.split("T")[0].split("-").map(Number)
    const fecha = new Date(año, mes - 1, dia)
    return fecha.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }
  return fechaString
}
