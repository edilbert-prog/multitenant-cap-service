import React, { useEffect, useReducer } from "react";
import CustomTable from "../../../utils/CustomTable";
import { CircleAlert, Plus, Save, Trash2, X, Edit2 } from "lucide-react";
import { apiRequest } from "../../../utils/helpers/ApiHelper";
import SpinnerV2 from "../../../utils/SpinnerV2";
import Toast from "../../../utils/Toast";
import ConfirmPopup from "../../../utils/ConfirmPopup";
import Dropdown from "../../../utils/DropdownV2";
import { FaListCheck } from "react-icons/fa6";

type ReactNodeRecord = Record<string, React.ReactNode>;

interface Option {
    value: string;
    label: string;
    [key: string]: any;
}

interface TestCaseKey {
    CKTCMID: string;
    TestCaseId: string;
    TestStepsId: string;
    StepNo: string | number;
    ComponentType: string;
    ComponentTypeLabel?: string;
    ComponentId: string;
    ComponentIdLabel?: string;
    KeyType: string;
    KeyName: string;
    SourceComponent: string;
    SourceComponentLabel?: string;
    SourceComponentType: string;
    SourceComponentTypeLabel?: string;
    SourceComponentKeyType: string;
    SourceComponentKeyName: string;
    isNew?: boolean;
    tempId?: number;
}

interface State {
    testCaseKeys: TestCaseKey[];
    allComponentKeys: any[];
    componentTypeOptions: Option[];
    executionComponentOptions: Option[];
    validationComponentOptions: Option[];
    sourceComponentTypeOptions: Option[];
    stepNoOptions: Option[];
    componentIdOptions: Option[];
    sourceComponentIdOptions: Option[];
    IsLoading: boolean;
    showToast: boolean;
    ToastMessage: string;
    SavingLoader: boolean;
    editingRows: Record<string | number, boolean>;
    newRows: TestCaseKey[];
    rowErrors: Record<string | number, Record<string, string>>;
    loadingComponentTypes: boolean;
    loadingComponents: Record<string | number, boolean>;
    deletingKeyId: string | null;
}

type Action = Partial<State>;

interface TestCaseKeysTabProps {
    testCase: any;
    testStepsHeaderList: any[];
    assignedTestCaseSteps: any[];
}

const initialState: State = {
    testCaseKeys: [],
    allComponentKeys: [],
    componentTypeOptions: [],
    executionComponentOptions: [],
    validationComponentOptions: [],
    sourceComponentTypeOptions: [],
    stepNoOptions: [],
    componentIdOptions: [],
    sourceComponentIdOptions: [],
    IsLoading: true,
    showToast: false,
    ToastMessage: "",
    SavingLoader: false,
    editingRows: {},
    newRows: [],
    rowErrors: {},
    loadingComponentTypes: false,
    loadingComponents: {},
    deletingKeyId: null,
};

function reducer(state: State, newState: Action): State {
    return { ...state, ...newState };
}

const TestCaseKeysTab: React.FC<TestCaseKeysTabProps> = ({
    testCase,
    testStepsHeaderList,
    assignedTestCaseSteps,
}) => {
    const [state, setState] = useReducer<typeof reducer, State>(reducer, initialState);

    useEffect(() => {
        const init = async () => {
            setState({ IsLoading: true });
            await Promise.all([
                loadAllComponentKeys(),
                loadTestCaseKeys()
            ]);
            setState({ IsLoading: false });
        };
        init();
    }, [testCase.TestCaseId]);

    useEffect(() => {
        if (assignedTestCaseSteps && assignedTestCaseSteps.length > 0) {
            const steps = assignedTestCaseSteps
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
            
            const uniqueSteps = Array.from(new Map(steps.map((item: any) => [item.value, item])).values());
            setState({ stepNoOptions: uniqueSteps as Option[] });
        }
    }, [assignedTestCaseSteps]);

    const loadTestCaseKeys = async (): Promise<void> => {
        try {
            const response: any = await apiRequest('/GetComponentKeyTestCaseMappingsByTestCaseStep', {
                TestCaseId: testCase.TestCaseId
            });
            
            if (response.ResponseData) {
                setState({ testCaseKeys: response.ResponseData as TestCaseKey[] });
            } else {
                setState({ testCaseKeys: [] });
            }
        } catch (error) {
            console.error('Error loading test case keys:', error);
            setState({ testCaseKeys: [] });
        }
    };

    const loadAllComponentKeys = async (): Promise<void> => {
        setState({ loadingComponentTypes: true });
        try {
            const response: any = await apiRequest('/GetComponentKeys', {});
            
            if (response.ResponseData && response.ResponseData.length > 0) {
                setState({ allComponentKeys: response.ResponseData });
                
                const uniqueTypes = Array.from(new Set(
                    response.ResponseData.map((item: any) => item.ComponentType)
                )).map((type: any) => {
                    const item = response.ResponseData.find((d: any) => d.ComponentType === type);
                    return {
                        value: type,
                        label: item?.ComponentTypeLabel || type
                    };
                }).filter((item: any) => item.value);
                
                setState({ 
                    componentTypeOptions: uniqueTypes as Option[],
                    sourceComponentTypeOptions: uniqueTypes as Option[]
                });
            } else {
                setState({ 
                    allComponentKeys: [],
                    componentTypeOptions: [],
                    sourceComponentTypeOptions: []
                });
            }
        } catch (error) {
            console.error('Error loading component keys:', error);
            setState({ 
                allComponentKeys: [],
                componentTypeOptions: [],
                sourceComponentTypeOptions: []
            });
        } finally {
            setState({ loadingComponentTypes: false });
        }
    };

    const filterComponentIdsByType = (componentType: string, isSource = false, currentKeys: any[]): Option[] => {
        if (!componentType || currentKeys.length === 0) {
            return [];
        }

        const filtered = currentKeys
            .filter((item: any) => item.ComponentType === componentType)
            .map((item: any) => ({
                value: item.ComponentId,
                label: item.ComponentIdLabel || item.ComponentId,
                keyName: item.KeyName,
                keyType: item.KeyType
            }));
        
        const uniqueFiltered = Array.from(
            new Map(filtered.map((item: any) => [item.value, item])).values()
        );

        return uniqueFiltered as Option[];
    };

    const handleAddNew = (): void => {
        const newRow: TestCaseKey = {
            CKTCMID: '',
            TestCaseId: testCase.TestCaseId || '',
            TestStepsId: '',
            StepNo: '',
            ComponentType: '',
            ComponentId: '',
            KeyType: 'Input',
            KeyName: '',
            SourceComponent: '',
            SourceComponentType: '',
            SourceComponentKeyType: 'Input',
            SourceComponentKeyName: '',
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

    const handleEdit = (item: TestCaseKey): void => {
        const rowId = item.isNew ? (item.tempId as number) : item.CKTCMID;
        
        // Load component options based on existing ComponentType
        if (item.ComponentType && state.allComponentKeys.length > 0) {
            const componentIds = filterComponentIdsByType(item.ComponentType, false, state.allComponentKeys);
            setState({ componentIdOptions: componentIds });
        }
        
        // Load source component options based on existing SourceComponentType
        if (item.SourceComponentType && state.allComponentKeys.length > 0) {
            const sourceComponentIds = filterComponentIdsByType(item.SourceComponentType, true, state.allComponentKeys);
            setState({ sourceComponentIdOptions: sourceComponentIds });
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
            componentIdOptions: [],
            sourceComponentIdOptions: [],
        });
    };

    const validateAllRows = (): boolean => {
        const requiredFields: Array<keyof Pick<TestCaseKey, "TestStepsId" | "StepNo" | "ComponentType" | "ComponentId" | "KeyName">> = [
            "TestStepsId",
            "StepNo",
            "ComponentType",
            "ComponentId",
            "KeyName",
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
                    value === ""
                ) {
                    newRowErrors[rowId][field] = "This field is required";
                    allValid = false;
                }
            });
        });

        Object.keys(state.editingRows).forEach((idKey) => {
            const numericId = Number.isNaN(Number(idKey)) ? idKey : Number(idKey);
            if (typeof idKey === "string") {
                const row = state.testCaseKeys.find((t) => t.CKTCMID === idKey);
                if (row) {
                    newRowErrors[numericId] = {};
                    requiredFields.forEach((field) => {
                        const value = row[field];
                        if (
                            value === undefined ||
                            value === null ||
                            value === ""
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
                .map((id) => state.testCaseKeys.find((row) => row.CKTCMID === id))
                .filter(Boolean) as TestCaseKey[];

            const rowsToSend: TestCaseKey[] = [...editedRows, ...state.newRows];

            if (rowsToSend.length > 0) {
                for (const row of rowsToSend) {
                    row.TestCaseId = testCase.TestCaseId;
                    await apiRequest('/AddUpdateComponentKeyTestCaseMapping', row as any);
                }
            }

            setState({
                SavingLoader: false,
                showToast: true,
                ToastMessage: "Saved successfully!",
                editingRows: {},
                newRows: [],
                rowErrors: {},
                componentIdOptions: [],
                sourceComponentIdOptions: [],
            });

            await loadTestCaseKeys();
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

    const handleComponentTypeChange = (
        val: string,
        option: unknown,
        item: TestCaseKey
    ): void => {
        const newComponentType = val;
        const rowId = item.isNew ? (item.tempId as number) : item.CKTCMID;

        // Update ComponentType and reset ComponentId
        if (item.isNew) {
            const updatedNewRows = state.newRows.map((row) => {
                if (row.tempId === item.tempId) {
                    return { ...row, ComponentType: newComponentType, ComponentId: '', KeyName: '' } as TestCaseKey;
                }
                return row;
            });
            setState({ newRows: updatedNewRows });
        } else {
            const updatedKeys = state.testCaseKeys.map((t) => {
                if (t.CKTCMID === item.CKTCMID) {
                    return { ...t, ComponentType: newComponentType, ComponentId: '', KeyName: '' } as TestCaseKey;
                }
                return t;
            });
            setState({ testCaseKeys: updatedKeys });
        }

        // Filter component IDs based on new type
        if (newComponentType && state.allComponentKeys.length > 0) {
            const componentIds = filterComponentIdsByType(newComponentType, false, state.allComponentKeys);
            setState({ componentIdOptions: componentIds });
        } else {
            setState({ componentIdOptions: [] });
        }
    };

    const handleComponentIdChange = (
        val: string,
        option: any,
        item: TestCaseKey
    ): void => {
        const selectedComponent = val;
        const selectedOption = state.componentIdOptions.find(opt => opt.value === selectedComponent);

        // Update ComponentId and auto-populate KeyName
        if (item.isNew) {
            const updatedNewRows = state.newRows.map((row) => {
                if (row.tempId === item.tempId) {
                    return { 
                        ...row, 
                        ComponentId: selectedComponent,
                        KeyName: selectedOption?.keyName || row.KeyName
                    } as TestCaseKey;
                }
                return row;
            });
            setState({ newRows: updatedNewRows });
        } else {
            const updatedKeys = state.testCaseKeys.map((t) => {
                if (t.CKTCMID === item.CKTCMID) {
                    return { 
                        ...t, 
                        ComponentId: selectedComponent,
                        KeyName: selectedOption?.keyName || t.KeyName
                    } as TestCaseKey;
                }
                return t;
            });
            setState({ testCaseKeys: updatedKeys });
        }
    };

    const handleSourceComponentTypeChange = (
        val: string,
        option: unknown,
        item: TestCaseKey
    ): void => {
        const newSourceComponentType = val;

        // Update SourceComponentType and reset SourceComponent
        if (item.isNew) {
            const updatedNewRows = state.newRows.map((row) => {
                if (row.tempId === item.tempId) {
                    return { 
                        ...row, 
                        SourceComponentType: newSourceComponentType, 
                        SourceComponent: '', 
                        SourceComponentKeyName: '' 
                    } as TestCaseKey;
                }
                return row;
            });
            setState({ newRows: updatedNewRows });
        } else {
            const updatedKeys = state.testCaseKeys.map((t) => {
                if (t.CKTCMID === item.CKTCMID) {
                    return { 
                        ...t, 
                        SourceComponentType: newSourceComponentType, 
                        SourceComponent: '', 
                        SourceComponentKeyName: '' 
                    } as TestCaseKey;
                }
                return t;
            });
            setState({ testCaseKeys: updatedKeys });
        }

        // Filter source component IDs based on new type
        if (newSourceComponentType && state.allComponentKeys.length > 0) {
            const sourceComponentIds = filterComponentIdsByType(newSourceComponentType, true, state.allComponentKeys);
            setState({ sourceComponentIdOptions: sourceComponentIds });
        } else {
            setState({ sourceComponentIdOptions: [] });
        }
    };

    const handleSourceComponentChange = (
        val: string,
        option: any,
        item: TestCaseKey
    ): void => {
        const selectedSourceComponent = val;
        const selectedOption = state.sourceComponentIdOptions.find(opt => opt.value === selectedSourceComponent);

        // Update SourceComponent and auto-populate SourceComponentKeyName
        if (item.isNew) {
            const updatedNewRows = state.newRows.map((row) => {
                if (row.tempId === item.tempId) {
                    return { 
                        ...row, 
                        SourceComponent: selectedSourceComponent,
                        SourceComponentKeyName: selectedOption?.keyName || row.SourceComponentKeyName
                    } as TestCaseKey;
                }
                return row;
            });
            setState({ newRows: updatedNewRows });
        } else {
            const updatedKeys = state.testCaseKeys.map((t) => {
                if (t.CKTCMID === item.CKTCMID) {
                    return { 
                        ...t, 
                        SourceComponent: selectedSourceComponent,
                        SourceComponentKeyName: selectedOption?.keyName || t.SourceComponentKeyName
                    } as TestCaseKey;
                }
                return t;
            });
            setState({ testCaseKeys: updatedKeys });
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        name: string,
        item: TestCaseKey
    ): void => {
        if (item.isNew) {
            const updatedNewRows = state.newRows.map((row) => {
                if (row.tempId === item.tempId) {
                    return { ...row, [name]: e.target.value } as TestCaseKey;
                }
                return row;
            });
            setState({ newRows: updatedNewRows });
        } else {
            const updatedKeys = state.testCaseKeys.map((t) => {
                if (t.CKTCMID === item.CKTCMID) {
                    return { ...t, [name]: e.target.value } as TestCaseKey;
                }
                return t;
            });
            setState({ testCaseKeys: updatedKeys });
        }
    };

    const handleDropdownChange = (
        val: string,
        fieldName: keyof TestCaseKey,
        item: TestCaseKey
    ): void => {
        if (item.isNew) {
            const updatedNewRows = state.newRows.map((row) => {
                if (row.tempId === item.tempId) {
                    return { ...row, [fieldName]: val } as TestCaseKey;
                }
                return row;
            });
            setState({ newRows: updatedNewRows });
        } else {
            const updatedKeys = state.testCaseKeys.map((t) => {
                if (t.CKTCMID === item.CKTCMID) {
                    return { ...t, [fieldName]: val } as TestCaseKey;
                }
                return t;
            });
            setState({ testCaseKeys: updatedKeys });
        }
    };

    const handleDeleteItem = async (item: TestCaseKey): Promise<void> => {
        if (item.CKTCMID) {
            setState({ deletingKeyId: item.CKTCMID });
            try {
                const response: any = await apiRequest('/DeleteComponentKeyTestCaseMapping', {
                    CKTCMID: item.CKTCMID
                });
                
                if (response.deleteComponentKeyTestCaseMapping) {
                    setState({ 
                        showToast: true,
                        ToastMessage: "Deleted successfully!"
                    });
                    await loadTestCaseKeys();
                    setTimeout(() => setState({ showToast: false }), 3000);
                } else {
                    setState({ 
                        showToast: true,
                        ToastMessage: "Failed to delete key mapping"
                    });
                    setTimeout(() => setState({ showToast: false }), 3000);
                }
            } catch (error) {
                console.error('Error deleting key:', error);
                setState({ 
                    showToast: true,
                    ToastMessage: "Error deleting key mapping"
                });
                setTimeout(() => setState({ showToast: false }), 3000);
            } finally {
                setState({ deletingKeyId: null });
            }
        } else {
            const newRows = state.newRows.filter((row) => row.tempId !== item.tempId);
            const newEditing = { ...state.editingRows };
            if (item.tempId !== undefined) delete newEditing[item.tempId];
            const newErrors = { ...state.rowErrors };
            if (item.tempId !== undefined) delete newErrors[item.tempId];
            setState({
                newRows,
                editingRows: newEditing,
                rowErrors: newErrors,
            });
        }
    };
/* 
    const columns: { title: string; key: string; className?: string }[] = [
        { title: "Step No", key: "StepNo", className: "min-w-[100px]" },
        { title: "Test Steps Header", key: "TestStepsId", className: "min-w-[150px]" },
        { title: "Component Type", key: "ComponentType", className: "min-w-[150px]" },
        { title: "Component ID", key: "ComponentId", className: "min-w-[150px]" },
        { title: "Key Type", key: "KeyType", className: "min-w-[120px]" },
        { title: "Key Name", key: "KeyName", className: "min-w-[150px]" },
        { title: "Source Type", key: "SourceComponentType", className: "min-w-[150px]" },
        { title: "Source Component", key: "SourceComponent", className: "min-w-[150px]" },
        { title: "Source Key Type", key: "SourceComponentKeyType", className: "min-w-[120px]" },
        { title: "Source Key Name", key: "SourceComponentKeyName", className: "min-w-[150px]" },
    ];
 */
    const allRows: TestCaseKey[] = [...state.newRows, ...state.testCaseKeys];

const data: ReactNodeRecord[] = allRows.map((item) => {
    const rowId: string | number = item.isNew ? (item.tempId as number) : item.CKTCMID;
    const isEditing = state.editingRows[rowId];
    const errors = state.rowErrors[rowId] || {};

    // Calculate component options for THIS specific row
    const currentComponentIds = item.ComponentType 
        ? filterComponentIdsByType(item.ComponentType, false, state.allComponentKeys)
        : state.componentIdOptions;
    
    const currentSourceComponentIds = item.SourceComponentType 
        ? filterComponentIdsByType(item.SourceComponentType, true, state.allComponentKeys)
        : state.sourceComponentIdOptions;

    if (isEditing) {
        return {
            MainInfo: (
                <div className="space-y-4 w-full">
                    {/* Basic Information Section */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                            <span className="w-1 h-4 bg-blue-600 mr-2 rounded"></span>
                            Basic Information
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                            {/* Step No */}
                            <div className="relative z-[50]">
                                <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                                    Step No <span className="text-red-500">*</span>
                                </label>
                                <Dropdown
                                    size="small"
                                    mode="single"
                                    searchable={true}
                                    options={state.stepNoOptions}
                                    value={item.StepNo?.toString() || ''}
                                    onChange={(val: string) => handleDropdownChange(val, 'StepNo', item)}
                                    className={errors.StepNo ? "border-red-500" : ""}
                                    placeholder="Select Step No"
                                />
                                {errors.StepNo && (
                                    <div className="flex items-center mt-1">
                                        <CircleAlert size={12} className="text-red-500" />
                                        <p className="ml-1 text-red-500 text-xs">{errors.StepNo}</p>
                                    </div>
                                )}
                            </div>

                            {/* Test Steps Header */}
                            <div className="col-span-2 relative z-[49]">
                                <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                                    Test Steps Header <span className="text-red-500">*</span>
                                </label>
                                <Dropdown
                                    size="small"
                                    mode="single"
                                    searchable={true}
                                    options={testStepsHeaderList}
                                    value={item.TestStepsId}
                                    onChange={(val: string) => handleDropdownChange(val, 'TestStepsId', item)}
                                    className={errors.TestStepsId ? "border-red-500" : ""}
                                    placeholder="Select Test Steps Header"
                                />
                                {errors.TestStepsId && (
                                    <div className="flex items-center mt-1">
                                        <CircleAlert size={12} className="text-red-500" />
                                        <p className="ml-1 text-red-500 text-xs">{errors.TestStepsId}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Component Details Section - All in 4 columns */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                            <span className="w-1 h-4 bg-blue-600 mr-2 rounded"></span>
                            Component Details
                        </h3>
                        <div className="grid grid-cols-4 gap-4">
                            {/* Component Type */}
                            <div className="relative z-[48]">
                                <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                                    Component Type <span className="text-red-500">*</span>
                                </label>
                                <Dropdown
                                    size="small"
                                    mode="single"
                                    searchable={true}
                                    options={state.componentTypeOptions}
                                    value={item.ComponentType}
                                    onChange={(val: string, option: unknown) => handleComponentTypeChange(val, option, item)}
                                    className={errors.ComponentType ? "border-red-500" : ""}
                                    placeholder="Select Type"
                                />
                                {errors.ComponentType && (
                                    <div className="flex items-center mt-1">
                                        <CircleAlert size={12} className="text-red-500" />
                                        <p className="ml-1 text-red-500 text-xs">{errors.ComponentType}</p>
                                    </div>
                                )}
                            </div>

                            {/* Component ID */}
                            <div className="relative z-[47]">
                                <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                                    Component ID <span className="text-red-500">*</span>
                                </label>
                                <Dropdown
                                    size="small"
                                    mode="single"
                                    searchable={true}
                                    options={currentComponentIds}
                                    value={item.ComponentId}
                                    onChange={(val: string, option: unknown) => handleComponentIdChange(val, option, item)}
                                    className={errors.ComponentId ? "border-red-500" : ""}
                                    placeholder={!item.ComponentType ? "Select Type first" : "Select Component"}
                                    disabled={!item.ComponentType}
                                />
                                {errors.ComponentId && (
                                    <div className="flex items-center mt-1">
                                        <CircleAlert size={12} className="text-red-500" />
                                        <p className="ml-1 text-red-500 text-xs">{errors.ComponentId}</p>
                                    </div>
                                )}
                            </div>

                            {/* Key Type */}
                            <div className="relative z-[46]">
                                <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                                    Key Type <span className="text-red-500">*</span>
                                </label>
                                <Dropdown
                                    size="small"
                                    mode="single"
                                    searchable={false}
                                    options={[
                                        { label: 'Input', value: 'Input' },
                                        { label: 'Output', value: 'Output' }
                                    ]}
                                    value={item.KeyType}
                                    onChange={(val: string) => handleDropdownChange(val, 'KeyType', item)}
                                    placeholder="Select Key Type"
                                />
                            </div>

                            {/* Key Name */}
                            <div className="relative z-[45]">
                                <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                                    Key Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={item.KeyName}
                                    onChange={(e) => handleChange(e, 'KeyName', item)}
                                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        errors.KeyName ? "border-red-500" : "border-gray-300"
                                    }`}
                                    placeholder="Enter Key Name"
                                />
                                {errors.KeyName && (
                                    <div className="flex items-center mt-1">
                                        <CircleAlert size={12} className="text-red-500" />
                                        <p className="ml-1 text-red-500 text-xs">{errors.KeyName}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Source Component Section - All in 4 columns, Open by default */}
                    <details open className="bg-green-50 rounded-lg border border-green-200">
                        <summary className="p-4 cursor-pointer hover:bg-green-100 transition-colors flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-700 flex items-center">
                                <span className="w-1 h-4 bg-green-600 mr-2 rounded"></span>
                                Source Component (Optional)
                            </h3>
                            <svg className="w-5 h-5 text-gray-600 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </summary>
                        <div className="p-4 pt-0">
                            <div className="grid grid-cols-4 gap-4 mt-3">
                                {/* Source Component Type */}
                                <div className="relative z-[44]">
                                    <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                                        Source Component Type
                                    </label>
                                    <Dropdown
                                        size="small"
                                        mode="single"
                                        searchable={true}
                                        options={state.sourceComponentTypeOptions}
                                        value={item.SourceComponentType}
                                        onChange={(val: string, option: unknown) => handleSourceComponentTypeChange(val, option, item)}
                                        placeholder="Select Source Type"
                                    />
                                </div>

                                {/* Source Component */}
                                <div className="relative z-[43]">
                                    <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                                        Source Component
                                    </label>
                                    <Dropdown
                                        size="small"
                                        mode="single"
                                        searchable={true}
                                        options={currentSourceComponentIds}
                                        value={item.SourceComponent}
                                        onChange={(val: string, option: unknown) => handleSourceComponentChange(val, option, item)}
                                        placeholder={!item.SourceComponentType ? "Select Type first" : "Select Source"}
                                        disabled={!item.SourceComponentType}
                                    />
                                </div>

                                {/* Source Key Type */}
                                <div className="relative z-[42]">
                                    <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                                        Source Key Type
                                    </label>
                                    <Dropdown
                                        size="small"
                                        mode="single"
                                        searchable={false}
                                        options={[
                                            { label: 'Input', value: 'Input' },
                                            { label: 'Output', value: 'Output' }
                                        ]}
                                        value={item.SourceComponentKeyType}
                                        onChange={(val: string) => handleDropdownChange(val, 'SourceComponentKeyType', item)}
                                        placeholder="Select Type"
                                    />
                                </div>

                                {/* Source Key Name */}
                                <div className="relative z-[41]">
                                    <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                                        Source Key Name
                                    </label>
                                    <input
                                        type="text"
                                        value={item.SourceComponentKeyName}
                                        onChange={(e) => handleChange(e, 'SourceComponentKeyName', item)}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter Source Key Name"
                                    />
                                </div>
                            </div>
                        </div>
                    </details>

                    {/* Actions at bottom */}
                    <div className="flex justify-end pt-2">
                        <ConfirmPopup
                            message="Are you sure you want to delete this key mapping?"
                            onConfirm={() => handleDeleteItem(item)}
                        >
                            <button className="p-2 hover:bg-red-50 rounded transition-colors flex items-center gap-2 text-red-600" title="Delete">
                                <Trash2 size={18} />
                                <span className="text-sm font-medium">Delete</span>
                            </button>
                        </ConfirmPopup>
                    </div>
                </div>
            ),
        } as ReactNodeRecord;
    }

    // View mode - Card view with sections (4 columns for better space usage)
    return {
        MainInfo: (
            <div className="space-y-3 py-2 w-full">
                {/* Basic Information Section */}
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <h4 className="text-xs font-semibold text-gray-600 mb-2 flex items-center">
                        <span className="w-1 h-3 bg-blue-600 mr-2 rounded"></span>
                        Basic Information
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Step No</p>
                            <p className="text-sm font-medium text-gray-800">{item.StepNo}</p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-xs text-gray-500 mb-1">Test Steps Header</p>
                            <p className="text-sm font-medium text-gray-800">
                                {testStepsHeaderList.find(h => h.value === item.TestStepsId)?.label || item.TestStepsId}
                            </p>
                        </div>
                    </div>
                </div>
                
                {/* Component Details Section - 4 columns */}
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <h4 className="text-xs font-semibold text-gray-600 mb-2 flex items-center">
                        <span className="w-1 h-3 bg-blue-600 mr-2 rounded"></span>
                        Component Details
                    </h4>
                    <div className="grid grid-cols-4 gap-4">
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Component Type</p>
                            <p className="text-sm font-medium text-gray-800">{item.ComponentTypeLabel || item.ComponentType || '-'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Component ID</p>
                            <p className="text-sm font-medium text-gray-800">{item.ComponentIdLabel || item.ComponentId || '-'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Key Type</p>
                            <p className="text-sm font-medium text-gray-800">{item.KeyType || '-'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Key Name</p>
                            <p className="text-sm font-medium text-gray-800">{item.KeyName || '-'}</p>
                        </div>
                    </div>
                </div>
                
                {/* Source Component Section - 4 columns, Open by default */}
                <details open className="bg-green-50 rounded-lg border border-green-200">
                    <summary className="p-3 cursor-pointer hover:bg-green-100 transition-colors flex items-center justify-between">
                        <h4 className="text-xs font-semibold text-gray-600 flex items-center">
                            <span className="w-1 h-3 bg-green-600 mr-2 rounded"></span>
                            Source Component Details
                        </h4>
                        <svg className="w-4 h-4 text-gray-600 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </summary>
                    <div className="p-3 pt-0">
                        <div className="grid grid-cols-4 gap-4 mt-2">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Source Type</p>
                                <p className="text-sm text-gray-700">{item.SourceComponentTypeLabel || item.SourceComponentType || '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Source Component</p>
                                <p className="text-sm text-gray-700">{item.SourceComponentLabel || item.SourceComponent || '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Source Key Type</p>
                                <p className="text-sm text-gray-700">{item.SourceComponentKeyType || '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Source Key Name</p>
                                <p className="text-sm text-gray-700">{item.SourceComponentKeyName || '-'}</p>
                            </div>
                        </div>
                    </div>
                </details>

                {/* Actions at bottom */}
                <div className="flex justify-end gap-2 pt-2">
                    <button 
                        onClick={() => handleEdit(item)}
                        className="p-2 hover:bg-blue-50 rounded transition-colors flex items-center gap-2 text-blue-600"
                        title="Edit"
                    >
                        <Edit2 size={18} />
                        <span className="text-sm font-medium">Edit</span>
                    </button>
                    <ConfirmPopup
                        message="Are you sure you want to delete this key mapping?"
                        onConfirm={() => handleDeleteItem(item)}
                    >
                        <button 
                            className="p-2 hover:bg-red-50 rounded transition-colors flex items-center gap-2 text-red-600"
                            disabled={state.deletingKeyId === item.CKTCMID}
                            title="Delete"
                        >
                            <Trash2 size={18} />
                            <span className="text-sm font-medium">Delete</span>
                        </button>
                    </ConfirmPopup>
                </div>
            </div>
        ),
    } as ReactNodeRecord;
});

// Update columns to single column for full width
const columns: { title: string; key: string; className?: string }[] = [
    { title: "Key Mapping Details", key: "MainInfo", className: "w-full" },
];

    const hasEdits = Object.keys(state.editingRows).length > 0 || state.newRows.length > 0;

    if (state.IsLoading)
        return (
            <div className="h-96 py-20">
                <SpinnerV2 {...{ text: "Fetching data..." }} />
            </div>
        );

    return (
        <div className="pt-4">
            <Toast
                message={state.ToastMessage}
                show={state.showToast}
                onClose={() => setState({ showToast: false })}
            />

            <div className="flex justify-between items-center pb-4">
                <p className="font-semibold text-lg">Component Key Test Case Mappings</p>
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

            {state.testCaseKeys.length > 0 || state.newRows.length > 0 ? (
                <CustomTable columns={columns} data={data} responsive={true} />
            ) : (
                <div className="text-center py-12 text-gray-500">
                    <FaListCheck size={48} className="mx-auto mb-3 text-gray-400" />
                    <p className="text-lg font-medium">No Key Mappings Found</p>
                    <p className="text-sm mt-1">
                        Click "Add" to create your first component key mapping
                    </p>
                </div>
            )}
        </div>
    );
};

export default TestCaseKeysTab;