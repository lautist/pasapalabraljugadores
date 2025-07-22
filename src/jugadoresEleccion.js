import React, { useState, useEffect, useRef } from 'react';
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
  const [sugerenciaResaltada, setSugerenciaResaltada] = useState(-1);

  // Estados para el temporizador y el inicio del juego
  // const [TIEMPO_TOTAL, setTIEMPO_TOTAL] = useState(0); // ELIMINADO: No es necesario un estado para esto
  const [tiempoRestante, setTiempoRestante] = useState(0);
  const [juegoActivo, setJuegoActivo] = useState(false);
  const [juegoIniciado, setJuegoIniciado] = useState(false);
  const [tiempoInput, setTiempoInput] = useState('3');

  const inputRef = useRef(null);

  // Asignar jugador random por letra
  // Esta función ahora se moverá su llamada dentro del useEffect inicial
  const asignarJugadoresRandomInterna = () => { // Renombrada para evitar confusión, aunque es local
    const asignados = {};
    letras.forEach((letra) => {
      const lista = jugadores[letra];
      const indexRandom = Math.floor(Math.random() * lista.length);
      asignados[letra] = lista[indexRandom];
    });
    setJugadoresRandom(asignados);
  };

  // Corrección 1: Dependencia de useEffect
  // La función asignarJugadoresRandomInterna se llamará aquí directamente.
  useEffect(() => {
    asignarJugadoresRandomInterna(); // Llamada directa
    // Las demás inicializaciones de estado ya se manejan en iniciarJuego o reiniciar
    // setLetraActual(letras[0]); // Esto se maneja mejor en iniciarJuego o reiniciar
    // setRespuesta('');
    // setAciertos([]);
    // setErrores([]);
    // setPasadas([]);
    // setSugerencias([]);
  }, []); // Dependencias vacías, solo se ejecuta una vez al montar

  // Timer useEffect
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
  }, [juegoActivo, tiempoRestante]); // Dependencias correctas

  // Restablecer sugerenciaResaltada cuando las sugerencias cambian o se ocultan
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
    // Corrección 2: Eliminado setTIEMPO_TOTAL, usamos tiempoEnSegundos directamente
    setTiempoRestante(tiempoEnSegundos);
    asignarJugadoresRandomInterna(); // Se llama aquí también para cada inicio de juego
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
    // setTIEMPO_TOTAL(0); // ELIMINADO
    setTiempoInput('3');
    setLetraActual(letras[0]);
    setRespuesta('');
    setAciertos([]);
    setErrores([]);
    setPasadas([]);
    setSugerencias([]);
    setSugerenciaResaltada(-1);
    asignarJugadoresRandomInterna(); // Se llama aquí también para cada reinicio
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
      <div style={{ textAlign: 'center' }}>
        <h2>¡Juego terminado!</h2>
        <p>✅ Aciertos: {aciertos.length}</p>
        <p>❌ Errores: {errores.length}</p>

        {errores.length > 0 && (
          <>
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
          </>
        )}

        {noRespondidas.length > 0 && (
          <>
            <h3>Respuestas correctas que no llegaste a responder:</h3>
            <ul style={{ maxWidth: 400, margin: '0 auto', listStyle: 'none', padding: 0 }}>
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
      <div style={{ textAlign: 'center', fontFamily: 'Arial', marginTop: 50 }}>
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
        justifyContent: 'center',
        alignItems: 'flex-start',
        fontFamily: 'Arial',
        padding: '20px',
        gap: '40px'
      }}
    >
      {/* Contenedor del Rosco (izquierda) */}
      <div style={{ flexShrink: 0 }}>
        <Rosco
          letras={letras}
          letraActual={letraActual}
          aciertos={aciertos}
          errores={errores}
          pasadas={pasadas}
        />
      </div>

      {/* Contenedor de la Información del Juego (derecha) */}
      <div style={{ flexGrow: 1, textAlign: 'left', maxWidth: '400px' }}>
        <div style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10, color: tiempoRestante <= 10 ? 'red' : 'inherit' }}>
          Tiempo: {tiempoFormateado}
        </div>

        <h2>Letra: {letraActual.toUpperCase()}</h2>
        <p>
          <strong>Pista:</strong> {jugadorActual?.pista || 'Sin pista'}
        </p>

        {/* Input y luego las sugerencias */}
        <input
          ref={inputRef}
          type="text"
          value={respuesta}
          onChange={manejarCambio}
          onKeyDown={manejarKeyDown}
          placeholder="Escribí el jugador"
          autoComplete="off"
          style={{ padding: 10, fontSize: 16, marginTop: 10, width: 'calc(100% - 20px)' }}
          disabled={!juegoActivo}
        />

        {sugerencias.length > 0 && juegoActivo && (
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              maxWidth: 300,
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

        <div style={{ marginTop: '15px' }}>
          <button
            onClick={verificar}
            style={{ margin: '5px', padding: '10px', minWidth: '100px' }}
            disabled={!juegoActivo}
          >
            Responder
          </button>
          <button
            onClick={pasar}
            style={{ margin: '5px', padding: '10px', minWidth: '100px' }}
            disabled={!juegoActivo}
          >
            Pasar
          </button>
          <button
            onClick={reiniciar}
            style={{ margin: '5px', padding: '10px', backgroundColor: '#264653', color: '#fff', minWidth: '100px' }}
          >
            Reiniciar
          </button>
        </div>

        <div style={{ marginTop: 20 }}>
          <p>✅ Aciertos: {aciertos.length}</p>
          <p>❌ Errores: {errores.length}</p>
          <p>🟡 Pasadas: {pasadas.length}</p>
          <p>🔄 Letras totales: {letras.length}</p>
        </div>
      </div>
    </div>
  );
}

export default JugadoresEleccion;