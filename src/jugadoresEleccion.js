import React, { useState, useEffect } from 'react';
import Rosco from './Rosco';

function JugadoresEleccion({ jugadores }) {
  const letras = Object.keys(jugadores).sort();

  const [jugadoresRandom, setJugadoresRandom] = useState({});

  const [letraActual, setLetraActual] = useState(letras[0]);
  const [respuesta, setRespuesta] = useState('');
  const [aciertos, setAciertos] = useState([]);
  const [errores, setErrores] = useState([]);
  const [pasadas, setPasadas] = useState([]);
  const [sugerencias, setSugerencias] = useState([]);

  // Asignar jugador random por letra
  const asignarJugadoresRandom = () => {
    const asignados = {};
    letras.forEach((letra) => {
      const lista = jugadores[letra];
      const indexRandom = Math.floor(Math.random() * lista.length);
      asignados[letra] = lista[indexRandom];
    });
    setJugadoresRandom(asignados);
  };

  useEffect(() => {
    asignarJugadoresRandom();
    setLetraActual(letras[0]);
    setRespuesta('');
    setAciertos([]);
    setErrores([]);
    setPasadas([]);
    setSugerencias([]);
  }, []);

  function normalizar(texto) {
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  const manejarCambio = (e) => {
    const valor = e.target.value;
    setRespuesta(valor);

    if (valor.length >= 3 && letraActual) {
      const posibles = jugadores[letraActual].filter((j) =>
        normalizar(j.nombre).startsWith(normalizar(valor))
      );
      setSugerencias(posibles);
    } else {
      setSugerencias([]);
    }
  };

  const avanzarLetra = () => {
    let indiceActual = letras.indexOf(letraActual);
    let siguienteIndice = (indiceActual + 1) % letras.length;

    while (
      aciertos.includes(letras[siguienteIndice]) ||
      errores.includes(letras[siguienteIndice])
    ) {
      siguienteIndice = (siguienteIndice + 1) % letras.length;
      if (siguienteIndice === indiceActual) {
        setLetraActual(null);
        return;
      }
    }

    setLetraActual(letras[siguienteIndice]);
    setRespuesta('');
    setSugerencias([]);
  };

  const verificar = () => {
    if (!letraActual) return;

    const jugadorCorrecto = jugadoresRandom[letraActual];
    if (!jugadorCorrecto) return;

    const esCorrecto =
      normalizar(respuesta) === normalizar(jugadorCorrecto.nombre);

    if (esCorrecto) {
      if (!aciertos.includes(letraActual)) setAciertos([...aciertos, letraActual]);
      if (pasadas.includes(letraActual))
        setPasadas(pasadas.filter((l) => l !== letraActual));
      if (errores.includes(letraActual))
        setErrores(errores.filter((l) => l !== letraActual));
    } else {
      if (!errores.includes(letraActual)) setErrores([...errores, letraActual]);
      if (!pasadas.includes(letraActual)) setPasadas([...pasadas, letraActual]);
    }

    setRespuesta('');
    setSugerencias([]);
    avanzarLetra();
  };

  const pasar = () => {
    if (!letraActual) return;

    if (
      !pasadas.includes(letraActual) &&
      !aciertos.includes(letraActual) &&
      !errores.includes(letraActual)
    ) {
      setPasadas([...pasadas, letraActual]);
    }

    avanzarLetra();
  };

  const reiniciar = () => {
    asignarJugadoresRandom();
    setLetraActual(letras[0]);
    setRespuesta('');
    setAciertos([]);
    setErrores([]);
    setPasadas([]);
    setSugerencias([]);
  };

  const juegoTerminado = letras.every(
    (l) => aciertos.includes(l) || errores.includes(l)
  );

  // Manejar tecla Enter en el input para enviar respuesta
  const manejarKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      verificar();
    }
  };

  if (juegoTerminado) {
    return (
      <div style={{ textAlign: 'center' }}>
        <h2>¡Juego terminado!</h2>
        <p>✅ Aciertos: {aciertos.length}</p>
        <p>❌ Errores: {errores.length}</p>

        <h3>Respuestas correctas que erraste:</h3>
        <ul style={{ maxWidth: 400, margin: '0 auto', listStyle: 'none', padding: 0 }}>
          {errores.map((letra) => (
            <li
              key={letra}
              style={{
                backgroundColor: '#e76f51',
                color: 'white',
                margin: '5px 0',
                padding: '8px',
                borderRadius: '4px',
                fontWeight: 'bold',
              }}
            >
              {letra.toUpperCase()}: {jugadoresRandom[letra]?.nombre || 'Sin respuesta'}
            </li>
          ))}
        </ul>

        <button
          onClick={reiniciar}
          style={{ marginTop: 20, padding: '10px 20px', cursor: 'pointer' }}
        >
          Reiniciar
        </button>
      </div>
    );
  }

  const jugadorActual = jugadoresRandom[letraActual];

  return (
    <div style={{ textAlign: 'center', fontFamily: 'Arial' }}>
      <Rosco
        letras={letras}
        letraActual={letraActual}
        aciertos={aciertos}
        errores={errores}
        pasadas={pasadas}
        onClickLetra={setLetraActual}
      />

      <h2>Letra: {letraActual.toUpperCase()}</h2>
      <p>
        <strong>Pista:</strong> {jugadorActual?.pista || 'Sin pista'}
      </p>

      <input
        type="text"
        value={respuesta}
        onChange={manejarCambio}
        onKeyDown={manejarKeyDown}
        placeholder="Escribí el jugador"
        autoComplete="off"
        style={{ padding: 10, fontSize: 16, marginTop: 10 }}
      />

      <div>
        <button onClick={verificar} style={{ margin: 5, padding: 10 }}>
          Responder
        </button>
        <button onClick={pasar} style={{ margin: 5, padding: 10 }}>
          Pasar
        </button>
        <button
          onClick={reiniciar}
          style={{ margin: 5, padding: 10, backgroundColor: '#264653', color: '#fff' }}
        >
          Reiniciar
        </button>
      </div>

      {sugerencias.length > 0 && (
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            maxWidth: 300,
            margin: '10px auto',
            cursor: 'pointer',
          }}
        >
          {sugerencias.map((j, i) => (
            <li
              key={i}
              onClick={() => setRespuesta(j.nombre)}
              style={{ background: '#eee', margin: '2px 0', padding: '5px' }}
            >
              {j.nombre}
            </li>
          ))}
        </ul>
      )}

      <div style={{ marginTop: 20 }}>
        <p>✅ Aciertos: {aciertos.length}</p>
        <p>❌ Errores: {errores.length}</p>
        <p>🟡 Pasadas: {pasadas.length}</p>
        <p>🔄 Letras totales: {letras.length}</p>
      </div>
    </div>
  );
}

export default JugadoresEleccion;
