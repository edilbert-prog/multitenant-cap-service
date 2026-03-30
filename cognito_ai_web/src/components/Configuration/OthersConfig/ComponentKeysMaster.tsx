import React, { useEffect, useReducer, useRef } from 'react';
import CustomTable from "../../../utils/CustomTable.jsx";
import { CircleAlert, Plus, Save, Trash2, X, SquarePen } from "lucide-react";
import { apiRequest } from "../../../utils/helpers/ApiHelper.js";
import SpinnerV2 from "../../../utils/SpinnerV2.jsx";
import ErrorScreen from "../../../utils/ErrorScreen.jsx";
import Toast from "../../../utils/Toast.jsx";
import ConfirmPopup from "../../../utils/ConfirmPopup.jsx";
import useDebounce from '../../../utils/helpers/useDebounce.js';
import SearchBar from "../../../utils/SearchBar.jsx";
import Dropdown from "../../../utils/DropdownV2.jsx";

interface ComponentKey {
    ComponentKeyId: string;
    ComponentType: string;
    ComponentTypeLabel?: string;
    ComponentId: string;
    ComponentIdLabel?: string;
    KeyType: string;
    KeyName: string;
    Status: number;
    isNew?: boolean;
    tempId?: number;
}

type EditingMap = Record<string | number, boolean>;
type FieldErrors = Partial<Record<keyof ComponentKey, string>>;
type RowErrorsMap = Record<string | number, FieldErrors | undefined>;

interface DropdownOption {
    value: string;
    label: string;
    [key: string]: any;
}

interface State {
    Error: string;
    ComponentKeys: ComponentKey[];
    SearchQuery: string;
    IsLoading: boolean;
    showToast: boolean;
    SavingLoader: boolean;
    editingRows: EditingMap;
    newRows: ComponentKey[];
    rowErrors: RowErrorsMap;
    componentTypeOptions: DropdownOption[];
    executionComponentOptions: DropdownOption[];
    validationComponentOptions: DropdownOption[];
    loadingComponentTypes: boolean;
    loadingComponentIds: Record<string | number, boolean>;
}

interface Column {
    title: string;
    key: string;
    className?: string;
}

type TableRow = Record<string, React.ReactNode>;

export default function ComponentKeysMaster(): JSX.Element {
    const initialState: State = {
        Error: "",
        ComponentKeys: [],
        SearchQuery: "",
        IsLoading: true,
        showToast: false,
        SavingLoader: false,
        editingRows: {},
        newRows: [],
        rowErrors: {},
        componentTypeOptions: [],
        executionComponentOptions: [],
        validationComponentOptions: [],
        loadingComponentTypes: false,
        loadingComponentIds: {},
    };

    const [state, setState] = useReducer(
        (prev: State, next: Partial<State>): State => ({ ...prev, ...next }),
        initialState
    );

    const didFetchData = useRef<boolean>(false);

    useEffect(() => {
        if (didFetchData.current) return;
        didFetchData.current = true;

        const init = async () => {
            setState({ IsLoading: true });
            await Promise.all([
                getData(""),
                getComponentTypes()
            ]);
            setState({ IsLoading: false });
        };

        void init();
    }, []);

    const getComponentTypes = async () => {
        console.log("Fetching component types...");
        setState({ loadingComponentTypes: true });
        try {
            const resp: any = await apiRequest("/GetComponentTypesMaster", {
                SearchString: ""
            });
            console.log("Component types response:", resp);

            if (resp.ResponseData && resp.ResponseData.length > 0) {
                setState({ componentTypeOptions: resp.ResponseData as DropdownOption[] });
            } else {
                setState({ componentTypeOptions: [] });
            }
        } catch (err) {
            console.error("Error fetching component types:", err);
        } finally {
            setState({ loadingComponentTypes: false });
        }
    };

    const getExecutionComponents = async () => {
        console.log("Fetching execution components...");
        try {
            const resp: any = await apiRequest("/GetExecutionComponents", {
                SearchString: ""
            });
            console.log("Execution components response:", resp);

            if (resp.ResponseData && resp.ResponseData.length > 0) {
                setState({ executionComponentOptions: resp.ResponseData as DropdownOption[] });
            } else {
                setState({ executionComponentOptions: [] });
            }
        } catch (err) {
            console.error("Error fetching execution components:", err);
        }
    };

    const getValidationComponents = async () => {
        console.log("Fetching validation components...");
        try {
            const resp: any = await apiRequest("/GetValidationInfo", {
                SearchString: ""
            });
            console.log("Validation components response:", resp);

            if (resp.ResponseData && resp.ResponseData.length > 0) {
                setState({ validationComponentOptions: resp.ResponseData as DropdownOption[] });
            } else {
                setState({ validationComponentOptions: [] });
            }
        } catch (err) {
            console.error("Error fetching validation components:", err);
        }
    };

    const getData = async (SearchQuery: string = "") => {
        try {
            const resp: any = await apiRequest("/GetComponentKeys", {
                SearchString: SearchQuery
            });

            if (resp.ResponseData && resp.ResponseData.length > 0) {
                setState({ ComponentKeys: resp.ResponseData as ComponentKey[] });
            } else {
                setState({ ComponentKeys: [] });
            }
        } catch (err) {
            setState({ Error: (err as Error).toString() });
        } finally {
            setState({ IsLoading: false });
        }
    };

    const handleAddNew = () => {
        const newRow: ComponentKey = {
            ComponentKeyId: "",
            ComponentType: "",
            ComponentId: "",
            KeyType: "",
            KeyName: "",
            Status: 1,
            isNew: true,
            tempId: Date.now()
        };
        setState({
            newRows: [...state.newRows, newRow],
            editingRows: {
                ...state.editingRows,
                [newRow.tempId as number]: true
            },
            rowErrors: {
                ...state.rowErrors,
                [newRow.tempId as number]: {}
            }
        });
    };

    const handleEdit = async (item: ComponentKey) => {
        const rowId = item.isNew ? (item.tempId as number) : item.ComponentKeyId;
        
        // Find the component type label to determine which options to load
        const selectedTypeOption = state.componentTypeOptions.find(opt => opt.value === item.ComponentType);
        const componentTypeLabel = selectedTypeOption?.label || selectedTypeOption?.ComponentTypeName || "";
        
        // Load component options based on existing ComponentType using the label
        if (componentTypeLabel.toLowerCase().includes('execution') && state.executionComponentOptions.length === 0) {
            await getExecutionComponents();
        } else if (componentTypeLabel.toLowerCase().includes('validation') && state.validationComponentOptions.length === 0) {
            await getValidationComponents();
        }

        setState({
            editingRows: {
                ...state.editingRows,
                [rowId]: true
            },
            rowErrors: {
                ...state.rowErrors,
                [rowId]: {}
            }
        });
    };

    const debouncedSearchQuery: string = useDebounce<string>(state.SearchQuery, 300);
    const didSearchRun = useRef<boolean>(false);

    useEffect(() => {
        if (!didSearchRun.current) {
            didSearchRun.current = true;
            return;
        }

        if (debouncedSearchQuery.trim() === "") return;
        void getData(debouncedSearchQuery);
    }, [debouncedSearchQuery]);

    const handleCancelAll = () => {
        setState({
            editingRows: {},
            newRows: [],
            rowErrors: {}
        });
    };

    const validateAllRows = (): boolean => {
        const requiredFields: Array<keyof ComponentKey> = [
            "ComponentType",
            "ComponentId",
            "KeyType",
            "KeyName"
        ];
        const newRowErrors: RowErrorsMap = {};
        let allValid = true;

        state.newRows.forEach((row) => {
            const rowId = row.tempId as number;
            newRowErrors[rowId] = {};

            requiredFields.forEach((field) => {
                const value = row[field];
                if (!value || (typeof value === 'string' && value.trim() === "")) {
                    if (!newRowErrors[rowId]) newRowErrors[rowId] = {};
                    (newRowErrors[rowId] as FieldErrors)[field] = "This field is required";
                    allValid = false;
                }
            });
        });

        Object.keys(state.editingRows).forEach((id) => {
            if (typeof id === 'string') {
                const row = state.ComponentKeys.find((t) => t.ComponentKeyId === id);
                if (row) {
                    newRowErrors[id] = {};
                    requiredFields.forEach((field) => {
                        const value = row[field];
                        if (!value || (typeof value === 'string' && value.trim() === "")) {
                            if (!newRowErrors[id]) newRowErrors[id] = {};
                            (newRowErrors[id] as FieldErrors)[field] = "This field is required";
                            allValid = false;
                        }
                    });
                }
            }
        });

        setState({ rowErrors: newRowErrors });
        return allValid;
    };

    const handleSaveAll = async () => {
        if (!validateAllRows()) return;

        setState({ SavingLoader: true });

        try {
            const editedRows = Object.keys(state.editingRows)
                .filter((id) => typeof id === 'string')
                .map((id) => {
                    return state.ComponentKeys.find((row) => row.ComponentKeyId === id);
                })
                .filter((r): r is ComponentKey => Boolean(r));

            const rowsToSend: ComponentKey[] = [...editedRows, ...state.newRows];

            if (rowsToSend.length > 0) {
                for (const row of rowsToSend) {
                    await apiRequest("/AddUpdateComponentKey", row as any);
                }
            }

            setState({
                SavingLoader: false,
                showToast: true,
                editingRows: {},
                newRows: [],
                rowErrors: {}
            });

            await getData();
            setTimeout(() => setState({ showToast: false }), 3000);

        } catch (error) {
            setState({ SavingLoader: false, Error: (error as Error).toString() });
        }
    };

    const handleComponentTypeChange = async (
        val: string,
        option: unknown,
        item: ComponentKey
    ) => {
        const newComponentType = val;
        const rowId = item.isNew ? (item.tempId as number) : item.ComponentKeyId;
        
        console.log("Component type changed to:", newComponentType);
        console.log("Row ID:", rowId);

        // Find the selected component type option to get its label
        const selectedTypeOption = state.componentTypeOptions.find(opt => opt.value === newComponentType);
        console.log("Selected type option:", selectedTypeOption);
        
        const componentTypeLabel = selectedTypeOption?.label || selectedTypeOption?.ComponentTypeName || "";
        console.log("Component type label:", componentTypeLabel);

        // Update ComponentType and reset ComponentId and KeyName
        if (item.isNew) {
            const updatedNewRows = state.newRows.map((row) => {
                if (row.tempId === item.tempId) {
                    return { ...row, ComponentType: newComponentType, ComponentId: "", KeyName: "" } as ComponentKey;
                }
                return row;
            });
            setState({ newRows: updatedNewRows });
        } else {
            const updatedKeys = state.ComponentKeys.map((t) => {
                if (t.ComponentKeyId === item.ComponentKeyId) {
                    return { ...t, ComponentType: newComponentType, ComponentId: "", KeyName: "" } as ComponentKey;
                }
                return t;
            });
            setState({ ComponentKeys: updatedKeys });
        }

        // Fetch appropriate component options based on type label
        if (newComponentType) {
            console.log("Setting loading state for row:", rowId);
            setState({
                loadingComponentIds: {
                    ...state.loadingComponentIds,
                    [rowId]: true
                }
            });

            try {
                // Check against the label/name instead of the ID
                if (componentTypeLabel.toLowerCase().includes('execution')) {
                    console.log("Fetching Execution components...");
                    await getExecutionComponents();
                } else if (componentTypeLabel.toLowerCase().includes('validation')) {
                    console.log("Fetching Validation components...");
                    await getValidationComponents();
                } else {
                    console.log("Unknown component type:", componentTypeLabel);
                }
            } catch (error) {
                console.error("Error fetching component options:", error);
            } finally {
                console.log("Removing loading state for row:", rowId);
                setState({
                    loadingComponentIds: {
                        ...state.loadingComponentIds,
                        [rowId]: false
                    }
                });
            }
        }
    };

    const handleComponentIdChange = (
        val: string,
        option: unknown,
        item: ComponentKey
    ) => {
        const selectedComponentId = val;
        
        console.log("Component ID changed to:", selectedComponentId);
        console.log("Current component type:", item.ComponentType);
        
        // Find the component type label
        const selectedTypeOption = state.componentTypeOptions.find(opt => opt.value === item.ComponentType);
        const componentTypeLabel = selectedTypeOption?.label || selectedTypeOption?.ComponentTypeName || "";
        console.log("Component type label:", componentTypeLabel);
        
        // Find the selected component to get its description
        const componentIdOptions = getComponentIdOptions(item.ComponentType);
        console.log("Available options:", componentIdOptions);
        
        const selectedOption = componentIdOptions.find(opt => opt.value === selectedComponentId);
        console.log("Selected option:", selectedOption);
        
        // Get description based on component type label
        let description = "";
        if (selectedOption) {
            if (componentTypeLabel.toLowerCase().includes('execution')) {
                // For Execution components, use 'Component' field as description
                description = selectedOption.Component || selectedOption.label || "";
            } else if (componentTypeLabel.toLowerCase().includes('validation')) {
                // For Validation components, use 'validation_description' field
                description = selectedOption.validation_description || selectedOption.label || "";
            }
        }
        
        console.log("Auto-populated description:", description);

        // Update both ComponentId and KeyName
        if (item.isNew) {
            const updatedNewRows = state.newRows.map((row) => {
                if (row.tempId === item.tempId) {
                    return { 
                        ...row, 
                        ComponentId: selectedComponentId,
                        KeyName: description 
                    } as ComponentKey;
                }
                return row;
            });
            setState({ newRows: updatedNewRows });
        } else {
            const updatedKeys = state.ComponentKeys.map((t) => {
                if (t.ComponentKeyId === item.ComponentKeyId) {
                    return { 
                        ...t, 
                        ComponentId: selectedComponentId,
                        KeyName: description 
                    } as ComponentKey;
                }
                return t;
            });
            setState({ ComponentKeys: updatedKeys });
        }
    };

    const handleDropdownChange = (
        val: string,
        option: unknown,
        name: keyof Pick<ComponentKey, 'KeyType'>,
        item: ComponentKey
    ) => {
        if (item.isNew) {
            const updatedNewRows = state.newRows.map((row) => {
                if (row.tempId === item.tempId) {
                    return { ...row, [name]: val } as ComponentKey;
                }
                return row;
            });
            setState({ newRows: updatedNewRows });
        } else {
            const updatedKeys = state.ComponentKeys.map((t) => {
                if (t.ComponentKeyId === item.ComponentKeyId) {
                    return { ...t, [name]: val } as ComponentKey;
                }
                return t;
            });
            setState({ ComponentKeys: updatedKeys });
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
        name: keyof Pick<ComponentKey, 'ComponentType' | 'ComponentId' | 'KeyType' | 'KeyName'>,
        item: ComponentKey
    ) => {
        if (item.isNew) {
            const updatedNewRows = state.newRows.map((row) => {
                if (row.tempId === item.tempId) {
                    return { ...row, [name]: e.target.value } as ComponentKey;
                }
                return row;
            });
            setState({ newRows: updatedNewRows });
        } else {
            const updatedKeys = state.ComponentKeys.map((t) => {
                if (t.ComponentKeyId === item.ComponentKeyId) {
                    return { ...t, [name]: e.target.value } as ComponentKey;
                }
                return t;
            });
            setState({ ComponentKeys: updatedKeys });
        }
    };

    const handleDeleteItem = async (item: ComponentKey) => {
        if (item.ComponentKeyId) {
            const resp: any = await apiRequest("/DeleteComponentKey", item as any);
            if (resp) {
                setState({ showToast: true });
                void getData(state.SearchQuery);
                setTimeout(() => {
                    setState({ showToast: false });
                }, 3000);
            }
        } else {
            setState({
                newRows: state.newRows.filter((row) => row.tempId !== item.tempId),
                editingRows: {
                    ...state.editingRows,
                    [item.tempId as number]: false
                },
                rowErrors: {
                    ...state.rowErrors,
                    [item.tempId as number]: undefined
                }
            });
        }
    };

    const handleSearch = (value: string) => {
        setState({ SearchQuery: value });
        if (value.trim() === "") {
            void getData("");
        }
    };

    const columns: Column[] = [
        { title: 'Component Type', key: 'ComponentType', className: 'min-w-[180px]' },
        { title: 'Component ID', key: 'ComponentId', className: 'min-w-[200px]' },
        { title: 'Key Type', key: 'KeyType', className: 'min-w-[120px]' },
        { title: 'Key Name', key: 'KeyName', className: 'min-w-[200px]' },
    ];

    const keyTypeOptions = ["Input", "OutPut"];

    const getComponentIdOptions = (componentType: string): DropdownOption[] => {
        // Find the component type label
        const selectedTypeOption = state.componentTypeOptions.find(opt => opt.value === componentType);
        const componentTypeLabel = selectedTypeOption?.label || selectedTypeOption?.ComponentTypeName || "";
        
        if (componentTypeLabel.toLowerCase().includes('execution')) {
            return state.executionComponentOptions;
        } else if (componentTypeLabel.toLowerCase().includes('validation')) {
            return state.validationComponentOptions;
        }
        return [];
    };

    const allRows: ComponentKey[] = [...state.newRows, ...state.ComponentKeys];

    const data: TableRow[] = allRows.map((item) => {
        const rowId = item.isNew ? (item.tempId as number) : item.ComponentKeyId;
        const isEditing = state.editingRows[rowId];
        const errors: FieldErrors = state.rowErrors[rowId] || {};
        const isLoadingComponentId = state.loadingComponentIds[rowId] || false;

        if (isEditing) {
            const componentIdOptions = getComponentIdOptions(item.ComponentType);

            return {
                ComponentType: (
                    <div>
                        <Dropdown
                            size="small"
                            mode="single"
                            options={state.componentTypeOptions}
                            value={item.ComponentType}
                            onChange={(val: string, option: unknown) => {
                                console.log("Dropdown onChange triggered");
                                handleComponentTypeChange(val, option, item);
                            }}
                            className={errors.ComponentType ? 'border-red-500' : ''}
                            placeholder="Select Type"
                        />
                        {errors.ComponentType && (
                            <div className="flex items-center mt-1 ml-2">
                                <CircleAlert size={14} className="text-red-500" />
                                <p className="ml-2 text-red-500 text-sm">{errors.ComponentType}</p>
                            </div>
                        )}
                    </div>
                ),
                ComponentId: (
                    <div>
                        <Dropdown
                            size="small"
                            mode="single"
                            options={componentIdOptions}
                            value={item.ComponentId}
                            onChange={(val: string, option: unknown) => {
                                console.log("ComponentId dropdown onChange triggered");
                                handleComponentIdChange(val, option, item);
                            }}
                            className={errors.ComponentId ? 'border-red-500' : ''}
                            placeholder={
                                isLoadingComponentId ? "Loading..." : 
                                !item.ComponentType ? "Select Component Type first" : 
                                componentIdOptions.length === 0 ? "No options available" :
                                "Select Component ID"
                            }
                            disabled={!item.ComponentType || isLoadingComponentId}
                        />
                        {errors.ComponentId && (
                            <div className="flex items-center mt-1 ml-2">
                                <CircleAlert size={14} className="text-red-500" />
                                <p className="ml-2 text-red-500 text-sm">{errors.ComponentId}</p>
                            </div>
                        )}
                    </div>
                ),
                KeyType: (
                    <div>
                        <Dropdown
                            size="small"
                            mode="single"
                            options={keyTypeOptions.map(opt => ({ value: opt, label: opt }))}
                            value={item.KeyType}
                            onChange={(val: string, option: unknown) => handleDropdownChange(val, option, "KeyType", item)}
                            className={errors.KeyType ? 'border-red-500' : ''}
                            placeholder="Select Key Type"
                        />
                        {errors.KeyType && (
                            <div className="flex items-center mt-1 ml-2">
                                <CircleAlert size={14} className="text-red-500" />
                                <p className="ml-2 text-red-500 text-sm">{errors.KeyType}</p>
                            </div>
                        )}
                    </div>
                ),
                KeyName: (
                    <div>
                        <input
                            value={item.KeyName || ''}
                            onChange={(e) => handleChange(e, "KeyName", item)}
                            type="text"
                            className={`w-full px-3 shadow text-[0.85rem] py-2 border ${errors.KeyName ? 'border-red-500' : 'border-gray-200'} rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            placeholder="Enter Key Name"
                            required
                        />
                        {errors.KeyName && (
                            <div className="flex items-center mt-1 ml-2">
                                <CircleAlert size={14} className="text-red-500" />
                                <p className="ml-2 text-red-500 text-sm">{errors.KeyName}</p>
                            </div>
                        )}
                    </div>
                ),
                actions: (
                    <div className="relative flex items-center">
                        <ConfirmPopup
                            message="Are you sure you want to delete this item?"
                            onConfirm={() => void handleDeleteItem(item)}
                        >
                            <button className="pr-4 flex items-center">
                                <Trash2 className="text-[#1A1A1A] cursor-pointer" />
                            </button>
                        </ConfirmPopup>
                    </div>
                ),
            };
        }

        return {
            ComponentType: item.ComponentTypeLabel || item.ComponentType,
            ComponentId: item.ComponentIdLabel || item.ComponentId,
            KeyType: item.KeyType,
            KeyName: item.KeyName,
            actions: (
                <div className="relative flex items-center">
                    <button
                        onClick={() => void handleEdit(item)}
                        className="ml-2 text-white px-3 py-1 rounded text-sm"
                    >
                        <SquarePen className="text-[#1A1A1A] cursor-pointer" />
                    </button>
                    <ConfirmPopup
                        message="Are you sure you want to delete this item?"
                        onConfirm={() => void handleDeleteItem(item)}
                    >
                        <button className="ml-2 pr-4 flex items-center">
                            <Trash2 className="text-[#1A1A1A] cursor-pointer" />
                        </button>
                    </ConfirmPopup>
                </div>
            ),
        };
    });

    const hasEdits = Object.keys(state.editingRows).length > 0 || state.newRows.length > 0;

    if (state.IsLoading) return <div className="h-96 py-20"><SpinnerV2 {...{ text: "Fetching data..." }} /></div>;
    if (state.Error) return <ErrorScreen message={state.Error} />;

    return (
        <div className="pt-0 pb-6 px-6">
            <Toast
                message="Saved successfully!"
                show={state.showToast}
                onClose={() => setState({ showToast: false })}
            />

            <div className="flex justify-between items-center pb-4">
                <div className="w-1/3">
                    <SearchBar currentValue={state.SearchQuery} onSearch={handleSearch} size="medium" />
                </div>

                <div className="flex items-center space-x-2 gap-4">
                    <button
                        onClick={handleAddNew}
                        className="bg-[#0071E9] hover:bg-[#005ABA] text-[0.89rem] cursor-pointer text-white font-medium py-2 px-5 rounded-lg flex items-center space-x-2"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Add</span>
                    </button>
                    {hasEdits && (
                        <>
                            <button
                                onClick={handleCancelAll}
                                className="text-red-600 ml-10 px-3 py-2 rounded-lg text-sm flex items-center hover:bg-gray-100 cursor-pointer"
                            >
                                <X size={16} className="mr-1" />
                                Cancel All
                            </button>
                            <button
                                onClick={handleSaveAll}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm flex cursor-pointer items-center"
                                disabled={state.SavingLoader}
                            >
                                {state.SavingLoader ? (
                                    <SpinnerV2 {...{ text: "Saving..." }} />
                                ) : (
                                    <>
                                        <Save size={16} className="mr-1" />
                                        Save All
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </div>
            </div>

            <CustomTable columns={columns} data={data} responsive={true} />
        </div>
    );
}