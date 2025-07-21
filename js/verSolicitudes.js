document.addEventListener("DOMContentLoaded", () => {
  fetch("/solicitudes-aprobadas-rechazadas")
    .then((response) => response.json())
    .then((data) => {
      // Limpiar todos los contenedores
      const containers = {
        permisosAceptados: document.getElementById("accepted-permissions"),
        permisosRechazados: document.getElementById("rejected-permissions"),
        vacacionesAprobadas: document.getElementById("approved-vacations"),
        vacacionesRechazadas: document.getElementById("rejected-vacations"),
      };

      for (let key in containers) {
        containers[key].innerHTML = "";
      }

      data.forEach((item) => {
        const div = document.createElement("div");
        div.className = "request-item";

        const empleado = document.createElement("div");
        empleado.className = "request-employee";
        empleado.textContent = `${item.nombre}`;

        const fecha = document.createElement("div");
        fecha.className = "request-date";

        if (item.tipo === "Vacaciones") {
          fecha.textContent = `Del ${item.fecha_salida} al ${item.fecha_regreso}`;
        } else {
          fecha.textContent = `Día: ${item.dia_solicitado} (${item.hora_inicio} - ${item.hora_fin})`;
        }

        const detalles = document.createElement("div");
        detalles.className = "request-details";

        if (item.tipo === "Vacaciones") {
          detalles.textContent = `Días solicitados: ${item.dias_solicitados}`;
        } else {
          detalles.textContent = `Razón: ${item.razon} | Compensación: ${item.tipo_compensacion}`;
        }

        div.appendChild(empleado);
        div.appendChild(fecha);
        div.appendChild(detalles);

        // Decidir dónde colocar el elemento
        if (item.tipo === "Permiso" && item.estado_id === 2)
          containers.permisosAceptados.appendChild(div);
        else if (item.tipo === "Permiso" && item.estado_id === 1)
          containers.permisosRechazados.appendChild(div);
        else if (item.tipo === "Vacaciones" && item.estado_id === 2)
          containers.vacacionesAprobadas.appendChild(div);
        else if (item.tipo === "Vacaciones" && item.estado_id === 1)
          containers.vacacionesRechazadas.appendChild(div);
      });

      // Mostrar mensaje si está vacío
      for (let key in containers) {
        if (containers[key].children.length === 0) {
          containers[key].innerHTML =
            '<div class="empty-message">No hay solicitudes recientes</div>';
        }
      }
    })
    .catch((error) => {
      console.error("Error al cargar las solicitudes:", error);
    });
});
