from datetime import datetime, timedelta
from flask import Flask, request, jsonify
import sqlite3
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

DB_NAME = 'users.db'
ADMIN_USERNAME = 'admin'
ADMIN_PASSWORD = 'admin123'

def init_db():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    )''')
    conn.commit()
    conn.close()

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    admin_username = data.get('admin_username')
    admin_password = data.get('admin_password')
    if not (username and password and admin_username and admin_password):
        return jsonify({'success': False, 'message': 'Eksik bilgi!'}), 400
    if admin_username != ADMIN_USERNAME or admin_password != ADMIN_PASSWORD:
        return jsonify({'success': False, 'message': 'Admin onayı başarısız!'}), 403
    try:
        conn = sqlite3.connect(DB_NAME)
        c = conn.cursor()
        c.execute('INSERT INTO users (username, password) VALUES (?, ?)', (username, password))
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'message': 'Kayıt başarılı!'})
    except sqlite3.IntegrityError:
        return jsonify({'success': False, 'message': 'Bu kullanıcı adı zaten alınmış!'}), 409

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    if not (username and password):
        return jsonify({'success': False, 'message': 'Eksik bilgi!'}), 400
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute('SELECT * FROM users WHERE username=? AND password=?', (username, password))
    user = c.fetchone()
    conn.close()
    if user:
        return jsonify({'success': True, 'message': 'Giriş başarılı!'})
    else:
        return jsonify({'success': False, 'message': 'Kullanıcı adı veya şifre yanlış!'}), 401

if __name__ == '__main__':
    init_db()
    app.run(debug=True)
