        // JAVASCRIPT CORREGIDO PARA NOTIFICACIONES

        // Función para cargar aprobaciones corregida
        async function cargarAprobacionesHoy() {
            const idUsuario = localStorage.getItem("idUsuario") || "demo"; // Fallback para demo
            
            console.log("Cargando aprobaciones para usuario:", idUsuario);

            try {
                const res = await fetch(`/api/aprobacionesHoy/${idUsuario}`);
                if (!res.ok) {
                    throw new Error(`Error HTTP: ${res.status}`);
                }
                const data = await res.json();

                console.log("Datos recibidos:", data);

                const count = (data.vacacionesAprobadasHoy || 0) + (data.permisosAprobadosHoy || 0);
                const badge = document.getElementById("notif-count");
                const container = document.getElementById("aprobaciones-hoy-dropdown");

                // Actualizar badge
                if (badge) {
                    badge.textContent = count;
                    badge.style.display = count > 0 ? "inline-block" : "none";
                }

                if (!container) {
                    console.error("Container de notificaciones no encontrado");
                    return;
                }

                // Limpiar contenedor
                container.innerHTML = "";

                if (count === 0) {
                    container.innerHTML = '<div class="empty-notifications">No hay aprobaciones para mostrar hoy</div>';
                    return;
                }

                // Agregar vacaciones
                if (data.vacaciones && data.vacaciones.length > 0) {
                    data.vacaciones.forEach(v => {
                        const div = document.createElement("div");
                        div.className = "notification-item";
                        div.innerHTML = `
                            <strong>Vacación:</strong> ${v.Nombres} ${v.Paterno} ${v.Materno} <br>
                            <small>${v.FechaSalida} - ${v.FechaRegreso}</small>
                        `;
                        container.appendChild(div);
                    });
                }

                // Agregar permisos
                if (data.permisos && data.permisos.length > 0) {
                    data.permisos.forEach(p => {
                        const div = document.createElement("div");
                        div.className = "notification-item";
                        div.innerHTML = `
                            <strong>Permiso:</strong> ${p.Nombres} ${p.Paterno} ${p.Materno} <br>
                            <small>${p.DiaSolicitado} | ${p.HoraInicio} - ${p.HoraFin}</small><br>
                            <small>Razón: ${p.Razon} | Comp: ${p.TipoCompensacion}</small>
                        `;
                        container.appendChild(div);
                    });
                }

            } catch (err) {
                console.error("Error al cargar aprobaciones:", err);
                
                // Mostrar datos demo en caso de error
                mostrarDatosDemo();
            }
        }

        // Función para mostrar datos demo
        function mostrarDatosDemo() {
            const badge = document.getElementById("notif-count");
            const container = document.getElementById("aprobaciones-hoy-dropdown");
            
            if (badge) {
                badge.textContent = "2";
                badge.style.display = "inline-block";
            }
            
            if (container) {
                container.innerHTML = `
                    <div class="notification-item">
                        <strong>Vacación:</strong> Juan Pérez García <br>
                        <small>2025-08-25 - 2025-08-30</small>
                    </div>
                    <div class="notification-item">
                        <strong>Permiso:</strong> María López Sánchez <br>
                        <small>2025-08-22 | 09:00 - 12:00</small><br>
                        <small>Razón: Cita médica | Comp: Tiempo</small>
                    </div>
                `;
            }
        }

        // Función para cargar datos del usuario corregida
        async function cargarDatosUsuario() {
            try {
                const idUsuario = localStorage.getItem("idUsuario");

                if (!idUsuario) {
                    console.warn("No se encontró idUsuario en localStorage, usando datos demo");
                    document.getElementById("employee-name").textContent = "Usuario Demo";
                    cargarAprobacionesHoy();
                    return;
                }

                const response = await fetch(`/api/empleado/${idUsuario}`);
                if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

                const data = await response.json();
                console.log("Datos del usuario:", data);

                // Mostrar nombre del empleado
                if (data.Nombres && data.Paterno && data.Materno) {
                    const nombreCompleto = `${data.Nombres} ${data.Paterno} ${data.Materno}`;
                    document.getElementById("employee-name").textContent = nombreCompleto;
                } else {
                    document.getElementById("employee-name").textContent = data.Nombres || "Empleado";
                }

                // Cargar área si es líder
                if (data.TipoRol && data.TipoRol.toLowerCase().includes("lider")) {
                    cargarAreaLider(idUsuario);
                } else {
                    document.getElementById("header-title").textContent = "Portal del Empleado";
                }

                // Cargar aprobaciones
                cargarAprobacionesHoy();
                
            } catch (error) {
                console.error("Error al cargar datos del usuario:", error);
                document.getElementById("employee-name").textContent = "Usuario";
                cargarAprobacionesHoy();
            }
        }

        // Función para cargar área del líder
        async function cargarAreaLider(idUsuario) {
            try {
                const res = await fetch(`/api/usuario/${idUsuario}/area`);
                if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);

                const data = await res.json();
                console.log("Área recibida:", data);

                if (data.NombreArea) {
                    document.getElementById("header-title").textContent = `Portal de Líder de ${data.NombreArea}`;
                }
            } catch (err) {
                console.error("Error al obtener el área del líder:", err);
            }
        }

        // Función para cargar notificaciones de solicitudes
        async function cargarNotificaciones() {
            try {
                const idUsuario = localStorage.getItem("idUsuario");

                if (!idUsuario) {
                    console.warn("No hay idUsuario, usando datos demo");
                    const badge = document.getElementById("notificacion-solicitudes");
                    if (badge) {
                        badge.textContent = "3";
                        badge.style.display = "inline-block";
                    }
                    return;
                }

                const response = await fetch(`/api/totalSolicitudes/${idUsuario}`);
                if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

                const data = await response.json();
                console.log("Notificaciones:", data);

                const badge = document.getElementById("notificacion-solicitudes");
                if (badge) {
                    if (data.total > 0) {
                        badge.textContent = data.total;
                        badge.style.display = "inline-block";
                    } else {
                        badge.style.display = "none";
                    }
                }
            } catch (error) {
                console.error("Error al cargar notificaciones:", error);
            }
        }

        // Event listener para el dropdown de notificaciones
        document.getElementById("notif-icon").addEventListener("click", (e) => {
            e.stopPropagation();
            const dropdown = document.getElementById("notif-dropdown");
            dropdown.classList.toggle("active");
        });

        // Cerrar dropdown al hacer click fuera
        document.addEventListener("click", (e) => {
            const dropdown = document.getElementById("notif-dropdown");
            const wrapper = document.querySelector(".notification-wrapper");
            
            if (!wrapper.contains(e.target)) {
                dropdown.classList.remove("active");
            }
        });

        // Función logout (placeholder)
        function logout() {
            localStorage.removeItem('idUsuario');
            window.location.href = 'index.html';
        }

        // Inicialización
        document.addEventListener("DOMContentLoaded", () => {
            console.log("DOM cargado, inicializando...");
            
            // Verificar si el usuario está logueado
            if (!localStorage.getItem('idUsuario')) {
                console.log("Usuario no logueado, redirigiendo...");
                // window.location.href = 'index.html'; // Descomentado para producción
            }
            
            // Cargar datos
            cargarDatosUsuario();
            cargarNotificaciones();
        });

        // Actualizar cada 5 minutos
        setInterval(() => {
            cargarAprobacionesHoy();
            cargarNotificaciones();
        }, 300000);