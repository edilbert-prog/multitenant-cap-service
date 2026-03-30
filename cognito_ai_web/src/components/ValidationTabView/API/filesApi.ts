import api from './api';

/**
 * Fetches the list of master data files from the server.
 * Can be filtered by master_type.
 * @param {boolean} [isSapMaster] - Whether to fetch only SAP master files.
 * @returns {Promise<any>} A promise that resolves to the API response.
 */
export const getMasterDataFiles = async (isSapMaster?: boolean): Promise<any> => {
  const payload: { file_category: string; master_type?: string } = {
    file_category: 'master_data',
  };
  if (isSapMaster) {
    payload.master_type = 'SAP';
  }
  const response = await api.post('/api/files/get-files', payload);
  return response.data;
};

/**
 * Fetches the content of a specific file by its unique_id.
 * @param {string} uniqueId The unique ID of the file to fetch.
 * @returns {Promise<any>} A promise that resolves to the API response containing the file's data.
 */
export const getFileData = async (uniqueId: string): Promise<any> => {
  const response = await api.post('/api/files/view-data', {
    payload: {
      unique_id: uniqueId,
    },
  });
  return response.data;
};

/**
 * Creates a new global field/key in the system.
 * @param {object} payload - The data for the new global field.
 * @returns {Promise<any>} A promise that resolves to the API response.
 */
export const createGlobalField = async (payload: {
  master_id: string;
  master_type: string;
  key_name: string;
  key_description: string;
  key_value: string;
}): Promise<any> => {
  const response = await api.post('/api/validation-component/create-global-fields', payload);
  return response.data;
};
