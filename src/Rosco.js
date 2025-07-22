import React from 'react';

function Rosco({ letras, letraActual, aciertos, errores, pasadas }) {
  const total = letras.length;
  const radio = 200; // Aumentamos el radio para un rosco más grande
  const center = radio + 40; // Ajustamos el centro

  // Definir color según estado
  const colorEstado = (letra) => {
    if (aciertos.includes(letra)) return '#09ff00ff'; // verde para aciertos (sin cambios en este caso)
    if (errores.includes(letra)) return '#ff0000ff'; // rojo para errores
    if (pasadas.includes(letra)) return '#e9ec4aff'; // amarillo para pasadas
    return '#2683daff'; // azul para las letras en juego
  };

  return (
    <svg
      width={center * 2}
      height={center * 2}
      style={{ display: 'block', margin: '20px auto' }}
    >
      {letras.map((letra, i) => {
        const angulo = (2 * Math.PI * i) / total - Math.PI / 2;
        const x = center + radio * Math.cos(angulo);
        const y = center + radio * Math.sin(angulo);
        const esActual = letra === letraActual;
        const estadoColor = colorEstado(letra);
        const isEnJuego = !aciertos.includes(letra) && !errores.includes(letra) && !pasadas.includes(letra);

        return (
          <g key={letra}>
            {/* Círculo de fondo para el estado */}
            <circle
              cx={x}
              cy={y}
              r={20}
              fill={estadoColor}
            />
            <text
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              style={{
                cursor: 'default',
                userSelect: 'none',
                fontSize: esActual ? 28 : 20,
                fontWeight: esActual ? 'bold' : 'normal',
                fill: '#000', // Letras siempre negras
                stroke: esActual ? '#264653' : 'none',
                strokeWidth: esActual ? 1.5 : 0,
                transition: 'all 0.3s ease',
                pointerEvents: 'none',
              }}
            >
              {letra.toUpperCase()}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default Rosco;