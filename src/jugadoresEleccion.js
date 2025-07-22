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

  // Estados para el temporizador y el inicio del juego
  const [TIEMPO_TOTAL, setTIEMPO_TOTAL] = useState(0); // Se inicializará con el input del usuario
  const [tiempoRestante, setTiempoRestante] = useState(0);
  const [juegoActivo, setJuegoActivo] = useState(false); // Controla si el juego está en curso
  const [juegoIniciado, setJuegoIniciado] = useState(false); // Controla si el juego ha comenzado la primera vez
  const [tiempoInput, setTiempoInput] = useState('3'); // Valor por defecto para el input de tiempo en minutos

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
    asignarJugadoresRandom(); // Asigna jugadores al cargar el componente
  }, []);

  // Timer useEffect
  useEffect(() => {
    let timer;
    if (juegoActivo && tiempoRestante > 0) {
      timer = setInterval(() => {
        setTiempoRestante((prevTiempo) => {
          if (prevTiempo <= 1) {
            clearInterval(timer);
            setJuegoActivo(false); // Termina el juego cuando el temporizador llega a 0
            return 0;
          }
          return prevTiempo - 1;
        });
      }, 1000);
    } else if (tiempoRestante === 0 && juegoActivo) {
        setJuegoActivo(false); // Asegurarse de que el juego se desactive si el tiempo llega a 0
    }

    return () => clearInterval(timer);
  }, [juegoActivo, tiempoRestante]);

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
    } else {
      setSugerencias([]);
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
      setJuegoActivo(false); // Terminar juego si no hay más letras por responder
      return;
    }

    setLetraActual(letras[siguienteIndice]);
    setRespuesta('');
    setSugerencias([]);
  };

  const verificarRespuesta = (valorRespuesta) => { // Función unificada para verificación
    if (!letraActual || !juegoActivo) return;

    const jugadorCorrecto = jugadoresRandom[letraActual];
    if (!jugadorCorrecto) return;

    const esCorrecto = normalizar(valorRespuesta) === normalizar(jugadorCorrecto.nombre);

    if (esCorrecto) {
      if (!aciertos.includes(letraActual)) setAciertos([...aciertos, letraActual]);
      // Si la letra estaba en errores o pasadas, se remueve
      if (pasadas.includes(letraActual))
        setPasadas(pasadas.filter((l) => l !== letraActual));
      if (errores.includes(letraActual))
        setErrores(errores.filter((l) => l !== letraActual));
    } else {
      if (!errores.includes(letraActual)) setErrores([...errores, letraActual]);
      // Si se equivoca, y estaba en pasadas, se remueve de pasadas
      if (pasadas.includes(letraActual))
          setPasadas(pasadas.filter((l) => l !== letraActual));
    }

    setRespuesta(''); // Limpiar el input
    setSugerencias([]); // Limpiar sugerencias
    avanzarLetra(); // Mover a la siguiente letra
  };

  const verificar = () => { // Usado para el botón 'Responder' y Enter
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
    setTIEMPO_TOTAL(tiempoEnSegundos);
    setTiempoRestante(tiempoEnSegundos);
    asignarJugadoresRandom();
    setLetraActual(letras[0]);
    setRespuesta('');
    setAciertos([]);
    setErrores([]);
    setPasadas([]);
    setSugerencias([]);
    setJuegoActivo(true);
    setJuegoIniciado(true);
  };

  const reiniciar = () => {
    setJuegoActivo(false);
    setJuegoIniciado(false);
    setTiempoRestante(0);
    setTIEMPO_TOTAL(0);
    setTiempoInput('3');
    setLetraActual(letras[0]);
    setRespuesta('');
    setAciertos([]);
    setErrores([]);
    setPasadas([]);
    setSugerencias([]);
    asignarJugadoresRandom();
  };

  const juegoCompletadoPorRespuestas = letras.every(
    (l) => aciertos.includes(l) || errores.includes(l)
  );

  const juegoTerminado = !juegoActivo && juegoIniciado; // El juego termina si no está activo y ya se inició

  // Manejar tecla Enter en el input para enviar respuesta
  const manejarKeyDown = (e) => {
    if (e.key === 'Enter' && juegoActivo) {
      e.preventDefault();
      verificar();
    }
  };

  // Formatear tiempo para mostrar
  const minutos = Math.floor(tiempoRestante / 60);
  const segundos = tiempoRestante % 60;
  const tiempoFormateado = `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;


  if (juegoTerminado) {
    // Las letras no respondidas son las que no están en aciertos ni en errores
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
                    backgroundColor: '#f4a261', // Color para no respondidas
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

  // Si el juego no ha iniciado, muestra la configuración inicial
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
    <div style={{ textAlign: 'center', fontFamily: 'Arial' }}>
      <Rosco
        letras={letras}
        letraActual={letraActual}
        aciertos={aciertos}
        errores={errores}
        pasadas={pasadas}
        // onClickLetra ya no se pasa
      />

      <div style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10, color: tiempoRestante <= 10 ? 'red' : 'inherit' }}>
        Tiempo: {tiempoFormateado}
      </div>

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
        disabled={!juegoActivo}
      />

      <div>
        <button
          onClick={verificar}
          style={{ margin: 5, padding: 10 }}
          disabled={!juegoActivo}
        >
          Responder
        </button>
        <button
          onClick={pasar}
          style={{ margin: 5, padding: 10 }}
          disabled={!juegoActivo}
        >
          Pasar
        </button>
        <button
          onClick={reiniciar}
          style={{ margin: 5, padding: 10, backgroundColor: '#264653', color: '#fff' }}
        >
          Reiniciar
        </button>
      </div>

      {sugerencias.length > 0 && juegoActivo && (
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            maxWidth: 300,
            margin: '10px auto',
            cursor: 'pointer',
            border: '1px solid #ccc',
            borderRadius: '4px',
            maxHeight: '150px',
            overflowY: 'auto',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
          }}
        >
          {sugerencias.map((j, i) => (
            <li
              key={i}
              onClick={() => {
                setRespuesta(j.nombre); // Pone el nombre en el input
                setSugerencias([]); // Limpia las sugerencias
                verificarRespuesta(j.nombre); // Llama a verificar con el nombre sugerido
              }}
              style={{ background: '#f9f9f9', margin: '2px 0', padding: '8px', borderBottom: '1px solid #eee' }}
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