document.addEventListener("DOMContentLoaded", function () {
  const select = document.getElementById("position");
  const form = document.getElementById("vacancy-form");

  const modal = document.getElementById("modal-confirmacion");
  const resumenVacante = document.getElementById("resumen-vacante");
  const btnConfirmar = document.getElementById("btn-confirmar");
  const btnCancelar = document.getElementById("btn-cancelar");

  let payloadTemporal = {};

  fetch("/api/areas")
    .then((res) => res.json())
    .then((data) => {
      data.forEach((area) => {
        const option = document.createElement("option");
        option.value = area.idArea;
        option.textContent = area.NombreArea;
        select.appendChild(option);
      });
    })
    .catch((err) => {
      console.error("Error cargando áreas:", err);
      alert("Hubo un problema al cargar las áreas.");
    });

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const area_idarea = select.value;
    const areaTexto = select.options[select.selectedIndex].textContent;
    const puesto = document.getElementById("puesto").value;
    const perfil = document.getElementById("perfil").value;
    const habilidades = document.getElementById("habilidades").value;
    const Usuario_idUsuario = localStorage.getItem("idUsuario") || 105;

    payloadTemporal = {
      area_idarea: parseInt(area_idarea),
      Usuario_idUsuario: parseInt(Usuario_idUsuario),
      Puesto: puesto,
      Perfil: perfil,
      Habilidades: habilidades,
    };

    resumenVacante.innerHTML = `
            <p><strong>Área:</strong> ${areaTexto}</p>
            <p><strong>Puesto:</strong> ${puesto}</p>
            <p><strong>Perfil:</strong> ${perfil}</p>
            <p><strong>Habilidades:</strong> ${habilidades}</p>
          `;

    modal.classList.remove("hidden");
  });

  btnCancelar.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  btnConfirmar.addEventListener("click", () => {
    fetch("/api/vacante", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payloadTemporal),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error al enviar la solicitud");
        return res.json();
      })
      .then((data) => {
        //alert("✅ " + data.message);
        modal.classList.add("hidden");
        form.reset();
      })
      .catch((err) => {
        console.error("❌ Error:", err);
        alert("Ocurrió un error al enviar la solicitud.");
        modal.classList.add("hidden");
      });
  });
});
