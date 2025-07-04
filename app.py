from flask import Flask, request, jsonify, send_from_directory
import pyodbc
from flask_cors import CORS

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
            SELECT u.clave, r.TipoRol
            FROM Usuario u
            JOIN Rol r ON u.Rol_idRol = r.idRol
            WHERE u.idUsuario = ?
        """, username)
        row = cursor.fetchone()
        if row and row.clave == password:
            rol = row.TipoRol.strip()
            rutas = {'Empleado': 'empleado.html', 'RH': 'rh.html', 'Administrador': 'admin.html'}
            return jsonify({"success": True, "redirect": rutas.get(rol, "index.html")})
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
                TelefonoEmergencia = ?, Parentesco = ?, clave = ?
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
                clave, Estado, SueldoDiario, SueldoSemanal, BonoSemanal
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL,
                    ?, 'Activo', ?, ?, ?)
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

@app.route('/<path:filename>')
def serve_file(filename):
    return send_from_directory('.', filename)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
