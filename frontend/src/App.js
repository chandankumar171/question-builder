import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import BuilderPage from './pages/BuilderPage';
import PreviewPage from './pages/PreviewPage';
import ExcelImportPage from './pages/ExcelImportPage';
import 'katex/dist/katex.min.css';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: 'var(--font-body)',
            background: 'var(--ink)',
            color: 'var(--cream)',
            borderRadius: '10px',
            padding: '12px 16px',
          },
          success: { iconTheme: { primary: '#27ae60', secondary: '#fff' } },
          error: { iconTheme: { primary: '#c0392b', secondary: '#fff' } },
        }}
      />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="builder" element={<BuilderPage />} />
          <Route path="builder/:id" element={<BuilderPage />} />
          <Route path="preview/:id" element={<PreviewPage />} />
          <Route path="import" element={<ExcelImportPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}