import React, { useState, useEffect, useCallback } from 'react';
import './HistorialVentas.css';

const HistorialVentas = () => {
  const [ventasFiltradas, setVentasFiltradas] = useState([]);
  const [filtros, setFiltros] = useState({
    fechaDesde: '',
    fechaHasta: ''
  });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Cargar ventas desde la API
  const cargarVentas = useCallback(async () => {
    setCargando(true);
    setError(null);
    
    try {
      // Construir URL con parámetros de filtro
      let url = 'http://localhost:5000/api/ventas/historial';
      const params = new URLSearchParams();
      
      if (filtros.fechaDesde) {
        params.append('fechaDesde', filtros.fechaDesde);
      }
      
      if (filtros.fechaHasta) {
        params.append('fechaHasta', filtros.fechaHasta);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url, {
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Error al cargar el historial');
      }
      
      setVentasFiltradas(data.data);
    } catch (error) {
      console.error('Error al cargar ventas:', error);
      setError(error.message);
      setVentasFiltradas([]);
    } finally {
      setCargando(false);
    }
  }, [filtros.fechaDesde, filtros.fechaHasta]);

  useEffect(() => {
    cargarVentas();
  }, [cargarVentas]);

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      fechaDesde: '',
      fechaHasta: ''
    });
  };

  const generarReporteProductosMasVendidos = () => {
    alert('📊 Generando reporte de productos más vendidos...');
  };

  const generarReporteValorizacionInventario = () => {
    alert('💰 Generando reporte de valorización de inventario...');
  };

  const generarReporteMovimientosInventario = () => {
    alert('📈 Generando reporte de movimientos de inventario...');
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES');
  };

  return (
    <div className="pagina-historial-ventas">
      <div className="historial-ventas">
        <div className="historial-header">
          <h2> Historial de Ventas</h2>
          <p>Consulta todas las ventas registradas en el sistema</p>
        </div>

        {/* Filtros */}
        <div className="filtros-section">
          <div className="filtros-header">
            <h3>Filtros</h3>
          </div>
          <div className="filtros-campos">
            <div className="filtro-grupo">
              <label className="filtro-label">Fecha Desde</label>
              <input
                type="date"
                name="fechaDesde"
                value={filtros.fechaDesde}
                onChange={handleFiltroChange}
                className="filtro-input"
              />
            </div>
            <div className="filtro-grupo">
              <label className="filtro-label">Fecha Hasta</label>
              <input
                type="date"
                name="fechaHasta"
                value={filtros.fechaHasta}
                onChange={handleFiltroChange}
                className="filtro-input"
              />
            </div>
            <div className="filtro-acciones">
              <button
                onClick={limpiarFiltros}
                className="btn-limpiar"
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Botones de Reportes */}
        <div className="reportes-section">
          <h3>Reportes</h3>
          <div className="botones-reportes">
            <button
              onClick={generarReporteProductosMasVendidos}
              className="btn-reporte"
            >
              📊 Productos Más Vendidos
            </button>
            <button
              onClick={generarReporteValorizacionInventario}
              className="btn-reporte"
            >
              💰 Valorización de Inventario
            </button>
            <button
              onClick={generarReporteMovimientosInventario}
              className="btn-reporte"
            >
              📈 Movimientos de Inventario
            </button>
          </div>
        </div>

        {/* Tabla de Ventas */}
        <div className="tabla-section">
          <div className="tabla-header">
            <h3>Ventas Registradas</h3>
            <span className="total-registros">
              Total: {ventasFiltradas.length} ventas
            </span>
          </div>

          {cargando ? (
            <div className="cargando">
              <div className="loading-spinner"></div>
              <p>Cargando historial de ventas...</p>
            </div>
          ) : error ? (
            <div className="sin-datos">
              <p>❌ Error al cargar el historial: {error}</p>
              <button onClick={cargarVentas} className="btn-reporte" style={{ marginTop: '1rem' }}>
                Reintentar
              </button>
            </div>
          ) : ventasFiltradas.length === 0 ? (
            <div className="sin-datos">
              <p>No se encontraron ventas con los filtros aplicados.</p>
            </div>
          ) : (
            <div className="tabla-contenedor">
              <table className="tabla-ventas">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Motivo</th>
                    <th>Fecha</th>
                    <th>Usuario</th>
                  </tr>
                </thead>
                <tbody>
                  {ventasFiltradas.map(venta => (
                    <tr key={venta.id}>
                      <td>
                        <div className="producto-info">
                          <span className="producto-codigo">{venta.producto.codigo}</span>
                          <span className="producto-nombre">{venta.producto.nombre}</span>
                        </div>
                      </td>
                      <td className="texto-centro">
                        <span className="cantidad-badge">{venta.cantidad}</span>
                      </td>
                      <td>
                        <span className={`motivo ${!venta.motivo ? 'sin-motivo' : ''}`}>
                          {venta.motivo}
                        </span>
                      </td>
                      <td className="texto-centro fecha">
                        {formatearFecha(venta.fecha)}
                      </td>
                      <td>
                        <div className="usuario-info">
                          <span className="usuario-nombre">{venta.usuario.nombre}</span>
                          <span className="usuario-rol">{venta.usuario.rol}</span>
                          <span className="usuario-email">{venta.usuario.email}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistorialVentas;