import './App.css';
import Juego from './jugadoresEleccion';
import jugadores from './jugadores.json';



function App() {
  return (
    <div className="App">
     <h1>Pasapalabra Futbol</h1>
     <Juego jugadores={jugadores}/>
    </div>
  );
}

export default App;
