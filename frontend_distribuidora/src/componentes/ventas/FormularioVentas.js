import React, { useState, useEffect } from 'react';
import './FormularioVentas.css';

const FormularioVentas = ({ 
  productos, 
  onGuardarVenta, 
  onCancelar,
  usuarioActual 
}) => {
  const [formData, setFormData] = useState({
    productoId: '',
    cantidad: '',
    fecha: new Date().toISOString().split('T')[0],
    motivo: ''
  });

  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [mostrarLista, setMostrarLista] = useState(false);

  // Filtrar productos basado en la búsqueda
  useEffect(() => {
    if (busquedaProducto.trim()) {
      const filtrados = productos.filter(producto =>
        producto.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()) ||
        producto.codigo.toLowerCase().includes(busquedaProducto.toLowerCase())
      );
      setProductosFiltrados(filtrados);
      setMostrarLista(true);
    } else {
      setProductosFiltrados([]);
      setMostrarLista(false);
    }
  }, [busquedaProducto, productos]);

  // Actualizar producto seleccionado
  useEffect(() => {
    if (formData.productoId) {
      const producto = productos.find(p => p.id === formData.productoId);
      setProductoSeleccionado(producto);
    } else {
      setProductoSeleccionado(null);
    }
  }, [formData.productoId, productos]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpiar error del campo cuando el usuario escribe
    if (errores[name]) {
      setErrores(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Validación en tiempo real para cantidad
    if (name === 'cantidad' && productoSeleccionado) {
      const cantidad = parseInt(value) || 0;
      if (cantidad > productoSeleccionado.stock) {
        setErrores(prev => ({
          ...prev,
          cantidad: `Stock insuficiente. Disponible: ${productoSeleccionado.stock}`
        }));
      }
    }
  };

  const seleccionarProducto = (producto) => {
    setFormData(prev => ({
      ...prev,
      productoId: producto.id
    }));
    setBusquedaProducto(`${producto.codigo} - ${producto.nombre}`);
    setMostrarLista(false);
    setProductoSeleccionado(producto);

    // Limpiar error de producto
    if (errores.productoId) {
      setErrores(prev => ({
        ...prev,
        productoId: ''
      }));
    }
  };

  const validarFormulario = () => {
    const nuevosErrores = {};

    // Validar producto seleccionado
    if (!formData.productoId) {
      nuevosErrores.productoId = 'Debe seleccionar un producto';
    }

    // Validar cantidad
    if (!formData.cantidad || parseInt(formData.cantidad) <= 0) {
      nuevosErrores.cantidad = 'La cantidad debe ser mayor a 0';
    } else if (productoSeleccionado && parseInt(formData.cantidad) > productoSeleccionado.stock) {
      nuevosErrores.cantidad = `Stock insuficiente. Disponible: ${productoSeleccionado.stock}`;
    }

    // Validar fecha
    if (!formData.fecha) {
      nuevosErrores.fecha = 'La fecha es obligatoria';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    setEnviando(true);

    try {
      // Simular llamada a API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const venta = {
        id: Date.now(),
        productoId: formData.productoId,
        producto: productoSeleccionado,
        cantidad: parseInt(formData.cantidad),
        fecha: formData.fecha,
        motivo: formData.motivo.trim(),
        usuario: usuarioActual,
        tipo: 'venta',
        fechaRegistro: new Date().toISOString(),
        stockAnterior: productoSeleccionado.stock,
        stockNuevo: productoSeleccionado.stock - parseInt(formData.cantidad),
        total: productoSeleccionado.precioVenta * parseInt(formData.cantidad)
      };

      onGuardarVenta(venta);
      
      // Mostrar mensaje de confirmación
      alert(`✅ Venta registrada exitosamente\nProducto: ${productoSeleccionado.nombre}\nCantidad: ${formData.cantidad}\nTotal: $${venta.total}`);
      
      // Limpiar formulario
      setFormData({
        productoId: '',
        cantidad: '',
        fecha: new Date().toISOString().split('T')[0],
        motivo: ''
      });
      setBusquedaProducto('');
      setProductoSeleccionado(null);
      
    } catch (error) {
      console.error('Error al registrar venta:', error);
      alert('❌ Error al registrar la venta. Por favor, intente nuevamente.');
    } finally {
      setEnviando(false);
    }
  };

  const calcularTotal = () => {
    if (productoSeleccionado && formData.cantidad) {
      return (productoSeleccionado.precioVenta * parseInt(formData.cantidad)).toFixed(2);
    }
    return '0.00';
  };

  return (
    <div className="pagina-venta">
      <div className="formulario-venta">
        <div className="formulario-header">
          <h2>💰 Registrar Venta</h2>
          <p>Completa los campos para registrar una nueva venta</p>
        </div>

        <form onSubmit={handleSubmit} className="formulario-body">
          {/* Selector de Producto con Búsqueda */}
          <div className="form-grupo">
            <label htmlFor="busquedaProducto" className="form-label">
              Producto *
            </label>
            <div className="selector-producto">
              <input
                type="text"
                id="busquedaProducto"
                value={busquedaProducto}
                onChange={(e) => setBusquedaProducto(e.target.value)}
                onFocus={() => setMostrarLista(true)}
                className={`form-input ${errores.productoId ? 'error' : ''}`}
                placeholder="Buscar producto por nombre o código..."
                disabled={enviando}
              />
              
              {mostrarLista && productosFiltrados.length > 0 && (
                <div className="lista-productos">
                  {productosFiltrados.map(producto => (
                    <div
                      key={producto.id}
                      className="opcion-producto"
                      onClick={() => seleccionarProducto(producto)}
                    >
                      <div className="producto-info">
                        <span className="producto-codigo">{producto.codigo}</span>
                        <span className="producto-nombre">{producto.nombre}</span>
                      </div>
                      <div className="producto-detalles">
                        <span className="producto-stock">Stock: {producto.stock}</span>
                        <span className="producto-precio">${producto.precioVenta}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {errores.productoId && <span className="mensaje-error">{errores.productoId}</span>}
          </div>

          {productoSeleccionado && (
            <div className="info-producto-seleccionado">
              <div className="info-fila">
                <span className="info-label">Producto seleccionado:</span>
                <span className="info-valor">
                  {productoSeleccionado.codigo} - {productoSeleccionado.nombre}
                </span>
              </div>
              <div className="info-fila">
                <span className="info-label">Stock disponible:</span>
                <span className="info-valor">{productoSeleccionado.stock}</span>
              </div>
              <div className="info-fila">
                <span className="info-label">Precio de venta:</span>
                <span className="info-valor precio">${productoSeleccionado.precioVenta}</span>
              </div>
            </div>
          )}

          <div className="form-fila">
            {/* Campo Cantidad */}
            <div className="form-grupo">
              <label htmlFor="cantidad" className="form-label">
                Cantidad *
              </label>
              <input
                type="number"
                id="cantidad"
                name="cantidad"
                value={formData.cantidad}
                onChange={handleChange}
                className={`form-input ${errores.cantidad ? 'error' : ''}`}
                placeholder="0"
                min="1"
                max={productoSeleccionado ? productoSeleccionado.stock : undefined}
                disabled={enviando || !productoSeleccionado}
              />
              {errores.cantidad && <span className="mensaje-error">{errores.cantidad}</span>}
            </div>

            {/* Campo Fecha */}
            <div className="form-grupo">
              <label htmlFor="fecha" className="form-label">
                Fecha de Venta *
              </label>
              <input
                type="date"
                id="fecha"
                name="fecha"
                value={formData.fecha}
                onChange={handleChange}
                className={`form-input ${errores.fecha ? 'error' : ''}`}
                disabled={enviando}
              />
              {errores.fecha && <span className="mensaje-error">{errores.fecha}</span>}
            </div>
          </div>

          {/* Campo Motivo */}
          <div className="form-grupo">
            <label htmlFor="motivo" className="form-label">
              Motivo (Opcional)
            </label>
            <textarea
              id="motivo"
              name="motivo"
              value={formData.motivo}
              onChange={handleChange}
              className="form-textarea"
              placeholder="Descripción del motivo de la venta..."
              rows="2"
              disabled={enviando}
            />
          </div>

          {/* Resumen de Venta */}
          {productoSeleccionado && formData.cantidad && (
            <div className="resumen-venta">
              <h3>📋 Resumen de Venta</h3>
              <div className="resumen-fila">
                <span>Producto:</span>
                <span>{productoSeleccionado.nombre}</span>
              </div>
              <div className="resumen-fila">
                <span>Cantidad:</span>
                <span>{formData.cantidad}</span>
              </div>
              <div className="resumen-fila">
                <span>Precio unitario:</span>
                <span>${productoSeleccionado.precioVenta}</span>
              </div>
              <div className="resumen-fila total">
                <span>Total:</span>
                <span>${calcularTotal()}</span>
              </div>
              <div className="resumen-fila stock">
                <span>Stock después de la venta:</span>
                <span>{productoSeleccionado.stock - parseInt(formData.cantidad)}</span>
              </div>
            </div>
          )}

          <div className="formulario-acciones">
            <button
              type="button"
              className="btn-cancelar"
              onClick={onCancelar}
              disabled={enviando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-guardar"
              disabled={enviando || !productoSeleccionado}
            >
              {enviando ? (
                <>
                  <span className="loading-spinner"></span>
                  Registrando...
                </>
              ) : (
                'Registrar Venta'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormularioVentas;