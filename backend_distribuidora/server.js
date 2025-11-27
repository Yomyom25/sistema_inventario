const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const session = require("express-session");

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

    if (!productoId || !cantidad || !fecha) {
        return res.status(400).json({
            success: false,
            error: "Faltan datos requeridos (producto, cantidad, fecha)",
        });
    }

    const cantidadVenta = parseInt(cantidad);
    if (isNaN(cantidadVenta) || cantidadVenta <= 0) {
        return res.status(400).json({
            success: false,
            error: "La cantidad debe ser un número mayor a 0",
        });
    }

    // Iniciar transacción (simulada con callbacks anidados por falta de promesas/async-await en mysql2 básico)
    // 1. Verificar stock y obtener datos del producto
    const checkStockSql = "SELECT * FROM productos WHERE id_producto = ?";
    db.query(checkStockSql, [productoId], (err, productResults) => {
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
                
                db.query(insertMovimientoSql, [productoId, userId, idTipoMovimiento, cantidadVenta, fecha, motivoFinal], (err, movResults) => {
                    if (err) {
                        console.error("Error al registrar movimiento:", err);
                        return res.status(500).json({ success: false, error: "Error al registrar la venta" });
                    }

                    // 4. Actualizar stock del producto
                    const updateStockSql = "UPDATE productos SET stock_actual = stock_actual - ? WHERE id_producto = ?";
                    db.query(updateStockSql, [cantidadVenta, productoId], (err, updateResults) => {
                        if (err) {
                            console.error("Error al actualizar stock:", err);
                            // Nota: En un sistema real, aquí deberíamos hacer rollback del movimiento
                            return res.status(500).json({ success: false, error: "Error al actualizar stock" });
                        }

                        // 5. Responder éxito
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

module.exports = db;
