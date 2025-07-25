function estaActiva(fechaInicio, fechaFin) {
  const hoy = new Date();
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  return hoy >= inicio && hoy <= fin;
}

function esFutura(fechaInicio) {
  const hoy = new Date();
  const inicio = new Date(fechaInicio);
  return inicio > hoy;
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
    .then((res) => res.json())
    .then((data) => {
      vacacionesData = data.filter(item => item.tipo === "Vacaciones");
      permisosData = data.filter(item => item.tipo === "Permiso");

      renderizarFiltradas(vacacionesData, permisosData); // todas al inicio

      const filtro = document.getElementById("filtro-solicitudes");
      filtro.addEventListener("change", aplicarFiltroUnico);
    })
    .catch((err) => console.error("Error al cargar solicitudes:", err));
});

function aplicarFiltroUnico() {
  const valor = document.getElementById("filtro-solicitudes").value;

  let vac = [];
  let perm = [];

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
      perm = [];
      break;

    case "vacaciones-futuras":
      vac = vacacionesData.filter(i => i.estado_id === 2 && esFutura(i.fecha_salida));
      perm = [];
      break;

    case "permisos-activos":
      perm = permisosData.filter(i => i.estado_id === 2 && permisoEstaActivoAhora(i.dia_solicitado, i.hora_inicio, i.hora_fin));
      vac = [];
      break;

    case "permisos-futuros":
      perm = permisosData.filter(i => i.estado_id === 2 && esFutura(i.dia_solicitado));
      vac = [];
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

function renderizarFiltradas(vacaciones, permisos) {
  const containers = {
    permisosAceptados: document.getElementById("accepted-permissions"),
    permisosRechazados: document.getElementById("rejected-permissions"),
    vacacionesAprobadas: document.getElementById("approved-vacations"),
    vacacionesRechazadas: document.getElementById("rejected-vacations"),
  };

  for (let key in containers) {
    containers[key].innerHTML = "";
  }

  vacaciones.forEach(item => {
    const div = document.createElement("div");
    div.className = "request-item";
    div.innerHTML = `
      <div class="request-employee">${item.nombre}</div>
      <div class="request-date">Del ${item.fecha_salida} al ${item.fecha_regreso}</div>
      <div class="request-details">Días solicitados: ${item.dias_solicitados}</div>
    `;
    if (item.estado_id === 2)
      containers.vacacionesAprobadas.appendChild(div);
    else
      containers.vacacionesRechazadas.appendChild(div);
  });

  permisos.forEach(item => {
    const div = document.createElement("div");
    div.className = "request-item";
    div.innerHTML = `
      <div class="request-employee">${item.nombre}</div>
      <div class="request-date">Día: ${item.dia_solicitado} (${item.hora_inicio} - ${item.hora_fin})</div>
      <div class="request-details">Razón: ${item.razon} | Compensación: ${item.tipo_compensacion}</div>
    `;
    if (item.estado_id === 2)
      containers.permisosAceptados.appendChild(div);
    else
      containers.permisosRechazados.appendChild(div);
  });

  for (let key in containers) {
    if (containers[key].children.length === 0) {
      containers[key].innerHTML = `<div class="empty-message">No hay solicitudes recientes</div>`;
    }
  }
}
