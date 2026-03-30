import { apiClient } from './client';
import type {
  Connection,
  Validation,
  ValidationResult,
  ConnectionFormData,
  ValidationFormData,
  ApiResponse,
  ComparisonDetails,
  DataSource,
  Folder,
} from '../types';

// Connection API
export const connectionApi = {
  // Get all connections
  getAll: async (): Promise<Connection[]> => {
    const response = await apiClient.get<ApiResponse<Connection[]>>('/validation-api/connections');
    return response.data.data || [];
  },

  // Get connection by ID
  getById: async (id: number): Promise<Connection> => {
    const response = await apiClient.get<ApiResponse<Connection>>(`/validation-api/connections/${id}`);
    return response.data.data!;
  },

  // Create new connection
  create: async (data: ConnectionFormData): Promise<Connection> => {
    const response = await apiClient.post<ApiResponse<Connection>>('/validation-api/connections', data);
    return response.data.data!;
  },

  // Update connection
  update: async (id: number, data: Partial<ConnectionFormData>): Promise<Connection> => {
    const response = await apiClient.put<ApiResponse<Connection>>(`/validation-api/connections/${id}`, data);
    return response.data.data!;
  },

  // Delete connection
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/validation-api/connections/${id}`);
  },

  // Test connection
  test: async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post<ApiResponse<{ success: boolean; message: string }>>(
      `/validation-api/connections/${id}/test`
    );
    return response.data.data!;
  },

  // Get tables from connection
  getTables: async (id: number): Promise<string[]> => {
    const response = await apiClient.get<ApiResponse<string[]>>(`/validation-api/connections/${id}/tables`);
    return response.data.data || [];
  },

  // Get columns from a table
  getColumns: async (id: number, tableName: string): Promise<string[]> => {
    const response = await apiClient.get<ApiResponse<string[]>>(
      `/validation-api/connections/${id}/tables/${encodeURIComponent(tableName)}/columns`
    );
    return response.data.data || [];
  },
};

// Validation API
export const validationApi = {
  // Get all validations
  getAll: async (): Promise<Validation[]> => {
    const response = await apiClient.get<ApiResponse<Validation[]>>('/validation-api/validations');
    return response.data.data || [];
  },

  // Get validation by ID
  getById: async (id: number): Promise<Validation> => {
    const response = await apiClient.get<ApiResponse<Validation>>(`/validation-api/validations/${id}`);
    return response.data.data!;
  },

  // Create new validation
  create: async (data: ValidationFormData): Promise<Validation> => {
    const response = await apiClient.post<ApiResponse<Validation>>('/validation-api/validations', data);
    return response.data.data!;
  },

  // Update validation
  update: async (id: number, data: Partial<ValidationFormData>): Promise<Validation> => {
    const response = await apiClient.put<ApiResponse<Validation>>(`/validation-api/validations/${id}`, data);
    return response.data.data!;
  },

  // Delete validation
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/validation-api/validations/${id}`);
  },

  // Run validation
  run: async (id: number): Promise<ValidationResult> => {
    const response = await apiClient.post<ApiResponse<ValidationResult>>(
      `/validation-api/validations/${id}/run`
    );
    return response.data.data!;
  },
};

// Validation Results API
export const validationResultApi = {
  // Get all results
  getAll: async (validationId?: number): Promise<ValidationResult[]> => {
    const url = validationId ? `/validation-api/results?validation_id=${validationId}` : '/validation-api/results';
    const response = await apiClient.get<ApiResponse<ValidationResult[]>>(url);
    return response.data.data || [];
  },

  // Get result by ID
  getById: async (id: number): Promise<ValidationResult> => {
    const response = await apiClient.get<ApiResponse<ValidationResult>>(`/validation-api/results/${id}`);
    return response.data.data!;
  },

  // Get result details (matched, mismatched records, etc.)
  getDetails: async (id: number): Promise<ComparisonDetails> => {
    const response = await apiClient.get<ApiResponse<ComparisonDetails>>(`/validation-api/results/${id}/details`);
    return response.data.data!;
  },

  // Download result as CSV
  downloadCsv: async (id: number, type: 'matched' | 'fully_matched' | 'differences' | 'left_only' | 'right_only' | 'all'): Promise<Blob> => {
    const response = await apiClient.get(`/validation-api/results/${id}/download/${type}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Get paginated results
  getPaginated: async (
    id: number,
    type: 'fully_matched' | 'differences' | 'left_only' | 'right_only',
    page: number = 1,
    limit: number = 100
  ): Promise<{
    records: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> => {
    const response = await apiClient.get<ApiResponse<{
      records: any[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>>(`/validation-api/results/${id}/paginated/${type}`, {
      params: { page, limit },
    });
    return response.data.data!;
  },

  // Get data at specific pipeline step
  getStepData: async (
    resultId: number,
    pipeline: 'left' | 'right',
    stepName: string,
    page: number = 1,
    limit: number = 50,
    filters: Array<{ column: string; value: string }> = []
  ): Promise<{
    records: any[];
    columns: string[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    step: {
      name: string;
      operation: string;
      description: string;
      row_count: number;
    };
  }> => {
    const response = await apiClient.get<ApiResponse<any>>(
      `/validation-api/results/${resultId}/step-data/${pipeline}/${stepName}`,
      {
        params: {
          page,
          limit,
          filters: filters.length > 0 ? JSON.stringify(filters) : undefined,
        },
      }
    );
    return response.data.data!;
  },
};

// Dashboard/Stats API
export const dashboardApi = {
  // Get dashboard statistics
  getStats: async (): Promise<{
    total_connections: number;
    active_connections: number;
    total_validations: number;
    active_validations: number;
    recent_results: ValidationResult[];
    success_rate: number;
  }> => {
    const response = await apiClient.get<
      ApiResponse<{
        total_connections: number;
        active_connections: number;
        total_validations: number;
        active_validations: number;
        recent_results: ValidationResult[];
        success_rate: number;
      }>
    >('/validation-api/dashboard/stats');
    return response.data.data!;
  },
};

// DataSource API
export const datasourceApi = {
  // Get all datasources (unified list of all tables across all connections)
  getAll: async (): Promise<DataSource[]> => {
    const response = await apiClient.get<ApiResponse<DataSource[]>>('/validation-api/datasources');
    return response.data.data || [];
  },

  // Upload Excel file (validation-scoped)
  uploadExcel: async (file: File, validationId: number, datasourceName?: string): Promise<{
    datasource_id: number;
    datasource_name: string;
    filename: string;
    temp_table_name: string;
    row_count: number;
    column_count: number;
    columns: string[];
  }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('validation_id', validationId.toString()); // ✅ Required
    if (datasourceName) {
      formData.append('datasource_name', datasourceName);
    }

    const response = await apiClient.post<ApiResponse<any>>('/validation-api/datasources/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data!;
  },

  // Get all uploaded datasources for a validation
  getUploaded: async (validationId: number): Promise<Array<{
    datasource_id: number;
    datasource_name: string;
    filename: string;
    temp_table_name: string;
    row_count: number;
    column_count: number;
    columns: string[];
    validation_id: number;
    upload_timestamp: string;
    status: string;
  }>> => {
    const response = await apiClient.get<ApiResponse<any[]>>(
      `/validation-api/datasources/uploaded?validation_id=${validationId}`
    );
    return response.data.data || [];
  },

  // Get uploaded datasource by ID
  getUploadedById: async (id: number): Promise<{
    datasource_id: number;
    datasource_name: string;
    filename: string;
    temp_table_name: string;
    row_count: number;
    column_count: number;
    columns: string[];
    validation_id: number;
    upload_timestamp: string;
    status: string;
  }> => {
    const response = await apiClient.get<ApiResponse<any>>(`/validation-api/datasources/uploaded/${id}`);
    return response.data.data!;
  },

  // Replace uploaded file (all sheets)
  replaceFile: async (validationId: number, oldFilename: string, file: File): Promise<{
    filename: string;
    datasources: Array<{
      datasource_id: number;
      datasource_name: string;
      filename: string;
      temp_table_name: string;
      row_count: number;
      column_count: number;
      columns: string[];
      validation_id: number;
      upload_timestamp: string;
      status: string;
    }>;
  }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('validation_id', validationId.toString());
    formData.append('old_filename', oldFilename);

    const response = await apiClient.put<ApiResponse<any>>(
      `/validation-api/datasources/uploaded/file`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data!;
  },

  // Delete uploaded datasource
  deleteUploaded: async (id: number): Promise<void> => {
    await apiClient.delete(`/validation-api/datasources/uploaded/${id}`);
  },
};

// Folder API
export const folderApi = {
  // Get all folders (flat list)
  getAll: async (): Promise<Folder[]> => {
    const response = await apiClient.get<Folder[]>('/validation-api/folders');
    return response.data || [];
  },

  // Get folder tree (hierarchical)
  getTree: async (): Promise<Folder[]> => {
    const response = await apiClient.get<Folder[]>('/validation-api/folders/tree');
    return response.data || [];
  },

  // Get folder by ID
  getById: async (id: number): Promise<Folder> => {
    const response = await apiClient.get<Folder>(`/validation-api/folders/${id}`);
    return response.data;
  },

  // Create folder
  create: async (data: {
    folder_name: string;
    parent_folder_id?: number | null;
    description?: string;
    color?: string;
    icon?: string;
  }): Promise<Folder> => {
    const response = await apiClient.post<Folder>('/validation-api/folders', data);
    return response.data;
  },

  // Update folder
  update: async (id: number, data: Partial<{
    folder_name: string;
    parent_folder_id: number | null;
    description: string;
    color: string;
    icon: string;
  }>): Promise<Folder> => {
    const response = await apiClient.put<Folder>(`/validation-api/folders/${id}`, data);
    return response.data;
  },

  // Delete folder
  delete: async (id: number, moveValidationsTo?: number | null): Promise<void> => {
    const params = moveValidationsTo !== undefined ? { moveValidationsTo } : {};
    await apiClient.delete(`/validation-api/folders/${id}`, { params });
  },

  // Move validation to folder
  moveValidation: async (folderId: number | null, validationId: number): Promise<void> => {
    const targetFolderId = folderId === null ? 0 : folderId;
    await apiClient.post(`/validation-api/folders/${targetFolderId}/move-validation`, {
      validation_id: validationId,
    });
  },

  // Get validations in folder
  getValidations: async (folderId: number | null): Promise<number[]> => {
    const id = folderId === null ? 'root' : folderId;
    const response = await apiClient.get<number[]>(`/validation-api/folders/${id}/validations`);
    return response.data || [];
  },
};

// SAP Datasources API (global, reusable)
export const sapDatasourcesApi = {
  // Get all SAP datasources
  getAll: async (filters?: {
    source_type?: string;
    sync_status?: string;
    connection_id?: string;
  }): Promise<Array<{
    id: string;
    name: string;
    source_type: 'sap-bapi' | 'mysql' | 'postgres';
    connection_id: string;
    table_name: string;
    where_clause: string | null;
    row_count: number;
    column_count: number;
    columns: string[] | null;
    last_synced_at: string | null;
    sync_status: 'pending' | 'syncing' | 'complete' | 'failed' | 'stale';
    sync_duration_seconds: number | null;
    sync_progress_percent: number;
    sync_rows_fetched: number;
    error_message: string | null;
    temp_table_name: string | null;
    used_by_count: number;
    created_at: string;
    updated_at: string;
  }>> => {
    const response = await apiClient.get<ApiResponse<any[]>>('/validation-api/sap-datasources', { params: filters });
    return response.data.data || [];
  },

  // Get SAP datasource by ID
  getById: async (id: string): Promise<any> => {
    const response = await apiClient.get<ApiResponse<any>>(`/validation-api/sap-datasources/${id}`);
    return response.data.data!;
  },

  // Create new SAP datasource
  create: async (data: {
    name: string;
    source_type: 'sap-bapi' | 'mysql' | 'postgres';
    connection_id: string;
    table_name: string;
    where_clause?: string;
  }): Promise<any> => {
    const response = await apiClient.post<ApiResponse<any>>('/validation-api/sap-datasources', data);
    return response.data.data!;
  },

  // Trigger sync (async operation)
  sync: async (id: string): Promise<{ datasource_id: string; message: string }> => {
    const response = await apiClient.post<ApiResponse<any>>(`/validation-api/sap-datasources/${id}/sync`);
    return response.data.data || { datasource_id: id, message: 'Sync started' };
  },

  // Get sync progress
  getSyncProgress: async (id: string): Promise<{
    datasource_id: string;
    sync_status: 'pending' | 'syncing' | 'complete' | 'failed' | 'stale';
    sync_progress_percent: number;
    sync_rows_fetched: number;
    total_rows_estimate?: number;
    error_message: string | null;
  }> => {
    const response = await apiClient.get<ApiResponse<any>>(`/validation-api/sap-datasources/${id}/sync-progress`);
    return response.data.data!;
  },

  // Delete SAP datasource
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/validation-api/sap-datasources/${id}`);
  },

  // Mark stale datasources
  markStale: async (): Promise<{ count: number; message: string }> => {
    const response = await apiClient.post<ApiResponse<any>>('/validation-api/sap-datasources/mark-stale');
    return response.data.data || { count: 0, message: 'No datasources marked as stale' };
  },
};
