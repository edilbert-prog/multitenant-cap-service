import { Button } from "@/components/ValidationTabView/ui/button";
import ConnectorCardsGrid from "../CredCards/CredCards";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router";

interface Connector {
  id: string;
  name: string;
  icon: string;
  description: string;
  display_name?: string;
  group?: string;
  enabled?: boolean;
}

const CredConnectors = () => {
  const navigate = useNavigate();
  const { connectorId } = useParams();
  console.log(connectorId);
  const handleFormClose = () => {
    navigate('/CredentialVault');
  };
  const handleConnectorSelect = (connector: Connector) => {
    navigate(`/connection-vault/create/${connector.id}`);
  };

  return (
    <>
      {/* Connector selection view (cards grid) */}
        <div className="min-h-screen flex flex-col">
          <div className="sticky top-0 z-10 border-b border-gray-200 px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between mx-auto">
              <div className="flex items-center space-x-4">
                <Button 
                  onClick={handleFormClose} 
                  variant="ghost"
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Connection Vault
                </Button>
                <div className="h-6 w-px bg-gray-300"></div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Select a Data Source</h1>
                  <p className="text-sm text-gray-600">Choose from available connectors to create a new connection</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <ConnectorCardsGrid onConnectorSelect={handleConnectorSelect}/>
          </div>
        </div>
    </>
  );
};

export default CredConnectors;
