$(document).ready(function () {
    let reportesTable, vacacionesTable, permisosTable, todosTable;
    let allRawData = {}; // To store the original fetched data for detail view

    // Helper function to format dates
    function formatDate(dateString) {
        if (!dateString) return '-';
        try {
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            return new Date(dateString).toLocaleDateString('es-ES', options);
        } catch (error) {
            console.error("Error formatting date:", dateString, error);
            return dateString; // Return original if invalid
        }
    }

    // Function to process and categorize data
    function procesarDatos(data) {
        const reportes = [];
        const vacaciones = [];
        const permisos = [];
        const todos = []; // Combined data for the "Todos" table

        // Process reportes
        data.reportes.forEach(r => {
            const processed = {
                id: r.idReporte,
                empleado: `${r.Nombres} ${r.Paterno} ${r.Materno}`,
                categoria: r.TipoAsunto || 'No especificado',
                detalles: r.Observaciones || 'Sin observaciones',
                fecha: r.FechaReporte,
                original: r // Store original for detail view
            };
            reportes.push(processed);
            todos.push({
                tipo: { key: 'reporte', class: 'reporte', icon: '📋', text: 'Reporte' },
                ...processed,
                estado: null, // Reportes don't have a direct 'estado' in this structure
                fecha: r.FechaReporte // Use original date for sorting/filtering
            });
        });

        // Process vacaciones
        data.vacaciones.forEach(v => {
            const processed = {
                id: v.idVacaciones,
                empleado: `${v.Nombres} ${v.Paterno} ${v.Materno}`,
                diasSolicitados: v.DiasSolicitados,
                periodo: `Del ${formatDate(v.FechaSalida)} al ${formatDate(v.FechaRegreso)}`,
                estado: v.EstadoSolicitud,
                fechaSolicitud: v.FechaSolicitud,
                original: v
            };
            vacaciones.push(processed);
            todos.push({
                tipo: { key: 'vacaciones', class: 'vacaciones', icon: '🏖️', text: 'Vacaciones' },
                ...processed,
                categoria: `${v.DiasSolicitados} días`, // For 'Todos' table
                detalles: `Del ${formatDate(v.FechaSalida)} al ${formatDate(v.FechaRegreso)}`, // For 'Todos' table
                fecha: v.FechaSolicitud // Use original date for sorting/filtering
            });
        });

        // Process permisos
        data.permisos.forEach(p => {
            const horario = p.HoraInicio && p.HoraFin ?
                `${p.HoraInicio} - ${p.HoraFin}` : 'Todo el día';
            const processed = {
                id: p.idPermiso,
                empleado: `${p.Nombres} ${p.Paterno} ${p.Materno}`,
                tipo: p.TipoCompensacion || 'No especificado',
                fecha: p.DiaSolicitado,
                horario: horario,
                razon: p.Razon,
                estado: p.EstadoSolicitud,
                original: p
            };
            permisos.push(processed);
            todos.push({
                tipo: { key: 'permiso', class: 'permiso', icon: '⏰', text: 'Permiso' },
                ...processed,
                categoria: p.TipoCompensacion || 'No especificado', // For 'Todos' table
                detalles: `${p.Razon} (${horario})`, // For 'Todos' table
                fecha: p.DiaSolicitado // Use original date for sorting/filtering
            });
        });

        return { reportes, vacaciones, permisos, todos };
    }

    // Initialize DataTables
    function initializeTables(processedData) {
        const commonTableConfig = {
            dom: '<"top"lf>rt<"bottom"ipB>', // l: length changing input, f: filtering input, r: processing display, t: table, i: information, p: pagination, B: buttons
            pageLength: 10,
            language: {
                url: "https://cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json"
            },
            responsive: true,
            buttons: [
                {
                    extend: 'excelHtml5',
                    text: '<i class="fas fa-file-excel"></i> Exportar a Excel',
                    className: 'dt-button export-excel-btn',
                    title: 'Historial_ADM'
                }
            ]
        };

        // Reportes Table
        reportesTable = $('#tabla-reportes').DataTable({
            ...commonTableConfig,
            data: processedData.reportes,
            columns: [
                { title: "ID", data: "id" },
                { title: "Empleado", data: "empleado" },
                { title: "Categoría", data: "categoria" },
                { title: "Detalles", data: "detalles" },
                {
                    title: "Fecha",
                    data: "fecha",
                    render: function (data) { return formatDate(data); }
                },
                {
                    title: "Acciones",
                    data: "id",
                    orderable: false,
                    render: function (data, type, row) {
                        return `<button class="view-btn" data-id="${data}" data-type="reporte">
                                    <i class="fas fa-eye"></i> Ver
                                </button>`;
                    }
                }
            ],
            // Add data-label for responsive mode
            createdRow: function(row, data, dataIndex) {
                $(row).find('td:eq(0)').attr('data-label', 'ID:');
                $(row).find('td:eq(1)').attr('data-label', 'Empleado:');
                $(row).find('td:eq(2)').attr('data-label', 'Categoría:');
                $(row).find('td:eq(3)').attr('data-label', 'Detalles:');
                $(row).find('td:eq(4)').attr('data-label', 'Fecha:');
                $(row).find('td:eq(5)').attr('data-label', 'Acciones:');
            }
        });

        // Vacaciones Table
        vacacionesTable = $('#tabla-vacaciones').DataTable({
            ...commonTableConfig,
            data: processedData.vacaciones,
            columns: [
                { title: "ID", data: "id" },
                { title: "Empleado", data: "empleado" },
                { title: "Días Solicitados", data: "diasSolicitados" },
                { title: "Periodo", data: "periodo" },
                {
                    title: "Estado",
                    data: "estado",
                    render: function (data) { return data ? `<span class="estado-${data.toLowerCase()}">${data}</span>` : '-'; }
                },
                {
                    title: "Fecha de Solicitud",
                    data: "fechaSolicitud",
                    render: function (data) { return formatDate(data); }
                },
                {
                    title: "Acciones",
                    data: "id",
                    orderable: false,
                    render: function (data, type, row) {
                        return `<button class="view-btn" data-id="${data}" data-type="vacaciones">
                                    <i class="fas fa-eye"></i> Ver
                                </button>`;
                    }
                }
            ],
            // Add data-label for responsive mode
            createdRow: function(row, data, dataIndex) {
                $(row).find('td:eq(0)').attr('data-label', 'ID:');
                $(row).find('td:eq(1)').attr('data-label', 'Empleado:');
                $(row).find('td:eq(2)').attr('data-label', 'Días Solicitados:');
                $(row).find('td:eq(3)').attr('data-label', 'Periodo:');
                $(row).find('td:eq(4)').attr('data-label', 'Estado:');
                $(row).find('td:eq(5)').attr('data-label', 'Fecha de Solicitud:');
                $(row).find('td:eq(6)').attr('data-label', 'Acciones:');
            }
        });

        // Permisos Table
        permisosTable = $('#tabla-permisos').DataTable({
            ...commonTableConfig,
            data: processedData.permisos,
            columns: [
                { title: "ID", data: "id" },
                { title: "Empleado", data: "empleado" },
                { title: "Tipo", data: "tipo" },
                {
                    title: "Fecha",
                    data: "fecha",
                    render: function (data) { return formatDate(data); }
                },
                { title: "Horario", data: "horario" },
                { title: "Razón", data: "razon" },
                {
                    title: "Estado",
                    data: "estado",
                    render: function (data) { return data ? `<span class="estado-${data.toLowerCase()}">${data}</span>` : '-'; }
                },
                {
                    title: "Acciones",
                    data: "id",
                    orderable: false,
                    render: function (data, type, row) {
                        return `<button class="view-btn" data-id="${data}" data-type="permiso">
                                    <i class="fas fa-eye"></i> Ver
                                </button>`;
                    }
                }
            ],
            // Add data-label for responsive mode
            createdRow: function(row, data, dataIndex) {
                $(row).find('td:eq(0)').attr('data-label', 'ID:');
                $(row).find('td:eq(1)').attr('data-label', 'Empleado:');
                $(row).find('td:eq(2)').attr('data-label', 'Tipo:');
                $(row).find('td:eq(3)').attr('data-label', 'Fecha:');
                $(row).find('td:eq(4)').attr('data-label', 'Horario:');
                $(row).find('td:eq(5)').attr('data-label', 'Razón:');
                $(row).find('td:eq(6)').attr('data-label', 'Estado:');
                $(row).find('td:eq(7)').attr('data-label', 'Acciones:');
            }
        });

        // Todos Table (Combined)
        todosTable = $('#tabla-todos').DataTable({
            ...commonTableConfig,
            data: processedData.todos,
            columns: [
                {
                    title: "Tipo",
                    data: "tipo",
                    render: function (data) {
                        return `<span class="badge badge-${data.class}">${data.icon} ${data.text}</span>`;
                    }
                },
                { title: "ID", data: "id" },
                { title: "Empleado", data: "empleado" },
                { title: "Categoría", data: "categoria" },
                { title: "Detalles", data: "detalles" },
                {
                    title: "Estado",
                    data: "estado",
                    render: function (data) { return data ? `<span class="estado-${data.toLowerCase()}">${data}</span>` : '-'; }
                },
                {
                    title: "Fecha",
                    data: "fecha",
                    render: function (data) { return formatDate(data); }
                },
                {
                    title: "Acciones",
                    data: "id",
                    orderable: false,
                    render: function (data, type, row) {
                        return `<button class="view-btn" data-id="${data}" data-type="${row.tipo.key}">
                                    <i class="fas fa-eye"></i> Ver
                                </button>`;
                    }
                }
            ],
            // Add data-label for responsive mode
            createdRow: function(row, data, dataIndex) {
                $(row).find('td:eq(0)').attr('data-label', 'Tipo:');
                $(row).find('td:eq(1)').attr('data-label', 'ID:');
                $(row).find('td:eq(2)').attr('data-label', 'Empleado:');
                $(row).find('td:eq(3)').attr('data-label', 'Categoría:');
                $(row).find('td:eq(4)').attr('data-label', 'Detalles:');
                $(row).find('td:eq(5)').attr('data-label', 'Estado:');
                $(row).find('td:eq(6)').attr('data-label', 'Fecha:');
                $(row).find('td:eq(7)').attr('data-label', 'Acciones:');
            }
        });
    }

    // Date range filtering function for DataTables
    $.fn.dataTable.ext.search.push(
        function (settings, data, dataIndex) {
            const $tableSection = $('#' + settings.sTableId).closest('.table-section');
            const startDate = $tableSection.find('.date-filter-start').val();
            const endDate = $tableSection.find('.date-filter-end').val();
            let dateColumnIndex;

            // Determine the date column index based on table ID
            switch (settings.sTableId) {
                case 'tabla-reportes':
                    dateColumnIndex = 4; // 'Fecha' column
                    break;
                case 'tabla-vacaciones':
                    dateColumnIndex = 5; // 'Fecha de Solicitud' column
                    break;
                case 'tabla-permisos':
                    dateColumnIndex = 3; // 'Fecha' column
                    break;
                case 'tabla-todos':
                    dateColumnIndex = 6; // 'Fecha' column
                    break;
                default:
                    return true; // No date filtering for unknown tables
            }

            const columnDate = data[dateColumnIndex]; // Use the raw date string from the data array

            if (!columnDate) return true; // If no date, include the row

            const min = startDate ? new Date(startDate) : null;
            const max = endDate ? new Date(endDate) : null;
            const date = new Date(columnDate);

            if (
                (min === null && max === null) ||
                (min === null && date <= max) ||
                (min <= date && max === null) ||
                (min <= date && date <= max)
            ) {
                return true;
            }
            return false;
        }
    );

    // Fetch data and initialize
    fetch('/api/datos-generales') // Assuming you have this endpoint or a local JSON file
        .then(res => res.json())
        .then(data => {
            allRawData = data; // Store original data
            const processedData = procesarDatos(data);
            initializeTables(processedData);

            // Event listeners for search inputs
            $('.search-input').on('keyup', function () {
                const tableId = $(this).data('table-id');
                const table = $.fn.dataTable.tables({ id: tableId, api: true });
                if (table.length > 0) {
                    table.search(this.value).draw();
                }
            });

            // Event listeners for date filters
            $('.date-filter-start, .date-filter-end').on('change', function () {
                const tableId = $(this).data('table-id');
                const table = $.fn.dataTable.tables({ id: tableId, api: true });
                if (table.length > 0) {
                    table.draw(); // Redraw table to apply date filter
                }
            });

            // Event listeners for export buttons
            $('.export-btn').on('click', function () {
                const tableId = $(this).data('table-id');
                const table = $.fn.dataTable.tables({ id: tableId, api: true });
                if (table.length > 0) {
                    table.button('.buttons-excel').trigger();
                }
            });

            // Event listener for view details buttons (delegated)
            $('#tables-container').on('click', '.view-btn', function () {
                const id = $(this).data('id');
                const type = $(this).data('type');
                mostrarDetalles(id, type, allRawData); // Pass original raw data
            });

            // Initial display: show reportes section
            showTableSection('reportes');
        })
        .catch(err => {
            console.error("Error cargando datos:", err);
            mostrarError("Error al cargar los datos. Por favor, intente nuevamente.");
        });

    // Function to show/hide table sections
    function showTableSection(sectionId) {
        $('.table-section').removeClass('active').addClass('hidden');
        $(`#${sectionId}-section`).removeClass('hidden').addClass('active');

        // Redraw the active table to ensure correct layout after visibility change
        const activeTableId = $(`#${sectionId}-section`).find('table').attr('id');
        const activeTable = $.fn.dataTable.tables({ id: activeTableId, api: true });
        if (activeTable.length > 0) {
            activeTable.columns.adjust().draw();
        }
    }

    // Event listener for filter buttons (tabs)
    $('.filter-btn').on('click', function () {
        const filter = $(this).data('filter');
        $('.filter-btn').removeClass('active');
        $(this).addClass('active');
        showTableSection(filter);
    });

    // Function to display details in the modal
    function mostrarDetalles(id, type, data) {
        let registro;
        let titulo = '';
        let contenido = '';
        let badgeText = '';

        switch (type) {
            case 'reporte':
                registro = data.reportes.find(r => r.idReporte == id);
                titulo = `Detalles del Reporte #${id}`;
                badgeText = 'Reporte';
                if (registro) {
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
                }
                break;

            case 'vacaciones':
                registro = data.vacaciones.find(v => v.idVacaciones == id);
                titulo = `Detalles de Vacaciones #${id}`;
                badgeText = 'Vacaciones';
                if (registro) {
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
                            <span class="detail-value estado-${registro.EstadoSolicitud?.toLowerCase()}">${registro.EstadoSolicitud}</span>
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
                }
                break;

            case 'permiso':
                registro = data.permisos.find(p => p.idPermiso == id);
                titulo = `Detalles de Permiso #${id}`;
                badgeText = 'Permiso';
                if (registro) {
                    const horario = registro.HoraInicio && registro.HoraFin ?
                        `${registro.HoraInicio} - ${registro.HoraFin}` : 'Todo el día';
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
                            <span class="detail-value estado-${registro.EstadoSolicitud?.toLowerCase()}">${registro.EstadoSolicitud}</span>
                        </div>
                        ${registro.Comentarios ? `
                        <div class="detail-row">
                            <span class="detail-label">Comentarios:</span>
                            <span class="detail-value">${registro.Comentarios}</span>
                        </div>` : ''}
                    `;
                }
                break;
        }

        if (registro) {
            $('#modal-title').text(titulo);
            $('#modal-badge').attr('class', `badge badge-${type}`);
            $('#modal-badge').text(badgeText);
            $('#modal-body').html(contenido);
            $('#detailModal').fadeIn();
        } else {
            mostrarError("No se encontró el registro para mostrar detalles.");
        }
    }

    // Close modal
    $('.close-modal, #modal-close-btn').on('click', function () {
        $('#detailModal').fadeOut();
    });

    // Show error (can be replaced with a more elegant notification)
    function mostrarError(mensaje) {
        alert(mensaje);
    }
});