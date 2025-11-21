import React, { useState, useEffect } from 'react';
import FormularioProducto from './FormularioProducto';
import './TablaProductos.css';

const API_BASE_URL = 'http://localhost:5000/api';

const TablaProductos = () => {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [productosPorPagina] = useState(8);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Cargar productos desde el backend
  const cargarProductos = async () => {
    try {
      setCargando(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/productos`, {
        credentials: 'include' // 👈 ESTA LÍNEA ES CLAVE
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('No estás autenticado. Por favor inicia sesión nuevamente.');
        }
        throw new Error(`Error ${response.status}: No se pudo conectar al servidor`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        const productosConvertidos = data.data.map(producto => ({
          id: producto.id_producto,
          codigo: producto.codigo,
          nombre: producto.nombre,
          descripcion: producto.descripcion,
          precioCompra: parseFloat(producto.precio_compra),
          precioVenta: parseFloat(producto.precio_venta),
          stock: producto.stock_actual,
          tieneMovimientos: false,
          categoria: 'General'
        }));
        setProductos(productosConvertidos);
      } else {
        throw new Error(data.error || 'Error al cargar productos');
      }
    } catch (error) {
      console.error('Error cargando productos:', error);
      setError(error.message);
      setProductos([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  // Filtrar productos por búsqueda
  const productosFiltrados = productos.filter(producto =>
    producto.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
    producto.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Paginación
  const indiceUltimoProducto = paginaActual * productosPorPagina;
  const indicePrimerProducto = indiceUltimoProducto - productosPorPagina;
  const productosPagina = productosFiltrados.slice(indicePrimerProducto, indiceUltimoProducto);
  const totalPaginas = Math.ceil(productosFiltrados.length / productosPorPagina);

  const manejarBusqueda = (e) => {
    setBusqueda(e.target.value);
    setPaginaActual(1);
  };

  const manejarEditar = (producto) => {
    setProductoEditando(producto);
    setMostrarFormulario(true);
  };

  const manejarEliminar = async (producto) => {
    if (window.confirm(`¿Estás seguro de eliminar el producto: ${producto.nombre}?`)) {
      try {
        const response = await fetch(`${API_BASE_URL}/productos/${producto.id}`, {
          method: 'DELETE',
          credentials: 'include' // 👈 AGREGAR CREDENCIALES
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('No estás autenticado. Por favor inicia sesión nuevamente.');
          }
          throw new Error(`Error ${response.status}: No se pudo conectar al servidor`);
        }

        const data = await response.json();

        if (data.success) {
          const productosActualizados = productos.filter(p => p.id !== producto.id);
          setProductos(productosActualizados);
          alert('✅ Producto eliminado correctamente');
        } else {
          if (data.error && data.error.includes('movimientos')) {
            alert('❌ No se puede eliminar el producto porque tiene movimientos registrados');
          } else {
            throw new Error(data.error);
          }
        }
      } catch (err) {
        console.error('Error eliminando producto:', err);
        alert(`❌ Error al eliminar producto: ${err.message}`);
      }
    }
  };

  const manejarNuevoProducto = () => {
    setProductoEditando(null);
    setMostrarFormulario(true);
  };

  const manejarGuardarProducto = async (productoData) => {
    try {
      // Preparar datos para el backend (convertir formato)
      const datosBackend = {
        codigo: productoData.codigo,
        nombre: productoData.nombre,
        descripcion: productoData.descripcion,
        precio_compra: productoData.precioCompra,
        precio_venta: productoData.precioVenta,
        stock_actual: productoData.stock || 1
      };

      let response;
      let url;

      if (productoEditando) {
        // Editar producto existente
        url = `${API_BASE_URL}/productos/${productoEditando.id}`;
        response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // 👈 AGREGAR CREDENCIALES
          body: JSON.stringify(datosBackend)
        });
      } else {
        // Crear nuevo producto
        url = `${API_BASE_URL}/productos/nuevo`;
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // 👈 AGREGAR CREDENCIALES
          body: JSON.stringify(datosBackend)
        });
      }

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('No estás autenticado. Por favor inicia sesión nuevamente.');
        }
        throw new Error(`Error ${response.status}: No se pudo conectar al servidor`);
      }

      const data = await response.json();

      if (data.success) {
        // Recargar productos desde el backend
        await cargarProductos();
        alert('✅ Producto guardado correctamente');
        setMostrarFormulario(false);
        setProductoEditando(null);
      } else {
        const mensajeError = data.detalles ? data.detalles.join(', ') : data.error;
        alert(`❌ Error: ${mensajeError}`);
      }
    } catch (err) {
      console.error('Error guardando producto:', err);
      alert(`❌ Error al guardar producto: ${err.message}`);
    }
  };

  const manejarCancelarFormulario = () => {
    setMostrarFormulario(false);
    setProductoEditando(null);
  };

  if (cargando) {
    return (
      <div className="tabla-productos-container">
        <div className="productos-header">
          <div className="header-info">
            <h1> Gestión de Productos</h1>
            <p>Administra el inventario completo de la distribuidora</p>
          </div>
        </div>
        <div className="sin-productos">
          <div className="sin-productos-icon">⏳</div>
          <h3>Cargando productos...</h3>
          <p>Conectando con el servidor</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tabla-productos-container">
        <div className="productos-header">
          <div className="header-info">
            <h1> Gestión de Productos</h1>
            <p>Administra el inventario completo de la distribuidora</p>
          </div>
        </div>
        <div className="sin-productos">
          <div className="sin-productos-icon">❌</div>
          <h3>Error de conexión</h3>
          <p>{error}</p>
          <p>Asegúrate de que el servidor backend esté ejecutándose en http://localhost:5000</p>
          <button className="btn-nuevo-producto" onClick={cargarProductos}>
            🔄 Reintentar
          </button>
          <button 
            className="btn-nuevo-producto" 
            onClick={() => window.location.href = '/login'}
            style={{ marginLeft: '1rem', backgroundColor: '#dc2626' }}
          >
            🔐 Ir al Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tabla-productos-container">
      {mostrarFormulario ? (
        <FormularioProducto
          productoEditar={productoEditando}
          onGuardar={manejarGuardarProducto}
          onCancelar={manejarCancelarFormulario}
          productosExistentes={productos}
        />
      ) : (
        <>
          <div className="productos-header">
            <div className="header-info">
              <h1> Gestión de Productos</h1>
              <p>Administra el inventario completo de la distribuidora</p>
            </div>
            <div className="header-stats">
              <div className="stat-card">
                <span className="stat-number">{productos.length}</span>
                <span className="stat-label">Productos Totales</span>
              </div>
            </div>
          </div>

          <div className="herramientas-productos">
            <div className="busqueda-container">
              <div className="busqueda-wrapper">
                <span className="busqueda-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Buscar productos por código o nombre..."
                  value={busqueda}
                  onChange={manejarBusqueda}
                  className="busqueda-input"
                />
              </div>
              <span className="resultados-busqueda">
                {productosFiltrados.length} productos encontrados
              </span>
            </div>
            <button 
              className="btn-nuevo-producto"
              onClick={manejarNuevoProducto}
            >
              <span className="btn-icon">+</span>
              Nuevo Producto
            </button>
          </div>

          <div className="tabla-container">
            <table className="tabla-productos">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre del Producto</th>
                  <th>Descripción</th>
                  <th>Precio Compra</th>
                  <th>Precio Venta</th>
                  <th>Stock</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productosPagina.map(producto => (
                  <tr key={producto.id} className="fila-producto">
                    <td className="codigo">
                      <span className="codigo-badge">{producto.codigo}</span>
                    </td>
                    <td className="nombre">
                      <strong>{producto.nombre}</strong>
                      <span className="categoria">{producto.categoria}</span>
                    </td>
                    <td className="descripcion">
                      {producto.descripcion}
                    </td>
                    <td className="precio compra">
                      <span className="precio-label">Compra</span>
                      <strong>${producto.precioCompra.toLocaleString()}</strong>
                    </td>
                    <td className="precio venta">
                      <span className="precio-label">Venta</span>
                      <strong>${producto.precioVenta.toLocaleString()}</strong>
                    </td>
                    <td className="stock">
                      <span className={`stock-badge ${producto.stock === 1 ? 'stock-minimo' : producto.stock > 5 ? 'stock-alto' : 'stock-normal'}`}>
                        {producto.stock} unidad{producto.stock !== 1 ? 'es' : ''}
                      </span>
                    </td>
                    <td className="acciones">
                      <button 
                        className="btn-editar"
                        onClick={() => manejarEditar(producto)}
                        title="Editar producto"
                      >
                        ✏️ Editar
                      </button>
                      <button 
                        className="btn-eliminar"
                        onClick={() => manejarEliminar(producto)}
                        title="Eliminar producto"
                      >
                        🗑️ Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {productosPagina.length === 0 && (
              <div className="sin-productos">
                <div className="sin-productos-icon">📦</div>
                <h3>No se encontraron productos</h3>
                <p>{busqueda ? 'Prueba con otros términos de búsqueda' : 'No hay productos registrados en el sistema'}</p>
                {!busqueda && (
                  <button className="btn-nuevo-producto" onClick={manejarNuevoProducto}>
                    + Agregar Primer Producto
                  </button>
                )}
              </div>
            )}
          </div>

          {totalPaginas > 1 && (
            <div className="paginacion">
              <button 
                disabled={paginaActual === 1}
                onClick={() => setPaginaActual(paginaActual - 1)}
                className="btn-paginacion anterior"
              >
                ← Anterior
              </button>
              
              <div className="paginacion-info">
                <span>Página </span>
                <strong>{paginaActual}</strong>
                <span> de </span>
                <strong>{totalPaginas}</strong>
              </div>
              
              <button 
                disabled={paginaActual === totalPaginas}
                onClick={() => setPaginaActual(paginaActual + 1)}
                className="btn-paginacion siguiente"
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TablaProductos;