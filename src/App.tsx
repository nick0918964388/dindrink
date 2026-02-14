import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import MenuCreate from './pages/MenuCreate';
import SessionCreate from './pages/SessionCreate';
import Order from './pages/Order';
import Organizer from './pages/Organizer';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/menu/new" element={<MenuCreate />} />
        <Route path="/session/new" element={<SessionCreate />} />
        <Route path="/order/:sessionId" element={<Order />} />
        <Route path="/organizer/:sessionId" element={<Organizer />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
