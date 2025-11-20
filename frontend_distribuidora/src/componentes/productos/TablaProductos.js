import React, { useState, useEffect } from 'react';
import FormularioProducto from './FormularioProducto';
import './TablaProductos.css';

// Datos de ejemplo mejorados - MOVIDOS FUERA del componente
const productosEjemplo = [
  {
    id: 1,
    codigo: 'PROD-001',
    nombre: 'Laptop HP Pavilion',
    descripcion: 'Laptop 15.6 pulgadas, 8GB RAM, 256GB SSD, Intel Core i5',
    precioCompra: 12000,
    precioVenta: 15000,
    stock: 5,
    tieneMovimientos: true,
    categoria: 'Tecnología'
  },
  {
    id: 2,
    codigo: 'PROD-002',
    nombre: 'Mouse Inalámbrico Logitech',
    descripcion: 'Mouse óptico inalámbrico 2.4GHz, 3 botones, 1600 DPI',
    precioCompra: 150,
    precioVenta: 250,
    stock: 1,
    tieneMovimientos: false,
    categoria: 'Accesorios'
  }
];

const TablaProductos = () => {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [productosPorPagina] = useState(8);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);

  useEffect(() => {
    // Simular llamada a API
    setProductos(productosEjemplo);
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

  const manejarEliminar = (producto) => {
    if (producto.tieneMovimientos) {
      alert('❌ No se puede eliminar el producto porque tiene movimientos registrados');
      return;
    }
    
    if (window.confirm(`¿Estás seguro de eliminar el producto: ${producto.nombre}?`)) {
      const productosActualizados = productos.filter(p => p.id !== producto.id);
      setProductos(productosActualizados);
      alert('✅ Producto eliminado correctamente');
    }
  };

  const manejarNuevoProducto = () => {
    setProductoEditando(null);
    setMostrarFormulario(true);
  };

  const manejarGuardarProducto = (producto) => {
    if (productoEditando) {
      // Editar producto existente
      const productosActualizados = productos.map(p =>
        p.id === producto.id ? producto : p
      );
      setProductos(productosActualizados);
      alert('✅ Producto actualizado correctamente');
    } else {
      // Agregar nuevo producto
      const nuevoProducto = {
        ...producto,
        id: Date.now(),
        tieneMovimientos: false,
        categoria: 'General'
      };
      setProductos(prev => [nuevoProducto, ...prev]);
      alert('✅ Producto creado correctamente');
    }
    
    setMostrarFormulario(false);
    setProductoEditando(null);
  };

  const manejarCancelarFormulario = () => {
    setMostrarFormulario(false);
    setProductoEditando(null);
  };

  return (
    <div className="tabla-productos-container">
      {/* Mostrar formulario o tabla */}
      {mostrarFormulario ? (
        <FormularioProducto
          productoEditar={productoEditando}
          onGuardar={manejarGuardarProducto}
          onCancelar={manejarCancelarFormulario}
          productosExistentes={productos}
        />
      ) : (
        <>
          {/* Header con título */}
          <div className="productos-header">
            <div className="header-info">
              <h1>📦 Gestión de Productos</h1>
              <p>Administra el inventario completo de la distribuidora</p>
            </div>
            <div className="header-stats">
              <div className="stat-card">
                <span className="stat-number">{productos.length}</span>
                <span className="stat-label">Productos Totales</span>
              </div>
            </div>
          </div>

          {/* Barra de herramientas */}
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

          {/* Tabla de productos */}
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
                        className={`btn-eliminar ${producto.tieneMovimientos ? 'deshabilitado' : ''}`}
                        onClick={() => manejarEliminar(producto)}
                        disabled={producto.tieneMovimientos}
                        title={producto.tieneMovimientos ? 'No se puede eliminar - tiene movimientos' : 'Eliminar producto'}
                      >
                        🗑️ Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mensaje si no hay productos */}
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

          {/* Paginación */}
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