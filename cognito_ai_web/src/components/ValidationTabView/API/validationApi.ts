// ValidationApi.tsx
import { toast } from 'sonner';
import api from "./api";


// --- Existing APIs provided by user ---

export const BASE_URL_API = "/api/";
export async function getApplicationsApi(params: any) { 
  try {
    const res = await api.post(`/api/validation-component/get-validation-objects`, params);
    if (res.status === 200) {
      return res.data;
    }
  } catch (error) {
    console.error("Failed to get application objects:", error);
    toast.error("Failed to get application objects.");
    throw error;
  }
}

export async function getTableFieldsDetailsApi(params: any) {
  try {
    const res = await api.post(`/api/validation-component/get-table-fields-details`, params);
    if (res.status === 200) {
      return res.data;
    }
  } catch (error) {
    console.error("Failed to get table fields details:", error);
    toast.error("Failed to get table fields details.");
    throw error;
  }
}

export async function getUniqueApplicationsApi(params: {
  app_name: string;
  app_module: string;
  object_type: string;
  tcode: string;
  object_id: string;
}) {
  try {
    const res = await api.post(`/api/validation-component/get-unique-applications`, params);
    if (res.status === 200) {
      return res.data;
    }
  } catch (error) {
    console.error("Failed to get unique applications:", error);
    toast.error("Failed to get unique applications.");
    throw error;
  }
}

// --- New APIs for CRUD ---

export async function getAllValidations(params?: {
  search_text?: string;
  q?: string;
  skip?: number;
  limit?: number;
  sort?: Record<string, "asc" | "desc">;
}) {
  try {
    const query = new URLSearchParams();

    if (params?.search_text) query.append("search_text", params.search_text);
    if (params?.q) query.append("q", params.q);
    if (params?.skip !== undefined) query.append("skip", String(params.skip));
    if (params?.limit !== undefined) query.append("limit", String(params.limit));

    // stringify sort dictionary → single query param
    if (params?.sort) {
      query.append("sort", JSON.stringify(params.sort));
    }

    const res = await api.get(
      `/api/validation-component?${query.toString()}`
    );

    if (res.status === 200) {
      return res.data;
    }
  } catch (error) {
    console.error("Failed to fetch validations:", error);
    toast.error("Failed to fetch validations.");
    throw error;
  }
}


export async function getValidationById(id: string) {
  try {
    const res = await api.get(`/api/validation-component/${id}`);
    if (res.status === 200) {
      return res.data;
    }
  } catch (error) {
    console.error(`Failed to fetch validation with ID ${id}:`, error);
    toast.error(`Failed to fetch validation with ID ${id}.`);
    throw error;
  }
}

export async function createValidation(payload: any) {
  try {
    const res = await api.post(`/api/validation-component/update-validation`, payload);
    if (res.status === 200 || res.status === 201) {
      toast.success("Validation created successfully.");
      return res.data;
    }
  } catch (error) {
    console.error("Failed to create validation:", error);
    toast.error("Failed to create validation.");
    throw error;
  }
}

export async function updateValidation(id: string, payload: any) {
  try {
    // The API spec shows 'update_id' in the body. Let's ensure it's there.
    const updatePayload = { ...payload, update_id: String(id) || id };
    const res = await api.post(`/api/validation-component/update-validation`, updatePayload);
    if (res.status === 200) {
      toast.success("Validation updated successfully.");
      return res.data;
    }
  } catch (error) {
    console.error("Failed to update validation:", error);
    toast.error("Failed to update validation.");
    throw error;
  }
}

export async function deleteValidation(id: string) {
  try {
    const res = await api.delete(`/api/validation-component/${id}`);
    if (res.status === 200) {
      // The toast is handled in the component for better user feedback
      return res.data;
    }
  } catch (error) {
    console.error("Failed to delete validation:", error);
    toast.error("Failed to delete validation.");
    throw error;
  }
}
export const createVcId = async (payload: {
  application_id: string;
  object_type: string;
  module: string;
  sub_module: string;
  tcode: string;
  object: string;
  database_connection: string;
  validation_description: string;
}) => {
  try {
    const res = await api.post(`/api/validation-component/create-vcid`, payload);
    if (res.status === 200 || res.status === 201) {
      return res.data;
    }
    throw new Error(res.data.message || 'Failed to create validation ID.');
  } catch (error) {
    console.error("Failed to create validation ID:", error);
    toast.error("Failed to create validation ID.");
    throw error;
  }
};


export async function executeValidationComponent(payload: { validation_id: string; parameters: Record<string, any> }) {
  try {
    const res = await api.post(`/api/validation-component/execute-validation-component`, payload);
    if (res.status === 200) {
      return res.data;
    }
  } catch (error) {
    console.error("Failed to execute validation component:", error);
    toast.error("Failed to execute validation component.");
    throw error;
  }
}

export async function getSapSystemClientId(payload: { system_number: string; client_id: string }) {
  try {
    const res = await api.post(`/api/databases/get-sap-system-client-id`, payload);
    if (res.status === 200) {
      return res.data;
    }
  } catch (error) {
    console.error("Failed to get SAP system and client data:", error);
    toast.error("Failed to get SAP system and client data.");
    throw error;
  }
}

// --- SAP Connection APIs ---

export async function getSapConnections(payload: {
  connection_id?: string;
  group_type?: string;
  connection_type: string;
  fields: string;
}) {
  try {
    const res = await api.post(`/api/databases/get-connections`, payload);
    if (res.status === 200) {
      return res.data;
    }
  } catch (error) {
    console.error("Failed to get SAP connections:", error);
    toast.error("Failed to get SAP connections.");
    throw error;
  }
}

export async function getSapApplications(payload: {
  payload: {
    data: {
      protocol_type: string;
    };
    actions: string;
  };
}) {
  try {
    const res = await api.post(`/api/databases/sap-actions`, payload);
    if (res.status === 200) {
      return res.data;
    }
  } catch (error) {
    console.error("Failed to get SAP applications:", error);
    toast.error("Failed to get SAP applications.");
    throw error;
  }
}

export async function getSapSystemNumbers(payload: {
  payload: {
    data: {
      application: string;
    };
    actions: string;
  };
}) {
  try {
    const res = await api.post(`/api/databases/sap-actions`, payload);
    if (res.status === 200) {
      return res.data;
    }
  } catch (error) {
    console.error("Failed to get SAP system numbers:", error);
    toast.error("Failed to get SAP system numbers.");
    throw error;
  }
}

export async function getSapClientIds(payload: {
  payload: {
    data: {
      application: string;
      system_number: string;
    };
    actions: string;
  };
}) {
  try {
    const res = await api.post(`/api/databases/sap-actions`, payload);
    if (res.status === 200) {
      return res.data;
    }
  } catch (error) {
    console.error("Failed to get SAP client IDs:", error);
    toast.error("Failed to get SAP client IDs.");
    throw error;
  }
}

export async function getSapConnectionsList(payload: {
  fields: string;
  connection_type: string;
}) {
  try {
    const res = await api.post(`/api/databases/get-connections`, payload);
    if (res.status === 200) {
      return res.data;
    }
  } catch (error) {
    console.error("Failed to get SAP connections list:", error);
    toast.error("Failed to get SAP connections list.");
    throw error;
  }
}

export async function getSapTables(payload: {
  payload: {
    data: {
      schema: string;
      search: string;
      database: string;
    };
    actions: string;
    connection: number;
    protocol_type: string;
  };
}) {
  try {
    const res = await api.post(`/api/databases/sap-actions`, payload);
    if (res.status === 200) {
      return res.data;
    }
  } catch (error) {
    console.error("Failed to get SAP tables:", error);
    toast.error("Failed to get SAP tables.");
    throw error;
  }
}

export async function getSapTableData(payload: {
  payload: {
    data: {
      table: string;
      columns: string[];
      maxnumber?: number;
    };
    actions: string;
    connection: number;
    protocol_type: string;
  };
}) {
  try {
    const res = await api.post(`/api/databases/sap-actions`, payload);
    if (res.status === 200) {
      return res.data;
    }
  } catch (error) {
    console.error("Failed to get SAP table data:", error);
    toast.error("Failed to get SAP table data.");
    throw error;
  }
}

// New API functions for chained SAP dropdowns
export async function getSapSystemNumbersNew(payload: {
  payload: {
    data: {
      application: string;
    };
    actions: string;
  };
}) {
  try {
    const res = await api.post(`/api/databases/sap-actions`, payload);
    if (res.status === 200) {
      return res.data;
    }
  } catch (error) {
    console.error("Failed to get SAP system numbers:", error);
    toast.error("Failed to get SAP system numbers.");
    throw error;
  }
}

export async function getSapClientIdsNew(payload: {
  payload: {
    data: {
      system_number: string;
    };
    actions: string;
  };
}) {
  try {
    const res = await api.post(`/api/databases/sap-actions`, payload);
    if (res.status === 200) {
      return res.data;
    }
  } catch (error) {
    console.error("Failed to get SAP client IDs:", error);
    toast.error("Failed to get SAP client IDs.");
    throw error;
  }
}

export async function getSapConnectionBySysClient(payload: {
  payload: {
    data: {
      client_id: string;
      system_number: string;
    };
    actions: string;
  };
}) {
  try {
    const res = await api.post(`/api/databases/sap-actions`, payload);
    if (res.status === 200) {
      return res.data;
    }
  } catch (error) {
    console.error("Failed to get SAP connections:", error);
    toast.error("Failed to get SAP connections.");
    throw error;
  }
}
