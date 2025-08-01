function estaActiva(fechaInicio, fechaFin) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const inicio = new Date(fechaInicio + "T00:00:00");
  const fin = new Date(fechaFin + "T00:00:00");

  if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
    console.error("Fechas inválidas:", fechaInicio, fechaFin);
    return false;
  }

  inicio.setHours(0, 0, 0, 0);
  fin.setHours(23, 59, 59, 999);

  return hoy >= inicio && hoy <= fin;
}

function esFutura(fechaInicio) {
  const hoy = new Date();
  hoy.setHours(23, 59, 59, 999);
  const inicio = new Date(fechaInicio + "T00:00:00");
  return inicio > hoy;
}

function formatearFecha(fechaStr) {
  const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
  const fecha = new Date(fechaStr + "T00:00:00");
  return fecha.toLocaleDateString('es-MX', opciones);
}

function permisoEstaActivoAhora(dia, horaInicio, horaFin) {
  const ahora = new Date();
  const [anio, mes, diaNum] = dia.split("-").map(Number);
  const [hInicio, mInicio] = horaInicio.split(":").map(Number);
  const [hFin, mFin] = horaFin.split(":").map(Number);

  const inicio = new Date(anio, mes - 1, diaNum, hInicio, mInicio);
  const fin = new Date(anio, mes - 1, diaNum, hFin, mFin);

  return ahora >= inicio && ahora <= fin;
}

let vacacionesData = [];
let permisosData = [];

document.addEventListener("DOMContentLoaded", () => {
  fetch("/solicitudes-aprobadas-rechazadas")
    .then(res => res.json())
    .then(data => {
      vacacionesData = data.filter(item => item.tipo === "Vacaciones");
      permisosData = data.filter(item => item.tipo === "Permiso");
      renderizarFiltradas(vacacionesData, permisosData);

      const filtro = document.getElementById("filtro-solicitudes");
      filtro.addEventListener("change", aplicarFiltroUnico);
    })
    .catch(err => console.error("Error al cargar solicitudes:", err));
});

function aplicarFiltroUnico() {
  const valor = document.getElementById("filtro-solicitudes").value;
  let vac = [], perm = [];

  switch (valor) {
    case "todas":
      vac = vacacionesData;
      perm = permisosData;
      break;
    case "aceptadas":
      vac = vacacionesData.filter(i => i.estado_id === 2);
      perm = permisosData.filter(i => i.estado_id === 2);
      break;
    case "rechazadas":
      vac = vacacionesData.filter(i => i.estado_id === 1);
      perm = permisosData.filter(i => i.estado_id === 1);
      break;
    case "vacaciones-activas":
      vac = vacacionesData.filter(i => i.estado_id === 2 && estaActiva(i.fecha_salida, i.fecha_regreso));
      break;
    case "vacaciones-futuras":
      vac = vacacionesData.filter(i => i.estado_id === 2 && esFutura(i.fecha_salida));
      break;
    case "permisos-activos":
      perm = permisosData.filter(i => i.estado_id === 2 && permisoEstaActivoAhora(i.dia_solicitado, i.hora_inicio, i.hora_fin));
      break;
    case "permisos-futuros":
      perm = permisosData.filter(i => i.estado_id === 2 && esFutura(i.dia_solicitado));
      break;
    case "ambos-activos":
      vac = vacacionesData.filter(i => i.estado_id === 2 && estaActiva(i.fecha_salida, i.fecha_regreso));
      perm = permisosData.filter(i => i.estado_id === 2 && permisoEstaActivoAhora(i.dia_solicitado, i.hora_inicio, i.hora_fin));
      break;
    case "ambos-futuros":
      vac = vacacionesData.filter(i => i.estado_id === 2 && esFutura(i.fecha_salida));
      perm = permisosData.filter(i => i.estado_id === 2 && esFutura(i.dia_solicitado));
      break;
  }

  renderizarFiltradas(vac, perm);
}

function verificarTodasColumnasOcultas() {
  const gridContainer = document.getElementById("requests-grid-container");
  const columnasVisibles = Array.from(gridContainer.querySelectorAll(".request-column"))
    .filter(col => col.style.display !== "none");

  const mensajeExistente = gridContainer.querySelector(".no-visible-columns");
  if (columnasVisibles.length === 0 && !mensajeExistente) {
    const mensaje = document.createElement("div");
    mensaje.className = "no-visible-columns";
    mensaje.textContent = "No hay solicitudes que coincidan con los filtros aplicados";
    gridContainer.appendChild(mensaje);
  } else if (mensajeExistente) {
    mensajeExistente.remove();
  }
}

function renderizarFiltradas(vacaciones, permisos) {
  const containers = {
    permisosAceptados: document.getElementById("accepted-permissions").parentElement,
    permisosRechazados: document.getElementById("rejected-permissions").parentElement,
    vacacionesAprobadas: document.getElementById("approved-vacations").parentElement,
    vacacionesRechazadas: document.getElementById("rejected-vacations").parentElement,
  };

  for (let key in containers) {
    containers[key].style.display = "block";
    containers[key].querySelector(".requests-list").innerHTML = "";
  }

  // Vacaciones
  vacaciones.forEach(item => {
    const div = document.createElement("div");
    div.className = "request-item";
    div.setAttribute("data-id", item.id);
    div.setAttribute("data-tipo", "Vacaciones");

    const fechaSalida = formatearFecha(item.fecha_salida);
    const fechaRegreso = formatearFecha(item.fecha_regreso);
    const mostrarFechas = item.fecha_salida === item.fecha_regreso
      ? `Fecha: ${fechaSalida}`
      : `Del ${fechaSalida} al ${fechaRegreso}`;

    div.innerHTML = `
      <div style="flex: 1; margin-right: 10px;">
        <div class="request-employee">${item.nombre}</div>
        <div class="request-date">${mostrarFechas}</div>
        <div class="request-details">Días solicitados: ${item.dias_solicitados}</div>
      </div>
      <button class="delete-btn" title="Eliminar solicitud">
        <i class="bi bi-x-lg"></i>
      </button>
    `;

    if (item.estado_id === 2)
      containers.vacacionesAprobadas.querySelector(".requests-list").appendChild(div);
    else
      containers.vacacionesRechazadas.querySelector(".requests-list").appendChild(div);
  });

  // Permisos
  permisos.forEach(item => {
    const div = document.createElement("div");
    div.className = "request-item";
    div.setAttribute("data-id", item.id);
    div.setAttribute("data-tipo", "Permiso");

    const fechaFormateada = formatearFecha(item.dia_solicitado);

    div.innerHTML = `
      <div style="flex: 1; margin-right: 10px;">
        <div class="request-employee">${item.nombre}</div>
        <div class="request-date">Día: ${fechaFormateada} (${item.hora_inicio} - ${item.hora_fin})</div>
        <div class="request-details">Razón: ${item.razon} | Compensación: ${item.tipo_compensacion}</div>
      </div>
      <button class="delete-btn" title="Eliminar solicitud">
        <i class="bi bi-x-lg"></i>
      </button>
    `;

    if (item.estado_id === 2)
      containers.permisosAceptados.querySelector(".requests-list").appendChild(div);
    else
      containers.permisosRechazados.querySelector(".requests-list").appendChild(div);
  });

  for (let key in containers) {
    const list = containers[key].querySelector(".requests-list");
    if (list.children.length === 0) {
      containers[key].style.display = "none";
      list.innerHTML = `<div class="empty-message">No hay solicitudes recientes</div>`;
    }
  }

  // Asignar eventos a los botones de eliminar
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const tarjeta = btn.closest(".request-item");
      const tipo = tarjeta.getAttribute("data-tipo");
      const id = tarjeta.getAttribute("data-id");

      Swal.fire({
        title: "¿Estás seguro?",
        text: "Esta acción dará de baja la solicitud.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Sí, dar de baja",
        cancelButtonText: "Cancelar",
      }).then((result) => {
        if (result.isConfirmed) {
          fetch("/api/dar-baja-solicitud", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tipo, id })
          })
            .then(res => res.json())
            .then(data => {
              if (data.mensaje) {
                Swal.fire({
                  icon: "success",
                  title: "Solicitud eliminada",
                  confirmButtonColor: "#3085d6",
                  confirmButtonText: "Aceptar"
                }).then(() => {
                  location.reload();
                });
              } else {
                Swal.fire({
                  icon: "error",
                  title: "Error al eliminar",
                  text: data.error || "Respuesta inesperada",
                  confirmButtonColor: "#d33"
                });
              }
            })
            .catch(err => {
              console.error("Error:", err);
              Swal.fire({
                icon: "error",
                title: "Error de conexión",
                text: "No se pudo dar de baja la solicitud.",
                confirmButtonColor: "#d33"
              });
            });
        }
      });
    });
  });
}

function exportarExcelDesdeServidor() {
  const dataParaExportar = [];

  document.querySelectorAll(".request-item").forEach(div => {
    const contenedor = div.parentElement.id;
    const tipo = contenedor.includes("vacations") ? "Vacaciones" : "Permiso";
    const estado = contenedor.includes("approved") || contenedor.includes("accepted")
      ? "Aceptado" : "Rechazado";

    const empleado = div.querySelector(".request-employee")?.textContent.trim();
    const fecha = div.querySelector(".request-date")?.textContent.trim();
    const detalles = div.querySelector(".request-details")?.textContent.trim();

    dataParaExportar.push({ Tipo: tipo, Estado: estado, Empleado: empleado, Fecha: fecha, Detalles: detalles });
  });

  if (dataParaExportar.length === 0) {
    Swal.fire({
      icon: "info",
      title: "Sin datos para exportar",
      text: "No hay solicitudes visibles con los filtros aplicados.",
      confirmButtonColor: "#3085d6"
    });
    return;
  }

  fetch("/api/exportar-reportes-vista", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dataParaExportar)
  })
    .then(response => response.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Solicitudes_Visibles.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    })
    .catch(error => {
      console.error("Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error al exportar",
        text: "Ocurrió un problema al generar el archivo.",
        confirmButtonColor: "#d33"
      });
    });
}
