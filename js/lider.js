// Función para obtener los datos del usuario
async function cargarDatosUsuario() {
  try {
    const idUsuario = localStorage.getItem("idUsuario");

    if (!idUsuario) {
      console.error("No se encontró idUsuario en localStorage");
      return;
    }

    const response = await fetch(`/api/empleado/${idUsuario}`);
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

    const data = await response.json();
    console.log("Datos recibidos:", data);

    // Mostrar nombre del empleado en el saludo
    if (data.Nombres && data.Paterno && data.Materno) {
      const nombreCompleto = `${data.Nombres} ${data.Paterno} ${data.Materno}`;
      document.getElementById("employee-name").textContent = nombreCompleto;
    } else {
      document.getElementById("employee-name").textContent =
        data.Nombres || "Empleado";
    }

    // Si es líder, cargar su área
    if (data.TipoRol && data.TipoRol.toLowerCase().includes("lider")) {
      cargarAreaLider(idUsuario);
    } else {
      // Si no es líder, establecer título por defecto
      document.getElementById("header-title").textContent =
        "Portal del Empleado";
    }
  } catch (error) {
    console.error("Error al cargar datos del usuario:", error);
  }
}

// Función para obtener el área del usuario si es líder
async function cargarAreaLider(idUsuario) {
  try {
    const res = await fetch(`/api/usuario/${idUsuario}/area`);
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);

    const data = await res.json();
    console.log("Área recibida:", data);

    if (data.NombreArea) {
      document.getElementById(
        "header-title"
      ).textContent = `Portal de Líder de ${data.NombreArea}`;
    }
  } catch (err) {
    console.error("Error al obtener el área del líder:", err);
  }
}

// Función para cargar notificaciones
async function cargarNotificaciones() {
  try {
    const idUsuario = localStorage.getItem("idUsuario");

    if (!idUsuario) {
      console.error("No se encontró idUsuario en localStorage");
      return;
    }

    const response = await fetch(`/api/totalSolicitudes/${idUsuario}`);

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    console.log("Datos de notificaciones:", data); // Debug visible

    const badge = document.getElementById("notificacion-solicitudes");
    if (!badge) {
      console.warn("Elemento badge no encontrado");
      return;
    }

    if (data.total > 0) {
      badge.textContent = data.total;
      badge.style.display = "inline-block";
    } else {
      badge.style.display = "none";
    }
  } catch (error) {
    console.error("Error al cargar notificaciones:", error);
    // Opcional: mostrar mensaje al usuario
  }
}

// Ejecutar al cargar la página
window.addEventListener("DOMContentLoaded", cargarDatosUsuario);
cargarNotificaciones();
// Actualizar cada 30 segundos (ajusta este valor según necesites)
setInterval(cargarNotificaciones, 1200000);
