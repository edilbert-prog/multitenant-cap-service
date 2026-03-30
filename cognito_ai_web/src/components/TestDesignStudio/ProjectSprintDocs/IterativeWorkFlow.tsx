import {
    FiRefreshCw,
    FiCheck,
    FiDownload,
    FiBriefcase,
    FiEdit2,
    FiCalendar,
    FiPlus,
    FiChevronLeft,
    FiArrowLeft
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import dayjs, { type Dayjs } from "dayjs";
import {ArrowUp, Calendar, Workflow} from "lucide-react";
import ConfirmPopup from "@/utils/ConfirmPopup";
import { HugeiconsIcon } from "@hugeicons/react";
import {Delete02Icon, SparklesIcon} from "@hugeicons/core-free-icons";
import CustomTableData from "@/utils/CustomTableData";
import { apiRequest } from "@/utils/helpers/ApiHelper";
import CustomModal from "@/utils/CustomModal";
import {apiRequestForm} from "@/utils/helpers/ApiHelperForm";
import PillGroup from "@/utils/PillGroup";
import SearchBar from "@/utils/SearchBar";
import useDebounce from "@/utils/helpers/useDebounce";
import Tooltip from "@/utils/Tooltip";
import React, {useEffect, useReducer, useRef, useState} from "react";
import DatePicker from "@/utils/DatePicker";
import WorkSpaceScenarioDocs from "@/components/TestDesignStudio/ProjectSprintDocs/WorkSpaceScenarioDocs";
import socket from "@/utils/socket";
import DropdownV2 from "@/utils/DropdownV2";
import { descriptors } from "node_modules/chart.js/dist/core/core.defaults";

export default function FilePickerWithNotes(props): JSX.Element {
    // ---- Constants / Theming ----
    const PRIMARY = "#0071E9"; // sky blue primary (existing)
    const LABELS = {
        title: "Iteration Flow",
        file: "Choose file",
        note: "",
        send: "Extract Information",
        usePrevious: "Use previous attempt",
        tablePrompt: "Prompt",
        tableResult: "Result",
    } as const;

    // Fixed endpoints
    const UPLOAD_ENDPOINT = "/cognito/api/llm/GetDataResultsWithAttachmentAndPrompt";
    const LIST_ENDPOINT = "/GetIterationWorkflowPaginationFilterSearch";
    const DELETE_ENDPOINT = "/DeleteIterationWorkflow";
    const WORKSPACE_ADDUPDATE_ENDPOINT = "/AddUpdateIterativeWorkSpace";

    // ---- State ----
    const [currentStep, setCurrentStep] = useState<1 | 2>(1);
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [fileSize, setFileSize] = useState<string | null>(null); // NEW
    const [note, setNote] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [showPostSendModal, setShowPostSendModal] = useState(false);
    const [generatedFile, setGeneratedFile] = useState<File | null>(null);

    // Generate Test Scenarios modal
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [generateProgress, setGenerateProgress] = useState(0);
    const [generateComplete, setGenerateComplete] = useState(false);
    const [generateError, setGenerateError] = useState<string | null>(null);

    // Result "View more" modal
    const [isViewMoreOpen, setIsViewMoreOpen] = useState(false);
    const [viewMoreText, setViewMoreText] = useState<string>("");

    // Tooltips / focus
    const [showUploadTip, setShowUploadTip] = useState(true);
    const [showPromptTip, setShowPromptTip] = useState(false);
    const [showSendTip, setShowSendTip] = useState(false);
    const [promptFocused, setPromptFocused] = useState(false);
    const promptRef = useRef<HTMLTextAreaElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // URL params
    const searchParams = new URLSearchParams(location.search);
    const ClientIdFromUrl = searchParams.get("CLId") || "";
    const ProjectIdFromUrl = searchParams.get("PJID") || "";
    const sprintIdFromUrl = searchParams.get("SPRID") || "";
    const BusinessUnitIdFromUrl = searchParams.get("BUID") || "";
    const BusinessUnitIdNameFromUrl = searchParams.get("BUNM") || "";

    // ===== Workspaces state =====
    type Workspace = {
        ProjectId: string;
        SprintId: string;
        WorkspaceId: string;
        WorkSpaceName: string;
        StartDate: string | null;
        EndDate: string | null;
        Status: number;
        CreatedDate: string | null;
        ModifiedDate: string | null;
        ID: string;
    };

    const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
    const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<"IterativeFlow" | "ScenarioWorkspace">("IterativeFlow");
    const [workspaceModalOpen, setWorkspaceModalOpen] = useState(false);
    const [workspaceModalMode, setWorkspaceModalMode] = useState<"create" | "edit">("create");
    const [workspaceForm, setWorkspaceForm] = useState<{ WorkSpaceName: string; StartDateInput: string; EndDateInput: string; ID: string; WorkspaceId: string }>(
        { WorkSpaceName: "", StartDateInput: "", EndDateInput: "", ID: "", WorkspaceId: "" }
    );
    const [workspaceSaving, setWorkspaceSaving] = useState(false);
    const [workspaceError, setWorkspaceError] = useState<string | null>(null);

    type Row = {
        IterationId: string;
        DocumentId?: string;
        DocumentPath?: string;
        DocumentName?: string;
        ConversationId?: string;
        Prompt: string;
        Result: string;
        StatusInfo?: any;
        Select?: any;
        actions?: any;
    };

    interface State {
        FileAttachFlag: string;
        SearchQuery: string;
        CurrentPage: number;
        TotalRecords: number;
        IterationData: any[];
        IsLoading?: boolean;
        Error?: string;
        isEditModalOpen: boolean;
        editingItem: Row | null;
        selectedResponses: Array<Row>;
        WorkspaceData: Workspace[];
        WorkspacesLoading?: boolean;
    }

    const initialState: State = {
        SearchQuery: "",
        CurrentPage: 1,
        FileAttachFlag: "Yes",
        IsUpdate: false,
        TotalRecords: 1,
        IterationData: [],
        IsLoading: false,
        Error: "",
        isEditModalOpen: false,
        editingItem: null,
        selectedResponses: [],
        WorkspaceData: [],
        WorkspacesLoading: false,
    };

    const [state, setState] = useReducer(
        (s: State, ns: Partial<State>): State => ({ ...s, ...ns }),
        initialState
    );

    const didFetchData = useRef<boolean>(false);

    useEffect(() => {
            setCurrentStep(1)
            setFile(null);
            setFileSize(null);
            setNote("");
            setState({FileAttachFlag:"Yes"})
            setState({ IsLoading: true, WorkspacesLoading: true });
        getData("")
        setSelectedWorkspace(null)
            setState({ IsLoading: false, WorkspacesLoading: false });
    }, [location.search]);
    console.log("location.search",location.search)
    useEffect(() => {
        const handler = (data) => {
            getDataExtractedResults()
        };
        socket.on('IterationDataUpdate', handler);
        return () => {
            socket.off('IterationDataUpdate', handler);
        };
    }, [location.search,selectedWorkspace?.WorkspaceId]);

    const debouncedSearchQuery: string = useDebounce(state.SearchQuery, 300) as string;
    const didSearchRun = useRef<boolean>(false);

    useEffect(() => {
        if (!didSearchRun.current) {
            didSearchRun.current = true;
            return;
        }
        void getData(debouncedSearchQuery, true);
    }, [debouncedSearchQuery]);

    const handleSearch = (value: string): void => {
        setState({ SearchQuery: value });
        if (value.trim() === "") {
            void getData("");
        }
    };
    
    const handleEditClick = (item: Row): void => {
        setState({ editingItem: { ...item }, isEditModalOpen: true });
    };

    const handleEditingItemChange = (field: keyof Row, value: string): void => {
        if (state.editingItem) {
            setState({
                editingItem: {
                    ...state.editingItem,
                    [field]: value,
                },
            });
        }
    };

    const handleSaveResult = async (): Promise<void> => {
        if (!state.editingItem) return;

        console.log("Saving item:", state.editingItem);
        // TODO: Add your API call here to save the updated item
        // For example: await apiRequest("/UpdateIterationResult", state.editingItem);

        setState({ isEditModalOpen: false, editingItem: null });
        await getDataExtractedResults(); // Refresh data after save
    };

    const getDataExtractedResults = async (SearchQuery: string = ""): Promise<void> => {
        try {
            const resp: any = await apiRequest(LIST_ENDPOINT, {
                ProjectId: ProjectIdFromUrl,
                SprintId: sprintIdFromUrl,
                WorkspaceId: selectedWorkspace?.WorkspaceId,
                SearchString: SearchQuery,
            });
            if (resp.ResponseData?.length > 0) {
                const mappedData = resp.ResponseData.map((v) => ({
                    IterationId: v.IterationId,
                    DocumentId: v.DocumentId,
                    DocumentPath: v.DocumentPath,
                    DocumentName: v.DocumentName,
                    ConversationId: v.ConversationId,
                    Prompt: v.Prompt,
                    Result: JSON.stringify(v.Result),
                }));
                setState({
                    IterationData: resp.ResponseData,
                    TotalRecords: resp.TotalRecords,
                    CurrentPage: 1,
                    selectedResponses: mappedData,
                });
            } else {
                setState({ IterationData: [], TotalRecords: 0, CurrentPage: 1, selectedResponses: [] });
            }
        } catch (err: any) {
            setState({ Error: err.toString() });
        } finally {
            setState({ IsLoading: false, WorkspacesLoading: false });
        }
    };

    const getData = async (SearchQuery: string = "", isSearch: boolean = false): Promise<void> => {
        try {
            const WorkspaceResp: any = await apiRequest("/GetIterativeWorkSpacePaginationFilterSearch", {
                ProjectId: ProjectIdFromUrl,
                SprintId: sprintIdFromUrl,
                SearchString: SearchQuery,
            });

            const wsList: Workspace[] = WorkspaceResp?.ResponseData || [];
            setState({ WorkspaceData: wsList });


        } catch (err: any) {
            setState({ Error: err.toString() });
        } finally {
            setState({ IsLoading: false, WorkspacesLoading: false });
        }
    };

    // ---- File handling ----
    const pickFile = () => fileInputRef.current?.click();

    const handleFiles = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const selectedFile = files[0];
        setFile(selectedFile);
        setFileSize(formatBytes(selectedFile.size));
        setShowUploadTip(false);
        setShowPromptTip(true);
        setTimeout(() => promptRef.current?.focus(), 0);
    };

    // Autosize textarea
    const maxPromptHeightRef = useRef<number>(typeof window !== "undefined" ? Math.round(window.innerHeight * 0.25) : 200);
    const autosizeTextarea = () => {
        const el = promptRef.current;
        if (!el) return;
        el.style.height = "auto";
        const maxH = maxPromptHeightRef.current;
        const newH = Math.min(el.scrollHeight, maxH);
        el.style.height = `${newH}px`;
        el.style.overflowY = el.scrollHeight > maxH ? "auto" : "hidden";
    };

    useEffect(() => {
        const onResize = () => {
            maxPromptHeightRef.current = Math.round(window.innerHeight * 0.25);
            autosizeTextarea();
        };
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    useEffect(() => {
        const timeout = setTimeout(() => {
            autosizeTextarea();
        }, 50);
        return () => clearTimeout(timeout);
    }, [note]);

    // Drag safety
    const dragHasFiles = (e: DragEvent | React.DragEvent) =>
        Array.from(e.dataTransfer?.types || []).includes("Files");

    useEffect(() => {
        const onWindowDragOver = (e: DragEvent) => {
            if (dragHasFiles(e)) {
                e.preventDefault();
                setDragActive(true);
            }
        };
        const onWindowDrop = (e: DragEvent) => {
            if (dragHasFiles(e)) {
                e.preventDefault();
                setDragActive(false);
                handleFiles(e.dataTransfer?.files || null);
            }
        };
        const onWindowDragLeave = (e: DragEvent) => {
            if (!e.relatedTarget) setDragActive(false);
        };
        window.addEventListener("dragover", onWindowDragOver);
        window.addEventListener("drop", onWindowDrop);
        window.addEventListener("dragleave", onWindowDragLeave);
        return () => {
            window.removeEventListener("dragover", onWindowDragOver);
            window.removeEventListener("drop", onWindowDrop);
            window.removeEventListener("dragleave", onWindowDragLeave);
        };
    }, [handleFiles]);

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return "0 B";
        const k = 1024, sizes = ["B", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        const value = bytes / Math.pow(k, i);
        return `${value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2)} ${sizes[i]}`;
    };

    // Upload with progress
    const uploadWithProgress = (url: string, formData: FormData) => {
        return new Promise<any>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", url);
            const token = sessionStorage.getItem('access_token');
            if (token) xhr.setRequestHeader('authentication', token);

            xhr.upload.onprogress = (e) => {
                if (!e.lengthComputable) return;
                const pct = Math.round((e.loaded / e.total) * 100);
                setUploadProgress(pct);
            };

            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try { resolve(xhr.responseText ? JSON.parse(xhr.responseText) : {}); }
                        catch { resolve({}); }
                    } else {
                        reject(new Error(xhr.statusText || `HTTP ${xhr.status}`));
                    }
                }
            };
            xhr.onerror = () => reject(new Error("Network error"));
            xhr.send(formData);
        });
    };

    console.log("FileAttachFlagcscs",state.FileAttachFlag)
    // ---- Actions: handleSend (UPDATED) ----
    const handleSend = async () => {
        setError(null);
        if (!note.trim()) {
            setError("Please enter a prompt.");
            setShowPromptTip(true);
            setShowSendTip(false);
            promptRef.current?.focus();
            return;
        }
        let FileAttachFlag=state.FileAttachFlag

        // === NEW: Auto-create file if none selected ===
        let finalFile: File = file as File;
        if (!file) {
            FileAttachFlag="No"
            setState({FileAttachFlag})
            console.log("No file selected → creating 'prompt.txt' with prompt content");
            const blob = new Blob([note.trim()], { type: "text/plain" });
            finalFile = new File([blob], "prompt.txt", { type: "text/plain" });
        } else {
            console.log("Using uploaded file:", file.name);
        }
        setFile(finalFile);
        setFileSize(formatBytes(finalFile.size));
        setSubmitting(true);
        setIsUploading(true);
        setUploadProgress(0);

        try {
            const fd = new FormData();
            fd.append("file", finalFile); // Always send a file
            fd.append("Prompt", note.trim());
            fd.append("ProjectId", ProjectIdFromUrl);
            fd.append("SprintId", sprintIdFromUrl);
            fd.append("WorkspaceId", selectedWorkspace?.WorkspaceId);
            fd.append("FileAttachFlag", FileAttachFlag);
            fd.append("IterationId", "");
            fd.append("ConversationId", "");
            fd.append("DocumentName", finalFile.name);
            fd.append("DocumentPath", "");
            fd.append("DocumentId", "");
            fd.append("Result", "");

            await uploadWithProgress(UPLOAD_ENDPOINT, fd);

            // Update file pill to show auto-generated file
            if (!file) {
                setFile(finalFile);
                setFileSize(formatBytes(finalFile.size));
            }

            setShowPostSendModal(true);
        } catch (err: any) {
            setError(err?.message || "Unknown error");
        } finally {
            setSubmitting(false);
            setIsUploading(false);
            setShowUploadTip(false);
            setShowPromptTip(false);
            setShowSendTip(false);
            setUploadProgress((p) => (p < 100 && !error ? 100 : p));
        }
    };

    const handleDelete = async (reqObj: Record<string, unknown>): Promise<void> => {
        await apiRequest(DELETE_ENDPOINT, reqObj);
        await getDataExtractedResults()
    };

    const handleRefresh = async () => {
        setState({ IsLoading: true, WorkspacesLoading: true });
        await getDataExtractedResults(state.SearchQuery || "");
        setState({ IsLoading: false, WorkspacesLoading: false });
    };

    // Selection handling
    const TestCasesLisDataRaw: Row[] = state.IterationData.map((v) => ({
        IterationId: v.IterationId,
        DocumentId: v.DocumentId,
        DocumentPath: v.DocumentPath,
        DocumentName: v.FileAttachFlag==="Yes"?v.DocumentName:"-",
        ConversationId: v.ConversationId,
        Prompt: v.Prompt,
        Result: JSON.stringify(v.Result),
    }));

    const isRowSelected = (iterationId: string): boolean =>
        state.selectedResponses.some((item) => item.IterationId === iterationId);

    const handleSelectAll = (checked: boolean) => {
        if (checked) setState({ selectedResponses: [...TestCasesLisDataRaw] });
        else setState({ selectedResponses: [] });
    };

    const handleRowSelect = (row: Row, checked: boolean) => {
        let newArray = [...state.selectedResponses];
        if (checked) {
            const exists = newArray.some((item) => item.IterationId === row.IterationId);
            if (!exists) newArray.push(row);
        } else {
            newArray = newArray.filter((item) => item.IterationId !== row.IterationId);
        }
        setState({ selectedResponses: newArray });
    };

    // Cells
    const StatusCell: React.FC<{ value: string }> = ({ value }) => {
        if ((value || "").toLowerCase() === "inprogress") {
            return (
                <div className="flex text-wrap items-center gap-2 text-blue-600">
                    <FiRefreshCw className="animate-spin" size={16} />
                    <span className="text-wrap">In progress</span>
                </div>
            );
        }
        return (
            <span className="inline-flex px-2 py-1 rounded-lg text-green-700 bg-green-50 font-medium">Done</span>
        );
    };

    const renderResultCell = (text: string) => {
        const safe = (() => {
            try { return JSON.stringify(JSON.parse(text), null, 2); }
            catch { return text; }
        })();
        const trimmed = safe.length > 30 ? safe.slice(0, 30) + "…" : safe;
        const needsMore = safe.length > 30;
        return (
            <div className="flex items-center gap-2">
                <span className="whitespace-nowrap overflow-hidden text-ellipsis">{trimmed}</span>
                {needsMore && (
                    <button
                        type="button"
                        onClick={() => {
                            setViewMoreText(safe);
                            setIsViewMoreOpen(true);
                        }}
                        className="text-sm underline"
                        style={{ color: PRIMARY }}
                    >
                        View more
                    </button>
                )}
            </div>
        );
    };

    let pillItems = [
        { key: "IterativeFlow", label: "Workflow" },
        { key: "ScenarioWorkspace", label: "Scenarios" },
    ];

    

    const handleGenerateFile = async () => {
        if (state.selectedResponses.length === 0) {
            setError("Please select at least one item to generate a file.");
            return;
        }
        try {
            let fileContent = "=== ITERATION FLOW RESULTS ===\n\n";
            let FirstDocName=""
            let IterationId=""
            state.selectedResponses.forEach((row, index) => {
                FirstDocName=index===0&&row.DocumentName
                IterationId=index===0&&row.IterationId
                fileContent += `--- Item ${index + 1} ---\n`;
                fileContent += `Iteration ID: ${row.IterationId}\n`;
                fileContent += `Document Name: ${row.DocumentName || 'N/A'}\n`;
                fileContent += `Prompt: ${row.Prompt}\n`;
                fileContent += `Result: ${row.Result}\n`;
                fileContent += `\n\n`;
            });
            const blob = new Blob([fileContent], { type: 'text/plain' });
            const fileName = `${FirstDocName}_${selectedWorkspace?.WorkSpaceName}_${IterationId}_Results_${new Date().toISOString().slice(0, 10)}}.txt`;
            const file = new File([blob], fileName, { type: 'text/plain' });
            setGeneratedFile(file);
            setShowGenerateModal(true);
            setGenerateProgress(0);
            setGenerateComplete(false);
            setGenerateError(null);
            await handleInitiateSession(file);
        } catch (err: any) {
            setGenerateError("Failed to generate file: " + err.message);
        }
    };

    const handleInitiateSession = async (file: File): Promise<void> => {
        const CurrAddEditObj: any = {
            ClientId: ClientIdFromUrl,
            ProjectId: ProjectIdFromUrl,
            SprintId: sprintIdFromUrl,
        };
        let SourceType = "Document";
        let StatusInfo = "Reading Document";
        CurrAddEditObj.SessionStatus = "Starting";
        CurrAddEditObj.StatusInfo = StatusInfo;
        const resp: any = await apiRequest("/project-sprint-session-docs/AddUpdateProjectSprintSession", CurrAddEditObj);
        if (resp) {
            const newSessionId: string = resp.addProjectSprintSessionDocs.insertId;
            await handleUpload(file, newSessionId, SourceType);
        }
    };

    const handleUpload = async (
        file: File,
        SessionId: string,
        SourceType: string
    ): Promise<void> => {
        try {
            const metData: Record<string, unknown> = {
                ClientId: ClientIdFromUrl,
                ProjectId: ProjectIdFromUrl,
                SprintId: sprintIdFromUrl,
                DocumentId: "",
                ExistingRecordConfirm: false,
                ExistingDocumentDetails: {},
                BusinessUnitId: BusinessUnitIdFromUrl,
                BusinessUnitName: BusinessUnitIdNameFromUrl,
                ActionType: "",
                WorkspaceId:selectedWorkspace?.WorkspaceId,
                AdditionalPrompt: "",
                InputFilePath: "",
                SourceType,
                MarkdownFilePath: "",
                ObjectInfo:[],
                ImpactWorkspaceId:"",
                FileInfo:[{
                    FileName:"",
                    Descripton:"",
                }],
                SessionId,
                BusinessProcesses: JSON.stringify([])
            };
            const formData = new FormData();
            formData.append('file', file);
            Object.keys(metData).forEach((key) => {
                formData.append(key, metData[key] as string);
            });
            await uploadWithProgressGenerate('/cognito/api/llm/UploadDocumentNew', formData);
            setGenerateComplete(true);
            setGenerateProgress(100);
        } catch (err: any) {
            console.error(err);
            setGenerateError(err?.message || "Upload failed. Please try again.");
        }
    };

    const uploadWithProgressGenerate = (url: string, formData: FormData) => {
        return new Promise<any>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", url);
            const token = sessionStorage.getItem('access_token');
            if (token) xhr.setRequestHeader('authentication', token);

            xhr.upload.onprogress = (e) => {
                if (!e.lengthComputable) return;
                const pct = Math.round((e.loaded / e.total) * 100);
                setGenerateProgress(pct);
            };

            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try { resolve(xhr.responseText ? JSON.parse(xhr.responseText) : {}); }
                        catch { resolve({}); }
                    } else {
                        reject(new Error(xhr.statusText || `HTTP ${xhr.status}`));
                    }
                }
            };
            xhr.onerror = () => reject(new Error("Network error"));
            xhr.send(formData);
        });
    };

    const handleDownloadFile = () => {
        if (!generatedFile) return;
        const url = URL.createObjectURL(generatedFile);
        const link = document.createElement('a');
        link.href = url;
        link.download = generatedFile.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleCheckProgress = () => {
        window.location.href = '/Project';
    };

    const isAllSelected = TestCasesLisDataRaw.length > 0 && state.selectedResponses.length === TestCasesLisDataRaw.length;
    const isSomeSelected = state.selectedResponses.length > 0 && state.selectedResponses.length < TestCasesLisDataRaw.length;



    const GeneratedResultsData: Row[] = state.IterationData.map((v) => ({
        IterationId: v.IterationId,
        DocumentName: v.FileAttachFlag==="Yes"?v.DocumentName: "-",
        Prompt: v.Prompt,
        Result: v.Result || "",
        StatusInfo: <StatusCell value={v.StatusInfo} />,
        Select: (
            <div className="flex items-center">
                <label className="custom-checkbox cursor-pointer">
                    <input
                        type="checkbox"
                        checked={isRowSelected(v.IterationId)}
                        onChange={(e) =>
                            handleRowSelect(
                                {
                                    IterationId: v.IterationId,
                                    DocumentId: v.DocumentId,
                                    DocumentPath: v.DocumentPath,
                                    DocumentName: v.DocumentName,
                                    ConversationId: v.ConversationId,
                                    Prompt: v.Prompt,
                                    Result: JSON.stringify(v.Result),
                                },
                                e.target.checked
                            )
                        }
                        onClick={(e) => e.stopPropagation()}
                    />
                    <span className="checkmark" />
                </label>
            </div>
        ),
        actions: (
            <div className="flex items-center gap-4 ">
                <button onClick={() => handleEditClick(v)} className="text-[#1A1A1A]" title="Edit">
                    <FiEdit2 />
                </button>
                <ConfirmPopup message="Are you sure you want to delete this item?" onConfirm={() => handleDelete(v)}>
                    <button className="text-[#1A1A1A]" title="Delete">
                        <HugeiconsIcon icon={Delete02Icon} />
                    </button>
                </ConfirmPopup>
            </div>
        ),
    }));
    const tableDataWithRenderedResult = GeneratedResultsData.map((r) => ({
        ...r,
        Result: renderResultCell(r.Result),
    }));
    const GeneratedResultsColums = [
        { key: "Select", header: <label className="inline-flex items-center gap-2 text-sm cursor-pointer"><label className="custom-checkbox cursor-pointer"><input type="checkbox" checked={isAllSelected} ref={(el) => { if (el) el.indeterminate = isSomeSelected; }} onChange={(e) => handleSelectAll(e.target.checked)} onClick={(e) => e.stopPropagation()} /><span className="checkmark" /></label></label>, sortable: false, filterable: false, TruncateData: false, colWidth: "4%" },
        { key: "IterationId", header: "#ID", sortable: false, filterable: false, TruncateData: false, colWidth: "8%" },
        { key: "DocumentName", header: "Document", sortable: false, filterable: false, TruncateData: false, colWidth: "15%" },
        { key: "Prompt", header: "Prompt", sortable: false, filterable: false, TruncateData: false, colWidth: "20%", truncateAt: 20 },
        { key: "Result", header: "Result", sortable: false, filterable: false, colWidth: "27%" },
        { key: "StatusInfo", header: "Status", sortable: false, filterable: false, colWidth: "10%" },
        { key: "actions", header: "Action", sortable: false, filterable: false, colWidth: "6%" },
    ] as const;

    

    const canSend = !!note.trim(); // FILE OPTIONAL
    const promptEmphasis = promptFocused || note.trim().length > 0 || !!file;

    // Date helpers
    const pad = (v: number) => (v < 10 ? `0${v}` : `${v}`);
    const formatIsoToMmDdYyyySlash = (iso?: string | null) => {
        if (!iso) return "";
        const d = new Date(iso);
        if (isNaN(d.getTime())) return "";
        return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}`;
    };
    const formatIsoToMmDdYyyyHyphen = (iso?: string | null) => {
        if (!iso) return "";
        const d = new Date(iso);
        if (isNaN(d.getTime())) return "";
        return `${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${d.getFullYear()}`;
    };
    const parseMmDdYyyyToIso = (val: string): string | null => {
        const m = val.trim().match(/^(\d{2})[\/\-\s](\d{2})[\/\-\s](\d{4})$/);
        if (!m) return null;
        const mm = Number(m[1]), dd = Number(m[2]), yyyy = Number(m[3]);
        if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
        const dt = new Date(Date.UTC(yyyy, mm - 1, dd, 0, 0, 0));
        return dt.toISOString();
    };

    // Drag events
    const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
        if (!dragHasFiles(e)) return;
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        handleFiles(e.dataTransfer.files);
    };
    const onDragOver: React.DragEventHandler<HTMLDivElement> = (e) => {
        if (!dragHasFiles(e)) return;
        e.preventDefault();
        e.stopPropagation();
        setDragActive(true);
    };
    const onDragLeave: React.DragEventHandler<HTMLDivElement> = (e) => {
        if (!dragHasFiles(e)) return;
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
    };

    // Workspace CRUD
    const openCreateWorkspace = () => {
        setWorkspaceModalMode("create");
        setWorkspaceForm({ WorkSpaceName: "", StartDateInput: "", EndDateInput: "", ID: "", WorkspaceId: "" });
        setWorkspaceError(null);
        setWorkspaceModalOpen(true);
        setState({IsUpdate:false})
    };

    const openEditWorkspace = (ws: Workspace) => {
        setWorkspaceModalMode("edit");
        setState({IsUpdate:true})
        setWorkspaceForm({
            WorkSpaceName: ws.WorkSpaceName || "",
            StartDateInput: formatIsoToMmDdYyyyHyphen(ws.StartDate),
            EndDateInput: formatIsoToMmDdYyyyHyphen(ws.EndDate),
            ID: ws.ID || "",
            WorkspaceId: ws.WorkspaceId || "",
        });
        setWorkspaceError(null);
        setWorkspaceModalOpen(true);
    };

    const saveWorkspace = async () => {
        setWorkspaceError(null);
        if (!workspaceForm.WorkSpaceName.trim()) {
            setWorkspaceError("Workspace name is required.");
            return;
        }
        const StartIso = workspaceForm.StartDateInput ? parseMmDdYyyyToIso(workspaceForm.StartDateInput) : null;
        const EndIso = workspaceForm.EndDateInput ? parseMmDdYyyyToIso(workspaceForm.EndDateInput) : null;
        if (workspaceForm.StartDateInput && !StartIso) {
            setWorkspaceError("Start Date must be in MM/DD/YYYY format.");
            return;
        }
        if (workspaceForm.EndDateInput && !EndIso) {
            setWorkspaceError("End Date must be in MM/DD/YYYY format.");
            return;
        }
        const payload: Workspace = {
            ProjectId: ProjectIdFromUrl,
            SprintId: sprintIdFromUrl,
            WorkspaceId: state.IsUpdate?workspaceForm.WorkspaceId:"",
            IsUpdate:  state.IsUpdate,
            WorkSpaceName: workspaceForm.WorkSpaceName.trim(),
            StartDate: StartIso,
            EndDate: EndIso,
            ID:"",
        };
        try {
            setWorkspaceSaving(true);
            await apiRequest(WORKSPACE_ADDUPDATE_ENDPOINT, payload);
            setWorkspaceSaving(false);
            setWorkspaceModalOpen(false);
            getData()
        } catch (e: any) {
            setWorkspaceSaving(false);
            setWorkspaceError(e?.message || "Failed to save workspace");
        }
    };

    
        const workspaceColumns = [
            { key: "WorkspaceId", header: "#", colWidth: "15%" },
            { key: "WorkSpaceName", header: "Workspace Name", colWidth: "65%" },
            { key: "actions", header: "Action", colWidth: "20%" },
        ];

        const workspaceTableData = state.WorkspaceData.map((ws) => ({
            WorkspaceId:ws.WorkspaceId,
            WorkSpaceName: ws.WorkSpaceName,
            actions: (
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => { setSelectedWorkspace(ws); setActiveWorkspaceTab("IterativeFlow"); }}
                        className="text-nowrap cursor-pointer font-medium hover:underline"
                        style={{ color: PRIMARY }}
                    >
                        Workflow
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); openEditWorkspace(ws); }} title="Edit workspace">
                        <FiEdit2 />
                    </button>
                    <ConfirmPopup
                        message="Are you sure you want to delete this workspace?"
                        onConfirm={() => console.log("Delete", ws.WorkspaceId)} // Replace with your delete handler
                    >
                        <button title="Delete workspace">
                            <HugeiconsIcon icon={Delete02Icon} />
                        </button>
                    </ConfirmPopup>
                </div>
            ),
        }));

    return (
        <div className="w-full px-4">
            {!selectedWorkspace ? (
                <div className="w-full">
                <div className="flex items-center justify-between mb-4 mt-4 ">
                    <div className="flex items-center gap-4">
                        <h2 className="text-2xl font-semibold text-gray-900">Workspaces</h2>
                        <SearchBar currentValue={state.SearchQuery} onSearch={handleSearch} size="medium" />
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => { getData() }} className="inline-flex border cursor-pointer items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium" style={{ borderColor: PRIMARY, color: PRIMARY }}>
                            <FiRefreshCw className={state.WorkspacesLoading ? "animate-spin" : ""} />
                            Refresh
                        </button>
                        <button onClick={openCreateWorkspace} className="inline-flex cursor-pointer items-center gap-2 px-4 py-2 rounded-lg text-white font-medium shadow-sm" style={{ backgroundColor: PRIMARY }}>
                            <FiPlus /> Create Workspace
                        </button>
                    </div>
                </div>
                <div className="border rounded-lg overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
                    <CustomTableData
                        showSpinnerFlag={state.WorkspacesLoading}
                        scrollHeightClass="h-[calc(100vh-300px)]"
                        data={workspaceTableData}
                        columns={workspaceColumns}
                        rowKey="WorkspaceId"
                        emptyState={
                            <div className="p-8 text-center text-gray-600">
                                No workspaces yet. Click <span className="font-medium" style={{ color: PRIMARY }}>Create Workspace</span> to get started.
                            </div>
                        }
                    />
                </div>
            </div>
            ) : (
                <div className="w-full">
                    <div className="flex items-center justify-between mb-1 mt-2">
                        <div className="w-full flex items-center gap-4">
                            <button onClick={() => {
                                setCurrentStep(1)
                                setSelectedWorkspace(null)
                                setFile(null);
                                setFileSize(null);
                                setNote("");
                                setState({FileAttachFlag:"Yes"})
                            }} className="inline-flex items-center gap-2 px-3 py-2 text-sm text-blue-700 font-medium cursor-pointer rounded-2xl hover:bg-blue-50">
                                <FiArrowLeft /> Back
                            </button>
                            <div className="hidden sm:block h-5 w-px bg-gray-600" />
                            <div className=" w-full flex items-center justify-between">
                                <div className="text-sm text-gray-00 font-semibold"> <PillGroup
                                    items={pillItems}
                                    primaryKey={activeWorkspaceTab}
                                    onClick={(tab) => {
                                        setActiveWorkspaceTab(tab.key)
                                        if (tab.key==='IterativeFlow') {
                                            setCurrentStep(1)
                                            setFile(null);
                                            setFileSize(null);
                                            setNote("");
                                            setState({FileAttachFlag:"Yes"})
                                        }
                                    }}
                                /></div>
                                <div className="text-sm text-gray-00 font-semibold">Workspace: <span className="font-medium text-gray-700"> {selectedWorkspace?.WorkSpaceName || "Workspace"}</span></div>
                            </div>
                        </div>
                    </div>
                    {/*<div className="border-b mb-2" style={{ borderColor: "#E5E7EB" }}>*/}
                    {/*    <nav className="-mb-px flex gap-2">*/}
                    {/*        /!*{pillItems.map(tab => (*!/*/}
                    {/*        /!*    <button key={tab.key} onClick={() => setActiveWorkspaceTab(tab.key)} className={`px-4 cursor-pointer py-2.5 border-b-2 text- font-medium ${activeWorkspaceTab === tab.key ? 'border-[#0071E9] text-[#0071E9]' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>*!/*/}
                    {/*        /!*        {tab.label}*!/*/}
                    {/*        /!*    </button>*!/*/}
                    {/*        /!*))}*!/*/}
                    {/*        <PillGroup*/}
                    {/*            items={pillItems}*/}
                    {/*            primaryKey={activeWorkspaceTab}*/}
                    {/*            onClick={(tab) => setActiveWorkspaceTab(tab.key)}*/}
                    {/*        />*/}

                    {/*    </nav>*/}
                    {/*</div>*/}

                    {activeWorkspaceTab === "ScenarioWorkspace" ? (
                            <div className="mt-6">
                                <WorkSpaceScenarioDocs CurrentSprint={selectedWorkspace}/>

                            </div>
                    ) : (
                        <>
                            <div className="w-full bg-white -b mt-2" style={{ borderColor: "#E5E7EB" }}>
                                <div className="max-w-xl mx-auto px-2 py-5">
                                    <div className="flex items-center gap-4">
                                        <StepCircle index={1} active={currentStep === 1} complete={false} PrimaryLabel="Preprocessing" label="Upload & Prompt" onClick={() => {
                                            setFile(null);
                                            setFileSize(null);
                                            setNote("");
                                            setCurrentStep(1)
                                            setState({FileAttachFlag:"Yes"})
                                        }} />
                                        <StepConnector active={currentStep === 2} />
                                        <StepCircle index={2} active={currentStep === 2} complete={false} PrimaryLabel="Postprocessing" label="Review & Generate" onClick={() => {
                                            setCurrentStep(2)
                                            setFile(null);
                                            setFileSize(null);
                                            setNote("");
                                            getDataExtractedResults()
                                        }} />
                                    </div>
                                </div>
                            </div>
                            <div className="">
                                {currentStep === 1 && (
                                    <div
                                        className="bg-white border rounded-2xl p-5 shadow-sm relative overflow-hidden"
                                        style={{ borderColor: "#E5E7EB" }}
                                        onDrop={onDrop}
                                        onDragOver={onDragOver}
                                        onDragLeave={onDragLeave}
                                    >
                                        <p className="text-lg font-semibold mb-3">Write a prompt <span className="text-gray-600 text-sm font-medium"> - You can attach files (.docx, .txt, .excel)</span> </p>

                                        <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => handleFiles(e.target.files)} aria-hidden />

                                        {/* Drag Overlay */}
                                        <AnimatePresence>
                                            {dragActive && (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="absolute inset-0 bg-blue-50 bg-opacity-90 flex items-center justify-center z-10 rounded-2xl"
                                                >
                                                    <div className="text-center">
                                                        <div className="text-2xl font-semibold text-blue-700 mb-2">Drop files here</div>
                                                        <p className="text-sm text-blue-600">Release to upload</p>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* File Pill */}
                                        {file&& state.FileAttachFlag==="Yes" && (
                                            <div className="mb-4 inline-flex items-center gap-3 rounded-xl bg-gray-100 px-3 py-2 border" style={{ borderColor: "#E5E7EB" }}>
                                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-200">
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#6B7280" strokeWidth="1.5" />
                                                        <path d="M14 2v6h6" stroke="#6B7280" strokeWidth="1.5" />
                                                    </svg>
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-sm font-medium text-gray-900 truncate max-w-[260px]">{file.name}</div>
                                                    <div className="text-xs text-gray-500">{fileSize}</div>
                                                </div>
                                                <button type="button" className="ml-1 p-1 rounded-md hover:bg-gray-200" onClick={() => { setFile(null); setFileSize(null); }} aria-label="Remove file">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                        <path d="M6 6l12 12M18 6L6 18" stroke="#111827" strokeWidth="2" strokeLinecap="round" />
                                                    </svg>
                                                </button>
                                            </div>
                                        )}

                                        {/* Upload Progress */}
                                        {isUploading && (
                                            <div className="mb-3">
                                                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                                    <div className="h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%`, backgroundColor: PRIMARY }} />
                                                </div>
                                                <div className="mt-1 text-xs text-gray-600">Uploading… {uploadProgress}%</div>
                                            </div>
                                        )}

                                        <div className="relative">
                                            <div className={`rounded-2xl  border bg-white transition shadow-sm ${dragActive ? "ring-2 ring-blue-500" : ""}`} style={{
                                                borderColor: note.trim() || file ? PRIMARY : "#E5E7EB",
                                                ...(promptFocused && { boxShadow: `0 0 0 1px ${PRIMARY}` }),
                                            }}>
                                                <div className="px-3 pt-3 pb-16">
                                                    <textarea
                                                        ref={promptRef}
                                                        value={note}
                                                        onChange={(e) => {
                                                            setNote(e.target.value);
                                                            if (e.target.value.trim()) {
                                                                setShowPromptTip(false);
                                                                setShowSendTip(true);
                                                            } else {
                                                                setShowSendTip(false);
                                                            }
                                                            autosizeTextarea(); // ← critical
                                                        }}
                                                        aria-label="Prompt input"
                                                        aria-describedby={error ? "prompt-error" : undefined}
                                                        onFocus={() => setPromptFocused(true)}
                                                        onBlur={() => setPromptFocused(false)}
                                                        rows={1}
                                                        placeholder="Ask anything"
                                                        autoFocus={currentStep === 1 && !note.trim()}
                                                        className="w-full resize-none border-0 bg-transparent text-[15px] text-left outline-none"
                                                        style={{
                                                            minHeight: 48,
                                                            caretColor: "#111827",
                                                            transition: "box-shadow 0.15s ease",

                                                        }}
                                                    />
                                                </div>
                                                <div className="absolute bottom-3 left-3">
                                                    <Tooltip placement="top" content={<span>Choose file to attach. Supported: .docx, .txt, .pdf, .xlsx</span>}>
                                                        <button type="button" onClick={pickFile} className="p-2 border text-[#0071E9] cursor-pointer rounded-full hover:text-white hover:bg-[#0071E9] transition" style={{ borderColor: PRIMARY }}>
                                                            <FiPlus size={20} />
                                                        </button>
                                                    </Tooltip>
                                                </div>
                                                <div className="absolute bottom-3 right-3">
                                                    <button
                                                        onClick={handleSend}
                                                        disabled={submitting || !canSend}
                                                        className="inline-flex cursor-pointer items-center gap-2 p-3 rounded-full shrink-0  text-white font-medium disabled:opacity-0  disabled:cursor-not-allowed transition"
                                                        style={{ backgroundColor: PRIMARY }}
                                                    >
                                                        {isUploading ? <>Uploading {uploadProgress}%</> : submitting ? <>Extracting…</> : <><ArrowUp size={23} icon={SparklesIcon} /> </>}
                                                    </button>

                                                </div>
                                            </div>
                                        </div>

                                        {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
                                    </div>
                                )}

                                <AnimatePresence mode="wait">
                                    {currentStep === 2 && (
                                        <motion.div key="step2" initial={{ opacity: 0, x: 0 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -1 }} transition={{ type: "spring", stiffness: 300, damping: 26 }}>
                                            <div className="flex flex-col gap-3">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="font-semibold text-lg text-gray-900">Generated Results</p>
                                                        {state.selectedResponses.length > 0 ? (
                                                            <span className="font-medium text-sm">{state.selectedResponses.length} of {GeneratedResultsData.length} selected</span>
                                                        ) : null}
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <button onClick={handleRefresh} disabled={state.IsLoading} className="inline-flex border items-center gap-2 px-3 py-1 rounded-full text-sm font-medium disabled:opacity-50" style={{ borderColor: PRIMARY, color: PRIMARY }}>
                                                            <FiRefreshCw className={state.IsLoading ? "animate-spin" : ""} size={16} />
                                                            Refresh
                                                        </button>
                                                        <button onClick={handleGenerateFile} className="bg-[#0071E9] text-nowrap font-semibold hover:bg-[#005ABA] cursor-pointer text-white py-2 px-3 rounded-lg flex items-center space-x-2">
                                                            <HugeiconsIcon size={19} icon={SparklesIcon} />
                                                            <span>Generate Test Scenarios</span>
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="border rounded-lg overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
                                                    <CustomTableData
                                                        spinnerLabel="Generating Test Cases"
                                                        showSpinnerFlag={state.IsLoading || false}
                                                        scrollHeightClass="h-[calc(100vh-364px)]"
                                                        truncateCharLimit={40}
                                                        data={tableDataWithRenderedResult}
                                                        columns={GeneratedResultsColums as any}
                                                        rowKey="IterationId"
                                                        hideHeader={false}
                                                    />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Post-send modal */}
            <AnimatePresence>
                {showPostSendModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                        <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl">
                            <h3 className="text-lg font-semibold text-gray-900">Do you want to upload more?</h3>
                            <p className="mt-1 text-sm text-gray-600">Choose "Yes" to stay here (we'll clear the file but keep your prompt), or "Continue" to move to Step 2.</p>
                            <div className="mt-5 flex items-center justify-end gap-2">
                                <button
                                    onClick={() => {
                                        setFile(null);
                                        setFileSize(null);
                                        setShowPostSendModal(false);
                                        setCurrentStep(1);
                                        setFile(null);
                                        setFileSize(null);
                                        setNote("");
                                        getDataExtractedResults()
                                    }}
                                    className="px-4 py-2 cursor-pointer rounded-xl text-white font-medium"
                                    style={{ backgroundColor: PRIMARY }}
                                >
                                    Yes, upload more
                                </button>
                                <button onClick={() => {
                                    setShowPostSendModal(false);
                                    setCurrentStep(2);
                                    handleRefresh();
                                }} className="px-4 py-2 rounded-xl cursor-pointer  bg-gray-100 text-gray-900 font-medium hover:bg-gray-200">
                                    Continue
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Generate Modal */}
            <AnimatePresence>
                {showGenerateModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-md bg-white rounded-2xl p-8 shadow-2xl">
                            {generateError ? (
                                <>
                                    <div className="flex flex-col items-center gap-6">
                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }} className="w-24 h-24 rounded-full flex items-center justify-center bg-red-500">
                                            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </motion.div>
                                        <div className="text-center">
                                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload Failed</h3>
                                            <p className="text-sm text-red-600 mb-4">{generateError}</p>
                                        </div>
                                        <div className="w-full flex flex-col gap-2">
                                            <button onClick={() => { setGenerateError(null); setGenerateProgress(0); setGenerateComplete(false); handleGenerateFile(); }} className="w-full px-4 py-3 rounded-xl text-white font-medium" style={{ backgroundColor: PRIMARY }}>
                                                Try Again
                                            </button>
                                            <button onClick={() => { setShowGenerateModal(false); setGenerateError(null); setGenerateComplete(false); setGenerateProgress(0); }} className="w-full px-4 py-3 rounded-xl bg-gray-100 text-gray-900 font-medium hover:bg-gray-200">
                                                Close
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : !generateComplete ? (
                                <>
                                    <h3 className="text-xl font-semibold text-gray-900 text-center mb-6">Uploading Document</h3>
                                    <div className="flex flex-col items-center gap-6">
                                        <div className="relative w-32 h-32">
                                            <svg className="transform -rotate-90 w-32 h-32">
                                                <circle cx="64" cy="64" r="56" stroke="#E5E7EB" strokeWidth="8" fill="none" />
                                                <circle cx="64" cy="64" r="56" stroke={PRIMARY} strokeWidth="8" fill="none" strokeDasharray={`${2 * Math.PI * 56}`} strokeDashoffset={`${2 * Math.PI * 56 * (1 - generateProgress / 100)}`} strokeLinecap="round" className="transition-all duration-300" />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-2xl font-bold" style={{ color: PRIMARY }}>{generateProgress}%</span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-600 text-center">Please wait while we upload your document...</p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex flex-col items-center gap-6">
                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }} className="w-24 h-24 rounded-full flex items-center justify-center" style={{ backgroundColor: PRIMARY }}>
                                            <FiCheck className="text-white" size={48} strokeWidth={3} />
                                        </motion.div>
                                        <div className="text-center">
                                            <p className="text-base text-gray-700 mb-4">Successfully initiated scenario generation</p>
                                            <button onClick={() => {
                                                setActiveWorkspaceTab("ScenarioWorkspace")
                                                setShowGenerateModal(false)
                                            }} className="text-sm cursor-pointer font-medium underline" style={{ color: PRIMARY }}>
                                                Click here to check progress
                                            </button>
                                        </div>
                                        <button onClick={handleDownloadFile} className="w-full cursor-pointer flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-medium hover:bg-gray-50 transition-colors" style={{ borderColor: PRIMARY, color: PRIMARY }}>
                                            <FiDownload size={18} />
                                            Download Text File
                                        </button>
                                        <button onClick={() => { setShowGenerateModal(false); setGenerateComplete(false); setGenerateProgress(0); }} className="  cursor-pointer text-gray-500 hover:text-gray-800 underline">
                                            Close
                                        </button>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <CustomModal isOpen={isViewMoreOpen} onClose={() => setIsViewMoreOpen(false)} title="Full Result" width="max-w-3xl">
                <p className="text-sm whitespace-pre-wrap break-words">{viewMoreText}</p>
            </CustomModal>

            {/* Edit Modal */}
            <CustomModal
                isOpen={state.isEditModalOpen}
                onClose={() => setState({ isEditModalOpen: false, editingItem: null })}
                title={
                    <div className="flex items-center justify-between w-full">
                        <span>Edit Result</span>
                        <div className="relative ml-5 w-36">
                            <DropdownV2
                                placeholder="View Updates"
                                size="small"
                                showClear={false}
                                options={[
                                    { label: "Update from 2025-11-01", value: "1" },
                                    { label: "Update from 2025-10-28", value: "2" },
                                    { label: "Update from 2025-10-25", value: "3" },
                                ]}
                                onChange={(value, selected) => console.log("Selected update:", selected)}
                            />
                        </div>
                    </div>
                }
                width="max-w-4xl"
            >
                {state.editingItem && (
                    <div className="space-y-4 h-[calc(100vh-300px)] flex flex-col relative">
                        <div className="flex-grow flex flex-col">
                            <textarea
                                value={state.editingItem.Result}
                                onChange={(e) => handleEditingItemChange("Result", e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 font-mono text-xs flex-grow"
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-4 mt-auto">
                            <button
                                onClick={() => setState({ isEditModalOpen: false, editingItem: null })}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveResult}
                                className="px-4 py-2 text-sm font-medium text-white rounded-lg"
                                style={{ backgroundColor: PRIMARY }}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                )}
            </CustomModal>

            <CustomModal DisableScroll={true} isOpen={workspaceModalOpen} onClose={() => setWorkspaceModalOpen(false)} title={workspaceModalMode === 'create' ? 'Create Workspace' : 'Edit Workspace'} width="max-w-lg">
                <div className="space-y-4">
                    {workspaceError && <div className="text-sm text-red-600">{workspaceError}</div>}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Workspace Name</label>
                        <input type="text" value={workspaceForm.WorkSpaceName} onChange={(e) => setWorkspaceForm((s) => ({ ...s, WorkSpaceName: e.target.value }))} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" style={{ borderColor: "#E5E7EB" }} placeholder="Enter name" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Start Date</label>
                            <DatePicker value={workspaceForm.StartDateInput} onChange={(v) => setWorkspaceForm((s) => ({ ...s, StartDateInput: v }))} displayFormat="MM/DD/YYYY" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">End Date</label>
                            <DatePicker value={workspaceForm.EndDateInput} onChange={(v) => setWorkspaceForm((s) => ({ ...s, EndDateInput: v }))} displayFormat="MM/DD/YYYY" />
                        </div>
                    </div>
                    <div className="pt-2 flex items-center justify-end gap-2">
                        <button onClick={() => setWorkspaceModalOpen(false)} className="px-4 py-2 cursor-pointer rounded-xl bg-gray-100 text-gray-900 font-medium hover:bg-gray-200">
                            Cancel
                        </button>
                        <button onClick={saveWorkspace} disabled={workspaceSaving} className="px-4 cursor-pointer py-2 rounded-xl text-white font-medium inline-flex items-center gap-2 disabled:opacity-60" style={{ backgroundColor: PRIMARY }}>
                            {workspaceSaving && <FiRefreshCw className="animate-spin" />}
                            {workspaceModalMode === 'create' ? 'Create' : 'Save changes'}
                        </button>
                    </div>
                </div>
            </CustomModal>
        </div>
    );
}


const StepCircle: React.FC<{ index: 1 | 2; active: boolean; complete: boolean; PrimaryLabel: string; label: string; onClick?: () => void; disabled?: boolean; }> = ({ index, active, complete, PrimaryLabel, label, onClick, disabled }) => {
    const PRIMARY = "#0071E9";
    const bg = complete || active ? PRIMARY : "#ffffff";
    const textColor = active || complete ? PRIMARY : "#6B7280";
    const StepNo = active || complete ? "#ffffff" : PRIMARY;
    return (
        <button type="button" onClick={disabled ? undefined : onClick} disabled={disabled} title={`Go to ${label}`} className="group flex items-center gap-3 rounded-full focus:outline-none " style={{ cursor: disabled ? "not-allowed" : "pointer" }}>
            <div className="flex items-center justify-center rounded-full w-10 h-10 font-semibold relative transition-transform group-hover:scale-105" style={{ backgroundColor: bg, border: `2px solid ${PRIMARY}` }}>
                {complete ? <FiCheck size={22} /> : <span style={{ color: StepNo }} className="text-lg text-center">{index}</span>}
            </div>
            <div>
                <div className="font-medium text-lg" style={{ color: textColor }}>{PrimaryLabel}</div>
                <div className="font-medium text-sm" style={{ color: textColor }}>{label}</div>
            </div>
        </button>
    );
};

const StepConnector: React.FC<{ active?: boolean }> = ({ active }) => {
    const PRIMARY = "#0071E9";
    const INACTIVE = "#E5E7EB";

    return (
        <div className="flex-1 h-1 rounded-full" style={{ backgroundColor: INACTIVE }}>
            <motion.div
                className="h-full rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: active ? "100%" : "0%" }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                style={{ backgroundColor: PRIMARY }}
            />
        </div>
    );
};
