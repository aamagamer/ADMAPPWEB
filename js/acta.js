const input = document.getElementById("employee-input");
const dropdown = document.getElementById("employee-dropdown");
let selectedId = null;

const modal = document.getElementById("modal-confirmacion");
const resumen = document.getElementById("resumen-acta");
const btnConfirmar = document.getElementById("btn-confirmar");
const btnCancelar = document.getElementById("btn-cancelar");

const form = document.getElementById("acta-form");

// Buscar empleados
input.addEventListener("input", async () => {
  const query = input.value.trim();
  if (query.length < 2) {
    dropdown.style.display = "none";
    selectedId = null;
    return;
  }
  try {
    const res = await fetch(`/api/usuarios/buscar?q=${encodeURIComponent(query)}`);
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

// Ocultar dropdown al hacer click fuera
document.addEventListener("click", (e) => {
  if (!input.contains(e.target) && !dropdown.contains(e.target)) {
    dropdown.style.display = "none";
  }
});

form.addEventListener("submit", (e) => {
  e.preventDefault();

  if (!selectedId) {
    Swal.fire({ icon: "error", title: "Error", text: "Por favor selecciona un empleado válido", confirmButtonColor: "#174e89" });
    return;
  }

  const selectTipoActa = document.getElementById("subject");
  const tipoActaId = selectTipoActa.value;
  if (!tipoActaId) {
    Swal.fire({ icon: "error", title: "Error", text: "Por favor selecciona un tipo de acta", confirmButtonColor: "#174e89" });
    return;
  }

  const observaciones = document.getElementById("observations").value.trim();
  const fecha = document.getElementById("fecha-acta").value;
  if (!fecha) {
    Swal.fire({ icon: "error", title: "Error", text: "Por favor selecciona la fecha del acta", confirmButtonColor: "#174e89" });
    return;
  }

  // Resumen
  resumen.textContent =
    `Empleado: ${input.value}\n` +
    `Tipo de acta: ${selectTipoActa.options[selectTipoActa.selectedIndex].text}\n` +
    `Fecha del acta: ${fecha}\n\n` +
    `Descripción de los hechos:\n${observaciones}`;

  modal.classList.add("show");
});

btnCancelar.addEventListener("click", () => {
  modal.classList.remove("show");
});

btnConfirmar.addEventListener("click", () => {
  // 🔧 Solución bug: cerrar modal ANTES de swal
  modal.classList.remove("show");

  const selectTipoActa = document.getElementById("subject");
  const tipoActaId = selectTipoActa.value;
  const observaciones = document.getElementById("observations").value.trim();
  const fecha = document.getElementById("fecha-acta").value;

  const comentario = `OBSERVACIONES:\n${observaciones}`;

  Swal.fire({ title: "Guardando acta...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });

  fetch("/api/actas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idUsuario: selectedId, idAsunto: tipoActaId, FechaActa: fecha, Comentario: comentario }),
  })
    .then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar el acta");
      return data;
    })
    .then((data) => {
      Swal.fire({
        icon: "success",
        title: "Acta creada",
        text: data.message || "El acta administrativa ha sido registrada correctamente",
        confirmButtonColor: "#174e89"
      }).then(() => {
        form.reset();
        input.value = "";
        selectedId = null;
        document.getElementById("subject").value = "";
      });
    })
    .catch((err) => {
      console.error("Error:", err);
      Swal.fire({ icon: "error", title: "Error", text: err.message || "Error al enviar el acta", confirmButtonColor: "#174e89" });
    });
});

// Cerrar modal al hacer clic fuera
modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.classList.remove("show");
  }
});

// Cargar tipos de acta
document.addEventListener("DOMContentLoaded", async () => {
  const selectTipoActa = document.getElementById("subject");

  try {
    const res = await fetch("/api/asuntos");
    if (!res.ok) throw new Error("Error en la respuesta");
    const data = await res.json();

    // Resetear opciones
    selectTipoActa.innerHTML = '<option value="">Seleccione el tipo de acta</option>';

    // Usamos tu estructura: id / texto
    data.forEach((asunto) => {
      const option = document.createElement("option");
      option.value = asunto.id;
      option.textContent = asunto.texto;
      selectTipoActa.appendChild(option);
    });
  } catch (err) {
    console.error("Error al cargar tipos de acta:", err);
    Swal.fire({ icon: "error", title: "Error", text: "No se pudieron cargar los tipos de acta", confirmButtonColor: "#174e89" });
  }
});
