import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Rosco from './Rosco'; // Asegúrate de que Rosco.js esté en la misma carpeta o la ruta correcta

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

  // ESTADO PARA LA DIFICULTAD
  const [dificultadSeleccionada, setDificultadSeleccionada] = useState('medio'); // Por defecto: 'medio'

  // ESTADOS PARA CONTROLAR EL FLUJO DE FIN DE JUEGO
  const [mostrarPantallaFinalizada, setMostrarPantallaFinalizada] = useState(false); // Para la pantalla "Fin del Rosco"
  const [mostrarResultadosFinales, setMostrarResultadosFinales] = useState(false); // Para la pantalla detallada de resultados

  const inputRef = useRef(null);

  // Función para normalizar texto (sin tildes, minúsculas, sin espacios extra)
  const normalizar = useCallback((texto) => {
    if (typeof texto !== 'string') return ''; // Asegura que es un string
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim(); // Elimina espacios al inicio y final
  }, []);

  // Asignar jugador random por letra según la dificultad seleccionada
  const asignarJugadoresRandomInterna = useCallback(() => {
    const asignados = {};
    letras.forEach((letra) => {
      const listaCompleta = jugadores[letra];
      // Filtrar jugadores por la dificultad seleccionada
      const listaFiltradaPorDificultad = listaCompleta.filter(j => j.dificultad === dificultadSeleccionada);

      if (listaFiltradaPorDificultad.length > 0) {
        const indexRandom = Math.floor(Math.random() * listaFiltradaPorDificultad.length);
        asignados[letra] = listaFiltradaPorDificultad[indexRandom];
      } else {
        // Si no hay jugadores para la dificultad seleccionada en esta letra,
        // no se asignará ningún jugador para esa letra.
        // La interfaz ya maneja esto con 'Sin pista'.
      }
    });
    setJugadoresRandom(asignados);
  }, [letras, jugadores, dificultadSeleccionada]); // Ahora depende de dificultadSeleccionada

  // Se ejecuta una vez al montar el componente para asignar jugadores
  useEffect(() => {
    asignarJugadoresRandomInterna();
  }, [asignarJugadoresRandomInterna]); // Depende de la función memoizada

  // Efecto para el temporizador
  useEffect(() => {
    let timer;
    if (juegoActivo && tiempoRestante > 0) {
      timer = setInterval(() => {
        setTiempoRestante((prevTiempo) => {
          if (prevTiempo <= 1) {
            clearInterval(timer);
            setJuegoActivo(false);
            setMostrarPantallaFinalizada(true); // Activa la pantalla intermedia al finalizar el tiempo
            return 0;
          }
          return prevTiempo - 1;
        });
      }, 1000);
    } else if (tiempoRestante === 0 && juegoActivo) { // Asegura que el juego se desactive si el tiempo llega a 0 y aún estaba activo
        setJuegoActivo(false);
        setMostrarPantallaFinalizada(true); // Activa la pantalla intermedia
    }

    return () => clearInterval(timer);
  }, [juegoActivo, tiempoRestante]);

  // Efecto para detectar el final del juego por letras agotadas (Pasapalabra style)
  useEffect(() => {
    // Solo se ejecuta si el juego está iniciado y activo, y no estamos ya en una pantalla final
    if (!juegoIniciado || !juegoActivo || mostrarPantallaFinalizada || mostrarResultadosFinales) {
      return;
    }

    // El juego termina por letras agotadas SÓLO si todas las letras
    // están en aciertos O errores (es decir, no quedan letras 'pasadas' pendientes).
    const letrasCompletadasDefinitivamente = aciertos.length + errores.length;

    if (letrasCompletadasDefinitivamente === letras.length && letras.length > 0) {
      setJuegoActivo(false); // Desactiva el juego
      setLetraActual(null); // Asegura que no haya letra actual
      setMostrarPantallaFinalizada(true); // Activa la pantalla intermedia
    }
  }, [aciertos, errores, letras.length, juegoIniciado, juegoActivo, mostrarPantallaFinalizada, mostrarResultadosFinales]);

  // Efecto para reiniciar el resaltado de sugerencias cuando no hay sugerencias
  useEffect(() => {
    if (sugerencias.length === 0) {
      setSugerenciaResaltada(-1);
    }
  }, [sugerencias]);

  const avanzarLetra = useCallback(() => {
    let indiceActual = letras.indexOf(letraActual);
    let siguienteIndice = (indiceActual + 1) % letras.length;

    let intentos = 0;
    // Busca la siguiente letra que no haya sido acertada ni errada
    while (
      (aciertos.includes(letras[siguienteIndice]) ||
        errores.includes(letras[siguienteIndice])) &&
      intentos < letras.length
    ) {
      siguienteIndice = (siguienteIndice + 1) % letras.length;
      intentos++;
    }

    // Si después de intentar todas las letras, no se encuentra una disponible,
    // significa que todas las letras han sido procesadas.
    if (intentos === letras.length) {
      setLetraActual(null); // No hay letra actual
      return; // Detiene la ejecución de avanzarLetra
    }

    setLetraActual(letras[siguienteIndice]);
    setRespuesta('');
    setSugerencias([]);
    setSugerenciaResaltada(-1);
    if (inputRef.current) {
      inputRef.current.focus(); // Enfoca el input después de avanzar la letra
    }
  }, [letraActual, letras, aciertos, errores]);

  const verificarRespuesta = useCallback((valorRespuesta) => {
    if (!letraActual || !juegoActivo) return;

    if (normalizar(valorRespuesta) === '') {
        return; // No hacer nada si la respuesta está vacía o solo con espacios
    }

    const jugadorCorrecto = jugadoresRandom[letraActual];
    if (!jugadorCorrecto) return; // Si no hay jugador asignado, salir

    const esCorrecto = normalizar(valorRespuesta) === normalizar(jugadorCorrecto.nombre);

    if (esCorrecto) {
      // Solo añadir si no está ya en aciertos
      if (!aciertos.includes(letraActual)) setAciertos((prev) => [...prev, letraActual]);
      // Quitar de pasadas si estaba allí
      if (pasadas.includes(letraActual)) setPasadas((prev) => prev.filter((l) => l !== letraActual));
      // Quitar de errores si estaba allí
      if (errores.includes(letraActual)) setErrores((prev) => prev.filter((l) => l !== letraActual));
    } else {
      // Solo añadir si no está ya en errores
      if (!errores.includes(letraActual)) setErrores((prev) => [...prev, letraActual]);
      // Quitar de pasadas si estaba allí
      if (pasadas.includes(letraActual)) setPasadas((prev) => prev.filter((l) => l !== letraActual));
    }
    setRespuesta('');
    setSugerencias([]);
    setSugerenciaResaltada(-1);
    avanzarLetra();
  }, [letraActual, juegoActivo, jugadoresRandom, normalizar, aciertos, errores, pasadas, avanzarLetra]);

  const verificar = useCallback(() => {
    verificarRespuesta(respuesta);
  }, [respuesta, verificarRespuesta]);

  const pasar = useCallback(() => {
    if (!letraActual || !juegoActivo) return;

    // Solo añadir a pasadas si no ha sido ya acertada, errada o pasada
    if (
      !pasadas.includes(letraActual) &&
      !aciertos.includes(letraActual) &&
      !errores.includes(letraActual)
    ) {
      setPasadas((prev) => [...prev, letraActual]);
    }
    avanzarLetra();
  }, [letraActual, juegoActivo, pasadas, aciertos, errores, avanzarLetra]);

  const manejarCambio = useCallback((e) => { // Usar useCallback
    const valor = e.target.value;
    setRespuesta(valor);

    if (valor.length >= 3 && letraActual) { // Volvemos a 2 para empezar a sugerir
      const listaCompletaDeLetra = jugadores[letraActual] || [];
      // Asegúrate de filtrar por la dificultad seleccionada al buscar sugerencias
      const sugerenciasFiltradas = listaCompletaDeLetra.filter(j =>
        // Aquí puedes ajustar la lógica si 'dificultadSeleccionada' puede ser 'todas' o algo similar
        // Por ahora, asumo que j.dificultad siempre estará presente para los jugadores relevantes.
        j.dificultad === dificultadSeleccionada && normalizar(j.nombre).startsWith(normalizar(valor))
      );
      setSugerencias(sugerenciasFiltradas || []);
    } else {
      setSugerencias([]);
    }
    setSugerenciaResaltada(-1); // Reinicia el resaltado al escribir
  }, [jugadores, letraActual, normalizar, dificultadSeleccionada]);

  const manejarKeyDown = useCallback((e) => { // Usar useCallback
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
          // Verificar la respuesta después de seleccionar una sugerencia
          verificarRespuesta(sugerencias[sugerenciaResaltada].nombre);
        } else {
          verificar(); // Si no hay sugerencia resaltada, verifica la respuesta actual
        }
      }
    } else if (e.key === 'Enter') {
      e.preventDefault(); // Evita el envío del formulario si está dentro de uno
      verificar(); // Si no hay sugerencias, solo verifica la respuesta
    }
  }, [sugerencias, sugerenciaResaltada, verificar, verificarRespuesta, juegoActivo]);

  const iniciarJuego = useCallback(() => { // Usar useCallback
    const tiempoEnSegundos = parseInt(tiempoInput) * 60;
    if (isNaN(tiempoEnSegundos) || tiempoEnSegundos <= 0) {
      alert("Por favor, introduce un tiempo válido en minutos.");
      return;
    }
    // Reiniciar todos los estados para un juego nuevo
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
    asignarJugadoresRandomInterna(); // Asignar nuevos jugadores para el nuevo juego
    setMostrarPantallaFinalizada(false); // Asegura que las pantallas finales estén ocultas
    setMostrarResultadosFinales(false); // Asegura que las pantallas finales estén ocultas

    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [tiempoInput, letras, asignarJugadoresRandomInterna]);

  const reiniciar = useCallback(() => { // Usar useCallback
    setJuegoActivo(false);
    setJuegoIniciado(false);
    setTiempoRestante(0); // Reinicia el tiempo
    setTiempoInput('3'); // Vuelve al valor por defecto
    setLetraActual(letras[0]); // Vuelve a la primera letra
    setRespuesta('');
    setAciertos([]);
    setErrores([]);
    setPasadas([]);
    setSugerencias([]);
    setSugerenciaResaltada(-1);
    setDificultadSeleccionada('medio'); // Reinicia la dificultad a 'medio'
    asignarJugadoresRandomInterna(); // Reasigna jugadores para un nuevo juego
    setMostrarPantallaFinalizada(false); // Oculta la pantalla intermedia
    setMostrarResultadosFinales(false); // Oculta los resultados finales
  }, [letras, asignarJugadoresRandomInterna]);

  // Función para pasar de la pantalla "FIN DEL ROSCO" a los resultados
  const verResultados = useCallback(() => {
    setMostrarPantallaFinalizada(false); // Oculta la pantalla "Fin del Rosco"
    setMostrarResultadosFinales(true);   // Muestra la pantalla de resultados detallados
  }, []);

  const tiempoFormateado = `${Math.floor(tiempoRestante / 60).toString().padStart(2, '0')}:${(tiempoRestante % 60).toString().padStart(2, '0')}`;

  // Lógica de renderizado condicional
  // El orden de los 'if' es crucial para qué pantalla se muestra
  // -----------------------------------------------------------

  // 1. Mostrar la pantalla de RESULTADOS FINALES DETALLADOS
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
                  {letra.toUpperCase()}: {jugadoresRandom[letra]?.nombre || 'Sin respuesta'}
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
                  {letra.toUpperCase()}: {jugadoresRandom[letra]?.nombre || 'Sin respuesta'}
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

  // 2. Mostrar la pantalla INTERMEDIA "FIN DEL ROSCO"
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

  // 3. Mostrar la pantalla de INICIO/CONFIGURACIÓN (si el juego no ha iniciado)
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

  // 4. Si ninguna de las condiciones anteriores es verdadera, significa que el JUEGO ESTÁ ACTIVO
  const jugadorActual = jugadoresRandom[letraActual];
  return (
    <div className="App"> {/* Usa la clase .App para el contenedor principal */}
      {/* Información del juego: Tiempo, Aciertos, Errores, Pasadas */}
      <div className="game-controls" style={{ justifyContent: 'space-around', marginBottom: '10px' }}>
        <p className="summary-text" style={{ color: tiempoRestante <= 20 && juegoActivo ? 'red' : '#ffffffff' }}>Tiempo: {tiempoFormateado}</p>
        <p className="summary-text">✅ Aciertos: {aciertos.length}</p>
        <p className="summary-text">❌ Errores: {errores.length}</p>
        <p className="summary-text">🟡 Pasadas: {pasadas.length}</p>
      </div>

      {/* Rosco y Controles del Juego */}
      <div className="Rosco-container"> {/* Contenedor para el Rosco */}
        <Rosco
          letras={letras}
          letraActual={letraActual}
          aciertos={aciertos}
          errores={errores}
          pasadas={pasadas}
        />
      </div>

      {/* Contenedor de la Información y Controles */}
      <div className="game-info-controls">
        {jugadorActual && (
          <>
            <h3 style={{ color: '#b9b697ff', margin: '0 0 10px 0' }}>La palabra empieza por: <span style={{ fontSize: '1em', fontWeight: 'bold' }}>{letraActual.toUpperCase()}</span></h3>
            <p style={{ color: '#b9b697ff', fontStyle: 'italic', margin: '0 0 15px 0', fontSize: '1.5em' }}>Pista: "{jugadorActual.pista}"</p>
          </>
        )}
        {/* Si no hay jugador asignado para la letra con la dificultad seleccionada, se mostrará "Sin pista" */}

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
                  verificarRespuesta(j.nombre); // Verificar al seleccionar una sugerencia
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