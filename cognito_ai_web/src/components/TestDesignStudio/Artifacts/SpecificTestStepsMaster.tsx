import React, { useEffect, useReducer, useRef, useState } from "react";
import CustomTable from "../../../utils/CustomTable.js";
import { CircleAlert, Plus, Save, Trash2, X, SquarePen } from "lucide-react";
import { apiRequest } from "../../../utils/helpers/ApiHelper.js";
import SpinnerV2 from "../../../utils/SpinnerV2.js";
import Toast from "../../../utils/Toast.js";
import ConfirmPopup from "../../../utils/ConfirmPopup.js";
import Dropdown from "../../../utils/DropdownV2.js";

type ReactNodeRecord = Record<string, React.ReactNode>;

interface Option {
    value: string;
    label: string;
    [key: string]: any;
}

interface SpecificTestStep {
    SpecificTestStepId: string;
    TestStepsId: string;
    TestCaseId: string;
    StepNo: number | string;
    ComponentType: string;
    ComponentTypeLabel?: string;
    Component: string;
    ComponentLabel?: string;
    Flag: number;
    Status: number;
    isNew?: boolean;
    tempId?: number;
}

interface State {
    SpecificTestSteps: SpecificTestStep[];
    ComponentTypeList: Option[];
    executionComponentOptions: Option[];
    validationComponentOptions: Option[];
    stepNoOptions: Option[];
    IsLoading: boolean;
    showToast: boolean;
    ToastMessage: string;
    SavingLoader: boolean;
    editingRows: Record<string | number, boolean>;
    newRows: SpecificTestStep[];
    rowErrors: Record<string | number, Record<string, string>>;
    loadingComponentTypes: boolean;
    loadingComponents: Record<string | number, boolean>;
}

type Action = Partial<State>;

type Props = {
    TestStepsId: string;
    TestCaseId: string;
    assignedTestCaseSteps?: any[];
};

const initialState: State = {
    SpecificTestSteps: [],
    ComponentTypeList: [],
    executionComponentOptions: [],
    validationComponentOptions: [],
    stepNoOptions: [],
    IsLoading: true,
    showToast: false,
    ToastMessage: "",
    SavingLoader: false,
    editingRows: {},
    newRows: [],
    rowErrors: {},
    loadingComponentTypes: false,
    loadingComponents: {},
};

function reducer(state: State, newState: Action): State {
    return { ...state, ...newState };
}

export default function SpecificTestStepsMaster(props: Props) {
    const [state, setState] = useReducer<typeof reducer, State>(reducer, initialState);
    const [togglingFlags, setTogglingFlags] = useState<Record<string | number, boolean>>({});

    const didFetchData = useRef<boolean>(false);

    useEffect(() => {
        if (didFetchData.current) return;
        didFetchData.current = true;

        const init = async () => {
            setState({ IsLoading: true });
            await Promise.all([
                getComponentTypes(),
                getData()
            ]);
            setState({ IsLoading: false });
        };
        init();
    }, []);

    // Process assignedTestCaseSteps to create step number options
    useEffect(() => {
        if (props.assignedTestCaseSteps && props.assignedTestCaseSteps.length > 0) {
            const steps = props.assignedTestCaseSteps
                .flatMap((step: any) => {
                    if (Array.isArray(step.TestCaseStepsResults)) {
                        return step.TestCaseStepsResults.map((result: any) => ({
                            value: result.StepNo?.toString() || '',
                            label: `Step ${result.StepNo}` || 'N/A'
                        }));
                    }
                    return [];
                })
                .filter((step: any) => step.value && step.value !== '-');
            
            // Remove duplicates
            const uniqueSteps = Array.from(new Map(steps.map((item: any) => [item.value, item])).values());
            setState({ stepNoOptions: uniqueSteps as Option[] });
        } else {
            // If no assignedTestCaseSteps, generate default options
            const defaultSteps = Array.from({ length: 50 }, (_, i) => ({
                value: (i + 1).toString(),
                label: `Step ${i + 1}`
            }));
            setState({ stepNoOptions: defaultSteps });
        }
    }, [props.assignedTestCaseSteps]);

    const getComponentTypes = async (): Promise<void> => {
        console.log("Fetching component types...");
        setState({ loadingComponentTypes: true });
        try {
            const resp: any = await apiRequest("/GetComponentTypesMaster", {});
            console.log("Component types response:", resp);
            
            if (resp.ResponseData && resp.ResponseData.length > 0) {
                setState({ ComponentTypeList: resp.ResponseData as Option[] });
            } else {
                setState({ ComponentTypeList: [] });
            }
        } catch (err) {
            console.error("Error fetching component types:", err);
        } finally {
            setState({ loadingComponentTypes: false });
        }
    };

    const getExecutionComponents = async (): Promise<void> => {
        console.log("Fetching execution components...");
        try {
            const resp: any = await apiRequest("/GetExecutionComponents", {});
            console.log("Execution components response:", resp);

            if (resp.ResponseData && resp.ResponseData.length > 0) {
                setState({ executionComponentOptions: resp.ResponseData as Option[] });
            } else {
                setState({ executionComponentOptions: [] });
            }
        } catch (err) {
            console.error("Error fetching execution components:", err);
        }
    };

    const getValidationComponents = async (): Promise<void> => {
        console.log("Fetching validation components...");
        try {
            const resp: any = await apiRequest("/GetValidationInfo", {});
            console.log("Validation components response:", resp);

            if (resp.ResponseData && resp.ResponseData.length > 0) {
                setState({ validationComponentOptions: resp.ResponseData as Option[] });
            } else {
                setState({ validationComponentOptions: [] });
            }
        } catch (err) {
            console.error("Error fetching validation components:", err);
        }
    };

    const getData = async (): Promise<void> => {
        try {
            // const resp: any = await apiRequest("/GetSpecificTestSteps", {
            const resp: any = await apiRequest("/GetSpecificTestStepsPaginationFilterSearch", {
                TestStepsId: props.TestStepsId,
                TestCaseId: props.TestCaseId,
            });
            if (resp.ResponseData && resp.ResponseData.length > 0) {
                setState({ SpecificTestSteps: resp.ResponseData as SpecificTestStep[] });
            } else {
                setState({ SpecificTestSteps: [] });
            }
        } catch (err) {
            console.error("Error fetching specific test steps:", err);
        } finally {
            setState({ IsLoading: false });
        }
    };

    const handleAddNew = (): void => {
        const existingStepNos = [...state.SpecificTestSteps, ...state.newRows].map(
            (item) => parseInt(String(item.StepNo)) || 0
        );
        const nextStepNo = existingStepNos.length > 0 ? Math.max(...existingStepNos) + 1 : 1;

        const newRow: SpecificTestStep = {
            SpecificTestStepId: "",
            TestStepsId: props.TestStepsId,
            TestCaseId: props.TestCaseId,
            StepNo: nextStepNo,
            ComponentType: "",
            Component: "",
            Flag: 0,
            Status: 1,
            isNew: true,
            tempId: Date.now(),
        };

        setState({
            newRows: [...state.newRows, newRow],
            editingRows: {
                ...state.editingRows,
                [newRow.tempId as number]: true,
            },
            rowErrors: {
                ...state.rowErrors,
                [newRow.tempId as number]: {},
            },
        });
    };

    const handleEdit = async (item: SpecificTestStep): Promise<void> => {
        const rowId = item.isNew ? (item.tempId as number) : item.SpecificTestStepId;
        
        // Find the component type label to determine which options to load
        const selectedTypeOption = state.ComponentTypeList.find(opt => opt.value === item.ComponentType);
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
                [rowId]: true,
            },
            rowErrors: {
                ...state.rowErrors,
                [rowId]: {},
            },
        });
    };

    const handleCancelAll = (): void => {
        setState({
            editingRows: {},
            newRows: [],
            rowErrors: {},
        });
    };

    const validateAllRows = (): boolean => {
        const requiredFields: Array<keyof Pick<SpecificTestStep, "StepNo" | "ComponentType" | "Component">> = [
            "StepNo",
            "ComponentType",
            "Component",
        ];
        const newRowErrors: Record<string | number, Record<string, string>> = {};
        let allValid = true;

        state.newRows.forEach((row) => {
            const rowId = row.tempId as number;
            newRowErrors[rowId] = {};

            requiredFields.forEach((field) => {
                const value = row[field];
                if (
                    value === undefined ||
                    value === null ||
                    value === "" ||
                    (field === "StepNo" && Number(value) <= 0)
                ) {
                    newRowErrors[rowId][field] = "This field is required";
                    allValid = false;
                }
            });
        });

        Object.keys(state.editingRows).forEach((idKey) => {
            const numericId = Number.isNaN(Number(idKey)) ? idKey : Number(idKey);
            if (typeof idKey === "string") {
                const row = state.SpecificTestSteps.find((t) => t.SpecificTestStepId === idKey);
                if (row) {
                    newRowErrors[numericId] = {};
                    requiredFields.forEach((field) => {
                        const value = row[field];
                        if (
                            value === undefined ||
                            value === null ||
                            value === "" ||
                            (field === "StepNo" && Number(value) <= 0)
                        ) {
                            newRowErrors[numericId][field] = "This field is required";
                            allValid = false;
                        }
                    });
                }
            }
        });

        setState({ rowErrors: newRowErrors });
        return allValid;
    };

    const handleSaveAll = async (): Promise<void> => {
        if (!validateAllRows()) {
            setState({ 
                showToast: true, 
                ToastMessage: "Please fill all required fields" 
            });
            setTimeout(() => setState({ showToast: false }), 3000);
            return;
        }

        setState({ SavingLoader: true });

        try {
            const editedRows = Object.keys(state.editingRows)
                .filter((id) => typeof id === "string")
                .map((id) => state.SpecificTestSteps.find((row) => row.SpecificTestStepId === id))
                .filter(Boolean) as SpecificTestStep[];

            const rowsToSend: SpecificTestStep[] = [...editedRows, ...state.newRows];

            if (rowsToSend.length > 0) {
                for (const row of rowsToSend) {
                    row.TestStepsId = props.TestStepsId;
                    row.TestCaseId = props.TestCaseId;
                    await apiRequest("/AddUpdateSpecificTestSteps", row as any);
                }
            }

            setState({
                SavingLoader: false,
                showToast: true,
                ToastMessage: "Saved successfully!",
                editingRows: {},
                newRows: [],
                rowErrors: {},
            });

            await getData();
            setTimeout(() => setState({ showToast: false }), 3000);
        } catch (error) {
            console.error("Error saving:", error);
            setState({ 
                SavingLoader: false,
                showToast: true,
                ToastMessage: "Error saving data. Please try again."
            });
            setTimeout(() => setState({ showToast: false }), 3000);
        }
    };

    const handleComponentTypeChange = async (
        val: string,
        option: unknown,
        item: SpecificTestStep
    ): Promise<void> => {
        const newComponentType = val;
        const rowId = item.isNew ? (item.tempId as number) : item.SpecificTestStepId;
        
        console.log("Component type changed to:", newComponentType);
        console.log("Row ID:", rowId);

        // Find the selected component type option to get its label
        const selectedTypeOption = state.ComponentTypeList.find(opt => opt.value === newComponentType);
        console.log("Selected type option:", selectedTypeOption);
        
        const componentTypeLabel = selectedTypeOption?.label || selectedTypeOption?.ComponentTypeName || "";
        console.log("Component type label:", componentTypeLabel);

        // Update ComponentType and reset Component
        if (item.isNew) {
            const updatedNewRows = state.newRows.map((row) => {
                if (row.tempId === item.tempId) {
                    return { ...row, ComponentType: newComponentType, Component: "" } as SpecificTestStep;
                }
                return row;
            });
            setState({ newRows: updatedNewRows });
        } else {
            const updatedSteps = state.SpecificTestSteps.map((t) => {
                if (t.SpecificTestStepId === item.SpecificTestStepId) {
                    return { ...t, ComponentType: newComponentType, Component: "" } as SpecificTestStep;
                }
                return t;
            });
            setState({ SpecificTestSteps: updatedSteps });
        }

        // Fetch appropriate component options based on type label
        if (newComponentType) {
            console.log("Setting loading state for row:", rowId);
            setState({
                loadingComponents: {
                    ...state.loadingComponents,
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
                    loadingComponents: {
                        ...state.loadingComponents,
                        [rowId]: false
                    }
                });
            }
        }
    };

    const handleComponentChange = (
        val: string,
        option: unknown,
        item: SpecificTestStep
    ): void => {
        const selectedComponent = val;
        
        console.log("Component changed to:", selectedComponent);
        console.log("Current component type:", item.ComponentType);

        // Update Component
        if (item.isNew) {
            const updatedNewRows = state.newRows.map((row) => {
                if (row.tempId === item.tempId) {
                    return { 
                        ...row, 
                        Component: selectedComponent
                    } as SpecificTestStep;
                }
                return row;
            });
            setState({ newRows: updatedNewRows });
        } else {
            const updatedSteps = state.SpecificTestSteps.map((t) => {
                if (t.SpecificTestStepId === item.SpecificTestStepId) {
                    return { 
                        ...t, 
                        Component: selectedComponent
                    } as SpecificTestStep;
                }
                return t;
            });
            setState({ SpecificTestSteps: updatedSteps });
        }
    };

    const handleStepNoChange = (
        val: string,
        option: unknown,
        item: SpecificTestStep
    ): void => {
        // Update StepNo
        if (item.isNew) {
            const updatedNewRows = state.newRows.map((row) => {
                if (row.tempId === item.tempId) {
                    return { 
                        ...row, 
                        StepNo: val
                    } as SpecificTestStep;
                }
                return row;
            });
            setState({ newRows: updatedNewRows });
        } else {
            const updatedSteps = state.SpecificTestSteps.map((t) => {
                if (t.SpecificTestStepId === item.SpecificTestStepId) {
                    return { 
                        ...t, 
                        StepNo: val
                    } as SpecificTestStep;
                }
                return t;
            });
            setState({ SpecificTestSteps: updatedSteps });
        }
    };

    const handleFlagToggle = (item: SpecificTestStep): void => {
        const newFlagValue = item.Flag === 1 ? 0 : 1;

        if (item.isNew) {
            const updatedNewRows = state.newRows.map((row) => {
                if (row.tempId === item.tempId) {
                    return { ...row, Flag: newFlagValue } as SpecificTestStep;
                }
                return row;
            });
            setState({ newRows: updatedNewRows });
        } else {
            const updatedSteps = state.SpecificTestSteps.map((t) => {
                if (t.SpecificTestStepId === item.SpecificTestStepId) {
                    return { ...t, Flag: newFlagValue } as SpecificTestStep;
                }
                return t;
            });
            setState({ SpecificTestSteps: updatedSteps });
        }
    };

    // Individual flag toggle for saved items
    const handleIndividualFlagToggle = async (item: SpecificTestStep): Promise<void> => {
        if (item.isNew) {
            // For new items, just update the state
            handleFlagToggle(item);
            return;
        }

        const rowId = item.SpecificTestStepId;
        const newFlagValue = item.Flag === 1 ? 0 : 1;

        // Set loading state for this specific toggle
        setTogglingFlags(prev => ({ ...prev, [rowId]: true }));

        try {
            const resp: any = await apiRequest("/updateSpecificTestResultFlag", {
                TestStepsId: item.TestStepsId,
                TestCaseId: item.TestCaseId,
                StepNo: item.StepNo,
                Flag: newFlagValue
            });

            console.log("API Response:", resp);

            // Check if the update was successful
            // The response has updateSpecificTestResultFlag.affectedRows or affectedRows
            const affectedRows = resp?.updateSpecificTestResultFlag?.affectedRows || resp?.affectedRows;
            
            if (affectedRows && affectedRows > 0) {
                // Update the local state
                const updatedSteps = state.SpecificTestSteps.map((t) => {
                    if (t.SpecificTestStepId === item.SpecificTestStepId) {
                        return { ...t, Flag: newFlagValue } as SpecificTestStep;
                    }
                    return t;
                });
                setState({ 
                    SpecificTestSteps: updatedSteps,
                    showToast: true,
                    ToastMessage: `Flag ${newFlagValue === 1 ? 'enabled' : 'disabled'} successfully!`
                });
                setTimeout(() => setState({ showToast: false }), 2000);
            } else {
                throw new Error('Failed to update flag - no rows affected');
            }
        } catch (error) {
            console.error("Error updating flag:", error);
            setState({ 
                showToast: true,
                ToastMessage: "Error updating flag. Please try again."
            });
            setTimeout(() => setState({ showToast: false }), 3000);
        } finally {
            setTogglingFlags(prev => ({ ...prev, [rowId]: false }));
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        name: string,
        item: SpecificTestStep
    ): void => {
        if (item.isNew) {
            const updatedNewRows = state.newRows.map((row) => {
                if (row.tempId === item.tempId) {
                    return { ...row, [name]: e.target.value } as SpecificTestStep;
                }
                return row;
            });
            setState({ newRows: updatedNewRows });
        } else {
            const updatedSteps = state.SpecificTestSteps.map((t) => {
                if (t.SpecificTestStepId === item.SpecificTestStepId) {
                    return { ...t, [name]: e.target.value } as SpecificTestStep;
                }
                return t;
            });
            setState({ SpecificTestSteps: updatedSteps });
        }
    };

    const handleDeleteItem = async (item: SpecificTestStep): Promise<void> => {
        if (item.SpecificTestStepId) {
            try {
                const resp: any = await apiRequest("/DeleteSpecificTestSteps", item as any);
                if (resp) {
                    setState({ 
                        showToast: true,
                        ToastMessage: "Deleted successfully!"
                    });
                    await getData();
                    setTimeout(() => setState({ showToast: false }), 3000);
                }
            } catch (error) {
                console.error("Error deleting step:", error);
                setState({ 
                    showToast: true,
                    ToastMessage: "Error deleting item. Please try again."
                });
                setTimeout(() => setState({ showToast: false }), 3000);
            }
        } else {
            const newRows = state.newRows.filter((row) => row.tempId !== item.tempId);
            const newEditing = { ...state.editingRows };
            if (item.tempId !== undefined) delete newEditing[item.tempId];
            const newErrors = { ...state.rowErrors };
            if (item.tempId !== undefined) delete newErrors[item.tempId];
            const newLoadingComponents = { ...state.loadingComponents };
            if (item.tempId !== undefined) delete newLoadingComponents[item.tempId];
            setState({
                newRows,
                editingRows: newEditing,
                rowErrors: newErrors,
                loadingComponents: newLoadingComponents,
            });
        }
    };

    const getComponentOptions = (componentType: string): Option[] => {
        // Find the component type label
        const selectedTypeOption = state.ComponentTypeList.find(opt => opt.value === componentType);
        const componentTypeLabel = selectedTypeOption?.label || selectedTypeOption?.ComponentTypeName || "";
        
        if (componentTypeLabel.toLowerCase().includes('execution')) {
            return state.executionComponentOptions;
        } else if (componentTypeLabel.toLowerCase().includes('validation')) {
            return state.validationComponentOptions;
        }
        return [];
    };

    const columns: { title: string; key: string; className?: string }[] = [
        { title: "Step No", key: "StepNo", className: "min-w-[120px]" },
        { title: "Component Type", key: "ComponentType", className: "min-w-[150px]" },
        { title: "Component", key: "Component", className: "min-w-[200px]" },
        { title: "Flag", key: "Flag", className: "min-w-[100px]" },
    ];

    const allRows: SpecificTestStep[] = [...state.newRows, ...state.SpecificTestSteps].sort(
        (a, b) => parseInt(String(a.StepNo)) - parseInt(String(b.StepNo))
    );

    const data: ReactNodeRecord[] = allRows.map((item) => {
        const rowId: string | number = item.isNew ? (item.tempId as number) : item.SpecificTestStepId;
        const isEditing = state.editingRows[rowId];
        const errors = state.rowErrors[rowId] || {};
        const isLoadingComponent = state.loadingComponents[rowId] || false;
        const isTogglingFlag = togglingFlags[rowId] || false;

        if (isEditing) {
            const componentOptions = getComponentOptions(item.ComponentType);

            return {
                StepNo: (
                    <div>
                        <Dropdown
                            size="small"
                            mode="single"
                            searchable={true}
                            options={state.stepNoOptions}
                            value={item.StepNo?.toString() || ''}
                            onChange={(val: string, option: unknown) => handleStepNoChange(val, option, item)}
                            className={errors.StepNo ? "border-red-500" : ""}
                            placeholder="Select Step No"
                        />
                        {errors.StepNo && (
                            <div className="flex items-center mt-1 ml-2">
                                <CircleAlert size={14} className="text-red-500" />
                                <p className="ml-2 text-red-500 text-sm">{errors.StepNo}</p>
                            </div>
                        )}
                    </div>
                ),
                ComponentType: (
                    <div>
                        <Dropdown
                            size="small"
                            mode="single"
                            options={state.ComponentTypeList}
                            value={item.ComponentType}
                            onChange={(val: string, option: unknown) => {
                                console.log("ComponentType dropdown onChange triggered");
                                void handleComponentTypeChange(val, option, item);
                            }}
                            className={errors.ComponentType ? "border-red-500" : ""}
                            placeholder="Select Component Type"
                        />
                        {errors.ComponentType && (
                            <div className="flex items-center mt-1 ml-2">
                                <CircleAlert size={14} className="text-red-500" />
                                <p className="ml-2 text-red-500 text-sm">{errors.ComponentType}</p>
                            </div>
                        )}
                    </div>
                ),
                Component: (
                    <div>
                        <Dropdown
                            size="small"
                            mode="single"
                            options={componentOptions}
                            value={item.Component}
                            onChange={(val: string, option: unknown) => {
                                console.log("Component dropdown onChange triggered");
                                handleComponentChange(val, option, item);
                            }}
                            className={errors.Component ? "border-red-500" : ""}
                            placeholder={
                                isLoadingComponent ? "Loading..." : 
                                !item.ComponentType ? "Select Component Type first" : 
                                componentOptions.length === 0 ? "No options available" :
                                "Select Component"
                            }
                            disabled={!item.ComponentType || isLoadingComponent}
                        />
                        {errors.Component && (
                            <div className="flex items-center mt-1 ml-2">
                                <CircleAlert size={14} className="text-red-500" />
                                <p className="ml-2 text-red-500 text-sm">{errors.Component}</p>
                            </div>
                        )}
                    </div>
                ),
                Flag: (
                    <div className="flex items-center">
                        <button
                            onClick={() => handleFlagToggle(item)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                item.Flag === 1 ? 'bg-green-600' : 'bg-gray-300'
                            }`}
                            type="button"
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    item.Flag === 1 ? 'translate-x-6' : 'translate-x-1'
                                }`}
                            />
                        </button>
                        <span className="ml-3 text-sm text-gray-700">
                            {item.Flag === 1 ? 'On' : 'Off'}
                        </span>
                    </div>
                ),
                actions: (
                    <div className="relative flex items-center">
                        <ConfirmPopup
                            message="Are you sure you want to delete this step?"
                            onConfirm={() => handleDeleteItem(item)}
                        >
                            <button className="pr-4 flex items-center">
                                <Trash2 className="text-[#1A1A1A] cursor-pointer" />
                            </button>
                        </ConfirmPopup>
                    </div>
                ),
            } as ReactNodeRecord;
        }

        return {
            StepNo: item.StepNo as React.ReactNode,
            /* ComponentType: item.ComponentTypeLabel || 
                state.ComponentTypeList.find((opt) => opt.value === item.ComponentType)?.label ||
                item.ComponentType, */
                /* Component: item.ComponentLabel || 
                getComponentOptions(item.ComponentType).find((opt) => opt.value === item.Component)?.label ||
                item.Component, */
            ComponentType: `${item?.ComponentTypeInfo?.ComponentTypeName} ( ${item.ComponentType})` || "-",
            Component: item?.component?.Component
                ? item?.component?.ExecutionComponentId
                ? `${item?.component.Component} (${item?.component?.ExecutionComponentId})`
                : item?.component.Component
                : item?.component?.ExecutionComponentId
                ? item?.component.ExecutionComponentId
                : "-",
            Flag: (
                <div className="flex items-center">
                    <button
                        onClick={() => void handleIndividualFlagToggle(item)}
                        disabled={isTogglingFlag}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            isTogglingFlag ? 'opacity-50 cursor-not-allowed' : ''
                        } ${item.Flag === 1 ? 'bg-green-600' : 'bg-gray-300'}`}
                        type="button"
                    >
                        {isTogglingFlag ? (
                            <div className="inline-block h-4 w-4 mx-auto">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            </div>
                        ) : (
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    item.Flag === 1 ? 'translate-x-6' : 'translate-x-1'
                                }`}
                            />
                        )}
                    </button>
                    <span className="ml-3 text-sm text-gray-700">
                        {item.Flag === 1 ? 'On' : 'Off'}
                    </span>
                </div>
            ),
            actions: (
                <div className="relative flex items-center">
                    <button onClick={() => void handleEdit(item)}
                        className="ml-2 text-white px-3 py-1 rounded text-sm"
                    >
                        <SquarePen className="text-[#1A1A1A] cursor-pointer" />
                    </button>
                    <ConfirmPopup
                        message="Are you sure you want to delete this step?"
                        onConfirm={() => handleDeleteItem(item)}
                    >
                        <button className="ml-2 pr-4 flex items-center">
                            <Trash2 className="text-[#1A1A1A] cursor-pointer" />
                        </button>
                    </ConfirmPopup>
                </div>
            ),
        } as ReactNodeRecord;
    });

    const hasEdits = Object.keys(state.editingRows).length > 0 || state.newRows.length > 0;

    if (state.IsLoading)
        return (
            <div className="h-96 py-20">
                <SpinnerV2 {...{ text: "Fetching data..." }} />
            </div>
        );

    return (
        <div className="">
            <Toast
                message={state.ToastMessage}
                show={state.showToast}
                onClose={() => setState({ showToast: false })}
            />

            <div className="flex justify-end items-center pb-4">
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