import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import RestaurantList from './pages/RestaurantList';
import RestaurantCreate from './pages/RestaurantCreate';
import GroupOrderCreate from './pages/GroupOrderCreate';
import GroupOrderView from './pages/GroupOrderView';
import OrderPage from './pages/OrderPage';

// 舊版相容（逐步移除）
import MenuCreate from './pages/MenuCreate';
import SessionCreate from './pages/SessionCreate';
import Order from './pages/Order';
import Organizer from './pages/Organizer';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 新版路由 */}
        <Route path="/" element={<Home />} />
        <Route path="/restaurants" element={<RestaurantList />} />
        <Route path="/restaurant/new" element={<RestaurantCreate />} />
        <Route path="/group-order/new" element={<GroupOrderCreate />} />
        <Route path="/group-order/:orderId" element={<GroupOrderView />} />
        <Route path="/order/:orderId" element={<OrderPage />} />

        {/* 舊版路由（向後相容） */}
        <Route path="/menu/new" element={<MenuCreate />} />
        <Route path="/session/new" element={<SessionCreate />} />
        <Route path="/order-old/:sessionId" element={<Order />} />
        <Route path="/organizer/:sessionId" element={<Organizer />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
