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


// Obtener todos los productos (adaptado a tu BD real)
app.get('/api/productos', (req, res) => {
    const sql = 'SELECT * FROM productos';
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error al obtener productos:', err);
            return res.status(500).json({ error: 'Error al obtener productos' });
        }
        res.json(results);
    });
});

// Obtener un producto por ID
app.get('/api/productos/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM productos WHERE id_producto = ?';
    
    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Error al obtener producto:', err);
            return res.status(500).json({ error: 'Error al obtener producto' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        
        res.json(results[0]);
    });
});

// Crear un nuevo producto
app.post('/api/productos', (req, res) => {
    const { codigo, nombre, description, precio_compra, precio_venta, stock_actual } = req.body;
    
    if (!codigo || !nombre || !precio_venta || stock_actual === undefined) {
        return res.status(400).json({ 
            error: 'Faltan campos obligatorios: codigo, nombre, precio_venta, stock_actual' 
        });
    }
    
    const sql = `INSERT INTO productos 
                (codigo, nombre, description, precio_compra, precio_venta, stock_actual, fecha_creacion) 
                VALUES (?, ?, ?, ?, ?, ?, NOW())`;
    
    db.query(sql, [codigo, nombre, description, precio_compra, precio_venta, stock_actual], (err, results) => {
        if (err) {
            console.error('Error al crear producto:', err);
            return res.status(500).json({ error: 'Error al crear producto' });
        }
        
        res.status(201).json({
            id_producto: results.insertId,
            codigo,
            nombre,
            description,
            precio_compra,
            precio_venta,
            stock_actual,
            message: 'Producto creado exitosamente'
        });
    });
});

// Actualizar un producto existente
app.put('/api/productos/:id', (req, res) => {
    const { id } = req.params;
    const { codigo, nombre, description, precio_compra, precio_venta, stock_actual } = req.body;
    
    const sql = `UPDATE productos 
                SET codigo = ?, nombre = ?, description = ?, precio_compra = ?, 
                    precio_venta = ?, stock_actual = ?, fecha_actualizacion = NOW() 
                WHERE id_producto = ?`;
    
    db.query(sql, [codigo, nombre, description, precio_compra, precio_venta, stock_actual, id], (err, results) => {
        if (err) {
            console.error('Error al actualizar producto:', err);
            return res.status(500).json({ error: 'Error al actualizar producto' });
        }
        
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        
        res.json({
            id_producto: parseInt(id),
            codigo,
            nombre,
            description,
            precio_compra,
            precio_venta,
            stock_actual,
            message: 'Producto actualizado exitosamente'
        });
    });
});

// Eliminar un producto
app.delete('/api/productos/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM productos WHERE id_producto = ?';
    
    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Error al eliminar producto:', err);
            return res.status(500).json({ error: 'Error al eliminar producto' });
        }
        
        if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        
        res.json({ message: 'Producto eliminado exitosamente' });
    });
});


// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// Exportar la conexión para usar en otros archivos si es necesario
module.exports = db;