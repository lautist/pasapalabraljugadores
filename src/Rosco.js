import React from 'react';

/**
 * Componente Rosco - Visualización Técnica
 * Calcula el posicionamiento circular mediante trigonometría
 */
// Se agregan valores por defecto para evitar "TypeError: Cannot read properties of undefined"
const Rosco = ({ letras = [], letraActual = '', aciertos = [], errores = [], pasadas = [] }) => {
  const totalLetras = letras.length;
  const radio = 42; 

  return (
    <div className="rosco-main-container">
      <div className="rosco-center-glow"></div>
      {letras.map((letra, index) => {
        const angle = (index * (360 / totalLetras)) - 90;
        const x = 50 + radio * Math.cos((angle * Math.PI) / 180);
        const y = 50 + radio * Math.sin((angle * Math.PI) / 180);

        let statusClass = "item-rosco";
        if (letra === letraActual) statusClass += " active";
        if (aciertos.includes(letra)) statusClass += " success";
        if (errores.includes(letra)) statusClass += " error";
        if (pasadas.includes(letra) && !aciertos.includes(letra) && !errores.includes(letra)) statusClass += " skipped"; // Nueva clase para amarillo

        return (
          <div
            key={letra}
            className={statusClass}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            {letra.toUpperCase()}
          </div>
        );
      })}
    </div>
  );
};

export default Rosco;