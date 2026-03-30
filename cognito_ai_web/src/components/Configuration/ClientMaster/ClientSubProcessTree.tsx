// ClientSubProcessTree
// Source: :contentReference[oaicite:0]{index=0}
import React, { useEffect, useReducer, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, Plus, Trash2 } from 'lucide-react';
import { apiRequest } from '../../../utils/helpers/ApiHelper';
import Modal from '../../../utils/Modal';
import Dropdown from '../../../utils/Dropdown';
import ConfirmPopup from '../../../utils/ConfirmPopup';

type ModalType =
    | ''
    | 'subprocess'
    | 'application'
    | 'integration'
    | 'transactions'
    | 'features'
    | 'programs'
    | 'viewApp'
    | 'viewIntegration'
    | 'viewTransaction'
    | 'viewFeature'
    | 'viewProgram';

interface Transaction {
    TransactionId: string | number;
    TransactionCode: string;
    Transaction: string;
}

interface Feature {
    FeatureId: string | number;
    Feature: string;
}

interface Program {
    ProgramId: string | number;
    ProgramName: string;
}

interface Application {
    ApplicationId: string | number;
    ApplicationName: string;
    Transactions?: Transaction[];
    Features?: Feature[];
    Programs?: Program[];
}

interface Integration {
    IntegrationId: string | number;
    IntegrationName?: string;
}

export interface TreeNodeData {
    ClientId?: string | number;
    ClientName?: string;
    BusinessUnitId?: string | number;
    BusinessProcessId?: string | number;
    BusinessProcessName?: string;
    BusinessSubProcessId?: string | number;
    BusinessSubProcessName?: string;
    Description?: string;
    ApplicationId?: string | number;
    Applications?: Application[];
    Integrations?: Integration[];
    SubProcesses?: TreeNodeData[];
    // Allow future keys
    [key: string]: unknown;
}

interface CurrBP {
    ClientId: string | number;
    BusinessUnitId: string | number;
    BusinessProcessId: string | number;
    BusinessProcessName?: string;
}

interface Props {
    CurrBP: CurrBP;
}

interface CurrAddEditObj {
    ApplicationId: string | number | '';
    IntegrationId: string | number | '';
    TransactionIds: string | string[] | '';
    FeatureIds?: string | string[] | '';
    ProgramIds?: string | string[] | '';
}

interface State {
    treeData: TreeNodeData | null;
    IsLoading: boolean;
    Error: string;
    modalOpen: boolean;
    selectedModalType: ModalType;
    selectedNode: any; // API returns untyped data; keep as any
    expandedNodes: Set<string | number>;
    name: string;
    description: string;
    applicationId: string;
    applicationOptions: unknown[];
    ApplicationsList: unknown[];
    FeaturesList: unknown[];
    ProgramsList: unknown[];
    availableSubProcessOptions: unknown[];
    selectedSubProcessIds: string;
    addNewSubProcessMode: boolean;

    IntegrationsList: unknown[];
    TransactionsList: unknown[];
    formError: string;
    CurrAddEditObj: CurrAddEditObj;
    isEditMode: boolean;
}

const ConfirmDelete = ({
                           message,
                           onConfirm,
                           children,
                       }: {
    message: string;
    onConfirm: () => void;
    children: React.ReactNode;
}) => (
    <div
        onClick={(e: React.MouseEvent<HTMLDivElement>) => {
            e.stopPropagation();
        }}
    >
        <ConfirmPopup message={message} onConfirm={onConfirm}>
            {children}
        </ConfirmPopup>
    </div>
);

const TreeToggleIcon = ({ isOpen }: { isOpen: boolean }) => (
    <motion.div
        initial={false}
        animate={{ rotate: isOpen ? 90 : 0 }}
        className={`text-gray-900 transition-transform ${isOpen ? 'text-blue-500' : ''}`}
    >
        <ChevronRight size={16} />
    </motion.div>
);

interface TreeNodeProps {
    node: TreeNodeData;
    onAddClick: (node: unknown, type: string) => void;
    onEditClick: (node: TreeNodeData) => void;
    expandedNodes: Set<string | number>;
    context: Partial<TreeNodeData>;
    toggleNode: (node: TreeNodeData) => void;
    onDelete: (
        item: Record<string, unknown>,
        type: 'transaction' | 'integration' | 'subprocess' | 'feature' | 'program',
        context?: unknown
    ) => void;
}

const TreeNode = ({
                      node,
                      onAddClick,
                      onEditClick,
                      expandedNodes,
                      context,
                      toggleNode,
                      onDelete,
                  }: TreeNodeProps) => {
    // @ts-ignore
    const isOpen = expandedNodes.has(
        (node.BusinessSubProcessId as string | number | undefined) ??
        (node.BusinessProcessId as string | number | undefined) ??
        (node.ClientId as string | number | undefined)
    );

    const enrichedNode: TreeNodeData = {
        ...node,
        ClientId: node.ClientId ?? context.ClientId,
        BusinessUnitId: node.BusinessUnitId ?? context.BusinessUnitId,
        BusinessProcessId: node.BusinessProcessId ?? context.BusinessProcessId,
        BusinessSubProcessId: node.BusinessSubProcessId ?? context.BusinessSubProcessId,
        ApplicationId: node.ApplicationId ?? context.ApplicationId,
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
                className={`flex border border-gray-100 items-center justify-between shadow rounded-lg transition ${
                    isTopParent
                        ? 'bg-[#e4edfa] cursor-pointer p-2.5 hover:bg-gray-100'
                        : isSecondParent
                            ? 'bg-[#ffedff] p-2 cursor-pointer hover:bg-blue-100'
                            : 'bg-gray-100 p-2 cursor-pointer'
                }`}
                onClick={() => toggleNode(node)}
            >
                <div className="flex  items-center gap-2 ">
                    {((node.SubProcesses?.length ?? 0) > 0 ||
                        (node.Applications?.length ?? 0) > 0 ||
                        (node.Integrations?.length ?? 0) > 0) && <TreeToggleIcon isOpen={isOpen} />}
                    {isTopParent ? (
                        <div className="text- font-semibold text-gray-800">
                            {node.BusinessProcessName || node.ClientName}
                        </div>
                    ) : (
                        <div className="text-sm font-medium pl-2  text-gray-800">
                            {node.BusinessSubProcessName as React.ReactNode}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {node.BusinessSubProcessId && (
                        <>
                            <ConfirmDelete
                                message="Delete this subprocess? All nested items may be removed."
                                onConfirm={() =>
                                    onDelete(
                                        {
                                            ClientId: enrichedNode.ClientId!,
                                            BusinessUnitId: enrichedNode.BusinessUnitId!,
                                            BusinessProcessId: enrichedNode.BusinessProcessId!,
                                            BusinessSubProcessId: enrichedNode.BusinessSubProcessId!,
                                        },
                                        'subprocess'
                                    )
                                }
                            >
                                <button className="text-red-700 mr-2 cursor-pointer" type="button">
                                    <Trash2 size={17} />
                                </button>
                            </ConfirmDelete>
                        </>
                    )}

                    <button
                        className="text-blue-600 hover:text-blue-800 cursor-pointer"
                        type="button"
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

                        {node.Applications?.length ? (
                            <div className="bg-blue-50 rounded-xl p-3 mt-3 shadow-sm">
                                <div className="font-semibold text-blue-800 text-sm mb-2">Transactions</div>
                                <ul className="ml-4">
                                    {node.Applications.map((app) => (
                                        <li key={String(app.ApplicationId)} className="mt-2">
                                            <div
                                                className="text-sm font-medium text-gray-800 cursor-pointer hover:underline"
                                                onClick={() =>
                                                    onAddClick(
                                                        {
                                                            app,
                                                            parentSubProcess: enrichedNode,
                                                        },
                                                        'viewApp'
                                                    )
                                                }
                                            >
                                                {app.ApplicationName}
                                            </div>
                                            {app.Transactions?.length ? (
                                                <ul className="ml-4 mt-1">
                                                    {app.Transactions.map((txn) => (
                                                        <li key={String(txn.TransactionId)} className="flex items-center gap-2 mt-1">
                                                            <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                                                            <div
                                                                className="text-sm text-gray-700 cursor-pointer hover:underline"
                                                                onClick={() =>
                                                                    onAddClick(
                                                                        {
                                                                            txn,
                                                                            parentApp: app,
                                                                        },
                                                                        'viewTransaction'
                                                                    )
                                                                }
                                                            >
                                                                {`${txn.Transaction} (${txn.TransactionCode})`}
                                                            </div>
                                                            <ConfirmDelete
                                                                message={`Delete transaction "${txn.Transaction}"?`}
                                                                onConfirm={() =>
                                                                    onDelete(
                                                                        {
                                                                            ClientId: enrichedNode.ClientId!,
                                                                            ApplicationId: (enrichedNode.ApplicationId ??
                                                                                app.ApplicationId) as string | number,
                                                                            BusinessUnitId: enrichedNode.BusinessUnitId!,
                                                                            BusinessProcessId: enrichedNode.BusinessProcessId!,
                                                                            BusinessSubProcessId: enrichedNode.BusinessSubProcessId!,
                                                                            TransactionCode: txn.TransactionCode,
                                                                        },
                                                                        'transaction'
                                                                    )
                                                                }
                                                            >
                                                                <button className="text-red-700 text-xs ml-2 cursor-pointer" type="button">
                                                                    <Trash2 size={13} />
                                                                </button>
                                                            </ConfirmDelete>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : null}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : null}

                        {node.Applications?.some((app) => (app.Features?.length ?? 0) > 0) && (
                            <div className="bg-indigo-50 rounded-xl p-3 mt-3 shadow-sm mt-4">
                                <div className="font-semibold text-indigo-800 text-sm mb-2">Features</div>
                                <ul className="ml-4">
                                    {node.Applications.map(
                                        (app) =>
                                            (app.Features?.length ?? 0) > 0 && (
                                                <li key={String(app.ApplicationId)} className="mt-2">
                                                    <div
                                                        className="text-sm font-medium text-gray-800 cursor-pointer hover:underline"
                                                        onClick={() =>
                                                            onAddClick(
                                                                {
                                                                    app,
                                                                    parentSubProcess: enrichedNode,
                                                                },
                                                                'viewApp'
                                                            )
                                                        }
                                                    >
                                                        {app.ApplicationName}
                                                    </div>
                                                    <ul className="ml-4 mt-1">
                                                        {app.Features?.map((feature) => (
                                                            <li key={String(feature.FeatureId)} className="flex items-center gap-2 mt-1">
                                                                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                                                <div
                                                                    className="text-sm text-gray-700 cursor-pointer hover:underline"
                                                                    onClick={() =>
                                                                        onAddClick(
                                                                            {
                                                                                feature,
                                                                                parentApp: app,
                                                                            },
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
                                                                                ClientId: enrichedNode.ClientId!,
                                                                                ApplicationId: app.ApplicationId,
                                                                                BusinessUnitId: enrichedNode.BusinessUnitId!,
                                                                                BusinessProcessId: enrichedNode.BusinessProcessId!,
                                                                                BusinessSubProcessId: enrichedNode.BusinessSubProcessId!,
                                                                                FeatureId: feature.FeatureId,
                                                                            },
                                                                            'feature'
                                                                        )
                                                                    }
                                                                >
                                                                    <button className="text-red-700 text-xs ml-2 cursor-pointer" type="button">
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
                                    {node.Applications.map(
                                        (app) =>
                                            (app.Programs?.length ?? 0) > 0 && (
                                                <li key={String(app.ApplicationId)} className="mt-2">
                                                    <div
                                                        className="text-sm font-medium text-gray-800 cursor-pointer hover:underline"
                                                        onClick={() =>
                                                            onAddClick(
                                                                {
                                                                    app,
                                                                    parentSubProcess: enrichedNode,
                                                                },
                                                                'viewApp'
                                                            )
                                                        }
                                                    >
                                                        {app.ApplicationName}
                                                    </div>
                                                    <ul className="ml-4 mt-1">
                                                        {app.Programs?.map((program) => (
                                                            <li key={String(program.ProgramId)} className="flex items-center gap-2 mt-1">
                                                                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                                                <div
                                                                    className="text-sm text-gray-700 cursor-pointer hover:underline"
                                                                    onClick={() =>
                                                                        onAddClick(
                                                                            {
                                                                                program,
                                                                                parentApp: app,
                                                                            },
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
                                                                                ClientId: enrichedNode.ClientId!,
                                                                                ApplicationId: app.ApplicationId,
                                                                                BusinessUnitId: enrichedNode.BusinessUnitId!,
                                                                                BusinessProcessId: enrichedNode.BusinessProcessId!,
                                                                                BusinessSubProcessId: enrichedNode.BusinessSubProcessId!,
                                                                                ProgramId: program.ProgramId,
                                                                            },
                                                                            'program'
                                                                        )
                                                                    }
                                                                >
                                                                    <button className="text-red-700 text-xs ml-2 cursor-pointer" type="button">
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

                        {node.Integrations?.length ? (
                            <div className="bg-green-50 rounded-xl p-3 mt-3 shadow-sm">
                                <div className="font-semibold text-green-800 text-sm mb-2">Integrations</div>
                                <ul className="ml-4">
                                    {node.Integrations.map((intg) => (
                                        <li key={String(intg.IntegrationId)} className="mt-2 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                                            <div
                                                className="text-sm text-gray-700 cursor-pointer hover:underline"
                                                onClick={() =>
                                                    onAddClick(
                                                        {
                                                            intg,
                                                            parentSubProcess: enrichedNode,
                                                        },
                                                        'viewIntegration'
                                                    )
                                                }
                                            >
                                                {intg.IntegrationName || intg.IntegrationId}
                                            </div>
                                            <ConfirmDelete
                                                message={`Delete integration "${intg.IntegrationName || intg.IntegrationId}"?`}
                                                onConfirm={() =>
                                                    onDelete(
                                                        {
                                                            ClientId: enrichedNode.ClientId!,
                                                            ApplicationId: enrichedNode.ApplicationId,
                                                            BusinessUnitId: enrichedNode.BusinessUnitId!,
                                                            BusinessProcessId: enrichedNode.BusinessProcessId!,
                                                            BusinessSubProcessId: enrichedNode.BusinessSubProcessId!,
                                                            IntegrationId: intg.IntegrationId,
                                                        },
                                                        'integration'
                                                    )
                                                }
                                            >
                                                <button className="text-red-700 text-xs ml-2 cursor-pointer" type="button">
                                                    <Trash2 size={13} />
                                                </button>
                                            </ConfirmDelete>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : null}

                        {node.SubProcesses?.map((child) => (
                            <TreeNode
                                key={String(child.BusinessSubProcessId)}
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
    expandedNodes: new Set<string | number>(),
    name: '',
    description: '',
    applicationId: '',
    applicationOptions: [],
    ApplicationsList: [],
    FeaturesList: [],
    ProgramsList: [],
    availableSubProcessOptions: [],
    selectedSubProcessIds: '',
    addNewSubProcessMode: false,

    IntegrationsList: [],
    TransactionsList: [],
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

const capitalizeTitle = (type: string): string => {
    if (type === 'subprocess') return 'Subprocess';
    if (type === 'application') return 'Application';
    if (type === 'integration') return 'Integration';
    return type.charAt(0).toUpperCase() + type.slice(1);
};

const ClientSubProcessTree = (props: Props) => {
    const [state, setState] = useReducer(reducer, initialState);
    const didFetchData = useRef<boolean>(false);

    const handleDropdownClientInfo = async (
        val: string | string[],
        item: unknown,
        key: keyof CurrAddEditObj
    ): Promise<void> => {
        setState({
            CurrAddEditObj: {
                ...state.CurrAddEditObj,
                [key]: val as never,
            },
            formError: '',
        });

        const isSubProcess = !!state.selectedNode?.BusinessSubProcessId;
        const node: TreeNodeData | null = state.selectedNode;

        if (key === 'ApplicationId') {
            const body: Record<string, unknown> = {
                ApplicationId: val,
            };

            if (isSubProcess && node?.BusinessSubProcessId) {
                body.BusinessSubProcessId = node.BusinessSubProcessId;
            } else if (node?.BusinessProcessId) {
                body.BusinessProcessId = node.BusinessProcessId;
            }

            if (state.selectedModalType === 'transactions') {
                const resp: any = await apiRequest(
                    isSubProcess ? '/GetTransactionsBySubprocessId' : '/GetTransactionsByBusinessprocessId',
                    body
                );
                setState({ TransactionsList: resp.ResponseData as unknown[] });
            }

            if (state.selectedModalType === 'features') {
                const resp: any = await apiRequest(
                    isSubProcess ? '/GetFeaturesBySubprocessId' : '/GetFeaturesByBusinessprocessId',
                    body
                );
                setState({ FeaturesList: resp.ResponseData as unknown[] });
            }

            if (state.selectedModalType === 'programs') {
                const resp: any = await apiRequest(
                    isSubProcess ? '/GetProgramsBySubprocessId' : '/GetProgramsByBusinessprocessId',
                    body
                );
                setState({ ProgramsList: resp.ResponseData as unknown[] });
            }
        }
    };

    const getTransactionsApplicationsList = async (parentSubProcessId: string | number | null = null) => {
        try {
            const api = parentSubProcessId
                ? '/GetTransactionsApplicationsMasterBySubprocessId'
                : '/GetTransactionsApplicationsMasterByBusinessprocessId';

            const body = parentSubProcessId
                ? {
                    BusinessProcessId: props.CurrBP.BusinessProcessId,
                    BusinessSubProcessId: parentSubProcessId,
                }
                : {
                    BusinessProcessId: props.CurrBP.BusinessProcessId,
                };

            const resp: any = await apiRequest(api, body);
            setState({ ApplicationsList: resp.ResponseData as unknown[] });
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error('Failed to load applications list:', err);
        }
    };

    const getFeaturesApplicationsList = async (parentSubProcessId: string | number | null = null) => {
        try {
            const api = parentSubProcessId
                ? '/GetFeaturesApplicationsMasterBySubprocessId'
                : '/GetFeaturesApplicationsMasterByBusinessprocessId';

            const body = parentSubProcessId
                ? {
                    BusinessProcessId: props.CurrBP.BusinessProcessId,
                    BusinessSubProcessId: parentSubProcessId,
                }
                : {
                    BusinessProcessId: props.CurrBP.BusinessProcessId,
                };

            const resp: any = await apiRequest(api, body);
            setState({ ApplicationsList: resp.ResponseData as unknown[] });
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error('Failed to load applications list:', err);
        }
    };

    const getProgramsApplicationsList = async (parentSubProcessId: string | number | null = null) => {
        try {
            const api = parentSubProcessId
                ? '/GetProgramsApplicationsMasterBySubprocessId'
                : '/GetProgramsApplicationsMasterByBusinessprocessId';

            const body = parentSubProcessId
                ? {
                    BusinessProcessId: props.CurrBP.BusinessProcessId,
                    BusinessSubProcessId: parentSubProcessId,
                }
                : {
                    BusinessProcessId: props.CurrBP.BusinessProcessId,
                };

            const resp: any = await apiRequest(api, body);
            setState({ ApplicationsList: resp.ResponseData as unknown[] });
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error('Failed to load applications list:', err);
        }
    };

    const getTransactionsMasterList = async (SearchString = '') => {
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

    const getIntegrationsList = async (SearchString = '') => {
        try {
            const resp: any = await apiRequest('/GetIntegrationsMaster', { SearchString });
            setState({ IntegrationsList: resp.ResponseData as unknown[] });
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error('Error loading integrations list:', err);
        }
    };

    const getFeaturesList = async (SearchString = '') => {
        try {
            const resp: any = await apiRequest('/GetFeaturesMaster', { SearchString });
            setState({ FeaturesList: resp.ResponseData as unknown[] });
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error('Error loading features list:', err);
        }
    };

    const getProgramsList = async (SearchString = '') => {
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
            const parentSubProcessId = (state.selectedNode?.BusinessSubProcessId as string | number | undefined) ?? null;
            getTransactionsApplicationsList(parentSubProcessId);
            getTransactionsMasterList();
        }
        if (state.selectedModalType === 'features') {
            const parentSubProcessId = (state.selectedNode?.BusinessSubProcessId as string | number | undefined) ?? null;
            getFeaturesApplicationsList(parentSubProcessId);
            getFeaturesList();
        }
        if (state.selectedModalType === 'programs') {
            const parentSubProcessId = (state.selectedNode?.BusinessSubProcessId as string | number | undefined) ?? null;
            getProgramsApplicationsList(parentSubProcessId);
            getProgramsList();
        }
        if (state.selectedModalType === 'integration') {
            getIntegrationsList();
        }
    }, [state.selectedModalType]);

    const fetchTreeData = async () => {
        setState({ IsLoading: true, Error: '' });
        try {
            const res: any = await apiRequest('/GetClientSubProcesses', {
                ClientId: props.CurrBP.ClientId,
                BusinessUnitId: props.CurrBP.BusinessUnitId,
                BusinessProcessId: props.CurrBP.BusinessProcessId,
            });
            const rootNode = res.ResponseData as TreeNodeData;
            const currentExpanded = new Set<string | number>(state.expandedNodes);
            if (rootNode.BusinessProcessId !== undefined && rootNode.BusinessProcessId !== null) {
                currentExpanded.add(rootNode.BusinessProcessId as string | number);
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
        fetchTreeData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const openModal = (node: any, type: ModalType = '') => {
        setState({
            selectedNode: node,
            modalOpen: true,
            selectedModalType: type,
            formError: '',
            selectedSubProcessIds: '',
            name: '',
            description: '',
            applicationId: '',
            isEditMode: false,
        });
    };

    const openEditModal = (node: any) => {
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
            availableSubProcessOptions: [],
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
        type: 'transaction' | 'integration' | 'subprocess' | 'feature' | 'program',
        context?: unknown
    ) => {
        try {
            if (type === 'transaction') {
                await apiRequest('/DeleteClientApplicationTransaction', item);
            } else if (type === 'integration') {
                await apiRequest('/DeleteSubProcessIntegrations', item);
            } else if (type === 'subprocess') {
                await apiRequest('/DeleteClientSubProcess', item);
            } else if (type === 'feature') {
                await apiRequest('/DeleteClientSubProcessApplicationFeature', item);
            } else if (type === 'program') {
                await apiRequest('/DeleteClientSubProcessApplicationProgram', item);
            }

            // Refresh tree after deletion
            fetchTreeData();
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error(`Failed to delete ${type}:`, err);
        }
    };

    const getBPSubProcessOptions = async (parentSubProcessId: string | number | null = null) => {
        try {
            const api = parentSubProcessId
                ? '/GetBPSubProcessesDropdownOptionsBySPId'
                : '/GetBPSubProcessesDropdownOptions';

            const body = parentSubProcessId
                ? {
                    BusinessProcessId: props.CurrBP.BusinessProcessId,
                    BusinessSubProcessId: parentSubProcessId,
                }
                : {
                    BusinessProcessId: props.CurrBP.BusinessProcessId,
                };

            const resp: any = await apiRequest(api, body);
            setState({ availableSubProcessOptions: resp.ResponseData as unknown[] });
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error('Failed to load subprocess options:', err);
        }
    };

    const toggleNode = (node: TreeNodeData) => {
        const nodeId =
            (node.BusinessSubProcessId as string | number | undefined) ??
            (node.BusinessProcessId as string | number | undefined) ??
            (node.ClientId as string | number | undefined);
        if (nodeId === undefined || nodeId === null) return;
        const newExpandedNodes = new Set<string | number>(state.expandedNodes);
        if (newExpandedNodes.has(nodeId)) {
            newExpandedNodes.delete(nodeId);
        } else {
            newExpandedNodes.add(nodeId);
        }
        setState({ expandedNodes: newExpandedNodes });
    };

    const handleModalSubmit = async () => {
        const { selectedNode, selectedModalType, name, description, CurrAddEditObj, isEditMode } = state;

        if (!selectedNode) return;

        try {
            if (selectedModalType === 'subprocess') {
                if (state.addNewSubProcessMode) {
                    if (!name.trim()) {
                        setState({ formError: 'Name is required' });
                        return;
                    }

                    // 1. Add to BusinessProcessSubProcessMaster
                    const newSubProcessIdResult: any = await apiRequest('/AddUpdateBPSubProcessMaster', {
                        BusinessProcessId: selectedNode.BusinessProcessId,
                        BusinessSubProcessName: name,
                        Description: description,
                        ParentSubProcessId: (selectedNode.BusinessSubProcessId as string | number | null) ?? null,
                    });
                    const newId = newSubProcessIdResult?.insertedId;
                    // 2. Add to ClientSubProcessMaster
                    await apiRequest('/AddUpdateClientSubProcess', {
                        ClientId: selectedNode.ClientId,
                        BusinessUnitId: selectedNode.BusinessUnitId,
                        BusinessProcessId: selectedNode.BusinessProcessId,
                        BusinessSubProcessIds: newId,
                        ParentSubProcessId: (selectedNode.BusinessSubProcessId as string | number | null) ?? null,
                    });
                } else {
                    await apiRequest('/AddUpdateClientSubProcess', {
                        ClientId: selectedNode.ClientId,
                        BusinessUnitId: selectedNode.BusinessUnitId,
                        BusinessProcessId: selectedNode.BusinessProcessId,
                        BusinessSubProcessIds: state.selectedSubProcessIds,
                        ParentSubProcessId: (selectedNode.BusinessSubProcessId as string | number | null) ?? null,
                    });
                }
                closeModal();
                fetchTreeData();
            } else if (selectedModalType === 'features') {
                const { ApplicationId, FeatureIds } = CurrAddEditObj;
                const hasSelection =
                    !!ApplicationId && !!FeatureIds && ((Array.isArray(FeatureIds) ? FeatureIds : [FeatureIds]).length > 0);
                if (!hasSelection) {
                    setState({ formError: 'Please select an application and at least one feature.' });
                    return;
                }
                await apiRequest('/AddClientSubProcessApplicationFeatures', {
                    ClientId: selectedNode.ClientId,
                    BusinessUnitId: selectedNode.BusinessUnitId,
                    BusinessProcessId: selectedNode.BusinessProcessId,
                    BusinessSubProcessId: selectedNode.BusinessSubProcessId,
                    ApplicationId,
                    FeatureIds,
                });
                closeModal();
                fetchTreeData();
            } else if (selectedModalType === 'programs') {
                const { ApplicationId, ProgramIds } = CurrAddEditObj;
                const hasSelection =
                    !!ApplicationId && !!ProgramIds && ((Array.isArray(ProgramIds) ? ProgramIds : [ProgramIds]).length > 0);
                if (!hasSelection) {
                    setState({ formError: 'Please select an application and at least one program.' });
                    return;
                }
                await apiRequest('/AddClientSubProcessApplicationPrograms', {
                    ClientId: selectedNode.ClientId,
                    BusinessUnitId: selectedNode.BusinessUnitId,
                    BusinessProcessId: selectedNode.BusinessProcessId,
                    BusinessSubProcessId: selectedNode.BusinessSubProcessId,
                    ApplicationId,
                    ProgramIds,
                });
                closeModal();
                fetchTreeData();
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
                const hasSelection =
                    !!ApplicationId &&
                    !!TransactionIds &&
                    ((Array.isArray(TransactionIds) ? TransactionIds : [TransactionIds]).length > 0);
                if (!hasSelection) {
                    setState({ formError: 'Please select an application and at least one transaction.' });
                    return;
                }
                await apiRequest('/AddClientApplicationTransactions', {
                    ClientId: selectedNode.ClientId,
                    BusinessUnitId: selectedNode.BusinessUnitId,
                    BusinessProcessId: selectedNode.BusinessProcessId,
                    BusinessSubProcessId: selectedNode.BusinessSubProcessId,
                    ApplicationId,
                    TransactionIds,
                });
                closeModal();
                fetchTreeData();
            } else if (selectedModalType === 'integration') {
                if (!CurrAddEditObj.IntegrationId) {
                    setState({ formError: 'Please select an integration.' });
                    return;
                }
                await apiRequest('/AddSubProcessIntegrations', {
                    ClientId: selectedNode.ClientId,
                    BusinessUnitId: selectedNode.BusinessUnitId,
                    BusinessProcessId: selectedNode.BusinessProcessId,
                    BusinessSubProcessId: selectedNode.BusinessSubProcessId,
                    IntegrationId: CurrAddEditObj.IntegrationId,
                });
                closeModal();
                fetchTreeData();
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

            const res: any = await apiRequest('/GetClientSubProcesses', {
                ClientId: props.CurrBP.ClientId,
                BusinessUnitId: props.CurrBP.BusinessUnitId,
                BusinessProcessId: props.CurrBP.BusinessProcessId,
            });
            setState({ treeData: res.ResponseData as TreeNodeData, IsLoading: false });
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

            <Modal
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
                                type="button"
                                onClick={() => {
                                    setState({ selectedModalType: 'subprocess', formError: '' });

                                    // Fetch subprocess options based on whether it's root or nested
                                    const parentId =
                                        (state.selectedNode?.BusinessSubProcessId as string | number | null | undefined) ?? null;
                                    getBPSubProcessOptions(parentId);
                                }}
                            >
                                Add Subprocess
                            </button>
                            <button
                                className="px-4 py-2 bg-green-600 text-white rounded"
                                type="button"
                                onClick={() => setState({ selectedModalType: 'transactions', formError: '' })}
                            >
                                Add Transactions
                            </button>
                            <button
                                className="px-4 py-2 bg-purple-600 text-white rounded"
                                type="button"
                                onClick={() => setState({ selectedModalType: 'integration', formError: '' })}
                            >
                                Add Integrations
                            </button>
                            <button
                                className="px-4 py-2 bg-indigo-600 text-white rounded"
                                type="button"
                                onClick={() => setState({ selectedModalType: 'features', formError: '' })}
                            >
                                Add Features
                            </button>
                            <button
                                className="px-4 py-2 bg-purple-700 text-white rounded"
                                type="button"
                                onClick={() => setState({ selectedModalType: 'programs', formError: '' })}
                            >
                                Add Programs
                            </button>
                        </div>
                    )}

                    {selectedModalType === 'subprocess' && (
                        <>
                            {!state.addNewSubProcessMode ? (
                                <>
                                    <Dropdown
                                        mode="multiple"
                                        options={state.availableSubProcessOptions}
                                        value={state.selectedSubProcessIds}
                                        onChange={(val: string | string[]) => setState({ selectedSubProcessIds: val as string })}
                                    />
                                    <button
                                        onClick={() => setState({ addNewSubProcessMode: true })}
                                        className="mt-2 text-sm text-blue-600 hover:underline"
                                        type="button"
                                    >
                                        + Add new subprocess
                                    </button>
                                </>
                            ) : (
                                <>
                                    <input
                                        type="text"
                                        placeholder="New Subprocess Name"
                                        className="w-full border px-3 py-2 rounded mb-2 mt-4"
                                        value={name}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setState({ name: e.target.value })}
                                    />
                                    <textarea
                                        placeholder="Description"
                                        className="w-full border px-3 py-2 rounded mb-4"
                                        value={description}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                            setState({ description: e.target.value })
                                        }
                                    />
                                </>
                            )}
                        </>
                    )}

                    {selectedModalType === 'transactions' && (
                        <>
                            <div>
                                <label className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                    Applications <span className="text-red-500">*</span>
                                </label>
                                <Dropdown
                                    mode="single"
                                    options={state.ApplicationsList}
                                    value={state.CurrAddEditObj.ApplicationId}
                                    onChange={(val: string | string[], item: unknown) =>
                                        handleDropdownClientInfo(val, item, 'ApplicationId')
                                    }
                                    onSearch={(q: string) => {
                                        // eslint-disable-next-line no-console
                                        console.log('Search (App):', q);
                                    }}
                                />
                            </div>

                            <div className="pb-6">
                                <label className="block mt-4 text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                    Transactions <span className="text-red-500">*</span>
                                </label>
                                <Dropdown
                                    mode="multiple"
                                    options={state.TransactionsList}
                                    value={state.CurrAddEditObj.TransactionIds}
                                    onChange={(val: string | string[], item: unknown) =>
                                        handleDropdownClientInfo(val, item, 'TransactionIds')
                                    }
                                    onSearch={(q: string) => {
                                        // eslint-disable-next-line no-console
                                        console.log('Search (Transaction):', q);
                                    }}
                                />
                            </div>
                        </>
                    )}

                    {selectedModalType === 'features' && (
                        <>
                            <label className="block text-sm font-medium text-[#2C3E50] mb-1">
                                Applications <span className="text-red-500">*</span>
                            </label>
                            <Dropdown
                                mode="single"
                                options={state.ApplicationsList}
                                value={state.CurrAddEditObj.ApplicationId}
                                onChange={(val: string | string[], item: unknown) =>
                                    handleDropdownClientInfo(val, item, 'ApplicationId')
                                }
                            />
                            <label className="block mt-4 text-sm font-medium text-[#2C3E50] mb-1">
                                Features <span className="text-red-500">*</span>
                            </label>
                            <Dropdown
                                mode="multiple"
                                options={state.FeaturesList}
                                value={state.CurrAddEditObj.FeatureIds as string | string[] | ''}
                                onChange={(val: string | string[], item: unknown) =>
                                    handleDropdownClientInfo(val, item, 'FeatureIds')
                                }
                            />
                        </>
                    )}

                    {selectedModalType === 'programs' && (
                        <>
                            <label className="block text-sm font-medium text-[#2C3E50] mb-1">
                                Applications <span className="text-red-500">*</span>
                            </label>
                            <Dropdown
                                mode="single"
                                options={state.ApplicationsList}
                                value={state.CurrAddEditObj.ApplicationId}
                                onChange={(val: string | string[], item: unknown) =>
                                    handleDropdownClientInfo(val, item, 'ApplicationId')
                                }
                            />
                            <label className="block mt-4 text-sm font-medium text-[#2C3E50] mb-1">
                                Programs <span className="text-red-500">*</span>
                            </label>
                            <Dropdown
                                mode="multiple"
                                options={state.ProgramsList}
                                value={state.CurrAddEditObj.ProgramIds as string | string[] | ''}
                                onChange={(val: string | string[], item: unknown) =>
                                    handleDropdownClientInfo(val, item, 'ProgramIds')
                                }
                            />
                        </>
                    )}

                    {selectedModalType === 'integration' && (
                        <Dropdown
                            mode="single"
                            options={state.IntegrationsList}
                            value={state.CurrAddEditObj.IntegrationId}
                            onChange={(val: string | string[], item: unknown) =>
                                handleDropdownClientInfo(val, item, 'IntegrationId')
                            }
                            onSearch={(q: string) => {
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
                                <button onClick={closeModal} className="px-4 cursor-pointer py-2 text-sm bg-gray-200 rounded" type="button">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleModalSubmit}
                                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded cursor-pointer"
                                    type="button"
                                >
                                    {isEditMode ? 'Update' : 'Add'}
                                </button>
                            </div>
                        )}
                </div>
            </Modal>
        </div>
    );
};

export default ClientSubProcessTree;
