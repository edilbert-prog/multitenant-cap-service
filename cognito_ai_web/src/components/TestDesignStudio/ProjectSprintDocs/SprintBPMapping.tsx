// BusinessProcessMappingModal.tsx — Business Process Mapping in CustomModal (existing logic in a popup)
import React, { useEffect, useReducer, useRef, useState } from "react";
import CustomModal from "../../../utils/CustomModal";
import { apiRequest } from "../../../utils/helpers/ApiHelper";
import Spinner from "../../../utils/Spinner";
import ErrorScreen from "../../../utils/ErrorScreen";
import ProjectSprintSubProcessTree from "./ProjectSprintSubProcessTree";
import { Plus } from "lucide-react";
import Toast from "@/utils/Toast";

// --- Types copied/adapted from your original file ---
type ToggleType =
    | "subprocess"
    | "businessprocess"
    | "application"
    | "transaction"
    | "feature"
    | "program"
    | "integration";

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

type ToggleNode = Pick<BusinessProcess, "BusinessProcessId"> &
    Pick<SubProcessNode, "BusinessSubProcessId">;

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

interface Props {
    isOpen: boolean;
    onClose: () => void; // close popup from parent
    title?: React.ReactNode | string;
    width?: string; // default max-w-5xl
    CurrentSprint: {
        ClientId: string;
        BusinessUnitId: string;
        ProjectId: string;
        SprintId: string;
    };
    onSaved?: () => void;
}

interface State {
    SubProcessesTreeData: TreeData;
    IsLoading: boolean;
    SavingLoader: boolean;
    Error?: string;
}

export default function SprintBPMapping({ isOpen, onClose, title, width = "max-w-5xl", CurrentSprint, onSaved, }: Props) {
    const [state, setState] = useReducer(
        (s: State, ns: Partial<State>): State => ({ ...s, ...ns }),
        {
            SubProcessesTreeData: { BusinessProcesses: [] },
            IsLoading: false,
            SavingLoader: false,
            Error: undefined,
        }
    );

    const didFetchData = useRef(false);
    const [initialData, setInitialData] = useState<TreeData | null>(null);
    const [toastMessage, setToastMessage] = useState("");
    const [showToast, setShowToast] = useState(false);

    // Load when opened
    useEffect(() => {
        if (!isOpen) return;
        let cancelled = false;

        const init = async () => {
            setState({ IsLoading: true, Error: undefined });
            try {
                await getData("");
            } catch (e: any) {
                if (!cancelled) setState({ Error: e?.toString?.() ?? "Failed to load" });
            } finally {
                if (!cancelled) setState({ IsLoading: false });
            }
        };

        init();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, CurrentSprint?.ClientId, CurrentSprint?.BusinessUnitId, CurrentSprint?.ProjectId, CurrentSprint?.SprintId]);

    const getData = async (SearchQuery: string = "", PageNo: number = 1) => {
        const resp: any = await apiRequest("/GetClientSubProcessesProjectSprintV3", {
            ClientId: CurrentSprint.ClientId,
            BusinessUnitId: CurrentSprint.BusinessUnitId,
            ProjectId: CurrentSprint.ProjectId,
            SprintId: CurrentSprint.SprintId,
            PageNo,
            SearchString: SearchQuery,
        });

        if (resp.ResponseData) {
            setState({ SubProcessesTreeData: resp.ResponseData as TreeData });
            setInitialData(JSON.parse(JSON.stringify(resp.ResponseData)));
        } else {
            setState({ SubProcessesTreeData: { BusinessProcesses: [] } });
            setInitialData({ BusinessProcesses: [] });
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

            if ((node.ProjectSprintProcessId ?? "") === "" && !isSelected) return;

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
                            IntegrationId: "",
                            IntegrationName: "",
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
                                ProjectSprintTransactionId: txn.ProjectSprintTransactionId || "",
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
                                ProjectSprintFeatureId: feature.ProjectSprintFeatureId || "",
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
            setToastMessage("No changes detected");
            setShowToast(true);
            return;
        }

        const finalData = flattenForDBInsertion(state.SubProcessesTreeData?.BusinessProcesses, {
            ClientId: CurrentSprint.ClientId,
            BusinessUnitId: CurrentSprint.BusinessUnitId,
            ProjectSprintProcessId: "",
            ProjectId: CurrentSprint.ProjectId,
            SprintId: CurrentSprint.SprintId,
            SessionId: "SID-99",
        });

        try {
            setState({ SavingLoader: true });

            if (finalData.SubProcesses.length > 0) {
                const reqObj = { ReqestData: finalData.SubProcesses } as any;
                await apiRequest("/AddUpdateProjectSprintClientSubProcessMasterV3", reqObj);
            }

            if (finalData.Transactions.length > 0) {
                await apiRequest("/AddProjectSprintApplicationTransactionsMaster", finalData.Transactions as any);
            }

            if (finalData.Programs.length > 0) {
                await apiRequest("/AddProjectSprintApplicationProgramsMaster", finalData.Programs as any);
            }

            if (finalData.Features.length > 0) {
                await apiRequest("/AddProjectSprintApplicationFeaturesMaster", finalData.Features as any);
            }

            if (finalData.Integrations.length > 0) {
                await apiRequest("/AddProjectSprintSubProcessIntegrationsMaster", finalData.Integrations as any);
            }

            setToastMessage("Saved successfully");
            setShowToast(true);

            onSaved && onSaved();
            onClose();
        } catch (e) {
            setToastMessage((e as any)?.toString?.() ?? "Failed to save");
            setShowToast(true);
        } finally {
            setState({ SavingLoader: false });
        }
    };

    const handleToggle = (
        node: ToggleNode,
        target: ApplicationItem | TransactionItem | FeatureItem | ProgramItem | IntegrationItem | null = null,
        type: ToggleType = "subprocess"
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

            if (type === "businessprocess" && (n as BusinessProcess).BusinessProcessId === node.BusinessProcessId) {
                updateChildren(asSub, !asSub.selected);
                return true;
            }

            if (type === "subprocess" && asSub.BusinessSubProcessId === node.BusinessSubProcessId) {
                updateChildren(asSub, !asSub.selected);
                return true;
            }

            if (type === "application" && target && asSub.BusinessSubProcessId === node.BusinessSubProcessId) {
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
                ["transaction", "feature", "program"].includes(type) &&
                target &&
                asSub.BusinessSubProcessId === node.BusinessSubProcessId
            ) {
                asSub.Applications?.forEach((app) => {
                    if (type === "transaction") {
                        app.Transactions?.forEach((txn) => {
                            if (txn.TransactionId === (target as TransactionItem).TransactionId) txn.selected = !txn.selected;
                        });
                    } else if (type === "feature") {
                        app.Features?.forEach((f) => {
                            if (f.FeatureId === (target as FeatureItem).FeatureId) f.selected = !f.selected;
                        });
                    } else if (type === "program") {
                        app.Programs?.forEach((p) => {
                            if (p.ProgramId === (target as ProgramItem).ProgramId) p.selected = !p.selected;
                        });
                    }
                    updateAppSelectionState(app);
                });
                updateSubprocessSelectionState(asSub);
                return true;
            }

            if (type === "integration" && target && asSub.BusinessSubProcessId === node.BusinessSubProcessId) {
                asSub.Integrations?.forEach((i) => {
                    if (i.IntegrationId === (target as IntegrationItem).IntegrationId) i.selected = !i.selected;
                });
                return true;
            }

            return (asSub.SubProcesses || []).some(updateNodeRecursive);
        };

        const newTree = JSON.parse(JSON.stringify(state.SubProcessesTreeData)) as TreeData;

        newTree.BusinessProcesses.forEach((bp) => {
            updateNodeRecursive(bp as unknown as SubProcessNode);
        });

        updateParents(newTree.BusinessProcesses);

        setState({ SubProcessesTreeData: newTree });
    };

    const footer = [
        <button
            key="close"
            onClick={onClose}
            className="cursor-pointer px-5 py-2 bg-white text-blue-700 border border-blue-600 text-sm rounded-lg"
        >
            Close
        </button>,
        <button
            key="save"
            onClick={state.SavingLoader ? undefined : handleSaveToSprint}
            className="cursor-pointer px-5 py-2 bg-[#0071E9] hover:bg-[#005ABA] text-white text-sm rounded-lg flex items-center gap-2"
        >
            {state.SavingLoader ? (
                <Spinner size="sm" color="white" text="Saving..." />
            ) : (
                <>
                    <Plus className="w-4 h-4" /> Save to sprint
                </>
            )}
        </button>,
    ];

    return (
        <CustomModal
            width={width}
            isOpen={isOpen}
            onClose={onClose}
            title={title ?? <div className="font-medium text-base">Business Process Mapping</div>}
            footerContent={footer}
        >
            {state.IsLoading ? (
                <div className="h-96 py-20">
                    <Spinner size="lg" color="blue-500" text="Fetching data..." />
                </div>
            ) : state.Error ? (
                <ErrorScreen message={state.Error} />
            ) : (
                <div className="pt-0">
                    <ProjectSprintSubProcessTree
                        treeData={state.SubProcessesTreeData}
                        onToggle={handleToggle}
                        onAddClick={(_node: unknown) => {}}
                    />
                </div>
            )}

            <Toast message={toastMessage} show={showToast} onClose={() => setShowToast(false)} />
        </CustomModal>
    );
}
