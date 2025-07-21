document.addEventListener("DOMContentLoaded", async function () {
  const contenedor = document.getElementById("vacantes-container");

  try {
    const response = await fetch("/api/vacantes");
    const data = await response.json();

    if (data.vacantes && data.vacantes.length > 0) {
      contenedor.innerHTML = "";

      data.vacantes.forEach((vacante) => {
        const card = document.createElement("div");
        card.className = "vacante-card";

        card.innerHTML = `
            <div class="vacante-titulo">${vacante.Puesto}</div>
            <div class="vacante-area">${vacante.NombreArea}</div>
            <div class="vacante-detalle"><span class="vacante-etiqueta">Perfil:</span> ${vacante.Perfil}</div>
            <div class="vacante-detalle"><span class="vacante-etiqueta">Habilidades:</span> ${vacante.Habilidades}</div>
            <button class="btn-conseguir" data-id="${vacante.idVacante}">Vacante conseguida</button>
          `;

        // ✅ Evento del botón debe estar dentro del forEach
        const boton = card.querySelector(".btn-conseguir");
        boton.addEventListener("click", async function () {
          const id = this.getAttribute("data-id");

          try {
            const res = await fetch(`/api/vacantes/${id}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ Estado: "Inactivo" }), // ✅ Estado correcto
            });

            if (!res.ok) throw new Error("Error al actualizar la vacante");

            alert("✅ Vacante marcada como conseguida.");
            card.remove(); // ✅ desaparece de la vista
          } catch (error) {
            console.error("Error al actualizar la vacante:", error);
            alert("❌ No se pudo actualizar la vacante.");
          }
        });

        contenedor.appendChild(card);
      });
    } else {
      contenedor.innerHTML =
        "<p>No hay solicitudes de vacantes registradas.</p>";
    }
  } catch (error) {
    contenedor.innerHTML = "<p>Error al cargar las vacantes.</p>";
    console.error("❌ Error cargando vacantes:", error);
  }
});
