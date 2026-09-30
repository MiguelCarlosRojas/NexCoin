import React, { createContext, useContext, useState, useEffect } from 'react';
import { Supplier } from '../types/store';
import { supabase } from '../lib/supabaseClient';

interface SupplierContextType {
  supplier: Supplier | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: Partial<Supplier> & { password: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshSupplier: () => Promise<void>;
}

const SupplierContext = createContext<SupplierContextType | undefined>(undefined);

export const SupplierProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [supplier, setSupplier] = useState<Supplier | null>(() => {
    try {
      const saved = localStorage.getItem('nexcoin_supplier');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (supplier) {
      localStorage.setItem('nexcoin_supplier', JSON.stringify(supplier));
    } else {
      localStorage.removeItem('nexcoin_supplier');
    }
  }, [supplier]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('email', email.trim().toLowerCase())
        .single();

      if (error || !data) {
        setLoading(false);
        return { success: false, error: 'Proveedor no encontrado con este correo.' };
      }

      if (data.password !== password) {
        setLoading(false);
        return { success: false, error: 'Contraseña incorrecta.' };
      }

      const { password: _, ...supplierWithoutPass } = data;
      setSupplier(supplierWithoutPass as Supplier);
      setLoading(false);
      return { success: true };
    } catch (err: any) {
      setLoading(false);
      return { success: false, error: err.message || 'Error al iniciar sesión' };
    }
  };

  const register = async (data: Partial<Supplier> & { password: string }): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      const newSupplier = {
        company_name: data.company_name,
        contact_name: data.contact_name || '',
        email: data.email?.trim().toLowerCase(),
        password: data.password,
        phone: data.phone || '',
        wallet_address: data.wallet_address || '',
        avatar_url: data.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${data.company_name}`,
      };

      const { data: inserted, error } = await supabase
        .from('suppliers')
        .insert([newSupplier])
        .select()
        .single();

      if (error) {
        setLoading(false);
        return { success: false, error: error.message };
      }

      const { password: _, ...supplierWithoutPass } = inserted;
      setSupplier(supplierWithoutPass as Supplier);
      setLoading(false);
      return { success: true };
    } catch (err: any) {
      setLoading(false);
      return { success: false, error: err.message || 'Error al registrarse' };
    }
  };

  const logout = () => {
    setSupplier(null);
    localStorage.removeItem('nexcoin_supplier');
  };

  const refreshSupplier = async () => {
    if (!supplier?.id) return;
    try {
      const { data } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', supplier.id)
        .single();
      if (data) {
        const { password: _, ...supplierWithoutPass } = data;
        setSupplier(supplierWithoutPass as Supplier);
      }
    } catch {
      // ignore
    }
  };

  return (
    <SupplierContext.Provider
      value={{
        supplier,
        loading,
        login,
        register,
        logout,
        refreshSupplier,
      }}
    >
      {children}
    </SupplierContext.Provider>
  );
};

export const useSupplier = () => {
  const context = useContext(SupplierContext);
  if (!context) {
    throw new Error('useSupplier must be used within a SupplierProvider');
  }
  return context;
};
