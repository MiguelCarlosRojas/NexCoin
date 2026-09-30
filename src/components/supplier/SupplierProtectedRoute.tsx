import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSupplier } from '../../context/SupplierContext';

export const SupplierProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { supplier, loading } = useSupplier();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-amber-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  if (!supplier) {
    return <Navigate to="/proveedores/login" replace />;
  }

  return <>{children}</>;
};
