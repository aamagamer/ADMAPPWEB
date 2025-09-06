// Funciones de utilidad (definirlas al inicio del script)
function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatHumanDate(fechaISO) {
  const [year, month, day] = fechaISO.split("-");
  const fecha = new Date(year, month - 1, day);
  const formateada = fecha.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return formateada.charAt(0).toUpperCase() + formateada.slice(1);
}

// Función mejorada para mostrar modales
function mostrarModal(modalId, mensaje, titulo = null) {
  const modal = document.getElementById(modalId);
  
  // Buscar elementos por clase en lugar de ID específico
  const mensajeElements = modal.getElementsByClassName('modal-mensaje');
  if (mensajeElements.length > 0) {
    for (let element of mensajeElements) {
      element.textContent = mensaje;
    }
  }
  
  modal.style.display = 'block';
  
  // Configurar evento de cierre para todos los botones de cerrar
  const cerrarBtns = modal.getElementsByClassName('modal-cerrar-btn');
  for (let btn of cerrarBtns) {
    btn.onclick = () => {
      modal.style.display = 'none';
    };
  }
  
  // Cerrar al hacer clic fuera del modal
  modal.onclick = (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  };
  
  // Prevenir que el clic en el contenido cierre el modal
  const contenido = modal.querySelector('.modal-alarma-contenido, .modal-anticipacion-contenido');
  if (contenido) {
    contenido.onclick = (e) => e.stopPropagation();
  }
}

// Funciones específicas de modales
function mostrarAlarma(mensaje) {
  mostrarModal('alarmaModal', mensaje);
}

function mostrarAdvertenciaAnticipacion(mensaje) {
  mostrarModal('anticipacionModal', mensaje);
}

// 🔹 Nueva función para calcular fecha límite según horas hábiles
function calcularFechaLimite(fechaPermiso) {
  const HORAS_REQUERIDAS = 14; // 4h + 10h
  const INICIO_JORNADA = 8;
  const FIN_JORNADA = 18;

  let horasPendientes = HORAS_REQUERIDAS;
  // CAMBIO PRINCIPAL: Iniciamos desde el inicio del día del permiso (8:00 AM)
  let fechaLimite = new Date(fechaPermiso);
  fechaLimite.setHours(INICIO_JORNADA, 0, 0, 0); // 8:00:00 AM del día del permiso

  while (horasPendientes > 0) {
    fechaLimite.setHours(fechaLimite.getHours() - 1);

    const dia = fechaLimite.getDay(); // 0 = domingo, 6 = sábado
    const hora = fechaLimite.getHours();

    // Solo cuenta como hora hábil si es lunes a viernes y entre 8-18 horas
    if (dia >= 1 && dia <= 5 && hora >= INICIO_JORNADA && hora < FIN_JORNADA) {
      horasPendientes--;
    }
  }

  return fechaLimite;
}

document.addEventListener("DOMContentLoaded", () => {
  // Elementos del DOM
  const elementos = {
    fechaInput: document.getElementById("fecha"),
    formulario: document.querySelector("form"),
    horaInicio: document.getElementById("hora-inicio"),
    horaFin: document.getElementById("hora-fin"),
    actividades: document.getElementById("actividades"),
    confirmModal: document.getElementById("confirm-modal"),
    modalText: document.getElementById("modal-text"),
    confirmBtn: document.getElementById("confirm-btn"),
    cancelBtn: document.getElementById("cancel-btn"),
    tipoCompensacion: document.getElementById("tipo-compensacion")
  };

  let diasFestivos = [];

  // Cargar días festivos
  fetch("/api/festivos")
    .then((res) => res.json())
    .then((data) => {
      diasFestivos = data || [];
      initDatePicker();
    })
    .catch(console.error);

  function initDatePicker() {
    flatpickr("#fecha", {
      minDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // mínimo 1 día después
      dateFormat: "Y-m-d",
      locale: "es",
      disable: diasFestivos,
      disableMobile: true,
      defaultDate: null,
    });
  }

  // Establecer fecha mínima
  const ahora = new Date();
  const fechaMin = new Date(ahora.getTime() + 24 * 60 * 60 * 1000);
  fechaMin.setHours(0, 0, 0, 0);
  elementos.fechaInput.min = formatDate(fechaMin);

  // Evento submit del formulario
  elementos.formulario.addEventListener("submit", (e) => {
    e.preventDefault();

    // Validar campos vacíos
    if (!elementos.fechaInput.value || !elementos.horaInicio.value || 
        !elementos.horaFin.value || !elementos.actividades.value.trim()) {
      mostrarAlarma("Por favor completa todos los campos.");
      return;
    }

    // Validar horas
    const horaInicioObj = new Date(`2000-01-01T${elementos.horaInicio.value}`);
    const horaFinObj = new Date(`2000-01-01T${elementos.horaFin.value}`);

    if (horaFinObj <= horaInicioObj) {
      mostrarAlarma("La hora de fin debe ser mayor a la hora de inicio.");
      return;
    }

    // Validar anticipación laboral
    const fechaHoraPermiso = new Date(`${elementos.fechaInput.value}T${elementos.horaInicio.value}`);
    const fechaLimite = calcularFechaLimite(fechaHoraPermiso);

    if (new Date() > fechaLimite) {
      const fechaHumana = fechaLimite.toLocaleString("es-MX", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
      mostrarAdvertenciaAnticipacion(`El permiso debe solicitarse antes de ${fechaHumana}`);
      return;
    }

    // Mostrar modal de confirmación
    const fechaFormateada = formatHumanDate(elementos.fechaInput.value);
    elementos.modalText.innerHTML = `
      Solicitas un permiso para el día <strong>${fechaFormateada}</strong><br>
      De <strong>${elementos.horaInicio.value}</strong> a <strong>${elementos.horaFin.value}</strong><br><br>
      <em>Motivo:</em> ${elementos.actividades.value.trim()}<br><br>
      ¿Deseas confirmar la solicitud?
    `;
    elementos.confirmModal.style.display = "flex";
  });

  // Confirmar solicitud
  elementos.confirmBtn.addEventListener("click", enviarSolicitud);
  elementos.cancelBtn.addEventListener("click", () => {
    elementos.confirmModal.style.display = "none";
  });

  // Cargar compensaciones
  cargarCompensaciones();
});

function enviarSolicitud() {
  const elementos = {
    fechaInput: document.getElementById("fecha"),
    horaInicio: document.getElementById("hora-inicio"),
    horaFin: document.getElementById("hora-fin"),
    actividades: document.getElementById("actividades"),
    confirmModal: document.getElementById("confirm-modal"),
    tipoCompensacion: document.getElementById("tipo-compensacion"),
    formulario: document.querySelector("form")
  };

  const idUsuario = localStorage.getItem("idUsuario");
  const idCompensacion = elementos.tipoCompensacion.value;

  if (!idUsuario || !idCompensacion) {
    mostrarAlarma("Faltan datos obligatorios.");
    return;
  }

  fetch("/api/solicitarPermiso", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      idUsuario: parseInt(idUsuario),
      fecha: elementos.fechaInput.value,
      horaInicio: elementos.horaInicio.value,
      horaFin: elementos.horaFin.value,
      razon: elementos.actividades.value.trim(),
      idCompensacion: parseInt(idCompensacion),
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      elementos.confirmModal.style.display = "none";
      if (data.mensaje) {
        elementos.formulario.reset();
        // window.location.href = determinarPaginaRedireccion();
      } else {
        mostrarAlarma("Error al registrar el permiso: " + (data.error || "desconocido"));
      }
    })
    .catch((err) => {
      elementos.confirmModal.style.display = "none";
      console.error("Error al enviar solicitud:", err);
      mostrarAlarma("Error de red al enviar la solicitud.");
    });
}

function cargarCompensaciones() {
  fetch("/api/compensaciones")
    .then((response) => response.json())
    .then((data) => {
      const select = document.getElementById("tipo-compensacion");
      if (data.compensaciones) {
        data.compensaciones.forEach((item) => {
          const option = document.createElement("option");
          option.value = item.id;
          option.textContent = item.nombre;
          select.appendChild(option);
        });
      }
    })
    .catch(console.error);
}

function determinarPaginaRedireccion() {
  const rol = localStorage.getItem("rolUsuario");
  localStorage.removeItem("rolUsuario");
  
  switch(rol) {
    case "lider": return "lider.html";
    case "rh": return "rh.html";
    default: return "empleado.html";
  }
}
