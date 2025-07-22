import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Rosco from './Rosco';

function JugadoresEleccion({ jugadores }) {
  const letras = useMemo(() => {
    return Object.keys(jugadores).sort();
  }, [jugadores]);

  const [jugadoresRandom, setJugadoresRandom] = useState({});

  const [letraActual, setLetraActual] = useState(letras[0]);
  const [respuesta, setRespuesta] = useState('');
  const [aciertos, setAciertos] = useState([]);
  const [errores, setErrores] = useState([]);
  const [pasadas, setPasadas] = useState([]);
  const [sugerencias, setSugerencias] = useState([]);
  const [sugerenciaResaltada, setSugerenciaResaltada] = useState(-1);

  const [tiempoRestante, setTiempoRestante] = useState(0);
  const [juegoActivo, setJuegoActivo] = useState(false);
  const [juegoIniciado, setJuegoIniciado] = useState(false);
  const [tiempoInput, setTiempoInput] = useState('3');

  const inputRef = useRef(null);

  const asignarJugadoresRandomInterna = useCallback(() => {
    const asignados = {};
    letras.forEach((letra) => {
      const lista = jugadores[letra];
      const indexRandom = Math.floor(Math.random() * lista.length);
      asignados[letra] = lista[indexRandom];
    });
    setJugadoresRandom(asignados);
  }, [jugadores, letras]);

  useEffect(() => {
    asignarJugadoresRandomInterna();
  }, [asignarJugadoresRandomInterna]);

  useEffect(() => {
    let timer;
    if (juegoActivo && tiempoRestante > 0) {
      timer = setInterval(() => {
        setTiempoRestante((prevTiempo) => {
          if (prevTiempo <= 1) {
            clearInterval(timer);
            setJuegoActivo(false);
            return 0;
          }
          return prevTiempo - 1;
        });
      }, 1000);
    } else if (tiempoRestante === 0 && juegoActivo) {
        setJuegoActivo(false);
    }

    return () => clearInterval(timer);
  }, [juegoActivo, tiempoRestante]);

  useEffect(() => {
    if (sugerencias.length === 0) {
      setSugerenciaResaltada(-1);
    }
  }, [sugerencias]);


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
    if (valor.length >= 3 && letraActual && juegoActivo) {
      const posibles = jugadores[letraActual].filter((j) =>
        normalizar(j.nombre).startsWith(normalizar(valor))
      );
      setSugerencias(posibles);
      setSugerenciaResaltada(-1);
    } else {
      setSugerencias([]);
      setSugerenciaResaltada(-1);
    }
  };

  const avanzarLetra = () => {
    let indiceActual = letras.indexOf(letraActual);
    let siguienteIndice = (indiceActual + 1) % letras.length;

    let intentos = 0;
    while (
      (aciertos.includes(letras[siguienteIndice]) ||
        errores.includes(letras[siguienteIndice])) &&
      intentos < letras.length
    ) {
      siguienteIndice = (siguienteIndice + 1) % letras.length;
      intentos++;
    }

    if (intentos === letras.length) {
      setLetraActual(null);
      setJuegoActivo(false);
      return;
    }

    setLetraActual(letras[siguienteIndice]);
    setRespuesta('');
    setSugerencias([]);
    setSugerenciaResaltada(-1);
  };

  const verificarRespuesta = (valorRespuesta) => {
    if (!letraActual || !juegoActivo) return;

    const jugadorCorrecto = jugadoresRandom[letraActual];
    if (!jugadorCorrecto) return;

    const esCorrecto = normalizar(valorRespuesta) === normalizar(jugadorCorrecto.nombre);

    if (esCorrecto) {
      if (!aciertos.includes(letraActual)) setAciertos([...aciertos, letraActual]);
      if (pasadas.includes(letraActual))
        setPasadas(pasadas.filter((l) => l !== letraActual));
      if (errores.includes(letraActual))
        setErrores(errores.filter((l) => l !== letraActual));
    } else {
      if (!errores.includes(letraActual)) setErrores([...errores, letraActual]);
      if (pasadas.includes(letraActual))
          setPasadas(pasadas.filter((l) => l !== letraActual));
    }

    setRespuesta('');
    setSugerencias([]);
    setSugerenciaResaltada(-1);
    avanzarLetra();
  };

  const verificar = () => {
    verificarRespuesta(respuesta);
  };

  const pasar = () => {
    if (!letraActual || !juegoActivo) return;

    if (
      !pasadas.includes(letraActual) &&
      !aciertos.includes(letraActual) &&
      !errores.includes(letraActual)
    ) {
      setPasadas([...pasadas, letraActual]);
    }

    avanzarLetra();
  };

  const iniciarJuego = () => {
    const tiempoEnSegundos = parseInt(tiempoInput) * 60;
    if (isNaN(tiempoEnSegundos) || tiempoEnSegundos <= 0) {
      alert("Por favor, introduce un tiempo válido en minutos.");
      return;
    }
    setTiempoRestante(tiempoEnSegundos);
    asignarJugadoresRandomInterna();
    setLetraActual(letras[0]);
    setRespuesta('');
    setAciertos([]);
    setErrores([]);
    setPasadas([]);
    setSugerencias([]);
    setSugerenciaResaltada(-1);
    setJuegoActivo(true);
    setJuegoIniciado(true);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const reiniciar = () => {
    setJuegoActivo(false);
    setJuegoIniciado(false);
    setTiempoRestante(0);
    setTiempoInput('3');
    setLetraActual(letras[0]);
    setRespuesta('');
    setAciertos([]);
    setErrores([]);
    setPasadas([]);
    setSugerencias([]);
    setSugerenciaResaltada(-1);
    asignarJugadoresRandomInterna();
  };

  const juegoTerminado = !juegoActivo && juegoIniciado;

  const manejarKeyDown = (e) => {
    if (!juegoActivo) return;

    if (sugerencias.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSugerenciaResaltada((prevIndex) =>
          (prevIndex + 1) % sugerencias.length
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSugerenciaResaltada((prevIndex) =>
          (prevIndex - 1 + sugerencias.length) % sugerencias.length
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (sugerenciaResaltada !== -1) {
          verificarRespuesta(sugerencias[sugerenciaResaltada].nombre);
        } else {
          verificar();
        }
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      verificar();
    }
  };


  const minutos = Math.floor(tiempoRestante / 60);
  const segundos = tiempoRestante % 60;
  const tiempoFormateado = `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;


  if (juegoTerminado) {
    const noRespondidas = letras.filter(
      (l) => !aciertos.includes(l) && !errores.includes(l)
    );

    return (
      <div style={{ textAlign: 'center', padding: '10px' }}> {/* Reducir padding aquí también */}
        <h2>¡Juego terminado!</h2>
        <p>✅ Aciertos: {aciertos.length}</p>
        <p>❌ Errores: {errores.length}</p>

        {errores.length > 0 && (
          <>
            <h3>Respuestas correctas que erraste:</h3>
            <ul style={{ maxWidth: '90%', margin: '0 auto', listStyle: 'none', padding: 0 }}> {/* Max width relativo */}
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
          </>
        )}

        {noRespondidas.length > 0 && (
          <>
            <h3>Respuestas correctas que no llegaste a responder:</h3>
            <ul style={{ maxWidth: '90%', margin: '0 auto', listStyle: 'none', padding: 0 }}> {/* Max width relativo */}
              {noRespondidas.map((letra) => (
                <li
                  key={letra}
                  style={{
                    backgroundColor: '#f4a261',
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
          </>
        )}

        <button
          onClick={reiniciar}
          style={{ marginTop: 20, padding: '10px 20px', cursor: 'pointer' }}
        >
          Reiniciar
        </button>
      </div>
    );
  }

  if (!juegoIniciado) {
    return (
      <div style={{ textAlign: 'center', fontFamily: 'Arial', marginTop: 50, padding: '10px' }}> {/* Padding para móviles */}
        <h2>Configurar Juego</h2>
        <div style={{ marginBottom: 20 }}>
          <label htmlFor="tiempoConfig">Tiempo en minutos:</label>
          <input
            id="tiempoConfig"
            type="number"
            value={tiempoInput}
            onChange={(e) => setTiempoInput(e.target.value)}
            min="1"
            style={{ marginLeft: 10, padding: 8, fontSize: 16, width: 60, textAlign: 'center' }}
          />
        </div>
        <button
          onClick={iniciarJuego}
          style={{ padding: '15px 30px', fontSize: 20, cursor: 'pointer', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: 5 }}
        >
          Iniciar Juego
        </button>
      </div>
    );
  }

  const jugadorActual = jugadoresRandom[letraActual];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column', /* Por defecto en columna para móviles */
        justifyContent: 'center',
        alignItems: 'flex-start',
        fontFamily: 'Arial',
        padding: '10px', /* Padding general para el contenedor principal */
        gap: '20px', /* Reducir el espacio entre elementos */
      }}
    >
      {/* Media query para pantallas más grandes (escritorio/tablet) */}
      <style jsx>{`
        @media (min-width: 768px) {
          .flex-container {
            flex-direction: row; /* En fila para pantallas más grandes */
            align-items: flex-start;
            gap: 40px; /* Restaurar gap original */
          }
        }
      `}</style>
      <div className="flex-container" style={{
        display: 'flex',
        flexDirection: 'column', /* Default for mobile */
        justifyContent: 'center',
        alignItems: 'flex-start',
        width: '100%', /* Ensure it takes full width */
      }}>
        {/* Contenedor del Rosco (izquierda/arriba en móvil) */}
        <div style={{ flexShrink: 0, width: '100%', display: 'flex', justifyContent: 'center' }}> {/* Centrar Rosco en móvil */}
          <Rosco
            letras={letras}
            letraActual={letraActual}
            aciertos={aciertos}
            errores={errores}
            pasadas={pasadas}
          />
        </div>

        {/* Contenedor de la Información del Juego (derecha/abajo en móvil) */}
        <div style={{ flexGrow: 1, textAlign: 'left', maxWidth: '100%', padding: '0 10px', boxSizing: 'border-box' }}> {/* Ancho completo y padding para móviles */}
          <div style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10, color: tiempoRestante <= 10 ? 'red' : 'inherit' }}>
            Tiempo: {tiempoFormateado}
          </div>

          <h2>Letra: {letraActual.toUpperCase()}</h2>
          <p>
            <strong>Pista:</strong> {jugadorActual?.pista || 'Sin pista'}
          </p>

          <input
            ref={inputRef}
            type="text"
            value={respuesta}
            onChange={manejarCambio}
            onKeyDown={manejarKeyDown}
            placeholder="Escribí el jugador"
            autoComplete="off"
            style={{ padding: 10, fontSize: 16, marginTop: 10, width: 'calc(100% - 20px)' }} /* Ancho del 100% menos el padding */
            disabled={!juegoActivo}
          />

          {sugerencias.length > 0 && juegoActivo && (
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                maxWidth: '100%', /* Ancho completo */
                marginTop: '5px',
                cursor: 'pointer',
                border: '1px solid #ccc',
                borderRadius: '4px',
                maxHeight: '150px',
                overflowY: 'auto',
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                zIndex: 10,
                backgroundColor: 'white'
              }}
            >
              {sugerencias.map((j, i) => (
                <li
                  key={i}
                  onClick={() => {
                    setRespuesta(j.nombre);
                    setSugerencias([]);
                    setSugerenciaResaltada(-1);
                    verificarRespuesta(j.nombre);
                  }}
                  style={{
                    background: i === sugerenciaResaltada ? '#e0e0e0' : '#f9f9f9',
                    margin: '2px 0',
                    padding: '8px',
                    borderBottom: '1px solid #eee'
                  }}
                >
                  {j.nombre}
                </li>
              ))}
            </ul>
          )}

          <div style={{ marginTop: '15px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px' }}> {/* Botones flexibles y espaciados */}
            <button
              onClick={verificar}
              style={{ padding: '10px', minWidth: '100px', flexGrow: 1 }} /* Botones crecen para ocupar espacio */
              disabled={!juegoActivo}
            >
              Responder
            </button>
            <button
              onClick={pasar}
              style={{ padding: '10px', minWidth: '100px', flexGrow: 1 }}
              disabled={!juegoActivo}
            >
              Pasar
            </button>
            <button
              onClick={reiniciar}
              style={{ padding: '10px', backgroundColor: '#264653', color: '#fff', minWidth: '100px', flexGrow: 1 }}
            >
              Reiniciar
            </button>
          </div>

          <div style={{ marginTop: 20, textAlign: 'center' }}> {/* Centrar el resumen de aciertos/errores */}
            <p>✅ Aciertos: {aciertos.length}</p>
            <p>❌ Errores: {errores.length}</p>
            <p>🟡 Pasadas: {pasadas.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default JugadoresEleccion;