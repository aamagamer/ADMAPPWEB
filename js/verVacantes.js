document.addEventListener("DOMContentLoaded", function () {
  const contenedor = document.getElementById("vacantes-container");

  async function cargarVacantes() {
    try {
      const response = await fetch("/api/vacantes");
      const data = await response.json();

      contenedor.innerHTML = "";

      if (data.vacantes && data.vacantes.length > 0) {
        data.vacantes.forEach((vacante) => {
          const card = document.createElement("div");
          card.className = "vacante-card";

          let botonHTML = "";
          if (vacante.cantidad > 1) {
            botonHTML = `<button class="btn-conseguir-una" data-id="${vacante.idVacante}">1 vacante conseguida</button>`;
          } else {
            botonHTML = `<button class="btn-conseguir" data-id="${vacante.idVacante}">Vacante conseguida</button>`;
          }

          card.innerHTML = `
            <div class="vacante-titulo">${vacante.Puesto}</div>
            <div class="vacante-area">${vacante.NombreArea}</div>
            <div class="vacante-detalle"><span class="vacante-etiqueta">Vacantes solicitadas:</span> ${vacante.cantidad}</div>
            <div class="vacante-detalle"><span class="vacante-etiqueta">Perfil:</span> ${vacante.Perfil}</div>
            <div class="vacante-detalle"><span class="vacante-etiqueta">Habilidades:</span> ${vacante.Habilidades}</div>
            ${botonHTML}
          `;

          // Botón para restar 1 vacante
          const botonUna = card.querySelector(".btn-conseguir-una");
          if (botonUna) {
            botonUna.addEventListener("click", async function () {
              const id = this.getAttribute("data-id");
              try {
                const res = await fetch(`/api/vacantes/${id}/restar`, { method: "PUT" });
                if (!res.ok) throw new Error("Error al restar vacante");

                const result = await res.json();
                 Swal.fire({
          icon: "success",
          title: "Listo",
          text: "1 vacante conseguida",
          confirmButtonColor: "#3085d6",
          confirmButtonText: "Aceptar",
        });

                // 🔁 Volver a cargar toda la lista actualizada
                cargarVacantes();
              } catch (err) {
                console.error("Error al restar cantidad:", err);
                alert("No se pudo actualizar la cantidad.");
              }
            });
          }

          // Botón para marcar como inactiva
          const boton = card.querySelector(".btn-conseguir");
          if (boton) {
            boton.addEventListener("click", async function () {
              const id = this.getAttribute("data-id");
              try {
                const res = await fetch(`/api/vacantes/${id}`, {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ Estado: "Inactivo" }),
                });
                if (!res.ok) throw new Error("Error al actualizar la vacante");

                Swal.fire({
          icon: "success",
          title: "Listo",
          text: "Vacante conseguida",
          confirmButtonColor: "#3085d6",
          confirmButtonText: "Aceptar",
        });
                cargarVacantes();
              } catch (error) {
                console.error("Error al actualizar la vacante:", error);
                alert("❌ No se pudo actualizar la vacante.");
              }
            });
          }

          contenedor.appendChild(card);
        });
      } else {
        contenedor.innerHTML = "<p>No hay solicitudes de vacantes registradas.</p>";
      }
    } catch (error) {
      contenedor.innerHTML = "<p>Error al cargar las vacantes.</p>";
      console.error("❌ Error cargando vacantes:", error);
    }
  }

  // 👇 Se ejecuta al cargar la página
  cargarVacantes();
});
