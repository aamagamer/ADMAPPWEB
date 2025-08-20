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
    // Opcionalmente, redirigir al login o mostrar un mensaje
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

    const colores = {
      azulPrincipal: [44, 30, 135], // Azul profesional
      grisTexto: [52, 58, 64], // Gris oscuro para texto
      grisClaro: [248, 249, 250], // Gris muy claro
      verdeAprobado: [40, 167, 69], // Verde limpio
      blancoCrema: [250, 250, 250], // Blanco puro
      grisLineas: [206, 212, 218], // Gris para líneas
    }

    const titulo = "SOLICITUD DE VACACIONES"
    const estado = "APROBADA"
    const nombre = datos.nombre

    const inicio = crearFechaSegura(datos.inicio).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
    const fin = crearFechaSegura(datos.fin).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
    const fechaActual = new Date().toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })

    doc.setFillColor(...colores.blancoCrema)
    doc.rect(0, 0, 210, 297, "F")

    doc.setFillColor(...colores.azulPrincipal)
    doc.rect(0, 0, 210, 40, "F")

    doc.setFillColor(...colores.grisLineas)
    doc.rect(0, 40, 210, 1, "F")

    doc.setTextColor(255, 255, 255)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(22)
    doc.text(titulo, 105, 20, { align: "center" })

    doc.setFontSize(11)
    doc.setFont("helvetica", "normal")
    doc.text("Departamento de Recursos Humanos", 105, 30, { align: "center" })

    const marcoY = 55
    doc.setDrawColor(...colores.grisLineas)
    doc.setLineWidth(1.5)
    doc.roundedRect(20, marcoY, 170, 130, 2, 2, "S")

    doc.setFillColor(...colores.grisClaro)
    doc.roundedRect(20, marcoY, 170, 25, 2, 2, "F")
    doc.rect(20, marcoY + 22, 170, 3, "F")
    doc.setTextColor(...colores.azulPrincipal)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(14)
    doc.text("INFORMACIÓN DEL EMPLEADO", 105, marcoY + 15, { align: "center" })

    let currentY = marcoY + 40
    doc.setTextColor(...colores.grisTexto)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.text("EMPLEADO:", 30, currentY)
    doc.setFillColor(...colores.blancoCrema)
    doc.setDrawColor(...colores.grisLineas)
    doc.setLineWidth(1)
    doc.roundedRect(30, currentY + 5, 150, 16, 2, 2, "FD")
    doc.setTextColor(...colores.grisTexto)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(12)
    doc.text(nombre.toUpperCase(), 35, currentY + 15)

    currentY += 30 // Mover hacia abajo para la siguiente sección
    doc.setDrawColor(...colores.grisLineas)
    doc.setLineWidth(0.5)
    doc.line(30, currentY, 180, currentY) // Separador

    currentY += 15
    doc.setTextColor(...colores.grisTexto)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.text("PERÍODO DE VACACIONES:", 30, currentY)

    const cajaAltura = 28
    const cajaY = currentY + 8
    doc.setFillColor(...colores.grisClaro)
    doc.setDrawColor(...colores.grisLineas)
    doc.setLineWidth(1)
    doc.roundedRect(30, cajaY, 65, cajaAltura, 2, 2, "FD")
    doc.setFillColor(255, 255, 255)
    doc.roundedRect(30, cajaY, 65, 10, 2, 2, "F")
    doc.rect(30, cajaY + 8, 65, 2, "F")
    doc.setTextColor(...colores.azulPrincipal)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.text("FECHA DE INICIO", 62.5, cajaY + 7, { align: "center" })
    doc.setTextColor(...colores.grisTexto)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.text(inicio, 62.5, cajaY + 20, { align: "center" })

    doc.setFillColor(...colores.grisClaro)
    doc.setDrawColor(...colores.grisLineas)
    doc.setLineWidth(1)
    doc.roundedRect(115, cajaY, 65, cajaAltura, 2, 2, "FD")
    doc.setFillColor(255, 255, 255)
    doc.roundedRect(115, cajaY, 65, 10, 2, 2, "F")
    doc.rect(115, cajaY + 8, 65, 2, "F")
    doc.setTextColor(...colores.azulPrincipal)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.text("FECHA DE REGRESO", 147.5, cajaY + 7, { align: "center" })
    doc.setTextColor(...colores.grisTexto)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.text(fin, 147.5, cajaY + 20, { align: "center" })

    const estadoY = 200
    doc.setFillColor(...colores.verdeAprobado)
    doc.roundedRect(75, estadoY, 60, 16, 3, 3, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.text(estado, 105, estadoY + 10, { align: "center" })

    doc.setTextColor(...colores.grisTexto)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.text(`Aprobado el ${fechaActual}`, 105, estadoY + 25, { align: "center" })

    const observacionesY = 240
    doc.setDrawColor(...colores.grisLineas)
    doc.setLineWidth(1)
    doc.roundedRect(20, observacionesY, 170, 30, 2, 2, "S")
    doc.setFillColor(...colores.grisClaro)
    doc.roundedRect(20, observacionesY, 170, 12, 2, 2, "F")
    doc.rect(20, observacionesY + 10, 170, 2, "F")
    doc.setTextColor(...colores.azulPrincipal)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.text("OBSERVACIONES", 105, observacionesY + 8, { align: "center" })
    doc.setTextColor(...colores.grisTexto)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.text("Solicitud procesada y aprobada según políticas de la empresa.", 30, observacionesY + 22)

    doc.setDrawColor(...colores.grisLineas)
    doc.setLineWidth(0.5)
    doc.line(20, 280, 190, 280)
    doc.setTextColor(...colores.grisTexto)
    doc.setFont("helvetica", "italic")
    doc.setFontSize(8)
    doc.text("Este documento constituye la autorización oficial para el período de vacaciones solicitado.", 105, 285, {
      align: "center",
    })

    const pdfBlob = doc.output("blob")
    const nombreArchivo = `Solicitud_Vacaciones_${nombre.replace(/\s+/g, "_")}_ID${empleadoId || empleadoIdFallback}_${new Date().toISOString().split("T")[0]}.pdf`

    if (window.showSaveFilePicker) {
      const handle = await window.showSaveFilePicker({
        suggestedName: nombreArchivo,
        types: [{ description: "Archivo PDF", accept: { "application/pdf": [".pdf"] } }],
      })
      const writable = await handle.createWritable()
      await writable.write(pdfBlob)
      await writable.close()
    } else {
      doc.save(nombreArchivo)
    }
  } catch (error) {
    console.error("Error al generar PDF de vacaciones:", error)
    alert("Error al generar el PDF. Por favor, intenta nuevamente.")
  }
}

// ------------------------ NUEVA Función para generar PDF de PERMISOS ------------------------
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

    const colores = {
      azulPrincipal: [44, 30, 135],
      grisTexto: [52, 58, 64],
      grisClaro: [248, 249, 250],
      verdeAprobado: [40, 167, 69],
      blancoCrema: [250, 250, 250],
      grisLineas: [206, 212, 218],
    }

    const titulo = "SOLICITUD DE PERMISO"
    const estado = "APROBADA"
    const nombre = datos.nombre
    const fechaPermiso = crearFechaSegura(datos.fecha).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
    const horarioInicio = datos.inicio
    const horarioFin = datos.fin
    const razon = datos.razon
    const compensacion = datos.compensacion
    const fechaActual = new Date().toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })

    doc.setFillColor(...colores.blancoCrema)
    doc.rect(0, 0, 210, 297, "F")

    doc.setFillColor(...colores.azulPrincipal)
    doc.rect(0, 0, 210, 40, "F")

    doc.setFillColor(...colores.grisLineas)
    doc.rect(0, 40, 210, 1, "F")

    doc.setTextColor(255, 255, 255)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(22)
    doc.text(titulo, 105, 20, { align: "center" })

    doc.setFontSize(11)
    doc.setFont("helvetica", "normal")
    doc.text("Departamento de Recursos Humanos", 105, 30, { align: "center" })

    const marcoY = 55
    doc.setDrawColor(...colores.grisLineas)
    doc.setLineWidth(1.5)
    doc.roundedRect(20, marcoY, 170, 160, 2, 2, "S")

    doc.setFillColor(...colores.grisClaro)
    doc.roundedRect(20, marcoY, 170, 25, 2, 2, "F")
    doc.rect(20, marcoY + 22, 170, 3, "F")
    doc.setTextColor(...colores.azulPrincipal)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(14)
    doc.text("INFORMACIÓN DEL EMPLEADO Y PERMISO", 105, marcoY + 15, { align: "center" })

    let currentY = marcoY + 40
    doc.setTextColor(...colores.grisTexto)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.text("EMPLEADO:", 30, currentY)
    doc.setFillColor(...colores.blancoCrema)
    doc.setDrawColor(...colores.grisLineas)
    doc.setLineWidth(1)
    doc.roundedRect(30, currentY + 5, 150, 16, 2, 2, "FD")
    doc.setTextColor(...colores.grisTexto)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(12)
    doc.text(nombre.toUpperCase(), 35, currentY + 15)

    currentY += 30 // Mover hacia abajo para la siguiente sección
    doc.setDrawColor(...colores.grisLineas)
    doc.setLineWidth(0.5)
    doc.line(30, currentY, 180, currentY) // Separador

    currentY += 15
    doc.setTextColor(...colores.grisTexto)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.text("DETALLES DEL PERMISO:", 30, currentY)

    currentY += 8
    doc.setTextColor(...colores.grisTexto)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.text("Fecha:", 30, currentY)
    doc.setFont("helvetica", "normal")
    doc.text(fechaPermiso, 70, currentY)

    currentY += 10
    doc.setFont("helvetica", "bold")
    doc.text("Horario:", 30, currentY)
    doc.setFont("helvetica", "normal")
    doc.text(`${horarioInicio} - ${horarioFin}`, 70, currentY)

    currentY += 10
    doc.setFont("helvetica", "bold")
    doc.text("Motivo:", 30, currentY)
    doc.setFont("helvetica", "normal")
    doc.text(razon, 70, currentY)

    currentY += 10
    doc.setFont("helvetica", "bold")
    doc.text("Compensación:", 30, currentY)
    doc.setFont("helvetica", "normal")
    doc.text(compensacion, 70, currentY)

    const estadoY = marcoY + 130
    doc.setFillColor(...colores.verdeAprobado)
    doc.roundedRect(75, estadoY, 60, 16, 3, 3, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.text(estado, 105, estadoY + 10, { align: "center" })

    doc.setTextColor(...colores.grisTexto)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.text(`Aprobado el ${fechaActual}`, 105, estadoY + 25, { align: "center" })

    const observacionesY = 240
    doc.setDrawColor(...colores.grisLineas)
    doc.setLineWidth(1)
    doc.roundedRect(20, observacionesY, 170, 30, 2, 2, "S")
    doc.setFillColor(...colores.grisClaro)
    doc.roundedRect(20, observacionesY, 170, 12, 2, 2, "F")
    doc.rect(20, observacionesY + 10, 170, 2, "F")
    doc.setTextColor(...colores.azulPrincipal)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.text("OBSERVACIONES", 105, observacionesY + 8, { align: "center" })
    doc.setTextColor(...colores.grisTexto)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.text("Solicitud procesada y aprobada según políticas de la empresa.", 30, observacionesY + 22)

    doc.setDrawColor(...colores.grisLineas)
    doc.setLineWidth(0.5)
    doc.line(20, 280, 190, 280)
    doc.setTextColor(...colores.grisTexto)
    doc.setFont("helvetica", "italic")
    doc.setFontSize(8)
    doc.text("Este documento constituye la autorización oficial para el período de permiso solicitado.", 105, 285, {
      align: "center",
    })

    const pdfBlob = doc.output("blob")
    const nombreArchivo = `Solicitud_Permiso_${nombre.replace(/\s+/g, "_")}_ID${empleadoId || empleadoIdFallback}_${new Date().toISOString().split("T")[0]}.pdf`

    if (window.showSaveFilePicker) {
      const handle = await window.showSaveFilePicker({
        suggestedName: nombreArchivo,
        types: [{ description: "Archivo PDF", accept: { "application/pdf": [".pdf"] } }],
      })
      const writable = await handle.createWritable()
      await writable.write(pdfBlob)
      await writable.close()
    } else {
      doc.save(nombreArchivo)
    }
  } catch (error) {
    console.error("Error al generar PDF de permiso:", error)
    alert("Error al generar el PDF. Por favor, intenta nuevamente.")
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
