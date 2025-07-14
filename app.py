from flask import Flask, request, jsonify, send_from_directory
import pyodbc
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__, static_url_path='', static_folder='.')
CORS(app)

def get_connection():
    return pyodbc.connect(
        'DRIVER={ODBC Driver 17 for SQL Server};'
        'SERVER=tcp:192.168.0.202,1433;'
        'DATABASE=ADM;'
        'UID=ADM;'
        'PWD=ADMuser2025;'
        'Trusted_Connection=no;'
        'Encrypt=no;'
        'Connection Timeout=10;'
    )

@app.route('/api/usuario/<int:id>/area', methods=['GET'])
def obtener_areas_usuario(id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT a.idArea, a.NombreArea
        FROM Usuario_Area ua
        JOIN Area a ON ua.idArea = a.idArea
        WHERE ua.idUsuario = ?
    """, (id,))
    rows = cursor.fetchall()
    conn.close()

    areas = [{"idArea": row[0], "NombreArea": row[1]} for row in rows]
    return jsonify(areas)

    
    


@app.route('/api/solicitarVacaciones', methods=['POST'])
def solicitar_vacaciones():
    conn = None  # Evita UnboundLocalError en el finally

    try:
        data = request.json
        id_usuario = data.get('idUsuario')
        fecha_salida = data.get('fechaInicio')
        fecha_regreso = data.get('fechaFin')
        motivo = data.get('motivo')
        dias_solicitados = data.get('diasSolicitados')  # Se recibe desde el frontend

        # Validación de datos requeridos
        if not all([id_usuario, fecha_salida, fecha_regreso, dias_solicitados]):
            return jsonify({"error": "Faltan datos requeridos"}), 400

        try:
            dias_solicitados = int(dias_solicitados)
        except (ValueError, TypeError):
            return jsonify({"error": "Días solicitados inválidos"}), 400

        conn = get_connection()
        cursor = conn.cursor()

        # Verificar existencia del usuario y días disponibles
        cursor.execute("SELECT DiasDisponibles FROM Usuario WHERE idUsuario = ?", (id_usuario,))
        row = cursor.fetchone()
        if not row:
            return jsonify({"error": "Usuario no encontrado"}), 404

        dias_disponibles = row[0] or 0

        if dias_solicitados > dias_disponibles:
            return jsonify({
                "error": f"No tienes suficientes días disponibles. Disponibles: {dias_disponibles}, Solicitados: {dias_solicitados}"
            }), 400

        # Obtener el estado "Pendiente de aprobar por tu líder"
        cursor.execute("""
            SELECT idSolicitud FROM EstadoSolicitud 
            WHERE Estado = 'Pendiente de aprobar por tu líder'
        """)
        estado_result = cursor.fetchone()

        if not estado_result:
            return jsonify({"error": "Estado de solicitud no encontrado"}), 404

        estado_id = estado_result[0]

        # Insertar la solicitud de vacaciones
        cursor.execute("""
            INSERT INTO Vacaciones (
                Usuario_idUsuario, 
                EstadoSolicitud_idSolicitud, 
                DiasSolicitados,
                FechaSalida, 
                FechaRegreso 
            ) VALUES (?, ?, ?, ?, ?)
        """, (id_usuario, estado_id, dias_solicitados, fecha_salida, fecha_regreso))

        # Actualizar los días disponibles del usuario
        cursor.execute("""
            UPDATE Usuario
            SET DiasDisponibles = DiasDisponibles - ?
            WHERE idUsuario = ?
        """, (dias_solicitados, id_usuario))

        conn.commit()

        return jsonify({
            "mensaje": "Solicitud registrada correctamente",
            "dias_solicitados": dias_solicitados
        }), 201

    except Exception as e:
        print("ERROR EN SOLICITAR VACACIONES:", e)
        return jsonify({"error": "Error al registrar solicitud"}), 500

    finally:
        if conn:
            conn.close()






def calcular_dias_vacaciones(fecha_ingreso_str):
    hoy = datetime.now().date()
    fecha_ingreso = datetime.strptime(fecha_ingreso_str, '%Y-%m-%d').date()

    años = hoy.year - fecha_ingreso.year
    if (hoy.month, hoy.day) < (fecha_ingreso.month, fecha_ingreso.day):
        años -= 1

    if años < 1:
        return 0
    elif años == 1:
        return 12
    elif años == 2:
        return 14
    elif años == 3:
        return 16
    elif años == 4:
        return 18
    elif años == 5:
        return 20
    elif 6 <= años <= 10:
        return 22
    elif 11 <= años <= 15:
        return 24
    elif 16 <= años <= 20:
        return 26
    elif 21 <= años <= 25:
        return 28
    else:
        return 30
    
@app.route('/api/diafestivo', methods=['POST'])
def insertar_dia_festivo():
    data = request.get_json()

    fecha = data.get('fecha')
    descripcion = data.get('descripcion')
    anio = data.get('anio')

    if not fecha or not descripcion or not anio:
        return jsonify({'error': 'Todos los campos son obligatorios'}), 400

    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO DiasFestivos (Fecha, Descripcion, Anio)
            VALUES (?, ?, ?)
        """, (fecha, descripcion, anio))
        conn.commit()
        return jsonify({'mensaje': 'Día festivo insertado correctamente'}), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500

    finally:
        cursor.close()
        conn.close()

        


@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/login', methods=['POST'])
def login():
    username = request.form.get('username')
    password = request.form.get('password')

    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT u.idUsuario, u.clave, r.TipoRol
            FROM Usuario u
            JOIN Rol r ON u.Rol_idRol = r.idRol
            WHERE u.idUsuario = ?
        """, username)
        row = cursor.fetchone()

        if row and row.clave == password:
            cursor.execute("SELECT FechaIngreso, Vacaciones FROM Usuario WHERE idUsuario = ?", username)
            ingreso_row = cursor.fetchone()
            if ingreso_row:
                fecha_ingreso_str = ingreso_row.FechaIngreso.strftime('%Y-%m-%d')
                vacaciones_actuales = ingreso_row.Vacaciones or 0
                vacaciones_calculadas = calcular_dias_vacaciones(fecha_ingreso_str)
                if vacaciones_actuales != vacaciones_calculadas:
                    cursor.execute("UPDATE Usuario SET Vacaciones = ? WHERE idUsuario = ?",
                                   vacaciones_calculadas, username)
                    conn.commit()

            rol = row.TipoRol.strip()
            rutas = {'Empleado': 'empleado.html', 'RH': 'rh.html', 'Administrador': 'admin.html', 'Lider Area' : 'lider.html'}
            return jsonify({
                "success": True,
                "redirect": rutas.get(rol, "index.html"),
                "idUsuario": row.idUsuario
            })
        return jsonify({"success": False, "message": "Usuario o contraseña incorrectos"})
    except Exception as e:
        return jsonify({"success": False, "message": f"Error al conectar: {e}"})
    finally:
        conn.close()

@app.route('/api/empleados', methods=['GET'])
def obtener_empleados():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT idUsuario, nombres, paterno, materno, puesto FROM Usuario where Estado = 'Activo' ")
    empleados = [
        {
            "id": row.idUsuario,
            "nombre": f"{row.nombres} {row.paterno} {row.materno}",
            "puesto": row.puesto
        } for row in cursor.fetchall()
    ]
    conn.close()
    return jsonify(empleados)

@app.route('/api/actualizarEstadoSolicitud', methods=['POST'])
def actualizar_estado_solicitud():
    try:
        data = request.json
        id_vacacion = data.get("idVacaciones")
        nuevo_estado = int(data.get("estadoNuevo"))

        conn = get_connection()
        cursor = conn.cursor()

        # Actualiza el estado de la solicitud
        cursor.execute("""
            UPDATE Vacaciones
            SET EstadoSolicitud_idSolicitud = ?
            WHERE idVacaciones = ?
        """, (nuevo_estado, id_vacacion))

        # Si se rechaza la solicitud, recuperar los días solicitados REALES
        if nuevo_estado == 1:
            cursor.execute("""
                SELECT Usuario_idUsuario, DiasSolicitados
                FROM Vacaciones
                WHERE idVacaciones = ?
            """, (id_vacacion,))
            result = cursor.fetchone()

            if result:
                id_usuario, dias_solicitados = result

                # Asegurar que solo se sumen días positivos
                if dias_solicitados > 0:
                    cursor.execute("""
                        UPDATE Usuario
                        SET DiasDisponibles = DiasDisponibles + ?
                        WHERE idUsuario = ?
                    """, (dias_solicitados, id_usuario))

        conn.commit()
        return jsonify({"mensaje": "Estado actualizado"}), 200

    except Exception as e:
        print("Error:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()





@app.route('/api/empleado/<int:id>', methods=['GET'])
def obtener_empleado(id):
    try:
        conn = get_connection()
        cursor = conn.cursor()

        # Consulta principal del usuario
        cursor.execute("""
            SELECT u.*, r.TipoRol
            FROM Usuario u
            LEFT JOIN Rol r ON u.Rol_idRol = r.idRol
            WHERE u.idUsuario = ?
        """, id)

        row = cursor.fetchone()
        if not row:
            return jsonify({"error": "Empleado no encontrado"}), 404

        columns = [col[0] for col in cursor.description]
        usuario = dict(zip(columns, row))

        # Consulta de áreas corregida
        cursor.execute("""
            SELECT a.idArea, a.NombreArea
            FROM Usuario_Area ua
            JOIN Area a ON ua.idArea = a.idArea
            WHERE ua.idUsuario = ?
        """, id)

        usuario["Areas"] = [{"idArea": r[0], "NombreArea": r[1]} for r in cursor.fetchall()]

        return jsonify(usuario)

    except Exception as e:
        print(f"Error al obtener empleado: {e}")
        return jsonify({"error": "Error interno del servidor"}), 500
    finally:
        conn.close()



@app.route('/api/empleado/<int:id>', methods=['PUT'])
def actualizar_empleado(id):
    data = request.get_json()
    try:
        conn = get_connection()
        cursor = conn.cursor()

        # Verifica que el usuario exista
        cursor.execute("SELECT 1 FROM Usuario WHERE idUsuario = ?", id)
        if not cursor.fetchone():
            return jsonify({"error": "Empleado no encontrado"}), 404

        # Actualizar datos del usuario (sin Area_idArea porque ya no existe)
        cursor.execute("""
            UPDATE Usuario SET
                Rol_idRol = ?, Nombres = ?, Paterno = ?, Materno = ?,
                FechaNacimiento = ?, Direccion = ?, CodigoPostal = ?, Correo = ?, NSS = ?, Telefono = ?,
                FechaIngreso = ?, RFC = ?, Curp = ?, Puesto = ?, NombreContactoEmergencia = ?,
                TelefonoEmergencia = ?, Parentesco = ?, clave = ?,
                SueldoDiario = ?, SueldoSemanal = ?, BonoSemanal = ?, Vacaciones = ?, DiasDisponibles = ?
            WHERE idUsuario = ?
        """, (
            data['rol_id'],
            data['nombres'],
            data['paterno'],
            data['materno'],
            data['fechaNacimiento'],
            data['direccion'],
            data['codigoPostal'],
            data['correo'],
            int(data['nss']),
            int(data['telefono']),
            data['fechaIngreso'],
            data['rfc'],
            data['curp'],
            data['puesto'],
            data['nombreContactoEmergencia'],
            int(data['telefonoEmergencia']),
            data['parentesco'],
            data['contraseña'],
            int(data['SueldoDiario']),
            int(data['SueldoSemanal']),
            int(data['BonoSemanal']),
            int(data['Vacaciones']),
            int(data['diasDisponibles']),
            id
        ))

        # 1. Eliminar áreas anteriores del usuario
        cursor.execute("DELETE FROM Usuario_Area WHERE idUsuario = ?", id)

        # 2. Insertar las nuevas áreas (si hay)
        areas = data.get("areas", [])
        for area_id in areas:
            cursor.execute(
                "INSERT INTO Usuario_Area (idUsuario, idArea) VALUES (?, ?)",
                (id, area_id)
            )

        conn.commit()
        return jsonify({"mensaje": "Empleado actualizado correctamente"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()


@app.route('/api/empleado', methods=['POST'])
def agregar_empleado():
    data = request.get_json()
    try:
        # Validaciones...

        conn = get_connection()
        cursor = conn.cursor()

        # Insertar en Usuario (sin Area_idArea)
        cursor.execute("""
            INSERT INTO Usuario (
                idUsuario, Rol_idRol, Nombres, Paterno, Materno,
                FechaNacimiento, Direccion, CodigoPostal, Correo, NSS, Telefono,
                FechaIngreso, RFC, Curp, Puesto, NombreContactoEmergencia,
                TelefonoEmergencia, Parentesco, FechaBaja, ComentarioSalida,
                clave, Estado, SueldoDiario, SueldoSemanal, BonoSemanal, Vacaciones,
                DiasDisponibles
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL,
                    ?, 'Activo', ?, ?, ?, ?, ?)
        """, (
            int(data['idUsuario']),
            data['rol_id'],
            data['nombres'],
            data['paterno'],
            data.get('materno'),
            data['fechaNacimiento'],
            data['direccion'],
            data['codigoPostal'],
            data['correo'],
            int(data['nss']),
            int(data['telefono']),
            data['fechaIngreso'],
            data['rfc'],
            data['curp'],
            data['puesto'],
            data['nombreContactoEmergencia'],
            int(data['telefonoEmergencia']),
            data['parentesco'],
            data['contraseña'],
            int(data['SueldoDiario']),
            int(data['SueldoSemanal']),
            int(data['BonoSemanal']),
            int(data['Vacaciones']),
            int(data['diasDisponibles'])
        ))

        # Obtener lista de areas, ya sea IDs o nombres
        area_ids = data.get('areas')
        if not area_ids or not isinstance(area_ids, list):
            return jsonify({"error": "Debes proporcionar al menos una área (lista)"}), 400

        # Si son nombres, convertir a ids:
        # Si tienes IDs directamente, comenta este bloque
        """
        area_ids_real = []
        for nombre_area in area_ids:
            cursor.execute("SELECT idArea FROM Area WHERE NombreArea = ?", (nombre_area,))
            row = cursor.fetchone()
            if not row:
                return jsonify({"error": f"Área '{nombre_area}' no existe"}), 400
            area_ids_real.append(row[0])
        area_ids = area_ids_real
        """

        # Insertar en tabla intermedia
        for id_area in area_ids:
            cursor.execute("SELECT 1 FROM Area WHERE idArea = ?", (id_area,))
            if not cursor.fetchone():
                return jsonify({"error": f"Área con ID {id_area} no existe"}), 400
            cursor.execute("INSERT INTO Usuario_Area (idUsuario, idArea) VALUES (?, ?)",
                           (int(data['idUsuario']), id_area))

        conn.commit()
        return jsonify({"mensaje": "Empleado insertado correctamente"}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()



@app.route('/api/empleado/baja/<int:id>', methods=['PUT'])
def baja_empleado(id):
    try:
        data = request.json
        fecha_baja = data.get("fechaBaja")
        comentario = data.get("comentarioSalida")

        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT 1 FROM Usuario WHERE idUsuario = ?", (id,))
        if not cursor.fetchone():
            return jsonify({"error": "Empleado no encontrado"}), 404

        cursor.execute("""
            UPDATE Usuario
            SET Estado = 'Inactivo',
                FechaBaja = ?,
                ComentarioSalida = ?
            WHERE idUsuario = ?
        """, (fecha_baja, comentario, id))

        conn.commit()
        return jsonify({"mensaje": "Empleado dado de baja correctamente"}), 200

    except Exception as e:
        print("Error al dar de baja:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        conn.close()



@app.route('/api/roles', methods=['GET'])
def obtener_roles():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT idRol, TipoRol FROM Rol")
    roles = [{"idRol": row[0], "TipoRol": row[1]} for row in cursor.fetchall()]
    conn.close()
    return jsonify(roles)

@app.route('/api/areas', methods=['GET'])
def obtener_areas():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT idArea, NombreArea FROM Area")
    areas = [{"idArea": row[0], "NombreArea": row[1]} for row in cursor.fetchall()]
    conn.close()
    return jsonify(areas)

@app.route('/api/compensaciones', methods=['GET'])
def obtener_compensaciones():
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT idCompensacion, TipoCompensacion FROM Compensacion")
        resultados = cursor.fetchall()
        cursor.close()
        conn.close()

        compensaciones = [{"id": row[0], "nombre": row[1]} for row in resultados]
        return jsonify({"compensaciones": compensaciones})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    
    


@app.route('/api/usuario/nombre', methods=['POST'])
def obtener_nombre_usuario():
    data = request.json
    id_usuario = data.get("idUsuario")

    if not id_usuario:
        return jsonify({"error": "Falta el ID del usuario"}), 400

    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT nombres, paterno, materno
            FROM Usuario
            WHERE idUsuario = ?
        """, id_usuario)
        row = cursor.fetchone()
        conn.close()

        if row:
            return jsonify({
                "nombres": row[0],
                "paterno": row[1],
                "materno": row[2]
            })
        else:
            return jsonify({"error": "Usuario no encontrado"}), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/api/festivos', methods=['GET'])
def obtener_festivos():
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT Fecha FROM DiasFestivos")
        resultados = cursor.fetchall()
        fechas = [row[0].strftime('%Y-%m-%d') for row in resultados]
        return jsonify(fechas)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/vacacionesUsuario/<int:idUsuario>', methods=['GET'])
def obtener_vacaciones(idUsuario):
    try: 
        conn = get_connection()
        cursor = conn.cursor()

        # Consulta con parámetro para obtener vacaciones solo del usuario con idUsuario dado
        cursor.execute("""
    SELECT 
        u.idUsuario, 
        u.nombres, 
        u.paterno, 
        u.materno, 
        u.vacaciones
    FROM 
        Usuario u
    JOIN 
        Vacaciones v ON u.idUsuario = v.Usuario_idUsuario
    WHERE 
        u.idUsuario = ? AND v.EstadoSolicitud_idSolicitud = 18
""", (idUsuario,))

        row = cursor.fetchone()

        if row:
            vacaciones = {
                "idUsuario": row[0],
                "nombreCompleto": f"{row[1]} {row[2]} {row[3]}",
                "vacaciones": row[4]
            }
            return jsonify(vacaciones), 200
        else:
            return jsonify({"error": "Usuario no encontrado"}), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()




@app.route('/api/vacaciones/area/<ids>', methods=['GET'])
def obtener_vacaciones_por_areas(ids):
    try:
        lista_ids = ids.split(",")  # ["13", "14"]
        placeholders = ",".join("?" for _ in lista_ids)

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(f"""
    SELECT v.idVacaciones, v.FechaSalida, v.FechaRegreso, u.Nombres, u.Paterno, u.Materno
    FROM Vacaciones v
    JOIN Usuario u ON v.Usuario_idUsuario = u.idUsuario
    JOIN Usuario_Area ua ON ua.idUsuario = u.idUsuario
    WHERE ua.idArea IN ({placeholders}) AND EstadoSolicitud_idSolicitud = 18
""", lista_ids)

        rows = cursor.fetchall()
        vacaciones = []

        for row in rows:
            inicio = row[1].strftime('%Y-%m-%d') if row[1] else ""
            fin = row[2].strftime('%Y-%m-%d') if row[2] else ""
            nombre = f"{row[3]} {row[4]} {row[5]}"
            vacaciones.append({
                "id": row[0],
                "inicio": inicio,
                "fin": fin,
                "nombre": nombre
            })

        return jsonify(vacaciones)

    except Exception as e:
        print("ERROR EN /api/vacaciones/area/<ids>:", str(e))
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()

@app.route('/api/permisos/area/<ids>', methods=['GET'])
def obtener_permisos_por_areas(ids):
    try:
        lista_ids = ids.split(",")  # Ej. ["13", "14"]
        placeholders = ",".join("?" for _ in lista_ids)

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute(f"""
            SELECT 
                p.idPermiso, 
                p.DiaSolicitado, 
                p.HoraInicio, 
                p.HoraFin,
                p.Razon,
                ISNULL(c.TipoCompensacion, 'Sin compensación'),
                u.Nombres, u.Paterno, u.Materno
            FROM Permiso p
            JOIN Usuario u ON p.Usuario_idUsuario = u.idUsuario
            JOIN Usuario_Area ua ON ua.idUsuario = u.idUsuario
            LEFT JOIN Compensacion c ON p.Compensacion_idCompensacion = c.idCompensacion
            WHERE ua.idArea IN ({placeholders}) AND p.EstadoSolicitud_idSolicitud = 18
        """, tuple(int(i) for i in lista_ids))

        rows = cursor.fetchall()
        permisos = []

        for row in rows:
            permisos.append({
                "id": row[0],
                "fecha": row[1].strftime('%Y-%m-%d') if row[1] else "",
                "inicio": row[2].strftime('%H:%M') if row[2] else "",
                "fin": row[3].strftime('%H:%M') if row[3] else "",
                "razon": row[4],
                "compensacion": row[5],
                "nombre": f"{row[6]} {row[7]} {row[8]}"
            })

        return jsonify(permisos)

    except Exception as e:
        print("❌ ERROR EN /api/permisos/area/<ids>:", str(e))
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()

@app.route('/api/solicitarPermiso', methods=['POST'])
def solicitar_permiso():
    try:
        data = request.get_json()
        print("📥 JSON recibido:", data)  # <== imprime lo que llega

        id_usuario = data.get("idUsuario")
        fecha = data.get("fecha")
        hora_inicio = data.get("horaInicio")
        hora_fin = data.get("horaFin")
        razon = data.get("razon")
        id_compensacion = data.get("idCompensacion")

        print("🧩 Datos individuales:")
        print("Usuario:", id_usuario)
        print("Fecha:", fecha)
        print("Hora inicio:", hora_inicio)
        print("Hora fin:", hora_fin)
        print("Razon:", razon)
        print("ID compensación:", id_compensacion)

        if not all([id_usuario, fecha, hora_inicio, hora_fin, razon, id_compensacion]):
            print("❌ Campos faltantes")
            return jsonify({"error": "Faltan campos obligatorios"}), 400

        conn = get_connection()
        cursor = conn.cursor()

        # Estado "pendiente"
        cursor.execute("SELECT idSolicitud FROM EstadoSolicitud WHERE Estado = 'Pendiente de aprobar por tu líder'")
        estado_row = cursor.fetchone()
        print("🟢 Estado obtenido:", estado_row)
        if not estado_row:
            return jsonify({"error": "Estado pendiente no encontrado"}), 500
        estado_id = estado_row[0]

        # INSERT
        print("📤 Ejecutando INSERT...")
        cursor.execute("""
            INSERT INTO Permiso (
                Usuario_idUsuario, EstadoSolicitud_idSolicitud, DiaSolicitado,
                HoraInicio, HoraFin, Razon, Compensacion_idCompensacion
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (id_usuario, estado_id, fecha, hora_inicio, hora_fin, razon, id_compensacion))

        conn.commit()
        print("✅ INSERT hecho y commit ejecutado")
        return jsonify({"mensaje": "Permiso solicitado correctamente"}), 201

    except Exception as e:
        print("❌ ERROR:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        if conn:
            conn.close()








@app.route('/<path:filename>')
def serve_file(filename):
    return send_from_directory('.', filename)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
