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
  const form = document.getElementById("login-form");

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const formData = new FormData(form);

    try {
      // Usamos ruta relativa para que funcione con Ngrok o local
      const response = await fetch("/login", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem("idUsuario", data.idUsuario);
        window.location.href = data.redirect;
      } else {
        mostrarErrorCredenciales();
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al conectar con el servidor");
    }
  });
});
