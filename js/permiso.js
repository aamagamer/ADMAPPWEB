document.addEventListener("DOMContentLoaded", () => {
  const fechaInput = document.getElementById("fecha");
  const formulario = document.querySelector("form");
  const horaInicio = document.getElementById("hora-inicio");
  const horaFin = document.getElementById("hora-fin");
  const actividades = document.getElementById("actividades");
  const modal = document.getElementById("confirm-modal");
  const modalText = document.getElementById("modal-text");
  const confirmBtn = document.getElementById("confirm-btn");
  const cancelBtn = document.getElementById("cancel-btn");

  let diasFestivos = [];

  fetch("/api/festivos")
    .then((res) => res.json())
    .then((data) => {
      const diasFestivos = data || [];

      flatpickr("#fecha", {
        minDate: new Date(Date.now() + 28 * 60 * 60 * 1000),
        dateFormat: "Y-m-d",
        locale: "es",
        disable: diasFestivos,
        disableMobile: true,
        defaultDate: null, // 👈 para no seleccionar hoy automáticamente
      });
    })
    .catch((err) => {
      console.error("Error al cargar días festivos:", err);
    });

  // Establecer fecha mínima visual (para el input)
  const ahora = new Date();
  const fechaMin = new Date(ahora.getTime() + 28 * 60 * 60 * 1000);
  fechaMin.setHours(0, 0, 0, 0);

  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  fechaInput.min = formatDate(fechaMin);

  // Formato bonito para el modal
  const formatHumanDate = (fechaStr) => {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  formulario.addEventListener("submit", (e) => {
    e.preventDefault();

    // Validar campos vacíos
    if (
      !fechaInput.value ||
      !horaInicio.value ||
      !horaFin.value ||
      !actividades.value.trim()
    ) {
      //("Por favor completa todos los campos.");
      return;
    }

    // Validar que la hora de fin sea posterior a la de inicio
    const horaInicioObj = new Date(`2000-01-01T${horaInicio.value}`);
    const horaFinObj = new Date(`2000-01-01T${horaFin.value}`);

    if (horaFinObj <= horaInicioObj) {
      alert("La hora de fin debe ser mayor a la hora de inicio.");
      return;
    }

    // Validación de 28 horas (fecha + hora)
    const fechaHoraPermiso = new Date(
      `${fechaInput.value}T${horaInicio.value}`
    );
    const ahora = new Date();
    const diferencia = fechaHoraPermiso.getTime() - ahora.getTime();

    if (diferencia < 28 * 60 * 60 * 1000) {
      alert(
        "Debes solicitar el permiso con al menos 28 horas de anticipación."
      );
      return;
    }

    function formatHumanDate(fechaISO) {
      const [year, month, day] = fechaISO.split("-"); // Evita el UTC
      const fecha = new Date(year, month - 1, day); // mes base 0

      const formateada = fecha.toLocaleDateString("es-MX", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      // Capitaliza la primera letra (opcional)
      return formateada.charAt(0).toUpperCase() + formateada.slice(1);
    }

    // Mostrar modal con los datos del permiso
    const fechaFormateada = formatHumanDate(fechaInput.value);
    const descripcion = actividades.value.trim();

    modalText.innerHTML = `
            Solicitas un permiso para el día <strong>${fechaFormateada}</strong><br>
            De <strong>${horaInicio.value}</strong> a <strong>${horaFin.value}</strong><br><br>
            <em>Motivo:</em> ${descripcion}<br><br>
            ¿Deseas confirmar la solicitud?
        `;
    modal.style.display = "flex";
  });

  confirmBtn.addEventListener("click", () => {
    const idUsuario = localStorage.getItem("idUsuario");
    const idCompensacion = document.getElementById("tipo-compensacion").value;

    if (!idUsuario || !idCompensacion) {
      alert("Faltan datos obligatorios.");
      return;
    }

    fetch("/api/solicitarPermiso", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idUsuario: parseInt(idUsuario),
        fecha: fechaInput.value,
        horaInicio: horaInicio.value,
        horaFin: horaFin.value,
        razon: actividades.value.trim(),
        idCompensacion: parseInt(idCompensacion),
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        modal.style.display = "none";
        if (data.mensaje) {
          //alert("Permiso registrado correctamente.");
          window.location.href = "empleado.html";
        } else {
          alert(
            "Error al registrar el permiso: " + (data.error || "desconocido")
          );
        }
      })
      .catch((err) => {
        modal.style.display = "none";
        console.error("❌ Error al enviar solicitud:", err);
        alert("Error de red al enviar la solicitud.");
      });
  });

  cancelBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });
});

function volver() {
  const rol = localStorage.getItem("rolUsuario");

  let destino = "empleado.html"; // valor por defecto

  if (rol === "lider") destino = "lider.html";
  else if (rol === "rh") destino = "rh.html";

  localStorage.removeItem("rolUsuario"); // opcional: para no guardar el rol para siempre
  window.location.href = destino;
}

fetch("/api/compensaciones")
  .then((response) => response.json())
  .then((data) => {
    const select = document.getElementById("tipo-compensacion");
    if (data.compensaciones) {
      data.compensaciones.forEach((item) => {
        const option = document.createElement("option");
        option.value = item.id; // ✅ el value es el ID
        option.textContent = item.nombre; // lo visible es el nombre
        select.appendChild(option);
      });
    }
  })
  .catch((error) => {
    console.error("Error al cargar las compensaciones:", error);
  });
