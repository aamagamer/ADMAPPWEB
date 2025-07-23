function mostrarErrorCredenciales() {
  const modal = document.getElementById("credencialesModal");
  const mensajeElement = document.getElementById("credencialesModalMensaje");
  const cerrarBtn = document.getElementById("credencialesModalCerrarBtn");

  mensajeElement.textContent = "Contraseña o Número de Usuario incorrecto.";
  modal.style.display = "block";

  // Evento para cerrar el modal
  cerrarBtn.onclick = function () {
    modal.style.display = "none";
  };

  // Cerrar al hacer clic fuera del modal
  window.onclick = function (event) {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  };
}

function mostrarModalRecuperacion() {
  const modal = document.getElementById('recuperarContrasenaModal');
  const cerrarBtn = document.getElementById('recuperarContrasenaModalCerrarBtn');
  
  modal.style.display = 'block';
  
  // Cerrar al hacer clic en el botón
  cerrarBtn.onclick = function() {
    modal.style.display = 'none';
  }
  
  // Cerrar al hacer clic fuera del modal
  window.onclick = function(event) {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  }
}
document.addEventListener("DOMContentLoaded", function () {
  // --- Medidas de seguridad extra ---
  // 1. Limpiar localStorage al cargar login (por si quedó data)
  localStorage.removeItem("idUsuario");
  
  // 2. Forzar recarga sin caché si se llega aquí al retroceder
  if (performance.navigation.type === 2) { // Si se navegó con "back/forward"
    window.location.replace('index.html?noCache=' + Date.now());
  }

  // 3. Resetear formulario y desactivar autocompletado
  const form = document.getElementById("login-form");
  form.reset(); // Limpia campos
  form.setAttribute('autocomplete', 'off'); // Bloquea autocompletado

  // --- Manejo del envío del formulario (original) ---
  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const formData = new FormData(form);

    try {
      const response = await fetch("/login", {
        method: "POST",
        body: formData,
        headers: {
          'Cache-Control': 'no-store' // Evita caché en la petición
        }
      });

      const data = await response.json();

      if (data.success) {
        // 4. Almacenamiento seguro (solo lo necesario)
        localStorage.setItem("idUsuario", data.idUsuario);
        
        // 5. Redirección que no deja historial
        window.location.replace(data.redirect); 
      } else {
        mostrarErrorCredenciales();
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al conectar con el servidor");
    }
  });
});



