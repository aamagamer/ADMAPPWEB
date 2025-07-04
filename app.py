from flask import Flask, request, jsonify, send_from_directory
import pyodbc
from flask_cors import CORS

app = Flask(__name__, static_url_path='', static_folder='.')
CORS(app)

# Función para obtener una nueva conexión a SQL Server
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
            if rol == 'Empleado':
                return jsonify({"success": True, "redirect": "empleado.html"})
            elif rol == 'RH':
                return jsonify({"success": True, "redirect": "rh.html"})
            elif rol == 'Administrador':
                return jsonify({"success": True, "redirect": "admin.html"})
            else:
                return jsonify({"success": True, "redirect": "index.html"})
        else:
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
        }
        for row in cursor.fetchall()
    ]
    conn.close()
    return jsonify(empleados)

@app.route('/api/empleado/<int:id>', methods=['GET'])
def obtener_empleado(id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM Usuario WHERE idUsuario = ?", id)
    row = cursor.fetchone()
    columns = [column[0] for column in cursor.description]
    conn.close()

    if row:
        empleado = dict(zip(columns, row))
        return jsonify(empleado)
    else:
        return jsonify({"error": "Empleado no encontrado"}), 404

@app.route('/api/roles', methods=['GET'])
def obtener_roles():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT TipoRol FROM Rol")
    roles = [row[0] for row in cursor.fetchall()]
    conn.close()
    return jsonify(roles)

@app.route('/api/areas', methods=['GET'])
def obtener_areas():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT NombreArea FROM Area")
    areas = [row[0] for row in cursor.fetchall()]
    conn.close()
    return jsonify(areas)

@app.route('/api/empleado/<int:id>', methods=['DELETE'])
def eliminar_empleado(id):
    try:
        conn = get_connection()
        cursor = conn.cursor()

        # Verificar si el empleado existe
        cursor.execute("SELECT 1 FROM Usuario WHERE idUsuario = ?", id)
        if not cursor.fetchone():
            return jsonify({"error": "Empleado no encontrado"}), 404

        # Eliminar el empleado
        cursor.execute("DELETE FROM Usuario WHERE idUsuario = ?", id)
        conn.commit()

        return jsonify({"mensaje": "Empleado eliminado correctamente"}), 200

    except Exception as e:
        print("Error al eliminar empleado:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        conn.close()

@app.route('/api/empleado', methods=['POST'])
def agregar_empleado():
    data = request.get_json()

    try:
        conn = get_connection()
        cursor = conn.cursor()

        # Validar si el idUsuario ya existe
        cursor.execute("SELECT 1 FROM Usuario WHERE idUsuario = ?", (data['idUsuario'],))
        if cursor.fetchone():
            return jsonify({"error": "El ID de usuario ya existe"}), 400

        # Validar si el correo ya existe
        cursor.execute("SELECT 1 FROM Usuario WHERE Correo = ?", (data['correo'],))
        if cursor.fetchone():
            return jsonify({"error": "El correo ya está registrado"}), 400

        # Obtener idRol
        cursor.execute("SELECT idRol FROM Rol WHERE TipoRol = ?", data['tipoRol'])
        rol_row = cursor.fetchone()
        if not rol_row:
            return jsonify({"error": "Rol no encontrado"}), 400
        idRol = rol_row[0]

        # Obtener idArea
        cursor.execute("SELECT idArea FROM Area WHERE nombreArea = ?", data['nombreArea'])
        area_row = cursor.fetchone()
        if not area_row:
            return jsonify({"error": "Área no encontrada"}), 400
        idArea = area_row[0]

        # Validar tipos numéricos
        try:
            idUsuario = int(data['idUsuario'])
            nss = int(data['nss'])
            telefono = int(data['telefono'])
            telEmergencia = int(data['telefonoEmergencia'])
        except ValueError:
            return jsonify({"error": "NSS, teléfono y ID deben ser numéricos"}), 400

        # Insertar nuevo empleado
        cursor.execute("""
            INSERT INTO Usuario (
                idUsuario, Rol_idRol, Area_idArea, Nombres, Paterno, Materno,
                FechaNacimiento, Direccion, CodigoPostal, Correo, NSS, Telefono,
                FechaIngreso, RFC, Curp, Puesto, NombreContactoEmergencia,
                TelefonoEmergencia, Parentesco, FechaBaja, ComentarioSalida, clave
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?)
        """, (
            idUsuario,
            idRol,
            idArea,
            data['nombres'],
            data['paterno'],
            data.get('materno'),
            data['fechaNacimiento'],
            data['direccion'],
            data['codigoPostal'],
            data['correo'],
            nss,
            telefono,
            data['fechaIngreso'],
            data['rfc'],
            data['curp'],
            data['puesto'],
            data['nombreContactoEmergencia'],
            telEmergencia,
            data['parentesco'],
            data['contraseña']
        ))

        conn.commit()
        return jsonify({"mensaje": "Empleado insertado correctamente"}), 201

    except Exception as e:
        print("Error al insertar empleado:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        conn.close()

        

@app.route('/<path:filename>')
def serve_file(filename):
    return send_from_directory('.', filename)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
