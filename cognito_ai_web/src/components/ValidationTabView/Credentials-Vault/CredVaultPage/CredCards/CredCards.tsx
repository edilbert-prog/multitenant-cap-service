import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ValidationTabView/ui/card";
import { Skeleton } from "@/components/ValidationTabView/ui/skeleton";
import ForwardedIconComponent from '../../components/common/genericIconComponent';

interface Connector {
  name: string;
  icon: string;
  description: string;
  display_name?: string;
  group?: string;
  enabled?: boolean;
  id: string;
}

interface ApiConnector {
  id: number;
  form_type: string;
  name: string;
  display_name: string;
  form_id: string;
  module: string;
  group: string;
  icon: string;
  description: string;
  enabled: boolean;
}

interface ApiResponse {
  status: boolean;
  message: string;
  data: ApiConnector[];
}

interface ConnectorCardsGridProps {
  onConnectorSelect: (connector: Connector) => void;
}

const ConnectorCardsGrid: React.FC<ConnectorCardsGridProps> = ({ 
  onConnectorSelect
}) => 
  {
    console.log("onConnectorSelectcscscs",onConnectorSelect)
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { 
    const fetchConnectors = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = sessionStorage.getItem('access_token');
        const response = await fetch('/api/react-forms/get-form', { 
          method: 'POST',
          headers: {
            "authentication": token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            form_id: "",
            form_type: "connection_vault",
            only_node: true
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result: ApiResponse = await response.json();
        
        if (result.status && result.data) {
          const transformedConnectors: Connector[] = result.data
            .filter(item => item.enabled)
            .map(item => ({
              id: item.form_id,
              name: item.display_name,
              icon: item.icon,
              description: item.description,
              display_name: item.display_name,
              group: item.group,
              enabled: item.enabled
            }));
          
          setConnectors(transformedConnectors);
        } else {
          throw new Error(result.message || 'Failed to fetch connectors');
        }
      } catch (err) {
        console.error('Error fetching connectors:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchConnectors();
  }, []);



  const ConnectorCardSkeleton = () => (
    <Card className="h-40 animate-pulse">
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

  const groupedConnectors = connectors.reduce((acc, connector) => {
    const group = connector.group || 'Other';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(connector);
    return acc;
  }, {} as Record<string, Connector[]>);

  const renderConnectorCard = (connector: Connector) => {
    return (<Card
        key={connector.id}
        className="relative group h-auto cursor-pointer p-2 transition-transform duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg hover:-translate-y-1 border border-gray-200 hover:border-blue-300 hover:bg-gradient-to-br hover:from-blue-50 hover:bg-primary-100"
        onClick={() => {
          onConnectorSelect(connector)
        }}
    >
      <CardContent className="p-4 h-full flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="p-1 rounded-md bg-gray-50 group-hover:bg-blue-100 transition-colors">
            {/* <img
              src={getIconForConnector(connector.icon)}
              alt={`${connector.name} icon`}
              className="w-9 h-9 object-contain"
            /> */}
            {
                connector.icon &&
                <ForwardedIconComponent className="w-9 h-9" name={connector.icon} />
            }

          </div>
          <h3 className="text-base font-medium dark:text-white text-gray-900 group-hover:text-blue-700 transition-colors">
            {connector.name}
          </h3>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 group-hover:text-gray-700 line-clamp-3 leading-snug">
          {connector.description}
        </p>
      </CardContent>
    </Card>)
  }

  const renderConnectorGroup = (title: string, connectorsToRender: Connector[]) => (
    <div key={title} className="mb-2 p-2">
      <div className="flex items-center mb-4">
        <h2 className="text-base font-semibold text-gray-800 uppercase tracking-wide">
          {title}
        </h2>
        <div className="ml-3 flex-1 h-px bg-gray-200"></div>
        <span className="ml-3 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
          {connectorsToRender.length} connector{connectorsToRender.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-5 gap-3">
        {connectorsToRender.map((connector,id)=>{
          console.log("connectorsToRender",connector)
          return renderConnectorCard(connector)
        })}
      </div>
    </div>
  );
  

  if (loading) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="mx-auto">
          <div className="mb-8">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          
          {['Databases', 'Storage', 'Files', 'Notifications'].map((groupName) => (
            <div key={groupName} className="mb-8">
              <div className="flex items-center mb-6">
                <Skeleton className="h-6 w-32" />
                <div className="ml-4 flex-1 h-px bg-gray-200"></div>
                <Skeleton className="ml-4 h-6 w-20 rounded-full" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, index) => (
                  <ConnectorCardSkeleton key={index} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="mx-auto">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error loading connectors</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return ( 
    <div className="p-0 bg-gray-50 min-h-screen">
      <div className="h-160 mx-auto overflow-auto">
        {Object.entries(groupedConnectors).map(([groupName, groupConnectors]) =>{
          return  renderConnectorGroup(groupName, groupConnectors)
        }

        )}
        
        {Object.keys(groupedConnectors).length === 0 && ( 
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
        )}

      </div>
    </div>
  );
};

export default ConnectorCardsGrid;

