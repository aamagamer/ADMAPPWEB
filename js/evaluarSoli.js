const idUsuario = localStorage.getItem("idUsuario");

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
          const usuarioEsRH_O_Admin = idUsuario === "2" || idUsuario === "3";

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

  const titulo = "Solicitud de Vacaciones";
  const estado = "Aceptada";
  const nombre = datos.nombre;
  const inicio = new Date(datos.inicio).toLocaleDateString();
  const fin = new Date(datos.fin).toLocaleDateString();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(`${titulo}: ${estado}`, 20, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(`Empleado: ${nombre}`, 20, 35);
  doc.text(`Días de salida y regreso:`, 20, 45);
  doc.text(`Del ${inicio} al ${fin}`, 20, 55);

  const pdfBlob = doc.output("blob");
  const nombreArchivo = `Vacaciones_${nombre.replace(/\s+/g, "_")}.pdf`;

  if (window.showSaveFilePicker) {
    const handle = await window.showSaveFilePicker({
      suggestedName: nombreArchivo,
      types: [
        {
          description: "Archivo PDF",
          accept: { "application/pdf": [".pdf"] },
        },
      ],
    });
    const writable = await handle.createWritable();
    await writable.write(pdfBlob);
    await writable.close();
  } else {
    // fallback por si no es compatible
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
