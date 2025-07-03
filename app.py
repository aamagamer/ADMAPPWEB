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
        conn.close()

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

@app.route('/<path:filename>')
def serve_file(filename):
    return send_from_directory('.', filename)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
