import React, { useState } from 'react';
import './App.css';
import JugadoresEleccion from './jugadoresEleccion';
import jugadoresData from './jugadores.json';

function App() {
  const [gameState, setGameState] = useState('INICIO'); 
  const [config, setConfig] = useState({ tiempo: '3', dificultad: 'medio' });
  const [resumenFinal, setResumenFinal] = useState({ aciertos: 0, errores: [], jugadoresAsignados: {} });

  return (
    <div className="App">
      <header className="game-header">
        <h1 className="game-title">Pasapalabra <span className="accent-text">Fútbol</span></h1>
      </header>

      <main className="game-content">
        {gameState === 'INICIO' && (
          <section className="setup-screen animated">
            <h2>Configuración del Juego</h2>
            <p className="text-help">Personaliza tu partida antes de empezar.</p>
            <JugadoresEleccion 
              jugadores={jugadoresData}
              externalControl={true}
              onStart={(gameConfig) => {
                setConfig(gameConfig);
                setGameState('JUGANDO');
              }} 
            />
          </section>
        )}

        {gameState === 'JUGANDO' && (
          <section className="game-active animated">
            <JugadoresEleccion 
              jugadores={jugadoresData}
              gameConfig={config} 
              isExternalPlaying={true}
              onFinish={(stats) => {
                setResumenFinal(stats);
                setGameState('FINALIZADO');
              }} 
            />
          </section>
        )}

        {gameState === 'FINALIZADO' && (
          <section className="results-screen animated">
            <h2>¡Juego Terminado!</h2>
            <div className="final-stats">
              <p className="big-score">Aciertos: {resumenFinal.aciertos}</p>
              {resumenFinal.errores.length > 0 && (
                <div className="missed-answers">
                  <h3>Repasemos las que faltaron:</h3>
                  <ul className="error-list">
                    {resumenFinal.errores.map((letra, index) => (
                      <li key={`error-${letra}-${index}`}>
                        <strong>{letra}:</strong> {resumenFinal.jugadoresAsignados[letra]?.nombre}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <button className="btn-game" onClick={() => setGameState('INICIO')}>
              Jugar de Nuevo
            </button>
          </section>
        )}
      </main>
      
      <footer className="game-footer">
        <p>Desarrollado por Lautaro Stefanini | 2026</p>
      </footer>
    </div>
  );
}

export default App;