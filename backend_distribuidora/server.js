const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware básico
app.use(cors());
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
    const { search } = req.query;
    let sql = 'SELECT * FROM productos';
    let params = [];

    if (search) {
        sql += ' WHERE codigo LIKE ? OR nombre LIKE ?';
        params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY fecha_creacion DESC';
    
    db.query(sql, params, (err, results) => {
        if (err) {
            console.error('Error al obtener productos:', err);
            return res.status(500).json({ 
                success: false,
                error: 'Error al obtener productos' 
            });
        }
        res.json({
            success: true,
            data: results,
            total: results.length
        });
    });
});

// Obtener un producto por ID
app.get('/api/productos/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM productos WHERE id_producto = ?';
    
    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Error al obtener producto:', err);
            return res.status(500).json({ 
                success: false,
                error: 'Error al obtener producto' 
            });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: 'Producto no encontrado' 
            });
        }
        
        res.json({
            success: true,
            data: results[0]
        });
    });
});


// Validar si un código ya existe
app.get('/api/productos/validar-codigo/:codigo', (req, res) => {
    const { codigo } = req.params;
    const sql = 'SELECT COUNT(*) as count FROM productos WHERE codigo = ?';
    
    db.query(sql, [codigo], (err, results) => {
        if (err) {
            console.error('Error al validar código:', err);
            return res.status(500).json({ 
                success: false,
                error: 'Error al validar código' 
            });
        }
        
        const existe = results[0].count > 0;
        res.json({
            success: true,
            existe: existe,
            mensaje: existe ? 'El código ya está en uso' : 'Código disponible'
        });
    });
});

// Crear un nuevo producto - VERSIÓN MEJORADA CON VALIDACIONES
app.post('/api/productos/nuevo', (req, res) => {
    const { 
        codigo, 
        nombre, 
        descripcion, 
        precio_compra, 
        precio_venta, 
        stock_actual = 1  // Valor por defecto según requerimiento
    } = req.body;
    
    // Validaciones completas
    const errores = [];
    
    if (!codigo || codigo.trim() === '') {
        errores.push('El código del producto es obligatorio');
    }
    
    if (!nombre || nombre.trim() === '') {
        errores.push('El nombre del producto es obligatorio');
    }
    
    if (!descripcion || descripcion.trim() === '') {
        errores.push('La descripción del producto es obligatoria');
    }
    
    if (!precio_compra || precio_compra <= 0) {
        errores.push('El precio de compra debe ser mayor a 0');
    }
    
    if (!precio_venta || precio_venta <= 0) {
        errores.push('El precio de venta debe ser mayor a 0');
    }
    
    if (stock_actual === undefined || stock_actual < 0) {
        errores.push('El stock inicial debe ser al menos 0');
    }
    
    if (parseFloat(precio_venta) <= parseFloat(precio_compra)) {
        errores.push('El precio de venta debe ser mayor al precio de compra');
    }
    
    if (errores.length > 0) {
        return res.status(400).json({ 
            success: false,
            error: 'Errores de validación',
            detalles: errores
        });
    }
    
    // Primero verificar si el código ya existe
    const checkSql = 'SELECT COUNT(*) as count FROM productos WHERE codigo = ?';
    
    db.query(checkSql, [codigo], (err, checkResults) => {
        if (err) {
            console.error('Error al verificar código:', err);
            return res.status(500).json({ 
                success: false,
                error: 'Error al verificar código del producto' 
            });
        }
        
        if (checkResults[0].count > 0) {
            return res.status(400).json({ 
                success: false,
                error: 'El código del producto ya existe',
                detalles: ['Por favor, utiliza un código único para el producto']
            });
        }
        
        // Si pasa todas las validaciones, crear el producto
        const insertSql = `INSERT INTO productos 
                (codigo, nombre, descripcion, precio_compra, precio_venta, stock_actual, fecha_creacion) 
                VALUES (?, ?, ?, ?, ?, ?, NOW())`;
        
        db.query(insertSql, [codigo, nombre, descripcion, precio_compra, precio_venta, stock_actual], (err, results) => {
            if (err) {
                console.error('Error al crear producto:', err);
                return res.status(500).json({ 
                    success: false,
                    error: 'Error al crear producto' 
                });
            }
            
            // Obtener el producto recién creado para devolverlo
            const selectSql = 'SELECT * FROM productos WHERE id_producto = ?';
            db.query(selectSql, [results.insertId], (err, productResults) => {
                if (err) {
                    console.error('Error al obtener producto creado:', err);
                    // Aún así devolvemos éxito porque el producto se creó
                    return res.status(201).json({
                        success: true,
                        message: 'Producto creado exitosamente',
                        id_producto: results.insertId
                    });
                }
                
                res.status(201).json({
                    success: true,
                    message: 'Producto creado exitosamente',
                    data: productResults[0],
                    id_producto: results.insertId
                });
            });
        });
    });
});

// Endpoint para búsqueda específica (para el campo de búsqueda del frontend)
app.get('/api/productos/buscar/:termino', (req, res) => {
    const { termino } = req.params;
    const sql = 'SELECT * FROM productos WHERE codigo LIKE ? OR nombre LIKE ? OR descripcion LIKE ? ORDER BY nombre';
    const searchTerm = `%${termino}%`;
    
    db.query(sql, [searchTerm, searchTerm, searchTerm], (err, results) => {
        if (err) {
            console.error('Error en búsqueda:', err);
            return res.status(500).json({ 
                success: false,
                error: 'Error en la búsqueda' 
            });
        }
        
        res.json({
            success: true,
            data: results,
            total: results.length,
            termino: termino
        });
    });
});


// Actualizar un producto existente
app.put('/api/productos/:id', (req, res) => {
    const { id } = req.params;
    const { codigo, nombre, descripcion, precio_compra, precio_venta, stock_actual } = req.body;
    
    const sql = `UPDATE productos 
                SET codigo = ?, nombre = ?, descripcion = ?, precio_compra = ?, 
                    precio_venta = ?, stock_actual = ?, fecha_actualizacion = NOW() 
                WHERE id_producto = ?`;
    
    db.query(sql, [codigo, nombre, descripcion, precio_compra, precio_venta, stock_actual, id], (err, results) => {
        if (err) {
            console.error('Error al actualizar producto:', err);
            return res.status(500).json({ 
                success: false,
                error: 'Error al actualizar producto' 
            });
        }
        
        if (results.affectedRows === 0) {
            return res.status(404).json({ 
                success: false,
                error: 'Producto no encontrado' 
            });
        }
        
        res.json({
            success: true,
            message: 'Producto actualizado exitosamente',
            id_producto: parseInt(id)
        });
    });
});

// Eliminar un producto
app.delete('/api/productos/:id', (req, res) => {
    const { id } = req.params;
    
    // Primero verificar si el producto tiene movimientos
    const checkMovimientosSql = 'SELECT COUNT(*) as count FROM movimientos WHERE id_producto = ?';
    
    db.query(checkMovimientosSql, [id], (err, movimientosResults) => {
        if (err) {
            console.error('Error al verificar movimientos:', err);
            return res.status(500).json({ 
                success: false,
                error: 'Error al verificar movimientos del producto' 
            });
        }
        
        if (movimientosResults[0].count > 0) {
            return res.status(400).json({ 
                success: false,
                error: 'No se puede eliminar el producto porque tiene movimientos registrados'
            });
        }
        
        // Si no tiene movimientos, proceder con la eliminación
        const deleteSql = 'DELETE FROM productos WHERE id_producto = ?';
        
        db.query(deleteSql, [id], (err, results) => {
            if (err) {
                console.error('Error al eliminar producto:', err);
                return res.status(500).json({ 
                    success: false,
                    error: 'Error al eliminar producto' 
                });
            }
            
            if (results.affectedRows === 0) {
                return res.status(404).json({ 
                    success: false,
                    error: 'Producto no encontrado' 
                });
            }
            
            res.json({ 
                success: true,
                message: 'Producto eliminado exitosamente' 
            });
        });
    });
});

// Ruta de información general de la API
app.get('/', (req, res) => {
    res.json({
        message: 'API de Distribuidora Martín - Sistema de Inventarios',
        version: '2.0.0',
        endpoints: {
            productos: {
                'GET /api/productos': 'Obtener todos los productos',
                'GET /api/productos?search=term': 'Buscar productos',
                'GET /api/productos/buscar/:termino': 'Búsqueda específica',
                'GET /api/productos/validar-codigo/:codigo': 'Validar código único',
                'GET /api/productos/:id': 'Obtener producto por ID',
                'POST /api/productos/nuevo': 'Crear nuevo producto (con validaciones)',
                'PUT /api/productos/:id': 'Actualizar producto',
                'DELETE /api/productos/:id': 'Eliminar producto'
            },
            sistema: {
                'GET /api/test-db': 'Probar conexión a base de datos'
            }
        }
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📊 Sistema de Inventarios - Distribuidora Martín`);
    console.log(`🔗 Endpoints disponibles en: http://localhost:${PORT}/`);
});

// Exportar la conexión para usar en otros archivos si es necesario
module.exports = db;