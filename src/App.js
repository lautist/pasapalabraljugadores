import './App.css';
import Juego from './jugadoresEleccion';
import jugadores from './jugadores.json';



function App() {
  return (
    <div >
     <Juego jugadores={jugadores}/>
    </div>
  );
}

export default App;
