// /mnt/data/MasterSubProcessTree
import React, { useEffect, useReducer, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, Edit, Plus, Trash2 } from 'lucide-react';
import { apiRequest } from '../../utils/helpers/ApiHelper';
import Modal from '../../utils/Modal';
import Dropdown from '../../utils/Dropdown';
import ConfirmPopup from '../../utils/ConfirmPopup';

type Id = string | number;

interface Transaction {
  Transaction?: string;
  TransactionCode: string;
  [key: string]: unknown;
}

interface Feature {
  FeatureId: Id;
  Feature: string;
  [key: string]: unknown;
}

interface Program {
  ProgramId: Id;
  ProgramName: string;
  [key: string]: unknown;
}

interface Application {
  ApplicationId: Id;
  ApplicationName?: string;
  Transactions?: Transaction[];
  Features?: Feature[];
  Programs?: Program[];
  [key: string]: unknown;
}

interface Integration {
  IntegrationId: Id;
  IntegrationName?: string;
  [key: string]: unknown;
}

interface MasterNode {
  ClientId?: Id;
  ClientName?: string;
  BusinessUnitId?: Id;
  BusinessProcessId?: Id;
  BusinessProcessName?: string;
  BusinessSubProcessId?: Id;
  BusinessSubProcessName?: string;
  ParentSubProcessId?: Id;
  Description?: string;
  Applications?: Application[];
  SubProcesses?: MasterNode[];
  Integrations?: Integration[];
  [key: string]: unknown;
}

interface CurrAddEditObjShape extends Record<string, unknown> {
  ApplicationId?: Id | null;
  IntegrationId?: Id | null;
  TransactionIds?: Id | Id[] | '' | null;
  FeatureIds?: Id | Id[] | '' | null;
  ProgramIds?: Id | Id[] | '' | null;
}

interface State {
  treeData: MasterNode | null;
  IsLoading: boolean;
  Error: string;
  modalOpen: boolean;
  selectedModalType:
      | ''
      | 'subprocess'
      | 'application'
      | 'transactions'
      | 'features'
      | 'programs'
      | 'integration'
      | 'viewApp'
      | 'viewIntegration'
      | 'viewTransaction'
      | 'viewFeature'
      | 'viewProgram';
  selectedNode:
      | (MasterNode &
      Partial<{
        app: Application;
        intg: Integration;
        txn: Transaction;
        parentApp: Application;
        parentSubProcess: MasterNode;
      }>)
      | null;
  name: string;
  description: string;
  applicationId: Id | '' | null;
  expandedNodes: Set<Id>;
  applicationOptions: unknown[];
  ApplicationsList: unknown[];
  IntegrationsList: unknown[];
  TransactionsList: unknown[];
  FeaturesList: unknown[];
  ProgramsList: unknown[];
  formError: string;
  CurrAddEditObj: CurrAddEditObjShape;
  isEditMode: boolean;
}

interface NestedProcessTreeProps {
  CurrBP: {
    ClientId?: Id;
    BusinessUnitId?: Id;
    BusinessProcessId: Id;
    BusinessProcessName?: string;
    [key: string]: unknown;
  };
}

interface ConfirmDeleteProps {
  message: string;
  onConfirm: () => void | Promise<void>;
  children: React.ReactNode;
}

interface TreeToggleIconProps {
  isOpen: boolean;
}

interface TreeNodeProps {
  node: MasterNode;
  onAddClick: (node: MasterNode | (Record<string, unknown> & { [key: string]: unknown }), type: State['selectedModalType'] | '') => void;
  onEditClick: (node: MasterNode) => void;
  context: MasterNode | Record<string, unknown>;
  onDelete: (item: Record<string, unknown>, type: 'transaction' | 'integration' | 'feature' | 'program' | 'subprocess', context?: unknown) => Promise<void> | void;
  expandedNodes: Set<Id>;
  toggleNode: (node: MasterNode) => void;
}

/** Fallback prop types for util components (if none are exported) */
interface DropdownProps {
  mode: 'single' | 'multiple';
  options: unknown[];
  value: string | number | (string | number)[] | '' | null | undefined;
  onChange: (val: string | number | (string | number)[] | null, item: unknown) => void;
  onSearch?: (q: string) => void;
  [key: string]: unknown;
}
interface ModalProps {
  width?: string;
  isOpen: boolean;
  DisableScroll?: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children?: React.ReactNode;
  [key: string]: unknown;
}
interface ConfirmPopupProps {
  message: string;
  onConfirm: () => void | Promise<void>;
  children: React.ReactNode;
  [key: string]: unknown;
}

/* Type assertions to satisfy usage if util libs don't export types */
const TypedDropdown = Dropdown as React.ComponentType<DropdownProps>;
const TypedModal = Modal as React.ComponentType<ModalProps>;
const TypedConfirmPopup = ConfirmPopup as React.ComponentType<ConfirmPopupProps>;

const ConfirmDelete = ({ message, onConfirm, children }: ConfirmDeleteProps) => (
    <div
        onClick={(e: React.MouseEvent<HTMLDivElement>) => {
          e.stopPropagation();
        }}
    >
      <TypedConfirmPopup message={message} onConfirm={onConfirm}>
        {children}
      </TypedConfirmPopup>
    </div>
);

const TreeToggleIcon = ({ isOpen }: TreeToggleIconProps) => (
    <motion.div
        initial={false}
        animate={{ rotate: isOpen ? 90 : 0 }}
        className={`text-gray-500 transition-transform ${isOpen ? 'text-blue-500' : ''}`}
    >
      <ChevronRight size={16} />
    </motion.div>
);

const TreeNode = ({
                    node,
                    onAddClick,
                    expandedNodes,
                    toggleNode,
                    onEditClick,
                    context,
                    onDelete,
                  }: TreeNodeProps) => {
  const nodeId = (node.BusinessSubProcessId ?? node.BusinessProcessId ?? node.ClientId) as Id;
  const isOpen = expandedNodes.has(nodeId);

  const enrichedNode: MasterNode = {
    ...node,
    ClientId: node.ClientId ?? (context as MasterNode).ClientId,
    BusinessUnitId: node.BusinessUnitId ?? (context as MasterNode).BusinessUnitId,
    BusinessProcessId: node.BusinessProcessId ?? (context as MasterNode).BusinessProcessId,
    BusinessSubProcessId: node.BusinessSubProcessId ?? (context as MasterNode).BusinessSubProcessId,
    ApplicationId: (node as unknown as { ApplicationId?: Id })?.ApplicationId ?? (context as unknown as { ApplicationId?: Id })?.ApplicationId,
  };

  const isTopParent = !!node.BusinessProcessId && !node.BusinessSubProcessId;
  const isSecondParent =
      !!node.BusinessSubProcessId &&
      ((node.SubProcesses?.length ?? 0) > 0 ||
          (node.Applications?.length ?? 0) > 0 ||
          (node.Integrations?.length ?? 0) > 0);

  return (
      <div className="ml-4 mt-2">
        <div
            className={`flex items-center justify-between shadow rounded-lg transition ${
                isTopParent
                    ? 'bg-[#e4edfa] cursor-pointer p-2.5 hover:bg-gray-100'
                    : isSecondParent
                        ? 'bg-[#f0f5ff] p-2 cursor-pointer hover:bg-blue-100'
                        : 'bg-white p-2 cursor-pointer'
            }`}
            onClick={() => toggleNode(node)}
        >
          <div className="flex items-center gap-2">
            {((node.SubProcesses?.length ?? 0) > 0 ||
                (node.Applications?.length ?? 0) > 0 ||
                (node.Integrations?.length ?? 0) > 0) && <TreeToggleIcon isOpen={isOpen} />}
            {isTopParent ? (
                <div className="text-lg font-semibold text-gray-800">
                  {node.BusinessProcessName || node.ClientName}
                </div>
            ) : (
                <div className="text-sm font-medium text-gray-800">{node.BusinessSubProcessName}</div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {node.BusinessSubProcessId && (
                <>
                  <button
                      className="text-sky-700 mr-2 cursor-pointer"
                      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                        e.stopPropagation();
                        onEditClick(enrichedNode);
                      }}
                  >
                    <Edit size={17} />
                  </button>

                  <ConfirmDelete
                      message="Delete this subprocess? All nested items may be removed."
                      onConfirm={() =>
                          onDelete(
                              {
                                ClientId: enrichedNode.ClientId,
                                BusinessUnitId: enrichedNode.BusinessUnitId,
                                BusinessProcessId: enrichedNode.BusinessProcessId,
                                BusinessSubProcessId: enrichedNode.BusinessSubProcessId,
                              },
                              'subprocess'
                          )
                      }
                  >
                    <button className="text-red-700 mr-2 cursor-pointer">
                      <Trash2 size={17} />
                    </button>
                  </ConfirmDelete>
                </>
            )}

            <button
                className="text-blue-600 hover:text-blue-800 cursor-pointer"
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.stopPropagation();
                  onAddClick(enrichedNode, '');
                }}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {isOpen && (
              <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="pl-4 border-l border-gray-300"
              >
                {((node.SubProcesses?.length ?? 0) > 0 ||
                    (node.Applications?.length ?? 0) > 0 ||
                    (node.Integrations?.length ?? 0) > 0) && (
                    <div className="relative">
                      <div className="absolute top-[14px] left-[-16px] w-4 h-px bg-gray-300"></div>
                    </div>
                )}

                {((node.Applications?.length ?? 0) > 0) && (
                    <div className="bg-blue-50 rounded-xl p-3 mt-3 shadow-sm">
                      <div className="font-semibold text-blue-800 text-sm mb-2">Transactions</div>
                      <ul className="ml-4">
                        {node.Applications?.map((app) => (
                            <li key={app.ApplicationId as React.Key} className="mt-2">
                              <div
                                  className="text-sm font-medium text-gray-800 cursor-pointer hover:underline"
                                  onClick={() =>
                                      onAddClick(
                                          {
                                            app,
                                            parentSubProcess: enrichedNode,
                                          } as unknown as MasterNode,
                                          'viewApp'
                                      )
                                  }
                              >
                                {app.ApplicationName}
                              </div>
                              {(app.Transactions?.length ?? 0) > 0 && (
                                  <ul className="ml-4 mt-1">
                                    {app.Transactions?.map((txn) => (
                                        <li key={txn.TransactionCode as React.Key} className="flex items-center gap-2 mt-1">
                                          <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                                          <div
                                              className="text-sm text-gray-700 cursor-pointer hover:underline"
                                              onClick={() =>
                                                  onAddClick(
                                                      {
                                                        txn,
                                                        parentApp: app,
                                                      } as unknown as MasterNode,
                                                      'viewTransaction'
                                                  )
                                              }
                                          >
                                            {`${txn.Transaction ?? ''} (${txn.TransactionCode})`}
                                          </div>
                                          <ConfirmDelete
                                              message={`Delete transaction "${txn.Transaction ?? ''}"?`}
                                              onConfirm={() =>
                                                  onDelete(
                                                      {
                                                        ClientId: enrichedNode.ClientId,
                                                        ApplicationId:
                                                            (enrichedNode as unknown as { ApplicationId?: Id })?.ApplicationId ||
                                                            app.ApplicationId,
                                                        BusinessUnitId: enrichedNode.BusinessUnitId,
                                                        BusinessProcessId: enrichedNode.BusinessProcessId,
                                                        BusinessSubProcessId: enrichedNode.BusinessSubProcessId,
                                                        TransactionCode: txn.TransactionCode,
                                                      },
                                                      'transaction'
                                                  )
                                              }
                                          >
                                            <button className="text-red-700 text-xs ml-2 cursor-pointer">
                                              <Trash2 size={13} />
                                            </button>
                                          </ConfirmDelete>
                                        </li>
                                    ))}
                                  </ul>
                              )}
                            </li>
                        ))}
                      </ul>
                    </div>
                )}

                {node.Applications?.some((app) => (app.Features?.length ?? 0) > 0) && (
                    <div className="bg-indigo-50 rounded-xl p-3 mt-3 shadow-sm mt-4">
                      <div className="font-semibold text-indigo-800 text-sm mb-2">Features</div>
                      <ul className="ml-4">
                        {node.Applications?.map(
                            (app) =>
                                (app.Features?.length ?? 0) > 0 && (
                                    <li key={app.ApplicationId as React.Key} className="mt-2">
                                      <div
                                          className="text-sm font-medium text-gray-800 cursor-pointer hover:underline"
                                          onClick={() =>
                                              onAddClick(
                                                  {
                                                    app,
                                                    parentSubProcess: enrichedNode,
                                                  } as unknown as MasterNode,
                                                  'viewApp'
                                              )
                                          }
                                      >
                                        {app.ApplicationName}
                                      </div>
                                      <ul className="ml-4 mt-1">
                                        {app.Features?.map((feature) => (
                                            <li key={feature.FeatureId as React.Key} className="flex items-center gap-2 mt-1">
                                              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                              <div
                                                  className="text-sm text-gray-700 cursor-pointer hover:underline"
                                                  onClick={() =>
                                                      onAddClick(
                                                          {
                                                            feature,
                                                            parentApp: app,
                                                          } as unknown as MasterNode,
                                                          'viewFeature'
                                                      )
                                                  }
                                              >
                                                {feature.Feature}
                                              </div>
                                              <ConfirmDelete
                                                  message={`Delete feature "${feature.Feature}"?`}
                                                  onConfirm={() =>
                                                      onDelete(
                                                          {
                                                            ClientId: enrichedNode.ClientId,
                                                            ApplicationId: app.ApplicationId,
                                                            BusinessUnitId: enrichedNode.BusinessUnitId,
                                                            BusinessProcessId: enrichedNode.BusinessProcessId,
                                                            BusinessSubProcessId: enrichedNode.BusinessSubProcessId,
                                                            FeatureId: feature.FeatureId,
                                                          },
                                                          'feature'
                                                      )
                                                  }
                                              >
                                                <button className="text-red-700 text-xs ml-2 cursor-pointer">
                                                  <Trash2 size={13} />
                                                </button>
                                              </ConfirmDelete>
                                            </li>
                                        ))}
                                      </ul>
                                    </li>
                                )
                        )}
                      </ul>
                    </div>
                )}

                {node.Applications?.some((app) => (app.Programs?.length ?? 0) > 0) && (
                    <div className="bg-purple-50 rounded-xl p-3 mt-3 shadow-sm mt-4">
                      <div className="font-semibold text-purple-800 text-sm mb-2">Programs</div>
                      <ul className="ml-4">
                        {node.Applications?.map(
                            (app) =>
                                (app.Programs?.length ?? 0) > 0 && (
                                    <li key={app.ApplicationId as React.Key} className="mt-2">
                                      <div
                                          className="text-sm font-medium text-gray-800 cursor-pointer hover:underline"
                                          onClick={() =>
                                              onAddClick(
                                                  {
                                                    app,
                                                    parentSubProcess: enrichedNode,
                                                  } as unknown as MasterNode,
                                                  'viewApp'
                                              )
                                          }
                                      >
                                        {app.ApplicationName}
                                      </div>
                                      <ul className="ml-4 mt-1">
                                        {app.Programs?.map((program) => (
                                            <li key={program.ProgramId as React.Key} className="flex items-center gap-2 mt-1">
                                              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                              <div
                                                  className="text-sm text-gray-700 cursor-pointer hover:underline"
                                                  onClick={() =>
                                                      onAddClick(
                                                          {
                                                            program,
                                                            parentApp: app,
                                                          } as unknown as MasterNode,
                                                          'viewProgram'
                                                      )
                                                  }
                                              >
                                                {program.ProgramName}
                                              </div>
                                              <ConfirmDelete
                                                  message={`Delete program "${program.ProgramName}"?`}
                                                  onConfirm={() =>
                                                      onDelete(
                                                          {
                                                            ClientId: enrichedNode.ClientId,
                                                            ApplicationId: app.ApplicationId,
                                                            BusinessUnitId: enrichedNode.BusinessUnitId,
                                                            BusinessProcessId: enrichedNode.BusinessProcessId,
                                                            BusinessSubProcessId: enrichedNode.BusinessSubProcessId,
                                                            ProgramId: program.ProgramId,
                                                          },
                                                          'program'
                                                      )
                                                  }
                                              >
                                                <button className="text-red-700 text-xs ml-2 cursor-pointer">
                                                  <Trash2 size={13} />
                                                </button>
                                              </ConfirmDelete>
                                            </li>
                                        ))}
                                      </ul>
                                    </li>
                                )
                        )}
                      </ul>
                    </div>
                )}

                {(node.Integrations?.length ?? 0) > 0 && (
                    <div className="bg-green-50 rounded-xl p-3 mt-3 shadow-sm">
                      <div className="font-semibold text-green-800 text-sm mb-2">Integrations</div>
                      <ul className="ml-4">
                        {node.Integrations?.map((intg) => (
                            <li key={intg.IntegrationId as React.Key} className="mt-2 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                              <div
                                  className="text-sm text-gray-700 cursor-pointer hover:underline"
                                  onClick={() =>
                                      onAddClick(
                                          {
                                            intg,
                                            parentSubProcess: enrichedNode,
                                          } as unknown as MasterNode,
                                          'viewIntegration'
                                      )
                                  }
                              >
                                {intg.IntegrationName || (intg.IntegrationId as React.ReactNode)}
                              </div>
                              <ConfirmDelete
                                  message={`Delete integration "${intg.IntegrationName || intg.IntegrationId}"?`}
                                  onConfirm={() =>
                                      onDelete(
                                          {
                                            ClientId: enrichedNode.ClientId,
                                            ApplicationId: (enrichedNode as unknown as { ApplicationId?: Id })?.ApplicationId,
                                            BusinessUnitId: enrichedNode.BusinessUnitId,
                                            BusinessProcessId: enrichedNode.BusinessProcessId,
                                            BusinessSubProcessId: enrichedNode.BusinessSubProcessId,
                                            IntegrationId: intg.IntegrationId,
                                          },
                                          'integration'
                                      )
                                  }
                              >
                                <button className="text-red-700 text-xs ml-2 cursor-pointer">
                                  <Trash2 size={13} />
                                </button>
                              </ConfirmDelete>
                            </li>
                        ))}
                      </ul>
                    </div>
                )}

                {node.SubProcesses?.map((child) => (
                    <TreeNode
                        key={child.BusinessSubProcessId as React.Key}
                        node={child}
                        onAddClick={onAddClick}
                        onEditClick={onEditClick}
                        context={enrichedNode}
                        onDelete={onDelete}
                        expandedNodes={expandedNodes}
                        toggleNode={toggleNode}
                    />
                ))}
              </motion.div>
          )}
        </AnimatePresence>
      </div>
  );
};

const initialState: State = {
  treeData: null,
  IsLoading: true,
  Error: '',
  modalOpen: false,
  selectedModalType: '',
  selectedNode: null,
  name: '',
  description: '',
  applicationId: '',
  expandedNodes: new Set<Id>(),
  applicationOptions: [],
  ApplicationsList: [],
  IntegrationsList: [],
  TransactionsList: [],
  FeaturesList: [],
  ProgramsList: [],
  formError: '',
  CurrAddEditObj: {
    ApplicationId: '',
    IntegrationId: '',
    TransactionIds: '',
    FeatureIds: '',
    ProgramIds: '',
  },
  isEditMode: false,
};

const reducer = (state: State, newState: Partial<State>): State => ({ ...state, ...newState });

const capitalizeTitle = (type: State['selectedModalType'] | ''): string => {
  if (type === 'subprocess') return 'Subprocess';
  if (type === 'application') return 'Application';
  if (type === 'integration') return 'Integration';
  return type ? type.charAt(0).toUpperCase() + type.slice(1) : '';
};

type HandleDropdownKey = keyof CurrAddEditObjShape;

export default function NestedProcessTree(props: NestedProcessTreeProps) {
  const [state, setState] = useReducer(reducer, initialState);
  const didFetchData = useRef<boolean>(false);

  const handleDropdownClientInfo = (val: string | number | (string | number)[] | null, item: unknown, key: HandleDropdownKey) => {
    setState({
      CurrAddEditObj: {
        ...state.CurrAddEditObj,
        [key]: val,
      },
      formError: '',
    });
  };

  const getApplicationsList = async (SearchString: string = ''): Promise<void> => {
    try {
      const resp: any = await apiRequest('/GetApplicationsMaster', { SearchString });
      setState({ ApplicationsList: resp.ResponseData as unknown[] });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error loading applications list:', err);
    }
  };
  const getTransactionsMasterList = async (SearchString: string = ''): Promise<void> => {
    try {
      const resp: any = await apiRequest('/GetTransactionsMaster', { SearchString });
      setState({
        TransactionsList: resp.ResponseData as unknown[],
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error loading Country/State/City:', err);
    }
  };
  const getIntegrationsList = async (SearchString: string = ''): Promise<void> => {
    try {
      const resp: any = await apiRequest('/GetIntegrationsMaster', { SearchString });
      setState({ IntegrationsList: resp.ResponseData as unknown[] });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error loading integrations list:', err);
    }
  };

  const getFeaturesList = async (SearchString: string = ''): Promise<void> => {
    try {
      const resp: any = await apiRequest('/GetFeaturesMaster', { SearchString });
      setState({ FeaturesList: resp.ResponseData as unknown[] });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error loading features list:', err);
    }
  };

  const getProgramsList = async (SearchString: string = ''): Promise<void> => {
    try {
      const resp: any = await apiRequest('/GetProgramsMaster', { SearchString });
      setState({ ProgramsList: resp.ResponseData as unknown[] });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error loading programs list:', err);
    }
  };

  useEffect(() => {
    if (state.selectedModalType === 'transactions') {
      void getApplicationsList();
      void getTransactionsMasterList();
    }
    if (state.selectedModalType === 'features') {
      void getApplicationsList();
      void getFeaturesList();
    }
    if (state.selectedModalType === 'programs') {
      void getApplicationsList();
      void getProgramsList();
    }
    if (state.selectedModalType === 'integration') {
      void getIntegrationsList();
    }
  }, [state.selectedModalType]);

  const fetchTreeData = async (): Promise<void> => {
    setState({ IsLoading: true, Error: '' });
    try {
      const res: any = await apiRequest('/GetBPSubProcessesMaster', {
        BusinessProcessId: props.CurrBP.BusinessProcessId,
      });
      const rootNode = res.ResponseData as MasterNode;
      const currentExpanded = new Set(state.expandedNodes);
      if (rootNode.BusinessProcessId != null) {
        currentExpanded.add(rootNode.BusinessProcessId);
      }

      setState({
        treeData: rootNode,
        expandedNodes: currentExpanded,
      });
    } catch (err) {
      setState({ Error: 'Failed to fetch subprocess data.' });
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
      setState({ IsLoading: false });
    }
  };

  useEffect(() => {
    if (didFetchData.current) return;
    didFetchData.current = true;
    void fetchTreeData();
  }, []);

  const toggleNode = (node: MasterNode) => {
    const nodeId = (node.BusinessSubProcessId ?? node.BusinessProcessId ?? node.ClientId) as Id;
    const newExpandedNodes = new Set(state.expandedNodes);
    if (newExpandedNodes.has(nodeId)) {
      newExpandedNodes.delete(nodeId);
    } else {
      newExpandedNodes.add(nodeId);
    }
    setState({ expandedNodes: newExpandedNodes });
  };

  const openModal = (node: MasterNode, type: State['selectedModalType'] | '') => {
    setState({
      selectedNode: node,
      modalOpen: true,
      selectedModalType: type,
      formError: '',
      name: '',
      description: '',
      applicationId: '',
      isEditMode: false,
    });
  };

  const openEditModal = (node: MasterNode) => {
    setState({
      selectedNode: node,
      modalOpen: true,
      selectedModalType: 'subprocess',
      formError: '',
      name: node.BusinessSubProcessName || '',
      description: node.Description || '',
      isEditMode: true,
    });
  };

  const closeModal = () => {
    setState({
      modalOpen: false,
      selectedModalType: '',
      selectedNode: null,
      name: '',
      description: '',
      applicationId: '',
      formError: '',
      isEditMode: false,
      CurrAddEditObj: {
        ApplicationId: '',
        IntegrationId: '',
        TransactionIds: '',
      },
    });
  };

  const handleDelete = async (
      item: Record<string, unknown>,
      type: 'transaction' | 'integration' | 'feature' | 'program' | 'subprocess',
      context?: unknown
  ) => {
    try {
      if (type === 'transaction') {
        await apiRequest('/DeleteBPApplicationTransaction', item);
      } else if (type === 'integration') {
        await apiRequest('/DeleteBPSubProcessIntegrations', item);
      } else if (type === 'feature') {
        await apiRequest('/DeleteSubProcessApplicationFeature', item);
      } else if (type === 'program') {
        await apiRequest('/DeleteSubProcessApplicationProgram', item);
      } else if (type === 'subprocess') {
        await apiRequest('/DeleteBPSubProcessMaster', item);
      }
      await fetchTreeData();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`Failed to delete ${type}:`, err, context);
    }
  };

  const handleModalSubmit = async () => {
    const { selectedNode, selectedModalType, name, description, CurrAddEditObj, isEditMode } = state;

    if (!selectedNode) return;

    try {
      if (selectedModalType === 'subprocess') {
        if (!name.trim()) {
          setState({ formError: 'fields are required.' });
          return;
        }
        await apiRequest('/AddUpdateBPSubProcessMaster', {
          ClientId: selectedNode.ClientId,
          BusinessUnitId: selectedNode.BusinessUnitId,
          BusinessProcessId: selectedNode.BusinessProcessId,
          BusinessSubProcessId: isEditMode ? selectedNode.BusinessSubProcessId ?? null : null,
          ParentSubProcessId: isEditMode
              ? selectedNode.ParentSubProcessId ?? null
              : selectedNode.BusinessSubProcessId ?? null,
          BusinessSubProcessName: name,
          Description: description,
        });
      } else if (selectedModalType === 'application') {
        if (!CurrAddEditObj.ApplicationId) {
          setState({ formError: 'Please select an application.' });
          return;
        }
        await apiRequest('/AddClientApplication', {
          ClientId: selectedNode.ClientId,
          BusinessUnitId: selectedNode.BusinessUnitId,
          BusinessProcessId: selectedNode.BusinessProcessId,
          BusinessSubProcessId: selectedNode.BusinessSubProcessId,
          ApplicationId: CurrAddEditObj.ApplicationId,
        });
      } else if (selectedModalType === 'transactions') {
        const { ApplicationId, TransactionIds } = CurrAddEditObj;
        if (!ApplicationId || !TransactionIds || (Array.isArray(TransactionIds) && TransactionIds.length === 0)) {
          setState({ formError: 'Please select an application and at least one transaction.' });
          return;
        }
        await apiRequest('/AddBPApplicationTransactions', {
          ClientId: selectedNode.ClientId,
          BusinessUnitId: selectedNode.BusinessUnitId,
          BusinessProcessId: selectedNode.BusinessProcessId,
          BusinessSubProcessId: selectedNode.BusinessSubProcessId,
          ApplicationId,
          TransactionIds,
        });
      } else if (selectedModalType === 'features') {
        const { ApplicationId, FeatureIds } = CurrAddEditObj;
        if (!ApplicationId || !FeatureIds || (Array.isArray(FeatureIds) && FeatureIds.length === 0)) {
          setState({ formError: 'Please select an application and at least one feature.' });
          return;
        }
        await apiRequest('/AddSubProcessApplicationFeatures', {
          ClientId: selectedNode.ClientId,
          BusinessUnitId: selectedNode.BusinessUnitId,
          BusinessProcessId: selectedNode.BusinessProcessId,
          BusinessSubProcessId: selectedNode.BusinessSubProcessId,
          ApplicationId,
          FeatureIds,
        });
      } else if (selectedModalType === 'programs') {
        const { ApplicationId, ProgramIds } = CurrAddEditObj;
        if (!ApplicationId || !ProgramIds || (Array.isArray(ProgramIds) && ProgramIds.length === 0)) {
          setState({ formError: 'Please select an application and at least one program.' });
          return;
        }
        await apiRequest('/AddSubProcessApplicationPrograms', {
          ClientId: selectedNode.ClientId,
          BusinessUnitId: selectedNode.BusinessUnitId,
          BusinessProcessId: selectedNode.BusinessProcessId,
          BusinessSubProcessId: selectedNode.BusinessSubProcessId,
          ApplicationId,
          ProgramIds,
        });
      } else if (selectedModalType === 'integration') {
        if (!CurrAddEditObj.IntegrationId) {
          setState({ formError: 'Please select an integration.' });
          return;
        }
        await apiRequest('/AddBPSubProcessIntegration', {
          ClientId: selectedNode.ClientId,
          BusinessUnitId: selectedNode.BusinessUnitId,
          BusinessProcessId: selectedNode.BusinessProcessId,
          BusinessSubProcessId: selectedNode.BusinessSubProcessId,
          IntegrationId: CurrAddEditObj.IntegrationId,
        });
      }
      setState({
        modalOpen: false,
        selectedModalType: '',
        selectedNode: null,
        name: '',
        description: '',
        applicationId: '',
        formError: '',
        isEditMode: false,
        CurrAddEditObj: {
          ApplicationId: '',
          IntegrationId: '',
          TransactionIds: '',
        },
      });
      const res: any = await apiRequest('/GetBPSubProcessesMaster', {
        ClientId: props.CurrBP.ClientId,
        BusinessUnitId: props.CurrBP.BusinessUnitId,
        BusinessProcessId: props.CurrBP.BusinessProcessId,
      });
      setState({ treeData: res.ResponseData as MasterNode, IsLoading: false });
    } catch {
      setState({ formError: 'Submission failed.' });
    }
  };

  const { treeData, IsLoading, Error, modalOpen, selectedModalType, formError, name, description, isEditMode } = state;

  return (
      <div className="max-w-5xl mx-auto p-6 bg-white rounded-xl shadow-md border border-gray-300">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Business Process Mapping</h2>

        {IsLoading ? (
            <div className="text-center text-gray-500">Loading...</div>
        ) : Error ? (
            <div className="text-center text-red-500">{Error}</div>
        ) : (
            treeData && (
                <TreeNode
                    node={treeData}
                    onAddClick={openModal}
                    onEditClick={openEditModal}
                    context={{}}
                    onDelete={handleDelete}
                    expandedNodes={state.expandedNodes}
                    toggleNode={toggleNode}
                />
            )
        )}

        <TypedModal
            width="max-w-2xl"
            isOpen={modalOpen}
            DisableScroll={true}
            onClose={closeModal}
            title={`${
                state.selectedNode?.BusinessSubProcessName ||
                state.selectedNode?.BusinessProcessName ||
                state.selectedNode?.ClientName ||
                'Root'
            }${state.selectedModalType ? ` / ${isEditMode ? 'Edit' : 'Add'} ${capitalizeTitle(state.selectedModalType)}` : ''}`}
        >
          <div className="p-4 over">
            {formError && <div className="text-red-500 text-sm mb-2">{formError}</div>}

            {!selectedModalType && (
                <div className="flex flex-col gap-2">
                  <button
                      className="px-4 py-2 bg-blue-600 text-white rounded"
                      onClick={() => setState({ selectedModalType: 'subprocess', formError: '' })}
                  >
                    Add Subprocess
                  </button>
                  <button
                      className="px-4 py-2 bg-green-600 text-white rounded"
                      onClick={() => setState({ selectedModalType: 'transactions', formError: '' })}
                  >
                    Add Transactions
                  </button>
                  <button
                      className="px-4 py-2 bg-purple-600 text-white rounded"
                      onClick={() => setState({ selectedModalType: 'integration', formError: '' })}
                  >
                    Add Integrations
                  </button>
                  <button
                      className="px-4 py-2 bg-indigo-600 text-white rounded"
                      onClick={() => setState({ selectedModalType: 'features', formError: '' })}
                  >
                    Add Features
                  </button>
                  <button
                      className="px-4 py-2 bg-purple-600 text-white rounded"
                      onClick={() => setState({ selectedModalType: 'programs', formError: '' })}
                  >
                    Add Programs
                  </button>
                </div>
            )}

            {selectedModalType === 'subprocess' && (
                <>
                  <input
                      type="text"
                      placeholder="Subprocess Name"
                      className="w-full border px-3 py-2 rounded mb-2 mt-4"
                      value={name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setState({ name: e.target.value })}
                  />
                  <textarea
                      placeholder="Description"
                      className="w-full border px-3 py-2 rounded mb-4"
                      value={description}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setState({ description: e.target.value })}
                  />
                </>
            )}

            {selectedModalType === 'transactions' && (
                <>
                  <div>
                    <label className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                      Applications <span className="text-red-500">*</span>
                    </label>
                    <TypedDropdown
                        mode="single"
                        options={state.ApplicationsList}
                        value={(state.CurrAddEditObj.ApplicationId as Id | '' | null | undefined) ?? ''}
                        onChange={(val, item) => handleDropdownClientInfo(val, item, 'ApplicationId')}
                        onSearch={(q) => {
                          // eslint-disable-next-line no-console
                          console.log('Search (App):', q);
                        }}
                    />
                  </div>

                  <div className="pb-6">
                    <label className="block mt-4 text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                      Transactions <span className="text-red-500">*</span>
                    </label>
                    <TypedDropdown
                        mode="multiple"
                        options={state.TransactionsList}
                        value={
                            (state.CurrAddEditObj.TransactionIds as Id[] | Id | '' | null | undefined) ?? ''
                        }
                        onChange={(val, item) => handleDropdownClientInfo(val, item, 'TransactionIds')}
                        onSearch={(q) => {
                          // eslint-disable-next-line no-console
                          console.log('Search (Transaction):', q);
                        }}
                    />
                  </div>
                </>
            )}

            {selectedModalType === 'features' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-[#2C3E50] mb-1">
                      Applications <span className="text-red-500">*</span>
                    </label>
                    <TypedDropdown
                        mode="single"
                        options={state.ApplicationsList}
                        value={(state.CurrAddEditObj.ApplicationId as Id | '' | null | undefined) ?? ''}
                        onChange={(val, item) => handleDropdownClientInfo(val, item, 'ApplicationId')}
                    />
                  </div>
                  <div className="pb-6">
                    <label className="block mt-4 text-sm font-medium text-[#2C3E50] mb-1">
                      Features <span className="text-red-500">*</span>
                    </label>
                    <TypedDropdown
                        mode="multiple"
                        options={state.FeaturesList}
                        value={(state.CurrAddEditObj.FeatureIds as Id[] | Id | '' | null | undefined) ?? ''}
                        onChange={(val, item) => handleDropdownClientInfo(val, item, 'FeatureIds')}
                    />
                  </div>
                </>
            )}

            {selectedModalType === 'programs' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-[#2C3E50] mb-1">
                      Applications <span className="text-red-500">*</span>
                    </label>
                    <TypedDropdown
                        mode="single"
                        options={state.ApplicationsList}
                        value={(state.CurrAddEditObj.ApplicationId as Id | '' | null | undefined) ?? ''}
                        onChange={(val, item) => handleDropdownClientInfo(val, item, 'ApplicationId')}
                    />
                  </div>
                  <div className="pb-6">
                    <label className="block mt-4 text-sm font-medium text-[#2C3E50] mb-1">
                      Programs <span className="text-red-500">*</span>
                    </label>
                    <TypedDropdown
                        mode="multiple"
                        options={state.ProgramsList}
                        value={(state.CurrAddEditObj.ProgramIds as Id[] | Id | '' | null | undefined) ?? ''}
                        onChange={(val, item) => handleDropdownClientInfo(val, item, 'ProgramIds')}
                    />
                  </div>
                </>
            )}

            {selectedModalType === 'integration' && (
                <TypedDropdown
                    mode="single"
                    options={state.IntegrationsList}
                    value={(state.CurrAddEditObj.IntegrationId as Id | '' | null | undefined) ?? ''}
                    onChange={(val, item) => handleDropdownClientInfo(val, item, 'IntegrationId')}
                    onSearch={(q) => {
                      // eslint-disable-next-line no-console
                      console.log('Search (Integration):', q);
                    }}
                />
            )}

            {(selectedModalType === 'viewApp' || selectedModalType === 'viewIntegration') && (
                <div className="text-sm text-gray-700">
                  <p>
                    <strong>Name:</strong>{' '}
                    {selectedModalType === 'viewApp'
                        ? state.selectedNode?.app?.ApplicationName
                        : state.selectedNode?.intg?.IntegrationName}
                  </p>
                  <p>
                    <strong>Parent Subprocess:</strong>{' '}
                    {state.selectedNode?.parentSubProcess?.BusinessSubProcessName || 'None'}
                  </p>
                </div>
            )}

            {selectedModalType &&
                selectedModalType !== 'viewApp' &&
                selectedModalType !== 'viewIntegration' && (
                    <div className="flex justify-end gap-2 mt-4">
                      <button
                          onClick={closeModal}
                          className="px-4 cursor-pointer py-2 text-sm bg-gray-200 rounded"
                      >
                        Cancel
                      </button>
                      <button
                          onClick={handleModalSubmit}
                          className="px-4 py-2 text-sm bg-blue-600 text-white rounded cursor-pointer"
                      >
                        {isEditMode ? 'Update' : 'Add'}
                      </button>
                    </div>
                )}
          </div>
        </TypedModal>
      </div>
  );
}
