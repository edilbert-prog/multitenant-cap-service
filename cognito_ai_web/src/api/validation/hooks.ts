import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  connectionApi,
  validationApi,
  validationResultApi,
  dashboardApi,
  datasourceApi,
  folderApi,
  sapDatasourcesApi,
} from './services';
import type {
  Connection,
  Validation,
  ValidationResult,
  ConnectionFormData,
  ValidationFormData,
  DataSource,
  Folder,
} from '../types';

// Query Keys
export const queryKeys = {
  connections: ['connections'] as const,
  connection: (id: number) => ['connections', id] as const,
  connectionTables: (id: number) => ['connections', id, 'tables'] as const,
  connectionColumns: (id: number, tableName: string) =>
    ['connections', id, 'tables', tableName, 'columns'] as const,
  validations: ['validations'] as const,
  validation: (id: number) => ['validations', id] as const,
  results: (validationId?: number) =>
    validationId ? ['results', validationId] : (['results'] as const),
  result: (id: number) => ['results', id] as const,
  resultDetails: (id: number) => ['results', id, 'details'] as const,
  dashboard: ['dashboard'] as const,
  datasources: ['datasources'] as const,
  folders: ['folders'] as const,
  folderTree: ['folders', 'tree'] as const,
  folder: (id: number) => ['folders', id] as const,
  sapDatasources: ['sap-datasources'] as const,
  sapDatasource: (id: string) => ['sap-datasources', id] as const,
  sapDatasourceSyncProgress: (id: string) => ['sap-datasources', id, 'sync-progress'] as const,
};

// Connection Hooks
export function useConnections() {
  return useQuery({
    queryKey: queryKeys.connections,
    queryFn: connectionApi.getAll,
  });
}

export function useConnection(id: number) {
  return useQuery({
    queryKey: queryKeys.connection(id),
    queryFn: () => connectionApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ConnectionFormData) => connectionApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.connections });
    },
  });
}

export function useUpdateConnection(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ConnectionFormData>) => connectionApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.connections });
      queryClient.invalidateQueries({ queryKey: queryKeys.connection(id) });
    },
  });
}

export function useDeleteConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => connectionApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.connections });
    },
  });
}

export function useTestConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => connectionApi.test(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.connections });
    },
  });
}

export function useConnectionTables(id: number) {
  return useQuery({
    queryKey: queryKeys.connectionTables(id),
    queryFn: () => connectionApi.getTables(id),
    enabled: !!id,
  });
}

export function useTableColumns(connectionId: number, tableName: string) {
  return useQuery({
    queryKey: queryKeys.connectionColumns(connectionId, tableName),
    queryFn: () => connectionApi.getColumns(connectionId, tableName),
    enabled: !!connectionId && !!tableName,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Validation Hooks
export function useValidations() {
  return useQuery({
    queryKey: queryKeys.validations,
    queryFn: validationApi.getAll,
  });
}

export function useValidation(id: number) {
  return useQuery({
    queryKey: queryKeys.validation(id),
    queryFn: () => validationApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateValidation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ValidationFormData) => validationApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.validations });
    },
  });
}

export function useUpdateValidation(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ValidationFormData>) => validationApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.validations });
      queryClient.invalidateQueries({ queryKey: queryKeys.validation(id) });
    },
  });
}

export function useDeleteValidation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => validationApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.validations });
    },
  });
}

export function useRunValidation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => validationApi.run(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.results() });
      queryClient.invalidateQueries({ queryKey: queryKeys.results(data.validation_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

// Validation Result Hooks
export function useValidationResults(validationId?: number) {
  return useQuery({
    queryKey: queryKeys.results(validationId),
    queryFn: () => validationResultApi.getAll(validationId),
  });
}

export function useValidationResult(id: number) {
  return useQuery({
    queryKey: queryKeys.result(id),
    queryFn: () => validationResultApi.getById(id),
    enabled: !!id,
  });
}

export function useValidationResultDetails(id: number) {
  return useQuery({
    queryKey: queryKeys.resultDetails(id),
    queryFn: () => validationResultApi.getDetails(id),
    enabled: !!id,
  });
}

export function useValidationResultPaginated(
  resultId: number,
  type: 'fully_matched' | 'differences' | 'left_only' | 'right_only',
  page: number = 1,
  limit: number = 100,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['results', resultId, type, 'paginated', page, limit],
    queryFn: () => validationResultApi.getPaginated(resultId, type, page, limit),
    enabled: enabled && !!resultId, // Only fetch when explicitly enabled
    keepPreviousData: true, // Smooth pagination transitions
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

export function useDownloadResultCsv() {
  return useMutation({
    mutationFn: ({ id, type }: { id: number; type: 'matched' | 'mismatched' | 'all' }) =>
      validationResultApi.downloadCsv(id, type),
  });
}

export function useStepData(
  resultId: number,
  pipeline: 'left' | 'right',
  stepName: string,
  page: number = 1,
  limit: number = 50,
  filters: Array<{ column: string; value: string }> = [],
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['results', resultId, 'step-data', pipeline, stepName, page, limit, filters],
    queryFn: () => validationResultApi.getStepData(resultId, pipeline, stepName, page, limit, filters),
    enabled: enabled && !!resultId && !!stepName,
    keepPreviousData: true, // Smooth pagination
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
  });
}

// Dashboard Hooks
export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: dashboardApi.getStats,
  });
}

// DataSource Hooks
export function useDataSources() {
  return useQuery({
    queryKey: queryKeys.datasources,
    queryFn: datasourceApi.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUploadExcel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, validationId, datasourceName }: { file: File; validationId: number; datasourceName?: string }) =>
      datasourceApi.uploadExcel(file, validationId, datasourceName),
    onSuccess: (data, variables) => {
      // Invalidate only the specific validation's datasources
      queryClient.invalidateQueries({ queryKey: ['uploadedDatasources', variables.validationId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.datasources });
    },
  });
}

export function useUploadedDatasources(validationId: number) {
  return useQuery({
    queryKey: ['uploadedDatasources', validationId],
    queryFn: () => datasourceApi.getUploaded(validationId),
    enabled: !!validationId, // Only fetch if validationId exists
  });
}

export function useUploadedDatasource(id: number) {
  return useQuery({
    queryKey: ['uploadedDatasources', id],
    queryFn: () => datasourceApi.getUploadedById(id),
    enabled: !!id,
  });
}

export function useReplaceUploadedFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ validationId, oldFilename, file }: { validationId: number; oldFilename: string; file: File }) =>
      datasourceApi.replaceFile(validationId, oldFilename, file),
    onSuccess: (_data, variables) => {
      // Invalidate the specific validation's datasources
      queryClient.invalidateQueries({ queryKey: ['uploadedDatasources', variables.validationId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.datasources });
      // Invalidate the validation itself (to refetch updated left_sources/right_sources)
      queryClient.invalidateQueries({ queryKey: queryKeys.validation(variables.validationId) });
    },
  });
}

export function useDeleteUploadedDatasource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => datasourceApi.deleteUploaded(id),
    onSuccess: () => {
      // Invalidate all validation datasources (we don't know which validation it belonged to)
      queryClient.invalidateQueries({ queryKey: ['uploadedDatasources'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.datasources });
    },
  });
}

// Folder Hooks
export function useFolders() {
  return useQuery({
    queryKey: queryKeys.folders,
    queryFn: folderApi.getAll,
  });
}

export function useFolderTree() {
  return useQuery({
    queryKey: queryKeys.folderTree,
    queryFn: folderApi.getTree,
  });
}

export function useFolder(id: number) {
  return useQuery({
    queryKey: queryKeys.folder(id),
    queryFn: () => folderApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      folder_name: string;
      parent_folder_id?: number | null;
      description?: string;
      color?: string;
      icon?: string;
    }) => folderApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.folders });
      queryClient.invalidateQueries({ queryKey: queryKeys.folderTree });
    },
  });
}

export function useUpdateFolder(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<{
      folder_name: string;
      parent_folder_id: number | null;
      description: string;
      color: string;
      icon: string;
    }>) => folderApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.folders });
      queryClient.invalidateQueries({ queryKey: queryKeys.folderTree });
      queryClient.invalidateQueries({ queryKey: queryKeys.folder(id) });
    },
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, moveValidationsTo }: { id: number; moveValidationsTo?: number | null }) =>
      folderApi.delete(id, moveValidationsTo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.folders });
      queryClient.invalidateQueries({ queryKey: queryKeys.folderTree });
      queryClient.invalidateQueries({ queryKey: queryKeys.validations });
    },
  });
}

export function useMoveValidationToFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ validationId, folderId }: { validationId: number; folderId: number | null }) =>
      folderApi.moveValidation(folderId, validationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.validations });
      queryClient.invalidateQueries({ queryKey: queryKeys.folders });
      queryClient.invalidateQueries({ queryKey: queryKeys.folderTree });
    },
  });
}

// SAP Datasources Hooks
export function useSAPDatasources(filters?: {
  source_type?: string;
  sync_status?: string;
  connection_id?: string;
}) {
  return useQuery({
    queryKey: [...queryKeys.sapDatasources, filters],
    queryFn: () => sapDatasourcesApi.getAll(filters),
    staleTime: 30 * 1000, // 30 seconds (refresh more frequently for sync status)
  });
}

export function useSAPDatasource(id: string) {
  return useQuery({
    queryKey: queryKeys.sapDatasource(id),
    queryFn: () => sapDatasourcesApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateSAPDatasource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      source_type: 'sap-bapi' | 'mysql' | 'postgres';
      connection_id: string;
      table_name: string;
      where_clause?: string;
    }) => sapDatasourcesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sapDatasources });
    },
  });
}

export function useSyncSAPDatasource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sapDatasourcesApi.sync(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sapDatasources });
    },
  });
}

export function useSAPDatasourceSyncProgress(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: queryKeys.sapDatasourceSyncProgress(id),
    queryFn: () => sapDatasourcesApi.getSyncProgress(id),
    enabled: enabled && !!id,
    refetchInterval: (data) => {
      // Poll every 2 seconds while syncing
      return data?.sync_status === 'syncing' ? 2000 : false;
    },
  });
}

export function useDeleteSAPDatasource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sapDatasourcesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sapDatasources });
    },
  });
}

export function useMarkStaleSAPDatasources() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => sapDatasourcesApi.markStale(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sapDatasources });
    },
  });
}
