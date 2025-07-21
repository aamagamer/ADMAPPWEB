function toggleAreas(context = "") {
  const prefix = context ? context + "-" : "";

  const contenedor = document.getElementById(`${prefix}checkbox-areas`);
  const boton = document.getElementById(`${prefix}toggle-areas`);

  if (!contenedor || !boton) return;

  if (contenedor.classList.contains("abierto")) {
    contenedor.classList.remove("abierto");
    boton.textContent = "Mostrar Áreas ▼";
  } else {
    contenedor.classList.add("abierto");
    boton.textContent = "Ocultar Áreas ▲";
  }
}

// Verificar si el usuario está logueado
function verificarSesion() {
  const idUsuario = localStorage.getItem("idUsuario");
  if (!idUsuario) {
    window.location.href = "index.html"; // Redirigir al login si no hay sesión
  }
  return idUsuario;
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

// Uso en tu página:
document.addEventListener("DOMContentLoaded", function () {
  // Verificar sesión y obtener ID de usuario
  const idUsuario = verificarSesion();

  cargarNotificaciones();
  setInterval(cargarNotificaciones, 1200000);

  // Cargar datos del usuario
  if (idUsuario) {
    cargarNombreUsuario(idUsuario);

    // Cargar lista de empleados
    fetch("/api/empleados")
      .then((response) => response.json())
      .then((data) => {
        const tbody = document.getElementById("empleados-body");
        tbody.innerHTML = "";
        data.forEach((emp) => {
          const row = document.createElement("tr");
          row.innerHTML = `
                        <td>${emp.id}</td>
                        <td>${emp.nombre}</td>
                        <td>${emp.puesto}</td>
                        <td>
                            <button class="action-btn" onclick="verEmpleado(${emp.id})">
                                <i class="bi bi-eye"></i>
                            </button>
                            <button class="action-btn" onclick="editarEmpleado(${emp.id})">
                                <i class="bi bi-pencil"></i>
                            </button>
                            
                        </td>
                    `;
          tbody.appendChild(row);
        });
      })
      .catch((error) => {
        console.error("Error al cargar empleados:", error);
      });
  }
});

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

// Cargar lista de empleados
fetch("/api/empleados")
  .then((response) => response.json())
  .then((data) => {
    const tbody = document.getElementById("empleados-body");
    tbody.innerHTML = "";
    data.forEach((emp) => {
      const row = document.createElement("tr");
      row.innerHTML = `
          <td>${emp.id}</td>
          <td>${emp.nombre}</td>
          <td>${emp.puesto}</td>
          <td>
            <button class="action-btn" onclick="verEmpleado(${emp.id})">
  <i class="bi bi-eye"></i>
</button>
<button class="action-btn" onclick="editarEmpleado(${emp.id})">
  <i class="bi bi-pencil"></i>
</button>
<button class="action-btn" onclick="abrirModalBajaEmpleado(${emp.id})">
  <i class="bi bi-trash"></i>
</button>

          </td>
        `;
      tbody.appendChild(row);
    });
  })
  .catch((error) => {
    console.error("Error al cargar empleados:", error);
  });

function verEmpleado(id) {
  fetch(`/api/empleado/${id}`)
    .then((res) => {
      if (!res.ok) throw new Error("Error al cargar datos del empleado");
      return res.json();
    })
    .then((data) => {
      const modalBody = document.getElementById("modal-body");

      const renderField = (label, value) => {
        const texto =
          value === null ||
          value === undefined ||
          value === "" ||
          value === "null"
            ? "Sin información"
            : value;
        return `<p><strong>${label}:</strong> ${texto}</p>`;
      };

      // Construir una cadena de texto con todas las áreas
      const areasTexto =
        data.Areas && data.Areas.length > 0
          ? data.Areas.map((area) => area.NombreArea).join(", ")
          : "Sin información";

      modalBody.innerHTML = `
        ${renderField("ID", data.idUsuario)}
        ${renderField("Rol", data.TipoRol)}
        ${renderField("Áreas", areasTexto)}
        ${renderField(
          "Nombre Completo",
          `${data.Nombres} ${data.Paterno} ${data.Materno}`
        )}
        ${renderField("Fecha Nacimiento", data.FechaNacimiento)}
        ${renderField("Dirección", data.Direccion)}
        ${renderField("Código Postal", data.CodigoPostal)}
        ${renderField("Correo", data.Correo)}
        ${renderField("NSS", data.NSS)}
        ${renderField("Teléfono", data.Telefono)}
        ${renderField("Fecha Ingreso", data.FechaIngreso)}
        ${renderField("RFC", data.RFC)}
        ${renderField("CURP", data.Curp)}
        ${renderField("Puesto", data.Puesto)}
        ${renderField("Contacto Emergencia", data.NombreContactoEmergencia)}
        ${renderField("Teléfono Emergencia", data.TelefonoEmergencia)}
        ${renderField("Parentesco", data.Parentesco)}
        ${renderField("Fecha Baja", data.FechaBaja)}
        ${renderField("Comentario Salida", data.ComentarioSalida)}
        ${renderField("Clave", data.clave)}
        ${renderField("Estado", data.Estado)}
        ${renderField("Sueldo Diario", data.SueldoDiario)}
        ${renderField("Sueldo Semanal", data.SueldoSemanal)}
        ${renderField("Bono Semanal", data.BonoSemanal)}
        ${renderField("Vacaciones", data.Vacaciones)}
        ${renderField("Vacaciones disponibles", data.DiasDisponibles)}
      `;

      document.getElementById("modal").classList.remove("hidden");
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("Error al cargar los datos del empleado");
    });
}

function cerrarModal() {
  document.getElementById("modal").classList.add("hidden");
}

function abrirModalAltaEmpleado() {
  // Mostrar el modal
  document.getElementById("add-employee-modal").classList.remove("hidden");

  // Llenar roles
  fetch("/api/roles")
    .then((res) => res.json())
    .then((data) => {
      const selectRol = document.getElementById("tipoRol");
      selectRol.innerHTML = '<option value="">Seleccione un rol</option>';
      data.forEach((rol) => {
        const option = document.createElement("option");
        option.value = rol.idRol;
        option.textContent = rol.TipoRol;
        selectRol.appendChild(option);
      });
    });

  // Llenar áreas como checkboxes
  fetch("/api/areas")
    .then((res) => res.json())
    .then((data) => {
      const container = document.getElementById("checkbox-areas");
      container.innerHTML = "";

      data.forEach((area) => {
        const item = document.createElement("div");
        item.className = "area-item";

        const label = document.createElement("label");
        label.textContent = area.NombreArea;
        label.className = "area-label";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.name = "areas";
        checkbox.value = area.idArea;
        checkbox.className = "area-checkbox";

        item.appendChild(label);
        item.appendChild(checkbox);
        container.appendChild(item);
      });
    });
}

function cargarAreasParaEditar(idUsuario, areasSeleccionadas) {
  fetch("/api/areas")
    .then((res) => res.json())
    .then((areas) => {
      const container = document.getElementById("edit-checkbox-areas");
      container.innerHTML = "";

      areas.forEach((area) => {
        const wrapper = document.createElement("div");
        wrapper.className = "area-item";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.name = "areas";
        checkbox.value = area.idArea;
        checkbox.id = `area-${area.idArea}`;
        checkbox.checked = areasSeleccionadas.includes(area.idArea);
        checkbox.className = "area-checkbox";

        const label = document.createElement("label");
        label.htmlFor = checkbox.id;
        label.className = "area-label";
        label.textContent = area.NombreArea;

        wrapper.appendChild(label);
        wrapper.appendChild(checkbox);

        container.appendChild(wrapper);
      });
    });
}

function cerrarModalAltaEmpleado() {
  document.getElementById("add-employee-modal").classList.add("hidden");
}

//Dar de alta a empleado
document
  .getElementById("employee-form")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    const fechaIngreso = document.getElementById("fechaIngreso").value;
    const diasVacaciones = calcularDiasVacaciones(fechaIngreso);

    const contraseña = document.getElementById("contraseña").value;
    const confirmarContraseña = document.getElementById(
      "confirmarContraseña"
    ).value;

    if (contraseña !== confirmarContraseña) {
      alert("Las contraseñas no coinciden");
      return;
    }

    const formData = new FormData(this);
    const empleadoData = {};

    formData.forEach((value, key) => {
      empleadoData[key] = value;
    });

    // Obtener las áreas seleccionadas (checkboxes)
    const areasSeleccionadas = Array.from(
      document.querySelectorAll('input[name="areas"]:checked')
    ).map((cb) => parseInt(cb.value));

    if (areasSeleccionadas.length === 0) {
      alert("Debes seleccionar al menos un área.");
      return;
    }

    empleadoData.areas = areasSeleccionadas;

    // Mapear y limpiar campos adicionales
    empleadoData.rol_id = empleadoData.tipoRol;
    delete empleadoData.tipoRol;
    delete empleadoData.nombreArea; // ← ya no se usa

    // Agregar días de vacaciones
    empleadoData.Vacaciones = diasVacaciones;

    // Convertir a número
    empleadoData.idUsuario = Number(empleadoData.idUsuario);
    empleadoData.nss = Number(empleadoData.nss);
    empleadoData.telefono = Number(empleadoData.telefono);
    empleadoData.telefonoEmergencia = Number(empleadoData.telefonoEmergencia);
    empleadoData.SueldoDiario = Number(empleadoData.SueldoDiario);
    empleadoData.SueldoSemanal = Number(empleadoData.SueldoSemanal);
    empleadoData.BonoSemanal = Number(empleadoData.BonoSemanal);
    empleadoData.Vacaciones = Number(empleadoData.Vacaciones);
    empleadoData.diasDisponibles = Number(empleadoData.diasDisponibles);

    // Validaciones finales
    if (
      isNaN(empleadoData.idUsuario) ||
      isNaN(empleadoData.nss) ||
      isNaN(empleadoData.telefono) ||
      isNaN(empleadoData.telefonoEmergencia) ||
      isNaN(empleadoData.SueldoDiario) ||
      isNaN(empleadoData.SueldoSemanal) ||
      isNaN(empleadoData.BonoSemanal)
    ) {
      alert(
        "Por favor, ingresa valores numéricos válidos en los campos requeridos."
      );
      return;
    }

    // Enviar al backend
    fetch("/api/empleado", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(empleadoData),
    })
      .then((res) => {
        if (!res.ok)
          return res.json().then((data) => {
            throw new Error(data.error || "Error al guardar el empleado");
          });
        return res.json();
      })
      .then((data) => {
        alert(data.mensaje);
        cerrarModalAltaEmpleado();
        location.reload(); // o actualiza tabla sin recargar
      })
      .catch((error) => {
        console.error("Error al insertar:", error);
        alert("Hubo un error al guardar el empleado: " + error.message);
      });
  });

// Alternativa para manejar zona horaria
function formatoFechaParaInput(fecha) {
  if (!fecha) return "";

  // Si ya está en formato YYYY-MM-DD
  if (typeof fecha === "string" && fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return fecha;
  }

  // Parsear fecha y ajustar por zona horaria
  const date = new Date(fecha);
  const offset = date.getTimezoneOffset();
  date.setMinutes(date.getMinutes() + offset);

  return date.toISOString().split("T")[0];
}

function editarEmpleado(id) {
  document.getElementById("edit-employee-modal").classList.remove("hidden");

  fetch(`/api/empleado/${id}`)
    .then((res) => {
      if (!res.ok) throw new Error("Error al obtener datos del empleado");
      return res.json();
    })
    .then((data) => {
      Promise.all([
        fetch("/api/roles").then((res) => res.json()),
        fetch("/api/areas").then((res) => res.json()),
      ]).then(([roles, areas]) => {
        const selectRol = document.getElementById("edit-tipoRol");

        // Llenar roles
        selectRol.innerHTML = '<option value="">Seleccione un rol</option>';
        roles.forEach((rol) => {
          const option = document.createElement("option");
          option.value = rol.idRol;
          option.textContent = rol.TipoRol;
          selectRol.appendChild(option);
        });

        // Llenar campos del formulario
        document.getElementById("edit-idUsuario").value = data.idUsuario || "";
        document.getElementById("edit-tipoRol").value = data.Rol_idRol || "";
        document.getElementById("edit-nombres").value = data.Nombres || "";
        document.getElementById("edit-paterno").value = data.Paterno || "";
        document.getElementById("edit-materno").value = data.Materno || "";
        document.getElementById("edit-fechaNacimiento").value =
          formatoFechaParaInput(data.FechaNacimiento);
        document.getElementById("edit-direccion").value = data.Direccion || "";
        document.getElementById("edit-codigoPostal").value =
          data.CodigoPostal || "";
        document.getElementById("edit-correo").value = data.Correo || "";
        document.getElementById("edit-nss").value = data.NSS || "";
        document.getElementById("edit-telefono").value = data.Telefono || "";
        document.getElementById("edit-rfc").value = data.RFC || "";
        document.getElementById("edit-curp").value = data.Curp || "";
        document.getElementById("edit-puesto").value = data.Puesto || "";
        document.getElementById("edit-nombreContactoEmergencia").value =
          data.NombreContactoEmergencia || "";
        document.getElementById("edit-telefonoEmergencia").value =
          data.TelefonoEmergencia || "";
        document.getElementById("edit-parentesco").value =
          data.Parentesco || "";
        document.getElementById("edit-contraseña").value = data.clave || "";
        document.getElementById("edit-confirmarContraseña").value =
          data.clave || "";
        document.getElementById("edit-sueldoDiario").value =
          data.SueldoDiario || "";
        document.getElementById("edit-sueldoSemanal").value =
          data.SueldoSemanal || "";
        document.getElementById("edit-bonoSemanal").value =
          data.BonoSemanal || "";
        document.getElementById("edit-fechaBaja").value = formatoFechaParaInput(
          data.FechaBaja
        );
        document.getElementById("edit-comentarioSalida").value =
          data.ComentarioSalida || "";

        const fechaIngresoInput = document.getElementById("edit-fechaIngreso");
        fechaIngresoInput.value = formatoFechaParaInput(data.FechaIngreso);

        const campoVacaciones = document.getElementById("edit-vacaciones");
        campoVacaciones.value =
          data.Vacaciones != null
            ? data.Vacaciones
            : calcularDiasVacaciones(fechaIngresoInput.value);

        document.getElementById("edit-diasDisponibles").value =
          data.DiasDisponibles || 0;

        // ✅ Cargar áreas como checkboxes
        const idsDeAreas = (data.Areas || []).map((area) => area.idArea);
        cargarAreasParaEditar(data.idUsuario, idsDeAreas);

        // Recalcular vacaciones si cambia la fecha de ingreso
        fechaIngresoInput.addEventListener("change", function () {
          const nuevaFecha = this.value;
          const dias = calcularDiasVacaciones(nuevaFecha);
          document.getElementById("edit-vacaciones").value = dias;
        });
      });
    })
    .catch((error) => {
      console.error("Error al cargar datos del empleado:", error);
      alert("No se pudieron cargar los datos del empleado.");
    });
}

function cerrarModalEditarEmpleado() {
  document.getElementById("edit-employee-modal").classList.add("hidden");
}

function buscarEmpleado() {
  const termino = document
    .getElementById("busquedaEmpleado")
    .value.toLowerCase();

  fetch("/api/empleados")
    .then((res) => res.json())
    .then((empleados) => {
      const resultados = empleados.filter(
        (emp) =>
          emp.id.toString().includes(termino) ||
          emp.nombre.toLowerCase().includes(termino)
      );

      const tbody = document.getElementById("empleados-body");
      tbody.innerHTML = "";

      if (resultados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4">No se encontraron empleados</td></tr>`;
      } else {
        resultados.forEach((emp) => {
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${emp.id}</td>
            <td>${emp.nombre}</td>
            <td>${emp.puesto}</td>
            <td>
              <button class="action-btn" onclick="verEmpleado(${emp.id})">
                <i class="bi bi-eye"></i>
              </button>
              <button class="action-btn" onclick="editarEmpleado(${emp.id})">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="action-btn" onclick="abrirModalBajaEmpleado(${emp.id})">
                <i class="bi bi-trash"></i>
              </button>
            </td>
          `;
          tbody.appendChild(row);
        });
      }
    })
    .catch((error) => {
      console.error("Error en búsqueda:", error);
    });
}

document
  .getElementById("edit-employee-form")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    const contraseña = document.getElementById("edit-contraseña").value;
    const confirmar = document.getElementById("edit-confirmarContraseña").value;

    if (contraseña !== confirmar) {
      alert("Las contraseñas no coinciden");
      return;
    }

    const empleadoData = {
      idUsuario: Number(document.getElementById("edit-idUsuario").value),
      rol_id: document.getElementById("edit-tipoRol").value,
      nombres: document.getElementById("edit-nombres").value,
      paterno: document.getElementById("edit-paterno").value,
      materno: document.getElementById("edit-materno").value,
      fechaNacimiento: document.getElementById("edit-fechaNacimiento").value,
      direccion: document.getElementById("edit-direccion").value,
      codigoPostal: document.getElementById("edit-codigoPostal").value,
      correo: document.getElementById("edit-correo").value,
      nss: Number(document.getElementById("edit-nss").value),
      telefono: Number(document.getElementById("edit-telefono").value),
      fechaIngreso: document.getElementById("edit-fechaIngreso").value,
      rfc: document.getElementById("edit-rfc").value,
      curp: document.getElementById("edit-curp").value,
      puesto: document.getElementById("edit-puesto").value,
      nombreContactoEmergencia: document.getElementById(
        "edit-nombreContactoEmergencia"
      ).value,
      telefonoEmergencia: Number(
        document.getElementById("edit-telefonoEmergencia").value
      ),
      parentesco: document.getElementById("edit-parentesco").value,
      contraseña: contraseña,
      SueldoDiario: Number(document.getElementById("edit-sueldoDiario").value),
      SueldoSemanal: Number(
        document.getElementById("edit-sueldoSemanal").value
      ),
      BonoSemanal: Number(document.getElementById("edit-bonoSemanal").value),
      fechaBaja: document.getElementById("edit-fechaBaja").value || null,
      comentarioSalida:
        document.getElementById("edit-comentarioSalida").value || null,
      Vacaciones: Number(document.getElementById("edit-vacaciones").value) || 0,
      diasDisponibles:
        Number(document.getElementById("edit-diasDisponibles").value) || 0,
    };

    // ✅ Agregar áreas seleccionadas
    const checkboxes = document.querySelectorAll(
      "#edit-checkbox-areas input[name='areas']:checked"
    );
    const areasSeleccionadas = Array.from(checkboxes).map((cb) =>
      parseInt(cb.value)
    );
    empleadoData.areas = areasSeleccionadas;

    fetch(`/api/empleado/${empleadoData.idUsuario}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(empleadoData),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error al actualizar el empleado");
        return res.json();
      })
      .then((data) => {
        alert(data.mensaje);
        cerrarModalEditarEmpleado();
        location.reload();
      })
      .catch((err) => {
        console.error("Error:", err);
        alert("Hubo un error al actualizar: " + err.message);
      });
  });

// Campos disponibles para exportación
const camposExportacion = [
  { id: "idUsuario", nombre: "ID Usuario" },
  { id: "TipoRol", nombre: "Tipo de Rol" },
  { id: "Areas", nombre: "Área" },
  { id: "Nombres", nombre: "Nombres" },
  { id: "Paterno", nombre: "Apellido Paterno" },
  { id: "Materno", nombre: "Apellido Materno" },
  { id: "FechaNacimiento", nombre: "Fecha Nacimiento" },
  { id: "Direccion", nombre: "Dirección" },
  { id: "CodigoPostal", nombre: "Código Postal" },
  { id: "Correo", nombre: "Correo Electrónico" },
  { id: "NSS", nombre: "Número de Seguro Social" },
  { id: "Telefono", nombre: "Teléfono" },
  { id: "FechaIngreso", nombre: "Fecha Ingreso" },
  { id: "RFC", nombre: "RFC" },
  { id: "Curp", nombre: "CURP" },
  { id: "Puesto", nombre: "Puesto" },
  { id: "NombreContactoEmergencia", nombre: "Contacto Emergencia" },
  { id: "TelefonoEmergencia", nombre: "Teléfono Emergencia" },
  { id: "Parentesco", nombre: "Parentesco" },
  { id: "FechaBaja", nombre: "Fecha Baja" },
  { id: "ComentarioSalida", nombre: "Comentario Salida" },
  { id: "Estado", nombre: "Estado" },
  { id: "SueldoDiario", nombre: "Sueldo Diario" },
  { id: "SueldoSemanal", nombre: "Sueldo Semanal" },
  { id: "BonoSemanal", nombre: "Bono Semanal" },
  { id: "Vacaciones", nombre: "Vacaciones" },
  { id: "DiasDisponibles", nombre: "Dias Disponibles" },
];

let camposSeleccionados = [];
let empleadosSeleccionados = [];

function abrirModalExportarExcel() {
  document.getElementById("export-excel-modal").classList.remove("hidden");
  mostrarPasoCampos();
}

function mostrarPasoCampos() {
  document.getElementById("paso-empleados").classList.remove("visible");
  document.getElementById("paso-campos").classList.remove("oculto");

  const container = document.getElementById("export-fields-container");
  container.innerHTML = "";

  camposExportacion.forEach((campo) => {
    const div = document.createElement("div");
    div.style.display = "flex";
    div.style.alignItems = "center";
    div.style.gap = "8px";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `export-${campo.id}`;
    checkbox.value = campo.id;
    checkbox.checked = true;

    const label = document.createElement("label");
    label.htmlFor = `export-${campo.id}`;
    label.textContent = campo.nombre;

    div.appendChild(checkbox);
    div.appendChild(label);
    container.appendChild(div);
  });
}

function mostrarPasoEmpleados() {
  // Guardar los campos seleccionados
  const checkboxes = document.querySelectorAll(
    '#export-fields-container input[type="checkbox"]:checked'
  );
  camposSeleccionados = Array.from(checkboxes).map((cb) => cb.value);

  if (camposSeleccionados.length === 0) {
    alert("Por favor selecciona al menos un campo para exportar");
    return;
  }

  document.getElementById("paso-campos").classList.add("oculto");
  document.getElementById("paso-empleados").classList.add("visible");

  // Cargar lista de empleados
  fetch("/api/empleados")
    .then((response) => response.json())
    .then((empleados) => {
      const container = document.getElementById("export-employees-container");
      container.innerHTML = "";

      empleados.forEach((emp) => {
        const div = document.createElement("div");
        div.style.display = "flex";
        div.style.alignItems = "center";
        div.style.gap = "8px";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = `emp-${emp.id}`;
        checkbox.value = emp.id;
        checkbox.checked = false;

        const label = document.createElement("label");
        label.htmlFor = `emp-${emp.id}`;
        label.textContent = `${emp.id} - ${emp.nombre}`;

        div.appendChild(checkbox);
        div.appendChild(label);
        container.appendChild(div);
      });
    })
    .catch((error) => {
      console.error("Error al cargar empleados:", error);
      alert("Error al cargar la lista de empleados");
    });
}

function toggleSeleccionarTodos() {
  const checkboxes = document.querySelectorAll(
    '#export-employees-container input[type="checkbox"]'
  );
  const allChecked = Array.from(checkboxes).every((cb) => cb.checked);

  checkboxes.forEach((checkbox) => {
    checkbox.checked = !allChecked;
  });
}

function exportarExcel() {
  // Obtener campos seleccionados correctamente al inicio
  const camposSeleccionados = Array.from(
    document.querySelectorAll(
      '#export-fields-container input[type="checkbox"]:checked'
    )
  ).map((cb) => cb.value);

  // Obtener empleados seleccionados
  const checkboxes = document.querySelectorAll(
    '#export-employees-container input[type="checkbox"]:checked'
  );
  const empleadosSeleccionados = Array.from(checkboxes).map((cb) => cb.value);

  if (empleadosSeleccionados.length === 0 || camposSeleccionados.length === 0) {
    alert(
      "Por favor selecciona al menos un empleado y al menos un campo para exportar"
    );
    return;
  }

  const exportBtn = document.querySelector("#paso-empleados .btn-primary");
  const originalText = exportBtn.textContent;
  exportBtn.textContent = "Generando...";
  exportBtn.disabled = true;

  const promises = empleadosSeleccionados.map((id) =>
    fetch(`/api/empleado/${id}`).then((res) => res.json())
  );

  Promise.all(promises)
    .then((empleadosCompletos) => {
      const datosExcel = empleadosCompletos.map((empleado) => {
        const fila = {};

        camposSeleccionados.forEach((campo) => {
          if (campo === "Areas" && Array.isArray(empleado.Areas)) {
            fila[campo] = empleado.Areas.map((a) => a.NombreArea).join(", ");
          } else {
            fila[campo] = empleado[campo] !== undefined ? empleado[campo] : "";
          }
        });

        return fila;
      });

      // Crear hoja Excel
      const worksheet = XLSX.utils.json_to_sheet(datosExcel, {
        header: camposSeleccionados,
      });

      // Aplicar estilo al encabezado
      const range = XLSX.utils.decode_range(worksheet["!ref"]);
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell_address = XLSX.utils.encode_cell({ r: 0, c: C });
        if (!worksheet[cell_address]) continue;

        worksheet[cell_address].s = {
          fill: {
            patternType: "solid",
            fgColor: { rgb: "FFFF00" }, // Amarillo
          },
          font: {
            bold: true,
          },
          alignment: {
            horizontal: "center",
          },
        };
      }

      // Ajustar ancho de columnas automáticamente
      worksheet["!cols"] = camposSeleccionados.map((campo) => {
        const maxLength = Math.max(
          campo.length,
          ...datosExcel.map((row) =>
            row[campo] ? row[campo].toString().length : 0
          )
        );
        return { wch: maxLength + 2 };
      });

      // Crear libro y descargar
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Empleados");

      XLSX.writeFile(workbook, "empleados_exportados.xlsx");
    })
    .catch((error) => {
      console.error("Error al exportar a Excel:", error);
      alert("Ocurrió un error al generar el archivo Excel: " + error.message);
    })
    .finally(() => {
      exportBtn.textContent = originalText;
      exportBtn.disabled = false;
      cerrarModalExportarExcel();
    });
}

function cerrarModalExportarExcel() {
  document.getElementById("export-excel-modal").classList.add("hidden");
  camposSeleccionados = [];
  empleadosSeleccionados = [];
}

function mostrarModalConfirmacion({
  texto,
  textoBotonConfirmar = "Confirmar",
  claseBotonConfirmar = "btn-danger",
  onConfirmar,
  onCancelar,
}) {
  const modal = document.getElementById("modal-confirmacion");
  const modalTexto = document.getElementById("modal-texto");
  const btnConfirmar = document.getElementById("modal-confirmar");
  const btnCancelar = document.getElementById("modal-cancelar");

  modalTexto.textContent = texto;

  // Cambiar texto y clases del botón confirmar
  btnConfirmar.textContent = textoBotonConfirmar;
  btnConfirmar.className = "btn " + claseBotonConfirmar;

  modal.classList.remove("hidden");

  // Remover listeners previos
  btnConfirmar.onclick = null;
  btnCancelar.onclick = null;

  btnConfirmar.onclick = () => {
    if (typeof onConfirmar === "function") onConfirmar();
    modal.classList.add("hidden");
  };

  btnCancelar.onclick = () => {
    if (typeof onCancelar === "function") onCancelar();
    modal.classList.add("hidden");
  };
}

function mostrarModalExito() {
  const modal = document.getElementById("modal-exito");
  const btnCerrar = document.getElementById("btn-cerrar-exito");

  modal.classList.remove("hidden");

  btnCerrar.onclick = () => {
    modal.classList.add("hidden");
  };
}
function calcularDiasVacaciones(fechaIngreso) {
  const hoy = new Date();
  const ingreso = new Date(fechaIngreso);

  let años = hoy.getFullYear() - ingreso.getFullYear();
  let meses = hoy.getMonth() - ingreso.getMonth();
  let dias = hoy.getDate() - ingreso.getDate();

  // Ajuste si aún no ha cumplido el año, mes y día exacto
  if (meses < 0 || (meses === 0 && dias < 0)) {
    años--;
  }

  console.log("Antigüedad exacta:", años, "años");

  // Tabla oficial LFT 2023
  let diasVacaciones = 0;
  if (años < 1) diasVacaciones = 0;
  else if (años === 1) diasVacaciones = 12;
  else if (años === 2) diasVacaciones = 14;
  else if (años === 3) diasVacaciones = 16;
  else if (años === 4) diasVacaciones = 18;
  else if (años === 5) diasVacaciones = 20;
  else if (años >= 6 && años <= 10) diasVacaciones = 22;
  else if (años >= 11 && años <= 15) diasVacaciones = 24;
  else if (años >= 16 && años <= 20) diasVacaciones = 26;
  else if (años >= 21 && años <= 25) diasVacaciones = 28;
  else if (años >= 26) diasVacaciones = 30;

  return diasVacaciones;
}

// Función para abrir el modal de días festivos
function abrirModalAgregarFestivo() {
  document.getElementById("add-holiday-modal").classList.remove("hidden");
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("fechaFestivo").value = today;
}

// Función para cerrar el modal de días festivos
function cerrarModalAgregarFestivo() {
  document.getElementById("add-holiday-modal").classList.add("hidden");
}

// Función para abrir el modal de baja
function abrirModalBajaEmpleado(idUsuario) {
  fetch(`/api/empleado/${idUsuario}`)
    .then((res) => {
      if (!res.ok) throw new Error("No se encontró el empleado");
      return res.json();
    })
    .then((empleado) => {
      document.getElementById(
        "nombre-empleado-baja"
      ).textContent = `${empleado.Nombres} ${empleado.Paterno} ${empleado.Materno}`;
      document.getElementById("id-empleado-baja").textContent = idUsuario;
      document.getElementById("baja-idUsuario").value = idUsuario;

      document.getElementById("modal-baja-empleado").classList.remove("hidden");
    })
    .catch((err) => {
      console.error("Error al cargar empleado:", err);
      alert("No se pudo abrir el modal de baja.");
    });
}

function cerrarModalBajaEmpleado() {
  document.getElementById("modal-baja-empleado").classList.add("hidden");
}

// Enviar solicitud de baja
document
  .getElementById("form-baja-empleado")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    const idUsuario = document.getElementById("baja-idUsuario").value;
    const fechaBaja = document.getElementById("baja-fecha").value;
    const comentarioSalida = document.getElementById("baja-comentario").value;

    if (!fechaBaja || !comentarioSalida) {
      alert("Todos los campos son obligatorios");
      return;
    }

    const body = {
      fechaBaja,
      comentarioSalida,
    };

    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Procesando...";

    fetch(`/api/empleado/baja/${idUsuario}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
      .then(async (res) => {
        let data = null;
        try {
          data = await res.json();
        } catch (_) {}

        if (!res.ok || !data) {
          throw new Error(data?.error || "Error al dar de baja al empleado");
        }
        return data;
      })
      .then((data) => {
        alert("Empleado dado de baja correctamente.");
        cerrarModalBajaEmpleado();
        setTimeout(() => location.reload(), 1000);
      })
      .catch((err) => {
        console.error("Error al dar de baja:", err);
        alert("Hubo un error al procesar la baja: " + err.message);
      })
      .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      });
  });

// Enviar día festivo
document
  .getElementById("holiday-form")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    const fecha = document.getElementById("fechaFestivo").value;
    const descripcion = document.getElementById("descripcionFestivo").value;
    const anio = new Date(fecha).getFullYear();

    fetch("/api/diafestivo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fecha: fecha,
        descripcion: descripcion,
        anio: anio,
      }),
    })
      .then((response) => {
        if (!response.ok) throw new Error("Error al guardar el día festivo");
        return response.json();
      })
      .then((data) => {
        alert("Día festivo agregado correctamente");
        cerrarModalAgregarFestivo();
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("Error al guardar el día festivo: " + error.message);
      });
  });
