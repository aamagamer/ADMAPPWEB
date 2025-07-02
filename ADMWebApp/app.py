from flask import Flask, request, jsonify
import pyodbc
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # permite conexiones desde el frontend (evita errores CORS)

# Conexión a SQL Server
conn = pyodbc.connect(
    'DRIVER={ODBC Driver 17 for SQL Server};'
    'SERVER=.\SQLEXPRESS;'
    'DATABASE=ADM;'
    'UID=ADM;'
    'PWD=ADMuser2025'
)
cursor = conn.cursor()

@app.route('/login', methods=['POST'])
def login():
    username = request.form.get('username')  # idUsuario
    password = request.form.get('password')  # clave

    # Consulta con JOIN entre Usuario y Rol
    cursor.execute("""
        SELECT u.clave, r.TipoRol
        FROM Usuario u
        JOIN Rol r ON u.Rol_idRol = r.idRol
        WHERE u.idUsuario = ?
    """, username)

    row = cursor.fetchone()

    if row and row.clave == password:
        rol = row.TipoRol.strip()

        # Puedes retornar directamente el HTML que se debe abrir desde JS
        if rol == 'Empleado':
            return jsonify({"success": True, "rol": rol, "redirect": "empleado.html"})
        else:
            return jsonify({"success": True, "rol": rol, "redirect": "otro.html"})  # Cambia esto según necesites
    else:
        return jsonify({"success": False, "message": "Usuario o contraseña incorrectos"})

if __name__ == '__main__':
    app.run(debug=True)
