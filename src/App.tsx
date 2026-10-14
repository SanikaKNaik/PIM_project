import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './layouts/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { ProductsPage } from './pages/ProductsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { BarcodePage } from './pages/BarcodePage';
import { WooCommercePage } from './pages/WooCommercePage';
import { ExcelPage } from './pages/ExcelPage';
import { ReportsPage } from './pages/ReportsPage';
import { DatabasePage } from './pages/DatabasePage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="barcode" element={<BarcodePage />} />
              <Route path="woocommerce" element={<WooCommercePage />} />
              <Route path="excel" element={<ExcelPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="database" element={<DatabasePage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
