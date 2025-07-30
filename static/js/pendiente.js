function formatearFechaHumana(fechaStr) {
  if (!fechaStr) return "Fecha no disponible";

  const opciones = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  const fecha = new Date(fechaStr + "T00:00:00");
  return fecha.toLocaleDateString("es-MX", opciones);
}

document.addEventListener("DOMContentLoaded", async () => {
  const idUsuario = localStorage.getItem("idUsuario");
  if (!idUsuario) {
    alert("No se ha iniciado sesión.");
    window.location.href = "login.html";
    return;
  }

  const contPendientes = document.getElementById("pendientes");
  const contAceptadas = document.getElementById("aceptadas");
  const contRechazadas = document.getElementById("rechazadas");

  try {
    const response = await fetch(`/api/usuario/solicitudes/${idUsuario}`);
    const data = await response.json();
    const { vacaciones, permisos } = data;

    const renderCard = (tipo, datos, estadoTexto, contenedor) => {
      const card = document.createElement("div");
      const estadoLower = estadoTexto.toLowerCase();
      card.classList.add("card");

      if (estadoLower.includes("pendiente")) card.classList.add("pendiente");
      else if (estadoLower.includes("aceptado")) card.classList.add("aceptado");
      else if (estadoLower.includes("rechazado"))
        card.classList.add("rechazado");

      let html = `<p><strong>Tipo:</strong> ${tipo}</p>`;
      html += `<p><strong>Estado:</strong> ${estadoTexto}</p>`;

      if (tipo === "Vacaciones") {
        html += `
                    <p><strong>Días solicitados:</strong> ${
                      datos.diasSolicitados
                    }</p>
                    <p><strong>Fecha de salida:</strong> ${formatearFechaHumana(
                      datos.fechaSalida
                    )}</p>
                    <p><strong>Fecha de regreso:</strong> ${formatearFechaHumana(
                      datos.fechaRegreso
                    )}</p>
                `;
      } else {
        html += `
                    <p><strong>Día solicitado:</strong> ${formatearFechaHumana(
                      datos.diaSolicitado
                    )}</p>
                    <p><strong>Hora inicio:</strong> ${datos.horaInicio}</p>
                    <p><strong>Hora fin:</strong> ${datos.horaFin}</p>
                    <p><strong>Razón:</strong> ${datos.razon}</p>
                    <p><strong>Compensación:</strong> ${
                      datos.tipoCompensacion
                    }</p>
                `;
      }

      card.innerHTML = html;
      contenedor.appendChild(card);
    };

    const clasificarContenedor = (estado) => {
      if (!estado) return null;
      const texto = estado.toLowerCase();
      if (texto.includes("pendiente")) return contPendientes;
      if (texto.includes("aceptado")) return contAceptadas;
      if (texto.includes("rechazado")) return contRechazadas;
      return null;
    };

    vacaciones.forEach((v) => {
      const cont = clasificarContenedor(v.estadoSolicitud);
      if (cont) renderCard("Vacaciones", v, v.estadoSolicitud, cont);
    });

    permisos.forEach((p) => {
      const cont = clasificarContenedor(p.estadoSolicitud);
      if (cont) renderCard("Permiso", p, p.estadoSolicitud, cont);
    });
  } catch (error) {
    console.error("Error cargando solicitudes:", error);
    contPendientes.innerHTML =
      "<p style='color:red;'>Error al cargar solicitudes.</p>";
  }
});
