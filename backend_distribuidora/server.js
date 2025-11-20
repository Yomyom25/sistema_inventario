const express = require('express');
const mysql = require('mysql2');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware básico
app.use(express.json());

// Configuración de la conexión a la base de datos XAMPP
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'distribuidora_martin',
    port: 3306
});

// Conectar a la base de datos
db.connect((err) => {
    if (err) {
        console.error('Error conectando a la base de datos:', err);
        return;
    }
    console.log('Conectado a la base de datos MySQL - Distribuidora Martin');
});

// Ruta de prueba para verificar la conexión
app.get('/api/test-db', (req, res) => {
    db.query('SELECT 1 + 1 AS result', (err, results) => {
        if (err) {
            console.error('Error en consulta de prueba:', err);
            return res.status(500).json({ error: 'Error en la base de datos' });
        }
        res.json({ message: 'Conexión exitosa a la BD', result: results[0].result });
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// Exportar la conexión para usar en otros archivos si es necesario
module.exports = db;