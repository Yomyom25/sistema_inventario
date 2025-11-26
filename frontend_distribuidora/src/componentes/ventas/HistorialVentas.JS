import React, { useState, useEffect } from 'react';
import './HistorialVentas.css';

const HistorialVentas = () => {
  const [ventas, setVentas] = useState([]);
  const [ventasFiltradas, setVentasFiltradas] = useState([]);
  const [filtros, setFiltros] = useState({
    fechaDesde: '',
    fechaHasta: ''
  });
  const [cargando, setCargando] = useState(true);

  // Datos de ejemplo - en un caso real vendrían de una API
  useEffect(() => {
    const cargarVentas = async () => {
      setCargando(true);
      
      // Simular carga de datos desde API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const ventasEjemplo = [
        {
          id: 1,
          producto: {
            codigo: 'PROD-001',
            nombre: 'Laptop HP Pavilion',
            precioVenta: 800
          },
          cantidad: 2,
          motivo: 'Venta normal',
          fecha: '2024-01-14',
          usuario: {
            nombre: 'Juan Pérez',
            email: 'juan@empresa.com',
            rol: 'Administrador'
          },
          total: 1600
        },
        {
          id: 2,
          producto: {
            codigo: 'PROD-002',
            nombre: 'Mouse Inalámbrico',
            precioVenta: 30
          },
          cantidad: 5,
          motivo: 'Promoción especial',
          fecha: '2024-01-15',
          usuario: {
            nombre: 'Carlos López',
            email: 'carlos@empresa.com',
            rol: 'Empleado'
          },
          total: 150
        },
        {
          id: 3,
          producto: {
            codigo: 'PROD-003',
            nombre: 'Teclado Mecánico',
            precioVenta: 75
          },
          cantidad: 11,
          motivo: 'No especificado',
          fecha: '2024-01-16',
          usuario: {
            nombre: 'Pedro Rodríguez',
            email: 'pedro@empresa.com',
            rol: 'Empleado'
          },
          total: 825
        },
        {
          id: 4,
          producto: {
            codigo: 'PROD-001',
            nombre: 'Laptop HP Pavilion',
            precioVenta: 800
          },
          cantidad: 11,
          motivo: 'Cliente corporativo',
          fecha: '2024-01-17',
          usuario: {
            nombre: 'Pedro Rodríguez',
            email: 'pedro@empresa.com',
            rol: 'Empleado'
          },
          total: 8800
        },
        {
          id: 5,
          producto: {
            codigo: 'PROD-004',
            nombre: 'Monitor 24"',
            precioVenta: 200
          },
          cantidad: 3,
          motivo: 'Equipo nuevo',
          fecha: '2024-01-18',
          usuario: {
            nombre: 'Pedro Rodríguez',
            email: 'pedro@empresa.com',
            rol: 'Empleado'
          },
          total: 600
        }
      ];
      
      setVentas(ventasEjemplo);
      setVentasFiltradas(ventasEjemplo);
      setCargando(false);
    };

    cargarVentas();
  }, []);

  // Aplicar filtros
  useEffect(() => {
    let resultado = ventas;

    if (filtros.fechaDesde) {
      resultado = resultado.filter(venta => venta.fecha >= filtros.fechaDesde);
    }

    if (filtros.fechaHasta) {
      resultado = resultado.filter(venta => venta.fecha <= filtros.fechaHasta);
    }

    setVentasFiltradas(resultado);
  }, [filtros, ventas]);

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
    // Lógica para generar reporte
  };

  const generarReporteValorizacionInventario = () => {
    alert('💰 Generando reporte de valorización de inventario...');
    // Lógica para generar reporte
  };

  const generarReporteMovimientosInventario = () => {
    alert('📈 Generando reporte de movimientos de inventario...');
    // Lógica para generar reporte
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES');
  };

  return (
    <div className="pagina-historial-ventas">
      <div className="historial-ventas">
        <div className="historial-header">
          <h2>📋 Historial de Ventas</h2>
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