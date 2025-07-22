import React from 'react';

function Rosco({ letras, letraActual, aciertos, errores, pasadas, onClickLetra }) {
  const total = letras.length;
  // Ajustar el radio para que sea relativo y el viewBox para escalabilidad
  const baseSize = 350; // Un tamaño base para el SVG
  const radio = baseSize / 2 - 30; // Ajustar radio para margen
  const center = baseSize / 2;

  // Definir color según estado
  const colorLetra = (letra) => {
    if (aciertos.includes(letra)) return '#0bff2cff'; // verde
    if (errores.includes(letra)) return '#ff0000ff'; // rojo
    if (pasadas.includes(letra)) return '#e9ec4aff'; // amarillo
    return '#0d2c57ff'; // color default (azul oscuro)
  };

  return (
    <svg
      width="100%" /* Ocupar el 100% del ancho del contenedor */
      height="auto" /* Altura automática para mantener la proporción */
      viewBox={`0 0 ${baseSize} ${baseSize}`} /* Definir el área de visualización para escalabilidad */
      style={{ display: 'block', margin: '0 auto', maxWidth: '300px' }} /* Centrar y limitar el tamaño máximo */
    >
      {letras.map((letra, i) => {
        const angulo = (2 * Math.PI * i) / total - Math.PI / 2;
        const x = center + radio * Math.cos(angulo);
        const y = center + radio * Math.sin(angulo);
        const esActual = letra === letraActual;

        return (
          <text
            key={letra}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            // onClick={() => onClickLetra(letra)} // Desactivado para este juego específico, solo es visual
            style={{
              cursor: 'default',
              userSelect: 'none',
              fontSize: esActual ? '3em' : '1.5em', /* Tamaños de fuente relativos */
              fontWeight: esActual ? 'bold' : 'normal',
              fill: colorLetra(letra),
              stroke: esActual ? '#76bad4ff' : 'none',
              strokeWidth: esActual ? 1.5 : 0,
              transition: 'all 0.3s ease',
              pointerEvents: 'auto',
            }}
          >
            {letra.toUpperCase()}
          </text>
        );
      })}
    </svg>
  );
}

export default Rosco;