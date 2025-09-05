// ===== VARIABLES GLOBALES =====
let empleadosVisibles = [];
let camposSeleccionados = [];
let empleadosSeleccionados = [];
let totalSolicitudesPendientes = 0;
let totalReportesPendientes = 0;

// Declaraciones globales para librerías externas
// Estas deben estar incluidas en el HTML como scripts
const Swal = window.Swal || {
  fire: (options) => {
    // Fallback si SweetAlert2 no está disponible
    if (typeof options === "object") {
      alert(options.text || options.title || "Mensaje");
    } else {
      alert(options);
    }
    return Promise.resolve({ isConfirmed: true });
  },
};

const ExcelJS = window.ExcelJS || null;

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
  { id: "Mensual", nombre: "Sueldo Mensual" },
  { id: "Vacaciones", nombre: "Vacaciones" },
  { id: "DiasDisponibles", nombre: "Dias Disponibles" },
  { id: "Empresa", nombre: "Empresa y Número de Acceso" },
];

// ===== UTILIDADES =====
const Utils = {
  // Verificar sesión
  verificarSesion() {
    const idUsuario = localStorage.getItem("idUsuario");
    if (!idUsuario) {
      window.location.href = "index.html";
    }
    return idUsuario;
  },

  // Formatear fecha para input
  formatoFechaParaInput(fecha) {
    if (!fecha) return "";
    if (typeof fecha === "string" && fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return fecha;
    }
    const date = new Date(fecha);
    const offset = date.getTimezoneOffset();
    date.setMinutes(date.getMinutes() + offset);
    return date.toISOString().split("T")[0];
  },

  // Formatear fecha local
  formatearFechaLocal(fecha) {
    try {
      if (!fecha || fecha === "null" || fecha === null || fecha === undefined) {
        return "Sin fecha";
      }
      const [anio, mes, dia] = fecha.split("-").map(Number);
      const fechaObj = new Date(anio, mes - 1, dia);
      if (isNaN(fechaObj.getTime())) {
        return "Fecha inválida";
      }
      return fechaObj.toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch (error) {
      console.error("Error al formatear fecha:", fecha, error);
      return "Error en fecha";
    }
  },

  // Calcular días de vacaciones
  calcularDiasVacaciones(fechaIngreso) {
    const hoy = new Date();
    const ingreso = new Date(fechaIngreso);
    hoy.setHours(0, 0, 0, 0);
    ingreso.setHours(0, 0, 0, 0);

    let años = hoy.getFullYear() - ingreso.getFullYear();
    const mesActual = hoy.getMonth();
    const diaActual = hoy.getDate();
    const mesIngreso = ingreso.getMonth();
    const diaIngreso = ingreso.getDate();

    if (
      mesActual < mesIngreso ||
      (mesActual === mesIngreso && diaActual < diaIngreso)
    ) {
      años--;
    }

    // Tabla LFT
    if (años < 1) return 0;
    if (años === 1) return 12;
    if (años === 2) return 14;
    if (años === 3) return 16;
    if (años === 4) return 18;
    if (años === 5) return 20;
    if (años >= 6 && años <= 10) return 22;
    if (años >= 11 && años <= 15) return 24;
    if (años >= 16 && años <= 20) return 26;
    if (años >= 21 && años <= 25) return 28;
    return 30;
  },

  // Control de scroll del body
  toggleBodyScroll(disable) {
    document.body.classList.toggle("no-scroll", disable);
  },
};

// ===== VALIDACIONES =====
const Validaciones = {
  regexCP: /^\d{5}$/,
  regexTelefono: /^(?:\d\s*){10}$/,
  regexCURP: /^[A-Z0-9]{18}$/i,
  regexRFC: /^[A-Z0-9]{13}$/i,
  regexNSS:
    /^(?:\d{11}|\d{2}-\d{2}-\d{2}-\d{4}-\d{1}|\d{2}-\d{2}-\d{2}-\d{2}-\d{2}-\d{1})$/,

  validarCamposObligatorios(prefix = "") {
    const getId = (id) => document.getElementById(prefix + id);

    // Definir el orden de los campos y cuáles son obligatorios
    const camposOrden = [
      { id: "idUsuario", nombre: "ID de Usuario", obligatorio: true },
      { id: "tipoRol", nombre: "Tipo de Rol", obligatorio: true },
      { id: "nombres", nombre: "Nombres", obligatorio: true },
      { id: "paterno", nombre: "Apellido Paterno", obligatorio: true },
      { id: "materno", nombre: "Apellido Materno", obligatorio: false }, // No obligatorio
      {
        id: "fechaNacimiento",
        nombre: "Fecha de Nacimiento",
        obligatorio: true,
      },
      { id: "direccion", nombre: "Dirección", obligatorio: true },
      { id: "codigoPostal", nombre: "Código Postal", obligatorio: true },
      { id: "correo", nombre: "Correo Electrónico", obligatorio: true },
      { id: "nss", nombre: "NSS", obligatorio: true },
      { id: "telefono", nombre: "Teléfono", obligatorio: true },
      { id: "fechaIngreso", nombre: "Fecha de Ingreso", obligatorio: true },
      { id: "rfc", nombre: "RFC", obligatorio: true },
      { id: "curp", nombre: "CURP", obligatorio: true },
      { id: "puesto", nombre: "Puesto", obligatorio: true },
      {
        id: "nombreContactoEmergencia",
        nombre: "Contacto de Emergencia",
        obligatorio: true,
      },
      {
        id: "telefonoEmergencia",
        nombre: "Teléfono de Emergencia",
        obligatorio: true,
      },
      { id: "parentesco", nombre: "Parentesco", obligatorio: true },
      { id: "contraseña", nombre: "Contraseña", obligatorio: true },
      {
        id: "confirmarContraseña",
        nombre: "Confirmar Contraseña",
        obligatorio: true,
      },
      { id: "sueldoDiario", nombre: "Sueldo Diario", obligatorio: true },
      { id: "sueldoSemanal", nombre: "Sueldo Semanal", obligatorio: true },
      { id: "bonoSemanal", nombre: "Bono Semanal", obligatorio: true },
      { id: "Mensual", nombre: "Sueldo Mensual", obligatorio: true },
      {
        id: "diasDisponibles",
        nombre: "Vacaciones Disponibles",
        obligatorio: true,
      },
      { id: "empresaAcceso", nombre: "Empresa y Acceso", obligatorio: false },
    ];

    // Limpiar estilos previos
    this.limpiarEstilosError(prefix);

    let primerCampoVacio = null;
    let todosLosAnterioresCompletos = true;

    for (const campo of camposOrden) {
      const elemento = getId(campo.id);
      if (!elemento) continue;

      const valor = elemento.value.trim();
      const estaVacio = valor === "";

      // Si el campo es obligatorio y está vacío
      if (campo.obligatorio && estaVacio) {
        // Si todos los campos anteriores están completos, este es el primer campo que falta
        if (todosLosAnterioresCompletos && !primerCampoVacio) {
          primerCampoVacio = { elemento, nombre: campo.nombre };
        }

        // Si hay campos anteriores incompletos, marcar este como error también
        if (!todosLosAnterioresCompletos) {
          this.marcarCampoError(elemento, `Este campo es obligatorio`);
        }
      }

      // Si encontramos un campo obligatorio vacío, los siguientes ya no pueden estar "completos en orden"
      if (campo.obligatorio && estaVacio) {
        todosLosAnterioresCompletos = false;
      }
    }

    // Marcar el primer campo vacío encontrado
    if (primerCampoVacio) {
      this.marcarCampoError(
        primerCampoVacio.elemento,
        `Este campo es obligatorio`
      );
      primerCampoVacio.elemento.focus();

      Swal.fire({
        icon: "warning",
        title: "Campo obligatorio",
        text: `Debes completar el campo: ${primerCampoVacio.nombre}`,
        confirmButtonColor: "#3085d6",
        confirmButtonText: "Aceptar",
      });

      return false;
    }

    return true;
  },

  marcarCampoError(elemento, mensaje) {
    // Agregar clase de error al input
    elemento.classList.add("campo-error");

    // Buscar o crear el mensaje de error
    let mensajeError = elemento.parentNode.querySelector(".mensaje-error");
    if (!mensajeError) {
      mensajeError = document.createElement("div");
      mensajeError.className = "mensaje-error";
      elemento.parentNode.appendChild(mensajeError);
    }

    mensajeError.textContent = mensaje;
    mensajeError.style.display = "block";
  },

  limpiarEstilosError(prefix = "") {
    // Remover todas las clases de error
    const camposConError = document.querySelectorAll(".campo-error");
    camposConError.forEach((campo) => {
      campo.classList.remove("campo-error");
    });

    // Ocultar todos los mensajes de error
    const mensajesError = document.querySelectorAll(".mensaje-error");
    mensajesError.forEach((mensaje) => {
      mensaje.style.display = "none";
    });
  },

  validarContraseñas(contraseña, confirmarContraseña) {
    if (contraseña !== confirmarContraseña) {
      Swal.fire({
        icon: "warning",
        title: "Contraseñas no coinciden",
        text: "La contraseña y su confirmación deben ser iguales.",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "Aceptar",
      });
      return false;
    }
    return true;
  },

  // Validar campos del formulario (función existente)
  validarCampos(prefix = "") {
    if (!this.validarCamposObligatorios(prefix)) {
      return false;
    }

    const getId = (id) => document.getElementById(prefix + id);

    const codigoPostal = getId("codigoPostal").value.trim();
    const telefono = getId("telefono").value.trim();
    const telefonoEmergencia = getId("telefonoEmergencia").value.trim();
    const curp = getId("curp").value.trim();
    const rfc = getId("rfc").value.trim();
    const nss = getId("nss").value.trim();

    const validaciones = [
      {
        test: this.regexCP.test(codigoPostal),
        mensaje: "El código postal debe tener 5 dígitos.",
      },
      {
        test: this.regexTelefono.test(telefono),
        mensaje: "El número telefónico debe de tener 10 dígitos.",
      },
      {
        test: this.regexTelefono.test(telefonoEmergencia),
        mensaje: "El número telefónico de emergencia debe de tener 10 dígitos.",
      },
      {
        test: this.regexCURP.test(curp),
        mensaje: "La CURP debe tener 18 caracteres alfanúmericos.",
      },
      {
        test: this.regexRFC.test(rfc),
        mensaje: "El RFC debe tener 13 caracteres alfánumericos.",
      },
      {
        test: this.regexNSS.test(nss),
        mensaje:
          "El NSS debe de contener 11 dígitos, puede contener guión o no.",
      },
    ];

    for (const validacion of validaciones) {
      if (!validacion.test) {
        Swal.fire({
          icon: "warning",
          title: "Campo incorrecto",
          text: validacion.mensaje,
          confirmButtonColor: "#3085d6",
          confirmButtonText: "Aceptar",
        });
        return false;
      }
    }
    return true;
  },
};

// ===== DROPDOWN =====
const Dropdown = {
  toggle() {
    const dropdown = document.getElementById("dropdownContent");
    const button = document.querySelector(".dropdown-button");
    dropdown.classList.toggle("show");
    button.classList.toggle("active");
  },

  navigateToOption(url) {
    window.location.href = url;
  },

  // Cerrar dropdown al hacer clic fuera
  init() {
    window.onclick = (event) => {
      if (
        !event.target.matches(".dropdown-button") &&
        !event.target.closest(".dropdown-button")
      ) {
        const dropdowns = document.getElementsByClassName("dropdown-content");
        for (const dropdown of dropdowns) {
          if (dropdown.classList.contains("show")) {
            dropdown.classList.remove("show");
            document
              .querySelector(".dropdown-button")
              .classList.remove("active");
          }
        }
      }
    };
  },
};

// ===== API CALLS =====
const API = {
  // Cargar notificaciones
  async cargarNotificaciones() {
    try {
      const idUsuario = localStorage.getItem("idUsuario");
      if (!idUsuario) return;

      const response = await fetch(`/api/totalSolicitudes/${idUsuario}`);
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

      const data = await response.json();
      totalSolicitudesPendientes = data.total || 0;

      // Actualizar badges de solicitudes
      const badges = [
        "notificacion-solicitudes",
        "dropdown-notificacion-solicitudes",
      ];
      badges.forEach((badgeId) => {
        const badge = document.getElementById(badgeId);
        if (badge) {
          if (totalSolicitudesPendientes > 0) {
            badge.textContent = totalSolicitudesPendientes;
            badge.style.display = badgeId.includes("dropdown")
              ? "inline-flex"
              : "inline-block";
          } else {
            badge.style.display = "none";
          }
        }
      });

      actualizarBadgeMenu();
    } catch (error) {
      console.error("Error al cargar notificaciones:", error);
    }
  },

  async cargarNotificacionesReportes() {
    try {
      const response = await fetch(`/api/reportesPendientes`);
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

      const data = await response.json();
      totalReportesPendientes = data.pendientes || 0;

      // Actualizar badges de reportes
      const badges = [
        "notificacion-reportes",
        "dropdown-notificacion-reportes",
      ];
      badges.forEach((badgeId) => {
        const badge = document.getElementById(badgeId);
        if (badge) {
          if (totalReportesPendientes > 0) {
            badge.textContent = totalReportesPendientes;
            badge.style.display = badgeId.includes("dropdown")
              ? "inline-flex"
              : "inline-block";
          } else {
            badge.style.display = "none";
          }
        }
      });

      actualizarBadgeMenu();
    } catch (error) {
      console.error("Error al cargar notificaciones de reportes:", error);
    }
  },

  

  // Cargar nombre de usuario
  async cargarNombreUsuario(idUsuario) {
    try {
      const response = await fetch("/api/usuario/nombre", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idUsuario }),
      });

      if (!response.ok)
        throw new Error("Error al obtener el nombre del usuario");

      const data = await response.json();
      if (data.error) {
        console.error(data.error);
        document.getElementById("employee-name").textContent = "Administrador";
      } else {
        let nombreCompleto = data.nombres || "";
        if (data.paterno) nombreCompleto += ` ${data.paterno}`;
        if (data.materno) nombreCompleto += ` ${data.materno}`;
        document.getElementById("employee-name").textContent =
          nombreCompleto.trim() || "Administrador";
      }
    } catch (error) {
      console.error("Error al cargar nombre:", error);
      document.getElementById("employee-name").textContent = "Administrador";
    }
  },

  // Cargar áreas
  async cargarAreas() {
    try {
      const response = await fetch("/api/areas");
      const areas = await response.json();

      const selectArea = document.getElementById("filtro-area");
      selectArea.innerHTML = '<option value="">Todas las áreas</option>';

      areas.forEach((area) => {
        const option = document.createElement("option");
        option.value = area.idArea;
        option.textContent = area.NombreArea;
        selectArea.appendChild(option);
      });
    } catch (error) {
      console.error("Error al cargar las áreas:", error);
    }
  },

  async agregarEmpresa(nombreEmpresa) {
    try {
      const response = await fetch("/api/agregarAcceso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Acceso: nombreEmpresa }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al guardar la empresa");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("❌ Error al agregar empresa:", error);
      throw error;
    }
  },

  // Cargar empleado por ID
  async cargarEmpleado(id) {
    const response = await fetch(`/api/empleado/${id}`);
    if (!response.ok) throw new Error("Error al cargar datos del empleado");
    return response.json();
  },

  // Cargar roles
  async cargarRoles() {
    const response = await fetch("/api/roles");
    return response.json();
  },
};

// ===== MODALES =====
const Modales = {
  // Abrir/cerrar modal genérico
  toggle(modalId, show) {
    const modal = document.getElementById(modalId);
    modal.classList.toggle("hidden", !show);
    Utils.toggleBodyScroll(show);
  },

  // Modal de confirmación
  mostrarConfirmacion({
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
    btnConfirmar.textContent = textoBotonConfirmar;
    btnConfirmar.className = "btn " + claseBotonConfirmar;

    modal.classList.remove("hidden");

    btnConfirmar.onclick = () => {
      if (typeof onConfirmar === "function") onConfirmar();
      modal.classList.add("hidden");
    };

    btnCancelar.onclick = () => {
      if (typeof onCancelar === "function") onCancelar();
      modal.classList.add("hidden");
    };
  },

  // Renderizar campo para modal de empleado
  renderField(label, value) {
    const texto =
      value === null || value === undefined || value === "" || value === "null"
        ? "Sin información"
        : value;
    return `<p><strong>${label}:</strong> ${texto}</p>`;
  },
};

function actualizarBadgeMenu() {
  const badgeMenu = document.getElementById("menu-notificacion");
  if (!badgeMenu) return;

  const total = totalSolicitudesPendientes + totalReportesPendientes;
  if (total > 0) {
    badgeMenu.textContent = total;
    badgeMenu.style.display = "inline-flex";
  } else {
    badgeMenu.style.display = "none";
  }
}

// ===== EMPLEADOS =====
const Empleados = {
  // Aplicar filtros
  async aplicarFiltros() {
    const estado = document.getElementById("filtro-estado").value;
    const area = document.getElementById("filtro-area").value;
    const termino = document
      .getElementById("busquedaEmpleado")
      .value.toLowerCase();

    try {
      let url = "/api/empleados?estado=" + encodeURIComponent(estado);
      if (area && area.trim() !== "") {
        url += "&area=" + encodeURIComponent(area);
      }

      const response = await fetch(url);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const empleados = await response.json();

      // Aplicar filtro de búsqueda por nombre/ID
      let empleadosFiltrados = empleados;
      if (termino && termino.trim() !== "") {
        empleadosFiltrados = empleados.filter(
          (emp) =>
            emp.id.toString().includes(termino) ||
            emp.nombre.toLowerCase().includes(termino)
        );
      }

      this.actualizarTabla(empleadosFiltrados);
    } catch (error) {
      console.error("Error al aplicar filtros:", error);
      const tbody = document.getElementById("empleados-body");
      tbody.innerHTML = `<tr><td colspan="4">Error al cargar empleados: ${error.message}</td></tr>`;
    }
  },

  // Actualizar tabla de empleados
  actualizarTabla(empleados) {
    empleadosVisibles = empleados;
    const tbody = document.getElementById("empleados-body");
    tbody.innerHTML = "";

    if (empleados.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4">No se encontraron empleados</td></tr>`;
      return;
    }

    empleados.forEach((emp) => {
      const row = document.createElement("tr");
      // Agregar clase si está inactivo para estilizar la fila
      if (emp.estado === "Inactivo") {
        row.classList.add("inactive-employee");
      }

      // Crear botones de acción
      let actionButtons = `
      <button class="action-btn" onclick="Empleados.ver(${emp.id})">
        <i class="bi bi-eye"></i>
      </button>
      <button class="action-btn" onclick="Empleados.editar(${emp.id})">
        <i class="bi bi-pencil"></i>
      </button>
    `;

      // Si está inactivo, agregar botón de reactivación
      if (emp.estado === "Inactivo") {
        actionButtons += `
        <button class="action-btn reactivate-btn" onclick="Empleados.reactivar(${emp.id})">
          <i class="bi bi-person-plus"></i> 
        </button>
      `;
      } else {
        // Si está activo, mostrar botón de baja
        actionButtons += `
        <button class="action-btn" onclick="Empleados.abrirModalBaja(${emp.id})">
          <i class="bi bi-trash"></i>
        </button>
      `;
      }

      row.innerHTML = `
      <td>${emp.id}</td>
      <td>
        <button onclick="Empleados.verGenerales(${emp.id})" style="all: unset; cursor: pointer;">
          ${emp.nombre}
        </button>
      </td>
      <td>${emp.puesto}</td>
      <td class="action-buttons">
        ${actionButtons}
      </td>
    `;
      tbody.appendChild(row);
    });
  },
  // Ver empleado completo
  async ver(id) {
    Utils.toggleBodyScroll(true);
    try {
      const data = await API.cargarEmpleado(id);
      const modalBody = document.getElementById("modal-body");

      const areasTexto =
        data.Areas && data.Areas.length > 0
          ? data.Areas.map((area) => area.NombreArea).join(", ")
          : "Sin información";

      modalBody.innerHTML = `
        ${Modales.renderField("ID", data.idUsuario)}
        ${Modales.renderField("Rol", data.TipoRol)}
        ${Modales.renderField("Áreas", areasTexto)}
        ${Modales.renderField(
          "Nombre Completo",
          `${data.Nombres} ${data.Paterno} ${data.Materno}`
        )}
        ${Modales.renderField("Fecha Nacimiento", data.FechaNacimiento)}
        ${Modales.renderField("Dirección", data.Direccion)}
        ${Modales.renderField("Código Postal", data.CodigoPostal)}
        ${Modales.renderField("Correo", data.Correo)}
        ${Modales.renderField("NSS", data.NSS)}
        ${Modales.renderField("Teléfono", data.Telefono)}
        ${Modales.renderField("Fecha Ingreso", data.FechaIngreso)}
        ${Modales.renderField("RFC", data.RFC)}
        ${Modales.renderField("CURP", data.Curp)}
        ${Modales.renderField("Puesto", data.Puesto)}
        ${Modales.renderField(
          "Contacto Emergencia",
          data.NombreContactoEmergencia
        )}
        ${Modales.renderField("Teléfono Emergencia", data.TelefonoEmergencia)}
        ${Modales.renderField("Parentesco", data.Parentesco)}
        ${Modales.renderField("Fecha Baja", data.FechaBaja)}
        ${Modales.renderField("Comentario Salida", data.ComentarioSalida)}
        ${Modales.renderField("Clave", data.clave)}
        ${Modales.renderField("Estado", data.Estado)}
        ${Modales.renderField("Sueldo Diario", data.SueldoDiario)}
        ${Modales.renderField("Sueldo Semanal", data.SueldoSemanal)}
        ${Modales.renderField("Bono Semanal", data.BonoSemanal)}
        ${Modales.renderField("Sueldo Mensual", data.Mensual)}
        ${Modales.renderField("Vacaciones", data.Vacaciones)}
        ${Modales.renderField("Vacaciones disponibles", data.DiasDisponibles)}
        ${Modales.renderField("Empresa", data.Empresa)}
      `;

      Modales.toggle("modal", true);
    } catch (error) {
      console.error("Error:", error);
      alert("Error al cargar los datos del empleado");
    }
  },

  // Ver datos generales del empleado
  async verGenerales(id) {
    Utils.toggleBodyScroll(true);
    try {
      // 1. Cargar los datos del empleado
      const data = await API.cargarEmpleado(id);

      // 2. Pedir la cantidad de reportes al nuevo endpoint
      const respReportes = await fetch(`/api/usuario/${id}/reportes/count`);
      const reportesJson = await respReportes.json();
      const totalReportes = reportesJson.totalReportes ?? 0;

      const modalBody = document.getElementById("modal-generales-body");

      const areasTexto =
        data.Areas && data.Areas.length > 0
          ? data.Areas.map((area) => area.NombreArea).join(", ")
          : "Sin información";

      // 3. Renderizar el modal con el nuevo campo
      modalBody.innerHTML = `
      ${Modales.renderField("ID", data.idUsuario)}
      ${Modales.renderField("Rol", data.TipoRol)}
      ${Modales.renderField("Áreas", areasTexto)}
      ${Modales.renderField("Nombre", data.Nombres)}
      ${Modales.renderField("Paterno", data.Paterno)}
      ${Modales.renderField("Materno", data.Materno)}
      ${Modales.renderField("Fecha nacimiento", data.FechaNacimiento)}
      ${Modales.renderField("Dirección", data.Direccion)}
      ${Modales.renderField("Código postal", data.CodigoPostal)}
      ${Modales.renderField("Correo electrónico", data.Correo)}
      ${Modales.renderField("Teléfono", data.Telefono)}
      ${Modales.renderField("Fecha ingreso", data.FechaIngreso)}
      ${Modales.renderField("CURP", data.Curp)}
      ${Modales.renderField("Puesto", data.Puesto)}
      ${Modales.renderField("Cantidad de reportes", totalReportes)}
      ${Modales.renderField("Empresa", data.Empresa)}
    `;

      Modales.toggle("modal-generales", true);
    } catch (error) {
      console.error("Error:", error);
      alert("Error al cargar los datos generales del empleado");
    }
  },
  // Editar empleado
async editar(id) {
  Modales.toggle("edit-employee-modal", true);

  try {
    const [data, roles] = await Promise.all([
      API.cargarEmpleado(id),
      API.cargarRoles(),
    ]);

    // Llenar select de roles
    const selectRol = document.getElementById("edit-tipoRol");
    selectRol.innerHTML = '<option value="">Seleccione un rol</option>';
    roles.forEach((rol) => {
      const option = document.createElement("option");
      option.value = rol.idRol;
      option.textContent = rol.TipoRol;
      selectRol.appendChild(option);
    });

    // Llenar campos del formulario
    const campos = {
      "edit-idUsuario": data.idUsuario || "",
      "edit-tipoRol": data.Rol_idRol || "",
      "edit-nombres": data.Nombres || "",
      "edit-paterno": data.Paterno || "",
      "edit-materno": data.Materno || "",
      "edit-fechaNacimiento": Utils.formatoFechaParaInput(
        data.FechaNacimiento
      ),
      "edit-direccion": data.Direccion || "",
      "edit-codigoPostal": data.CodigoPostal || "",
      "edit-correo": data.Correo || "",
      "edit-nss": data.NSS || "",
      "edit-telefono": data.Telefono || "",
      "edit-rfc": data.RFC || "",
      "edit-curp": data.Curp || "",
      "edit-puesto": data.Puesto || "",
      "edit-nombreContactoEmergencia": data.NombreContactoEmergencia || "",
      "edit-telefonoEmergencia": data.TelefonoEmergencia || "",
      "edit-parentesco": data.Parentesco || "",
      "edit-contraseña": data.clave || "",
      "edit-confirmarContraseña": data.clave || "",
      "edit-sueldoDiario": data.SueldoDiario || "",
      "edit-sueldoSemanal": data.SueldoSemanal || "",
      "edit-bonoSemanal": data.BonoSemanal || "",
      "edit-Mensual": data.Mensual || "",
      "edit-fechaBaja": Utils.formatoFechaParaInput(data.FechaBaja),
      "edit-comentarioSalida": data.ComentarioSalida || "",
      "edit-fechaIngreso": Utils.formatoFechaParaInput(data.FechaIngreso),
      "edit-vacaciones":
        data.Vacaciones != null
          ? data.Vacaciones
          : Utils.calcularDiasVacaciones(
              Utils.formatoFechaParaInput(data.FechaIngreso)
            ),
      "edit-diasDisponibles": data.DiasDisponibles || 0,
      // ✅ CORRECCIÓN: Usar el campo Empresa en lugar de NombreAcceso/NumeroAcceso
      "edit-empresaAcceso": data.Empresa || "",
    };

    Object.entries(campos).forEach(([id, valor]) => {
      const elemento = document.getElementById(id);
      if (elemento) elemento.value = valor;
    });

    // Cargar áreas
    const idsDeAreas = (data.Areas || []).map((area) => area.idArea);
    await this.cargarAreasParaEditar(data.idUsuario, idsDeAreas);

    // Event listener para recalcular vacaciones
    const fechaIngresoInput = document.getElementById("edit-fechaIngreso");
    fechaIngresoInput.addEventListener("change", function () {
      const nuevaFecha = this.value;
      const dias = Utils.calcularDiasVacaciones(nuevaFecha);
      document.getElementById("edit-vacaciones").value = dias;
    });
  } catch (error) {
    console.error("Error al cargar datos del empleado:", error);
    alert("No se pudieron cargar los datos del empleado.");
  }
},

  // Cargar áreas para editar
  async cargarAreasParaEditar(idUsuario, areasSeleccionadas) {
    try {
      const response = await fetch("/api/areas");
      const areas = await response.json();
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
    } catch (error) {
      console.error("Error al cargar áreas:", error);
    }
  },

  // Abrir modal de baja
  abrirModalBaja(idUsuario) {
    Utils.toggleBodyScroll(true);

    // Cargar datos del empleado
    API.cargarEmpleado(idUsuario)
      .then((empleado) => {
        document.getElementById(
          "nombre-empleado-baja"
        ).textContent = `${empleado.Nombres} ${empleado.Paterno} ${empleado.Materno}`;
        document.getElementById("id-empleado-baja").textContent = idUsuario;
        document.getElementById("baja-idUsuario").value = idUsuario;

        // Cargar razones de baja
        const select = document.getElementById("baja-razon");
        fetch("/api/razones-baja")
          .then((response) => {
            if (!response.ok)
              throw new Error("Error al obtener razones de baja");
            return response.json();
          })
          .then((data) => {
            // Limpiar opciones existentes
            select.innerHTML = '<option value="">Seleccione una razón</option>';
            data.forEach((razon) => {
              const option = document.createElement("option");
              option.value = razon.idRazonBaja;
              option.textContent = razon.RazonBaja;
              select.appendChild(option);
            });
          })
          .catch((error) => {
            console.error("Error al cargar razones de baja:", error);
            select.innerHTML =
              '<option value="">No se pudieron cargar razones</option>';
          });

        // Abrir modal
        Modales.toggle("modal-baja-empleado", true);
      })
      .catch((err) => {
        console.error("Error al cargar empleado:", err);
        alert("No se pudo abrir el modal de baja.");
      });
  },

  // Dentro del objeto Empleados en admin.html
  reactivar(idUsuario) {
    Swal.fire({
      title: "¿Seguro que quieres reactivar este empleado?",
      text: "El usuario volverá a estar activo.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, reactivar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        fetch(`/api/usuario/activar/${idUsuario}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        })
          .then((response) => {
            if (!response.ok) throw new Error("Error al reactivar el usuario");
            return response.json();
          })
          .then((data) => {
            Swal.fire({
              title: "¡Reactivado!",
              text: "Recuerda verificar los datos del usuario, como su fecha de ingreso y demás datos personales.",
              icon: "success",
              confirmButtonText: "OK",
            }).then(() => {
              // 🔄 Refrescar la tabla de empleados
              Empleados.aplicarFiltros();
            });
          })
          .catch((error) => {
            console.error("Error en reactivación:", error);
            Swal.fire("Error", "No se pudo reactivar el usuario.", "error");
          });
      }
    });
  },

  // Cargar empleados por mes
  async cargarPorMes(mes) {
    try {
      const res = await fetch(`/api/empleados/mes/${mes}`);
      if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);

      const data = await res.json();
      const resultadoDiv = document.getElementById("resultado-empleados");

      if (!data.empleados || data.empleados.length === 0) {
        resultadoDiv.innerHTML = `
          <p style="color: #666; text-align: center; padding: 20px; font-style: italic;">
            No hay empleados con aniversario laboral en este mes.
          </p>`;
        return;
      }

      // Ordenar por día de ingreso
      data.empleados.sort((a, b) => {
        return (
          new Date(a.FechaIngreso).getDate() -
          new Date(b.FechaIngreso).getDate()
        );
      });

      resultadoDiv.innerHTML = `
        <div style="max-height: 300px; overflow-y: auto;">
          ${data.empleados
            .map((empleado) => {
              const nombre = empleado.Nombres || "Sin nombre";
              const paterno = empleado.Paterno || "";
              const materno = empleado.Materno || "";
              const nombreCompleto = `${nombre} ${paterno} ${materno}`.trim();
              const fechaFormateada = Utils.formatearFechaLocal(
                empleado.FechaIngreso
              );

              return `
              <div style="
                padding: 12px;
                border-bottom: 1px solid #eee;
                display: flex;
                justify-content: space-between;
                align-items: center;
              ">
                <span style="font-weight: 500; color: #333;">
                  ${nombreCompleto}
                </span>
                <span style="color: #666; font-size: 14px;">
                  ${fechaFormateada}
                </span>
              </div>
            `;
            })
            .join("")}
        </div>
      `;
    } catch (error) {
      console.error("Error en cargarEmpleadosPorMes:", error);
      document.getElementById("resultado-empleados").innerHTML = `
        <p style="color: red; text-align: center; padding: 20px;">
          Error al cargar empleados: ${error.message}
        </p>`;
    }
  },
};

// ===== AREAS =====
const Areas = {
  // Toggle áreas
  toggle(context = "") {
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
  },

  // Cargar áreas para alta de empleado
  async cargarParaAlta() {
    try {
      const response = await fetch("/api/areas");
      const data = await response.json();
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
    } catch (error) {
      console.error("Error al cargar áreas:", error);
    }
  },
};

// ===== DÍAS FESTIVOS =====
const DiasFestivos = {
  // Abrir modal ver días festivos
  abrir() {
    Modales.toggle("ver-dias-festivos-modal", true);
    this.llenarAnios();
  },

  // Cerrar modal
  cerrar() {
    Modales.toggle("ver-dias-festivos-modal", false);
    document.getElementById("listaDiasFestivos").innerHTML = "";
  },

  // Llenar años en select
  llenarAnios() {
    const select = document.getElementById("anioFestivo");
    const anioActual = new Date().getFullYear();
    select.innerHTML = "";

    for (let i = anioActual; i >= anioActual - 10; i--) {
      const option = document.createElement("option");
      option.value = i;
      option.textContent = i;
      select.appendChild(option);
    }

    this.cargar();
  },

  // Cargar días festivos
  async cargar() {
    const anio = document.getElementById("anioFestivo").value;
    const lista = document.getElementById("listaDiasFestivos");
    lista.innerHTML = "Cargando...";

    try {
      const response = await fetch(`/api/diasfestivos?anio=${anio}`);
      if (!response.ok) throw new Error("Error al obtener días festivos");

      const data = await response.json();

      if (!data || data.length === 0) {
        lista.innerHTML =
          "<p>No hay días festivos registrados para este año.</p>";
        return;
      }

      lista.innerHTML = "";

      const formatter = new Intl.DateTimeFormat("es-MX", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      data.forEach((festivo) => {
        const [anio, mes, dia] = festivo.fecha.split("-").map(Number);
        const fechaObj = new Date(anio, mes - 1, dia);
        const fechaFormateada = formatter.format(fechaObj);

        const item = document.createElement("div");
        item.classList.add("festivo-item");
        item.innerHTML = `
          <div class="festivo-contenido">
            <strong>${fechaFormateada}</strong>: ${festivo.descripcion}
          </div>
          <button class="btn btn-danger btn-sm eliminar-festivo" 
                  title="Eliminar" 
                  onclick="DiasFestivos.eliminar(${festivo.id})">
            🗑️
          </button>
        `;
        lista.appendChild(item);
      });
    } catch (error) {
      console.error("Error al cargar días festivos:", error);
      lista.innerHTML =
        "<p>Error al cargar los días festivos. Intenta nuevamente más tarde.</p>";
    }
  },

  // Eliminar un día festivo
  async eliminar(id) {
    const confirmacion = await Swal.fire({
      title: "¿Eliminar día festivo?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!confirmacion.isConfirmed) return;

    try {
      const response = await fetch(`/api/diasfestivos/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Error al eliminar");

      await Swal.fire({
        title: "Eliminado",
        text: data.mensaje,
        icon: "success",
        confirmButtonColor: "#3085d6",
      });

      this.cargar(); // recargar la lista después de eliminar
    } catch (err) {
      console.error("Error al eliminar día festivo:", err);
      Swal.fire({
        title: "Error",
        text: "No se pudo eliminar el día festivo.",
        icon: "error",
        confirmButtonColor: "#d33",
      });
    }
  },
};



// ===== EXPORTACIÓN EXCEL (CORREGIDO) =====
const ExportarExcel = {
  // Abrir modal y mostrar paso de campos
  abrir() {
    Modales.toggle("export-excel-modal", true);
    this.mostrarPasoCampos();
  },

  // Mostrar paso de campos
  mostrarPasoCampos() {
    // Asegurar que estamos en el paso correcto
    const pasoEmpleados = document.getElementById("paso-empleados");
    const pasoCampos = document.getElementById("paso-campos");

    pasoEmpleados.classList.remove("visible");
    pasoEmpleados.classList.add("hidden");
    pasoEmpleados.style.display = "none";

    pasoCampos.classList.remove("oculto");
    pasoCampos.style.display = "block";

    const container = document.getElementById("export-fields-container");
    container.innerHTML = "";
    container.style.display = "grid";
    container.style.gridTemplateColumns =
      "repeat(auto-fill, minmax(200px, 1fr))";
    container.style.gap = "12px";
    container.style.padding = "12px";

    camposExportacion.forEach((campo) => {
      const div = document.createElement("div");
      div.style.cssText = `
        display: flex; align-items: center; gap: 10px; padding: 8px;
        border-radius: 6px; background-color: #f8f9fa; transition: all 0.2s ease;
      `;

      div.onmouseenter = () => {
        div.style.backgroundColor = "#e9ecef";
        div.style.transform = "translateY(-2px)";
      };
      div.onmouseleave = () => {
        div.style.backgroundColor = "#f8f9fa";
        div.style.transform = "none";
      };

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = `export-${campo.id}`;
      checkbox.value = campo.id;
      checkbox.checked = true;
      checkbox.style.cssText =
        "width: 18px; height: 18px; cursor: pointer; accent-color: #4dabf7;";

      const label = document.createElement("label");
      label.htmlFor = `export-${campo.id}`;
      label.textContent = campo.nombre;
      label.style.cssText =
        "cursor: pointer; font-size: 14px; user-select: none; color: #495057;";

      div.appendChild(checkbox);
      div.appendChild(label);
      container.appendChild(div);
    });
  },

  // Seleccionar campos por categoría
  seleccionarPorCategoria(categoria, botonPresionado) {
    const categorias = {
      generales: [
        "idUsuario",
        "TipoRol",
        "Areas",
        "Nombres",
        "Materno",
        "Paterno",
        "FechaNacimiento",
        "Direccion",
        "CodigoPostal",
        "Correo",
        "Telefono",
        "FechaIngreso",
        "Curp",
        "Puesto",
      ],
      baja: [
        "idUsuario",
        "TipoRol",
        "Areas",
        "Nombres",
        "Materno",
        "Paterno",
        "FechaNacimiento",
        "Direccion",
        "CodigoPostal",
        "Correo",
        "Telefono",
        "FechaIngreso",
        "Curp",
        "Puesto",
        "FechaBaja",
        "ComentarioSalida",
      ],
      sueldo: [
        "idUsuario",
        "TipoRol",
        "Areas",
        "Nombres",
        "Materno",
        "Paterno",
        "FechaNacimiento",
        "Direccion",
        "CodigoPostal",
        "Correo",
        "Telefono",
        "FechaIngreso",
        "Curp",
        "Puesto",
        "SueldoDiario",
        "SueldoSemanal",
        "BonoSemanal",
        "Mensual",
      ],
      vacaciones: [
        "idUsuario",
        "TipoRol",
        "Areas",
        "Nombres",
        "Materno",
        "Paterno",
        "FechaNacimiento",
        "Direccion",
        "CodigoPostal",
        "Correo",
        "Telefono",
        "FechaIngreso",
        "Curp",
        "Puesto",
        "Vacaciones",
        "DiasDisponibles",
      ],
    };

    const camposASeleccionar = categorias[categoria] || [];

    // Seleccionar checkboxes
    const checkboxes = document.querySelectorAll(
      "#export-fields-container input[type='checkbox']"
    );
    checkboxes.forEach((cb) => {
      cb.checked = camposASeleccionar.includes(cb.value);
    });

    // Actualizar estilos de botones
    document.querySelectorAll(".export-nav-buttons button").forEach((btn) => {
      btn.classList.remove("btn-primary");
      btn.classList.add("btn-outline-primary");
    });

    if (botonPresionado) {
      botonPresionado.classList.remove("btn-outline-primary");
      botonPresionado.classList.add("btn-primary");
    }
  },

  // Mostrar paso empleados
  mostrarPasoEmpleados() {
    const checkboxes = document.querySelectorAll(
      '#export-fields-container input[type="checkbox"]:checked'
    );
    camposSeleccionados = Array.from(checkboxes).map((cb) => cb.value);

    if (camposSeleccionados.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Campos requeridos",
        text: "Por favor selecciona al menos un campo para exportar",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "Aceptar",
      });
      return;
    }

    // Ocultar paso campos
    const pasoCampos = document.getElementById("paso-campos");
    const pasoEmpleados = document.getElementById("paso-empleados");

    pasoCampos.classList.add("oculto");
    pasoCampos.style.display = "none";

    // Mostrar paso empleados
    pasoEmpleados.classList.remove("hidden");
    pasoEmpleados.classList.add("visible");
    pasoEmpleados.style.display = "block";

    const container = document.getElementById("export-employees-container");
    container.innerHTML = "";
    container.style.cssText = `
      display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 12px; padding: 16px; max-height: 400px; overflow-y: auto;
    `;

    if (empleadosVisibles.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 20px; color: #6c757d; font-size: 16px;">
          <i class="fas fa-users-slash" style="font-size: 24px; margin-bottom: 8px;"></i>
          <p>No hay empleados para exportar</p>
        </div>
      `;
      return;
    }

    // Botones select all/none
    const selectAllDiv = document.createElement("div");
    selectAllDiv.style.cssText =
      "grid-column: 1 / -1; display: flex; gap: 12px; margin-bottom: 8px;";

    const createButton = (text, bgColor, textColor, border, onClick) => {
      const btn = document.createElement("button");
      btn.textContent = text;
      btn.style.cssText = `
        padding: 6px 12px; background: ${bgColor}; color: ${textColor};
        border: ${border}; border-radius: 4px; cursor: pointer;
      `;
      btn.onclick = onClick;
      return btn;
    };

    const selectAllBtn = createButton(
      "Seleccionar todos",
      "#174da3",
      "white",
      "none",
      () => {
        document
          .querySelectorAll(".empleado-checkbox")
          .forEach((cb) => (cb.checked = true));
        this.updateEmployeeCounter();
      }
    );

    const deselectAllBtn = createButton(
      "Quitar todos",
      "#f1f3f5",
      "#495057",
      "1px solid #dee2e6",
      () => {
        document
          .querySelectorAll(".empleado-checkbox")
          .forEach((cb) => (cb.checked = false));
        this.updateEmployeeCounter();
      }
    );

    selectAllDiv.appendChild(selectAllBtn);
    selectAllDiv.appendChild(deselectAllBtn);
    container.appendChild(selectAllDiv);

    // Lista de empleados
    empleadosVisibles.forEach((emp) => {
      const div = document.createElement("div");
      div.style.cssText = `
        display: flex; align-items: center; gap: 12px; padding: 10px;
        border-radius: 6px; background-color: #f8f9fa; transition: all 0.2s ease;
      `;

      div.onmouseenter = () => (div.style.backgroundColor = "#e9ecef");
      div.onmouseleave = () => (div.style.backgroundColor = "#f8f9fa");

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "empleado-checkbox";
      checkbox.value = emp.id;
      checkbox.checked = true;
      checkbox.style.cssText =
        "width: 18px; height: 18px; cursor: pointer; accent-color: #4dabf7;";

      const label = document.createElement("label");
      label.textContent = `${emp.id} - ${emp.nombre}`;
      label.style.cssText = `
        cursor: pointer; font-size: 14px; user-select: none; color: #495057;
        flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      `;

      div.appendChild(checkbox);
      div.appendChild(label);
      container.appendChild(div);
    });

    // Contador
    const counterDiv = document.createElement("div");
    counterDiv.style.cssText =
      "grid-column: 1 / -1; text-align: right; font-size: 14px; color: #6c757d;";
    counterDiv.id = "employee-counter";
    container.appendChild(counterDiv);
    this.updateEmployeeCounter();

    container.addEventListener("change", () => this.updateEmployeeCounter());
  },

  // Actualizar contador de empleados
  updateEmployeeCounter() {
    const total = empleadosVisibles.length;
    const selected = document.querySelectorAll(
      ".empleado-checkbox:checked"
    ).length;
    const counter = document.getElementById("employee-counter");
    if (counter) {
      counter.textContent = `${selected} de ${total} empleados seleccionados`;
    }
  },

  // Exportar a Excel
  async exportar() {
    const camposSeleccionados = Array.from(
      document.querySelectorAll(
        '#export-fields-container input[type="checkbox"]:checked'
      )
    ).map((cb) => cb.value);

    const checkboxes = document.querySelectorAll(
      '#export-employees-container input[type="checkbox"]:checked'
    );
    const empleadosSeleccionados = Array.from(checkboxes).map((cb) => cb.value);

    if (
      empleadosSeleccionados.length === 0 ||
      camposSeleccionados.length === 0
    ) {
      Swal.fire({
        icon: "warning",
        title: "Selección incompleta",
        text: "Por favor selecciona al menos un empleado y al menos un campo para exportar",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "Aceptar",
      });
      return;
    }

    if (!ExcelJS) {
      Swal.fire({
        icon: "error",
        title: "Librería no disponible",
        text: "La librería ExcelJS no está cargada. Por favor, incluye el script de ExcelJS en tu HTML.",
        confirmButtonColor: "#d33",
        confirmButtonText: "Aceptar",
      });
      return;
    }

    const exportBtn = document.querySelector("#paso-empleados .btn-primary");
    const originalText = exportBtn.textContent;
    exportBtn.textContent = "Generando...";
    exportBtn.disabled = true;

    try {
      // Pedir info de empleados + estado en paralelo
      const promises = empleadosSeleccionados.map(async (id) => {
        const [empleadoRes, estadoRes] = await Promise.all([
          fetch(`/api/empleado/${id}`),
          fetch(`/api/usuario/${id}/estado`),
        ]);

        const empleado = await empleadoRes.json();
        const estado = await estadoRes.json();

        return { ...empleado, EstadoUsuario: estado };
      });

      const empleadosCompletos = await Promise.all(promises);

      const datosExcel = empleadosCompletos.map((empleado) => {
        const fila = {};
        camposSeleccionados.forEach((campo) => {
          if (campo === "Areas" && Array.isArray(empleado.Areas)) {
            fila[campo] = empleado.Areas.map((a) => a.NombreArea).join(", ");
          } else {
            fila[campo] = empleado[campo] !== undefined ? empleado[campo] : "";
          }
        });
        // incluir estado para lógica de color
        fila._esActivo = empleado.EstadoUsuario.esActivo;
        return fila;
      });

      // Crear workbook con ExcelJS
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Empleados");

      // Definir columnas
      worksheet.columns = camposSeleccionados.map((campo) => ({
        header: campo,
        key: campo,
        width: Math.max(campo.length + 2, 10),
      }));

      // Agregar datos
      datosExcel.forEach((empleado) => {
        worksheet.addRow(empleado);
      });

      // Estilos encabezado (amarillo)
      const headerRow = worksheet.getRow(1);
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFFF00" },
        };
        cell.font = { bold: true, size: 10, name: "Arial" };
        cell.alignment = { horizontal: "center", vertical: "middle" };
      });

      // Estilos a filas de datos (rojo si inactivo)
      for (let i = 2; i <= worksheet.rowCount; i++) {
        const row = worksheet.getRow(i);
        const empleado = datosExcel[i - 2];

        const esActivo = empleado._esActivo === 1;

        row.eachCell((cell) => {
          if (!esActivo) {
            // INACTIVO → rojo
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFFF0000" },
            };
            cell.font = {
              color: { argb: "FFFFFFFF" },
              size: 10,
              name: "Arial",
            };
          } else {
            // Activo → normal
            cell.font = { size: 10, name: "Arial" };
          }
          cell.alignment = { vertical: "middle" };
        });
      }

      // Ajustar ancho de columnas
      worksheet.columns.forEach((column, index) => {
        const campo = camposSeleccionados[index];
        let maxLength = campo.length;

        datosExcel.forEach((row) => {
          const cellValue = row[campo] ? row[campo].toString() : "";
          if (cellValue.length > maxLength) {
            maxLength = cellValue.length;
          }
        });

        column.width = Math.min(maxLength + 2, 50);
      });

      // Descargar archivo
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `empleados_exportados_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error al exportar a Excel:", error);
      alert("Ocurrió un error al generar el archivo Excel: " + error.message);
    } finally {
      exportBtn.textContent = originalText;
      exportBtn.disabled = false;
    }
  },
  // Cerrar modal
  cerrar() {
    Modales.toggle("export-excel-modal", false);
    camposSeleccionados = [];
    empleadosSeleccionados = [];
  },
};

// ===== FUNCIONES GLOBALES (para mantener compatibilidad con HTML) =====
window.toggleDropdown = () => Dropdown.toggle();
window.navigateToOption = (url) => Dropdown.navigateToOption(url);
window.toggleAreas = (context) => Areas.toggle(context);
window.abrirModalAltaEmpleado = () =>
  Modales.toggle("add-employee-modal", true);
window.abrirModalAgregarEmpresa = () => {
  Modales.toggle("add-empresa-modal", true);
};
window.cerrarModalAltaEmpleado = () =>
  Modales.toggle("add-employee-modal", false);
window.abrirModalExportarExcel = () => ExportarExcel.abrir(); // CORREGIDO
window.cerrarModalExportarExcel = () => ExportarExcel.cerrar();
window.mostrarPasoCampos = () => ExportarExcel.mostrarPasoCampos();
window.mostrarPasoEmpleados = () => ExportarExcel.mostrarPasoEmpleados();
window.seleccionarCamposPorCategoria = (cat, btn) =>
  ExportarExcel.seleccionarPorCategoria(cat, btn);
window.exportarExcel = () => ExportarExcel.exportar();
window.aplicarFiltros = () => Empleados.aplicarFiltros();
window.buscarEmpleado = () => Empleados.aplicarFiltros();
window.verEmpleado = (id) => Empleados.ver(id);
window.verEmpleadoGenerales = (id) => Empleados.verGenerales(id);
window.editarEmpleado = (id) => Empleados.editar(id);
window.cerrarModal = () => Modales.toggle("modal", false);
window.cerrarModalGenerales = () => Modales.toggle("modal-generales", false);
window.cerrarModalEditarEmpleado = () =>
  Modales.toggle("edit-employee-modal", false);
window.abrirModalBajaEmpleado = (id) => Empleados.abrirModalBaja(id);
window.cerrarModalBajaEmpleado = () =>
  Modales.toggle("modal-baja-empleado", false);
window.abrirModalAgregarArea = () => Modales.toggle("add-area-modal", true);
window.cerrarModalAgregarArea = () => Modales.toggle("add-area-modal", false);
window.abrirModalAgregarFestivo = () =>
  Modales.toggle("add-holiday-modal", true);
window.cerrarModalAgregarFestivo = () =>
  Modales.toggle("add-holiday-modal", false);
window.abrirModalVerDiasFestivos = () => DiasFestivos.abrir();
window.cerrarModalVerDiasFestivos = () => DiasFestivos.cerrar();
window.cargarDiasFestivos = () => DiasFestivos.cargar();
window.abrirModalMes = () => {
  const modal = document.getElementById("modal-mes-ingreso");
  modal.style.display = "flex";
  const selectMes = document.getElementById("filtro-mes");
  const mesActual = new Date().getMonth() + 1;
  selectMes.value = mesActual;
  Empleados.cargarPorMes(mesActual);
};
window.cerrarModalAgregarEmpresa = () => {
  Modales.toggle("add-empresa-modal", false);
  // Limpiar formulario
  const form = document.getElementById("empresa-form");
  if (form) {
    form.reset();
  }
};
window.logout = () => {
  localStorage.removeItem("idUsuario");
  window.location.href = "index.html";
};

// ===== INICIALIZACIÓN =====
document.addEventListener("DOMContentLoaded", async () => {
  // Verificar sesión
  const idUsuario = Utils.verificarSesion();

  // Inicializar componentes
  Dropdown.init();

  // Cargar datos iniciales
  await Promise.all([
    API.cargarNotificaciones(),
    API.cargarNombreUsuario(idUsuario),
    API.cargarAreas(),
    API.cargarNotificacionesReportes(),
    Empleados.aplicarFiltros(),
   
  ]);

  // Configurar intervalos
  setInterval(API.cargarNotificaciones, 300000);
  setInterval(API.cargarNotificacionesReportes, 300000);

  // Event listeners para formularios
  setupFormListeners();

  // Event listeners para modales
  setupModalListeners();
});

// ===== CONFIGURACIÓN DE EVENT LISTENERS =====
function setupFormListeners() {
  // Formulario de alta de empleado
// Formulario de alta de empleado
const employeeForm = document.getElementById("employee-form");
if (employeeForm) {
  employeeForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (!Validaciones.validarCampos()) return;

    const contraseña = document.getElementById("contraseña").value;
    const confirmarContraseña = document.getElementById("confirmarContraseña").value;

    if (!Validaciones.validarContraseñas(contraseña, confirmarContraseña)) return;

    const fechaIngreso = document.getElementById("fechaIngreso").value;
    const diasVacaciones = Utils.calcularDiasVacaciones(fechaIngreso);

    const formData = new FormData(this);
    const empleadoData = {};
    formData.forEach((value, key) => {
      empleadoData[key] = value;
    });

    const areasSeleccionadas = Array.from(
      document.querySelectorAll('input[name="areas"]:checked')
    ).map((cb) => Number.parseInt(cb.value));

    if (areasSeleccionadas.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Área requerida",
        text: "Debes seleccionar al menos un área.",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "Aceptar",
      });
      return;
    }

    empleadoData.areas = areasSeleccionadas;
    empleadoData.rol_id = empleadoData.tipoRol;
    delete empleadoData.tipoRol;
    empleadoData.Vacaciones = diasVacaciones;

    // ✅ CORRECCIÓN: Procesar el campo empresaAcceso (nombre + número)
    const empresaAccesoTexto = document.getElementById("empresaAcceso").value || "";
    const lineas = empresaAccesoTexto.split('\n').map(linea => linea.trim()).filter(linea => linea !== "");
    
    if (lineas.length > 0) {
      // Unir todas las líneas en un solo string separado por " - "
      empleadoData.Empresa = lineas.join(' - ');
    } else {
      empleadoData.Empresa = null;
    }

    // Convertir otros campos a números
    empleadoData.idUsuario = Number(empleadoData.idUsuario);
    empleadoData.SueldoDiario = Number(empleadoData.SueldoDiario);
    empleadoData.SueldoSemanal = Number(empleadoData.SueldoSemanal);
    empleadoData.BonoSemanal = Number(empleadoData.BonoSemanal);
    empleadoData.Mensual = Number(empleadoData.Mensual);
    empleadoData.Vacaciones = Number(empleadoData.Vacaciones);
    empleadoData.diasDisponibles = Number(empleadoData.diasDisponibles);

    console.log("📤 Datos que se enviarán:", empleadoData);

    try {
      const response = await fetch("/api/empleado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(empleadoData),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error("❌ Error del servidor:", data);
        throw new Error(data.error || "Error al guardar el empleado");
      }

      const data = await response.json();
      Swal.fire({
        icon: "success",
        title: "Empleado dado de alta",
        text: data.mensaje,
        confirmButtonColor: "#3085d6",
        confirmButtonText: "Aceptar",
      }).then(() => {
        Modales.toggle("add-employee-modal", false);
        document.getElementById("employee-form").reset();
        location.reload();
      });
    } catch (error) {
      console.error("❌ Error al insertar:", error);
      Swal.fire({
        icon: "error",
        title: "Error al dar de alta",
        text: error.message || "Verifica que el id del usuario no esté duplicado",
        confirmButtonColor: "#d33",
        confirmButtonText: "Aceptar",
      });
    }
  });
}

 // Formulario de edición de empleado
const editEmployeeForm = document.getElementById("edit-employee-form");
if (editEmployeeForm) {
  editEmployeeForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!Validaciones.validarCampos("edit-")) return;

    const contraseña = document.getElementById("edit-contraseña").value;
    const confirmar = document.getElementById("edit-confirmarContraseña").value;

    if (!Validaciones.validarContraseñas(contraseña, confirmar)) return;

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
      nss: document.getElementById("edit-nss").value,
      telefono: document.getElementById("edit-telefono").value,
      fechaIngreso: document.getElementById("edit-fechaIngreso").value,
      rfc: document.getElementById("edit-rfc").value,
      curp: document.getElementById("edit-curp").value,
      puesto: document.getElementById("edit-puesto").value,
      nombreContactoEmergencia: document.getElementById("edit-nombreContactoEmergencia").value,
      telefonoEmergencia: document.getElementById("edit-telefonoEmergencia").value,
      parentesco: document.getElementById("edit-parentesco").value,
      contraseña: contraseña,
      SueldoDiario: Number(document.getElementById("edit-sueldoDiario").value),
      SueldoSemanal: Number(document.getElementById("edit-sueldoSemanal").value),
      BonoSemanal: Number(document.getElementById("edit-bonoSemanal").value),
      Mensual: Number(document.getElementById("edit-Mensual").value),
      fechaBaja: document.getElementById("edit-fechaBaja").value || null,
      comentarioSalida: document.getElementById("edit-comentarioSalida").value || null,
      Vacaciones: Number(document.getElementById("edit-vacaciones").value) || 0,
      diasDisponibles: Number(document.getElementById("edit-diasDisponibles").value) || 0,
    };

    // ✅ CORRECCIÓN: Procesar el campo empresaAcceso para edición
    const editEmpresaAccesoTexto = document.getElementById("edit-empresaAcceso").value || "";
    const editLineas = editEmpresaAccesoTexto.split('\n').map(linea => linea.trim()).filter(linea => linea !== "");

    if (editLineas.length > 0) {
      // Unir todas las líneas en un solo string separado por " - "
      empleadoData.Empresa = editLineas.join(' - ');
    } else {
      empleadoData.Empresa = null;
    }

    const checkboxes = document.querySelectorAll("#edit-checkbox-areas input[name='areas']:checked");
    const areasSeleccionadas = Array.from(checkboxes).map((cb) => Number.parseInt(cb.value));
    empleadoData.areas = areasSeleccionadas;

    try {
      const response = await fetch(`/api/empleado/${empleadoData.idUsuario}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(empleadoData),
      });

      if (!response.ok) throw new Error("Error al actualizar el empleado");

      const data = await response.json();
      Swal.fire({
        icon: "success",
        title: "Empleado actualizado",
        text: data.mensaje,
        confirmButtonColor: "#3085d6",
        confirmButtonText: "Aceptar",
      }).then(() => {
        Modales.toggle("edit-employee-modal", false);
        location.reload();
      });
    } catch (err) {
      console.error("Error:", err);
      alert("Hubo un error al actualizar: " + err.message);
    }
  });
}

  // Otros formularios...
  setupOtherForms();
}

function setupOtherForms() {
  // Formulario de baja de empleado
  const formBajaEmpleado = document.getElementById("form-baja-empleado");
  if (formBajaEmpleado) {
    formBajaEmpleado.addEventListener("submit", async function (e) {
      e.preventDefault();

      const idUsuario = document.getElementById("baja-idUsuario").value;
      const fechaBaja = document.getElementById("baja-fecha").value;
      const comentarioSalida = document.getElementById("baja-comentario").value;
      const idRazonBaja = document.getElementById("baja-razon").value; // <-- NUEVO

      if (!fechaBaja || !comentarioSalida || !idRazonBaja) {
        alert("Todos los campos son obligatorios");
        return;
      }

      const body = { fechaBaja, comentarioSalida, idRazonBaja }; // <-- incluyes el campo
      const submitBtn = this.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = "Procesando...";

      try {
        const response = await fetch(`/api/empleado/baja/${idUsuario}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        let data = null;
        try {
          data = await response.json();
        } catch (_) {}

        if (!response.ok || !data) {
          throw new Error(data?.error || "Error al dar de baja al empleado");
        }

        Swal.fire({
          icon: "success",
          title: "Empleado dado de baja correctamente",
          confirmButtonColor: "#3085d6",
          confirmButtonText: "Aceptar",
        }).then(() => {
          Modales.toggle("modal-baja-empleado", false);
          location.reload();
        });
      } catch (err) {
        console.error("Error al dar de baja:", err);
        alert("Hubo un error al procesar la baja: " + err.message);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

  // Formulario de área
  const areaForm = document.getElementById("area-form");
  if (areaForm) {
    areaForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const nombreArea = document.getElementById("nombreArea").value;

      try {
        const response = await fetch("/api/agregarArea", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ Area: nombreArea }),
        });

        if (!response.ok) throw new Error("Error al guardar el área");

        await response.json();
        Modales.toggle("add-area-modal", false);
        document.getElementById("area-form").reset();
      } catch (error) {
        console.error("Error:", error);
        alert("Error al guardar el área: " + error.message);
      }
    });
  }

  // Formulario de día festivo
  const holidayForm = document.getElementById("holiday-form");
  if (holidayForm) {
    holidayForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const fecha = document.getElementById("fechaFestivo").value;
      const descripcion = document.getElementById("descripcionFestivo").value;
      const anio = new Date(fecha).getFullYear();

      try {
        const response = await fetch("/api/diafestivo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fecha, descripcion, anio }),
        });

        if (!response.ok) throw new Error("Error al guardar el día festivo");

        await response.json();
        Swal.fire({
          icon: "success",
          title: "Día Festivo agregado al calendario",
          confirmButtonColor: "#3085d6",
          confirmButtonText: "Aceptar",
        });
      } catch (error) {
        console.error("Error:", error);
        alert("Error al guardar el día festivo: " + error.message);
      }
    });
  }

   const empresaForm = document.getElementById("empresa-form");
  if (empresaForm) {
    empresaForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const nombreEmpresa = document.getElementById("nombreEmpresa").value.trim();

      if (!nombreEmpresa) {
        Swal.fire({
          icon: "warning",
          title: "Campo requerido",
          text: "Por favor ingresa el nombre de la empresa",
          confirmButtonColor: "#3085d6",
          confirmButtonText: "Aceptar",
        });
        return;
      }

      const submitBtn = e.target.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = "Guardando...";

      try {
        const resultado = await API.agregarEmpresa(nombreEmpresa);
        
        Swal.fire({
          icon: "success",
          title: "Empresa agregada",
          text: resultado.mensaje,
          confirmButtonColor: "#3085d6",
          confirmButtonText: "Aceptar",
        }).then(() => {
          // Cerrar modal y limpiar formulario
          Modales.toggle("add-empresa-modal", false);
          document.getElementById("empresa-form").reset();
          
          // Recargar las empresas en los selects
          
        });

      } catch (error) {
        console.error("Error:", error);
        Swal.fire({
          icon: "error",
          title: "Error al agregar empresa",
          text: error.message,
          confirmButtonColor: "#d33",
          confirmButtonText: "Aceptar",
        });
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }
}

function setupModalListeners() {
  // Modal de empleados por mes
  const selectMes = document.getElementById("filtro-mes");
  const cerrarBtn = document.getElementById("cerrar-modal-mes");

  if (selectMes) {
    selectMes.addEventListener("change", () => {
      Empleados.cargarPorMes(selectMes.value);
    });
  }

  if (cerrarBtn) {
    cerrarBtn.addEventListener("click", () => {
      document.getElementById("modal-mes-ingreso").style.display = "none";
    });
  }

  // Cargar roles y áreas para modal de alta
  const addEmployeeModal = document.getElementById("add-employee-modal");
  if (addEmployeeModal) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "class"
        ) {
          if (!addEmployeeModal.classList.contains("hidden")) {
            // Modal se abrió, cargar datos
            Promise.all([API.cargarRoles(), Areas.cargarParaAlta()]).then(
              ([roles]) => {
                const selectRol = document.getElementById("tipoRol");
                selectRol.innerHTML =
                  '<option value="">Seleccione un rol</option>';
                roles.forEach((rol) => {
                  const option = document.createElement("option");
                  option.value = rol.idRol;
                  option.textContent = rol.TipoRol;
                  selectRol.appendChild(option);
                });
              }
            );
          }
        }
      });
    });
    observer.observe(addEmployeeModal, { attributes: true });
  }

  // Función para cargar razones de baja en el select
  function cargarRazonesBaja() {
    const select = document.getElementById("baja-razon");

    fetch("/api/razones-baja")
      .then((response) => response.json())
      .then((data) => {
        // Limpiar opciones existentes (excepto la primera)
        select.innerHTML = '<option value="">Seleccione una razón</option>';

        data.forEach((razon) => {
          const option = document.createElement("option");
          option.value = razon.idRazonBaja;
          option.textContent = razon.RazonBaja;
          select.appendChild(option);
        });
      })
      .catch((error) =>
        console.error("Error al cargar razones de baja:", error)
      );
  }

  // Event listener para recalcular vacaciones en formulario de alta
  const fechaIngresoInput = document.getElementById("fechaIngreso");
  if (fechaIngresoInput) {
    fechaIngresoInput.addEventListener("change", function () {
      const nuevaFecha = this.value;
      const dias = Utils.calcularDiasVacaciones(nuevaFecha);
      const vacacionesField = document.getElementById("diasDisponibles");
      if (vacacionesField) {
        vacacionesField.value = dias;
      }
    });
  }
}
