// src/types/dataset/CredentialVault.tsx

export interface IconComponentProps {
    name: string;
    className?: string;
    iconColor?: string;
    stroke?: string;
    strokeWidth?: number;
    id?: string;
    skipFallback?: boolean;
    dataTestId?: string;
}

export type DatasetPayload = {  
  [key: string]: any;
};

export type TemplateField = { 
  key: string;
  info: string;
  type: 'text' | 'dropdown' | 'textarea' | 'multi-dropdown';
  value: any;
  options?: { label: string; value: any }[];
  position: number;
  required: boolean;
  placeholder: string;
  display_name: string;
  fetch?: {
    klass: string;
    method: string;
    module: string;
    params: Record<string, any>;
  };
  default?: any;
  depends_key?: string[];
};

export type DatasetTemplate = { 
  [key: string]: TemplateField;
};


export type Dataset = {
  id: number;
  node_id: string; 
  name: string;
  type: string;
  group: string;
  updated_at: string;
  payload: DatasetPayload;
  template: DatasetTemplate;
  properties?: any[]; 
};



export type DatasetApiResponse = {
    data: Dataset[];
    total: number;
    count: number;
};

export type Node = {
    node_id: string;
    name: string;
    display_name: string;
    group: string;
    icon: string;
    description: string;
};

export type NodeList = {
    [key: string]: Node[];
};

export type NodeDetails = {
    icon: string;
    name: string;
    klass_name: string;
    show_node: boolean;
    modules: string;
    description: string;
    node: {
        payload: Record<string, any>;
        template: DatasetTemplate;
        save_node: {
          klass: string;
          method: string;
          module: string;
        }
        get_data: {
          klass: string;
          method: string;
          module: string;
        }
    };
    node_id: string;
    type: string;
    group: string;
    display_name: string;
}

export type Connection = {
    value: number;
    label: string;
};

export type DatasetListItem = {
    value: number;
    label: string;
}

export type PreviewData = {
    data: Record<string, any>[];
    columns: string[];
}

export type ComboboxOption = {
  value: string;
  label: string;
};
