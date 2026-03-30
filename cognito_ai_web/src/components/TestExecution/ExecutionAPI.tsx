import React, { useEffect, useReducer, useRef } from "react";
import CustomTable from "../../utils/CustomTable.jsx";
import { CircleAlert, Plus, Save, Trash2, X, SquarePen } from "lucide-react";
import { apiRequest } from "../../utils/helpers/ApiHelper.js";
import SpinnerV2 from "../../utils/SpinnerV2.jsx";
import ErrorScreen from "../../utils/ErrorScreen.jsx";
import Pagination from "../../utils/Pagination.jsx";
import Toast from "../../utils/Toast.jsx";
import ConfirmPopup from "../../utils/ConfirmPopup.jsx";
import useDebounce from "../../utils/helpers/useDebounce.js";
import SearchBar from "../../utils/SearchBar.jsx";
import Dropdown from "../../utils/Dropdown.jsx";

type ReactNodeRecord = Record<string, React.ReactNode>;

interface Option {
    value: string;
    label: string;
}

type RowErrorMap = Record<string | number, Record<string, string>>;

interface ExecutionComponent {
    ExecutionComponentId: string;
    Module: string;
    SubModule: string;
    ObjectId: string;
    Component: string;
    ComponentType: string;
    ObjectType: string;
    ObjectAPI: string;
    Status: number;
    isNew?: boolean;
    tempId?: number;
}

interface State {
    Error: string;
    ExecutionComponents: ExecutionComponent[];
    ComponentTypeList: Option[];
    ObjectTypeList: Option[];
    SAPModuleList: Option[];
    SAPSubModuleList: Option[];
    SAPObjectsList: Option[];
    ObjectAPIList: Option[];
    SearchQuery: string;
    CurrentPage: number;
    TotalRecords: number;
    IsLoading: boolean;
    showToast: boolean;
    SavingLoader: boolean;
    editingRows: Record<string | number, boolean>;
    newRows: ExecutionComponent[];
    rowErrors: RowErrorMap;
}

type Action = Partial<State>;

type Props = {
    CurrentSprint?: Record<string, unknown>;
    CurrAddEditDetails?: Record<string, unknown>;
    children?: React.ReactNode;
};

const initialState: State = {
    Error: "",
    ExecutionComponents: [],
    ComponentTypeList: [],
    ObjectTypeList: [],
    SAPModuleList: [],
    SAPSubModuleList: [],
    SAPObjectsList: [],
    ObjectAPIList: [],
    SearchQuery: "",
    CurrentPage: 1,
    TotalRecords: 0,
    IsLoading: true,
    showToast: false,
    SavingLoader: false,
    editingRows: {},
    newRows: [],
    rowErrors: {},
};

function reducer(state: State, newState: Action): State {
    return { ...state, ...newState };
}

export default function ExecutionAPI(props: Props) {
    const [state, setState] = useReducer<typeof reducer, State>(reducer, initialState);
    const debouncedSearchQuery = useDebounce(state.SearchQuery, 300) as string;
    const didFetchData = useRef<boolean>(false);

    useEffect(() => {
        const init = async () => {
            setState({ IsLoading: true });
            await Promise.all([
                getComponentTypes(),

                // getObjectTypes(),
                // GetSAPModulesMaster(),
                // getObjectAPIListByObjectId(),
                getData(debouncedSearchQuery)
            ]);
            setState({ IsLoading: false });
        };

        init();
    }, [debouncedSearchQuery]);

    const getComponentTypes = async (): Promise<void> => {
        try {
            const resp: any = await apiRequest("/GetComponentTypesMaster", {});
            if (resp.ResponseData && resp.ResponseData.length > 0) {
                setState({ ComponentTypeList: resp.ResponseData as Option[] });
            }
        } catch (err) {
            console.error("Error fetching component types:", err);
        }
    };

    const getObjectTypes = async (): Promise<void> => {
        try {
            const resp: any = await apiRequest("/GetObjectsTypes", {});
            if (resp.ResponseData && resp.ResponseData.length > 0) {
                // Ensure proper option structure
                const objectTypeOptions: Option[] = resp.ResponseData.map((item: any) => ({
                    value: item.value || item.ObjectTypeId || "",
                    label: item.label || item.ObjectType || ""
                }));
                setState({ ObjectTypeList: objectTypeOptions });
            } else {
                setState({ ObjectTypeList: [] });
            }
        } catch (err) {
            console.error("Error fetching object types:", err);
            setState({ ObjectTypeList: [] });
        }
    };

    const GetSAPModulesMaster = async (): Promise<void> => {
        try {
            const resp: any = await apiRequest("/GetSAPModulesMaster", {});
            if (resp.ResponseData && resp.ResponseData.length > 0) {
                // Ensure proper option structure
                const moduleOptions: Option[] = resp.ResponseData.map((item: any) => ({
                    value: item.value || item.Module || "",
                    label: item.label || item.Module || ""
                }));
                setState({ SAPModuleList: moduleOptions });
            } else {
                setState({ SAPModuleList: [] });
            }
        } catch (err) {
            console.error("Error loading SAP Modules:", err);
            setState({ SAPModuleList: [] });
        }
    };

    const GetSAPSubModulesMasterByModule = async (Module: string = ""): Promise<void> => {
        try {
            const resp: any = await apiRequest("/GetSAPSubModulesMasterByModule", { Module });
            if (resp.ResponseData && resp.ResponseData.length > 0) {
                // Ensure proper option structure
                const subModuleOptions: Option[] = resp.ResponseData.map((item: any) => ({
                    value: item.value || item.SubModule || "",
                    label: item.label || item.SubModule || ""
                }));
                setState({ SAPSubModuleList: subModuleOptions });
            } else {
                setState({ SAPSubModuleList: [] });
            }
        } catch (err) {
            console.error("Error loading SAP Sub Modules:", err);
            setState({ SAPSubModuleList: [] });
        }
    };

    const getSAPObjectsList = async (Module: string = "", SubModule: string = ""): Promise<void> => {
        try {
            const resp: any = await apiRequest("/GetSAPObjectsMasterPaginationFilterSearchNewV2", {
                PageNo: 1,
                StartDate: "",
                EndDate: "",
                ObjectType: "",
                Module: Module,
                SubModule: SubModule,
                SearchString: ""
            });
            if (resp.ResponseData && resp.ResponseData.length > 0) {
                const objectOptions: Option[] = resp.ResponseData.map((item: any) => ({
                    value: String(item.ObjectId || ""),
                    label: `${item.ObjectName || "Unknown"} (${item.ObjectId || "N/A"})`
                }));
                setState({ SAPObjectsList: objectOptions });
            } else {
                setState({ SAPObjectsList: [] });
            }
        } catch (err) {
            console.error("Error loading SAP Objects:", err);
            setState({ SAPObjectsList: [] });
        }
    };

    const getObjectAPIListByObjectId = async (ObjectId: string = ""): Promise<void> => {
        try {
            if (!ObjectId) {
                setState({ ObjectAPIList: [] });
                return;
            }
            
            const resp: any = await apiRequest("/GetSAPObjectApisMasterByObjectId", {
                ObjectId: ObjectId
            });
            
            if (resp.ResponseData && resp.ResponseData.length > 0) {
                const apiOptions: Option[] = resp.ResponseData.map((item: any) => ({
                    value: String(item.ApiId || ""),
                    label: `${item.ServiceName || "Unknown Service"} - ${item.OperationType || ""} (${item.ApiMethod || ""})`
                })).filter(opt => opt.value !== "");
                
                setState({ ObjectAPIList: apiOptions });
            } else {
                setState({ ObjectAPIList: [] });
            }
        } catch (err) {
            console.error("Error loading Object APIs:", err);
            setState({ ObjectAPIList: [] });
        }
    };

    const getData = async (SearchQuery: string = "", PageNo: number = 1): Promise<void> => {
        try {
            getObjectAPIListByObjectId(props.CurrAddEditDetails.ObjectId ||"");
            const resp: any = await apiRequest("/GetExecutionComponents", {
                SearchString: SearchQuery,
                ObjectId:props.CurrAddEditDetails.ObjectId ||""
            });
            if (resp.ResponseData && resp.ResponseData.length > 0) {
                setState({ 
                    ExecutionComponents: resp.ResponseData as ExecutionComponent[], 
                    TotalRecords: resp.ResponseData.length 
                });
            } else {
                setState({ ExecutionComponents: [], TotalRecords: 0 });
            }
        } catch (err) {
            setState({ Error: String(err) });
        } finally {
            setState({ IsLoading: false });
        }
    };

    const handleAddNew = (): void => {
        const newRow: ExecutionComponent = {
            ExecutionComponentId: "",
            Module: props.CurrAddEditDetails.Module ||"",
            SubModule: props.CurrAddEditDetails.SubModule ||"",
            ObjectId: props.CurrAddEditDetails.ObjectId ||"",
            Component: "",
            ComponentType: "",
            ObjectType: props.CurrAddEditDetails.ObjectType ||"",
            ObjectAPI: "",
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

    const handleEdit = (item: ExecutionComponent): void => {
        // Load sub-modules, objects, and APIs when editing
        if (item.Module) {
            GetSAPSubModulesMasterByModule(item.Module);
        }
        if (item.Module && item.SubModule) {
            getSAPObjectsList(item.Module, item.SubModule);
        }
        if (item.ObjectId) {
            getObjectAPIListByObjectId(item.ObjectId);
        }
        
        setState({
            editingRows: {
                ...state.editingRows,
                [item.isNew ? (item.tempId as number) : item.ExecutionComponentId]: true,
            },
            rowErrors: {
                ...state.rowErrors,
                [item.isNew ? (item.tempId as number) : item.ExecutionComponentId]: {},
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
        const requiredFields: Array<keyof Pick<ExecutionComponent, "Module" | "ObjectId" | "Component" | "ComponentType">> = [
            "Module",
            "ObjectId",
            "Component",
            "ComponentType",
        ];
        const newRowErrors: RowErrorMap = {};
        let allValid = true;

        state.newRows.forEach((row) => {
            const rowId = row.tempId as number;
            newRowErrors[rowId] = {};

            requiredFields.forEach((field) => {
                const value = row[field];
                if (value === undefined || value === null || value === "") {
                    newRowErrors[rowId][field] = "This field is required";
                    allValid = false;
                }
            });
        });

        Object.keys(state.editingRows).forEach((idKey) => {
            const numericId = Number.isNaN(Number(idKey)) ? idKey : Number(idKey);
            if (typeof idKey === "string") {
                const row = state.ExecutionComponents.find((t) => t.ExecutionComponentId === idKey);
                if (row) {
                    newRowErrors[numericId] = {};
                    requiredFields.forEach((field) => {
                        const value = row[field];
                        if (value === undefined || value === null || value === "") {
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
        if (!validateAllRows()) return;

        setState({ SavingLoader: true });

        try {
            const editedRows = Object.keys(state.editingRows)
                .filter((id) => typeof id === "string")
                .map((id) => {
                    return state.ExecutionComponents.find((row) => row.ExecutionComponentId === id);
                })
                .filter(Boolean) as ExecutionComponent[];

            const rowsToSend: ExecutionComponent[] = [...editedRows, ...state.newRows];

            if (rowsToSend.length > 0) {
                for (const row of rowsToSend) {
                    await apiRequest("/AddUpdateExecutionComponent", row as any);
                }
            }

            setState({
                SavingLoader: false,
                showToast: true,
                editingRows: {},
                newRows: [],
                rowErrors: {},
            });

            await getData();
            setTimeout(() => setState({ showToast: false }), 3000);
        } catch (error) {
            setState({ SavingLoader: false, Error: String(error) });
        }
    };

    const handleDropdownChange = (val: string, _options: unknown, name: string, item: ExecutionComponent): void => {
        if (item.isNew) {
            const updatedNewRows = state.newRows.map((row) => {
                if (row.tempId === item.tempId) {
                    const updatedRow = { ...row, [name]: val } as ExecutionComponent;
                    
                    // // Cascade logic
                    // if (name === "Module") {
                    //     updatedRow.SubModule = "";
                    //     updatedRow.ObjectId = "";
                    //     updatedRow.ObjectAPI = "";
                    //     GetSAPSubModulesMasterByModule(val);
                    //     setState({ SAPObjectsList: [], ObjectAPIList: [] });
                    // }
                    // if (name === "SubModule") {
                    //     updatedRow.ObjectId = "";
                    //     updatedRow.ObjectAPI = "";
                    //     getSAPObjectsList(row.Module, val);
                    //     setState({ ObjectAPIList: [] });
                    // }
                    // if (name === "ObjectId") {
                    //     updatedRow.ObjectAPI = "";
                    //     getObjectAPIListByObjectId(val);
                    // }
                    
                    return updatedRow;
                }
                return row;
            });
            setState({ newRows: updatedNewRows });
        } else {
            const updatedComponents = state.ExecutionComponents.map((t) => {
                if (t.ExecutionComponentId === item.ExecutionComponentId) {
                    const updatedRow = { ...t, [name]: val } as ExecutionComponent;
                    
                    // Cascade logic
                    if (name === "Module") {
                        updatedRow.SubModule = "";
                        updatedRow.ObjectId = "";
                        updatedRow.ObjectAPI = "";
                        GetSAPSubModulesMasterByModule(val);
                        setState({ SAPObjectsList: [], ObjectAPIList: [] });
                    }
                    if (name === "SubModule") {
                        updatedRow.ObjectId = "";
                        updatedRow.ObjectAPI = "";
                        getSAPObjectsList(t.Module, val);
                        setState({ ObjectAPIList: [] });
                    }
                    if (name === "ObjectId") {
                        updatedRow.ObjectAPI = "";
                        getObjectAPIListByObjectId(val);
                    }
                    
                    return updatedRow;
                }
                return t;
            });
            setState({ ExecutionComponents: updatedComponents });
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
        name: string,
        item: ExecutionComponent
    ): void => {
        if (item.isNew) {
            const updatedNewRows = state.newRows.map((row) => {
                if (row.tempId === item.tempId) {
                    return { ...row, [name]: e.target.value } as ExecutionComponent;
                }
                return row;
            });
            setState({ newRows: updatedNewRows });
        } else {
            const updatedComponents = state.ExecutionComponents.map((t) => {
                if (t.ExecutionComponentId === item.ExecutionComponentId) {
                    return { ...t, [name]: e.target.value } as ExecutionComponent;
                }
                return t;
            });
            setState({ ExecutionComponents: updatedComponents });
        }
    };

    const handlePageChange = (page: number): void => {
        setState({ CurrentPage: page });
        getData(state.SearchQuery, page);
    };

    const handleDeleteItem = async (item: ExecutionComponent): Promise<void> => {
        if (item.ExecutionComponentId) {
            const resp: any = await apiRequest("/DeleteExecutionComponent", item as any);
            if (resp) {
                setState({ showToast: true });
                getData();
                setTimeout(() => {
                    setState({ showToast: false });
                }, 3000);
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

    const handleSearch = (value: string): void => {
        setState({ SearchQuery: value });
        if (value.trim() === "") {
            getData("");
        }
    };

    const columns: { title: string; key: string; className?: string }[] = [
        // { title: "Module", key: "Module", className: "min-w-[150px]" },
        // { title: "Sub Module", key: "SubModule", className: "min-w-[150px]" },
        // { title: "Object ID", key: "ObjectId", className: "min-w-[150px]" },
        { title: "Component Type", key: "ComponentType", className: "min-w-[150px]" },
        { title: "Execution Component", key: "Component", className: "min-w-[200px]" },
        // { title: "Object Type", key: "ObjectType", className: "min-w-[150px]" },
        { title: "API", key: "ObjectAPI", className: "min-w-[250px]" },
    ];

    const allRows: ExecutionComponent[] = [...state.newRows, ...state.ExecutionComponents];

    const data: ReactNodeRecord[] = allRows.map((item) => {
        const rowId: string | number = item.isNew ? (item.tempId as number) : item.ExecutionComponentId;
        const isEditing = state.editingRows[rowId];
        const errors = state.rowErrors[rowId] || {};

        if (isEditing) {
            return {
                // Module: (
                //     <div>
                //         <Dropdown
                //             size="small"
                //             mode="single"
                //             options={state.SAPModuleList || ""}
                //             value={item.Module}
                //             onChange={(val: string, option: unknown) => handleDropdownChange(val, option, "Module", item)}
                //             className={errors.Module ? "border-red-500" : ""}
                //             placeholder="Select Module"
                //         />
                //         {errors.Module && (
                //             <div className="flex items-center mt-1 ml-2">
                //                 <CircleAlert size={14} className="text-red-500" />
                //                 <p className="ml-2 text-red-500 text-sm">{errors.Module}</p>
                //             </div>
                //         )}
                //     </div>
                // ),
                // SubModule: (
                //     <div>
                //         <Dropdown
                //             size="small"
                //             mode="single"
                //             options={state.SAPSubModuleList || ""}
                //             value={item.SubModule}
                //             onChange={(val: string, option: unknown) => handleDropdownChange(val, option, "SubModule", item)}
                //             placeholder="Select Sub Module"
                //             disabled={!item.Module}
                //         />
                //     </div>
                // ),
                // ObjectId: (
                //     <div>
                //         <Dropdown
                //             size="small"
                //             mode="single"
                //             options={state.SAPObjectsList || ""}
                //             value={item.ObjectId}
                //             onChange={(val: string, option: unknown) => handleDropdownChange(val, option, "ObjectId", item)}
                //             className={errors.ObjectId ? "border-red-500" : ""}
                //             placeholder="Select Object"
                //             disabled={!item.SubModule}
                //         />
                //         {errors.ObjectId && (
                //             <div className="flex items-center mt-1 ml-2">
                //                 <CircleAlert size={14} className="text-red-500" />
                //                 <p className="ml-2 text-red-500 text-sm">{errors.ObjectId}</p>
                //             </div>
                //         )}
                //     </div>
                // ),
                Component: (
                    <div>
                        <input
                            defaultValue={item.Component || ""}
                            onBlur={(e: React.ChangeEvent<HTMLInputElement>) => {
                                if (item.Component !== e.target.value) {
                                    handleChange(e, "Component", item);
                                }
                            }}
                            type="text"
                            className={`w-full px-3 shadow text-[0.85rem] py-2 border ${errors.Component ? "border-red-500" : "border-gray-200"} rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            placeholder="Enter Component"
                            required
                        />
                        {errors.Component && (
                            <div className="flex items-center mt-1 ml-2">
                                <CircleAlert size={14} className="text-red-500" />
                                <p className="ml-2 text-red-500 text-sm">{errors.Component}</p>
                            </div>
                        )}
                    </div>
                ),
                ComponentType: (
                    <div>
                        <Dropdown
                            size="small"
                            mode="single"
                            options={state.ComponentTypeList || ""}
                            value={item.ComponentType}
                            onChange={(val: string, option: unknown) => handleDropdownChange(val, option, "ComponentType", item)}
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
                // ObjectType: (
                //     <div>
                //         <Dropdown
                //             size="small"
                //             mode="single"
                //             options={state.ObjectTypeList && state.ObjectTypeList.length > 0 ? state.ObjectTypeList : []}
                //             value={item.ObjectType}
                //             onChange={(val: string, option: unknown) => handleDropdownChange(val, option, "ObjectType", item)}
                //             placeholder="Select Object Type"
                //         />
                //     </div>
                // ),
                ObjectAPI: (
                    <div>
                        <Dropdown
                            size="small"
                            mode="single"
                            options={state.ObjectAPIList || ""}
                            value={item.ObjectAPI}
                            onChange={(val: string, option: unknown) => handleDropdownChange(val, option, "ObjectAPI", item)}
                            placeholder="Select Object API"
                        />
                    </div>
                ),
                actions: (
                    <div className="relative flex items-center">
                        <ConfirmPopup message="Are you sure you want to delete this component?" onConfirm={() => handleDeleteItem(item)}>
                            <button className="pr-4 flex items-center">
                                <Trash2 className="text-[#1A1A1A] cursor-pointer" />
                            </button>
                        </ConfirmPopup>
                    </div>
                ),
            } as ReactNodeRecord;
        }

        return {
            Module: item.Module,
            SubModule: item.SubModule || "-",
            ObjectId: item.ObjectId,
            Component: item.Component,
            ComponentType: state.ComponentTypeList.find(opt => opt.value === item.ComponentType)?.label || item.ComponentType,
            ObjectType: state.ObjectTypeList.find(opt => opt.value === item.ObjectType)?.label || item.ObjectType || "-",
            ObjectAPI: state.ObjectAPIList.find(opt => opt.value === item.ObjectAPI)?.label || item.ObjectAPI || "-",
            actions: (
                <div className="relative flex items-center">
                    <button onClick={() => handleEdit(item)} className="ml-2 text-white px-3 py-1 rounded text-sm">
                        <SquarePen className="text-[#1A1A1A] cursor-pointer" />
                    </button>
                    <ConfirmPopup message="Are you sure you want to delete this component?" onConfirm={() => handleDeleteItem(item)}>
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
    if (state.Error) return <ErrorScreen message={state.Error} />;

    return (
        <div className="pt-0 pb-6 px-2">
            <Toast message="Saved successfully!" show={state.showToast} onClose={() => setState({ showToast: false })} />

            <div className="flex justify-between items-center pb-4 pt-2">
                <div className="w-1/3">
                    <SearchBar currentValue={state.SearchQuery} onSearch={handleSearch} size="medium" />
                </div>

                <div className="flex items-center space-x-2 gap-4">
                    <button
                        onClick={handleAddNew}
                        className="bg-[#0071E9] hover:bg-[#005ABA] text-[0.89rem] cursor-pointer text-white font-medium py-2 px-5 rounded-lg flex items-center space-x-2"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Add Component</span>
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

            {state.TotalRecords > 10 && (
                <div className="pt-4 flex justify-end">
                    <Pagination
                        total={state.TotalRecords}
                        current={state.CurrentPage}
                        pageSize={10}
                        onChange={handlePageChange}
                        showSizeChanger={false}
                    />
                </div>
            )}
        </div>
    );
}