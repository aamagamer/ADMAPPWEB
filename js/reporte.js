const input = document.getElementById("employee-input");
const dropdown = document.getElementById("employee-dropdown");
let selectedId = null;

const modal = document.getElementById("modal-confirmacion");
const resumen = document.getElementById("resumen-reporte");
const btnConfirmar = document.getElementById("btn-confirmar");
const btnCancelar = document.getElementById("btn-cancelar");

input.addEventListener("input", async () => {
  const query = input.value.trim();
  if (query.length < 2) {
    dropdown.style.display = "none";
    selectedId = null; // limpiar si se borra texto
    return;
  }
  try {
    const res = await fetch(
      `/api/usuarios/buscar?q=${encodeURIComponent(query)}`
    );
    const usuarios = await res.json();

    dropdown.innerHTML = "";
    if (usuarios.length === 0) {
      dropdown.style.display = "none";
      selectedId = null;
      return;
    }

    usuarios.forEach((user) => {
      const div = document.createElement("div");
      div.classList.add("autocomplete-item");
      div.textContent = user.nombreCompleto;
      div.dataset.id = user.idUsuario;
      div.addEventListener("click", () => {
        input.value = user.nombreCompleto;
        selectedId = user.idUsuario;
        dropdown.style.display = "none";
      });
      dropdown.appendChild(div);
    });

    dropdown.style.display = "block";
  } catch (e) {
    console.error("Error buscando empleados:", e);
    dropdown.style.display = "none";
    selectedId = null;
  }
});

// Ocultar dropdown si se hace click fuera
document.addEventListener("click", (e) => {
  if (!input.contains(e.target) && !dropdown.contains(e.target)) {
    dropdown.style.display = "none";
  }
});

const form = document.getElementById("report-form");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  if (!selectedId) {
    alert("Por favor selecciona un empleado válido de la lista");
    input.focus();
    return;
  }

  const asunto = document.getElementById("subject").value.trim();
  const observaciones = document.getElementById("observations").value.trim();

  // Mostrar resumen en modal
  resumen.textContent =
    `Empleado: ${input.value}\n` +
    `Asunto: ${asunto}\n\n` +
    `Observaciones:\n${observaciones}`;

  modal.classList.add("show");
});

// Cancelar en modal
btnCancelar.addEventListener("click", () => {
  modal.classList.remove("show");
});

// Confirmar envío
btnConfirmar.addEventListener("click", () => {
  const asunto = document.getElementById("subject").value.trim();
  const observaciones = document.getElementById("observations").value.trim();

  fetch("/api/reportes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      Usuario_idUsuario: selectedId,
      Asunto: asunto,
      Observaciones: observaciones,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      //alert(data.mensaje || "Reporte enviado correctamente");
      form.reset();
      input.value = "";
      selectedId = null;
      modal.classList.remove("show");
    })
    .catch((err) => {
      console.error(err);
      alert("Error al enviar el reporte.");
    });
});

// Opcional: cerrar modal si clicas fuera del contenido
modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.classList.remove("show");
  }
});