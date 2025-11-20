import React, { useState, useEffect } from 'react';
import './FormularioProducto.css';

const FormularioProducto = ({ productoEditar, onGuardar, onCancelar, productosExistentes }) => {
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    precioCompra: '',
    precioVenta: '',
    stock: '1'
  });
  
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);

  // Si estamos editando, cargar los datos del producto
  useEffect(() => {
    if (productoEditar) {
      setFormData({
        codigo: productoEditar.codigo,
        nombre: productoEditar.nombre,
        descripcion: productoEditar.descripcion,
        precioCompra: productoEditar.precioCompra.toString(),
        precioVenta: productoEditar.precioVenta.toString(),
        stock: productoEditar.stock.toString()
      });
    }
  }, [productoEditar]);

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
  };

  const validarFormulario = () => {
    const nuevosErrores = {};

    // Validar campos obligatorios
    if (!formData.codigo.trim()) {
      nuevosErrores.codigo = 'El código es obligatorio';
    } else if (productosExistentes.some(p => 
      p.codigo === formData.codigo && 
      (!productoEditar || p.id !== productoEditar.id)
    )) {
      nuevosErrores.codigo = 'Este código ya está en uso';
    }

    if (!formData.nombre.trim()) {
      nuevosErrores.nombre = 'El nombre es obligatorio';
    }

    if (!formData.descripcion.trim()) {
      nuevosErrores.descripcion = 'La descripción es obligatoria';
    }

    if (!formData.precioCompra || parseFloat(formData.precioCompra) <= 0) {
      nuevosErrores.precioCompra = 'El precio de compra debe ser mayor a 0';
    }

    if (!formData.precioVenta || parseFloat(formData.precioVenta) <= 0) {
      nuevosErrores.precioVenta = 'El precio de venta debe ser mayor a 0';
    }

    if (!formData.stock || parseInt(formData.stock) < 0) {
      nuevosErrores.stock = 'El stock no puede ser negativo';
    }

    // Validar que precio de venta sea mayor al de compra
    if (formData.precioCompra && formData.precioVenta) {
      const precioCompra = parseFloat(formData.precioCompra);
      const precioVenta = parseFloat(formData.precioVenta);
      
      if (precioVenta <= precioCompra) {
        nuevosErrores.precioVenta = 'El precio de venta debe ser mayor al de compra';
      }
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
      
      const producto = {
        id: productoEditar ? productoEditar.id : Date.now(),
        codigo: formData.codigo.trim(),
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
        precioCompra: parseFloat(formData.precioCompra),
        precioVenta: parseFloat(formData.precioVenta),
        stock: parseInt(formData.stock),
        tieneMovimientos: productoEditar ? productoEditar.tieneMovimientos : false,
        categoria: 'General'
      };

      onGuardar(producto);
      
      // Limpiar formulario si es nuevo producto
      if (!productoEditar) {
        setFormData({
          codigo: '',
          nombre: '',
          descripcion: '',
          precioCompra: '',
          precioVenta: '',
          stock: '1'
        });
      }
      
    } catch (error) {
      console.error('Error al guardar producto:', error);
    } finally {
      setEnviando(false);
    }
  };

  const calcularMargen = () => {
    if (formData.precioCompra && formData.precioVenta) {
      const compra = parseFloat(formData.precioCompra);
      const venta = parseFloat(formData.precioVenta);
      const margen = ((venta - compra) / compra) * 100;
      return isNaN(margen) ? 0 : margen.toFixed(1);
    }
    return 0;
  };

  return (
    <div className="pagina-producto">
      <div className="formulario-producto">
        <div className="formulario-header">
          <h2>{productoEditar ? '✏️ Editar Producto' : '📦 Nuevo Producto'}</h2>
          <p>Completa todos los campos para {productoEditar ? 'actualizar' : 'registrar'} el producto</p>
        </div>

        <form onSubmit={handleSubmit} className="formulario-body">
          <div className="form-fila">
            <div className="form-grupo">
              <label htmlFor="codigo" className="form-label">
                Código del Producto *
              </label>
              <input
                type="text"
                id="codigo"
                name="codigo"
                value={formData.codigo}
                onChange={handleChange}
                className={`form-input ${errores.codigo ? 'error' : ''}`}
                placeholder="Ej: PROD-001"
                disabled={enviando}
              />
              {errores.codigo && <span className="mensaje-error">{errores.codigo}</span>}
            </div>

            <div className="form-grupo">
              <label htmlFor="nombre" className="form-label">
                Nombre del Producto *
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className={`form-input ${errores.nombre ? 'error' : ''}`}
                placeholder="Ej: Laptop HP Pavilion"
                disabled={enviando}
              />
              {errores.nombre && <span className="mensaje-error">{errores.nombre}</span>}
            </div>
          </div>

          <div className="form-grupo">
            <label htmlFor="descripcion" className="form-label">
              Descripción *
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              className={`form-textarea ${errores.descripcion ? 'error' : ''}`}
              placeholder="Describe las características del producto..."
              rows="3"
              disabled={enviando}
            />
            {errores.descripcion && <span className="mensaje-error">{errores.descripcion}</span>}
          </div>

          <div className="form-fila precios">
            <div className="form-grupo">
              <label htmlFor="precioCompra" className="form-label">
                Precio de Compra *
              </label>
              <div className="input-precio">
                <span className="precio-simbolo">$</span>
                <input
                  type="number"
                  id="precioCompra"
                  name="precioCompra"
                  value={formData.precioCompra}
                  onChange={handleChange}
                  className={`form-input ${errores.precioCompra ? 'error' : ''}`}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  disabled={enviando}
                />
              </div>
              {errores.precioCompra && <span className="mensaje-error">{errores.precioCompra}</span>}
            </div>

            <div className="form-grupo">
              <label htmlFor="precioVenta" className="form-label">
                Precio de Venta *
              </label>
              <div className="input-precio">
                <span className="precio-simbolo">$</span>
                <input
                  type="number"
                  id="precioVenta"
                  name="precioVenta"
                  value={formData.precioVenta}
                  onChange={handleChange}
                  className={`form-input ${errores.precioVenta ? 'error' : ''}`}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  disabled={enviando}
                />
              </div>
              {errores.precioVenta && <span className="mensaje-error">{errores.precioVenta}</span>}
              {formData.precioCompra && formData.precioVenta && !errores.precioVenta && (
                <span className="margen-ganancia">
                  Margen: {calcularMargen()}%
                </span>
              )}
            </div>

            <div className="form-grupo">
              <label htmlFor="stock" className="form-label">
                Stock Inicial *
              </label>
              <input
                type="number"
                id="stock"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                className={`form-input ${errores.stock ? 'error' : ''}`}
                placeholder="1"
                min="0"
                disabled={enviando}
              />
              {errores.stock && <span className="mensaje-error">{errores.stock}</span>}
            </div>
          </div>

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
              disabled={enviando}
            >
              {enviando ? (
                <>
                  <span className="loading-spinner"></span>
                  {productoEditar ? 'Actualizando...' : 'Guardando...'}
                </>
              ) : (
                productoEditar ? 'Actualizar Producto' : 'Guardar Producto'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormularioProducto;
