from flask import Flask, request, jsonify, send_from_directory
import pyodbc
from flask_cors import CORS

app = Flask(__name__, static_url_path='', static_folder='.')
CORS(app)

# Conexión a SQL Server
conn = pyodbc.connect(
    'DRIVER={ODBC Driver 17 for SQL Server};'
    'SERVER=192.168.0.202,1433;'
    'DATABASE=ADM;'
    'UID=ADM;'
    'PWD=ADMuser2025'
)
cursor = conn.cursor()

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/login', methods=['POST'])
def login():
    username = request.form.get('username')
    password = request.form.get('password')

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

@app.route('/api/empleados', methods=['GET'])
def obtener_empleados():
    cursor.execute("SELECT idUsuario, nombres, paterno, materno, puesto FROM Usuario")
    empleados = []

    for row in cursor.fetchall():
        empleados.append({
            "id": row.idUsuario,
            "nombre": f"{row.nombres} {row.paterno} {row.materno}",
            "puesto": row.puesto
        })

    return jsonify(empleados)

@app.route('/api/empleado/<int:id>', methods=['GET'])
def obtener_empleado(id):
    cursor.execute("SELECT * FROM Usuario WHERE idUsuario = ?", id)
    row = cursor.fetchone()

    if row:
        columns = [column[0] for column in cursor.description]
        empleado = dict(zip(columns, row))
        return jsonify(empleado)
    else:
        return jsonify({"error": "Empleado no encontrado"}), 404

# Nuevo endpoint: obtener roles para combobox
@app.route('/api/roles', methods=['GET'])
def obtener_roles():
    cursor.execute("SELECT TipoRol FROM Rol")
    roles = [row[0] for row in cursor.fetchall()]
    return jsonify(roles)

# Nuevo endpoint: obtener áreas para combobox
@app.route('/api/areas', methods=['GET'])
def obtener_areas():
    cursor.execute("SELECT NombreArea FROM Area")
    areas = [row[0] for row in cursor.fetchall()]
    return jsonify(areas)

@app.route('/<path:filename>')
def serve_file(filename):
    return send_from_directory('.', filename)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
