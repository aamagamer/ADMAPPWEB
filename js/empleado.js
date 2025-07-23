function cargarNombreUsuario(idUsuario) {
  fetch("/api/usuario/nombre", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ idUsuario: idUsuario }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Error al obtener el nombre del usuario");
      }
      return response.json();
    })
    .then((data) => {
      if (data.error) {
        console.error(data.error);
        document.getElementById("employee-name").textContent = "Administrador";
      } else {
        // Formatear el nombre completo manejando casos donde falte materno
        let nombreCompleto = data.nombres || "";
        if (data.paterno) nombreCompleto += ` ${data.paterno}`;
        if (data.materno) nombreCompleto += ` ${data.materno}`;

        document.getElementById("employee-name").textContent =
          nombreCompleto.trim() || "Administrador";
      }
    })
    .catch((error) => {
      console.error("Error al cargar nombre:", error);
      document.getElementById("employee-name").textContent = "Administrador";
    });
}

document.addEventListener("DOMContentLoaded", function () {
  // Verificar si el usuario NO está logueado
if (!localStorage.getItem('idUsuario')) {
    window.location.href = 'index.html';
}
    const idUsuario = localStorage.getItem("idUsuario");
    if (idUsuario) {
      cargarNombreUsuario(parseInt(idUsuario));
    }
  });