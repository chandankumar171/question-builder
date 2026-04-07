import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { BookOpen, PlusCircle, Upload, Home } from 'lucide-react';
import './Layout.css';

export default function Layout() {
  const navigate = useNavigate();

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="nav-brand" onClick={() => navigate('/')}>
          <div className="nav-logo">
            <BookOpen size={22} />
          </div>
          <span className="nav-title">QuestionCraft</span>
        </div>
        <div className="nav-links">
          <NavLink to="/" end className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
            <Home size={16} /> <span>Sets</span>
          </NavLink>
          <NavLink to="/builder" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
            <PlusCircle size={16} /> <span>Builder</span>
          </NavLink>
          <NavLink to="/import" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
            <Upload size={16} /> <span>Import Excel</span>
          </NavLink>
        </div>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}