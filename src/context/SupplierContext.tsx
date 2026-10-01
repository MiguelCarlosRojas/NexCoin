import React, { createContext, useContext, useState, useEffect } from 'react';
import { Supplier } from '../types/store';
import { supabase } from '../lib/supabaseClient';
import { getSupplierSession, setSupplierSession, clearSupplierSession } from '../lib/cookieSession';

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
  const [supplier, setSupplier] = useState<Supplier | null>(() => getSupplierSession());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (supplier) {
      setSupplierSession(supplier);
    } else {
      clearSupplierSession();
    }
  }, [supplier]);

  // Real-time socket subscription for supplier profile updates
  useEffect(() => {
    if (!supplier?.id) return;
    const channel = supabase
      .channel(`supplier-profile-socket-${supplier.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'suppliers', filter: `id=eq.${supplier.id}` },
        (payload) => {
          if (payload.new) {
            const { password: _, ...supplierWithoutPass } = payload.new as any;
            setSupplier(supplierWithoutPass as Supplier);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supplier?.id]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, email, password, company_name, phone, wallet_address, avatar_url, blobatar_identifier, created_at')
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
        .select('id, email, company_name, phone, wallet_address, avatar_url, blobatar_identifier, created_at')
        .single();

      if (error) {
        setLoading(false);
        return { success: false, error: error.message };
      }

      setSupplier(inserted as Supplier);
      setLoading(false);
      return { success: true };
    } catch (err: any) {
      setLoading(false);
      return { success: false, error: err.message || 'Error al registrarse' };
    }
  };

  const logout = () => {
    setSupplier(null);
    clearSupplierSession();
  };

  const refreshSupplier = async () => {
    if (!supplier?.id) return;
    try {
      const { data } = await supabase
        .from('suppliers')
        .select('id, email, company_name, phone, wallet_address, avatar_url, blobatar_identifier, created_at')
        .eq('id', supplier.id)
        .single();
      if (data) {
        setSupplier(data as Supplier);
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
