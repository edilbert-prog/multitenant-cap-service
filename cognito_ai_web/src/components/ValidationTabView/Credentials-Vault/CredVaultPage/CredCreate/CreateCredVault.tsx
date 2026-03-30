import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { Button } from "@/components/ValidationTabView/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ValidationTabView/ui/card";
import { Badge } from "@/components/ValidationTabView/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Database, Loader2,Pencil } from "lucide-react";
import CredDynamicForm from "../CredForm";
import ForwardedIconComponent from '../../components/common/genericIconComponent';

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

interface ConnectorConnection {
  id: number;
  name: string;
  is_active: boolean;
  connection_type: string;
  created_at: string;
  updated_at: string;
}

type CredCreateProps = {
  sourceFormId?: string;
  showBackButtonIf?: string;
};

const CredCreate: React.FC<CredCreateProps> = ({
                                                 sourceFormId,
                                                 showBackButtonIf = "false",
                                               }) => {
  // let {props} = props;
  // console.log("props", sourceFormId);
  const navigate = useNavigate();
  // let selectedConnectorId = props?.props;
  const { selectedConnectorId } = useParams<{ selectedConnectorId: string }>();

  const [selectedConnector, setSelectedConnector] = useState<Connector | null>(
      null
  );
  const [connectorFormSchema, setConnectorFormSchema] =
      useState<FormSchema | null>(null);
  const [connectorConnections, setConnectorConnections] = useState<
      ConnectorConnection[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [connectorConnectionsLoading, setConnectorConnectionsLoading] =
      useState(false);
  const [connectorLoading, setConnectorLoading] = useState(true);

  const [isTesting, setIsTesting] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState<
      Record<string, boolean>
  >({});

  const stableInitialData = useMemo(() => ({}), []);
  const [editingConnection, setEditingConnection] = useState<any | null>(null);
  const [connectorSchema, setConnectorSchema] = useState<any>(null);

  useEffect(() => {
    if (selectedConnectorId) {
      initializeConnector(selectedConnectorId);
    } else if (sourceFormId) {
      initializeConnector(sourceFormId);
    }
  }, [selectedConnectorId, sourceFormId]);

  const initializeConnector = async (connectorId: string) => {
    try {
      setConnectorLoading(true);
      const connector: Connector = {
        id: connectorId,
        name: connectorId.charAt(0).toUpperCase() + connectorId.slice(1),
        icon: connectorId,
        description: `${connectorId} database connection`,
        display_name:
            connectorId.charAt(0).toUpperCase() + connectorId.slice(1),
      };
      setSelectedConnector(connector);
      await Promise.all([
        fetchFormSchema(connectorId),
        fetchConnectorConnections(connectorId),
        fetchConnectorSchema(connectorId),
      ]);
    } catch (error) {
      console.error("Error initializing connector:", error);
      toast.error("Failed to load connector details");
      navigate("/CredentialVault");
    } finally {
      setConnectorLoading(false);
    }
  };

  // Fetch connections for specific connector
  const fetchConnectorConnections = async (connectorId: string) => {
    try {
      setConnectorConnectionsLoading(true);
      const token = sessionStorage.getItem('access_token');
      const response = await fetch("/cognito/api/connections/get-connections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json", "authentication": token,
        },
        body: JSON.stringify({
          connection_type: connectorId,
        }),
      });

      const result = await response.json();
      if (result.status && result.data) {
        setConnectorConnections(result.data);
      } else {
        setConnectorConnections([]);
      }
    } catch (error) {
      console.error("Error fetching connector connections:", error);
      setConnectorConnections([]);
    } finally {
      setConnectorConnectionsLoading(false);
    }
  };

  const fetchFormSchema = async (formId: string) => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('access_token');
      const response = await fetch("/api/react-forms/get-form", {
        method: "POST",
        headers: {
          "Content-Type": "application/json", "authentication": token,
        },
        body: JSON.stringify({
          form_id: formId,
          form_type: "connection_vault",
        }),
      });
      const result = await response.json();
      if (result.status && result.data && result.data.length > 0) {
        setConnectorFormSchema(result.data[0]);
      } else {
        setConnectorFormSchema(null);
      }
    } catch (error) {
      console.error("Error fetching form schema:", error);
      toast.error("Failed to load form schema");
      setConnectorFormSchema(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchConnectorSchema = async (connectorId: string) => {
    try {
      const token = sessionStorage.getItem('access_token');
      const response = await fetch("/cognito/api/connections/get-connector-schemas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "authentication": token,
        },
        body: JSON.stringify({}),
      });
      const result = await response.json();
      if (result.status && result.data) {
        const schema = result.data.find((s: any) => s.connector_id === connectorId);
        if (schema) {
          setConnectorSchema(schema);
        }
      }
    } catch (error) {
      console.error("Error fetching connector schema:", error);
    }
  };

  const handleTestConnection = async (formData: Record<string, any>) => {
    if (!connectorFormSchema || !connectorSchema) {
      toast.error("Form schema not available. Cannot test connection.");
      return;
    }

    setIsTesting(true);
    try {
      // Split into sensitive and non-sensitive data
      const { connectionConfig, sensitiveData } = splitSensitiveData(formData);

      const payload = {
        connection_type: selectedConnectorId || connectorFormSchema.form_id,
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

  const handleCustomAction = async (
      actionField: any,
      formData: Record<string, any>
  ) => {
    const { name: actionName, fetch: actionConfig } = actionField;

    // Handle test connection action
    if (actionName === 'test_connection') {
      await handleTestConnection(formData);
      return;
    }

    if (
        !actionConfig ||
        !actionConfig.klass ||
        !actionConfig.module ||
        !actionConfig.params
    ) {
      toast.error("Action configuration is invalid.");
      return;
    }

    setIsActionLoading((prev) => ({ ...prev, [actionName]: true }));
    try {
      const { module, klass, params, method } = actionConfig;
      const apiUrl = `/api/${module}/${klass}`;
      const processedPayload = processFormDataWithParams(formData, params);
      const token = sessionStorage.getItem('access_token');
      const response = await fetch(apiUrl, {
        method: method || "POST",
        headers: { "Content-Type": "application/json", "authentication": token, },
        body: JSON.stringify(processedPayload),
      });

      const result = await response.json();

      if (result.status) {
        toast.success(result.message || "Action completed successfully!");
      } else {
        toast.error(result.message || "Action failed.");
      }
    } catch (error) {
      console.error(`Error performing action '${actionName}':`, error);
      toast.error("An error occurred while performing the action.");
    } finally {
      setIsActionLoading((prev) => ({ ...prev, [actionName]: false }));
    }
  };

  const processFormDataWithParams = (
      formData: Record<string, any>,
      paramsSchema: Record<string, any>
  ) => {
    const replaceTemplates = (currentSchemaValue: any): any => {
      if (typeof currentSchemaValue === "string") {
        const pureTemplateMatch = currentSchemaValue.match(/^\{\{([^}]+)\}\}$/);
        if (pureTemplateMatch) {
          const fieldName = pureTemplateMatch[1];
          return formData.hasOwnProperty(fieldName)
              ? formData[fieldName]
              : undefined;
        } else {
          return currentSchemaValue.replace(
              /\{\{([^}]+)\}\}/g,
              (_match, fieldName) => {
                const value = formData[fieldName];
                if (value === null || value === undefined) {
                  return "";
                }
                return String(value);
              }
          );
        }
      } else if (Array.isArray(currentSchemaValue)) {
        return currentSchemaValue.map(replaceTemplates);
      } else if (
          typeof currentSchemaValue === "object" &&
          currentSchemaValue !== null
      ) {
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

  const getIconNameForConnector = (iconName: string): string => {
    const iconMapping: { [key: string]: string } = {
      email: "Email",
      sftp: "SFTP",
      postgresql: "postgres-sql",
      mysql: "Mysql",
      oracle: "Oracle",
      mssql: "MSsql",
      s4hana: "SAP-Hana",
      salesforce: "salesforce",
      s3: "AmazonS3",
      elasticsearch: "ElasticSearch",
      dynamodb: "Dynamodb",
      redis: "Redis",
      mongodb: "MongoDB",
      csv: "CSV",
      excel: "Excel",
      parquet: "Parquet",
      feather: "FixedFormat",
      json: "Json",
      slack: "Slack",
      sendgrid: "Sendgrid",
      teams: "Teams",
    };
    return iconMapping[iconName?.toLowerCase()] || iconName;
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
        <Badge
            variant={isActive ? "default" : "secondary"}
            className={
              isActive
                  ? "bg-green-100 text-green-800 hover:bg-green-100"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-100"
            }
        >
          {isActive ? "Active" : "Inactive"}
        </Badge>
    );
  };

  const getFormTitle = () => {
    if (selectedConnector) {
      return `Create ${
          connectorFormSchema?.display_name ||
          selectedConnector.name ||
          "Connection"
      }`;
    }
    return "Connection";
  };

  const handleCancel = () => {
    navigate(-1);
  };

  if (connectorLoading) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <div className="text-center">
              <div className="text-gray-900 font-medium">
                Loading connector...
              </div>
              <div className="text-gray-500 text-sm">
                Preparing connector details
              </div>
            </div>
          </div>
        </div>
    );
  }

  if (!selectedConnector) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Connector not found
            </h3>
            <p className="text-gray-600 mb-4">
              The requested connector could not be found.
            </p>
            <Button onClick={() => navigate("/CredentialVault")}>
              Back to Connection Vault
            </Button>
          </div>
        </div>
    );
  }

  const handleEdit = async (connection: ConnectorConnection) => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('access_token');
      const response = await fetch(`/cognito/api/connections/get-connections`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "authentication": token, },
        body: JSON.stringify({ connection_id: connection.id.toString() }),
      });

      const result = await response.json();
      if (result.status && result.data && result.data.length > 0) {
        setEditingConnection(result.data[0]);
      } else {
        toast.error(
            result.message || "Failed to load connection details for editing."
        );
      }
    } catch (error) {
      console.error("Error fetching connection for edit:", error);
      toast.error("An error occurred while preparing the edit form.");
    } finally {
      setLoading(false);
    }
  };

  const splitSensitiveData = (formData: Record<string, any>) => {
    const sensitiveFields = new Set<string>();
    const connectionConfig: Record<string, any> = {};
    const sensitiveData: Record<string, any> = {};

    // Identify sensitive fields from connector schema
    if (connectorSchema && connectorSchema.fields) {
      connectorSchema.fields.forEach((field: any) => {
        if (field.sensitive) {
          sensitiveFields.add(field.name);
        }
      });
    }

    // Split form data
    Object.entries(formData).forEach(([key, value]) => {
      // Skip 'name' and 'is_active' as they're top-level fields
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

  const handleFormSubmit = async (formData: Record<string, any>) => {
    if (!connectorFormSchema) return;
    if (editingConnection) {
      try {
        setLoading(true);

        // Split into sensitive and non-sensitive data
        const { connectionConfig, sensitiveData } = splitSensitiveData(formData);

        const payload = {
          connection_id: editingConnection.id,
          name: formData.name,
          connection_config: connectionConfig,
          sensitive_data: sensitiveData,
          is_active: formData.is_active !== undefined ? formData.is_active : true,
        };

        const token = sessionStorage.getItem('access_token');
        const response = await fetch('/cognito/api/connections/update-connection', {
          method: "POST",
          headers: { "Content-Type": "application/json", "authentication": token, },
          body: JSON.stringify(payload),
        });

        const result = await response.json();
        if (result.status) {
          toast.success("Connection updated successfully");
          setEditingConnection(null);
          if (selectedConnectorId) {
            fetchConnectorConnections(selectedConnectorId);
          }
        } else {
          toast.error(result.message || "Failed to update connection");
        }
      } catch (error) {
        console.error("Error updating connection:", error);
        toast.error("Failed to update connection");
      } finally {
        setLoading(false);
      }
    } else {
      try {
        setLoading(true);

        // Split into sensitive and non-sensitive data
        const { connectionConfig, sensitiveData } = splitSensitiveData(formData);

        const payload = {
          name: formData.name,
          connection_type: selectedConnectorId || connectorFormSchema.form_id,
          group_type: connectorSchema?.group || connectorFormSchema.group || 'databases',
          connection_config: connectionConfig,
          sensitive_data: sensitiveData,
          is_active: formData.is_active !== undefined ? formData.is_active : true,
        };

        const token = sessionStorage.getItem('access_token');
        const response = await fetch('/cognito/api/connections/create-connection', {
          method: "POST",
          headers: { "Content-Type": "application/json", "authentication": token, },
          body: JSON.stringify(payload),
        });

        const result = await response.json();
        if (result.status) {
          toast.success("Connection created successfully");
          if (selectedConnectorId) {
            await fetchConnectorConnections(selectedConnectorId);
          }
        } else {
          toast.error(result.message || "Failed to create connection");
        }
      } catch (error) {
        console.error("Error creating connection:", error);
        toast.error("Failed to create connection");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between mx-auto">
            <div className="flex items-center space-x-4">
              <Button
                  onClick={() => navigate(-1)}
                  variant="ghost"
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sources
              </Button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center space-x-3">
                {selectedConnector && (
                    <div className="rounded-lg bg-white p-1.5 shadow-sm border flex items-center justify-center">
                      <ForwardedIconComponent
                          name={getIconNameForConnector(selectedConnector.icon)}
                          className="w-10 h-10"
                      />
                    </div>
                )}
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                    {editingConnection
                        ? `Editing '${editingConnection.name}'`
                        : getFormTitle()}
                    {editingConnection && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingConnection(null)}
                        >
                          Cancel Edit
                        </Button>
                    )}
                  </h1>
                  <p className="text-sm text-gray-600">
                    {editingConnection
                        ? `Update the details for this connection.`
                        : selectedConnector?.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden p-2">
          <div className="mx-auto h-full">
            <div className="grid grid-cols-12 gap-2 h-full">
              {/* Left side - Existing Connections */}
              <div className="col-span-4">
                <Card className="h-157 flex flex-col shadow-lg border-0 bg-white">
                  <CardHeader className="flex-shrink-0 pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Database className="w-5 h-5" />
                      Existing Connections
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedConnector?.name} connections (
                      {connectorConnections.length})
                    </p>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-hidden p-0">
                    <div className="h-full overflow-y-auto px-6 pb-6">
                      {connectorConnectionsLoading ? (
                          <div className="flex items-center justify-center h-32">
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                              <span className="text-sm text-gray-500">
                            Loading connections...
                          </span>
                            </div>
                          </div>
                      ) : connectorConnections.length === 0 ? (
                          <div className="flex items-center justify-center h-32">
                            <div className="text-center">
                              <Database className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                              <p className="text-gray-500">
                                No existing connections
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                Create your first connection using the form
                              </p>
                            </div>
                          </div>
                      ) : (
                          <div className="space-y-3">
                            {connectorConnections.map((connection) => (
                                <div
                                    key={connection.id}
                                    className={`border rounded-lg p-4 transition-all ${
                                        editingConnection?.id === connection.id
                                            ? "border-blue-500 shadow-md bg-blue-50/50"
                                            : "border-gray-200 hover:shadow-sm"
                                    }`}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-medium text-gray-900 truncate">
                                        {connection.name}
                                      </h4>
                                      <p className="text-xs text-gray-500 mt-1">
                                        Created:{" "}
                                        {new Date(
                                            connection.created_at
                                        ).toLocaleDateString()}
                                      </p>
                                    </div>
                                    <div className="flex-shrink-0 ml-2 flex items-center gap-2">
                                      {getStatusBadge(connection.is_active)}
                                      <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleEdit(connection)}
                                          disabled={loading}
                                      >
                                        <Pencil className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                            ))}
                          </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right side - Form */}
              <div className="col-span-8">
                <Card className="h-157 p-[0.115rem] flex flex-col shadow-lg border-0 bg-white">
                  <CardContent className="flex-1 overflow-hidden p-0">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="flex flex-col items-center gap-4">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                            <div className="text-center">
                              <div className="text-gray-900 font-medium">
                                Loading form...
                              </div>
                              <div className="text-gray-500 text-sm">
                                Preparing connection form for{" "}
                                {selectedConnector?.name}
                              </div>
                            </div>
                          </div>
                        </div>
                    ) : connectorFormSchema ? (
                        <div className="h-full overflow-y-auto">
                          <CredDynamicForm
                              key={
                                editingConnection
                                    ? editingConnection.id
                                    : "create-new"
                              }
                              formSchema={connectorFormSchema}
                              onSubmit={handleFormSubmit}
                              onCancel={handleCancel}
                              initialData={editingConnection || stableInitialData}
                              layout={3}
                              submitButtonText={
                                editingConnection
                                    ? "Update Connection"
                                    : "Create Connection"
                              }
                              onCustomAction={handleCustomAction}
                              isActionLoading={{...isActionLoading, test_connection: isTesting}}
                          />
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full p-6">
                          <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                              <svg
                                  className="w-8 h-8 text-red-500"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                              >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              Failed to load form
                            </h3>
                            <p className="text-gray-600 mb-4">
                              Unable to load the connection form for{" "}
                              {selectedConnector?.name}
                            </p>
                            <Button
                                onClick={handleCancel}
                                variant="outline"
                                className="mr-2"
                            >
                              Go Back
                            </Button>
                            <Button
                                onClick={() =>
                                    selectedConnectorId &&
                                    initializeConnector(selectedConnectorId)
                                }
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                              Try Again
                            </Button>
                          </div>
                        </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default CredCreate;
