import { 
  fetchSupplierVoucherConfig as fetchFromDb, 
  saveSupplierVoucherConfig as saveToDb 
} from './supplierDatabaseService';

export interface SupplierVoucherConfig {
  allow80mm: boolean;
  allowDigital: boolean;
}

// In-memory runtime cache (Zero localStorage)
const runtimeVoucherConfigCache: Record<string, SupplierVoucherConfig> = {};

export function getSupplierVoucherConfig(supplierId?: string): SupplierVoucherConfig {
  if (!supplierId) {
    return { allow80mm: true, allowDigital: true };
  }
  if (runtimeVoucherConfigCache[supplierId]) {
    return runtimeVoucherConfigCache[supplierId];
  }
  return { allow80mm: true, allowDigital: true };
}

export async function fetchSupplierVoucherConfigFromDb(supplierId: string): Promise<SupplierVoucherConfig> {
  if (!supplierId) return { allow80mm: true, allowDigital: true };
  try {
    const config = await fetchFromDb(supplierId);
    const parsed: SupplierVoucherConfig = {
      allow80mm: config.allow_80mm !== false,
      allowDigital: config.allow_digital !== false,
    };
    runtimeVoucherConfigCache[supplierId] = parsed;
    return parsed;
  } catch (err) {
    return { allow80mm: true, allowDigital: true };
  }
}

export async function setSupplierVoucherConfig(supplierId: string, config: SupplierVoucherConfig): Promise<void> {
  runtimeVoucherConfigCache[supplierId] = { ...config };
  await saveToDb(supplierId, {
    allow80mm: config.allow80mm,
    allowDigital: config.allowDigital,
  });
}
