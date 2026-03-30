import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ValidationTabView/ui/dialog";
import { Card, CardContent } from "@/components/ValidationTabView/ui/card";
import { Button } from "@/components/ValidationTabView/ui/button";
import { Skeleton } from "@/components/ValidationTabView/ui/skeleton";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import ForwardedIconComponent from '../components/common/genericIconComponent';
import CredDynamicForm from './CredForm';

interface ConnectorSchema {
  connector_id: string;
  display_name: string;
  group: string;
  icon: string;
  description?: string;
  fields: any[];
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

interface ConnectorSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnectionCreated?: () => void;
}

const SUPPORTED_CONNECTORS = [
  'postgres',
  'mysql',
  'jira',
  'signaveo',
  'sap-odata',
  'sap-database',
  'sap-bapi',
  'sap-soap'
];

const ConnectorSelectionModal: React.FC<ConnectorSelectionModalProps> = ({ open, onOpenChange, onConnectionCreated }) => {
  const [connectors, setConnectors] = useState<ConnectorSchema[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedConnector, setSelectedConnector] = useState<ConnectorSchema | null>(null);
  const [connectorFormSchema, setConnectorFormSchema] = useState<FormSchema | null>(null);
  const [connectorSchema, setConnectorSchema] = useState<ConnectorSchema | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (open) {
      fetchConnectorSchemas();
      setSelectedConnector(null);
      setConnectorFormSchema(null);
    }
  }, [open]);

  const fetchConnectorSchemas = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('access_token');
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
        // Filter to show only supported connectors
        const filteredConnectors = result.data.filter((connector: ConnectorSchema) =>
          SUPPORTED_CONNECTORS.includes(connector.connector_id)
        );
        setConnectors(filteredConnectors);
      } else {
        toast.error(result.message || 'Failed to load connectors');
        setConnectors([]);
      }
    } catch (error) {
      console.error('Error fetching connector schemas:', error);
      toast.error('Failed to load connector schemas');
      setConnectors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectorSelect = async (connector: ConnectorSchema) => {
    setSelectedConnector(connector);
    setConnectorSchema(connector);

    // Build form schema directly from connector schema
    setFormLoading(true);
    try {
      // Transform fields to match CredDynamicForm expected format
      const transformedFields = connector.fields.map((field: any) => {
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

      const formSchema: FormSchema = {
        id: 0,
        form_id: connector.connector_id,
        name: connector.connector_id,
        display_name: connector.display_name,
        icon: connector.icon,
        description: connector.description || '',
        group: connector.group,
        enabled: true,
        fields: transformedFields,
        save_connection: {
          name: 'save_connection',
          klass: 'create-connection',
          module: 'connections',
          params: {}
        }
      };
      setConnectorFormSchema(formSchema);
    } catch (error) {
      console.error('[ConnectorModal] Error building form schema:', error);
      toast.error("Failed to load form");
      setConnectorFormSchema(null);
    } finally {
      setFormLoading(false);
    }
  };

  const handleBackToSelection = () => {
    setSelectedConnector(null);
    setConnectorFormSchema(null);
    setConnectorSchema(null);
  };

  const splitSensitiveData = (formData: Record<string, any>) => {
    const sensitiveFields = new Set<string>();
    const connectionConfig: Record<string, any> = {};
    const sensitiveData: Record<string, any> = {};

    if (connectorSchema && connectorSchema.fields) {
      connectorSchema.fields.forEach((field: any) => {
        if (field.sensitive) {
          sensitiveFields.add(field.name);
        }
      });
    }

    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'name' || key === 'is_active') {
        return;
      }

      if (sensitiveFields.has(key)) {
        sensitiveData[key] = value;
      } else {
        connectionConfig[key] = value;
      }
    });

    return { connectionConfig, sensitiveData };
  };

  const handleTestConnection = async (formData: Record<string, any>) => {
    if (!connectorFormSchema || !connectorSchema) {
      toast.error("Form schema not available. Cannot test connection.");
      return;
    }

    setIsTesting(true);
    try {
      const { connectionConfig, sensitiveData } = splitSensitiveData(formData);

      const payload = {
        connection_type: selectedConnector?.connector_id || connectorFormSchema.form_id,
        connection_config: connectionConfig,
        sensitive_data: sensitiveData,
      };

      const token = sessionStorage.getItem('access_token');
      const response = await fetch('/cognito/api/connections/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "authentication": token,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.status) {
        toast.success(result.message || 'Connection test successful!');
      } else {
        toast.error(result.message || 'Connection test failed.');
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      toast.error('An error occurred while testing the connection.');
    } finally {
      setIsTesting(false);
    }
  };

  const handleCustomAction = async (actionField: any, formData: Record<string, any>) => {
    const { name: actionName } = actionField;

    if (actionName === 'test_connection') {
      await handleTestConnection(formData);
      return;
    }
  };

  const handleFormSubmit = async (formData: Record<string, any>) => {
    if (!connectorFormSchema || !connectorSchema) return;

    try {
      setFormLoading(true);

      const { connectionConfig, sensitiveData } = splitSensitiveData(formData);

      const payload = {
        name: formData.name,
        connection_type: selectedConnector?.connector_id || connectorFormSchema.form_id,
        group_type: connectorSchema?.group || connectorFormSchema.group || 'databases',
        connection_config: connectionConfig,
        sensitive_data: sensitiveData,
        is_active: formData.is_active ? 1 : 0,
      };

      const token = sessionStorage.getItem('access_token');
      const response = await fetch('/cognito/api/connections/create-connection', {
        method: "POST",
        headers: { "Content-Type": "application/json", "authentication": token },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (result.status) {
        toast.success("Connection created successfully");
        onOpenChange(false);
        if (onConnectionCreated) {
          onConnectionCreated();
        }
      } else {
        toast.error(result.message || "Failed to create connection");
      }
    } catch (error) {
      console.error("Error creating connection:", error);
      toast.error("Failed to create connection");
    } finally {
      setFormLoading(false);
    }
  };

  const groupedConnectors = connectors.reduce((acc, connector) => {
    const group = connector.group || 'Other';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(connector);
    return acc;
  }, {} as Record<string, ConnectorSchema[]>);

  const ConnectorCardSkeleton = () => (
    <Card className="h-32 animate-pulse">
      <CardContent className="p-6 h-full flex flex-col">
        <div className="flex items-center space-x-3 mb-4">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <Skeleton className="h-5 w-24" />
        </div>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </CardContent>
    </Card>
  );

  const renderConnectorCard = (connector: ConnectorSchema) => {
    return (
      <Card
        key={connector.connector_id}
        className="relative group h-auto cursor-pointer bg-white transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg hover:-translate-y-1 border border-gray-200 hover:border-blue-400 hover:bg-blue-50"
        onClick={() => handleConnectorSelect(connector)}
      >
        <CardContent className="p-4 h-full flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-gray-100 group-hover:bg-blue-100 transition-colors flex items-center justify-center min-w-[48px] min-h-[48px]">
              {connector.icon ? (
                <ForwardedIconComponent className="w-8 h-8" name={connector.icon} />
              ) : (
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              )}
            </div>
            <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-700 transition-colors flex-1">
              {connector.display_name}
            </h3>
          </div>
          {connector.description && (
            <p className="text-sm text-gray-600 group-hover:text-gray-800 line-clamp-2 leading-relaxed pl-[60px]">
              {connector.description}
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderConnectorGroup = (title: string, connectorsToRender: ConnectorSchema[]) => (
    <div key={title} className="mb-6">
      <div className="flex items-center mb-4">
        <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide">
          {title.replace('_', ' ')}
        </h2>
        <div className="ml-4 flex-1 h-px bg-gray-300"></div>
        <span className="ml-4 text-xs font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
          {connectorsToRender.length} connector{connectorsToRender.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {connectorsToRender.map((connector) => renderConnectorCard(connector))}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 border-b border-gray-200 pb-4 px-6 pt-6">
          {selectedConnector && (
            <Button
              onClick={handleBackToSelection}
              variant="ghost"
              className="mb-2 -ml-2 flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Connectors
            </Button>
          )}
          <DialogTitle className="text-xl font-semibold text-gray-900">
            {selectedConnector ? `Create ${selectedConnector.display_name} Connection` : 'Select a Data Source'}
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-1">
            {selectedConnector
              ? `Configure your ${selectedConnector.display_name} connection`
              : 'Choose from available connectors to create a new connection'
            }
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {selectedConnector ? (
            // Form view
            formLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                  <div className="text-center">
                    <div className="text-gray-900 font-medium">Loading form...</div>
                    <div className="text-gray-500 text-sm">Preparing connection form</div>
                  </div>
                </div>
              </div>
            ) : connectorFormSchema ? (
              <div className="h-full overflow-y-auto pt-4">
                <CredDynamicForm
                  formSchema={connectorFormSchema}
                  onSubmit={handleFormSubmit}
                  onCancel={handleBackToSelection}
                  initialData={{}}
                  layout={3}
                  submitButtonText="Create Connection"
                  onCustomAction={handleCustomAction}
                  isActionLoading={{...isActionLoading, test_connection: isTesting}}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full p-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load form</h3>
                  <p className="text-gray-600 mb-4">Unable to load the connection form</p>
                  <Button onClick={handleBackToSelection} variant="outline">Go Back</Button>
                </div>
              </div>
            )
          ) : (
            // Connector selection view
            loading ? (
            <div className="space-y-8 pt-4">
              {['Databases', 'ERP', 'Project Management'].map((groupName) => (
                <div key={groupName} className="mb-8">
                  <div className="flex items-center mb-4">
                    <Skeleton className="h-5 w-32" />
                    <div className="ml-4 flex-1 h-px bg-gray-200"></div>
                    <Skeleton className="ml-4 h-5 w-16 rounded-full" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <ConnectorCardSkeleton key={index} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : Object.keys(groupedConnectors).length > 0 ? (
            <div className="pt-4">
              {Object.entries(groupedConnectors).map(([groupName, groupConnectors]) =>
                renderConnectorGroup(groupName, groupConnectors)
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No connectors available</h3>
                <p className="text-gray-600">Check back later for available data sources</p>
              </div>
            </div>
          )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectorSelectionModal;
