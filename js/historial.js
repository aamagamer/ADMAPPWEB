$(document).ready(function () {
    // Configuración inicial
    const tableConfig = {
        dom: '<"top"lf>rt<"bottom"ipB>',
        buttons: [
            {
                extend: 'excel',
                text: '<i class="fas fa-file-excel"></i> Exportar a Excel',
                className: 'export-excel-btn',
                title: 'Historial_ADM'
            }
        ],
        pageLength: 10,
        language: {
            url: "https://cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json"
        },
        responsive: true,
        initComplete: function() {
            // Añadir eventos a los botones de filtro
            $('.filter-btn').on('click', function() {
                const filter = $(this).data('filter');
                $('.filter-btn').removeClass('active');
                $(this).addClass('active');
                filtrarTabla(filter);
            });
        }
    };

    // Cargar datos
    fetch('/api/datos-generales')
        .then(res => res.json())
        .then(data => {
            const table = $('#tabla-historial').DataTable({
                ...tableConfig,
                data: procesarDatos(data),
                columns: [
                    { 
                        title: "Tipo", 
                        data: "tipo",
                        render: function(data) {
                            return `<span class="badge badge-${data.class}">${data.icon} ${data.text}</span>`;
                        }
                    },
                    { title: "ID", data: "id" },
                    { 
                        title: "Empleado", 
                        data: "empleado",
                        className: "col-empleado"
                    },
                    { 
                        title: "Categoría", 
                        data: "categoria",
                        className: "col-categoria"
                    },
                    { 
                        title: "Detalles", 
                        data: "detalles",
                        className: "col-detalles"
                    },
                    { 
                        title: "Estado", 
                        data: "estado",
                        className: "col-estado",
                        render: function(data) {
                            return data ? `<span class="estado-${data.toLowerCase()}">${data}</span>` : '-';
                        }
                    },
                    { 
                        title: "Fecha", 
                        data: "fecha",
                        className: "col-fecha",
                        render: function(data) {
                            return data || '-';
                        }
                    },
                    { 
                        title: "Acciones", 
                        data: "id",
                        className: "col-acciones",
                        orderable: false,
                        render: function(data, type, row) {
                            return `<button class="view-btn" data-id="${data}" data-type="${row.tipo.key}">
                                <i class="fas fa-eye"></i> Ver
                            </button>`;
                        }
                    }
                ]
            });

            // Búsqueda global
            $('#global-search').on('keyup', function() {
                table.search(this.value).draw();
            });

            // Exportar a Excel
            $('#export-excel').on('click', function() {
                $('.export-excel-btn').trigger('click');
            });

            // Evento para ver detalles
            $('#tabla-historial').on('click', '.view-btn', function() {
                const id = $(this).data('id');
                const type = $(this).data('type');
                mostrarDetalles(id, type, data);
            });
        })
        .catch(err => {
            console.error("Error cargando datos:", err);
            mostrarError("Error al cargar los datos. Por favor, intente nuevamente.");
        });

    // Función para procesar datos
    function procesarDatos(data) {
        const registros = [];

        // Procesar reportes
        data.reportes.forEach(r => {
            registros.push({
                tipo: { key: 'reporte', class: 'reporte', icon: '📋', text: 'Reporte' },
                id: r.idReporte,
                empleado: `${r.Nombres} ${r.Paterno} ${r.Materno}`,
                categoria: r.TipoAsunto || 'No especificado',
                detalles: r.Observaciones || 'Sin observaciones',
                estado: null,
                fecha: r.FechaReporte ? formatDate(r.FechaReporte) : '-'
            });
        });

        // Procesar vacaciones
        data.vacaciones.forEach(v => {
            registros.push({
                tipo: { key: 'vacaciones', class: 'vacaciones', icon: '🏖️', text: 'Vacaciones' },
                id: v.idVacaciones,
                empleado: `${v.Nombres} ${v.Paterno} ${v.Materno}`,
                categoria: `${v.DiasSolicitados} días`,
                detalles: `Del ${formatDate(v.FechaSalida)} al ${formatDate(v.FechaRegreso)}`,
                estado: v.EstadoSolicitud,
                fecha: formatDate(v.FechaSolicitud)
            });
        });

        // Procesar permisos
        data.permisos.forEach(p => {
            const horario = p.HoraInicio && p.HoraFin ? 
                `${p.HoraInicio} - ${p.HoraFin}` : 'Todo el día';
            
            registros.push({
                tipo: { key: 'permiso', class: 'permiso', icon: '⏰', text: 'Permiso' },
                id: p.idPermiso,
                empleado: `${p.Nombres} ${p.Paterno} ${p.Materno}`,
                categoria: p.TipoCompensacion || 'No especificado',
                detalles: `${p.Razon} (${horario})`,
                estado: p.EstadoSolicitud,
                fecha: formatDate(p.DiaSolicitado)
            });
        });

        return registros;
    }

    // Función para filtrar la tabla
    function filtrarTabla(tipo) {
        const table = $('#tabla-historial').DataTable();
        
        if (tipo === 'all') {
            table.columns().search('').draw();
        } else {
            // Filtrar por la columna de Tipo
            table.column(0).search(tipo).draw();
        }
    }

    // Función para mostrar detalles en modal
    function mostrarDetalles(id, type, data) {
        let registro;
        let titulo = '';
        let contenido = '';

        // Buscar el registro según el tipo
        switch(type) {
            case 'reporte':
                registro = data.reportes.find(r => r.idReporte == id);
                titulo = `Detalles del Reporte #${id}`;
                contenido = `
                    <div class="detail-row">
                        <span class="detail-label">Empleado:</span>
                        <span class="detail-value">${registro.Nombres} ${registro.Paterno} ${registro.Materno}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Tipo de Asunto:</span>
                        <span class="detail-value">${registro.TipoAsunto || 'No especificado'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Fecha:</span>
                        <span class="detail-value">${formatDate(registro.FechaReporte) || 'No especificada'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Observaciones:</span>
                        <span class="detail-value">${registro.Observaciones || 'Sin observaciones'}</span>
                    </div>
                `;
                break;
                
            case 'vacaciones':
                registro = data.vacaciones.find(v => v.idVacaciones == id);
                titulo = `Detalles de Vacaciones #${id}`;
                contenido = `
                    <div class="detail-row">
                        <span class="detail-label">Empleado:</span>
                        <span class="detail-value">${registro.Nombres} ${registro.Paterno} ${registro.Materno}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Días Solicitados:</span>
                        <span class="detail-value">${registro.DiasSolicitados} días</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Periodo:</span>
                        <span class="detail-value">Del ${formatDate(registro.FechaSalida)} al ${formatDate(registro.FechaRegreso)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Estado:</span>
                        <span class="detail-value estado-${registro.EstadoSolicitud.toLowerCase()}">${registro.EstadoSolicitud}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Fecha de Solicitud:</span>
                        <span class="detail-value">${formatDate(registro.FechaSolicitud)}</span>
                    </div>
                    ${registro.Comentarios ? `
                    <div class="detail-row">
                        <span class="detail-label">Comentarios:</span>
                        <span class="detail-value">${registro.Comentarios}</span>
                    </div>` : ''}
                `;
                break;
                
            case 'permiso':
                registro = data.permisos.find(p => p.idPermiso == id);
                const horario = registro.HoraInicio && registro.HoraFin ? 
                    `${registro.HoraInicio} - ${registro.HoraFin}` : 'Todo el día';
                
                titulo = `Detalles de Permiso #${id}`;
                contenido = `
                    <div class="detail-row">
                        <span class="detail-label">Empleado:</span>
                        <span class="detail-value">${registro.Nombres} ${registro.Paterno} ${registro.Materno}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Tipo:</span>
                        <span class="detail-value">${registro.TipoCompensacion || 'No especificado'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Fecha:</span>
                        <span class="detail-value">${formatDate(registro.DiaSolicitado)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Horario:</span>
                        <span class="detail-value">${horario}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Razón:</span>
                        <span class="detail-value">${registro.Razon}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Estado:</span>
                        <span class="detail-value estado-${registro.EstadoSolicitud.toLowerCase()}">${registro.EstadoSolicitud}</span>
                    </div>
                    ${registro.Comentarios ? `
                    <div class="detail-row">
                        <span class="detail-label">Comentarios:</span>
                        <span class="detail-value">${registro.Comentarios}</span>
                    </div>` : ''}
                `;
                break;
        }

        // Mostrar modal
        $('#modal-title').text(titulo);
        $('#modal-badge').attr('class', `badge badge-${type}`);
        $('#modal-badge').text(type === 'reporte' ? 'Reporte' : type === 'vacaciones' ? 'Vacaciones' : 'Permiso');
        $('#modal-body').html(contenido);
        $('#detailModal').fadeIn();
    }

    // Cerrar modal
    $('.close-modal, #modal-close-btn').on('click', function() {
        $('#detailModal').fadeOut();
    });

    // Formatear fecha
    function formatDate(dateString) {
        if (!dateString) return '-';
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('es-ES', options);
    }

    // Mostrar error
    function mostrarError(mensaje) {
        alert(mensaje); // En una implementación real, usarías un modal o notificación más elegante
    }
});