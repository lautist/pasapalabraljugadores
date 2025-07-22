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

  // NUEVOS ESTADOS PARA CONTROLAR EL FLUJO DE FIN DE JUEGO
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

  // Asignar jugador random por letra al inicio del juego
  const asignarJugadoresRandomInterna = useCallback(() => {
    const asignados = {};
    letras.forEach((letra) => {
      const lista = jugadores[letra];
      if (lista && lista.length > 0) {
        const indexRandom = Math.floor(Math.random() * lista.length);
        asignados[letra] = lista[indexRandom];
      }
    });
    setJugadoresRandom(asignados);
  }, [letras, jugadores]);

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

  // Nuevo useEffect para detectar el final del juego por letras agotadas
  useEffect(() => {
    // Solo se ejecuta si el juego está iniciado y activo, y no estamos ya en una pantalla final
    if (!juegoIniciado || !juegoActivo || mostrarPantallaFinalizada || mostrarResultadosFinales) {
      return;
    }

     const letrasCompletadasDefinitivamente = aciertos.length + errores.length;

    // Si todas las letras han sido respondidas o pasadas
    if (letrasCompletadasDefinitivamente === letras.length && letras.length > 0) {
      setJuegoActivo(false); // Desactiva el juego
      setLetraActual(null); // Asegura que no haya letra actual
      setMostrarPantallaFinalizada(true); // Activa la pantalla intermedia
    }
  }, [aciertos, errores, pasadas, letras.length, juegoIniciado, juegoActivo, mostrarPantallaFinalizada, mostrarResultadosFinales]);

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

    if (valor.length >= 2) { // Generalmente 2 o 3 caracteres para empezar a sugerir
      const sugerenciasFiltradas = jugadores[letraActual]?.filter((j) =>
        normalizar(j.nombre).startsWith(normalizar(valor))
      );
      setSugerencias(sugerenciasFiltradas || []);
    } else {
      setSugerencias([]);
    }
    setSugerenciaResaltada(-1); // Reinicia el resaltado al escribir
  }, [jugadores, letraActual, normalizar]);


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
    asignarJugadoresRandomInterna(); // Reasigna jugadores para un nuevo juego
    setMostrarPantallaFinalizada(false); // Oculta la pantalla intermedia
    setMostrarResultadosFinales(false); // Oculta los resultados finales
  }, [letras, asignarJugadoresRandomInterna]);


  // NUEVA FUNCIÓN PARA PASAR DE LA PANTALLA "FIN DEL ROSCO" A LOS RESULTADOS
  const verResultados = useCallback(() => { // Corregida a 'verResultados'
    setMostrarPantallaFinalizada(false); // Oculta la pantalla "Fin del Rosco"
    setMostrarResultadosFinales(true);   // Muestra la pantalla de resultados detallados
  }, []);


  const minutos = Math.floor(tiempoRestante / 60);
  const segundos = tiempoRestante % 60;
  const tiempoFormateado = `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;

  // Lógica de renderizado condicional
  // El orden de los 'if' es crucial para qué pantalla se muestra
  // -----------------------------------------------------------

  // 1. Mostrar la pantalla de RESULTADOS FINALES DETALLADOS
  if (mostrarResultadosFinales) { // <<-- ¡CORREGIDO! 'R' en 'Resultados' es mayúscula
    const noRespondidas = letras.filter(
      (l) => !aciertos.includes(l) && !errores.includes(l)
    );

    return (
      <div style={{ textAlign: 'center', padding: '10px' }}>
        <h2>¡Resultados del Rosco!</h2>
        <p>✅ Aciertos: {aciertos.length}</p>
        <p>❌ Errores: {errores.length}</p>

        {errores.length > 0 && (
          <>
            <h3>Respuestas correctas que erraste:</h3>
            <ul style={{ maxWidth: '90%', margin: '0 auto', listStyle: 'none', padding: 0 }}>
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
            <ul style={{ maxWidth: '90%', margin: '0 auto', listStyle: 'none', padding: 0 }}>
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
          Reiniciar Juego
        </button>
      </div>
    );
  }

  // 2. Mostrar la pantalla INTERMEDIA "FIN DEL ROSCO"
  if (mostrarPantallaFinalizada) {
    return (
      <div style={{ textAlign: 'center', fontFamily: 'Arial', marginTop: 50, padding: '10px' }}>
        <h2>¡Fin del Rosco!</h2>
        <p>El tiempo ha terminado o todas las letras han sido completadas.</p>
        <div style={{ marginTop: 20 }}>
          <button
            onClick={verResultados} // <<-- ¡CORREGIDO! 'R' en 'Resultados' es mayúscula
            style={{ padding: '15px 30px', fontSize: 20, cursor: 'pointer', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: 5, marginRight: '10px' }}
          >
            Ver Resultados
          </button>
          <button
            onClick={reiniciar}
            style={{ padding: '15px 30px', fontSize: 20, cursor: 'pointer', backgroundColor: '#264653', color: 'white', border: 'none', borderRadius: 5 }}
          >
            Reiniciar Juego
          </button>
        </div>
      </div>
    );
  }

  // 3. Mostrar la pantalla de INICIO/CONFIGURACIÓN (si el juego no ha iniciado)
  if (!juegoIniciado) {
    return (
      <div style={{ textAlign: 'center', fontFamily: 'Arial', marginTop: 50, padding: '10px' }}>
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

  // 4. Si ninguna de las condiciones anteriores es verdadera, significa que el JUEGO ESTÁ ACTIVO
  const jugadorActual = jugadoresRandom[letraActual];

  return (
    <div style={{ textAlign: 'center', padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: 'calc(100vh - 40px)' }}>
      {/* Información del juego: Tiempo, Aciertos, Errores, Pasadas */}
      <div style={{ marginBottom: '10px', width: '100%', display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: '5px' }}>
        <p style={{ fontSize: '1.2em', margin: 0, color: tiempoRestante <= 10 && juegoActivo ? 'red' : 'inherit' }}>Tiempo: {tiempoFormateado}</p>
        <p style={{ fontSize: '1.2em', margin: 0 }}>✅ Aciertos: {aciertos.length}</p>
        <p style={{ fontSize: '1.2em', margin: 0 }}>❌ Errores: {errores.length}</p>
        <p style={{ fontSize: '1.2em', margin: 0 }}>🟡 Pasadas: {pasadas.length}</p>
      </div>

      {/* Rosco y Controles del Juego */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', width: '100%', maxWidth: '900px', gap: '20px' }}>
        {/* Contenedor del Rosco */}
        <div style={{ flexShrink: 0, width: '100%', display: 'flex', justifyContent: 'center' }}>
          <Rosco
            letras={letras}
            letraActual={letraActual}
            aciertos={aciertos}
            errores={errores}
            pasadas={pasadas}
          />
        </div>

        {/* Contenedor de la Información y Controles */}
        <div style={{ flexGrow: 1, textAlign: 'center', maxWidth: '600px', width: '100%', padding: '15px', border: '1px solid #ccc', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          {jugadorActual && (
            <>
              <h3 style={{ margin: '0 0 10px 0' }}>La palabra empieza por: <span style={{ fontSize: '1.5em', fontWeight: 'bold' }}>{letraActual.toUpperCase()}</span></h3>
              <p style={{ fontSize: '1.1em', fontStyle: 'italic', margin: '0 0 15px 0' }}>Pista: "{jugadorActual.pista}"</p>
            </>
          )}

          <input
            ref={inputRef}
            type="text"
            value={respuesta}
            onChange={manejarCambio}
            onKeyDown={manejarKeyDown}
            placeholder="Escribe tu respuesta aquí..."
            style={{
              width: 'calc(100% - 20px)',
              padding: '10px',
              fontSize: '1em',
              borderRadius: '5px',
              border: '1px solid #ddd',
              marginBottom: '10px'
            }}
            disabled={!juegoActivo}
            autoFocus
          />

          {sugerencias.length > 0 && juegoActivo && (
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: '0 auto 10px auto',
                maxHeight: '150px',
                overflowY: 'auto',
                border: '1px solid #eee',
                borderRadius: '4px',
                backgroundColor: 'white',
                maxWidth: '300px', // Limitar el ancho de las sugerencias
                textAlign: 'left' // Alineado a la izquierda para las sugerencias
              }}
            >
              {sugerencias.map((j, i) => (
                <li
                  key={i}
                  onClick={() => {
                    setRespuesta(j.nombre);
                    setSugerencias([]);
                    setSugerenciaResaltada(-1);
                    if (inputRef.current) inputRef.current.focus();
                    verificarRespuesta(j.nombre); // Verificar al seleccionar una sugerencia
                  }}
                  style={{
                    padding: '8px',
                    borderBottom: '1px solid #eee',
                    cursor: 'pointer',
                    backgroundColor: i === sugerenciaResaltada ? '#e0e0e0' : 'white',
                  }}
                >
                  {j.nombre}
                </li>
              ))}
            </ul>
          )}

          <div style={{ marginTop: '15px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px' }}>
            <button
              onClick={verificar}
              style={{ padding: '10px', minWidth: '100px', flexGrow: 1 }}
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
        </div>
      </div>
    </div>
  );
}

export default JugadoresEleccion;