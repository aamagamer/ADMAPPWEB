function formatearFechaHumana(fechaStr) {
  const opciones = {
    weekday: "long", // martes
    year: "numeric",
    month: "long", // julio
    day: "numeric",
  };

  const fecha = new Date(fechaStr + "T00:00:00");
  return fecha.toLocaleDateString("es-MX", opciones);
}
document.addEventListener("DOMContentLoaded", async function () {
  const idUsuario = localStorage.getItem("idUsuario");
  let diasFestivos = [];
  let diasDisponibles = 0;

  if (!idUsuario) {
    alert("No se encontró el ID del usuario. Inicia sesión nuevamente.");
    window.location.href = "login.html";
    return;
  }

  await cargarContadoresVacaciones(idUsuario); // ✅ Esperamos a que cargue correctamente

  // Mostrar nombre del usuario
  try {
    const res = await fetch("/api/usuario/nombre", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idUsuario }),
    });

    const data = await res.json();
    if (data.nombres) {
      const nombreCompleto = `${data.nombres} ${data.paterno} ${data.materno}`;
      const nombreElemento = document.getElementById("employee-name");
      if (nombreElemento) nombreElemento.textContent = nombreCompleto;
    }
  } catch (err) {
    console.error("Error al obtener nombre del usuario:", err);
  }

  // Obtener días festivos
  try {
    const res = await fetch("/api/festivos");
    diasFestivos = await res.json();
  } catch (error) {
    console.error("Error al obtener días festivos:", error);
    diasFestivos = [];
  }

  // Utilidades
  const bloquearFinesDeSemana = (date) => {
    const dia = date.getDay();
    return dia === 0 || dia === 6;
  };

  function contarDiasHabiles(fechaInicio, fechaFin, festivos = []) {
    const inicio = new Date(fechaInicio + "T00:00:00");
    const fin = new Date(fechaFin + "T00:00:00");
    let contador = 0;

    for (
      let d = new Date(inicio.getTime());
      d <= fin;
      d.setDate(d.getDate() + 1)
    ) {
      const dia = d.getDay();
      const formato = d.toISOString().split("T")[0];
      const esHabil = dia !== 0 && dia !== 6 && !festivos.includes(formato);
      if (esHabil) contador++;
    }

    return contador;
  }

  function sumarDiasHabiles(fechaInicio, cantidadDias, festivos = []) {
    const resultado = new Date(fechaInicio);
    let sumados = 0;

    while (sumados < cantidadDias) {
      resultado.setDate(resultado.getDate() + 1);
      const dia = resultado.getDay();
      const formato = resultado.toISOString().split("T")[0];

      if (dia !== 0 && dia !== 6 && !festivos.includes(formato)) {
        sumados++;
      }
    }

    return resultado;
  }

  // Calendarios
  const fechaInicioInput = document.getElementById("fecha-inicio");
  const fechaFinInput = document.getElementById("fecha-fin");

  let fechaInicioSeleccionada = null;

  flatpickr(fechaInicioInput, {
    disable: [...diasFestivos, bloquearFinesDeSemana],
    minDate: new Date().fp_incr(7),
    dateFormat: "Y-m-d",
    locale: "es",
    onChange: function (selectedDates) {
      if (!selectedDates.length) return;

      fechaInicioSeleccionada = selectedDates[0];
      const fechaLimite = sumarDiasHabiles(
        fechaInicioSeleccionada,
        diasDisponibles - 1,
        diasFestivos
      );

      flatpickr(fechaFinInput, {
        disable: [...diasFestivos, bloquearFinesDeSemana],
        minDate: fechaInicioSeleccionada,
        maxDate: fechaLimite,
        dateFormat: "Y-m-d",
        locale: "es",
      });
    },
  });

  // Envío del formulario
  document
    .getElementById("vacation-form")
    .addEventListener("submit", async function (e) {
      e.preventDefault();

      const fechaInicio = fechaInicioInput.value;
      const fechaFin = fechaFinInput.value;

      if (!fechaInicio || !fechaFin) {
        alert("Por favor completa todos los campos.");
        return;
      }

      const diasSolicitados = contarDiasHabiles(
        fechaInicio,
        fechaFin,
        diasFestivos
      );

      if (diasSolicitados > diasDisponibles) {
        mostrarAdvertenciaDias(diasSolicitados, diasDisponibles);
        return;
      }

      // Mostrar modal personalizado
      const resumen = `
  Solicitas <strong>${diasSolicitados}</strong> días hábiles de vacaciones<br>
  desde el <strong>${formatearFechaHumana(
    fechaInicio
  )}</strong> hasta el <strong>${formatearFechaHumana(fechaFin)}</strong>.
`;

      document.getElementById("modal-text").innerHTML = resumen;
      document.getElementById("confirm-modal").style.display = "flex";

      // Guardar los datos temporalmente para usarlos al confirmar
      window.datosSolicitud = {
        idUsuario,
        fechaInicio,
        fechaFin,
        diasSolicitados,
      };
    });

    function mostrarAdvertenciaDias(diasSolicitados, diasDisponibles) {
  const modal = document.getElementById('diasDisponiblesModal');
  const mensajeElement = document.getElementById('diasDisponiblesModalMensaje');
  const cerrarBtn = document.getElementById('diasDisponiblesModalCerrarBtn');
  
  mensajeElement.innerHTML = `
    <strong>Advertencia de días</strong><br><br>
    Estás solicitando <span style="color: #e74c3c; font-weight: bold;">${diasSolicitados} días hábiles</span>, 
    pero solo tienes <span style="color: #27ae60; font-weight: bold;">${diasDisponibles} disponibles</span>.
  `;
  
  modal.style.display = 'block';
  
  // Evento para cerrar el modal
  cerrarBtn.onclick = function() {
    modal.style.display = 'none';
  }
  
  // Cerrar al hacer clic fuera del modal
  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = 'none';
    }
  }
  
  return false; 
}

  // Carga contadores y actualiza variable global
  async function cargarContadoresVacaciones(idUsuario) {
    try {
      const res = await fetch(`/api/empleado/${idUsuario}`);
      const data = await res.json();

      const vacacionesTotales = data.Vacaciones || 0;
      diasDisponibles = data.DiasDisponibles || 0;
      const diasUsados = vacacionesTotales - diasDisponibles;

      document.querySelector(".total-days").textContent = vacacionesTotales;
      document.querySelector(".available-days").textContent = diasDisponibles;
      document.querySelector(".used-days").textContent = diasUsados;
    } catch (error) {
      console.error("Error al cargar contadores de vacaciones:", error);
    }
  }

  document.getElementById("confirm-btn").addEventListener("click", async () => {
    const { idUsuario, fechaInicio, fechaFin, diasSolicitados } =
      window.datosSolicitud;

    try {
      const res = await fetch("/api/solicitarVacaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idUsuario,
          fechaInicio,
          fechaFin,
          diasSolicitados,
        }),
      });

      const result = await res.json();
      if (res.ok) {
        //alert("Solicitud enviada correctamente.");
        location.reload();
      } else {
        alert(result.error || "Ocurrió un error al enviar la solicitud.");
      }
    } catch (err) {
      console.error("Error al enviar solicitud:", err);
      alert("Error de red o del servidor.");
    }
  });

  document.getElementById("cancel-btn").addEventListener("click", () => {
    document.getElementById("confirm-modal").style.display = "none";
  });

  function volver() {
    const pagina = localStorage.getItem("paginaAnterior") || "empleado.html";
    window.location.href = pagina;
  }
  function volver() {
    const pagina = localStorage.getItem("paginaAnterior") || "lider.html";
    window.location.href = pagina;
  }
});
