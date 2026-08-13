import { NavLink, Route, Routes } from 'react-router-dom';
import AboutPage from './pages/AboutPage';
import ItemsPage from './pages/ItemsPage';

export default function App() {
  return (
    <div className="app-shell">
      <header className="brand-row">
        <h1 className="brand">
          Booster<span>Seat</span>
        </h1>
        <nav className="nav" aria-label="Primary">
          <NavLink to="/" end>
            Items
          </NavLink>
          <NavLink to="/about">About</NavLink>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<ItemsPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>
    </div>
  );
}
