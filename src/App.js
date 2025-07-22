import './App.css';
import Juego from './jugadoresEleccion';
import jugadores from './jugadores.json';



function App() {
  return (
    <div className="App">
     <Juego jugadores={jugadores}/>
    </div>
  );
}

export default App;
