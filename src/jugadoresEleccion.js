import React, { useState, useEffect, useCallback, useMemo } from 'react'; // Eliminado useRef 
import Rosco from './Rosco';

function JugadoresEleccion({ jugadores, onStart, externalControl, isExternalPlaying, gameConfig, onFinish }) {
  const letras = useMemo(() => Object.keys(jugadores || {}).sort(), [jugadores]);
  const todosLosJugadores = useMemo(() => Object.values(jugadores || {}).flat(), [jugadores]);

  const [jugadoresRandom, setJugadoresRandom] = useState({});
  const [letraActual, setLetraActual] = useState(letras[0]);
  const [respuesta, setRespuesta] = useState('');
  const [aciertos, setAciertos] = useState([]);
  const [errores, setErrores] = useState([]);
  const [pasadas, setPasadas] = useState([]); // Estado para letras en amarillo 
  const [sugerencias, setSugerencias] = useState([]);
  const [pasando, setPasando] = useState(false);
  
  const [tiempoRestante, setTiempoRestante] = useState(0);
  const [juegoActivo, setJuegoActivo] = useState(false);
  const [tiempoInput, setTiempoInput] = useState('3');
  const [dificultadSeleccionada, setDificultadSeleccionada] = useState('medio');

  // Lógica de Sugerencias (Autocomplete)
  useEffect(() => {
    if (respuesta.length >= 3) {
      const filtrados = todosLosJugadores.filter(j => 
        j.nombre.toLowerCase().includes(respuesta.toLowerCase())
      ).slice(0, 5); // Limitamos a 5 sugerencias
      setSugerencias(filtrados);
    } else {
      setSugerencias([]);
    }
  }, [respuesta, todosLosJugadores]);

  const normalizar = (texto) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

  const asignarJugadores = useCallback(() => {
    const asignados = {};
    letras.forEach((letra) => {
      const lista = jugadores[letra] || [];
      const filtrados = lista.filter(j => j.dificultad === dificultadSeleccionada);
      asignados[letra] = filtrados.length > 0 
        ? filtrados[Math.floor(Math.random() * filtrados.length)] 
        : lista[0];
    });
    setJugadoresRandom(asignados);
  }, [letras, jugadores, dificultadSeleccionada]);

  useEffect(() => {
    if (isExternalPlaying && gameConfig) {
      setTiempoRestante(parseInt(gameConfig.tiempo) * 60);
      setDificultadSeleccionada(gameConfig.dificultad);
      setJuegoActivo(true);
      asignarJugadores();
    }
  }, [isExternalPlaying, gameConfig, asignarJugadores]);

const finalizarJuego = useCallback(() => {
    setJuegoActivo(false);
    
    // Unificamos errores explícitos y letras que quedaron sin responder (pendientes)
    const todasLasFaltantes = [
      ...errores,
      ...letras.filter(l => !aciertos.includes(l) && !errores.includes(l))
    ];

    // Usamos un Set para garantizar que cada letra aparezca una sola vez en el resumen final
    const erroresUnicos = [...new Set(todasLasFaltantes)];

    onFinish({
      aciertos: aciertos.length,
      errores: erroresUnicos,
      jugadoresAsignados: jugadoresRandom
    });
  }, [aciertos, errores, letras, jugadoresRandom, onFinish]);

  // useEffect con dependencia corregida para ESLint
  useEffect(() => {
    let timer;
    if (juegoActivo && tiempoRestante > 0) {
      timer = setInterval(() => setTiempoRestante(prev => prev - 1), 1000);
    } else if (tiempoRestante === 0 && juegoActivo) {
      finalizarJuego();
    }
    return () => clearInterval(timer);
  }, [juegoActivo, tiempoRestante, finalizarJuego]); // Agregado finalizarJuego para estabilidad técnica

const avanzar = useCallback(() => {
    setPasando(true);

    // Agregamos la letra actual a pasadas si no ha sido resuelta 
    if (!aciertos.includes(letraActual) && !errores.includes(letraActual)) {
      setPasadas(prev => prev.includes(letraActual) ? prev : [...prev, letraActual]);
    }

    let idx = letras.indexOf(letraActual);
    let next = (idx + 1) % letras.length;
    let vueltas = 0;

    while ((aciertos.includes(letras[next]) || errores.includes(letras[next])) && vueltas < letras.length) {
      next = (next + 1) % letras.length;
      vueltas++;
    }

    if (vueltas === letras.length) {
      finalizarJuego();
    } else {
      setTimeout(() => {
        setLetraActual(letras[next]);
        setRespuesta('');
        setPasando(false);
      }, 200);
    }
  }, [letraActual, letras, aciertos, errores, finalizarJuego]);

  const verificar = (valorOpcional) => {
    const r = valorOpcional || respuesta;
    const correcto = jugadoresRandom[letraActual];
    const resNorm = normalizar(r);
    
    // Si responde, removemos la letra de "pasadas" 
    setPasadas(prev => prev.filter(l => l !== letraActual));

    if (resNorm === normalizar(correcto.nombre) || correcto.nombreSecundario?.some(a => normalizar(a) === resNorm)) {
      setAciertos(prev => [...prev, letraActual]);
    } else {
      setErrores(prev => [...prev, letraActual]);
    }
    setSugerencias([]);
    avanzar();
  };

  if (externalControl && !isExternalPlaying) {
    return (
      <div className="setup-controls">
        <label>Tiempo de juego (minutos):</label>
        <input className="input-game" type="number" value={tiempoInput} onChange={e => setTiempoInput(e.target.value)} />
        <label>Nivel de los jugadores:</label>
        <select className="input-game" value={dificultadSeleccionada} onChange={e => setDificultadSeleccionada(e.target.value)}>
          <option value="medio">Clásicos y Estrellas (Medio)</option>
          <option value="dificil">Solo para Expertos (Difícil)</option>
        </select>
        <button className="btn-game" onClick={() => onStart({ tiempo: tiempoInput, dificultad: dificultadSeleccionada })}>
          ¡Empezar a Jugar!
        </button>
      </div>
    );
  }

  return (
    <div className="rosco-layout">
      <div className="game-status-grid">
        <div className="stat-box">Reloj: {Math.floor(tiempoRestante / 60)}:{(tiempoRestante % 60).toString().padStart(2, '0')}</div>
        <div className="stat-box success">Bien: {aciertos.length}</div>
        <div className="stat-box danger">Mal: {errores.length}</div>
      </div>

      <div className="rosco-wrapper">
        <Rosco 
          letras={letras} 
          letraActual={letraActual} 
          aciertos={aciertos} 
          errores={errores} 
          pasadas={pasadas} // Inyección de prop necesaria para el color amarillo y evitar el crash
        />
      </div>

      <div className="pista-container">
        <p className="pista-text">{jugadoresRandom[letraActual]?.pista}</p>
        <div style={{ position: 'relative' }}>
          <input 
            className="input-game" 
            value={respuesta} 
            onChange={e => setRespuesta(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && verificar()}
            placeholder="Escribe el nombre aquí..."
            autoFocus 
          />
          {sugerencias.length > 0 && (
            <ul className="sugerencias-lista">
              {sugerencias.map(s => (
                <li key={s.nombre} className="sugerencia-item" onClick={() => verificar(s.nombre)}>
                  {s.nombre}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="actions">
          <button className="btn-game" onClick={() => verificar()}>Responder</button>
          <button
  className={`btn-game pass ${pasando ? 'active' : ''}`}
  onClick={avanzar}
>
  Pasapalabra
</button>
        </div>
      </div>
    </div>
  );
}

export default JugadoresEleccion;