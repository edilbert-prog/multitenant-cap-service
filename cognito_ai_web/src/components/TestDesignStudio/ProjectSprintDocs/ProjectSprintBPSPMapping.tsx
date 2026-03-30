import React, {useEffect, useReducer, useRef, useState} from 'react';
import { apiRequest } from '../../../utils/helpers/ApiHelper';
import Spinner from '../../../utils/Spinner';
import ErrorScreen from '../../../utils/ErrorScreen';
import ProjectSprintSubProcessTree from './ProjectSprintSubProcessTree';
import { Plus } from 'lucide-react';
import Toast from "@/utils/Toast";
type ToggleType =
    | 'subprocess'
    | 'businessprocess'
    | 'application'
    | 'transaction'
    | 'feature'
    | 'program'
    | 'integration';

interface TransactionItem {
    TransactionId: string;
    Transaction: string;
    TransactionCode?: string;
    ProjectSprintTransactionId?: string;
    selected?: boolean;
}

interface FeatureItem {
    FeatureId: string;
    Feature: string;
    ProjectSprintFeatureId?: string;
    selected?: boolean;
}

interface ProgramItem {
    ProgramId: string;
    ProgramName: string;
    ProjectSprintProgramId?: string;
    selected?: boolean;
}

interface IntegrationItem {
    IntegrationId: string;
    IntegrationName?: string;
    ApplicationId?: string;
    ApplicationName?: string;
    ProjectSprintProcessIntegrationId?: string;
    selected?: boolean;
}

interface ApplicationItem {
    ApplicationId: string;
    ApplicationName: string;
    ProjectSprintProcessApplicationId?: string;
    selected?: boolean;
    indeterminate?: boolean;
    Transactions?: TransactionItem[];
    Features?: FeatureItem[];
    Programs?: ProgramItem[];
}

interface SubProcessNode {
    BusinessSubProcessId?: string;
    BusinessSubProcessName?: string;
    ProjectSprintProcessId?: string;
    selected?: boolean;
    indeterminate?: boolean;
    delete?: boolean;
    Applications?: ApplicationItem[];
    Integrations?: IntegrationItem[];
    SubProcesses?: SubProcessNode[];
}

interface BusinessProcess {
    BusinessProcessId: string;
    BusinessProcessName: string;
    SubProcesses?: SubProcessNode[];
}

interface TreeData {
    BusinessProcesses: BusinessProcess[];
}

type ToggleNode = Pick<BusinessProcess, 'BusinessProcessId'> &
    Pick<SubProcessNode, 'BusinessSubProcessId'>;

interface SubProcessInsert {
    ClientId: string;
    ProjectSprintProcessId: string;
    ProjectId: string;
    SprintId: string;
    BusinessUnitId: string;
    BusinessProcessId: string;
    BusinessProcessName: string;
    BusinessSubProcessId?: string;
    BusinessSubProcessName?: string;
    delete: boolean;
    ParentSubProcessId: string | null;
    SortKey: number;
    Status: number;
}

interface ApplicationInsert {
    ClientId: string;
    ProjectId: string;
    BusinessUnitId: string;
    ProjectSprintProcessApplicationId?: string;
    BusinessProcessId: string;
    BusinessProcessName: string;
    BusinessSubProcessId?: string;
    BusinessSubProcessName?: string;
    ApplicationId?: string;
    ApplicationName?: string;
    delete: boolean;
    IntegrationId: string;
    IntegrationName: string;
    SortKey: number;
    Status: number;
    SprintId: string;
    SessionId: string | null;
}

interface TransactionInsert {
    ClientId: string;
    ProjectId: string;
    BusinessUnitId: string;
    BusinessProcessId: string;
    BusinessProcessName: string;
    BusinessSubProcessId?: string;
    BusinessSubProcessName?: string;
    ApplicationId?: string;
    ApplicationName?: string;
    TransactionId: string;
    Transaction: string;
    TransactionCode?: string;
    ProjectSprintTransactionId: string;
    delete: boolean;
    SortKey: number;
    Status: number;
    SprintId: string;
    SessionId: string | null;
}

interface FeatureInsert {
    ClientId: string;
    ProjectId: string;
    BusinessUnitId: string;
    BusinessProcessId: string;
    BusinessProcessName: string;
    BusinessSubProcessId?: string;
    BusinessSubProcessName?: string;
    ApplicationId?: string;
    ApplicationName?: string;
    FeatureId: string;
    Feature: string;
    ProjectSprintFeatureId: string;
    delete: boolean;
    SortKey: number;
    Status: number;
    SprintId: string;
    SessionId: string | null;
}

interface ProgramInsert {
    ClientId: string;
    ProjectId: string;
    BusinessUnitId: string;
    BusinessProcessId: string;
    BusinessProcessName: string;
    BusinessSubProcessId?: string;
    BusinessSubProcessName?: string;
    ApplicationId?: string;
    ApplicationName?: string;
    ProgramId: string;
    ProgramName: string;
    ProjectSprintProgramId: string;
    delete: boolean;
    SortKey: number;
    Status: number;
    SprintId: string;
    SessionId: string | null;
}

interface IntegrationInsert {
    ClientId: string;
    ProjectId: string;
    BusinessUnitId: string;
    BusinessProcessId: string;
    BusinessProcessName: string;
    BusinessSubProcessId?: string;
    BusinessSubProcessName?: string;
    ProjectSprintProcessIntegrationId: string;
    ApplicationId?: string;
    ApplicationName: string;
    IntegrationId: string;
    IntegrationName: string;
    delete: boolean;
    SortKey: number;
    Status: number;
    SprintId: string;
    SessionId: string | null;
}

interface FlattenMeta {
    ClientId: string;
    BusinessUnitId: string;
    ProjectSprintProcessId: string;
    ProjectId: string;
    SprintId: string;
    SessionId?: string | null;
}

interface FlattenResult {
    SubProcesses: SubProcessInsert[];
    Applications: ApplicationInsert[];
    Transactions: TransactionInsert[];
    Features: FeatureInsert[];
    Programs: ProgramInsert[];
    Integrations: IntegrationInsert[];
}

interface State {
    ActionType: string;
    ViewSubProcess: boolean;
    SubProcessesTreeData: TreeData;
    IsLoading: boolean;
    showToast: boolean;
    SavingLoader: boolean;
    Error?: string;
}

type Props = {
    CurrentSprint: {
        ClientId: string;
        BusinessUnitId: string;
        ProjectId: string;
        SprintId: string;
    };
};


export default function ProjectSprintBPSPMapping(props: Props) {
    const [state, setState] = useReducer(
        (s: State, ns: Partial<State>): State => ({ ...s, ...ns }),
        {
            ActionType: '',
            ViewSubProcess: false,
            SubProcessesTreeData: { BusinessProcesses: [] },
            IsLoading: true,
            showToast: false,
            SavingLoader: false,
        }
    );

    const didFetchData = useRef(false);
    const [initialData, setInitialData] = useState<TreeData | null>(null);
    const [toastMessage, setToastMessage] = useState('');
    const [showToast, setShowToast] = useState(false);

    useEffect(() => {
        if (didFetchData.current) return;
        didFetchData.current = true;

        const init = async () => {
            setState({ IsLoading: true });
            await Promise.all([getData('')]);
            setState({ IsLoading: false });
        };
        init();
    }, []);

    const getData = async (SearchQuery: string = '', PageNo: number = 1) => {
        try {
            const resp: any = await apiRequest('/GetClientSubProcessesProjectSprintV3', {
                ClientId: props.CurrentSprint.ClientId,
                BusinessUnitId: props.CurrentSprint.BusinessUnitId,
                ProjectId: props.CurrentSprint.ProjectId,
                SprintId: props?.CurrentSprint.SprintId,
                PageNo: PageNo,
                SearchString: SearchQuery,
            });
            if (resp.ResponseData) {
                setState({
                    SubProcessesTreeData: resp.ResponseData as TreeData,
                });
                setInitialData(JSON.parse(JSON.stringify(resp.ResponseData))); // 🔹 snapshot initial state
            } else {
                setState({ SubProcessesTreeData: { BusinessProcesses: [] } });
                setInitialData({ BusinessProcesses: [] });
            }
        } catch (err: any) {
            setState({ Error: err.toString() });
        } finally {
            setState({ IsLoading: false });
        }
    };

    function flattenForDBInsertion(
        treeData: BusinessProcess[] | undefined,
        meta: FlattenMeta
    ): FlattenResult {
        const subProcesses: SubProcessInsert[] = [];
        const applications: ApplicationInsert[] = [];
        const integrations: IntegrationInsert[] = [];
        const transactions: TransactionInsert[] = [];
        const features: FeatureInsert[] = [];
        const programs: ProgramInsert[] = [];

        const traverse = (
            node: SubProcessNode,
            parentId: string | null = null,
            parentProcessId: string,
            parentProcessName: string
        ) => {
            const isSelected = !!(node as SubProcessNode).selected || !!(node as SubProcessNode).indeterminate;

            if ((node.ProjectSprintProcessId ?? '') === '' && !isSelected) return;

            if (node.BusinessSubProcessId) {
                subProcesses.push({
                    ClientId: meta.ClientId,
                    ProjectSprintProcessId: node.ProjectSprintProcessId || meta.ProjectSprintProcessId,
                    ProjectId: meta.ProjectId,
                    SprintId: meta.SprintId,
                    BusinessUnitId: meta.BusinessUnitId,
                    BusinessProcessId: parentProcessId,
                    BusinessProcessName: parentProcessName,
                    BusinessSubProcessId: node.BusinessSubProcessId,
                    BusinessSubProcessName: node.BusinessSubProcessName,
                    delete: (node as SubProcessNode).delete || false,
                    ParentSubProcessId: parentId,
                    SortKey: 0,
                    Status: 1,
                });

                (node.Applications || []).forEach((app) => {
                    const appSelected = !!app.selected;
                    if (appSelected || (app.ProjectSprintProcessApplicationId && !app.selected)) {
                        applications.push({
                            ClientId: meta.ClientId,
                            ProjectId: meta.ProjectId,
                            BusinessUnitId: meta.BusinessUnitId,
                            ProjectSprintProcessApplicationId: app.ProjectSprintProcessApplicationId,
                            BusinessProcessId: parentProcessId,
                            BusinessProcessName: parentProcessName,
                            BusinessSubProcessId: node.BusinessSubProcessId,
                            BusinessSubProcessName: node.BusinessSubProcessName,
                            ApplicationId: app.ApplicationId,
                            ApplicationName: app.ApplicationName,
                            delete: !appSelected,
                            IntegrationId: '',
                            IntegrationName: '',
                            SortKey: 0,
                            Status: 1,
                            SprintId: meta.SprintId,
                            SessionId: meta.SessionId || null,
                        });
                    }

                    (app.Transactions || []).forEach((txn) => {
                        const selected = txn.selected === true;
                        const exists = !!txn.ProjectSprintTransactionId;
                        if (selected || exists) {
                            transactions.push({
                                ClientId: meta.ClientId,
                                ProjectId: meta.ProjectId,
                                BusinessUnitId: meta.BusinessUnitId,
                                BusinessProcessId: parentProcessId,
                                BusinessProcessName: parentProcessName,
                                BusinessSubProcessId: node.BusinessSubProcessId,
                                BusinessSubProcessName: node.BusinessSubProcessName,
                                ApplicationId: app.ApplicationId,
                                ApplicationName: app.ApplicationName,
                                TransactionId: txn.TransactionId,
                                Transaction: txn.Transaction,
                                TransactionCode: txn.TransactionCode,
                                ProjectSprintTransactionId: txn.ProjectSprintTransactionId || '',
                                delete: !selected,
                                SortKey: 0,
                                Status: 1,
                                SprintId: meta.SprintId,
                                SessionId: meta.SessionId || null,
                            });
                        }
                    });

                    (app.Features || []).forEach((feature) => {
                        const selected = feature.selected === true;
                        const exists = !!feature.ProjectSprintFeatureId;
                        if (selected || exists) {
                            features.push({
                                ClientId: meta.ClientId,
                                ProjectId: meta.ProjectId,
                                BusinessUnitId: meta.BusinessUnitId,
                                BusinessProcessId: parentProcessId,
                                BusinessProcessName: parentProcessName,
                                BusinessSubProcessId: node.BusinessSubProcessId,
                                BusinessSubProcessName: node.BusinessSubProcessName,
                                ApplicationId: app.ApplicationId,
                                ApplicationName: app.ApplicationName,
                                FeatureId: feature.FeatureId,
                                Feature: feature.Feature,
                                ProjectSprintFeatureId: feature.ProjectSprintFeatureId || '',
                                delete: !selected,
                                SortKey: 0,
                                Status: 1,
                                SprintId: meta.SprintId,
                                SessionId: meta.SessionId || null,
                            });
                        }
                    });

                    (app.Programs || []).forEach((program) => {
                        const selected = program.selected === true;
                        const exists = !!program.ProjectSprintProgramId;
                        if (selected || exists) {
                            programs.push({
                                ClientId: meta.ClientId,
                                ProjectId: meta.ProjectId,
                                BusinessUnitId: meta.BusinessUnitId,
                                BusinessProcessId: parentProcessId,
                                BusinessProcessName: parentProcessName,
                                BusinessSubProcessId: node.BusinessSubProcessId,
                                BusinessSubProcessName: node.BusinessSubProcessName,
                                ApplicationId: app.ApplicationId,
                                ApplicationName: app.ApplicationName,
                                ProgramId: program.ProgramId,
                                ProgramName: program.ProgramName,
                                ProjectSprintProgramId: program.ProjectSprintProgramId || '',
                                delete: !selected,
                                SortKey: 0,
                                Status: 1,
                                SprintId: meta.SprintId,
                                SessionId: meta.SessionId || null,
                            });
                        }
                    });
                });

                (node.Integrations || []).forEach((intg) => {
                    const selected = intg.selected === true;
                    const exists = !!intg.ProjectSprintProcessIntegrationId;
                    if (selected || exists) {
                        integrations.push({
                            ClientId: meta.ClientId,
                            ProjectId: meta.ProjectId,
                            BusinessUnitId: meta.BusinessUnitId,
                            BusinessProcessId: parentProcessId,
                            BusinessProcessName: parentProcessName,
                            BusinessSubProcessId: node.BusinessSubProcessId,
                            BusinessSubProcessName: node.BusinessSubProcessName,
                            ProjectSprintProcessIntegrationId: intg.ProjectSprintProcessIntegrationId || '',
                            ApplicationId: intg.ApplicationId,
                            ApplicationName: intg.ApplicationName || '',
                            IntegrationId: intg.IntegrationId,
                            IntegrationName: intg.IntegrationName || '',
                            delete: !selected,
                            SortKey: 0,
                            Status: 1,
                            SprintId: meta.SprintId,
                            SessionId: meta.SessionId || null,
                        });
                    }
                });
            }

            (node.SubProcesses || []).forEach((child) =>
                traverse(child, node.BusinessSubProcessId || null, parentProcessId, parentProcessName)
            );
        };

        (treeData || []).forEach((process) => {
            (process.SubProcesses || []).forEach((sub) => {
                traverse(sub, null, process.BusinessProcessId, process.BusinessProcessName);
            });
        });

        return {
            SubProcesses: subProcesses,
            Applications: applications,
            Transactions: transactions,
            Features: features,
            Programs: programs,
            Integrations: integrations,
        };
    }

    const handleSaveToSprint = async () => {
        const currentData = JSON.stringify(state.SubProcessesTreeData);
        const originalData = JSON.stringify(initialData);

        if (currentData === originalData) {
            setToastMessage('No changes detected');
            setShowToast(true);
            return;
        }

        const finalData = flattenForDBInsertion(state.SubProcessesTreeData?.BusinessProcesses, {
            ClientId: props.CurrentSprint.ClientId,
            BusinessUnitId: props.CurrentSprint.BusinessUnitId,
            ProjectSprintProcessId: '',
            ProjectId: props.CurrentSprint.ProjectId,
            SprintId: props.CurrentSprint.SprintId,
            SessionId: 'SID-99',
        });

        if (finalData.SubProcesses.length > 0) {
            setState({ SavingLoader: true });
            const reqObj = {
                ReqestData: finalData.SubProcesses,
            };
            await apiRequest('/AddUpdateProjectSprintClientSubProcessMasterV3', reqObj as any);
        }
        if (finalData.Transactions.length > 0) {
            setState({ SavingLoader: true });

            const resp: any = await apiRequest(
                '/AddProjectSprintApplicationTransactionsMaster',
                finalData.Transactions as any
            );
            if (resp) {
                setState({ SavingLoader: false, showToast: true, ActionType: '' });
                getData();
                setTimeout(() => {
                    setState({ showToast: false });
                }, 3000);
            }
        }
        if (finalData.Programs.length > 0) {
            setState({ SavingLoader: true });

            const resp: any = await apiRequest(
                '/AddProjectSprintApplicationProgramsMaster',
                finalData.Programs as any
            );
            if (resp) {
                setState({ SavingLoader: false, showToast: true, ActionType: '' });
                getData();
                setTimeout(() => {
                    setState({ showToast: false });
                }, 3000);
            }
        }
        if (finalData.Features.length > 0) {
            setState({ SavingLoader: true });

            const resp: any = await apiRequest(
                '/AddProjectSprintApplicationFeaturesMaster',
                finalData.Features as any
            );
            if (resp) {
                setState({ SavingLoader: false, showToast: true, ActionType: '' });
                getData();
                setTimeout(() => {
                    setState({ showToast: false });
                }, 3000);
            }
        }
        if (finalData.Integrations.length > 0) {
            setState({ SavingLoader: true });

            const resp: any = await apiRequest(
                '/AddProjectSprintSubProcessIntegrationsMaster',
                finalData.Integrations as any
            );
            if (resp) {
                setState({ SavingLoader: false, showToast: true, ActionType: '' });
                getData();
                setTimeout(() => {
                    setState({ showToast: false });
                }, 3000);
            }
        }
        setState({ SavingLoader: false, showToast: true, ActionType: '' });
        getData();
        setTimeout(() => {
            setState({ showToast: false });
        }, 3000);

        setToastMessage('Saved successfully');
        setShowToast(true);
    };

    const handleToggle = (
        node: ToggleNode,
        target: ApplicationItem | TransactionItem | FeatureItem | ProgramItem | IntegrationItem | null = null,
        type: ToggleType = 'subprocess'
    ) => {
        const clone = <T,>(obj: T): T => JSON.parse(JSON.stringify(obj)) as T;

        const updateChildren = (n: SubProcessNode, selected: boolean) => {
            n.selected = selected;
            n.indeterminate = false;
            if (!selected && n.ProjectSprintProcessId) (n as SubProcessNode & { delete?: boolean }).delete = true;
            else delete (n as SubProcessNode & { delete?: boolean }).delete;

            n.SubProcesses?.forEach((child) => updateChildren(child, selected));

            n.Applications?.forEach((app) => {
                app.selected = selected;
                app.indeterminate = false;

                app.Transactions?.forEach((txn) => (txn.selected = selected));
                app.Features?.forEach((f) => (f.selected = selected));
                app.Programs?.forEach((p) => (p.selected = selected));
            });

            n.Integrations?.forEach((i) => (i.selected = selected));
        };

        const updateAppSelectionState = (app: ApplicationItem) => {
            const items = [
                ...(app.Transactions || []),
                ...(app.Features || []),
                ...(app.Programs || []),
            ] as Array<{ selected?: boolean }>;
            const all = items.every((i) => !!i.selected);
            const none = items.every((i) => !i.selected);

            app.selected = all;
            app.indeterminate = !all && !none && items.length > 0;
        };

        const updateSubprocessSelectionState = (subprocess: SubProcessNode) => {
            const apps = subprocess.Applications || [];
            const allSelected = apps.every((app) => !!app.selected);
            const noneSelected = apps.every((app) => !app.selected && !app.indeterminate);
            const anySelected = apps.some((app) => !!app.selected || !!app.indeterminate);

            if (apps.length > 0) {
                if (allSelected) {
                    subprocess.selected = true;
                    subprocess.indeterminate = false;
                } else if (noneSelected) {
                    subprocess.selected = false;
                    subprocess.indeterminate = false;
                } else if (anySelected) {
                    subprocess.selected = false;
                    subprocess.indeterminate = true;
                }
            }
        };

        const updateParents = (bps: BusinessProcess[]) => {
            const traverse = (n: SubProcessNode) => {
                n.SubProcesses?.forEach(traverse);

                const total = n.SubProcesses?.length || 0;
                const selected = (n.SubProcesses || []).filter((c) => !!c.selected).length;
                const indeterminate = (n.SubProcesses || []).filter((c) => !!c.indeterminate).length;

                if (total > 0) {
                    if (selected === total) {
                        n.selected = true;
                        n.indeterminate = false;
                    } else if (selected === 0 && indeterminate === 0) {
                        n.selected = false;
                        n.indeterminate = false;
                    } else {
                        n.selected = false;
                        n.indeterminate = true;
                    }
                }
            };
            bps.forEach((bp) => {
                (bp.SubProcesses || []).forEach(traverse);
            });
        };

        const updateNodeRecursive = (n: SubProcessNode | BusinessProcess): boolean => {
            const asSub = n as SubProcessNode;

            if (type === 'businessprocess' && (n as BusinessProcess).BusinessProcessId === node.BusinessProcessId) {
                updateChildren(asSub, !asSub.selected);
                return true;
            }

            if (type === 'subprocess' && asSub.BusinessSubProcessId === node.BusinessSubProcessId) {
                updateChildren(asSub, !asSub.selected);
                return true;
            }

            if (type === 'application' && target && asSub.BusinessSubProcessId === node.BusinessSubProcessId) {
                asSub.Applications?.forEach((app) => {
                    if (app.ApplicationId === (target as ApplicationItem).ApplicationId) {
                        const newState = !app.selected;
                        app.selected = newState;
                        app.indeterminate = false;

                        app.Transactions?.forEach((t) => (t.selected = newState));
                        app.Features?.forEach((f) => (f.selected = newState));
                        app.Programs?.forEach((p) => (p.selected = newState));
                    }
                });
                updateSubprocessSelectionState(asSub);
                return true;
            }

            if (
                ['transaction', 'feature', 'program'].includes(type) &&
                target &&
                asSub.BusinessSubProcessId === node.BusinessSubProcessId
            ) {
                asSub.Applications?.forEach((app) => {
                    if (type === 'transaction') {
                        app.Transactions?.forEach((txn) => {
                            if (txn.TransactionId === (target as TransactionItem).TransactionId)
                                txn.selected = !txn.selected;
                        });
                    } else if (type === 'feature') {
                        app.Features?.forEach((f) => {
                            if (f.FeatureId === (target as FeatureItem).FeatureId) f.selected = !f.selected;
                        });
                    } else if (type === 'program') {
                        app.Programs?.forEach((p) => {
                            if (p.ProgramId === (target as ProgramItem).ProgramId) p.selected = !p.selected;
                        });
                    }
                    updateAppSelectionState(app);
                });
                updateSubprocessSelectionState(asSub);
                return true;
            }

            if (type === 'integration' && target && asSub.BusinessSubProcessId === node.BusinessSubProcessId) {
                asSub.Integrations?.forEach((i) => {
                    if (i.IntegrationId === (target as IntegrationItem).IntegrationId) i.selected = !i.selected;
                });
                return true;
            }

            return (asSub.SubProcesses || []).some(updateNodeRecursive);
        };

        const newTree = clone<TreeData>(state.SubProcessesTreeData);

        newTree.BusinessProcesses.forEach((bp) => {
            updateNodeRecursive(bp as unknown as SubProcessNode);
        });

        updateParents(newTree.BusinessProcesses);

        setState({ SubProcessesTreeData: newTree });
    };
    if (state.IsLoading)
        return (
            <div className="h-96 py-20">
                <Spinner size="lg" color="blue-500" text="Fetching data..." />
            </div>
        );

    if (state.Error) return <ErrorScreen message={state.Error} />;

    return (
        <div className="pt-0">
            <div>
                <div>
                    <div className="flex justify-between items-center pb-4">
                        <div className="-3 pt-1 flex items-center">
                            <p className="ml-4 font-semibold text-xl">Business Process Mapping</p>
                        </div>
                        <div>
                            <button
                                onClick={handleSaveToSprint}
                                className="bg-[#0071E9] hover:bg-[#005ABA] text-white font-medium py-2 px-5 rounded-lg flex items-center space-x-2"
                            >
                                <Plus className="w-5 h-5" />
                                <span>Save to sprint</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <ProjectSprintSubProcessTree
                treeData={state.SubProcessesTreeData}
                onToggle={handleToggle}
                onAddClick={(_node: unknown) => {}}
            />

            <Toast
                message={toastMessage}
                show={showToast}
                onClose={() => setShowToast(false)}
            />
        </div>
    );
}
