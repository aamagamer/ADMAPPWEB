document.addEventListener('DOMContentLoaded', function() {
    // Inicializar las tablas
    initReportesTable();
    initVacacionesTable();
    initPermisosTable();
    
    // Cargar datos iniciales
    loadReportes();
});

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
                }
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
                }
            },
            { 
                data: 'FechaRegreso',
                render: function(data) {
                    return new Date(data).toLocaleDateString('es-ES');
                }
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
                }
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