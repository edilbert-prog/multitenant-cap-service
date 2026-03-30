import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ValidationTabView/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ValidationTabView/ui/dialog";
import { toast, Toaster } from "sonner";
import { Plus, Trash2, Edit } from 'lucide-react';
import CustomTable from '../../../utils/CustomTable';
import CredDynamicForm from "@/components/ValidationTabView/Credentials-Vault/CredVaultPage/CredForm";

interface LLMConnection {
  id: string;
  name: string;
  connection_type: string;
  connection_config: {
    base_url?: string;
    default_flag?: boolean;
    description?: string;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface FormSchema {
  connector_id: string;
  display_name: string;
  group: string;
  icon: string;
  description: string;
  fields: any[];
}

const LLMConnections: React.FC = () => {
  const [connections, setConnections] = useState<LLMConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingConnection, setEditingConnection] = useState<LLMConnection | null>(null);
  const [formSchema, setFormSchema] = useState<FormSchema | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchLLMConnections();
    fetchLLMSchema();
  }, []);

  const fetchLLMConnections = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('access_token');
      const response = await fetch('/cognito/api/connections/get-connections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authentication': token || '',
        },
        body: JSON.stringify({
          connection_type: 'llm-engine'
        }),
      });

      const data = await response.json();
      if (data.status && data.data) {
        setConnections(data.data);
      } else {
        setConnections([]);
      }
    } catch (error) {
      console.error('Error fetching LLM connections:', error);
      toast.error('Failed to load LLM configurations');
      setConnections([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLLMSchema = async () => {
    try {
      const token = sessionStorage.getItem('access_token');
      const response = await fetch('/cognito/api/connections/get-connector-schemas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authentication': token || '',
        },
        body: JSON.stringify({}),
      });

      const result = await response.json();
      if (result.status && result.data) {
        const llmSchema = result.data.find((s: any) => s.connector_id === 'llm-engine');
        if (llmSchema) {
          setFormSchema({
            connector_id: llmSchema.connector_id,
            display_name: llmSchema.display_name,
            group: llmSchema.group,
            icon: llmSchema.icon,
            description: llmSchema.description,
            fields: llmSchema.fields.map((field: any) => {
              if (field.type === 'boolean' || field.type === 'checkbox') {
                return { ...field, type: 'checkbox' };
              }
              return field;
            })
          });
        }
      }
    } catch (error) {
      console.error('Error fetching LLM schema:', error);
      toast.error('Failed to load form schema');
    }
  };

  const handleAdd = () => {
    setEditingConnection(null);
    setShowModal(true);
  };

  const handleEdit = (connection: LLMConnection) => {
    setEditingConnection(connection);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this LLM configuration?')) {
      return;
    }

    try {
      const token = sessionStorage.getItem('access_token');
      const response = await fetch('/cognito/api/connections/delete-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authentication': token || '',
        },
        body: JSON.stringify({ connection_id: id }),
      });

      const result = await response.json();
      if (result.status) {
        toast.success('LLM configuration deleted successfully');
        fetchLLMConnections();
      } else {
        toast.error(result.message || 'Failed to delete configuration');
      }
    } catch (error) {
      console.error('Error deleting LLM config:', error);
      toast.error('Failed to delete configuration');
    }
  };

  const splitSensitiveData = (formData: Record<string, any>) => {
    const connectionConfig: Record<string, any> = {};
    const sensitiveData: Record<string, any> = {};
    const sensitiveFields = new Set(['api_key']);

    Object.entries(formData).forEach(([key, value]) => {
      // Skip provider since it becomes the name
      if (key === 'provider') {
        return;
      }

      if (sensitiveFields.has(key)) {
        if (value && value !== '••••••••') {
          sensitiveData[key] = value;
        }
      } else {
        connectionConfig[key] = value;
      }
    });

    // Store provider in config for reference
    connectionConfig.provider = formData.provider;

    return { connectionConfig, sensitiveData };
  };

  const handleSubmit = async (formData: Record<string, any>) => {
    setIsSubmitting(true);
    try {
      // Validate provider is selected
      if (!formData.provider) {
        toast.error('Please select a provider');
        setIsSubmitting(false);
        return;
      }

      // Check for duplicate provider (only when creating or changing provider)
      if (!editingConnection || editingConnection.name !== formData.provider) {
        const duplicate = connections.find(
          conn => conn.name === formData.provider && conn.id !== editingConnection?.id
        );
        if (duplicate) {
          toast.error(`${formData.provider} configuration already exists. Only one configuration per provider is allowed.`);
          setIsSubmitting(false);
          return;
        }
      }

      const { connectionConfig, sensitiveData } = splitSensitiveData(formData);
      const token = sessionStorage.getItem('access_token');

      // If setting as default, we need to unset other defaults
      const isDefault = formData.default_flag || false;

      if (editingConnection) {
        // Update existing
        const response = await fetch('/cognito/api/connections/update-connection', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'authentication': token || '',
          },
          body: JSON.stringify({
            connection_id: editingConnection.id,
            name: formData.provider, // Provider is the name
            connection_config: connectionConfig,
            sensitive_data: sensitiveData,
            is_active: isDefault ? 1 : 0, // is_active represents the default flag
          }),
        });

        const result = await response.json();
        if (result.status) {
          toast.success('LLM configuration updated successfully');
          setShowModal(false);
          fetchLLMConnections();
        } else {
          toast.error(result.message || 'Failed to update configuration');
        }
      } else {
        // Create new
        const response = await fetch('/cognito/api/connections/create-connection', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'authentication': token || '',
          },
          body: JSON.stringify({
            name: formData.provider, // Provider is the name
            connection_type: 'llm-engine',
            group_type: 'ai',
            connection_config: connectionConfig,
            sensitive_data: sensitiveData,
            is_active: isDefault ? 1 : 0, // is_active represents the default flag
          }),
        });

        const result = await response.json();
        if (result.status) {
          toast.success('LLM configuration created successfully');
          setShowModal(false);
          fetchLLMConnections();
        } else {
          toast.error(result.message || 'Failed to create configuration');
        }
      }
    } catch (error) {
      console.error('Error submitting LLM config:', error);
      toast.error('An error occurred while saving');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitialFormData = () => {
    if (!editingConnection) return {};

    const data: Record<string, any> = {
      provider: editingConnection.name, // Provider is the name
      default_flag: editingConnection.is_active, // is_active represents default flag
    };

    // Flatten connection_config
    if (editingConnection.connection_config) {
      Object.entries(editingConnection.connection_config).forEach(([key, value]) => {
        data[key] = value;
      });
    }

    // Mask sensitive field
    data.api_key = '••••••••';

    return data;
  };

  const columns = [
    { title: 'Engine Name', key: 'name' },
    { title: 'Base URL', key: 'base_url' },
    { title: 'Default', key: 'default_flag' },
    { title: 'Status', key: 'status' },
  ];

  const tableData = connections.map((conn) => ({
    name: conn.name,
    base_url: conn.connection_config?.base_url || 'N/A',
    default_flag: conn.connection_config?.default_flag ? 'Yes' : 'No',
    status: conn.is_active ? 'Active' : 'Inactive',
    actions: (
      <div className="flex items-center gap-2">
        <button onClick={() => handleEdit(conn)} className="text-blue-600 hover:text-blue-800">
          <Edit size={18} />
        </button>
        <button onClick={() => handleDelete(conn.id)} className="text-red-600 hover:text-red-800">
          <Trash2 size={18} />
        </button>
      </div>
    ),
  }));

  if (loading) {
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
          <h2 className="text-xl font-semibold text-gray-900">LLM Engine Configurations</h2>
          <p className="text-gray-600 text-sm mt-1">Manage Large Language Model API configurations</p>
        </div>
        <Button onClick={handleAdd} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add LLM Config
        </Button>
      </div>

      <CustomTable columns={columns} data={tableData} responsive={true} />

      {/* Add/Edit Dialog */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 sm:p-0">
          <DialogHeader className="flex-shrink-0 border-b border-gray-200 pb-4 px-6 pt-6">
            <div className="flex items-center justify-between pr-8">
              <DialogTitle className="text-xl font-semibold text-gray-900">
                {editingConnection ? 'Edit LLM Configuration' : 'Add LLM Configuration'}
              </DialogTitle>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    const form = document.getElementById('llm-config-form') as HTMLFormElement;
                    form?.requestSubmit();
                  }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : editingConnection ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 pt-4 pb-6">
            {formSchema && (
              <CredDynamicForm
                formSchema={{
                  id: 0,
                  form_id: formSchema.connector_id,
                  name: formSchema.connector_id,
                  display_name: formSchema.display_name,
                  icon: formSchema.icon,
                  description: formSchema.description,
                  group: formSchema.group,
                  enabled: true,
                  fields: formSchema.fields.map(field => {
                    // Disable provider field when editing
                    if (field.name === 'provider' && editingConnection) {
                      return {
                        ...field,
                        disabled: true,
                        info: 'Provider cannot be changed'
                      };
                    }
                    return field;
                  }),
                  save_connection: {
                    name: 'save_connection',
                    klass: 'llm-engine',
                    module: 'ai',
                    params: {}
                  }
                }}
                onSubmit={handleSubmit}
                onCancel={() => setShowModal(false)}
                initialData={getInitialFormData()}
                layout={2}
                submitButtonText={editingConnection ? "Update" : "Create"}
                formId="llm-config-form"
                hideFooter={true}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Toaster position="top-right" richColors />
    </div>
  );
};

export default LLMConnections;
