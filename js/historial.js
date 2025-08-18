document.addEventListener('DOMContentLoaded', function() {
    // Inicializar las tablas
    initReportesTable();
    initVacacionesTable();
    initPermisosTable();
    initActasTable(); // NUEVA INICIALIZACIÓN
    
    // Cargar datos iniciales
    loadReportes();
});

// Función mejorada para parsear fechas correctamente
function parsearFecha(fechaString) {
    if (!fechaString) return null;
    
    // Si es formato dd/mm/yyyy (como lo renderiza DataTables)
    if (fechaString.includes('/')) {
        const [dia, mes, año] = fechaString.split('/');
        return new Date(año, mes - 1, dia);
    }
    
    // Si es formato yyyy-mm-dd (como lo del input)
    if (fechaString.includes('-')) {
        return new Date(fechaString + 'T00:00:00');
    }
    
    // Si es un objeto Date
    if (fechaString instanceof Date) {
        return fechaString;
    }
    
    // Intentar parsearlo directamente
    const fecha = new Date(fechaString);
    return isNaN(fecha.getTime()) ? null : fecha;
}

// Función mejorada para comparar solo fechas (sin hora)
function compararFechas(fecha1, fecha2) {
    if (!fecha1 || !fecha2) return false;
    
    const f1 = new Date(fecha1.getFullYear(), fecha1.getMonth(), fecha1.getDate());
    const f2 = new Date(fecha2.getFullYear(), fecha2.getMonth(), fecha2.getDate());
    
    return f1.getTime() === f2.getTime();
}

function openTab(tabId) {
    // Ocultar todos los contenidos de pestañas
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Desactivar todos los botones de pestañas
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // Mostrar el contenido de la pestaña seleccionada
    document.getElementById(tabId).classList.add('active');
    
    // Activar el botón de la pestaña seleccionada
    event.currentTarget.classList.add('active');
    
    // Cargar datos si es necesario
    if (tabId === 'reportes' && !window.reportesLoaded) {
        loadReportes();
    } else if (tabId === 'vacaciones' && !window.vacacionesLoaded) {
        loadVacaciones();
    } else if (tabId === 'permisos' && !window.permisosLoaded) {
        loadPermisos();
    } else if (tabId === 'actas' && !window.actasLoaded) { // NUEVA CONDICIÓN
        loadActas();
    }
}

// Función mejorada para filtrar por fechas
function filtrarPorFechas(tabla) {
    let fechaInicio, fechaFin, table;
    
    switch(tabla) {
        case 'reportes':
            fechaInicio = document.getElementById('fecha-inicio-reportes').value;
            fechaFin = document.getElementById('fecha-fin-reportes').value;
            table = window.reportesTable;
            break;
        case 'vacaciones':
            fechaInicio = document.getElementById('fecha-inicio-vacaciones').value;
            fechaFin = document.getElementById('fecha-fin-vacaciones').value;
            table = window.vacacionesTable;
            break;
        case 'permisos':
            fechaInicio = document.getElementById('fecha-inicio-permisos').value;
            fechaFin = document.getElementById('fecha-fin-permisos').value;
            table = window.permisosTable;
            break;
        case 'actas': // NUEVO CASO
            fechaInicio = document.getElementById('fecha-inicio-actas').value;
            fechaFin = document.getElementById('fecha-fin-actas').value;
            table = window.actasTable;
            break;
    }
    
    if (!fechaInicio && !fechaFin) {
        alert('Por favor, selecciona al menos una fecha');
        return;
    }
    
    // Redibujar la tabla para aplicar filtros
    table.draw();
}

// Función para limpiar el filtro de fechas
function limpiarFiltroFechas(tabla) {
    switch(tabla) {
        case 'reportes':
            document.getElementById('fecha-inicio-reportes').value = '';
            document.getElementById('fecha-fin-reportes').value = '';
            window.reportesTable.draw();
            break;
        case 'vacaciones':
            document.getElementById('fecha-inicio-vacaciones').value = '';
            document.getElementById('fecha-fin-vacaciones').value = '';
            window.vacacionesTable.draw();
            break;
        case 'permisos':
            document.getElementById('fecha-inicio-permisos').value = '';
            document.getElementById('fecha-fin-permisos').value = '';
            window.permisosTable.draw();
            break;
        case 'actas': // NUEVO CASO
            document.getElementById('fecha-inicio-actas').value = '';
            document.getElementById('fecha-fin-actas').value = '';
            window.actasTable.draw();
            break;
    }
}

function initReportesTable() {
    window.reportesTable = $('#reportes-table').DataTable({
        dom: 'Bfrtip',
        buttons: [
            'copy', 'csv', 'excel', 'pdf'
        ],
        responsive: true,
        language: {
            url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json'
        },
        columns: [
            { data: 'idReporte' },
            { 
                data: null,
                render: function(data) {
                    return `${data.Nombres} ${data.Paterno} ${data.Materno}`;
                }
            },
            { data: 'Observaciones' },
            { data: 'TipoAsunto' },
            { 
                data: 'FechaReporte',
                render: function(data) {
                    return new Date(data).toLocaleDateString('es-ES');
                },
                type: 'date'
            }
        ]
    });
}

function initVacacionesTable() {
    window.vacacionesTable = $('#vacaciones-table').DataTable({
        dom: 'Bfrtip',
        buttons: [
            'copy', 'csv', 'excel', 'pdf'
        ],
        responsive: true,
        language: {
            url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json'
        },
        columns: [
            { data: 'idVacaciones' },
            { 
                data: null,
                render: function(data) {
                    return `${data.Nombres} ${data.Paterno} ${data.Materno}`;
                }
            },
            { data: 'EstadoSolicitud' },
            { data: 'DiasSolicitados' },
            { 
                data: 'FechaSalida',
                render: function(data) {
                    return new Date(data).toLocaleDateString('es-ES');
                },
                type: 'date'
            },
            { 
                data: 'FechaRegreso',
                render: function(data) {
                    return new Date(data).toLocaleDateString('es-ES');
                },
                type: 'date'
            }
        ]
    });
}

function initPermisosTable() {
    window.permisosTable = $('#permisos-table').DataTable({
        dom: 'Bfrtip',
        buttons: [
            'copy', 'csv', 'excel', 'pdf'
        ],
        responsive: true,
        language: {
            url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json'
        },
        columns: [
            { data: 'idPermiso' },
            { 
                data: null,
                render: function(data) {
                    return `${data.Nombres} ${data.Paterno} ${data.Materno}`;
                }
            },
            { data: 'EstadoSolicitud' },
            { 
                data: 'DiaSolicitado',
                render: function(data) {
                    return new Date(data).toLocaleDateString('es-ES');
                },
                type: 'date'
            },
            { 
                data: null,
                render: function(data) {
                    return `${data.HoraInicio} - ${data.HoraFin}`;
                }
            },
            { data: 'Razon' },
            { data: 'TipoCompensacion' }
        ]
    });
}

// NUEVA FUNCIÓN: Inicializar tabla de Actas
function initActasTable() {
    window.actasTable = $('#actas-table').DataTable({
        dom: 'Bfrtip',
        buttons: [
            'copy', 'csv', 'excel', 'pdf'
        ],
        responsive: true,
        language: {
            url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json'
        },
        columns: [
            { 
                data: null,
                render: function(data) {
                    return `${data.nombres} ${data.paterno} ${data.materno}`;
                }
            },
            { data: 'TipoAsunto' },
            { 
                data: 'FechaActa',
                render: function(data) {
                    return new Date(data).toLocaleDateString('es-ES');
                },
                type: 'date'
            },
            { 
                data: 'Comentario',
                render: function(data) {
                    // Limitar la longitud del comentario para mejor visualización
                    if (data && data.length > 50) {
                        return data.substring(0, 50) + '...';
                    }
                    return data || '';
                }
            }
        ]
    });
}

// FILTRO GLOBAL ÚNICO - Se ejecuta después de inicializar todas las tablas
$(document).ready(function() {
    // Limpiar filtros existentes para evitar duplicados
    $.fn.dataTable.ext.search.length = 0;
    
    // Agregar un solo filtro global que maneje todas las tablas
    $.fn.dataTable.ext.search.push(function(settings, data, dataIndex) {
        const tableId = settings.nTable.id;
        
        // Determinar qué inputs de fecha usar según la tabla
        let fechaInicio, fechaFin, columnaFecha;
        
        if (tableId === 'reportes-table') {
            fechaInicio = document.getElementById('fecha-inicio-reportes').value;
            fechaFin = document.getElementById('fecha-fin-reportes').value;
            columnaFecha = 4; // Columna de FechaReporte
        } else if (tableId === 'vacaciones-table') {
            fechaInicio = document.getElementById('fecha-inicio-vacaciones').value;
            fechaFin = document.getElementById('fecha-fin-vacaciones').value;
            columnaFecha = 4; // Columna de FechaSalida
        } else if (tableId === 'permisos-table') {
            fechaInicio = document.getElementById('fecha-inicio-permisos').value;
            fechaFin = document.getElementById('fecha-fin-permisos').value;
            columnaFecha = 3; // Columna de DiaSolicitado
        } else if (tableId === 'actas-table') { // NUEVA CONDICIÓN
            fechaInicio = document.getElementById('fecha-inicio-actas').value;
            fechaFin = document.getElementById('fecha-fin-actas').value;
            columnaFecha = 2; // Columna de FechaActa
        } else {
            return true; // Si no es una tabla conocida, mostrar todo
        }
        
        // Si no hay fechas de filtro, mostrar todo
        if (!fechaInicio && !fechaFin) {
            return true;
        }
        
        // Obtener la fecha de la fila actual
        const fechaFila = parsearFecha(data[columnaFecha]);
        if (!fechaFila) return false;
        
        // Parsear fechas de filtro
        const inicio = fechaInicio ? parsearFecha(fechaInicio) : null;
        const fin = fechaFin ? parsearFecha(fechaFin) : null;
        
        // Aplicar filtro
        if (inicio && fin) {
            return fechaFila >= inicio && fechaFila <= fin;
        } else if (inicio) {
            return fechaFila >= inicio;
        } else if (fin) {
            return fechaFila <= fin;
        }
        
        return true;
    });
});

function loadReportes() {
    fetch('/api/reportes-historial')
        .then(response => response.json())
        .then(data => {
            window.reportesTable.clear().rows.add(data).draw();
            window.reportesLoaded = true;
        })
        .catch(error => console.error('Error al cargar reportes:', error));
}

function loadVacaciones() {
    fetch('/api/vacaciones-historial')
        .then(response => response.json())
        .then(data => {
            window.vacacionesTable.clear().rows.add(data).draw();
            window.vacacionesLoaded = true;
        })
        .catch(error => console.error('Error al cargar vacaciones:', error));
}

function loadPermisos() {
    fetch('/api/permisos-historial')
        .then(response => response.json())
        .then(data => {
            window.permisosTable.clear().rows.add(data).draw();
            window.permisosLoaded = true;
        })
        .catch(error => console.error('Error al cargar permisos:', error));
}

// NUEVA FUNCIÓN: Cargar datos de Actas
function loadActas() {
    fetch('/api/actas')
        .then(response => response.json())
        .then(data => {
            window.actasTable.clear().rows.add(data).draw();
            window.actasLoaded = true;
        })
        .catch(error => console.error('Error al cargar actas:', error));
}