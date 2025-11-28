const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const session = require("express-session");
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
    cors({
        origin: "http://localhost:3000",
        credentials: true,
    })
);
app.use(express.json());

// Configuración de sesiones
app.use(
    session({
        secret: "distribuidora_martin_secret_2025",
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: false,
            maxAge: 24 * 60 * 60 * 1000,
        },
    })
);

// Configuración de la base de datos
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "distribuidora_martin",
    port: 3306,
});

// Conectar a la base de datos
db.connect((err) => {
    if (err) {
        console.error("Error conectando a la base de datos:", err);
        return;
    }
    console.log("Conectado a la base de datos MySQL - Distribuidora Martin");
});

// =============================================
// MIDDLEWARE DE AUTENTICACIÓN
// =============================================

const requireAuth = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.status(401).json({
            success: false,
            error: "No autenticado",
        });
    }
};

// =============================================
// ENDPOINTS DE AUTENTICACIÓN
// =============================================

// Login de usuario
app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            error: "Usuario y contraseña son requeridos",
        });
    }

    const sql =
        'SELECT * FROM usuarios WHERE nombre_usuario = ? AND estado = "activo"';

    db.query(sql, [username], (err, results) => {
        if (err) {
            console.error("Error al buscar usuario:", err);
            return res.status(500).json({
                success: false,
                error: "Error del servidor",
            });
        }

        if (results.length === 0) {
            return res.status(401).json({
                success: false,
                error: "Usuario no encontrado o inactivo",
            });
        }

        const user = results[0];

        // COMPARACIÓN DIRECTA SIN HASH
        if (password !== user.contraseña) {
            return res.status(401).json({
                success: false,
                error: "Contraseña incorrecta",
            });
        }

        req.session.user = {
            id: user.id_usuario,
            username: user.nombre_usuario,
            role: user.rol,
            name: user.nombre_usuario,
        };

        res.json({
            success: true,
            message: "Login exitoso",
            user: req.session.user,
        });
    });
});

// Verificar sesión
app.get("/api/auth/verify", (req, res) => {
    if (req.session.user) {
        res.json({
            success: true,
            user: req.session.user,
        });
    } else {
        res.status(401).json({
            success: false,
            error: "No autenticado",
        });
    }
});

// Logout
app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({
                success: false,
                error: "Error al cerrar sesión",
            });
        }

        res.clearCookie("connect.sid");
        res.json({
            success: true,
            message: "Logout exitoso",
        });
    });
});

// Obtener datos del usuario actual
app.get("/api/auth/me", requireAuth, (req, res) => {
    res.json({
        success: true,
        user: req.session.user,
    });
});

// =============================================
// ENDPOINTS DE PRODUCTOS (PROTEGIDOS)
// =============================================

// Obtener todos los productos
app.get("/api/productos", requireAuth, (req, res) => {
    const { search } = req.query;
    let sql = "SELECT * FROM productos";
    let params = [];

    if (search) {
        sql += " WHERE codigo LIKE ? OR nombre LIKE ?";
        params.push(`%${search}%`, `%${search}%`);
    }

    sql += " ORDER BY fecha_creacion DESC";

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error("Error al obtener productos:", err);
            return res.status(500).json({
                success: false,
                error: "Error al obtener productos",
            });
        }
        res.json({
            success: true,
            data: results,
            total: results.length,
        });
    });
});

// Obtener un producto por ID
app.get("/api/productos/:id", requireAuth, (req, res) => {
    const { id } = req.params;
    const sql = "SELECT * FROM productos WHERE id_producto = ?";

    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error("Error al obtener producto:", err);
            return res.status(500).json({
                success: false,
                error: "Error al obtener producto",
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Producto no encontrado",
            });
        }

        res.json({
            success: true,
            data: results[0],
        });
    });
});

// Validar si un código ya existe
app.get("/api/productos/validar-codigo/:codigo", requireAuth, (req, res) => {
    const { codigo } = req.params;
    const sql = "SELECT COUNT(*) as count FROM productos WHERE codigo = ?";

    db.query(sql, [codigo], (err, results) => {
        if (err) {
            console.error("Error al validar código:", err);
            return res.status(500).json({
                success: false,
                error: "Error al validar código",
            });
        }

        const existe = results[0].count > 0;
        res.json({
            success: true,
            existe: existe,
            mensaje: existe ? "El código ya está en uso" : "Código disponible",
        });
    });
});

// Crear un nuevo producto
app.post("/api/productos/nuevo", requireAuth, (req, res) => {
    const {
        codigo,
        nombre,
        descripcion,
        precio_compra,
        precio_venta,
        stock_actual = 1,
    } = req.body;

    const errores = [];

    if (!codigo || codigo.trim() === "") {
        errores.push("El código del producto es obligatorio");
    }

    if (!nombre || nombre.trim() === "") {
        errores.push("El nombre del producto es obligatorio");
    }

    if (!descripcion || descripcion.trim() === "") {
        errores.push("La descripción del producto es obligatoria");
    }

    if (!precio_compra || precio_compra <= 0) {
        errores.push("El precio de compra debe ser mayor a 0");
    }

    if (!precio_venta || precio_venta <= 0) {
        errores.push("El precio de venta debe ser mayor a 0");
    }

    if (stock_actual === undefined || stock_actual < 0) {
        errores.push("El stock inicial debe ser al menos 0");
    }

    if (parseFloat(precio_venta) <= parseFloat(precio_compra)) {
        errores.push("El precio de venta debe ser mayor al precio de compra");
    }

    if (errores.length > 0) {
        return res.status(400).json({
            success: false,
            error: "Errores de validación",
            detalles: errores,
        });
    }

    const checkSql = "SELECT COUNT(*) as count FROM productos WHERE codigo = ?";

    db.query(checkSql, [codigo], (err, checkResults) => {
        if (err) {
            console.error("Error al verificar código:", err);
            return res.status(500).json({
                success: false,
                error: "Error al verificar código del producto",
            });
        }

        if (checkResults[0].count > 0) {
            return res.status(400).json({
                success: false,
                error: "El código del producto ya existe",
                detalles: ["Por favor, utiliza un código único para el producto"],
            });
        }

        const insertSql = `INSERT INTO productos 
            (codigo, nombre, descripcion, precio_compra, precio_venta, stock_actual, fecha_creacion) 
            VALUES (?, ?, ?, ?, ?, ?, NOW())`;

        db.query(
            insertSql,
            [codigo, nombre, descripcion, precio_compra, precio_venta, stock_actual],
            (err, results) => {
                if (err) {
                    console.error("Error al crear producto:", err);
                    return res.status(500).json({
                        success: false,
                        error: "Error al crear producto",
                    });
                }

                const selectSql = "SELECT * FROM productos WHERE id_producto = ?";
                db.query(selectSql, [results.insertId], (err, productResults) => {
                    if (err) {
                        console.error("Error al obtener producto creado:", err);
                        return res.status(201).json({
                            success: true,
                            message: "Producto creado exitosamente",
                            id_producto: results.insertId,
                        });
                    }

                    res.status(201).json({
                        success: true,
                        message: "Producto creado exitosamente",
                        data: productResults[0],
                        id_producto: results.insertId,
                    });
                });
            }
        );
    });
});

// Búsqueda de productos
app.get("/api/productos/buscar/:termino", requireAuth, (req, res) => {
    const { termino } = req.params;
    const sql =
        "SELECT * FROM productos WHERE codigo LIKE ? OR nombre LIKE ? OR descripcion LIKE ? ORDER BY nombre";
    const searchTerm = `%${termino}%`;

    db.query(sql, [searchTerm, searchTerm, searchTerm], (err, results) => {
        if (err) {
            console.error("Error en búsqueda:", err);
            return res.status(500).json({
                success: false,
                error: "Error en la búsqueda",
            });
        }

        res.json({
            success: true,
            data: results,
            total: results.length,
            termino: termino,
        });
    });
});

// Actualizar un producto
app.put("/api/productos/:id", requireAuth, (req, res) => {
    const { id } = req.params;
    const {
        codigo,
        nombre,
        descripcion,
        precio_compra,
        precio_venta,
        stock_actual,
    } = req.body;

    const sql = `UPDATE productos 
              SET codigo = ?, nombre = ?, descripcion = ?, precio_compra = ?, 
                  precio_venta = ?, stock_actual = ?, fecha_actualizacion = NOW() 
              WHERE id_producto = ?`;

    db.query(
        sql,
        [
            codigo,
            nombre,
            descripcion,
            precio_compra,
            precio_venta,
            stock_actual,
            id,
        ],
        (err, results) => {
            if (err) {
                console.error("Error al actualizar producto:", err);
                return res.status(500).json({
                    success: false,
                    error: "Error al actualizar producto",
                });
            }

            if (results.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Producto no encontrado",
                });
            }

            res.json({
                success: true,
                message: "Producto actualizado exitosamente",
                id_producto: parseInt(id),
            });
        }
    );
});

// Eliminar un producto
app.delete("/api/productos/:id", requireAuth, (req, res) => {
    const { id } = req.params;

    const checkMovimientosSql =
        "SELECT COUNT(*) as count FROM movimientos WHERE id_producto = ?";

    db.query(checkMovimientosSql, [id], (err, movimientosResults) => {
        if (err) {
            console.error("Error al verificar movimientos:", err);
            return res.status(500).json({
                success: false,
                error: "Error al verificar movimientos del producto",
            });
        }

        if (movimientosResults[0].count > 0) {
            return res.status(400).json({
                success: false,
                error:
                    "No se puede eliminar el producto porque tiene movimientos registrados",
            });
        }

        const deleteSql = "DELETE FROM productos WHERE id_producto = ?";

        db.query(deleteSql, [id], (err, results) => {
            if (err) {
                console.error("Error al eliminar producto:", err);
                return res.status(500).json({
                    success: false,
                    error: "Error al eliminar producto",
                });
            }

            if (results.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Producto no encontrado",
                });
            }

            res.json({
                success: true,
                message: "Producto eliminado exitosamente",
            });
        });
    });
});

// Ruta de prueba para verificar la conexión
app.get("/api/test-db", (req, res) => {
    db.query("SELECT 1 + 1 AS result", (err, results) => {
        if (err) {
            console.error("Error en consulta de prueba:", err);
            return res.status(500).json({ error: "Error en la base de datos" });
        }
        res.json({
            message: "Conexión exitosa a la BD",
            result: results[0].result,
        });
    });
});

// =============================================
// ENDPOINTS DE USUARIOS (PROTEGIDOS)
// =============================================

// Obtener todos los usuarios (solo administradores)
app.get("/api/usuarios", requireAuth, (req, res) => {
    if (req.session.user.role !== "Administrador") {
        return res.status(403).json({
            success: false,
            error: "No tienes permisos para acceder a esta función",
        });
    }

    const sql =
        "SELECT id_usuario, nombre_usuario, rol, estado, fecha_creacion FROM usuarios ORDER BY fecha_creacion DESC";

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error al obtener usuarios:", err);
            return res.status(500).json({
                success: false,
                error: "Error al obtener usuarios",
            });
        }

        res.json({
            success: true,
            data: results,
            total: results.length,
        });
    });
});

// Crear nuevo usuario (solo administradores)
app.post("/api/usuarios/nuevo", requireAuth, (req, res) => {
    if (req.session.user.role !== "Administrador") {
        return res.status(403).json({
            success: false,
            error: "No tienes permisos para crear usuarios",
        });
    }

    const {
        nombre_usuario,
        contraseña,
        rol = "Empleado",
        estado = "activo",
    } = req.body;

    // Validaciones
    if (!nombre_usuario || !contraseña) {
        return res.status(400).json({
            success: false,
            error: "Nombre de usuario y contraseña son obligatorios",
        });
    }

    if (contraseña.length < 6) {
        return res.status(400).json({
            success: false,
            error: "La contraseña debe tener al menos 6 caracteres",
        });
    }

    // Verificar si el usuario ya existe
    const checkSql =
        "SELECT COUNT(*) as count FROM usuarios WHERE nombre_usuario = ?";

    db.query(checkSql, [nombre_usuario], (err, checkResults) => {
        if (err) {
            console.error("Error al verificar usuario:", err);
            return res.status(500).json({
                success: false,
                error: "Error al verificar usuario",
            });
        }

        if (checkResults[0].count > 0) {
            return res.status(400).json({
                success: false,
                error: "El nombre de usuario ya existe",
            });
        }

        // Insertar nuevo usuario
        const insertSql = `INSERT INTO usuarios 
      (nombre_usuario, contraseña, rol, estado, fecha_creacion) 
      VALUES (?, ?, ?, ?, NOW())`;

        db.query(
            insertSql,
            [nombre_usuario, contraseña, rol, estado],
            (err, results) => {
                if (err) {
                    console.error("Error al crear usuario:", err);
                    return res.status(500).json({
                        success: false,
                        error: "Error al crear usuario",
                    });
                }

                res.status(201).json({
                    success: true,
                    message: "Usuario creado exitosamente",
                    id_usuario: results.insertId,
                });
            }
        );
    });
});

// Actualizar usuario (solo administradores)
app.put("/api/usuarios/:id", requireAuth, (req, res) => {
    if (req.session.user.role !== "Administrador") {
        return res.status(403).json({
            success: false,
            error: "No tienes permisos para editar usuarios",
        });
    }

    const { id } = req.params;
    const { nombre_usuario, contraseña, rol } = req.body;

    let sql = "UPDATE usuarios SET nombre_usuario = ?, rol = ?";
    let params = [nombre_usuario, rol];

    // Si se proporciona contraseña, actualizarla
    if (contraseña) {
        sql += ", contraseña = ?";
        params.push(contraseña);
    }

    sql += " WHERE id_usuario = ?";
    params.push(id);

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error("Error al actualizar usuario:", err);
            return res.status(500).json({
                success: false,
                error: "Error al actualizar usuario",
            });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: "Usuario no encontrado",
            });
        }

        res.json({
            success: true,
            message: "Usuario actualizado exitosamente",
        });
    });
});

// Cambiar estado de usuario (solo administradores)
app.put("/api/usuarios/:id/estado", requireAuth, (req, res) => {
    if (req.session.user.role !== "Administrador") {
        return res.status(403).json({
            success: false,
            error: "No tienes permisos para cambiar estados de usuarios",
        });
    }

    const { id } = req.params;
    const { estado } = req.body;

    const sql = "UPDATE usuarios SET estado = ? WHERE id_usuario = ?";

    db.query(sql, [estado, id], (err, results) => {
        if (err) {
            console.error("Error al cambiar estado:", err);
            return res.status(500).json({
                success: false,
                error: "Error al cambiar estado del usuario",
            });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: "Usuario no encontrado",
            });
        }

        res.json({
            success: true,
            message: `Usuario ${estado === "activo" ? "activado" : "desactivado"
                } exitosamente`,
        });
    });
});

// Ruta de información general de la API
app.get("/", (req, res) => {
    res.json({
        message: "API de Distribuidora Martín - Sistema de Inventarios",
        version: "2.0.0",
        endpoints: {
            auth: {
                "POST /api/auth/login": "Iniciar sesión",
                "POST /api/auth/logout": "Cerrar sesión",
                "GET /api/auth/verify": "Verificar sesión",
                "GET /api/auth/me": "Obtener datos del usuario",
            },
            productos: {
                "GET /api/productos": "Obtener todos los productos",
                "GET /api/productos?search=term": "Buscar productos",
                "GET /api/productos/buscar/:termino": "Búsqueda específica",
                "GET /api/productos/validar-codigo/:codigo": "Validar código único",
                "GET /api/productos/:id": "Obtener producto por ID",
                "POST /api/productos/nuevo": "Crear nuevo producto",
                "PUT /api/productos/:id": "Actualizar producto",
                "DELETE /api/productos/:id": "Eliminar producto",
            },
            sistema: {
                "GET /api/test-db": "Probar conexión a base de datos",
            },
        },
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📊 Sistema de Inventarios - Distribuidora Martín`);
    console.log(`🔗 Endpoints disponibles en: http://localhost:${PORT}/`);
    console.log(`🔐 Autenticación con contraseñas en texto plano`);
});

// =============================================
// ENDPOINTS DE VENTAS (PROTEGIDOS)
// =============================================

// Registrar una nueva venta
app.post("/api/ventas", requireAuth, (req, res) => {
    const { productoId, cantidad, fecha, motivo } = req.body;
    const userId = req.session.user.id;

    // Log para debugging
    console.log('📦 Datos recibidos para venta:', { productoId, cantidad, fecha, motivo, userId });

    // Validar que los campos requeridos existan
    if (!productoId || !cantidad || !fecha) {
        console.error('❌ Validación fallida - Datos faltantes:', { 
            productoId: !!productoId, 
            cantidad: !!cantidad, 
            fecha: !!fecha 
        });
        return res.status(400).json({
            success: false,
            error: "Faltan datos requeridos (producto, cantidad, fecha)",
        });
    }

    // Validar y parsear productoId
    const productoIdInt = parseInt(productoId);
    if (isNaN(productoIdInt) || productoIdInt <= 0) {
        console.error('❌ productoId inválido:', productoId);
        return res.status(400).json({
            success: false,
            error: "El ID del producto no es válido",
        });
    }

    // Validar y parsear cantidad
    const cantidadVenta = parseInt(cantidad);
    if (isNaN(cantidadVenta) || cantidadVenta <= 0) {
        console.error('❌ Cantidad inválida:', cantidad);
        return res.status(400).json({
            success: false,
            error: "La cantidad debe ser un número mayor a 0",
        });
    }

    // Iniciar transacción (simulada con callbacks anidados por falta de promesas/async-await en mysql2 básico)
    // 1. Verificar stock y obtener datos del producto
    const checkStockSql = "SELECT * FROM productos WHERE id_producto = ?";
    db.query(checkStockSql, [productoIdInt], (err, productResults) => {
        if (err) {
            console.error("Error al verificar stock:", err);
            return res.status(500).json({ success: false, error: "Error de servidor" });
        }

        if (productResults.length === 0) {
            return res.status(404).json({ success: false, error: "Producto no encontrado" });
        }

        const producto = productResults[0];
        if (producto.stock_actual < cantidadVenta) {
            return res.status(400).json({
                success: false,
                error: `Stock insuficiente. Disponible: ${producto.stock_actual}`,
            });
        }

        // 2. Obtener ID del tipo de movimiento 'Salida'
        const getTypeSql = "SELECT id_tipo_movimiento FROM tipos_movimiento WHERE nombre = 'Salida'";
        db.query(getTypeSql, (err, typeResults) => {
            if (err) {
                console.error("Error al obtener tipo de movimiento:", err);
                return res.status(500).json({ success: false, error: "Error de servidor" });
            }

            let tipoMovimientoId;
            if (typeResults.length > 0) {
                tipoMovimientoId = typeResults[0].id_tipo_movimiento;
                procesarVenta(tipoMovimientoId);
            } else {
                // Si no existe, crearlo (opcional, o devolver error)
                // Para este caso, asumiremos que existe o usaremos un ID por defecto si fallara, pero mejor crearlo.
                const createTypeSql = "INSERT INTO tipos_movimiento (nombre, descripcion) VALUES ('Salida', 'Salida de productos por venta u otros')";
                db.query(createTypeSql, (err, createResults) => {
                    if (err) {
                        console.error("Error al crear tipo de movimiento:", err);
                        return res.status(500).json({ success: false, error: "Error al configurar tipo de movimiento" });
                    }
                    tipoMovimientoId = createResults.insertId;
                    procesarVenta(tipoMovimientoId);
                });
            }

            function procesarVenta(idTipoMovimiento) {
                // 3. Registrar movimiento
                const insertMovimientoSql = `
                    INSERT INTO movimientos 
                    (id_producto, id_usuario, id_tipo_movimiento, cantidad, fecha_movimiento, motivo, created_at) 
                    VALUES (?, ?, ?, ?, ?, ?, NOW())
                `;
                const motivoFinal = motivo ? `Venta: ${motivo}` : "Venta directa";

                db.query(insertMovimientoSql, [productoIdInt, userId, idTipoMovimiento, cantidadVenta, fecha, motivoFinal], (err, movResults) => {
                    if (err) {
                        console.error("Error al registrar movimiento:", err);
                        return res.status(500).json({ success: false, error: "Error al registrar la venta" });
                    }

                    // 4. Actualizar stock del producto
                    const updateStockSql = "UPDATE productos SET stock_actual = stock_actual - ? WHERE id_producto = ?";
                    db.query(updateStockSql, [cantidadVenta, productoIdInt], (err, updateResults) => {
                        if (err) {
                            console.error("Error al actualizar stock:", err);
                            // Nota: En un sistema real, aquí deberíamos hacer rollback del movimiento
                            return res.status(500).json({ success: false, error: "Error al actualizar stock" });
                        }

                        // 5. Responder éxito
                        console.log('✅ Venta registrada exitosamente:', {
                            productoId: productoIdInt,
                            cantidad: cantidadVenta,
                            nuevoStock: producto.stock_actual - cantidadVenta
                        });
                        res.json({
                            success: true,
                            message: "Venta registrada exitosamente",
                            nuevoStock: producto.stock_actual - cantidadVenta,
                            venta: {
                                id: movResults.insertId,
                                producto: producto.nombre,
                                cantidad: cantidadVenta,
                                total: (producto.precio_venta * cantidadVenta).toFixed(2)
                            }
                        });
                    });
                });
            }
        });
    });
});

// Obtener historial de ventas con información del usuario
app.get("/api/ventas/historial", requireAuth, (req, res) => {
    const { fechaDesde, fechaHasta } = req.query;

    let sql = `
        SELECT 
            m.id_movimiento,
            m.cantidad,
            m.fecha_movimiento,
            m.motivo,
            p.id_producto,
            p.codigo,
            p.nombre as producto_nombre,
            p.precio_venta,
            u.id_usuario,
            u.nombre_usuario,
            u.rol
        FROM movimientos m
        INNER JOIN productos p ON m.id_producto = p.id_producto
        INNER JOIN usuarios u ON m.id_usuario = u.id_usuario
        INNER JOIN tipos_movimiento tm ON m.id_tipo_movimiento = tm.id_tipo_movimiento
        WHERE tm.nombre = 'Salida'
    `;

    const params = [];

    // Aplicar filtros de fecha si existen
    if (fechaDesde) {
        sql += " AND m.fecha_movimiento >= ?";
        params.push(fechaDesde);
    }

    if (fechaHasta) {
        sql += " AND m.fecha_movimiento <= ?";
        params.push(fechaHasta);
    }

    sql += " ORDER BY m.fecha_movimiento DESC, m.created_at DESC";

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error("Error al obtener historial de ventas:", err);
            return res.status(500).json({
                success: false,
                error: "Error al obtener historial de ventas",
            });
        }

        // Formatear los resultados
        const ventas = results.map(row => ({
            id: row.id_movimiento,
            producto: {
                codigo: row.codigo,
                nombre: row.producto_nombre,
                precioVenta: parseFloat(row.precio_venta)
            },
            cantidad: row.cantidad,
            motivo: row.motivo ? row.motivo.replace('Venta: ', '') : 'No especificado',
            fecha: row.fecha_movimiento,
            usuario: {
                nombre: row.nombre_usuario,
                email: `${row.nombre_usuario.toLowerCase().replace(' ', '')}@empresa.com`,
                rol: row.rol
            },
            total: (parseFloat(row.precio_venta) * row.cantidad).toFixed(2)
        }));

        res.json({
            success: true,
            data: ventas,
            total: ventas.length
        });
    });
});

// =============================================
// ENDPOINTS DE REPORTES (PROTEGIDOS) - MEJORADOS
// =============================================

// RF-006.1: Reporte de movimientos de inventario por rango de fechas
app.get("/api/reportes/movimientos/pdf", requireAuth, (req, res) => {
    const { fechaDesde, fechaHasta, tipoMovimiento } = req.query;

    let sql = `
        SELECT 
            m.id_movimiento,
            m.cantidad,
            m.fecha_movimiento,
            m.motivo,
            p.codigo,
            p.nombre as producto_nombre,
            p.precio_compra,
            p.precio_venta,
            u.nombre_usuario,
            tm.nombre as tipo_movimiento,
            CASE 
                WHEN tm.nombre = 'ENTRADA' THEN m.cantidad * p.precio_compra
                WHEN tm.nombre = 'SALIDA' THEN m.cantidad * p.precio_venta
            END as valor_movimiento
        FROM movimientos m
        INNER JOIN productos p ON m.id_producto = p.id_producto
        INNER JOIN usuarios u ON m.id_usuario = u.id_usuario
        INNER JOIN tipos_movimiento tm ON m.id_tipo_movimiento = tm.id_tipo_movimiento
        WHERE 1=1
    `;

    const params = [];

    if (fechaDesde) {
        sql += " AND DATE(m.fecha_movimiento) >= ?";
        params.push(fechaDesde);
    }

    if (fechaHasta) {
        sql += " AND DATE(m.fecha_movimiento) <= ?";
        params.push(fechaHasta);
    }

    if (tipoMovimiento && tipoMovimiento !== 'TODOS') {
        sql += " AND tm.nombre = ?";
        params.push(tipoMovimiento);
    }

    sql += " ORDER BY m.fecha_movimiento DESC";

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error("Error al obtener movimientos:", err);
            return res.status(500).json({
                success: false,
                error: "Error al generar reporte de movimientos",
            });
        }

        const doc = new PDFDocument();
        const filename = `reporte-movimientos-${new Date().toISOString().split('T')[0]}.pdf`;
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/pdf');

        doc.pipe(res);
        generarReporteMovimientos(doc, results, fechaDesde, fechaHasta, tipoMovimiento);
        doc.end();
    });
});

// RF-006.2: Reporte de productos más vendidos
app.get("/api/reportes/productos-mas-vendidos/pdf", requireAuth, (req, res) => {
    const { fechaDesde, fechaHasta, limite = 10 } = req.query;

    let sql = `
        SELECT 
            p.id_producto,
            p.codigo,
            p.nombre,
            p.descripcion,
            p.precio_compra,
            p.precio_venta,
            SUM(m.cantidad) as total_vendido,
            SUM(m.cantidad * p.precio_venta) as total_ingresos,
            COUNT(m.id_movimiento) as total_ventas
        FROM productos p
        INNER JOIN movimientos m ON p.id_producto = m.id_producto
        INNER JOIN tipos_movimiento tm ON m.id_tipo_movimiento = tm.id_tipo_movimiento
        WHERE tm.nombre = 'SALIDA'
    `;

    const params = [];

    if (fechaDesde) {
        sql += " AND DATE(m.fecha_movimiento) >= ?";
        params.push(fechaDesde);
    }

    if (fechaHasta) {
        sql += " AND DATE(m.fecha_movimiento) <= ?";
        params.push(fechaHasta);
    }

    sql += ` 
        GROUP BY p.id_producto, p.codigo, p.nombre, p.descripcion, p.precio_compra, p.precio_venta
        ORDER BY total_vendido DESC
        LIMIT ?
    `;

    params.push(parseInt(limite));

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error("Error al obtener productos más vendidos:", err);
            return res.status(500).json({
                success: false,
                error: "Error al generar reporte de productos más vendidos",
            });
        }

        const doc = new PDFDocument();
        const filename = `reporte-productos-mas-vendidos-${new Date().toISOString().split('T')[0]}.pdf`;
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/pdf');

        doc.pipe(res);
        generarReporteProductosMasVendidos(doc, results, fechaDesde, fechaHasta, limite);
        doc.end();
    });
});

// RF-006.3: Reporte de valorización de inventario - CORREGIDO
app.get("/api/reportes/valorizacion-inventario/pdf", requireAuth, (req, res) => {
    const sql = `
        SELECT 
            p.id_producto,
            p.codigo,
            p.nombre,
            p.descripcion,
            p.precio_compra,
            p.precio_venta,
            p.stock_actual,
            (p.stock_actual * p.precio_compra) as valor_compra,
            (p.stock_actual * p.precio_venta) as valor_venta,
            ((p.precio_venta - p.precio_compra) / p.precio_compra * 100) as margen_ganancia
        FROM productos p
        WHERE p.stock_actual > 0
        ORDER BY valor_venta DESC
    `;

    db.query(sql, [], (err, results) => {
        if (err) {
            console.error("Error al obtener valorización:", err);
            return res.status(500).json({
                success: false,
                error: "Error al generar reporte de valorización",
            });
        }

        const doc = new PDFDocument();
        const filename = `reporte-valorizacion-inventario-${new Date().toISOString().split('T')[0]}.pdf`;
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/pdf');

        doc.pipe(res);
        generarReporteValorizacion(doc, results);
        doc.end();
    });
});

// Reporte de ventas en PDF
app.get("/api/reportes/ventas/pdf", requireAuth, (req, res) => {
    const { fechaDesde, fechaHasta } = req.query;

    let sql = `
        SELECT 
            m.id_movimiento,
            m.cantidad,
            m.fecha_movimiento,
            m.motivo,
            p.codigo,
            p.nombre as producto_nombre,
            p.precio_venta,
            u.nombre_usuario,
            u.rol
        FROM movimientos m
        INNER JOIN productos p ON m.id_producto = p.id_producto
        INNER JOIN usuarios u ON m.id_usuario = u.id_usuario
        INNER JOIN tipos_movimiento tm ON m.id_tipo_movimiento = tm.id_tipo_movimiento
        WHERE tm.nombre = 'SALIDA'
    `;

    const params = [];

    if (fechaDesde) {
        sql += " AND DATE(m.fecha_movimiento) >= ?";
        params.push(fechaDesde);
    }

    if (fechaHasta) {
        sql += " AND DATE(m.fecha_movimiento) <= ?";
        params.push(fechaHasta);
    }

    sql += " ORDER BY m.fecha_movimiento DESC";

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error("Error al obtener datos para PDF:", err);
            return res.status(500).json({
                success: false,
                error: "Error al generar reporte PDF",
            });
        }

        const doc = new PDFDocument();
        const filename = `reporte-ventas-${new Date().toISOString().split('T')[0]}.pdf`;
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/pdf');

        doc.pipe(res);
        generarReporteVentasPDF(doc, results, fechaDesde, fechaHasta);
        doc.end();
    });
});

// Reporte de ventas en Excel
app.get("/api/reportes/ventas/excel", requireAuth, async (req, res) => {
    const { fechaDesde, fechaHasta } = req.query;

    let sql = `
        SELECT 
            m.id_movimiento,
            m.cantidad,
            m.fecha_movimiento,
            m.motivo,
            p.codigo,
            p.nombre as producto_nombre,
            p.precio_venta,
            u.nombre_usuario,
            u.rol
        FROM movimientos m
        INNER JOIN productos p ON m.id_producto = p.id_producto
        INNER JOIN usuarios u ON m.id_usuario = u.id_usuario
        INNER JOIN tipos_movimiento tm ON m.id_tipo_movimiento = tm.id_tipo_movimiento
        WHERE tm.nombre = 'SALIDA'
    `;

    const params = [];

    if (fechaDesde) {
        sql += " AND DATE(m.fecha_movimiento) >= ?";
        params.push(fechaDesde);
    }

    if (fechaHasta) {
        sql += " AND DATE(m.fecha_movimiento) <= ?";
        params.push(fechaHasta);
    }

    sql += " ORDER BY m.fecha_movimiento DESC";

    db.query(sql, params, async (err, results) => {
        if (err) {
            console.error("Error al obtener datos para Excel:", err);
            return res.status(500).json({
                success: false,
                error: "Error al generar reporte Excel",
            });
        }

        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Reporte de Ventas');

            // Agregar headers
            worksheet.columns = [
                { header: 'ID', key: 'id', width: 10 },
                { header: 'Fecha', key: 'fecha', width: 15 },
                { header: 'Código Producto', key: 'codigo', width: 15 },
                { header: 'Producto', key: 'producto', width: 30 },
                { header: 'Cantidad', key: 'cantidad', width: 12 },
                { header: 'Precio Venta', key: 'precio', width: 15 },
                { header: 'Total', key: 'total', width: 15 },
                { header: 'Vendedor', key: 'vendedor', width: 20 },
                { header: 'Rol', key: 'rol', width: 15 },
                { header: 'Motivo', key: 'motivo', width: 25 }
            ];

            // Estilo para el header
            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF1E40AF' }
            };
            worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

            // Agregar datos
            results.forEach(venta => {
                const total = (parseFloat(venta.precio_venta) * venta.cantidad).toFixed(2);
                const motivo = venta.motivo ? venta.motivo.replace('Venta: ', '') : 'No especificado';

                worksheet.addRow({
                    id: venta.id_movimiento,
                    fecha: new Date(venta.fecha_movimiento).toLocaleDateString(),
                    codigo: venta.codigo,
                    producto: venta.producto_nombre,
                    cantidad: venta.cantidad,
                    precio: `$${parseFloat(venta.precio_venta).toFixed(2)}`,
                    total: `$${total}`,
                    vendedor: venta.nombre_usuario,
                    rol: venta.rol,
                    motivo: motivo
                });
            });

            // Agregar fila de totales
            const totalVentas = results.reduce((sum, venta) =>
                sum + (parseFloat(venta.precio_venta) * venta.cantidad), 0);
            const totalUnidades = results.reduce((sum, venta) => sum + venta.cantidad, 0);

            worksheet.addRow({});
            worksheet.addRow({
                producto: 'TOTALES:',
                cantidad: totalUnidades,
                total: `$${totalVentas.toFixed(2)}`
            });

            // Configurar respuesta
            const filename = `reporte-ventas-${new Date().toISOString().split('T')[0]}.xlsx`;
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

            await workbook.xlsx.write(res);
            res.end();

        } catch (error) {
            console.error("Error al generar Excel:", error);
            res.status(500).json({
                success: false,
                error: "Error al generar reporte Excel",
            });
        }
    });
});

// =============================================
// FUNCIONES AUXILIARES PARA GENERAR PDFs - MEJORADAS
// =============================================

// Función auxiliar para texto multilínea
function drawMultilineText(doc, text, x, y, maxWidth, maxHeight, lineHeight = 9) {
    const words = text.split(' ');
    let line = '';
    let lines = [];
    let currentY = y;

    for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const testWidth = doc.widthOfString(testLine);
        
        if (testWidth > maxWidth && i > 0) {
            lines.push(line);
            line = words[i] + ' ';
        } else {
            line = testLine;
        }
    }
    lines.push(line);

    // Dibujar máximo 2 líneas
    const linesToDraw = lines.slice(0, 2);
    linesToDraw.forEach((lineText, idx) => {
        if (currentY + (idx * lineHeight) <= y + maxHeight - lineHeight) {
            doc.text(lineText.trim(), x, currentY + (idx * lineHeight), { width: maxWidth });
        }
    });

    return lines.length > 2 ? '...' : '';
}

function generarReporteMovimientos(doc, movimientos, fechaDesde, fechaHasta, tipoMovimiento) {
    // Header
    doc.fontSize(20)
        .font('Helvetica-Bold')
        .fillColor('#1E40AF')
        .text('REPORTE DE MOVIMIENTOS DE INVENTARIO', 50, 50, { align: 'center' });

    doc.fontSize(12)
        .font('Helvetica')
        .fillColor('#666666')
        .text('Distribuidora Martín - Sistema de Inventarios', 50, 80, { align: 'center' });

    // Información del reporte
    const fechaGeneracion = new Date().toLocaleDateString();
    let periodo = 'Todo el período';
    if (fechaDesde && fechaHasta) {
        periodo = `Del ${fechaDesde} al ${fechaHasta}`;
    }

    let tipoFiltro = 'Todos los tipos';
    if (tipoMovimiento && tipoMovimiento !== 'TODOS') {
        tipoFiltro = tipoMovimiento;
    }

    doc.fontSize(10)
        .fillColor('#333333')
        .text(`Fecha de generación: ${fechaGeneracion}`, 50, 110)
        .text(`Período: ${periodo}`, 50, 125)
        .text(`Tipo de movimiento: ${tipoFiltro}`, 50, 140)
        .text(`Total de movimientos: ${movimientos.length}`, 50, 155);

    // Resumen de movimientos
    const entradas = movimientos.filter(m => m.tipo_movimiento === 'ENTRADA');
    const salidas = movimientos.filter(m => m.tipo_movimiento === 'SALIDA');
    const totalEntradas = entradas.reduce((sum, m) => sum + m.cantidad, 0);
    const totalSalidas = salidas.reduce((sum, m) => sum + m.cantidad, 0);
    const valorEntradas = entradas.reduce((sum, m) => sum + parseFloat(m.valor_movimiento), 0);
    const valorSalidas = salidas.reduce((sum, m) => sum + parseFloat(m.valor_movimiento), 0);

    let y = 180;

    doc.fontSize(9)
        .font('Helvetica-Bold')
        .text('RESUMEN:', 50, y);

    y += 20;
    doc.font('Helvetica')
        .text(`Entradas: ${totalEntradas} unidades - $${valorEntradas.toFixed(2)}`, 60, y);
    y += 15;
    doc.text(`Salidas: ${totalSalidas} unidades - $${valorSalidas.toFixed(2)}`, 60, y);
    y += 15;
    doc.text(`Balance neto: ${totalEntradas - totalSalidas} unidades - $${(valorEntradas - valorSalidas).toFixed(2)}`, 60, y);

    // Tabla de movimientos
    y += 30;

    // Headers de la tabla - MEJORADO: Tipo movido más a la derecha
    doc.fontSize(8)
        .font('Helvetica-Bold')
        .fillColor('#FFFFFF')
        .rect(50, y, 500, 15)
        .fill('#1E40AF');

    doc.text('Fecha', 55, y + 5);
    doc.text('Tipo', 120, y + 5); // MOVIDO DE 90 A 120
    doc.text('Producto', 160, y + 5);
    doc.text('Cantidad', 300, y + 5);
    doc.text('Valor', 350, y + 5);
    doc.text('Usuario', 400, y + 5);
    doc.text('Motivo', 470, y + 5);

    y += 20;

    // Datos de la tabla - MEJORADO: Altura aumentada para multilínea
    doc.font('Helvetica')
        .fillColor('#333333');

    movimientos.forEach((mov, index) => {
        if (y > 700) {
            doc.addPage();
            y = 50;
        }

        // AUMENTAR ALTURA DE FILA PARA TEXTO MULTILÍNEA
        const rowHeight = 18; // Aumentado de 12 a 18 para permitir 2 líneas

        // Fondo alternado
        if (index % 2 === 0) {
            doc.fillColor('#F8FAFC')
                .rect(50, y, 500, rowHeight)
                .fill();
        }

        const fecha = new Date(mov.fecha_movimiento).toLocaleDateString();
        const esEntrada = mov.tipo_movimiento === 'ENTRADA';

        // TIPO DE MOVIMIENTO - MOVIDO MÁS A LA DERECHA
        doc.fillColor(esEntrada ? '#059669' : '#DC2626')
            .text(esEntrada ? 'ENTRADA' : 'SALIDA', 120, y + 5); // MOVIDO DE 90 A 120

        doc.fillColor('#333333')
            .text(fecha, 55, y + 5)
            .text(mov.producto_nombre, 160, y + 5, { width: 130, ellipsis: true }) // Ajustado ancho
            .text(mov.cantidad.toString(), 300, y + 5)
            .text(`$${parseFloat(mov.valor_movimiento).toFixed(2)}`, 350, y + 5)
            .text(mov.nombre_usuario, 400, y + 5, { width: 60, ellipsis: true });

        // MOTIVO CON SOPORTE MULTILÍNEA
        const motivoTexto = mov.motivo || 'Sin motivo';
        drawMultilineText(doc, motivoTexto, 470, y + 5, 75, rowHeight);

        y += rowHeight;
    });

    // Pie de página
    doc.fontSize(8)
        .font('Helvetica')
        .fillColor('#666666')
        .text('Sistema de Inventarios - Distribuidora Martín', 50, 750, { align: 'center' });
}

function generarReporteProductosMasVendidos(doc, productos, fechaDesde, fechaHasta, limite) {
    // Header
    doc.fontSize(20)
        .font('Helvetica-Bold')
        .fillColor('#1E40AF')
        .text('PRODUCTOS MÁS VENDIDOS', 50, 50, { align: 'center' });

    doc.fontSize(12)
        .font('Helvetica')
        .fillColor('#666666')
        .text('Distribuidora Martín - Sistema de Inventarios', 50, 80, { align: 'center' });

    // Información del reporte
    const fechaGeneracion = new Date().toLocaleDateString();
    let periodo = 'Todo el período';
    if (fechaDesde && fechaHasta) {
        periodo = `Del ${fechaDesde} al ${fechaHasta}`;
    }

    doc.fontSize(10)
        .fillColor('#333333')
        .text(`Fecha de generación: ${fechaGeneracion}`, 50, 110)
        .text(`Período: ${periodo}`, 50, 125)
        .text(`Límite: Top ${limite} productos`, 50, 140)
        .text(`Total de productos: ${productos.length}`, 50, 155);

    // Estadísticas generales - CONVERSIÓN SEGURA
    const totalUnidades = productos.reduce((sum, p) => sum + parseInt(p.total_vendido), 0);
    const totalIngresos = productos.reduce((sum, p) => sum + parseFloat(p.total_ingresos), 0);
    const promedioVenta = productos.length > 0 ? totalUnidades / productos.length : 0;

    let y = 180;

    doc.fontSize(9)
        .font('Helvetica-Bold')
        .text('ESTADÍSTICAS GENERALES:', 50, y);

    y += 20;
    doc.font('Helvetica')
        .text(`Total unidades vendidas: ${totalUnidades}`, 60, y);
    y += 15;
    doc.text(`Total ingresos: $${totalIngresos.toFixed(2)}`, 60, y);
    y += 15;
    doc.text(`Promedio de ventas por producto: ${promedioVenta.toFixed(1)} unidades`, 60, y);

    // Tabla de productos
    y += 30;

    // Headers de la tabla
    doc.fontSize(8)
        .font('Helvetica-Bold')
        .fillColor('#FFFFFF')
        .rect(50, y, 500, 15)
        .fill('#1E40AF');

    doc.text('#', 55, y + 5);
    doc.text('Producto', 70, y + 5);
    doc.text('Código', 200, y + 5);
    doc.text('Unidades', 250, y + 5);
    doc.text('Precio', 310, y + 5);
    doc.text('Total', 360, y + 5);
    doc.text('Ventas', 420, y + 5);
    doc.text('Margen', 470, y + 5);

    y += 20;

    // Datos de la tabla - CONVERSIÓN SEGURA
    doc.font('Helvetica')
        .fillColor('#333333');

    productos.forEach((producto, index) => {
        if (y > 700) {
            doc.addPage();
            y = 50;
        }

        // Fondo alternado
        if (index % 2 === 0) {
            doc.fillColor('#F8FAFC')
                .rect(50, y, 500, 18) // Aumentado para multilínea
                .fill();
        }

        // CONVERTIR A NÚMEROS DE FORMA SEGURA
        const precioCompra = parseFloat(producto.precio_compra);
        const precioVenta = parseFloat(producto.precio_venta);
        const totalIngresosProd = parseFloat(producto.total_ingresos);
        const margen = ((precioVenta - precioCompra) / precioCompra) * 100;
        const posicion = index + 1;

        // Número de posición
        doc.fontSize(9)
            .font('Helvetica-Bold')
            .fillColor('#1E40AF')
            .text(posicion.toString(), 55, y + 5);

        // Datos del producto
        doc.fontSize(8)
            .font('Helvetica')
            .fillColor('#333333')
            .text(producto.nombre, 70, y + 5, { width: 120, ellipsis: true })
            .text(producto.codigo, 200, y + 5)
            .text(producto.total_vendido.toString(), 250, y + 5)
            .text(`$${precioVenta.toFixed(2)}`, 310, y + 5)
            .text(`$${totalIngresosProd.toFixed(2)}`, 360, y + 5)
            .text(producto.total_ventas.toString(), 420, y + 5)
            .text(`${margen.toFixed(1)}%`, 470, y + 5);

        y += 18;
    });

    // Pie de página
    doc.fontSize(8)
        .font('Helvetica')
        .fillColor('#666666')
        .text('Sistema de Inventarios - Distribuidora Martín', 50, 750, { align: 'center' });
}

function generarReporteValorizacion(doc, productos) {
    // Header
    doc.fontSize(20)
        .font('Helvetica-Bold')
        .fillColor('#1E40AF')
        .text('VALORIZACIÓN DE INVENTARIO', 50, 50, { align: 'center' });

    doc.fontSize(12)
        .font('Helvetica')
        .fillColor('#666666')
        .text('Distribuidora Martín - Sistema de Inventarios', 50, 80, { align: 'center' });

    // Información del reporte
    const fechaGeneracion = new Date().toLocaleDateString();

    doc.fontSize(10)
        .fillColor('#333333')
        .text(`Fecha de generación: ${fechaGeneracion}`, 50, 110)
        .text(`Fecha de corte: ${new Date().toLocaleDateString()}`, 50, 125);

    // Estadísticas generales - CONVERSIÓN SEGURA
    const totalProductos = productos.length;
    const totalStock = productos.reduce((sum, p) => sum + parseInt(p.stock_actual), 0);
    const totalValorCompra = productos.reduce((sum, p) => sum + parseFloat(p.valor_compra), 0);
    const totalValorVenta = productos.reduce((sum, p) => sum + parseFloat(p.valor_venta), 0);
    const gananciaPotencial = totalValorVenta - totalValorCompra;

    let y = 150;

    doc.fontSize(9)
        .font('Helvetica-Bold')
        .text('RESUMEN DEL INVENTARIO:', 50, y);

    y += 20;
    doc.font('Helvetica')
        .text(`Total de productos en stock: ${totalProductos}`, 60, y);
    y += 15;
    doc.text(`Total unidades en inventario: ${totalStock}`, 60, y);
    y += 15;
    doc.text(`Valor total al costo: $${totalValorCompra.toFixed(2)}`, 60, y);
    y += 15;
    doc.text(`Valor total al precio de venta: $${totalValorVenta.toFixed(2)}`, 60, y);
    y += 15;
    doc.fillColor('#059669')
        .text(`Ganancia potencial: $${gananciaPotencial.toFixed(2)}`, 60, y);

    doc.fillColor('#333333');

    // Tabla de productos
    y += 30;

    // Headers de la tabla
    doc.fontSize(8)
        .font('Helvetica-Bold')
        .fillColor('#FFFFFF')
        .rect(50, y, 500, 15)
        .fill('#1E40AF');

    doc.text('Producto', 55, y + 5);
    doc.text('Código', 150, y + 5);
    doc.text('Stock', 200, y + 5);
    doc.text('Costo U.', 240, y + 5);
    doc.text('Venta U.', 300, y + 5);
    doc.text('Valor Costo', 360, y + 5);
    doc.text('Valor Venta', 420, y + 5);
    doc.text('Margen %', 480, y + 5);

    y += 20;

    // Datos de la tabla - CONVERSIÓN SEGURA
    doc.font('Helvetica')
        .fillColor('#333333');

    productos.forEach((producto, index) => {
        if (y > 700) {
            doc.addPage();
            y = 50;
        }

        // Fondo alternado
        if (index % 2 === 0) {
            doc.fillColor('#F8FAFC')
                .rect(50, y, 500, 18) // Aumentado para multilínea
                .fill();
        }

        // CONVERTIR A NÚMEROS DE FORMA SEGURA
        const precioCompra = parseFloat(producto.precio_compra);
        const precioVenta = parseFloat(producto.precio_venta);
        const valorCompra = parseFloat(producto.valor_compra);
        const valorVenta = parseFloat(producto.valor_venta);
        const margen = ((precioVenta - precioCompra) / precioCompra) * 100;

        doc.fillColor('#333333')
            .text(producto.nombre, 55, y + 5, { width: 85, ellipsis: true })
            .text(producto.codigo, 150, y + 5)
            .text(producto.stock_actual.toString(), 200, y + 5)
            .text(`$${precioCompra.toFixed(2)}`, 240, y + 5)
            .text(`$${precioVenta.toFixed(2)}`, 300, y + 5)
            .text(`$${valorCompra.toFixed(2)}`, 360, y + 5)
            .text(`$${valorVenta.toFixed(2)}`, 420, y + 5);

        // Color del margen según el porcentaje
        if (margen > 50) {
            doc.fillColor('#059669');
        } else if (margen > 25) {
            doc.fillColor('#D97706');
        } else {
            doc.fillColor('#DC2626');
        }

        doc.text(`${margen.toFixed(1)}%`, 480, y + 5);

        y += 18;
    });

    // Análisis adicional - CONVERSIÓN SEGURA
    y += 20;
    doc.fillColor('#333333')
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('ANÁLISIS:', 50, y);

    y += 15;

    // VERIFICAR SI HAY PRODUCTOS
    if (productos.length > 0) {
        const productoMayorValor = productos[0];
        const productoMenorValor = productos[productos.length - 1];
        const valorVentaMayor = parseFloat(productoMayorValor.valor_venta);
        const valorVentaMenor = parseFloat(productoMenorValor.valor_venta);
        const margenPromedio = productos.reduce((sum, p) => {
            const precioCompra = parseFloat(p.precio_compra);
            const precioVenta = parseFloat(p.precio_venta);
            return sum + ((precioVenta - precioCompra) / precioCompra * 100);
        }, 0) / productos.length;

        doc.font('Helvetica')
            .text(`• Producto de mayor valor: ${productoMayorValor.nombre} - $${valorVentaMayor.toFixed(2)}`, 60, y);
        y += 12;
        doc.text(`• Producto de menor valor: ${productoMenorValor.nombre} - $${valorVentaMenor.toFixed(2)}`, 60, y);
        y += 12;
        doc.text(`• Margen promedio: ${margenPromedio.toFixed(1)}%`, 60, y);
    } else {
        doc.font('Helvetica')
            .text('• No hay productos en inventario para analizar', 60, y);
    }

    // Pie de página
    doc.fontSize(8)
        .font('Helvetica')
        .fillColor('#666666')
        .text('Sistema de Inventarios - Distribuidora Martín', 50, 750, { align: 'center' });
}

function generarReporteVentasPDF(doc, ventas, fechaDesde, fechaHasta) {
    // Header
    doc.fontSize(20)
        .font('Helvetica-Bold')
        .fillColor('#1E40AF')
        .text('REPORTE DE VENTAS', 50, 50, { align: 'center' });

    doc.fontSize(12)
        .font('Helvetica')
        .fillColor('#666666')
        .text('Distribuidora Martín - Sistema de Inventarios', 50, 80, { align: 'center' });

    // Información del reporte
    const fechaGeneracion = new Date().toLocaleDateString();
    let periodo = 'Todo el período';
    if (fechaDesde && fechaHasta) {
        periodo = `Del ${fechaDesde} al ${fechaHasta}`;
    }

    doc.fontSize(10)
        .fillColor('#333333')
        .text(`Fecha de generación: ${fechaGeneracion}`, 50, 110)
        .text(`Período: ${periodo}`, 50, 125)
        .text(`Total de ventas: ${ventas.length}`, 50, 140);

    // Estadísticas
    const totalUnidades = ventas.reduce((sum, v) => sum + v.cantidad, 0);
    const totalIngresos = ventas.reduce((sum, v) => sum + (parseFloat(v.precio_venta) * v.cantidad), 0);

    let y = 165;

    doc.fontSize(9)
        .font('Helvetica-Bold')
        .text('ESTADÍSTICAS:', 50, y);

    y += 20;
    doc.font('Helvetica')
        .text(`Total unidades vendidas: ${totalUnidades}`, 60, y);
    y += 15;
    doc.text(`Total ingresos: $${totalIngresos.toFixed(2)}`, 60, y);
    y += 15;
    doc.text(`Ticket promedio: $${ventas.length > 0 ? (totalIngresos / ventas.length).toFixed(2) : '0.00'}`, 60, y);

    // Tabla de ventas
    y += 30;

    // Headers de la tabla
    doc.fontSize(8)
        .font('Helvetica-Bold')
        .fillColor('#FFFFFF')
        .rect(50, y, 500, 15)
        .fill('#1E40AF');

    doc.text('Fecha', 55, y + 5);
    doc.text('Producto', 100, y + 5);
    doc.text('Cantidad', 250, y + 5);
    doc.text('Precio', 300, y + 5);
    doc.text('Total', 350, y + 5);
    doc.text('Vendedor', 420, y + 5);

    y += 20;

    // Datos de la tabla - MEJORADO: Altura aumentada para multilínea
    doc.font('Helvetica')
        .fillColor('#333333');

    ventas.forEach((venta, index) => {
        if (y > 700) {
            doc.addPage();
            y = 50;
        }

        // AUMENTAR ALTURA DE FILA
        const rowHeight = 18; // Aumentado de 12 a 18

        // Fondo alternado
        if (index % 2 === 0) {
            doc.fillColor('#F8FAFC')
                .rect(50, y, 500, rowHeight)
                .fill();
        }

        const fecha = new Date(venta.fecha_movimiento).toLocaleDateString();
        const total = (parseFloat(venta.precio_venta) * venta.cantidad).toFixed(2);

        doc.fillColor('#333333')
            .text(fecha, 55, y + 5)
            // PRODUCTO CON SOPORTE MULTILÍNEA
            .text(venta.producto_nombre, 100, y + 5, { width: 140, ellipsis: true })
            .text(venta.cantidad.toString(), 250, y + 5)
            .text(`$${parseFloat(venta.precio_venta).toFixed(2)}`, 300, y + 5)
            .text(`$${total}`, 350, y + 5)
            // VENDEDOR CON SOPORTE MULTILÍNEA
            .text(venta.nombre_usuario, 420, y + 5, { width: 75, ellipsis: true });

        y += rowHeight;
    });

    // Pie de página
    doc.fontSize(8)
        .font('Helvetica')
        .fillColor('#666666')
        .text('Sistema de Inventarios - Distribuidora Martín', 50, 750, { align: 'center' });
}

module.exports = db;
