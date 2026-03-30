import React, { useCallback, useEffect, useReducer, useRef } from 'react';
import { apiRequest } from "../../../../utils/helpers/ApiHelper";
import Spinner from "../../../../utils/Spinner";
import ErrorScreen from "../../../../utils/ErrorScreen";
import useDebounce from "../../../../utils/helpers/useDebounce";
import ProjectSprintSubProcessTree from "../../../TestDesignStudio/ProjectSprintDocs/ProjectSprintSubProcessTree";

interface CurrAddEditObj {
    ClientId: string;
    BusinessUnitId: string;
    BusinessProcessId: string;
    BusinessProcessName: string;
    Description: string;
    ClientName?: string;
    Contact?: unknown;
    [key: string]: any;
}

interface CurrentSprint {
    ClientId: string;
    BusinessUnitId: string;
    ProjectId: string;
    SprintId: string;
    [key: string]: any;
}

type Props = {
    CurrentSprint: CurrentSprint;
    CurrClientDetails?: { ClientId: string };
    children?: React.ReactNode;
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
    CurrAddEditObj: CurrAddEditObj;
    ValidateFields: Record<string, string>;
    FormErrors: Record<string, string>;
}

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

const AddProjectSprintSessionSubProcessIntegrationsMaster = () => {};

export default function ObjectBPSPMapping(props: Props) {
    const [state, setState] = useReducer(
        (s: State, ns: Partial<State>): State => ({ ...s, ...ns }),
        initialState
);

    const didFetchData = useRef<boolean>(false);
    const selectAllRef = useRef<{ selectAll: () => void; unselectAll: () => void } | null>(null);

    useEffect(() => {
        if (didFetchData.current) return;
        didFetchData.current = true;

        const init = async () => {
            setState({ IsLoading: true });

            await Promise.all([getData(""), getBusinessProcessList()]);

            setState({ IsLoading: false });
        };

        init();
    }, []);

    const getBusinessUnitsList = async (): Promise<void> => {
        try {
            const resp: any = await apiRequest("/GetBusinessUnitMaster", {});
            setState({
                BusinessUnitsList: resp.ResponseData,
            });
        } catch (err) {
            console.error("Error loading Country/State/City:", err);
        }
    };

    const getData = async (SearchQuery: string = "", PageNo: number = 1): Promise<void> => {
        try {
            const resp: any = await apiRequest("/GetClientSubProcessesProjectSprintV3", {
                ClientId: props.CurrentSprint.ClientId,
                BusinessUnitId: props.CurrentSprint.BusinessUnitId,
                ProjectId: props.CurrentSprint.ProjectId,
                SprintId: props?.CurrentSprint.SprintId,
                PageNo: PageNo,
                SearchString: SearchQuery,
            });
            if (resp.ResponseData) {
                setState({
                    SubProcessesTreeData: resp.ResponseData,
                });
            } else {
                setState({ SubProcessesTreeData: {}, TotalRecords: 0 });
            }
        } catch (err: any) {
            setState({ Error: err.toString() });
        } finally {
            setState({ IsLoading: false });
        }
    };

    const getBusinessProcessList = async (SearchString: string = ""): Promise<void> => {
        try {
            const resp: any = await apiRequest("/GetBusinessProcessMaster", {
                ClientId: props.CurrentSprint.ClientId,
                BusinessUnitId: props.CurrentSprint.BusinessUnitId,
                SearchString,
            });
            setState({
                BusinessProcessList: resp.ResponseData,
            });
        } catch (err) {
            console.error("Error loading Country/State/City:", err);
        }
    };

    const handleAddClient = (): void => {
        const CurrAddEditObj: CurrAddEditObj = {
            ClientId: "",
            BusinessUnitId: "",
            BusinessProcessId: "",
            BusinessProcessName: "",
            Description: "",
        };
        setState({ ActionType: "Add", CurrAddEditObj });
    };

    const handleEdit = (item: any): void => {
        setState({ ActionType: "Update", CurrAddEditObj: item });
    };

    const handleCancel = (): void => {
        const CurrAddEditObj: CurrAddEditObj = {
            ClientId: "",
            BusinessUnitId: "",
            BusinessProcessId: "",
            BusinessProcessName: "",
            Description: "",
        };
        setState({ ActionType: "", CurrAddEditObj });
        getData("");
    };

    const debouncedSearchQuery = useDebounce(state.SearchQuery, 300) as string;
    const didSearchRun = useRef<boolean>(false);

    useEffect(() => {
        if (!didSearchRun.current) {
            didSearchRun.current = true;
            return;
        }
        if (debouncedSearchQuery.trim() === "") return;
        getData(debouncedSearchQuery);
    }, [debouncedSearchQuery]);

    const debouncedQuery = useDebounce(state.CurrAddEditObj.ClientName, 500) as string | undefined;

    const checkIfDataExist = async (query: string | undefined): Promise<void> => {
        const resp: any = await apiRequest("/CheckClientsMaster", {
            ClientName: query,
        });
        if (resp.ClientsMaster.length > 0) {
            setState({ isDataExist: "Client already existed" });
        } else {
            setState({ isDataExist: "" });
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const value = e.target.value;
        setState({ SearchQuery: value });
        if (value.trim() === "") {
            getData("");
        }
    };

    const handleChangeClientInfo = (e: React.ChangeEvent<HTMLInputElement>, name: keyof CurrAddEditObj | string): void => {
        const CurrAddEditObj = { ...state.CurrAddEditObj };
        CurrAddEditObj[name as string] = e.target.value;
        setState({ CurrAddEditObj });
    };

    const validateClientInfoForm = (): boolean => {
        const FormErrors: Record<string, string> = {};
        let formIsValid = true;

        const emailRegex = "";
        for (const name in state.ValidateFields) {
            const value = state.CurrAddEditObj[name];
            if (value === "" || value === 0) {
                formIsValid = false;
                FormErrors[name] = "This field is required";
            } else {
                if (name === "EmailId" && !emailRegex.test(String(value))) {
                    formIsValid = false;
                    FormErrors[name] = "Please enter a valid email address";
                } else {
                    FormErrors[name] = "";
                }
            }
        }
        setState({
            FormErrors,
        });
        return formIsValid;
    };

    const handleClientInfoContactChange = (val: unknown): void => {
        const CurrAddEditObj = { ...state.CurrAddEditObj };
        CurrAddEditObj.Contact = val;
        setState({ CurrAddEditObj });
    };

    const handleDeleteItem = async (item: any): Promise<void> => {
        const resp: any = await apiRequest("/DeleteClientBusinessProcessMaster ", item);
        if (resp) {
            setState({ showToast: true });
            getData();
            setTimeout(() => {
                setState({ showToast: false });
            }, 3000);
        }
    };

    const handleView = (item: any): void => {
        setState({ ViewSubProcess: true, CurrAddEditObj: item });
    };

    const handleDropdownClientInfo = (val: any, _options: any, name: keyof CurrAddEditObj | string): void => {
        const CurrAddEditObj = { ...state.CurrAddEditObj };
        CurrAddEditObj[name as string] = val;
        setState({ CurrAddEditObj });
    };

    const handlePageChange = (page: number): void => {
        setState({ CurrentPage: page });
        getData(state.SearchQuery, page);
    };

    const handleSelectionChange = useCallback((newList: any[], item: any) => {
        if (item) {
            if (item.checkFlag) {
                handleSaveToSprintOnCheck({
                    BusinessProcessId: item.BusinessProcessId,
                    BusinessSubProcessId: item.BusinessSubProcessId,
                    ClientId: item.ClientId,
                    BusinessUnitId: item.BusinessUnitId,
                    SprintId: props.CurrentSprint.SprintId,
                    ProjectId: props.CurrentSprint.ProjectId,
                    ProjectSprintProcessId: item.ProjectSprintProcessId ?? "",
                });
            } else {
                handleDeleteFromSprint({
                    BusinessProcessId: item.BusinessProcessId,
                    BusinessSubProcessId: item.BusinessSubProcessId,
                    ClientId: item.ClientId,
                    BusinessUnitId: item.BusinessUnitId,
                    SprintId: item.SprintId,
                    ProjectId: item.ProjectId,
                    ProjectSprintProcessId: item.ProjectSprintProcessId ?? "",
                });
            }
        }
    }, [state.CurrSelectedBPs]);

    const handleDeleteFromSprint = async (item: any): Promise<void> => {
        setState({ SavingLoader: true });
        const resp: any = await apiRequest("/DeleteProjectClientSubProcessMaster", item);
        if (resp) {
            setState({ SavingLoader: false, showToast: true, ActionType: "" });
            getData(state.SearchQuery, state.CurrentPage);
            setState({ CurrSelectedBPs: [] });
            setTimeout(() => {
                setState({ showToast: false });
            }, 3000);
        }
    };

    function flattenForDBInsertion(treeData: any, meta: any): {
        SubProcesses: any[];
        Applications: any[];
        Transactions: any[];
        Features: any[];
        Programs: any[];
        Integrations: any[];
    } {
        const subProcesses: any[] = [];
        const applications: any[] = [];
        const integrations: any[] = [];
        const transactions: any[] = [];
        const features: any[] = [];
        const programs: any[] = [];

        const traverse = (node: any, parentId: string | null = null, parentProcessId?: string, parentProcessName?: string) => {
            const isSelected = node.selected || node.indeterminate;

            if (node.ProjectSprintProcessId === "" && !isSelected) return;

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
                            ProjectSprintProcessApplicationId: app.ProjectSprintProcessApplicationId,
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
                                ProjectSprintTransactionId: txn.ProjectSprintTransactionId || "",
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
                                ProjectSprintFeatureId: feature.ProjectSprintFeatureId || "",
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
                                ProjectSprintProgramId: program.ProjectSprintProgramId || "",
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
                            ProjectSprintProcessIntegrationId: intg.ProjectSprintProcessIntegrationId || "",
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

        (treeData || []).forEach((process: any) => {
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
    const handleSaveToSprintOnCheck = async (item: any): Promise<void> => {
        setState({ SavingLoader: true });
        const reqObj = {
            ReqestData: [item],
        };
        const resp: any = await apiRequest("/AddUpdateProjectClientSubProcessMaster ", reqObj);
        if (resp) {
            setState({ SavingLoader: false, showToast: true, ActionType: "" });
            getData(state.SearchQuery, state.CurrentPage);
            setState({ CurrSelectedBPs: [] });
            setTimeout(() => {
                setState({ showToast: false });
            }, 3000);
        }
    };

    const handleSelectBP = (item: any, flag: boolean): void => {
        const BusinessProcessList = [...state.BusinessProcessList];
        const index = BusinessProcessList.findIndex((v: any) => v.BusinessProcessId === item.BusinessProcessId);
        if (index > -1) {
            BusinessProcessList[index].selected = flag;
            setState({ BusinessProcessList });
        }
        if (flag) {
            selectAllRef.current?.selectAll();
        } else {
            selectAllRef.current?.unselectAll();
        }
    };

    const handleCurrBusinessProcess = (item: any): void => {
        item.ClientId = props.CurrentSprint.ClientId;
        item.BusinessUnitId = props.CurrentSprint.BusinessUnitId;
        setState({ CurrBP: item });
    };

    const handleSubmitClientInfo = async (): Promise<void> => {
        if (!validateClientInfoForm()) {
            return;
        }
        setState({ SavingLoader: true });
        const CurrAddEditObj = { ...state.CurrAddEditObj };
        CurrAddEditObj.ClientId = props?.CurrClientDetails?.ClientId;
        const resp: any = await apiRequest("/AddUpdateClientBusinessProcessMaster ", CurrAddEditObj);
        if (resp) {
            setState({ SavingLoader: false, showToast: true, ActionType: "" });
            getData();
            setTimeout(() => {
                setState({ showToast: false });
            }, 3000);
        }
    };

    if (state.IsLoading) {
        return (
            <div className="h-96 py-20">
                <Spinner size="lg" color="blue-500" text="Fetching data..." />
            </div>
        );
    }
    if (state.Error) return <ErrorScreen message={state.Error} />;

    function flattenSubProcesses(data: any[], meta: any): any[] {
        const result: any[] = [];

        function recurse(subProcesses: any[], parentId: string | null = null) {
            for (const item of subProcesses) {
                const flattenedItem = {
                    BusinessSubProcessId: item.BusinessSubProcessId,
                    BusinessSubProcessName: item.BusinessSubProcessName,
                    selected: item.selected,
                    indeterminate: item.indeterminate,
                    Applications: item.Applications,
                    Integrations: item.Integrations,
                    ParentSubProcessId: parentId,
                    ...meta,
                };

                result.push(flattenedItem);

                if (item.SubProcesses && item.SubProcesses.length > 0) {
                    recurse(item.SubProcesses, item.BusinessSubProcessId);
                }
            }
        }

        recurse(data);
        return result;
    }

    function flattenIntegrations(data: any[], meta: any): any[] {
        const flattenedIntegrations: any[] = [];

        function recurse(subProcesses: any[]) {
            for (const item of subProcesses) {
                if (item.selected || item.indeterminate) {
                    for (const integration of item.Integrations || []) {
                        flattenedIntegrations.push({
                            IntegrationId: integration.IntegrationId,
                            IntegrationName: integration.IntegrationName,
                            BusinessSubProcessId: item.BusinessSubProcessId,
                            ...meta,
                        });
                    }
                }

                if (item.SubProcesses && item.SubProcesses.length > 0) {
                    recurse(item.SubProcesses);
                }
            }
        }

        recurse(data);
        return flattenedIntegrations;
    }

    function flattenApplications(data: any[], meta: any): any[] {
        const flattenedApps: any[] = [];

        function recurse(subProcesses: any[]) {
            for (const item of subProcesses) {
                if (item.selected || item.indeterminate) {
                    for (const app of item.Applications || []) {
                        flattenedApps.push({
                            ApplicationId: app.ApplicationId,
                            ApplicationName: app.ApplicationName,
                            BusinessSubProcessId: item.BusinessSubProcessId,
                            ...meta,
                        });
                    }
                }

                if (item.SubProcesses && item.SubProcesses.length > 0) {
                    recurse(item.SubProcesses);
                }
            }
        }

        recurse(data);
        return flattenedApps;
    }

    const meta: any = {
        BusinessProcessId: "BPID-123",
        BusinessUnitId: "BUID-456",
        ClientId: "CID-789",
        ProjectId: "PRJID-101",
        SprintId: "SID-202",
    };

    function checkType(val: any): string {
        if (Array.isArray(val)) {
            return 'Array';
        } else if (typeof val === 'object' && val !== null) {
            return 'Object';
        } else {
            return typeof val;
        }
    }

    const handleToggle = (
            node: any,
        target: any = null,
        type: 'subprocess' | 'businessprocess' | 'application' | 'transaction' | 'feature' | 'program' | 'integration' = 'subprocess'
): void => {
        const clone = (obj: any) => JSON.parse(JSON.stringify(obj));

        const updateChildren = (n: any, selected: boolean) => {
            n.selected = selected;
            n.indeterminate = false;
            if (!selected && n.ProjectSprintProcessId) n.delete = true;
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
            const items = [...(app.Transactions || []), ...(app.Features || []), ...(app.Programs || [])];
            const all = items.every((i: any) => i.selected);
            const none = items.every((i: any) => !i.selected);

            app.selected = all;
            app.indeterminate = !all && !none && items.length > 0;
        };

        const updateSubprocessSelectionState = (subprocess: any) => {
            const apps = subprocess.Applications || [];
            const allSelected = apps.every((app: any) => app.selected);
            const noneSelected = apps.every((app: any) => !app.selected && !app.indeterminate);
            const anySelected = apps.some((app: any) => app.selected || app.indeterminate);

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
                const indeterminate = n.SubProcesses?.filter((c: any) => c.indeterminate).length;

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
            if (type === 'businessprocess' && n.BusinessProcessId === node.BusinessProcessId) {
                updateChildren(n, !n.selected);
                return true;
            }

            if (type === 'subprocess' && n.BusinessSubProcessId === node.BusinessSubProcessId) {
                updateChildren(n, !n.selected);
                return true;
            }

            if (type === 'application' && target && n.BusinessSubProcessId === node.BusinessSubProcessId) {
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

            if (['transaction', 'feature', 'program'].includes(type) && target && n.BusinessSubProcessId === node.BusinessSubProcessId) {
                n.Applications?.forEach((app: any) => {
                    if (type === 'transaction') {
                        app.Transactions?.forEach((txn: any) => {
                            if (txn.TransactionId === target.TransactionId) txn.selected = !txn.selected;
                        });
                    } else if (type === 'feature') {
                        app.Features?.forEach((f: any) => {
                            if (f.FeatureId === target.FeatureId) f.selected = !f.selected;
                        });
                    } else if (type === 'program') {
                        app.Programs?.forEach((p: any) => {
                            if (p.ProgramId === target.ProgramId) p.selected = !p.selected;
                        });
                    }
                    updateAppSelectionState(app);
                });
                updateSubprocessSelectionState(n);
                return true;
            }

            if (type === 'integration' && target && n.BusinessSubProcessId === node.BusinessSubProcessId) {
                n.Integrations?.forEach((i: any) => {
                    if (i.IntegrationId === target.IntegrationId) i.selected = !i.selected;
                });
                return true;
            }

            return n.SubProcesses?.some(updateNodeRecursive) || false;
        };

        const newTree = clone(state.SubProcessesTreeData);

        newTree.BusinessProcesses.forEach((bp: any) => {
            updateNodeRecursive(bp);
        });

        updateParents(newTree.BusinessProcesses);

        setState({ SubProcessesTreeData: newTree });
    };

    return (
        <div className="  pt-0  ">
            <div>
                <div>
                    <div className="flex justify-between items-center pb-4">
                        <div className="-3 pt-1 flex items-center  ">
                            <p className="ml-4 font-semibold text-xl">Business Process Mapping</p>
                        </div>

                        <div>{/* Action buttons (optional) */}</div>
                    </div>
                </div>
            </div>

            <ProjectSprintSubProcessTree
                treeData={state.SubProcessesTreeData}
                onToggle={handleToggle}
                onAddClick={(node: any) => {
                    console.log('Add clicked for', node);
                }}
            />
        </div>
    );
}
