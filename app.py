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
def obtener_area_usuario(id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT a.NombreArea
        FROM Usuario u
        JOIN Area a ON u.Area_idArea = a.idArea
        WHERE u.idUsuario = ?
    """, (id,))
    row = cursor.fetchone()
    conn.close()

    if row:
        return jsonify({"NombreArea": row[0]})
    else:
        return jsonify({"error": "Área no encontrada"}), 404
    
    


@app.route('/api/solicitarVacaciones', methods=['POST'])
def solicitar_vacaciones():
    try:
        data = request.json
        id_usuario = data.get('idUsuario')
        fecha_salida = data.get('fechaInicio')
        fecha_regreso = data.get('fechaFin')
        motivo = data.get('motivo')

        # Validación de datos requeridos
        if not all([id_usuario, fecha_salida, fecha_regreso, motivo]):
            return jsonify({"error": "Faltan datos requeridos"}), 400

        conn = get_connection()
        cursor = conn.cursor()

        # Verificar que el usuario existe y obtener sus días disponibles
        cursor.execute("SELECT DiasDisponibles FROM Usuario WHERE idUsuario = ?", (id_usuario,))
        usuario = cursor.fetchone()
        if not usuario:
            return jsonify({"error": "Usuario no encontrado"}), 404

        dias_disponibles = usuario[0] or 0

        # Calcular días solicitados
        dias_solicitados = contar_dias_habiles(fecha_salida, fecha_regreso)

        if dias_solicitados > dias_disponibles:
            return jsonify({
                "error": f"No tienes suficientes días disponibles. Disponibles: {dias_disponibles}, Solicitados: {dias_solicitados}"
            }), 400

        # Obtener el ID de estado "Pendiente de aprobar por tu líder"
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
                FechaRegreso, 
                Motivo
            ) VALUES (?, ?, ?, ?, ?, ?)
        """, (id_usuario, estado_id, dias_solicitados, fecha_salida, fecha_regreso, motivo))

       

        conn.commit()

        return jsonify({
            "mensaje": "Solicitud registrada correctamente",
            "dias_solicitados": dias_solicitados
        }), 201

    except Exception as e:
        print("ERROR EN SOLICITAR VACACIONES:", e)
        return jsonify({"error": "Error al registrar solicitud"}), 500
    finally:
        conn.close()


def contar_dias_habiles(fecha_inicio, fecha_fin):
    """Calcula los días hábiles entre dos fechas (excluyendo fines de semana)"""
    try:
        # Convertir strings a objetos date
        from datetime import datetime, timedelta
        inicio = datetime.strptime(fecha_inicio, '%Y-%m-%d').date()
        fin = datetime.strptime(fecha_fin, '%Y-%m-%d').date()
        
        dias = 0
        current = inicio
        while current <= fin:
            if current.weekday() < 5:  # 0-4 = lunes a viernes
                dias += 1
            current += timedelta(days=1)
        return dias
    except:
        return 0  # En caso de error, retornar 0 (debería manejarse mejor)




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
    cursor.execute("SELECT idUsuario, nombres, paterno, materno, puesto FROM Usuario")
    empleados = [
        {
            "id": row.idUsuario,
            "nombre": f"{row.nombres} {row.paterno} {row.materno}",
            "puesto": row.puesto
        } for row in cursor.fetchall()
    ]
    conn.close()
    return jsonify(empleados)

@app.route('/api/empleado/<int:id>', methods=['GET'])
def obtener_empleado(id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT u.*, r.TipoRol, a.NombreArea
        FROM Usuario u
        LEFT JOIN Rol r ON u.Rol_idRol = r.idRol
        LEFT JOIN Area a ON u.Area_idArea = a.idArea
        WHERE u.idUsuario = ?
    """, id)
    row = cursor.fetchone()
    if not row:
        return jsonify({"error": "Empleado no encontrado"}), 404
    columns = [col[0] for col in cursor.description]
    conn.close()
    return jsonify(dict(zip(columns, row)))

@app.route('/api/empleado/<int:id>', methods=['PUT'])
def actualizar_empleado(id):
    data = request.get_json()
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1 FROM Usuario WHERE idUsuario = ?", id)
        if not cursor.fetchone():
            return jsonify({"error": "Empleado no encontrado"}), 404

        cursor.execute("""
            UPDATE Usuario SET
                Rol_idRol = ?, Area_idArea = ?, Nombres = ?, Paterno = ?, Materno = ?,
                FechaNacimiento = ?, Direccion = ?, CodigoPostal = ?, Correo = ?, NSS = ?, Telefono = ?,
                FechaIngreso = ?, RFC = ?, Curp = ?, Puesto = ?, NombreContactoEmergencia = ?,
                TelefonoEmergencia = ?, Parentesco = ?, clave = ?,
                SueldoDiario = ?, SueldoSemanal = ?, BonoSemanal = ?, Vacaciones = ?, DiasDisponibles = ?
            WHERE idUsuario = ?
        """, (
            data['rol_id'],
            data['area_id'],
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
        if any(k not in data or not str(data[k]).isdigit() for k in ['SueldoDiario', 'SueldoSemanal', 'BonoSemanal']):
            return jsonify({"error": "Faltan datos de sueldo o no son válidos"}), 400

        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT 1 FROM Usuario WHERE idUsuario = ?", (data['idUsuario'],))
        if cursor.fetchone():
            return jsonify({"error": "El ID de usuario ya existe"}), 400

        cursor.execute("SELECT 1 FROM Usuario WHERE Correo = ?", (data['correo'],))
        if cursor.fetchone():
            return jsonify({"error": "El correo ya está registrado"}), 400

        cursor.execute("SELECT idRol FROM Rol WHERE idRol = ?", data['rol_id'])
        if not cursor.fetchone():
            return jsonify({"error": "Rol no válido"}), 400

        cursor.execute("SELECT idArea FROM Area WHERE idArea = ?", data['area_id'])
        if not cursor.fetchone():
            return jsonify({"error": "Área no válida"}), 400

        cursor.execute("""
            INSERT INTO Usuario (
                idUsuario, Rol_idRol, Area_idArea, Nombres, Paterno, Materno,
                FechaNacimiento, Direccion, CodigoPostal, Correo, NSS, Telefono,
                FechaIngreso, RFC, Curp, Puesto, NombreContactoEmergencia,
                TelefonoEmergencia, Parentesco, FechaBaja, ComentarioSalida,
                clave, Estado, SueldoDiario, SueldoSemanal, BonoSemanal, Vacaciones,
                       DiasDisponibles
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL,
                    ?, 'Activo', ?, ?, ?, ?,?)
        """, (
            int(data['idUsuario']),
            data['rol_id'],
            data['area_id'],
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

        conn.commit()
        return jsonify({"mensaje": "Empleado insertado correctamente"}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/empleado/<int:id>', methods=['DELETE'])
def eliminar_empleado(id):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1 FROM Usuario WHERE idUsuario = ?", id)
        if not cursor.fetchone():
            return jsonify({"error": "Empleado no encontrado"}), 404
        cursor.execute("DELETE FROM Usuario WHERE idUsuario = ?", id)
        conn.commit()
        return jsonify({"mensaje": "Empleado eliminado correctamente"}), 200
    except Exception as e:
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
        cursor.execute("SELECT TipoCompensacion FROM Compensacion")
        resultados = cursor.fetchall()
        cursor.close()
        conn.close()

        compensaciones = [row[0] for row in resultados]
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
            SELECT idUsuario, nombres, paterno, materno, vacaciones 
            FROM Usuario 
            WHERE idUsuario = ?
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

@app.route('/api/vacaciones/area/<int:idArea>', methods=['GET'])
def obtener_vacaciones_por_area(idArea):
    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT v.idVacaciones, v.FechaSalida, v.FechaRegreso, u.Nombres, u.Paterno, u.Materno
            FROM Vacaciones v
            JOIN Usuario u ON v.Usuario_idUsuario = u.idUsuario
            JOIN Area a ON u.Area_idArea = a.idArea
            WHERE a.idArea = ?
        """, (idArea,))

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
        print("ERROR EN /api/vacaciones/area:", str(e))
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()




@app.route('/<path:filename>')
def serve_file(filename):
    return send_from_directory('.', filename)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
