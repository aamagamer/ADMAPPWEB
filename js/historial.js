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
                original: r
            };
            reportes.push(processed);
            todos.push({
                tipo: { key: 'reporte', class: 'reporte', icon: '📋', text: 'Reporte' },
                ...processed,
                estado: null,
                fecha: r.FechaReporte
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
                categoria: `${v.DiasSolicitados} días`,
                detalles: `Del ${formatDate(v.FechaSalida)} al ${formatDate(v.FechaRegreso)}`,
                fecha: v.FechaSolicitud
            });
        });

        // Process permisos
        data.permisos.forEach(p => {
            const horario = p.HoraInicio && p.HoraFin ?
                `${p.HoraInicio} - ${p.HoraFin}` : 'Todo el día';
            const processed = {
                id: p.idPermiso,
                empleado: `${p.Nombres} ${p.Paterno} ${p.Materno}`,
                tipoPermiso: p.TipoCompensacion || 'No especificado',
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
                categoria: p.TipoCompensacion || 'No especificado',
                detalles: `${p.Razon} (${horario})`,
                fecha: p.DiaSolicitado
            });
        });

        return { reportes, vacaciones, permisos, todos };
    }

    // Initialize DataTables
    function initializeTables(processedData) {
        const commonTableConfig = {
            dom: '<"top"lf>rt<"bottom"ipB>',
            pageLength: 10,
            pagingType: 'full_numbers',
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
            ],
            drawCallback: function () {
                $('.dataTables_paginate').css({
                    'display': 'flex',
                    'flex-direction': 'row',
                    'justify-content': 'center',
                    'gap': '5px'
                });
            }
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
                { title: "Fecha", data: "fecha", render: formatDate },
                {
                    title: "Acciones", data: "id", orderable: false,
                    render: d => `<button class="view-btn" data-id="${d}" data-type="reporte"><i class="fas fa-eye"></i> Ver</button>`
                }
            ]
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
                { title: "Estado", data: "estado", render: d => d ? `<span class="estado-${d.toLowerCase()}">${d}</span>` : '-' },
                { title: "Fecha de Solicitud", data: "fechaSolicitud", render: formatDate },
                {
                    title: "Acciones", data: "id", orderable: false,
                    render: d => `<button class="view-btn" data-id="${d}" data-type="vacaciones"><i class="fas fa-eye"></i> Ver</button>`
                }
            ]
        });

        // Permisos Table
        permisosTable = $('#tabla-permisos').DataTable({
            ...commonTableConfig,
            data: processedData.permisos,
            columns: [
                { title: "ID", data: "id" },
                { title: "Empleado", data: "empleado" },
                { title: "Tipo", data: "tipoPermiso" },
                { title: "Fecha", data: "fecha", render: formatDate },
                { title: "Horario", data: "horario" },
                { title: "Razón", data: "razon" },
                { title: "Estado", data: "estado", render: d => d ? `<span class="estado-${d.toLowerCase()}">${d}</span>` : '-' },
                {
                    title: "Acciones", data: "id", orderable: false,
                    render: d => `<button class="view-btn" data-id="${d}" data-type="permiso"><i class="fas fa-eye"></i> Ver</button>`
                }
            ]
        });

        // Todos Table
        todosTable = $('#tabla-todos').DataTable({
            ...commonTableConfig,
            data: processedData.todos,
            columns: [
                {
                    title: "Tipo", data: "tipo",
                    render: data => `<span class="badge badge-${data.class}">${data.icon} ${data.text}</span>`
                },
                { title: "ID", data: "id" },
                { title: "Empleado", data: "empleado" },
                { title: "Categoría", data: "categoria" },
                { title: "Detalles", data: "detalles" },
                { title: "Estado", data: "estado", render: d => d ? `<span class="estado-${d.toLowerCase()}">${d}</span>` : '-' },
                { title: "Fecha", data: "fecha", render: formatDate },
                {
                    title: "Acciones", data: "id", orderable: false,
                    render: (d, t, r) => `<button class="view-btn" data-id="${d}" data-type="${r.tipo.key}"><i class="fas fa-eye"></i> Ver</button>`
                }
            ]
        });
    }

    // Date range filtering function
    $.fn.dataTable.ext.search.push(function (settings, data) {
        const $tableSection = $('#' + settings.sTableId).closest('.table-section');
        const startDate = $tableSection.find('.date-filter-start').val();
        const endDate = $tableSection.find('.date-filter-end').val();
        let dateColumnIndex;

        switch (settings.sTableId) {
            case 'tabla-reportes': dateColumnIndex = 4; break;
            case 'tabla-vacaciones': dateColumnIndex = 5; break;
            case 'tabla-permisos': dateColumnIndex = 3; break;
            case 'tabla-todos': dateColumnIndex = 6; break;
            default: return true;
        }

        const columnDate = data[dateColumnIndex];
        if (!columnDate) return true;

        const min = startDate ? new Date(startDate) : null;
        const max = endDate ? new Date(endDate) : null;
        const date = new Date(columnDate);

        return (
            (min === null && max === null) ||
            (min === null && date <= max) ||
            (min <= date && max === null) ||
            (min <= date && date <= max)
        );
    });

    // Fetch and init
    fetch('/api/datos-generales')
        .then(res => res.json())
        .then(data => {
            allRawData = data;
            const processedData = procesarDatos(data);
            initializeTables(processedData);

            $('.search-input').on('keyup', function () {
                const table = $('#' + $(this).data('table-id')).DataTable();
                table.search(this.value).draw();
            });

            $('.date-filter-start, .date-filter-end').on('change', function () {
                const table = $('#' + $(this).data('table-id')).DataTable();
                table.draw();
            });

            $('.export-btn').on('click', function () {
                const table = $('#' + $(this).data('table-id')).DataTable();
                table.button('.buttons-excel').trigger();
            });

            $('#tables-container').on('click', '.view-btn', function () {
                const id = $(this).data('id');
                const type = $(this).data('type');
                mostrarDetalles(id, type, allRawData);
            });

            showTableSection('reportes');
        })
        .catch(err => {
            console.error("Error cargando datos:", err);
            alert("Error al cargar los datos. Por favor, intente nuevamente.");
        });

    function showTableSection(sectionId) {
        $('.table-section').removeClass('active').addClass('hidden');
        $(`#${sectionId}-section`).removeClass('hidden').addClass('active');
        const table = $(`#${sectionId}-section table`).DataTable();
        table.columns.adjust().draw();
    }

    $('.filter-btn').on('click', function () {
        $('.filter-btn').removeClass('active');
        $(this).addClass('active');
        showTableSection($(this).data('filter'));
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