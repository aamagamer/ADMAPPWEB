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
        // Guardar el ID del usuario en localStorage
        localStorage.setItem("idUsuario", data.idUsuario);

        // Redirigir a la página correspondiente
        window.location.href = data.redirect;
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al conectar con el servidor");
    }
  });
});
