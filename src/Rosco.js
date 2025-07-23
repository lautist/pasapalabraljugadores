import React from 'react';

function Rosco({ letras, letraActual, aciertos, errores, pasadas }) {
  const total = letras.length;
  // Ajustar el radio para que sea relativo y el viewBox para escalabilidad
  const baseSize = 600; // Un tamaño base para el SVG más grande para dar espacio a los círculos
  const radioPrincipal = (baseSize / 2) - 40; // Radio del círculo principal donde se distribuyen los círculos de letras
  const radioCirculoLetra = 25; // Radio de cada círculo individual de letra
  const center = baseSize / 2;

  // Función para determinar el color de relleno del círculo
  const getCircleFillColor = (letra) => {
    if (aciertos.includes(letra)) return '#4CAF50'; // Verde para aciertos (ajustado para la paleta)
    if (errores.includes(letra)) return '#fa5a4fff'; // Rojo para errores (ajustado para la paleta)
    if (pasadas.includes(letra)) return '#ffec45ff'; // Amarillo para pasadas (ajustado para la paleta)
    return '#4a94daff'; // Color default de los círculos (oscuro/neutro de la paleta)
  };

  // Función para determinar el color del borde del círculo de la letra actual
  const getCircleStrokeColor = (letra) => {
    return '#004f99ff'; // Color de acento de la paleta para el borde de la letra actual
  };

  // Color del texto de la letra (siempre claro para visibilidad)
  const getLetterTextColor = () => {
    return '#080808ff'; // Gris claro para el texto de la letra
  };

  return (
    <svg
      width="100%" /* Ocupar el 100% del ancho del contenedor */
      height="auto" /* Altura automática para mantener la proporción */
      viewBox={`0 0 ${baseSize} ${baseSize}`} /* Definir el área de visualización para escalabilidad */
      style={{ display: 'block', margin: '0 auto', maxWidth: '380px' }} /* Centrar y limitar el tamaño máximo */
    >
      {letras.map((letra, i) => {
        const angulo = (2 * Math.PI * i) / total - Math.PI / 2; // Ángulo para posicionar el círculo
        const x = center + radioPrincipal * Math.cos(angulo);
        const y = center + radioPrincipal * Math.sin(angulo);
        const esActual = letra === letraActual;

        return (
          <React.Fragment key={letra}>
            {/* Círculo de fondo */}
            <circle
              cx={x}
              cy={y}
              r={radioCirculoLetra}
              fill={getCircleFillColor(letra)}
              stroke={esActual ? getCircleStrokeColor(letra) : 'none'}
              strokeWidth={esActual ? 4 : 0} // Borde más grueso para la letra actual
              style={{ transition: 'all 0.3s ease' }}
            />
            {/* Texto de la letra */}
            <text
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              // onClick={() => onClickLetra(letra)} // Desactivado para este juego específico, solo es visual
              style={{
                cursor: 'default',
                userSelect: 'none',
                fontSize: esActual ? '1.8em' : '1.2em', /* Tamaño de fuente de la letra dentro del círculo */
                fontWeight: esActual ? 'bold' : 'normal',
                fill: getLetterTextColor(), // Color fijo para el texto de la letra
                transition: 'all 0.3s ease',
                pointerEvents: 'auto', // Permite que el texto reciba eventos si onClickLetra se reactiva
              }}
            >
              {letra.toUpperCase()}
            </text>
          </React.Fragment>
        );
      })}
    </svg>
  );
}

export default Rosco;