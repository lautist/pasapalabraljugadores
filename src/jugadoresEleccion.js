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
  const [tiempoInput, setTiempoInput] = useState('3'); // Tiempo en minutos configurado por el usuario

  const [dificultadSeleccionada, setDificultadSeleccionada] = useState('medio');

  const [mostrarPantallaFinalizada, setMostrarPantallaFinalizada] = useState(false);
  const [mostrarResultadosFinales, setMostrarResultadosFinales] = useState(false);

  const inputRef = useRef(null);

  const normalizar = useCallback((texto) => {
    if (typeof texto !== 'string') return '';
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }, []);

  // ELIMINAMOS nombresAlternativosAceptados ya que ahora estará en el JSON

  const asignarJugadoresRandomInterna = useCallback(() => {
    const asignados = {};
    letras.forEach((letra) => {
      const listaCompleta = jugadores[letra];
      const listaFiltradaPorDificultad = listaCompleta.filter(j => j.dificultad === dificultadSeleccionada);

      if (listaFiltradaPorDificultad.length > 0) {
        const indexRandom = Math.floor(Math.random() * listaFiltradaPorDificultad.length);
        asignados[letra] = listaFiltradaPorDificultad[indexRandom];
      }
    });
    setJugadoresRandom(asignados);
  }, [letras, jugadores, dificultadSeleccionada]);

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
            setMostrarPantallaFinalizada(true);
            return 0;
          }
          return prevTiempo - 1;
        });
      }, 1000);
    } else if (tiempoRestante === 0 && juegoActivo) {
        setJuegoActivo(false);
        setMostrarPantallaFinalizada(true);
    }

    return () => clearInterval(timer);
  }, [juegoActivo, tiempoRestante]);

  useEffect(() => {
    if (!juegoIniciado || !juegoActivo || mostrarPantallaFinalizada || mostrarResultadosFinales) {
      return;
    }

    const letrasCompletadasDefinitivamente = aciertos.length + errores.length;

    if (letrasCompletadasDefinitivamente === letras.length && letras.length > 0) {
      setJuegoActivo(false);
      setLetraActual(null);
      setMostrarPantallaFinalizada(true);
    }
  }, [aciertos, errores, letras.length, juegoIniciado, juegoActivo, mostrarPantallaFinalizada, mostrarResultadosFinales]);

  useEffect(() => {
    if (sugerencias.length === 0) {
      setSugerenciaResaltada(-1);
    }
  }, [sugerencias]);

  const avanzarLetra = useCallback(() => {
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
      return;
    }

    setLetraActual(letras[siguienteIndice]);
    setRespuesta('');
    setSugerencias([]);
    setSugerenciaResaltada(-1);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [letraActual, letras, aciertos, errores]);

  const verificarRespuesta = useCallback((valorRespuesta) => {
    if (!letraActual || !juegoActivo) return;

    if (normalizar(valorRespuesta) === '') {
        return;
    }

    const jugadorCorrecto = jugadoresRandom[letraActual];
    if (!jugadorCorrecto) return;

    const respuestaNormalizada = normalizar(valorRespuesta);
    const nombreCorrectoNormalizado = normalizar(jugadorCorrecto.nombre);

    let esCorrecto = respuestaNormalizada === nombreCorrectoNormalizado;

    // NUEVA LÓGICA: Verificar si la respuesta normalizada coincide con algún nombreSecundario
    if (!esCorrecto && jugadorCorrecto.nombreSecundario && Array.isArray(jugadorCorrecto.nombreSecundario)) {
        if (jugadorCorrecto.nombreSecundario.some(alias => normalizar(alias) === respuestaNormalizada)) {
            esCorrecto = true;
        }
    }
    // Fin de la lógica de verificación mejorada

    if (esCorrecto) {
      if (!aciertos.includes(letraActual)) setAciertos((prev) => [...prev, letraActual]);
      if (pasadas.includes(letraActual)) setPasadas((prev) => prev.filter((l) => l !== letraActual));
      if (errores.includes(letraActual)) setErrores((prev) => prev.filter((l) => l !== letraActual));
    } else {
      if (!errores.includes(letraActual)) setErrores((prev) => [...prev, letraActual]);
      if (pasadas.includes(letraActual)) setPasadas((prev) => prev.filter((l) => l !== letraActual));
    }
    setRespuesta('');
    setSugerencias([]);
    setSugerenciaResaltada(-1);
    avanzarLetra();
  }, [letraActual, juegoActivo, jugadoresRandom, normalizar, aciertos, errores, pasadas, avanzarLetra]); // Quita nombresAlternativosAceptados de las dependencias

  const verificar = useCallback(() => {
    verificarRespuesta(respuesta);
  }, [respuesta, verificarRespuesta]);

  const pasar = useCallback(() => {
    if (!letraActual || !juegoActivo) return;

    if (
      !pasadas.includes(letraActual) &&
      !aciertos.includes(letraActual) &&
      !errores.includes(letraActual)
    ) {
      setPasadas((prev) => [...prev, letraActual]);
    }
    avanzarLetra();
  }, [letraActual, juegoActivo, pasadas, aciertos, errores, avanzarLetra]);

  const manejarCambio = useCallback((e) => {
    const valor = e.target.value;
    setRespuesta(valor);

    if (valor.length >= 3 && letraActual) {
      const listaCompletaDeLetra = jugadores[letraActual] || [];
      const sugerenciasFiltradas = listaCompletaDeLetra.filter(j =>
        j.dificultad === dificultadSeleccionada && normalizar(j.nombre).includes(normalizar(valor))
      );
      setSugerencias(sugerenciasFiltradas || []);
    } else {
      setSugerencias([]);
    }
    setSugerenciaResaltada(-1);
  }, [jugadores, letraActual, normalizar, dificultadSeleccionada]);

  const manejarKeyDown = useCallback((e) => {
    if (!juegoActivo) return;

    if (sugerencias.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSugerenciaResaltada((prev) =>
          prev < sugerencias.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSugerenciaResaltada((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (sugerenciaResaltada !== -1) {
          setRespuesta(sugerencias[sugerenciaResaltada].nombre);
          setSugerencias([]);
          setSugerenciaResaltada(-1);
          if (inputRef.current) inputRef.current.focus();
          verificarRespuesta(sugerencias[sugerenciaResaltada].nombre);
        } else {
          verificar();
        }
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      verificar();
    }
  }, [sugerencias, sugerenciaResaltada, verificar, verificarRespuesta, juegoActivo]);

  const iniciarJuego = useCallback(() => {
    const tiempoEnSegundos = parseInt(tiempoInput) * 60;
    if (isNaN(tiempoEnSegundos) || tiempoEnSegundos <= 0) {
      alert("Por favor, introduce un tiempo válido en minutos.");
      return;
    }
    setTiempoRestante(tiempoEnSegundos);
    setJuegoActivo(true);
    setJuegoIniciado(true);
    setLetraActual(letras[0]);
    setRespuesta('');
    setAciertos([]);
    setErrores([]);
    setPasadas([]);
    setSugerencias([]);
    setSugerenciaResaltada(-1);
    asignarJugadoresRandomInterna();
    setMostrarPantallaFinalizada(false);
    setMostrarResultadosFinales(false);

    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [tiempoInput, letras, asignarJugadoresRandomInterna]);

  const reiniciar = useCallback(() => {
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
    setDificultadSeleccionada('medio');
    asignarJugadoresRandomInterna();
    setMostrarPantallaFinalizada(false);
    setMostrarResultadosFinales(false);
  }, [letras, asignarJugadoresRandomInterna]);

  const verResultados = useCallback(() => {
    setMostrarPantallaFinalizada(false);
    setMostrarResultadosFinales(true);
  }, []);

  const tiempoFormateado = `${Math.floor(tiempoRestante / 60).toString().padStart(2, '0')}:${(tiempoRestante % 60).toString().padStart(2, '0')}`;

  if (mostrarResultadosFinales) {
    const noRespondidas = letras.filter(
      (l) => !aciertos.includes(l) && !errores.includes(l)
    );
    return (
      <div className="final-screen-container">
        <h2>¡Resultados del Rosco!</h2>
        <p className="summary-text">✅ Aciertos: {aciertos.length}</p>
        <p className="summary-text">❌ Errores: {errores.length}</p>

        {errores.length > 0 && (
          <>
            <h3>Respuestas correctas que erraste:</h3>
            <ul className="results-list">
              {errores.map((letra) => (
                <li key={letra} className="error-item">
                  <span style={{ fontWeight: 'bold' }}>{letra.toUpperCase()}:</span> {jugadoresRandom[letra]?.nombre || 'Sin respuesta'}<br />
                  <span style={{ fontSize: '0.9em', fontStyle: 'italic' }}>Pregunta: "{jugadoresRandom[letra]?.pista || 'No disponible'}"</span>
                </li>
              ))}
            </ul>
          </>
        )}

        {noRespondidas.length > 0 && (
          <>
            <h3>Respuestas correctas que no llegaste a responder:</h3>
            <ul className="results-list">
              {noRespondidas.map((letra) => (
                <li key={letra} className="unanswered-item">
                  <span style={{ fontWeight: 'bold' }}>{letra.toUpperCase()}:</span> {jugadoresRandom[letra]?.nombre || 'Sin respuesta'}<br />
                  <span style={{ fontSize: '0.9em', fontStyle: 'italic' }}>Pregunta: "{jugadoresRandom[letra]?.pista || 'No disponible'}"</span>
                </li>
              ))}
            </ul>
          </>
        )}

        <button onClick={reiniciar}>
          Reiniciar Juego
        </button>
      </div>
    );
  }

  if (mostrarPantallaFinalizada) {
    return (
      <div className="final-screen-container">
        <h2>¡Fin del Rosco!</h2>
        <p>El tiempo ha terminado o todas las letras han sido completadas.</p>
        <div className="final-screen-buttons">
          <button onClick={verResultados}>
            Ver Resultados
          </button>
          <button onClick={reiniciar}>
            Reiniciar Juego
          </button>
        </div>
      </div>
    );
  }

  if (!juegoIniciado) {
    return (
      <div className="final-screen-container">
        <h2>Configurar Juego</h2>
        <div className="game-controls">
          <label htmlFor="tiempoConfig">Tiempo en minutos:</label>
          <input
            className="timepo-style"
            id="tiempoConfig"
            type="number"
            value={tiempoInput}
            onChange={(e) => setTiempoInput(e.target.value)}
            min="1"
          />
        </div>
        
        <div className="game-controls">
          <label>Dificultad:</label>
          <select value={dificultadSeleccionada} onChange={(e) => setDificultadSeleccionada(e.target.value)}>
            <option value="medio">Medio</option>
            <option value="dificil">Difícil</option>
          </select>
        </div>
        
        <button onClick={iniciarJuego} className="start-button">
          Iniciar Juego
        </button>
      </div>
    );
  }

  const jugadorActual = jugadoresRandom[letraActual];
  return (
    <div className="App">
      <div className="game-controls" style={{ justifyContent: 'space-around', marginBottom: '10px' }}>
        <p className="summary-text" style={{ color: tiempoRestante <= 20 && juegoActivo ? 'red' : '#ffffffff' }}>Tiempo: {tiempoFormateado}</p>
        <p className="summary-text">✅ Aciertos: {aciertos.length}</p>
        <p className="summary-text">❌ Errores: {errores.length}</p>
        <p className="summary-text">🟡 Pasadas: {pasadas.length}</p>
      </div>

      <div className="Rosco-container">
        <Rosco
          letras={letras}
          letraActual={letraActual}
          aciertos={aciertos}
          errores={errores}
          pasadas={pasadas}
        />
      </div>

      <div className="game-info-controls">
        {jugadorActual && (
          <>
            <h3 style={{ color: '#b9b697ff', margin: '0 0 10px 0' }}>La palabra empieza por: <span style={{ fontSize: '1em', fontWeight: 'bold', color:'rgb(255, 252, 216)'}}>{letraActual.toUpperCase()}</span></h3>
            <p style={{ color: '#fffcd8ff', fontStyle: 'italic', margin: '0 0 15px 0', fontSize: '1.5em' }}>Pista: "{jugadorActual.pista}"</p>
          </>
        )}

        <input
          ref={inputRef}
          type="text"
          value={respuesta}
          onChange={manejarCambio}
          onKeyDown={manejarKeyDown}
          placeholder="Escribe tu respuesta aquí..."
          disabled={!juegoActivo}
          autoFocus
        />

        {sugerencias.length > 0 && juegoActivo && (
          <ul className="sugerencias-lista">
            {sugerencias.map((j, i) => (
              <li
                key={i}
                className={i === sugerenciaResaltada ? 'resaltada' : ''}
                onClick={() => {
                  setRespuesta(j.nombre);
                  setSugerencias([]);
                  setSugerenciaResaltada(-1);
                  if (inputRef.current) inputRef.current.focus();
                  verificarRespuesta(j.nombre);
                }}
              >
                {j.nombre}
              </li>
            ))}
          </ul>
        )}

        <div className="button-container">
          <button onClick={verificar} disabled={!juegoActivo}>
            Responder
          </button>
          <button onClick={pasar} disabled={!juegoActivo}>
            Pasar
          </button>
          <button onClick={reiniciar}>
            Reiniciar
          </button>
        </div>
      </div>
    </div>
  );
}

export default JugadoresEleccion;