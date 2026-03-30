import { FetchConfig, FormFieldOption, SaveNodeConfig } from '../types/form';
import axios from 'axios';
import api from "@/components/ValidationTabView/API/api";

// Base URL configuration
const BASE_URL_API = (typeof window !== 'undefined' && (window as any).ENV?.REACT_APP_API_BASE_URL);

// --- Template Replacer Utility ---
const replaceTemplateStrings = (obj: any, values: Record<string, any>): any => {
  if (Array.isArray(obj)) {
    return obj.map(item => replaceTemplateStrings(item, values));
  }
  if (typeof obj === 'object' && obj !== null) {
    return Object.keys(obj).reduce((acc, key) => {
      acc[key] = replaceTemplateStrings(obj[key], values);
      return acc;
    }, {} as any);
  }
  if (typeof obj === 'string') {
    const match = obj.match(/^{{(.*)}}$/);
    if (match && match[1]) {
      const key = match[1];
      return values[key] || '';
    }
  }
  return obj;
};

const getDependencies = (obj: any): string[] => {
  const deps = new Set<string>();
  const findDeps = (o: any) => {
    if (Array.isArray(o)) {
      o.forEach(findDeps);
    } else if (typeof o === 'object' && o !== null) {
      Object.values(o).forEach(findDeps);
    } else if (typeof o === 'string') {
      const match = o.match(/^{{(.*)}}$/);
      if (match && match[1]) {
        deps.add(match[1]);
      }
    }
  };
  findDeps(obj);
  return Array.from(deps);
}

// --- MOCK API ROUTER ---
// This function simulates a backend. It intercepts API calls and returns mock data.
const mockApiRouter = async (fetchConfig: FetchConfig, payload: any): Promise<any> => {
  console.log(`[Mock API] Intercepted call to ${fetchConfig.module}/${fetchConfig.klass} with payload:`, payload);
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

  if (fetchConfig.klass.includes('get-connections')) {
    return [
      { label: 'Main PostgreSQL DB', value: 'pg_main_conn' },
      { label: 'Legacy PostgreSQL DB', value: 'pg_legacy_conn' },
    ];
  }

  if (fetchConfig.klass.includes('postgresql-actions')) {
    const action = payload?.actions || payload?.payload?.actions;
    const data = payload?.data || payload?.payload?.data || {};

    switch (action) {
      case 'get_databases':
        if (data.connection) {
          return [{ label: 'Production DB', value: 'prod_db' }, { label: 'Staging DB', value: 'stg_db' }];
        }
        return [];
      case 'get_schemas':
        if (data.database === 'prod_db') {
          return [{ label: 'public', value: 'public' }, { label: 'analytics', value: 'analytics' }];
        }
        return [{ label: 'public', value: 'public' }];
      case 'get_tables':
        if (data.schema === 'analytics') {
          return [{ label: 'user_sessions', value: 'user_sessions' }, { label: 'daily_reports', value: 'daily_reports' }];
        }
        return [{ label: 'users', value: 'users' }, { label: 'products', value: 'products' }];
      case 'get_columns':
        if (data.table === 'users') {
          return [{ label: 'id', value: 'id' }, { label: 'name', value: 'name' }, { label: 'email', value: 'email' }];
        }
        return [{ label: 'id', value: 'id' }, { label: 'data', value: 'data' }, { label: 'timestamp', value: 'timestamp' }];
      default:
        return [];
    }
  }

  if (fetchConfig.klass.includes('create-workflow-node')) {
    console.log('[Mock API] Simulating save:', payload);
    return { success: true, savedData: payload };
  }

  return [];
};

// --- Main Fetch Function ---
export const fetchDynamicOptions = async (
  fetchConfig: FetchConfig,
  formValues: Record<string, any>
): Promise<FormFieldOption[]> => {
  const resolvedParams = replaceTemplateStrings(fetchConfig.params, formValues);
  const endpoint = `/api/${fetchConfig.module}/${fetchConfig.klass}`;
  const bodyPayload = resolvedParams;

  const requestOptions: RequestInit = {
    method: fetchConfig.method.toUpperCase(),
    headers: { 'Content-Type': 'application/json' },
  };

  if (requestOptions.method === 'POST') {
    requestOptions.body = JSON.stringify(bodyPayload);
  }

  try {
    // Using the mock API router for development as real API calls will fail.
    // Replace this with the fetch call when connecting to a live backend.
    // const data = await mockApiRouter(fetchConfig, bodyPayload);

    // --- REAL API CALL with base URL ---
    const response = await fetch(`${BASE_URL_API}${endpoint}`, requestOptions);
    if (!response.ok) {
      throw new Error(`API Error (${response.status}) for ${endpoint}: ${await response.text()}`);
    }
    const result = await response.json();
    const data = result?.data[0].label ? result?.data : result?.data.map((item: any) => ({ label: item, value: item }));

    if (!Array.isArray(data)) {
      console.error("API did not return an array for options:", data);
      return [];
    }

    return data as FormFieldOption[];

  } catch (error) {
    console.error(`Failed to fetch from endpoint ${endpoint}:`, error);
    throw error;
  }
};

export const getFieldDependencies = (fetchConfig: FetchConfig): string[] => {
  return getDependencies(fetchConfig.params);
}

// --- New Save Function ---
export const saveFormData = async (
  saveConfig: SaveNodeConfig,
  formValues: Record<string, any>,
  payloadTemplate: Record<string, any>
): Promise<Record<string, any>> => {
  const finalPayload = replaceTemplateStrings(payloadTemplate, formValues);
  const endpoint = `/${saveConfig.module}/${saveConfig.klass}/`;
  const token = sessionStorage.getItem('access_token');
  const requestOptions: RequestInit = {
    method: saveConfig.method.toUpperCase(),
    headers: { 'Content-Type': 'application/json', "authentication": token },
  };

  if (requestOptions.method === 'POST') {
    requestOptions.body = JSON.stringify(finalPayload);
  }

  try {
    // Using the mock API router for development.
    // const data = await mockApiRouter({ ...saveConfig, params: {} } as FetchConfig, finalPayload);

    // --- REAL API CALL with base URL ---
    const response = await fetch(`${BASE_URL_API}${endpoint}`, requestOptions);
    if (!response.ok) {
      throw new Error(`API Error (${response.status}) for ${endpoint}: ${await response.text()}`);
    }
    const data = await response.json();
    // Return the formatted payload that was sent, not the whole API response object.
    return data.savedData || data;

  } catch (error) {
    console.error(`Failed to save to endpoint ${endpoint}:`, error);
    throw error;
  }
}

// Interface for the API response data
interface Option {
  value: number | string;
  label: string;
}

interface ApiResponse {
  status: boolean;
  message: string;
  data: Option[];
}

export const fetchDatabaseConnections = async (): Promise<Option[]> => {
  console.log("Fetching database connections...");

  const payload = {
    fields: '["id as value", "name as label"]',
    connection_type: "",
  };

  // --- In a real application, you would use this block ---
 
  try {
    const response = await api.post<ApiResponse>(`/api/databases/get-connections`, payload);
    if (response.data && response.data.status) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch data');
  } catch (error) {
    console.error("Error fetching database connections:", error);
    // Return empty array or throw error to be handled by the component
    return [];
  }
};



export const runDatabaseAction = async (data: { payload: any }) => {
  const { payload } = data;
  try {
    const response = await api.post(`/api/databases/sap-actions`, { payload });
    return response.data;
  } catch (error) {
    console.error("Error running database action:", error);
    throw error;
  }
};


export const getSapValidationParams = async (payload: any): Promise<any> => {
  console.log("Fetching SAP validation params with payload:", payload);
  try {
    const response = await api.post(`/api/sap-validation-engine/get-validation-parms`, payload);
    return response.data;
  } catch (error) {
    console.error("Error fetching SAP validation params:", error);
    throw error;
  }
};
