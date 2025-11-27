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
  const [generandoReporte, setGenerandoReporte] = useState(false);
  const [usuarioActual, setUsuarioActual] = useState(null);

  // Obtener usuario actual al cargar el componente
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    setUsuarioActual(user);
  }, []);

  // Verificar si el usuario es empleado
  const esEmpleado = usuarioActual?.role === 'Empleado';

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
      
      // Si es empleado, filtrar solo sus ventas
      if (esEmpleado) {
        params.append('usuarioId', usuarioActual?.id);
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
  }, [filtros.fechaDesde, filtros.fechaHasta, esEmpleado, usuarioActual?.id]);

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

  // Función genérica para descargar reportes PDF
  const descargarReportePDF = async (endpoint, nombreReporte) => {
    setGenerandoReporte(true);
    try {
      const params = new URLSearchParams();
      
      if (filtros.fechaDesde) {
        params.append('fechaDesde', filtros.fechaDesde);
      }
      
      if (filtros.fechaHasta) {
        params.append('fechaHasta', filtros.fechaHasta);
      }
      
      const url = `http://localhost:5000${endpoint}?${params.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Error al generar ${nombreReporte}`);
      }

      // Crear blob y descargar
      const blob = await response.blob();
      const urlDescarga = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = urlDescarga;
      
      // Nombre del archivo basado en el tipo de reporte
      const fecha = new Date().toISOString().split('T')[0];
      link.download = `${nombreReporte.toLowerCase().replace(/\s+/g, '-')}-${fecha}.pdf`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(urlDescarga);

    } catch (error) {
      console.error(`Error al generar ${nombreReporte}:`, error);
      alert(`Error al generar el reporte: ${error.message}`);
    } finally {
      setGenerandoReporte(false);
    }
  };

  // RF-006.1: Reporte de movimientos de inventario
  const generarReporteMovimientosInventario = async () => {
    await descargarReportePDF('/api/reportes/movimientos/pdf', 'Reporte Movimientos Inventario');
  };

  // RF-006.2: Reporte de productos más vendidos
  const generarReporteProductosMasVendidos = async () => {
    await descargarReportePDF('/api/reportes/productos-mas-vendidos/pdf', 'Reporte Productos Mas Vendidos');
  };

  // RF-006.3: Reporte de valorización de inventario
  const generarReporteValorizacionInventario = async () => {
    await descargarReportePDF('/api/reportes/valorizacion-inventario/pdf', 'Reporte Valorizacion Inventario');
  };

  // Reporte de ventas en PDF
  const generarReporteVentasPDF = async () => {
    await descargarReportePDF('/api/reportes/ventas/pdf', 'Reporte Ventas');
  };

  // Reporte de ventas en Excel
  const generarReporteVentasExcel = async () => {
    setGenerandoReporte(true);
    try {
      const params = new URLSearchParams();
      
      if (filtros.fechaDesde) {
        params.append('fechaDesde', filtros.fechaDesde);
      }
      
      if (filtros.fechaHasta) {
        params.append('fechaHasta', filtros.fechaHasta);
      }
      
      const url = `http://localhost:5000/api/reportes/ventas/excel?${params.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Error al generar reporte Excel');
      }

      const blob = await response.blob();
      const urlDescarga = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = urlDescarga;
      link.download = `reporte-ventas-${new Date().toISOString().split('T')[0]}.xlsx`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(urlDescarga);

    } catch (error) {
      console.error('Error al generar Excel:', error);
      alert(`Error al generar el reporte Excel: ${error.message}`);
    } finally {
      setGenerandoReporte(false);
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES');
  };

  return (
    <div className="pagina-historial-ventas">
      <div className="historial-ventas">
        <div className="historial-header">
          <h2>Historial de Ventas</h2>
          <p>
            {esEmpleado 
              ? 'Consulta tu historial personal de ventas' 
              : 'Consulta todas las ventas registradas en el sistema'
            }
          </p>
          {esEmpleado && (
            <div className="rol-indicador">
              <span className="badge-empleado">Vista de Empleado</span>
            </div>
          )}
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
                disabled={generandoReporte}
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Botones de Reportes - DESHABILITADOS PARA EMPLEADOS */}
        {!esEmpleado && (
          <div className="reportes-section">
            <h3>Reportes {generandoReporte && '(Generando...)'}</h3>
            <div className="botones-reportes">
              <button
                onClick={generarReporteProductosMasVendidos}
                className="btn-reporte"
                disabled={generandoReporte}
              >
                {generandoReporte ? '⏳ Generando...' : '📊 Productos Más Vendidos'}
              </button>
              <button
                onClick={generarReporteValorizacionInventario}
                className="btn-reporte"
                disabled={generandoReporte}
              >
                {generandoReporte ? '⏳ Generando...' : '💰 Valorización de Inventario'}
              </button>
              <button
                onClick={generarReporteMovimientosInventario}
                className="btn-reporte"
                disabled={generandoReporte}
              >
                {generandoReporte ? '⏳ Generando...' : '📈 Movimientos de Inventario'}
              </button>
              <button
                onClick={generarReporteVentasPDF}
                className="btn-reporte pdf"
                disabled={generandoReporte}
              >
                {generandoReporte ? '⏳ Generando...' : '📄 Ventas (PDF)'}
              </button>
              <button
                onClick={generarReporteVentasExcel}
                className="btn-reporte excel"
                disabled={generandoReporte}
              >
                {generandoReporte ? '⏳ Generando...' : '📊 Ventas (Excel)'}
              </button>
            </div>
          </div>
        )}

        {/* Mensaje informativo para empleados */}
        {esEmpleado && (
          <div className="info-empleado">
            <div className="info-card">
              <i className="fas fa-info-circle" style={{ color: '#3b82f6' }}></i>
              <div>
                <h4>Vista Restringida</h4>
                <p>Como empleado, solo puedes ver tu historial personal de ventas. La generación de reportes está disponible únicamente para administradores.</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabla de Ventas */}
        <div className="tabla-section">
          <div className="tabla-header">
            <h3>
              {esEmpleado ? 'Mis Ventas Registradas' : 'Ventas Registradas'}
            </h3>
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
              <button 
                onClick={cargarVentas} 
                className="btn-reporte" 
                style={{ marginTop: '1rem' }}
                disabled={generandoReporte}
              >
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
                    {!esEmpleado && <th>Usuario</th>}
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
                      {!esEmpleado && (
                        <td>
                          <div className="usuario-info">
                            <span className="usuario-nombre">{venta.usuario.nombre}</span>
                            <span className="usuario-rol">{venta.usuario.rol}</span>
                            <span className="usuario-email">{venta.usuario.email}</span>
                          </div>
                        </td>
                      )}
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