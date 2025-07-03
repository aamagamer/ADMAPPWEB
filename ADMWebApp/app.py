from flask import Flask, request, jsonify, send_from_directory
import pyodbc
from flask_cors import CORS

app = Flask(__name__, static_url_path='', static_folder='.')
CORS(app)

# Conexión a SQL Server
conn = pyodbc.connect(
    'DRIVER={ODBC Driver 17 for SQL Server};'
    'SERVER=192.168.0.76\\SQLEXPRESS;'
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

@app.route('/api/empleados', methods=['GET'])  # 👈 ahora está en el lugar correcto
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

@app.route('/<path:filename>')
def serve_file(filename):
    return send_from_directory('.', filename)

if __name__ == '__main__':
    app.run(debug=True)
