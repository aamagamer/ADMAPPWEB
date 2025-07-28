const idUsuario = localStorage.getItem("idUsuario");

fetch(`/api/usuario/${idUsuario}/rol`)
  .then(res => res.json())
  .then(data => {
    if (data.idRol !== undefined) {
      localStorage.setItem("idRol", data.idRol);
    } else {
      console.error("No se pudo obtener el rol del usuario:", data.error);
    }
  })
  .catch(err => {
    console.error("Error al obtener el rol del usuario:", err);
  });

let accionPendiente = null;

function mostrarModal(tipo, datos, tipoSolicitud) {
  const modal = document.getElementById("modal-confirmacion");
  const contenido = document.getElementById("modal-contenido");

  let resumen = `<strong>${datos.nombre}</strong><br/>`;

  if (tipoSolicitud === "vacacion") {
    resumen += `
      Del <strong>${new Date(datos.inicio).toLocaleDateString()}</strong> 
      al <strong>${new Date(datos.fin).toLocaleDateString()}</strong><br/>
    `;
  } else if (tipoSolicitud === "permiso") {
    resumen += `
      Fecha: ${new Date(datos.fecha).toLocaleDateString()}<br/>
      Horario: ${datos.inicio} - ${datos.fin}<br/>
      Motivo: <em>${datos.razon}</em><br/>
      Compensación: ${datos.compensacion}<br/>
    `;
  }

  resumen += `<hr>¿Deseas <strong>${
    tipo === "aceptar" ? "aceptar" : "rechazar"
  }</strong> esta solicitud?`;

  contenido.innerHTML = resumen;
  modal.style.display = "flex";

  accionPendiente = () => {
    const url =
      tipoSolicitud === "vacacion"
        ? "/api/actualizarEstadoSolicitud"
        : "/api/actualizarEstadoPermiso";

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
          };

    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then(async (result) => {
        if (result && result.ok !== false) {
         const idRol = Number(localStorage.getItem("idRol"));
         const usuarioEsRH_O_Admin = idRol === 2 || idRol === 3;
          if (
            tipoSolicitud === "vacacion" &&
            tipo === "aceptar" &&
            usuarioEsRH_O_Admin
          ) {
            await generarPDFVacaciones(datos);
          }

          location.reload();
        } else {
          alert(result.error || "Ocurrió un error.");
        }
      })
      .catch((err) => {
        console.error("Error:", err);
        alert("Error de red.");
      });
  };
}

function cerrarModal() {
  document.getElementById("modal-confirmacion").style.display = "none";
  accionPendiente = null;
}

function confirmarAccion() {
  if (accionPendiente) accionPendiente();
  cerrarModal();
}

// ------------------------ Cargar VACACIONES ------------------------

fetch(`/api/usuario/${idUsuario}/area`)
  .then((res) => res.json())
  .then((areas) => {
    const ids = areas.map((a) => a.idArea).join(",");
    return fetch(`/api/vacaciones/area/${ids}?idUsuario=${idUsuario}`);
  })
  .then((res) => res.json())
  .then((data) => {
    const box = document.getElementById("vacaciones-box");

    if (!Array.isArray(data)) {
      box.innerHTML = "Error al obtener las solicitudes.";
      console.error("Respuesta inesperada:", data);
      return;
    }

    if (data.length === 0) {
      box.innerHTML = "No hay solicitudes de vacaciones.";
      return;
    }

    box.innerHTML = "";
    data.forEach((vacacion) => {
      const card = document.createElement("div");
      card.classList.add("vacacion-card");

      const info = document.createElement("div");
      info.classList.add("vacacion-info");
      info.innerHTML = `
  <strong>${vacacion.nombre}</strong><br/>
  Del <strong>${vacacion.inicio
    .split("T")[0]
    .split("-")
    .reverse()
    .join("/")}</strong> 
  al <strong>${vacacion.fin
    .split("T")[0]
    .split("-")
    .reverse()
    .join("/")}</strong><br/>
`;

      const btnGroup = document.createElement("div");
      btnGroup.classList.add("btn-group");

      const btnAceptar = document.createElement("button");
      btnAceptar.classList.add("btn-aceptar");
      btnAceptar.title = "Aceptar";
      btnAceptar.innerHTML = "✔️";
      btnAceptar.onclick = () => mostrarModal("aceptar", vacacion, "vacacion");

      const btnRechazar = document.createElement("button");
      btnRechazar.classList.add("btn-rechazar");
      btnRechazar.title = "Rechazar";
      btnRechazar.innerHTML = "❌";
      btnRechazar.onclick = () =>
        mostrarModal("rechazar", vacacion, "vacacion");

      btnGroup.appendChild(btnAceptar);
      btnGroup.appendChild(btnRechazar);

      card.appendChild(info);
      card.appendChild(btnGroup);

      box.appendChild(card);
    });
  })
  .catch((error) => {
    document.getElementById("vacaciones-box").innerHTML =
      "Error al cargar datos.";
    console.error("Error:", error);
  });

//-----------------------Generar PDF------------------------------

async function generarPDFVacaciones(datos) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Configuración de colores elegantes y formales
  const colores = {
    azulPrincipal: [44,30,135], // Azul profesional
    grisTexto: [52, 58, 64], // Gris oscuro para texto
    grisClaro: [248, 249, 250], // Gris muy claro
    verdeAprobado: [40, 167, 69], // Verde limpio
    blancoCrema: [250,250,250], // Blanco puro
    grisLineas: [206, 212, 218], // Gris para líneas
  };

  const titulo = "SOLICITUD DE VACACIONES";
  const estado = "APROBADA";
  const nombre = datos.nombre;
  const inicio = new Date(datos.inicio).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long", 
    year: "numeric"
  });
  const fin = new Date(datos.fin).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
  const fechaActual = new Date().toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });

  // Fondo principal
  doc.setFillColor(...colores.blancoCrema);
  doc.rect(0, 0, 210, 297, "F");

  // Header principal elegante
  doc.setFillColor(...colores.azulPrincipal);
  doc.rect(0, 0, 210, 40, "F");

  // Línea de acento sutil
  doc.setFillColor(...colores.grisLineas);
  doc.rect(0, 40, 210, 1, "F");

  // Título principal
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(titulo, 105, 20, { align: "center" });

  // Subtítulo
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Departamento de Recursos Humanos", 105, 30, { align: "center" });

  // Marco principal de información
  const marcoY = 55;

  doc.setDrawColor(...colores.grisLineas);
  doc.setLineWidth(1.5);
  doc.roundedRect(20, marcoY, 170, 130, 2, 2, "S");

  // Header de la sección principal
  doc.setFillColor(...colores.grisClaro);
  doc.roundedRect(20, marcoY, 170, 25, 2, 2, "F");
  doc.rect(20, marcoY + 22, 170, 3, "F");

  doc.setTextColor(...colores.azulPrincipal);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("INFORMACIÓN DEL EMPLEADO", 105, marcoY + 15, { align: "center" });

  // Información del empleado
  const datosY = marcoY + 40;

  // Nombre del empleado
  doc.setTextColor(...colores.grisTexto);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("EMPLEADO:", 30, datosY);

  // Caja elegante para el nombre
  doc.setFillColor(...colores.blancoCrema);
  doc.setDrawColor(...colores.grisLineas);
  doc.setLineWidth(1);
  doc.roundedRect(30, datosY + 5, 150, 16, 2, 2, "FD");

  doc.setTextColor(...colores.grisTexto);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(nombre.toUpperCase(), 35, datosY + 15);

  // Línea separadora elegante
  doc.setDrawColor(...colores.grisLineas);
  doc.setLineWidth(0.5);
  doc.line(30, datosY + 30, 180, datosY + 30);

  // Período de vacaciones
  const periodoY = datosY + 45;

  doc.setTextColor(...colores.grisTexto);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("PERÍODO DE VACACIONES:", 30, periodoY);

  // Cajas para las fechas
  const cajaAltura = 28;
  const cajaY = periodoY + 8;

  // Caja fecha inicio
  doc.setFillColor(...colores.grisClaro);
  doc.setDrawColor(...colores.grisLineas);
  doc.setLineWidth(1);
  doc.roundedRect(30, cajaY, 65, cajaAltura, 2, 2, "FD");

  // Header de fecha inicio
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(30, cajaY, 65, 10, 2, 2, "F");
  doc.rect(30, cajaY + 8, 65, 2, "F");

  doc.setTextColor(...colores.azulPrincipal);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("FECHA DE INICIO", 62.5, cajaY + 7, { align: "center" });

  doc.setTextColor(...colores.grisTexto);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(inicio, 62.5, cajaY + 20, { align: "center" });

  // Caja fecha fin
  doc.setFillColor(...colores.grisClaro);
  doc.setDrawColor(...colores.grisLineas);
  doc.setLineWidth(1);
  doc.roundedRect(115, cajaY, 65, cajaAltura, 2, 2, "FD");

  // Header de fecha fin
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(115, cajaY, 65, 10, 2, 2, "F");
  doc.rect(115, cajaY + 8, 65, 2, "F");

  doc.setTextColor(...colores.azulPrincipal);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("FECHA DE REGRESO", 147.5, cajaY + 7, { align: "center" });

  doc.setTextColor(...colores.grisTexto);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(fin, 147.5, cajaY + 20, { align: "center" });

  // Estado de aprobación (nueva posición)
  const estadoY = 200;

  // Caja del estado
  doc.setFillColor(...colores.verdeAprobado);
  doc.roundedRect(75, estadoY, 60, 16, 3, 3, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(estado, 105, estadoY + 10, { align: "center" });

  // Fecha de aprobación
  doc.setTextColor(...colores.grisTexto);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Aprobado el ${fechaActual}`, 105, estadoY + 25, { align: "center" });

  // Sección de observaciones
  const observacionesY = 240;

  doc.setDrawColor(...colores.grisLineas);
  doc.setLineWidth(1);
  doc.roundedRect(20, observacionesY, 170, 30, 2, 2, "S");

  // Header de observaciones
  doc.setFillColor(...colores.grisClaro);
  doc.roundedRect(20, observacionesY, 170, 12, 2, 2, "F");
  doc.rect(20, observacionesY + 10, 170, 2, "F");

  doc.setTextColor(...colores.azulPrincipal);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("OBSERVACIONES", 105, observacionesY + 8, { align: "center" });

  doc.setTextColor(...colores.grisTexto);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Solicitud procesada y aprobada según políticas de la empresa.", 30, observacionesY + 22);

  // Footer simple y elegante
  doc.setDrawColor(...colores.grisLineas);
  doc.setLineWidth(0.5);
  doc.line(20, 280, 190, 280);

  doc.setTextColor(...colores.grisTexto);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.text("Este documento constituye la autorización oficial para el período de vacaciones solicitado.", 105, 285, { align: "center" });

  // Guardar
  const pdfBlob = doc.output("blob");
  const nombreArchivo = `Solicitud_Vacaciones_${nombre.replace(/\s+/g, "_")}_${new Date().toISOString().split('T')[0]}.pdf`;

  if (window.showSaveFilePicker) {
    const handle = await window.showSaveFilePicker({
      suggestedName: nombreArchivo,
      types: [{ description: "Archivo PDF", accept: { "application/pdf": [".pdf"] } }],
    });
    const writable = await handle.createWritable();
    await writable.write(pdfBlob);
    await writable.close();
  } else {
    doc.save(nombreArchivo);
  }
}

// ------------------------ Cargar PERMISOS ------------------------

fetch(`/api/usuario/${idUsuario}/area`)
  .then((res) => res.json())
  .then((areas) => {
    const ids = areas.map((a) => a.idArea).join(",");
    return fetch(`/api/permisos/area/${ids}?idUsuario=${idUsuario}`);
  })
  .then((res) => res.json())
  .then((permisos) => {
    const box = document.getElementById("permisos-box");

    if (!Array.isArray(permisos)) {
      box.innerHTML = "Error al obtener los permisos.";
      console.error("Respuesta inesperada:", permisos);
      return;
    }

    if (permisos.length === 0) {
      box.innerHTML = "No hay solicitudes de permisos.";
      return;
    }

    box.innerHTML = "";
    permisos.forEach((permiso) => {
      const card = document.createElement("div");
      card.classList.add("vacacion-card");

      const info = document.createElement("div");
      info.classList.add("vacacion-info");
      info.innerHTML = `
        <strong>${permiso.nombre}</strong><br/>
        ${permiso.fecha.split("T")[0].split("-").reverse().join("/")}<br/>
        ${permiso.inicio} - ${permiso.fin}<br/>
        <em>${permiso.razon}</em><br/>
        <small>${permiso.compensacion}</small>
      `;

      const btnGroup = document.createElement("div");
      btnGroup.classList.add("btn-group");

      const btnAceptar = document.createElement("button");
      btnAceptar.classList.add("btn-aceptar");
      btnAceptar.title = "Aceptar";
      btnAceptar.innerHTML = "✔️";
      btnAceptar.onclick = () => mostrarModal("aceptar", permiso, "permiso");

      const btnRechazar = document.createElement("button");
      btnRechazar.classList.add("btn-rechazar");
      btnRechazar.title = "Rechazar";
      btnRechazar.innerHTML = "❌";
      btnRechazar.onclick = () => mostrarModal("rechazar", permiso, "permiso");

      btnGroup.appendChild(btnAceptar);
      btnGroup.appendChild(btnRechazar);

      card.appendChild(info);
      card.appendChild(btnGroup);
      box.appendChild(card);
    });
  })
  .catch((error) => {
    document.getElementById("permisos-box").innerHTML =
      "Error al cargar permisos.";
    console.error("Error:", error);
  });
