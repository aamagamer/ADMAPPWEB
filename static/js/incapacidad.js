document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('incapacidad-form');
  const tipoSelect = document.getElementById('tipo-incapacidad');
  const fechaInicio = document.getElementById('fecha-inicio');
  const fechaFin = document.getElementById('fecha-fin');
  const observaciones = document.getElementById('observaciones');
  const employeeInput = document.getElementById('employee-input');
  const employeeDropdown = document.getElementById('employee-dropdown');

  let selectedUserId = null;

  // Inicializar Flatpickr con configuración regional
  flatpickr(fechaInicio, {
    dateFormat: 'Y-m-d',
    locale: 'es',
    minDate: 'today'
  });

  flatpickr(fechaFin, {
    dateFormat: 'Y-m-d',
    locale: 'es',
    minDate: 'today'
  });

  // Cargar tipos de incapacidad
fetch('/api/tiposIncapacidad')
  .then(res => {
    if (!res.ok) throw new Error('Error al cargar tipos de incapacidad');
    return res.json();
  })
  .then(data => {
    // Limpiar select y agregar opción por defecto
    tipoSelect.innerHTML = '<option value="" disabled selected>Seleccione un tipo</option>';
    
    data.forEach(tipo => {
      const option = document.createElement('option');
      option.value = tipo.idTipoIncapacidad; // Ahora coincidirá
      option.textContent = tipo.nombre;
      tipoSelect.appendChild(option);
    });
  })
  .catch(err => {
    console.error('Error al cargar tipos:', err);
    alert('No se pudieron cargar los tipos de incapacidad');
  });

  // Autocomplete para empleados
  employeeInput.addEventListener('input', debounce(function () {
    const query = employeeInput.value.trim();
    employeeDropdown.innerHTML = '';
    selectedUserId = null;

    if (query.length < 2) {
      employeeDropdown.style.display = 'none';
      return;
    }

    fetch(`/api/usuarios/buscar?q=${encodeURIComponent(query)}`)
      .then(res => {
        if (!res.ok) throw new Error('Error en la búsqueda');
        return res.json();
      })
      .then(data => {
        employeeDropdown.innerHTML = '';

        if (data.length === 0) {
          const item = document.createElement('div');
          item.classList.add('autocomplete-item', 'no-results');
          item.textContent = 'No se encontraron empleados';
          employeeDropdown.appendChild(item);
        } else {
          data.forEach(usuario => {
            const item = document.createElement('div');
            item.classList.add('autocomplete-item');
            item.innerHTML = `
              <strong>${usuario.nombreCompleto}</strong>
            `;
            item.addEventListener('click', () => {
              employeeInput.value = usuario.nombreCompleto;
              selectedUserId = usuario.idUsuario;
              employeeDropdown.style.display = 'none';
            });
            employeeDropdown.appendChild(item);
          });
        }
        employeeDropdown.style.display = 'block';
      })
      .catch(err => {
        console.error('Error al buscar usuarios:', err);
        employeeDropdown.innerHTML = '';
        employeeDropdown.style.display = 'none';
      });
  }, 300));

  // Cerrar dropdown al hacer clic fuera
  document.addEventListener('click', function(e) {
    if (!employeeInput.contains(e.target) && !employeeDropdown.contains(e.target)) {
      employeeDropdown.style.display = 'none';
    }
  });

  // Validación y envío del formulario
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    // Validar tipo de incapacidad
    const idTipoIncapacidad = parseInt(tipoSelect.value);
    if (isNaN(idTipoIncapacidad)) {
      alert('Por favor seleccione un tipo de incapacidad válido');
      tipoSelect.focus();
      return;
    }

    // Validar empleado
    if (!selectedUserId) {
      alert('Por favor seleccione un empleado válido');
      employeeInput.focus();
      return;
    }

    // Validar fechas
    const fInicio = fechaInicio.value;
    const fFin = fechaFin.value;
    if (!fInicio || !fFin) {
      alert('Por favor complete ambas fechas');
      return;
    }

    if (new Date(fInicio) > new Date(fFin)) {
      alert('La fecha de inicio no puede ser posterior a la fecha final');
      return;
    }

    const obs = observaciones.value.trim() || 'Sin observaciones';

    // Mostrar modal de confirmación
    const modal = document.getElementById('confirm-modal');
    document.getElementById('modal-text').innerHTML = `
      <p><strong>Tipo:</strong> ${tipoSelect.options[tipoSelect.selectedIndex].text}</p>
      <p><strong>Empleado:</strong> ${employeeInput.value}</p>
      <p><strong>Periodo:</strong> ${formatDate(fInicio)} al ${formatDate(fFin)}</p>
      <p><strong>Observaciones:</strong></p>
      <p>${obs}</p>
    `;
    modal.style.display = 'flex';

    // Configurar botón de confirmación
    document.getElementById('confirm-btn').onclick = () => {
  // Deshabilitar botón para evitar múltiples envíos
  const confirmBtn = document.getElementById('confirm-btn');
  confirmBtn.disabled = true;
  confirmBtn.textContent = 'Enviando...';

  fetch('/api/registrarIncapacidad', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      idTipoIncapacidad: idTipoIncapacidad,
      idUsuario: selectedUserId,
      fechaInicio: fInicio,
      fechaFinal: fFin,
      observaciones: obs
    })
  })
  .then(async res => {
    const data = await res.json();
    if (!res.ok) {
      // Mostrar errores de validación del backend
      const errorMsg = data.details ? data.details.join(', ') : data.error;
      throw new Error(errorMsg || 'Error desconocido');
    }
    return data;
  })
  .then(data => {
    //alert(`${data.message}\nID de registro: ${data.id}`);
    form.reset();
    selectedUserId = null;
    modal.style.display = 'none';
  })
  .catch(err => {
    alert(`Error: ${err.message}`);
    console.error('Error al registrar:', err);
  })
  .finally(() => {
    confirmBtn.disabled = false;
    confirmBtn.textContent = 'Confirmar';
  });
};

    // Configurar botón de cancelación
    document.getElementById('cancel-btn').onclick = () => {
      modal.style.display = 'none';
    };
  });

  // Función para debounce (mejorar performance del autocomplete)
  function debounce(func, wait) {
    let timeout;
    return function() {
      const context = this, args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  }

  // Función para formatear fechas
  function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  }
});