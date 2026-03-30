import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useReducer,
    useRef,
} from "react";
import { apiRequest } from "../../../utils/helpers/ApiHelper";
import Spinner from "../../../utils/Spinner";
import ErrorScreen from "../../../utils/ErrorScreen";
import ProjectSprintSubProcessTree from "./ProjectSprintSubProcessTree";

type Props = {
    NewSession?: boolean;
    CurrentSprint: any;
    BpPayload: (data: any) => void;
};

type ImperativeHandle = {
    handleSaveToSprint: (SessionId?: string) => Promise<void>;
};

interface State {
    ActionType: string;
    Error: string;
    SearchQuery: string;
    CurrentPage: number;
    ViewSubProcess: boolean;
    TotalRecords: number;
    ClientBusinessProcessMaster: any[];
    BusinessUnitsList: any[];
    BusinessProcessList: any[];
    SubProcessesTreeData: any;
    CurrSelectedBPs: any[];
    CurrBP: any;
    Countries: any[];
    CountryCodes: any[];
    States: any[];
    Cities: any[];
    ViewClientDetails: boolean;
    IsLoading: boolean;
    showToast: boolean;
    SavingLoader: boolean;
    isDataExist: string;
    ClientBusinessUnitActionType: string;
    CurrAddEditObj: {
        ClientId: string;
        BusinessUnitId: string;
        BusinessProcessId: string;
        BusinessProcessName: string;
        Description: string;
    };
    ValidateFields: {
        BusinessUnitId: string;
        BusinessProcessName: string;
    };
    FormErrors: Record<string, string>;
}

const ProjectSprintSessionBPSPMapping = forwardRef<ImperativeHandle, Props>(
    function ProjectSprintSessionBPSPMapping(props, ref) {
        useImperativeHandle(ref, () => ({
            handleSaveToSprint: handleSaveToSprint,
        }));

        const initialState: State = {
            ActionType: "",
            Error: "",
            SearchQuery: "",
            CurrentPage: 1,
            ViewSubProcess: false,
            TotalRecords: 0,
            ClientBusinessProcessMaster: [],
            BusinessUnitsList: [],
            BusinessProcessList: [],
            SubProcessesTreeData: [],
            CurrSelectedBPs: [],
            CurrBP: {},
            Countries: [],
            CountryCodes: [],
            States: [],
            Cities: [],
            ViewClientDetails: false,
            IsLoading: true,
            showToast: false,
            SavingLoader: false,
            isDataExist: "",
            ClientBusinessUnitActionType: "",
            CurrAddEditObj: {
                ClientId: "",
                BusinessUnitId: "",
                BusinessProcessId: "",
                BusinessProcessName: "",
                Description: "",
            },
            ValidateFields: {
                BusinessUnitId: "",
                BusinessProcessName: "",
            },
            FormErrors: {},
        };

        const [state, setState] = useReducer(
            (s: State, ns: Partial<State>): State => ({ ...s, ...ns }),
            initialState
        );

        const didFetchData = useRef<boolean>(false);
        useEffect(() => {
            if (didFetchData.current) return;
            didFetchData.current = true;

            const init = async () => {
                setState({ IsLoading: true });

                await Promise.all([getData("")]);

                setState({ IsLoading: false });
            };

            init();
        }, []);

        const getData = async (SearchQuery: string = "", PageNo: number = 1) => {
            try {
                const ApiURL = props.NewSession
                    ? "/project-sprint-session-docs/GetMappedProjectSprintClientSubProcessesProjectSprintV4"
                    : "/GetMappedProjectSprintSessionClientSubProcessesProjectSprintV3";
                const resp: any = await apiRequest(ApiURL, {
                    ClientId: props.CurrentSprint.ClientId,
                    BusinessUnitId: props.CurrentSprint.BusinessUnitId,
                    ProjectId: props.CurrentSprint.ProjectId,
                    SprintId: props?.CurrentSprint.SprintId,
                    SessionId: props?.CurrentSprint.SessionId,
                    PageNo: PageNo,
                    SearchString: SearchQuery,
                });
                console.log("respresp", resp);
                if (resp.ResponseData) {
                    setState({
                        SubProcessesTreeData: resp.ResponseData,
                    });
                    props.BpPayload(resp.ResponseData);
                } else {
                    setState({ SubProcessesTreeData: {}, TotalRecords: 0 });
                }
            } catch (err: any) {
                setState({ Error: err.toString() });
            } finally {
                setState({ IsLoading: false });
            }
        };

        const handleToggle = (
            node: any,
            target: any | null = null,
            type:
                | "subprocess"
                | "businessprocess"
                | "application"
                | "transaction"
                | "feature"
                | "program"
                | "integration" = "subprocess"
        ) => {
            const clone = (obj: any) => JSON.parse(JSON.stringify(obj));

            const updateChildren = (n: any, selected: boolean) => {
                n.selected = selected;
                n.indeterminate = false;
                if (!selected && n.ProjectSprintSessionProcessId) n.delete = true;
                else delete n.delete;

                n.SubProcesses?.forEach((child: any) => updateChildren(child, selected));

                n.Applications?.forEach((app: any) => {
                    app.selected = selected;
                    app.indeterminate = false;

                    app.Transactions?.forEach((txn: any) => (txn.selected = selected));
                    app.Features?.forEach((f: any) => (f.selected = selected));
                    app.Programs?.forEach((p: any) => (p.selected = selected));
                });

                n.Integrations?.forEach((i: any) => (i.selected = selected));
            };

            const updateAppSelectionState = (app: any) => {
                const items = [
                    ...(app.Transactions || []),
                    ...(app.Features || []),
                    ...(app.Programs || []),
                ];
                const all = items.every((i: any) => i.selected);
                const none = items.every((i: any) => !i.selected);

                app.selected = all;
                app.indeterminate = !all && !none && items.length > 0;
            };

            const updateSubprocessSelectionState = (subprocess: any) => {
                const apps = subprocess.Applications || [];
                const allSelected = apps.every((app: any) => app.selected);
                const noneSelected = apps.every(
                    (app: any) => !app.selected && !app.indeterminate
                );
                const anySelected = apps.some(
                    (app: any) => app.selected || app.indeterminate
                );

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

            const updateParents = (bps: any[]) => {
                const traverse = (n: any) => {
                    n.SubProcesses?.forEach(traverse);

                    const total = n.SubProcesses?.length || 0;
                    const selected = n.SubProcesses?.filter((c: any) => c.selected).length;
                    const indeterminate = n.SubProcesses?.filter(
                        (c: any) => c.indeterminate
                    ).length;

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
                bps.forEach(traverse);
            };

            const updateNodeRecursive = (n: any): boolean => {
                if (
                    type === "businessprocess" &&
                    n.BusinessProcessId === node.BusinessProcessId
                ) {
                    updateChildren(n, !n.selected);
                    return true;
                }

                if (
                    type === "subprocess" &&
                    n.BusinessSubProcessId === node.BusinessSubProcessId
                ) {
                    updateChildren(n, !n.selected);
                    return true;
                }

                if (type === "application" && target && n.BusinessSubProcessId === node.BusinessSubProcessId) {
                    n.Applications?.forEach((app: any) => {
                        if (app.ApplicationId === target.ApplicationId) {
                            const newState = !app.selected;
                            app.selected = newState;
                            app.indeterminate = false;

                            app.Transactions?.forEach((t: any) => (t.selected = newState));
                            app.Features?.forEach((f: any) => (f.selected = newState));
                            app.Programs?.forEach((p: any) => (p.selected = newState));
                        }
                    });
                    updateSubprocessSelectionState(n);
                    return true;
                }

                if (
                    ["transaction", "feature", "program"].includes(type) &&
                    target &&
                    n.BusinessSubProcessId === node.BusinessSubProcessId
                ) {
                    n.Applications?.forEach((app: any) => {
                        if (type === "transaction") {
                            app.Transactions?.forEach((txn: any) => {
                                if (txn.TransactionId === target.TransactionId)
                                    txn.selected = !txn.selected;
                            });
                        } else if (type === "feature") {
                            app.Features?.forEach((f: any) => {
                                if (f.FeatureId === target.FeatureId) f.selected = !f.selected;
                            });
                        } else if (type === "program") {
                            app.Programs?.forEach((p: any) => {
                                if (p.ProgramId === target.ProgramId) p.selected = !p.selected;
                            });
                        }
                        updateAppSelectionState(app);
                    });
                    updateSubprocessSelectionState(n);
                    return true;
                }

                if (type === "integration" && target && n.BusinessSubProcessId === node.BusinessSubProcessId) {
                    n.Integrations?.forEach((i: any) => {
                        if (i.IntegrationId === target.IntegrationId)
                            i.selected = !i.selected;
                    });
                    return true;
                }

                return n.SubProcesses?.some(updateNodeRecursive);
            };

            const newTree = clone(state.SubProcessesTreeData);

            newTree.BusinessProcesses.forEach((bp: any) => {
                updateNodeRecursive(bp);
            });

            updateParents(newTree.BusinessProcesses);

            setState({ SubProcessesTreeData: newTree });

            props.BpPayload(newTree);
        };

        function flattenForDBInsertion(treeData: any, meta: any) {
            const subProcesses: any[] = [];
            const applications: any[] = [];
            const integrations: any[] = [];
            const transactions: any[] = [];
            const features: any[] = [];
            const programs: any[] = [];

            const traverse = (
                node: any,
                parentId: string | null = null,
                parentProcessId?: string,
                parentProcessName?: string
            ) => {
                const isSelected = node.selected || node.indeterminate;

                if (node.ProjectSprintSessionProcessId === "" && !isSelected) return;

                if (node.BusinessSubProcessId) {
                    subProcesses.push({
                        ClientId: meta.ClientId,
                        ProjectSprintSessionProcessId:
                            node.ProjectSprintSessionProcessId ||
                            meta.ProjectSprintSessionProcessId,
                        ProjectId: meta.ProjectId,
                        SprintId: meta.SprintId,
                        SessionId: meta.SessionId,
                        BusinessUnitId: meta.BusinessUnitId,
                        BusinessProcessId: parentProcessId,
                        BusinessProcessName: parentProcessName,
                        BusinessSubProcessId: node.BusinessSubProcessId,
                        BusinessSubProcessName: node.BusinessSubProcessName,
                        delete: node.delete || false,
                        ParentSubProcessId: parentId,
                        SortKey: 0,
                        Status: 1,
                    });

                    (node.Applications || []).forEach((app: any) => {
                        const appSelected = app.selected;
                        if (appSelected || (app.ProjectSprintProcessApplicationId && !app.selected)) {
                            applications.push({
                                ClientId: meta.ClientId,
                                ProjectId: meta.ProjectId,
                                BusinessUnitId: meta.BusinessUnitId,
                                ProjectSprintProcessApplicationId:
                                app.ProjectSprintProcessApplicationId,
                                BusinessProcessId: parentProcessId,
                                BusinessProcessName: parentProcessName,
                                BusinessSubProcessId: node.BusinessSubProcessId,
                                BusinessSubProcessName: node.BusinessSubProcessName,
                                ApplicationId: app.ApplicationId,
                                ApplicationName: app.ApplicationName,
                                delete: !appSelected,
                                IntegrationId: "",
                                IntegrationName: "",
                                SortKey: 0,
                                Status: 1,
                                SprintId: meta.SprintId,
                                SessionId: meta.SessionId || null,
                            });
                        }

                        (app.Transactions || []).forEach((txn: any) => {
                            const selected = txn.selected === true;
                            const exists = !!txn.ProjectSprintSessionTransactionId;
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
                                    ProjectSprintSessionTransactionId:
                                        txn.ProjectSprintSessionTransactionId || "",
                                    delete: !selected,
                                    SortKey: 0,
                                    Status: 1,
                                    SprintId: meta.SprintId,
                                    SessionId: meta.SessionId || null,
                                });
                            }
                        });

                        (app.Features || []).forEach((feature: any) => {
                            const selected = feature.selected === true;
                            const exists = !!feature.ProjectSprintSessionFeatureId;
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
                                    ProjectSprintSessionFeatureId:
                                        feature.ProjectSprintSessionFeatureId || "",
                                    delete: !selected,
                                    SortKey: 0,
                                    Status: 1,
                                    SprintId: meta.SprintId,
                                    SessionId: meta.SessionId || null,
                                });
                            }
                        });

                        (app.Programs || []).forEach((program: any) => {
                            const selected = program.selected === true;
                            const exists = !!program.ProjectSprintSessionProgramId;
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
                                    ProjectSprintSessionProgramId:
                                        program.ProjectSprintSessionProgramId || "",
                                    delete: !selected,
                                    SortKey: 0,
                                    Status: 1,
                                    SprintId: meta.SprintId,
                                    SessionId: meta.SessionId || null,
                                });
                            }
                        });
                    });

                    (node.Integrations || []).forEach((intg: any) => {
                        const selected = intg.selected === true;
                        const exists = !!intg.ProjectSprintSessionProcessIntegrationId;
                        if (selected || exists) {
                            integrations.push({
                                ClientId: meta.ClientId,
                                ProjectId: meta.ProjectId,
                                BusinessUnitId: meta.BusinessUnitId,
                                BusinessProcessId: parentProcessId,
                                BusinessProcessName: parentProcessName,
                                BusinessSubProcessId: node.BusinessSubProcessId,
                                BusinessSubProcessName: node.BusinessSubProcessName,
                                ProjectSprintSessionProcessIntegrationId:
                                    intg.ProjectSprintSessionProcessIntegrationId || "",
                                ApplicationId: intg.ApplicationId,
                                ApplicationName: intg.ApplicationName || "",
                                IntegrationId: intg.IntegrationId,
                                IntegrationName: intg.IntegrationName || "",
                                delete: !selected,
                                SortKey: 0,
                                Status: 1,
                                SprintId: meta.SprintId,
                                SessionId: meta.SessionId || null,
                            });
                        }
                    });
                }

                (node.SubProcesses || []).forEach((child: any) =>
                    traverse(child, node.BusinessSubProcessId, parentProcessId, parentProcessName)
                );
            };

            treeData.forEach((process: any) => {
                (process.SubProcesses || []).forEach((sub: any) => {
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

        const handleSaveToSprint = async (SessionId: string = ""): Promise<void> => {
            const finalData = flattenForDBInsertion(
                state.SubProcessesTreeData?.BusinessProcesses,
                {
                    ClientId: props.CurrentSprint.ClientId,
                    BusinessUnitId: props.CurrentSprint.BusinessUnitId,
                    ProjectSprintSessionProcessId: "",
                    ProjectId: props.CurrentSprint.ProjectId,
                    SprintId: props.CurrentSprint.SprintId,
                    SessionId: SessionId,
                }
            );
            if (finalData.SubProcesses.length > 0) {
                setState({ SavingLoader: true });

                const reqObj = {
                    ReqestData: finalData.SubProcesses,
                };
                const resp1: any = await apiRequest(
                    "/AddUpdateProjectSprintSessionClientSubProcessMasterV3",
                    reqObj
                );
                if (resp1) {
                    // handled below
                }
            }
            if (finalData.Transactions.length > 0) {
                setState({ SavingLoader: true });

                const resp2: any = await apiRequest(
                    "/AddProjectSprintSessionApplicationTransactionsMaster",
                    finalData.Transactions
                );
                if (resp2) {
                    setState({ SavingLoader: false, showToast: true, ActionType: "" });
                    setTimeout(() => {
                        setState({ showToast: false });
                    }, 3000);
                }
            }
            if (finalData.Programs.length > 0) {
                setState({ SavingLoader: true });

                const resp3: any = await apiRequest(
                    "/AddProjectSprintSessionApplicationProgramsMaster",
                    finalData.Programs
                );
                if (resp3) {
                    setState({ SavingLoader: false, showToast: true, ActionType: "" });
                    setTimeout(() => {
                        setState({ showToast: false });
                    }, 3000);
                }
            }
            if (finalData.Features.length > 0) {
                setState({ SavingLoader: true });

                const resp4: any = await apiRequest(
                    "/AddProjectSprintSessionApplicationFeaturesMaster",
                    finalData.Features
                );
                if (resp4) {
                    setState({ SavingLoader: false, showToast: true, ActionType: "" });
                    setTimeout(() => {
                        setState({ showToast: false });
                    }, 3000);
                }
            }
            if (finalData.Integrations.length > 0) {
                setState({ SavingLoader: true });

                const resp5: any = await apiRequest(
                    "/AddProjectSprintSessionSubProcessIntegrationsMaster",
                    finalData.Integrations
                );
                if (resp5) {
                    setState({ SavingLoader: false, showToast: true, ActionType: "" });
                    setTimeout(() => {
                        setState({ showToast: false });
                    }, 3000);
                }
            }

            setState({ SavingLoader: false, showToast: true, ActionType: "" });
            setTimeout(() => {
                setState({ showToast: false });
            }, 3000);
        };

        if (state.IsLoading)
            return (
                <div className="h-96 py-20">
                    <Spinner size="lg" color="blue-500" text="Fetching data..." />
                </div>
            );
        if (state.Error) return <ErrorScreen message={state.Error} />;

        return (
            <div className="  pt-0  ">
                <div>
                    <div>
                        <div className="flex justify-between items-center pb-2">
                            <div className="-3  flex items-center  ">
                                <p className="ml-3 font-semibold text-xl">Business Process Mapping</p>
                            </div>
                        </div>
                    </div>
                </div>
                {state.SubProcessesTreeData.BusinessProcesses.length > 0 ? (
                    <ProjectSprintSubProcessTree
                        treeData={state.SubProcessesTreeData}
                        onToggle={handleToggle}
                        onAddClick={(node: any) => {
                            console.log("Add clicked for", node);
                        }}
                    />
                ) : (
                    <div>
                        <div className="py-20  flex flex-col items-center justify-center">
                            <p className="text-gray-900 font-semibold">Data not found </p>
                            <p className="text-gray-600 font-medium">
                                Save Business Process to map to this document
                            </p>
                        </div>
                    </div>
                )}
            </div>
        );
    }
);

export default ProjectSprintSessionBPSPMapping;
