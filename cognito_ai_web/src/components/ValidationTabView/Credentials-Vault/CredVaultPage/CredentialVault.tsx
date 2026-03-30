import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Button } from "@/components/ValidationTabView/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ValidationTabView/ui/dialog";
import { Badge } from "@/components/ValidationTabView/ui/badge";
import { toast, Toaster } from "sonner";
import { ArrowLeft, Plus, Trash2, Edit } from "lucide-react";
import CustomTable from '../../../../utils/CustomTable';
import CredDynamicForm from './CredForm';
import ConnectorSelectionModal from './ConnectorSelectionModal';


interface Connector {
  id: string;
  name: string;
  icon: string;
  description: string;
  display_name?: string;
  group?: string;
  enabled?: boolean;
}

interface FormSchema {
  id: number;
  form_id: string;
  name: string;
  display_name: string;
  icon: string;
  description: string;
  group: string;
  enabled: boolean;
  fields: any[];
  save_connection: {
    name: string;
    klass: string;
    module: string;
    params: Record<string, any>;
  };
}

interface Connection {
  id: string;
  name: string;
  connection_type: string;
  host?: string;
  port?: string | number;
  user_name?: string;
  username?: string;
  database_name?: string;
  database?: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

const CredentialsVault: React.FC = () => {
  const navigate = useNavigate();
  
  const [connections, setConnections] = useState<Connection[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showConnectorModal, setShowConnectorModal] = useState(false);
  const [editingConnection, setEditingConnection] = useState<Connection | null>(null);
  const [editFormSchema, setEditFormSchema] = useState<FormSchema | null>(null);
  const [loading, setLoading] = useState(false);
  const [connectionsLoading, setConnectionsLoading] = useState(true);

  const [isTesting, setIsTesting] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState<Record<string, boolean>>({});
  const [isUpdating, setIsUpdating] = useState(false);



  useEffect(() => {
    fetchConnections();
  }, []);

  // Fetch all connections

  const fetchConnections = async () => {
    try {
      setConnectionsLoading(true);
      // Fetch all connections from the new API endpoint
      const token = sessionStorage.getItem('access_token');
      const response = await fetch('/cognito/api/connections/get-connections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "authentication": token,
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();
      if (data.status && data.data) {
        // Filter out llm-engine connections (they're shown in LLM Config tab)
        const nonLLMConnections = data.data.filter((conn: Connection) => conn.connection_type !== 'llm-engine');
        setConnections(nonLLMConnections);
      } else {
        setConnections([]);
      }

    } catch (error) {
      console.error('Error fetching connections:', error);
      toast.error('Failed to load connections');
      setConnections([]);
    } finally {
      setConnectionsLoading(false);
    }
  };

  // Fetch form schema for specific connector
  const fetchFormSchema = async (connectorId: string) => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('access_token');

      // Fetch connector schemas
      const response = await fetch('/cognito/api/connections/get-connector-schemas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "authentication": token,
        },
        body: JSON.stringify({}),
      });

      const result = await response.json();
      if (result.status && result.data) {
        // Find the matching connector schema
        const connectorSchema = result.data.find((schema: any) => schema.connector_id === connectorId);

        if (connectorSchema) {
          // Transform fields to match CredDynamicForm expected format
          const transformedFields = connectorSchema.fields.map((field: any) => {
            // Convert boolean type to checkbox
            if (field.type === 'boolean') {
              return {
                ...field,
                type: 'checkbox',
                input_type: 'checkbox'
              };
            }
            return field;
          });

          // Build form schema from connector schema
          return {
            id: 0,
            form_id: connectorSchema.connector_id,
            name: connectorSchema.connector_id,
            display_name: connectorSchema.display_name,
            icon: connectorSchema.icon,
            description: connectorSchema.description || '',
            group: connectorSchema.group,
            enabled: true,
            fields: transformedFields,
            save_connection: {
              name: 'save_connection',
              klass: 'update-connection',
              module: 'connections',
              params: {}
            }
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Error fetching form schema:', error);
      toast.error('Failed to load form schema');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Handle add new connection
  const handleAddNew = () => {
    setShowConnectorModal(true);
  };

  const SENSITIVE_FIELD_PLACEHOLDER = '••••••••';
  const sensitiveFieldNames = ['password', 'api_token', 'api_key', 'private_key'];

  const initialEditData = useMemo(() => {
    if (!editingConnection) {
      return {};
    }

    // Flatten connection_config into top-level fields
    const flattenedData: Record<string, any> = {
      name: editingConnection.name,
      is_active: editingConnection.is_active
    };

    // Merge connection_config fields into flattenedData
    if (editingConnection.connection_config) {
      Object.entries(editingConnection.connection_config).forEach(([key, value]) => {
        flattenedData[key] = value;
      });
    }

    // Add masked placeholders for sensitive fields
    // These fields exist in Vault, so show them as masked
    sensitiveFieldNames.forEach(fieldName => {
      flattenedData[fieldName] = SENSITIVE_FIELD_PLACEHOLDER;
    });

    return flattenedData;
  }, [editingConnection]);


  // const handleTestConnection = async (formData: Record<string, any>) => {
  //   if (!editFormSchema) {
  //     toast.error("Form schema not available. Cannot test connection.");
  //     return;
  //   }

  //   setIsTesting(true);
  //   try {
  //     const { module, klass } = editFormSchema.save_connection;
  //     const apiUrl = `/api/${module}/${klass}-actions`;

  //     // Use the provided request body structure for testing
  //     const testPayloadTemplate = {
  //       payload: {
  //         actions: "test_connection",
  //         name: "{{name}}",
  //         host: "{{host}}",
  //         port: "{{port}}",
  //         user_name: "{{user_name}}",
  //         password: "{{password}}",
  //         database_name: "{{database_name}}",
  //         connection_type: klass,
  //         group_type: module,
  //         is_active: "{{is_active}}",
  //         is_ssh_tunnel: "{{is_ssh_tunnel}}",
  //         ssh_tunnel: {
  //           host: "{{ssh_tunnel.host}}",
  //           port: "{{ssh_tunnel.port}}",
  //           user_name: "{{ssh_tunnel.user_name}}",
  //           password: "{{ssh_tunnel.password}}",
  //           private_key: "{{ssh_tunnel.private_key}}",
  //         },
  //       },
  //     };

  //     // Reuse the existing function to populate the template with form data
  //     const processedPayload = processFormDataWithParams(formData, testPayloadTemplate);
      
  //     const response = await fetch(apiUrl, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify(processedPayload),
  //     });

  //     const result = await response.json();

  //     if (result.status) {
  //       toast.success(result.message || 'Connection test successful!');
  //     } else {
  //       toast.error(result.message || 'Connection test failed.');
  //     }
  //   } catch (error) {
  //     console.error('Error testing connection:', error);
  //     toast.error('An error occurred while testing the connection.');
  //   } finally {
  //     setIsTesting(false);
  //   }
  // };

  const handleCustomAction = async (actionField: any, formData: Record<string, any>) => { 
    const { name: actionName, fetch: actionConfig } = actionField;
    if (!actionConfig || !actionConfig.klass || !actionConfig.module || !actionConfig.params) { 
      toast.error("Action configuration is invalid.");
      return;
    }
    setIsActionLoading(prev => ({ ...prev, [actionName]: true }));
    try {  
      const { module, klass, params, method } = actionConfig;
      const apiUrl = `/api/${module}/${klass}`;
      const processedPayload = processFormDataWithParams(formData, params);
      const token = sessionStorage.getItem('access_token');
      const response = await fetch(apiUrl, {
        method: method || 'POST',
        headers: { 'Content-Type': 'application/json', "authentication": token, },
        body: JSON.stringify(processedPayload),
      });
      const result = await response.json();
      if (result.status) {
        toast.success(result.message || 'Action completed successfully!');
      } else {
        toast.error(result.message || 'Action failed.');
      }
    } catch (error) {
      console.error(`Error performing action '${actionName}':`, error);
      toast.error('An error occurred while performing the action.');
    } finally {
      setIsActionLoading(prev => ({ ...prev, [actionName]: false }));
    }
  };

  // Handle edit connection
  const handleEdit = async (connection: Connection, module: string) => {
    try {
      setLoading(true);

      // Fetch specific connection details from new API
      const token = sessionStorage.getItem('access_token');
      const connectionResponse = await fetch('/cognito/api/connections/get-connections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "authentication": token,
        },
        body: JSON.stringify({
          connection_id: connection.id.toString()
        }),
      });

      const connectionData = await connectionResponse.json();

      if (connectionData.status && connectionData.data && connectionData.data.length > 0) {
        // We expect an array, so we take the first element.
        const connectionDetails = connectionData.data[0];
        setEditingConnection(connectionDetails);

        // Fetch form schema for this connection type
        const schema = await fetchFormSchema(connection.connection_type);
        if (schema) {
          setEditFormSchema(schema);
          setShowEditDialog(true);
        } else {
            toast.error('Could not load the form schema for this connection type.');
        }
      } else {
        toast.error(connectionData.message || 'Connection details not found.');
      }
    } catch (error) {
      console.error('Error fetching connection details:', error);
      toast.error('Failed to load connection details');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete connection
  const handleDelete = async (id: string, module: string) => {
    if (!window.confirm('Are you sure you want to delete this connection?')) {
      return;
    }
    try {
      const token = sessionStorage.getItem('access_token');
      const response = await fetch('/cognito/api/connections/delete-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "authentication": token,
        },
        body: JSON.stringify({
          connection_id: id.toString()
        }),
      });
      const result = await response.json();
      if (result.status) {
        toast.success('Connection deleted successfully');
        fetchConnections(); // Refresh the connections list
      } else {
        fetchConnections();
        toast.error('Failed to delete connection');
      }
    } catch (error) {
        fetchConnections();
      console.error('Error deleting connection:', error);
      toast.error('Failed to delete connection');
    }
  };

  // Split sensitive data from connection config
  const splitSensitiveData = (formData: Record<string, any>, connectorType: string) => {
    const sensitiveFields = new Set<string>(['password', 'api_token', 'api_key', 'private_key']);
    const connectionConfig: Record<string, any> = {};
    const sensitiveData: Record<string, any> = {};

    Object.entries(formData).forEach(([key, value]) => {
      // Skip 'name' and 'is_active' as they're top-level fields
      if (key === 'name' || key === 'is_active') {
        return;
      }

      if (sensitiveFields.has(key)) {
        // Only include sensitive field if it was actually changed (not the placeholder)
        if (value && value !== SENSITIVE_FIELD_PLACEHOLDER) {
          sensitiveData[key] = value;
        }
      } else {
        connectionConfig[key] = value;
      }
    });

    return { connectionConfig, sensitiveData };
  };

  // Handle form submission for editing connection
  const handleEditFormSubmit = async (formData: Record<string, any>) => {
    if (!editingConnection || !editFormSchema) return;

    setIsUpdating(true);
    try {
      const { connectionConfig, sensitiveData } = splitSensitiveData(formData, editingConnection.connection_type);

      const payload = {
        connection_id: editingConnection.id,
        name: formData.name,
        connection_config: connectionConfig,
        sensitive_data: sensitiveData,
        is_active: formData.is_active ? 1 : 0,
      };

      const token = sessionStorage.getItem('access_token');
      const response = await fetch('/cognito/api/connections/update-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "authentication": token,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.status) {
        toast.success('Connection updated successfully');
        handleEditDialogClose();
        fetchConnections();
      } else {
        toast.error(result.message || 'Failed to update connection');
      }
    } catch (error) {
      console.error('[Update Connection] Exception:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update connection');
    } finally {
      setIsUpdating(false);
    }
  };

  const processFormDataWithParams = (formData: Record<string, any>, paramsSchema: Record<string, any>) => {
    const replaceTemplates = (currentSchemaValue: any): any => {
      if (typeof currentSchemaValue === 'string') {
        const pureTemplateMatch = currentSchemaValue.match(/^\{\{([^}]+)\}\}$/);
        if (pureTemplateMatch) {
          const fieldName = pureTemplateMatch[1];
          return formData.hasOwnProperty(fieldName) ? formData[fieldName] : undefined;
        } else {
          return currentSchemaValue.replace(/\{\{([^}]+)\}\}/g, (_match, fieldName) => {
            const value = formData[fieldName];
            if (value === null || value === undefined) {
              return ''; 
            }
            return String(value); 
          });
        }
      } else if (Array.isArray(currentSchemaValue)) {
        return currentSchemaValue.map(replaceTemplates);
      } else if (typeof currentSchemaValue === 'object' && currentSchemaValue !== null) {
        const result: Record<string, any> = {};
        for (const [key, value] of Object.entries(currentSchemaValue)) {
          result[key] = replaceTemplates(value);
        }
        return result;
      }
      return currentSchemaValue;
    };

    return replaceTemplates(paramsSchema);
  };

  // Close form handlers
  const handleFormClose = () => {
    setShowForm(false);
  };

  const handleEditDialogClose = () => {
    setShowEditDialog(false);
    setEditingConnection(null);
    setEditFormSchema(null);
  };

  // Get form title
  const getFormTitle = () => {
    if (editingConnection && editFormSchema) {
      return `Edit ${editFormSchema.display_name || 'Connection'}`;
    }
    return 'Connection';
  };
  
  // Get initial form data for editing
  const getInitialFormData = () => {
    if (editingConnection) {
      const flattenedData: Record<string, any> = { ...editingConnection };
      if (editingConnection.ssh_tunnel) {
        Object.entries(editingConnection.ssh_tunnel).forEach(([key, value]) => {
          flattenedData[`ssh_tunnel.${key}`] = value;
        });
      }
      return flattenedData;
    }
    return {};
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge
        variant={isActive ? "default" : "secondary"}
        className={isActive ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-gray-100 text-gray-800 hover:bg-gray-100"}
      >
        {isActive ? "Active" : "Inactive"}
      </Badge>
    );
  };

  const columns = [
    { title: 'Connection Name', key: 'name' },
    { title: 'Type', key: 'type' },
    { title: 'Host/URL', key: 'host' },
    { title: 'Status', key: 'status' },
  ];

  const tableData = connections.map((conn) => ({
    name: conn.name || 'N/A',
    type: conn.connection_type || 'N/A',
    host: conn.connection_config?.host || conn.connection_config?.base_url || 'N/A',
    status: conn.is_active ? 'Active' : 'Inactive',
    actions: (
      <div className="flex items-center gap-2">
        <button onClick={() => handleEdit(conn)} className="text-blue-600 hover:text-blue-800">
          <Edit size={18} />
        </button>
        <button onClick={() => handleDelete(conn.id, conn.connection_type)} className="text-red-600 hover:text-red-800">
          <Trash2 size={18} />
        </button>
      </div>
    ),
  }));

  if (connectionsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Connections</h2>
          <p className="text-gray-600 text-sm mt-1">Manage your external system connections and integrations</p>
        </div>
        <Button
          onClick={handleAddNew}
          className="px-6 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Source
        </Button>
      </div>

      <CustomTable columns={columns} data={tableData} responsive={true} />

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0 sm:p-0">
          <DialogHeader className="flex-shrink-0 border-b border-gray-200 pb-4 px-6 pt-6">
            <div className="flex items-center justify-between pr-8">
              <DialogTitle className="text-xl font-semibold text-gray-900">
                {getFormTitle()}
              </DialogTitle>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleEditDialogClose}
                  className="px-4 py-2"
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    // Trigger form submit programmatically
                    const form = document.getElementById('edit-connection-form') as HTMLFormElement;
                    form?.requestSubmit();
                  }}
                  className="px-4 py-2 flex items-center gap-2"
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </>
                  ) : (
                    'Update Connection'
                  )}
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 pt-4 pb-6">
            {loading ? (
              <div className="flex items-center justify-center h-full py-8">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                  <div className="text-center">
                    <div className="text-gray-900 font-medium">Loading form...</div>
                    <div className="text-gray-500 text-sm">Preparing connection details</div>
                  </div>
                </div>
              </div>
            ) : editFormSchema ? (
              <>
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">💡 Tip:</span> Sensitive fields (passwords, API keys) are shown as {SENSITIVE_FIELD_PLACEHOLDER}.
                    Leave them unchanged to keep existing credentials, or enter new values to update them.
                  </p>
                </div>
                <CredDynamicForm
                  formSchema={editFormSchema}
                  onSubmit={handleEditFormSubmit}
                  onCancel={handleEditDialogClose}
                  initialData={initialEditData}
                  layout={3}
                  submitButtonText="Update Connection"
                  onCustomAction={handleCustomAction}
                  isActionLoading={isActionLoading}
                  formId="edit-connection-form"
                  hideFooter={true}
                />
              </>
            ) : (
              <div className="flex items-center justify-center h-full p-6">
                 <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load edit form</h3>
                    <p className="text-gray-600 mb-4">Unable to load the form for editing this connection.</p>
                    <Button onClick={handleEditDialogClose} variant="outline">Close</Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Connector Selection Modal */}
      <ConnectorSelectionModal
        open={showConnectorModal}
        onOpenChange={setShowConnectorModal}
        onConnectionCreated={fetchConnections}
      />

      {/* Toast Notifications */}
      <Toaster position="top-right" richColors />
    </div>
  );
};


export default CredentialsVault;

