import React from 'react';

function Rosco({ letras, letraActual, aciertos, errores, pasadas, onClickLetra }) {
  const total = letras.length;
  const radio = 120;
  const center = radio + 20;

  // Definir color según estado
  const colorLetra = (letra) => {
    if (aciertos.includes(letra)) return '#2a9d8f'; // verde
    if (errores.includes(letra)) return '#ff0000ff'; // rojo
    if (pasadas.includes(letra)) return '#e9ec4aff'; // amarillo
    return '#1d3557'; // color default (azul oscuro)
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

        return (
          <text
            key={letra}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            onClick={() => onClickLetra(letra)}
            style={{
              cursor: 'pointer',
              userSelect: 'none',
              fontSize: esActual ? 26 : 18,
              fontWeight: esActual ? 'bold' : 'normal',
              fill: colorLetra(letra),
              stroke: esActual ? '#264653' : 'none',
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
