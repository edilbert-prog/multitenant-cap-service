import React, { useEffect, useReducer, useRef } from 'react';
import CustomTable from "../../../../utils/CustomTable.jsx";
import { Save, Trash2, X } from "lucide-react";
import { apiRequest } from "../../../../utils/helpers/ApiHelper.js";
import SpinnerV2 from "../../../../utils/SpinnerV2.jsx";
import ErrorScreen from "../../../../utils/ErrorScreen.jsx";
import Pagination from "../../../../utils/Pagination.jsx";
import Toast from "../../../../utils/Toast.jsx";
import ConfirmPopup from "../../../../utils/ConfirmPopup.jsx";
import useDebounce from "../../../../utils/helpers/useDebounce.js";
import SearchBar from "../../../../utils/SearchBar.jsx";

export type Props = {
    CurrAddEditDetails: {
        TransactionCode: string;
        ObjectId?: string;
        [key: string]: any;
    };
};

type YesNo = "Yes" | "No";

interface BaseRow {
    SAPOTFMID?: string;
    ObjectId: string;
    Tcode: string;
    SourceApplication: string;
    TableName: string;
    TableType?: string;
    TableDesc?: string;
    TableMarkedFlag?: YesNo;
    FieldName: string;
    FieldType?: string;
    ComparativeField?: YesNo;
    DisplayField?: YesNo;
    KeyField?: YesNo;
    VerificationField?: YesNo;
    FieldMarkedFlag?: YesNo;
    FieldDesc?: string;
    Description?: string;
    SortKey?: number;
    checkFlag?: boolean;
    isNew?: boolean;
    isLatest?: boolean;
    ApplicationName?: string;
    Environment?: string;
}

interface ExistingRow extends BaseRow {
    isNew?: false;
    SAPOTFMID: string;
}

interface NewRow extends BaseRow {
    isNew: true;
    tempId: number;
}

type Row = ExistingRow | NewRow;

interface State {
    Error: string;
    SAPObjectTableFields: ExistingRow[];
    OriginalData: ExistingRow[];
    SearchQuery: string;
    CurrentPage: number;
    TotalRecords: number;
    IsLoading: boolean;
    showToast: boolean;
    toastMessage: string;
    SavingLoader: boolean;
    modifiedRows: Set<string>;
}

export default function SAPObjectTableFieldsMaster(props: Props) {
    const [state, setState] = useReducer(
        (prev: State, newState: Partial<State>): State => ({ ...prev, ...newState }),
        {
            Error: "",
            SAPObjectTableFields: [],
            OriginalData: [],
            SearchQuery: "",
            CurrentPage: 1,
            TotalRecords: 0,
            IsLoading: true,
            showToast: false,
            toastMessage: "",
            SavingLoader: false,
            modifiedRows: new Set(),
        } as State
    );

    const didFetchData = useRef<boolean>(false);

    useEffect(() => {
        didFetchData.current = false;
    }, [props.CurrAddEditDetails.ObjectId, props.CurrAddEditDetails.Tcode]);

    useEffect(() => {
        if (didFetchData.current) return;
        didFetchData.current = true;

        const init = async () => {
            setState({ IsLoading: true });
            await getData("", 1);
            setState({ IsLoading: false });
        };

        init();
    }, [props.CurrAddEditDetails.ObjectId, props.CurrAddEditDetails.Tcode]);

    const getData = async (SearchQuery: string = "", PageNo: number = 1) => {
        try {
            const resp: any = await apiRequest("/GetSAPObjectTableFieldsJoined", {
                PageNo,
                ObjectId: props.CurrAddEditDetails.ObjectId,
                Tcode: props.CurrAddEditDetails.Tcode,
                SearchString: SearchQuery,
            });
            
            if (resp.ResponseData.length > 0) {
                setState({ 
                    SAPObjectTableFields: resp.ResponseData,
                    OriginalData: JSON.parse(JSON.stringify(resp.ResponseData)),
                    TotalRecords: resp.TotalRecords as number,
                    modifiedRows: new Set()
                });
            } else {
                setState({ 
                    SAPObjectTableFields: [], 
                    OriginalData: [],
                    TotalRecords: 0,
                    modifiedRows: new Set()
                });
            }
        } catch (err: unknown) {
            setState({ Error: String(err) });
        } finally {
            setState({ IsLoading: false });
        }
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>, name: keyof BaseRow, item: ExistingRow) => {
        const checked: YesNo = e.target.checked ? "Yes" : "No";
        
        const updatedFields = state.SAPObjectTableFields.map(t => {
            if (t.SAPOTFMID === item.SAPOTFMID) {
                return { ...t, [name]: checked };
            }
            return t;
        });

        // Track modified rows
        const newModifiedRows = new Set(state.modifiedRows);
        newModifiedRows.add(item.SAPOTFMID);

        setState({ 
            SAPObjectTableFields: updatedFields,
            modifiedRows: newModifiedRows
        });
    };

    const handleCancelAll = () => {
        // Reload original data
        setState({
            SAPObjectTableFields: JSON.parse(JSON.stringify(state.OriginalData)),
            modifiedRows: new Set()
        });
    };

    const handleSaveAll = async () => {
        if (state.modifiedRows.size === 0) {
            setState({ 
                showToast: true, 
                toastMessage: "No changes to save!" 
            });
            setTimeout(() => setState({ showToast: false }), 3000);
            return;
        }

        setState({ SavingLoader: true });

        try {
            // Get all modified rows
            const modifiedRowsData = state.SAPObjectTableFields.filter(row => 
                state.modifiedRows.has(row.SAPOTFMID)
            );

            // Call API for each modified row
            for (const row of modifiedRowsData) {
                const updatePayload = {
                    SAPOTFMID: row.SAPOTFMID,
                    ComparativeField: row.ComparativeField || 'No',
                    DisplayField: row.DisplayField || 'No',
                    KeyField: row.KeyField || 'No',
                    VerificationField: row.VerificationField || 'No',
                    Description: row.Description || row.FieldDesc || '',
                    SortKey: row.SortKey || 0
                };

                const response: any = await apiRequest("/UpdateSAPObjectTableField", updatePayload);
                
                if (response.updateSAPObjectTableField_error) {
                    throw new Error(response.updateSAPObjectTableField_error);
                }
            }

            setState({
                SavingLoader: false,
                showToast: true,
                toastMessage: `Successfully updated ${modifiedRowsData.length} record(s)!`,
                modifiedRows: new Set()
            });

            // Refresh data
            await getData(state.SearchQuery, state.CurrentPage);
            setTimeout(() => setState({ showToast: false }), 3000);
        } catch (error: unknown) {
            setState({ 
                SavingLoader: false, 
                showToast: true,
                toastMessage: `Error saving data: ${error instanceof Error ? error.message : String(error)}`
            });
            setTimeout(() => setState({ showToast: false }), 3000);
        }
    };

    const handlePageChange = (page: number) => {
        setState({ CurrentPage: page });
        getData(state.SearchQuery, page);
    };

    const handleDeleteItem = async (item: ExistingRow) => {
        if (item.SAPOTFMID) {
            try {
                const resp: any = await apiRequest("/DeleteSAPObjectTableField", { SAPOTFMID: item.SAPOTFMID });
                if (resp) {
                    setState({ showToast: true, toastMessage: "Deleted successfully!" });
                    await getData(state.SearchQuery, state.CurrentPage);
                    setTimeout(() => setState({ showToast: false }), 3000);
                }
            } catch (error) {
                setState({ 
                    showToast: true, 
                    toastMessage: "Error deleting record!" 
                });
                setTimeout(() => setState({ showToast: false }), 3000);
            }
        }
    };

    const debouncedSearchQuery: string = useDebounce<string>(state.SearchQuery, 300);
    const didSearchRun = useRef<boolean>(false);

    useEffect(() => {
        if (!didSearchRun.current) {
            didSearchRun.current = true;
            return;
        }
        if (debouncedSearchQuery.trim() === "") return;
        getData(debouncedSearchQuery);
    }, [debouncedSearchQuery]);

    const handleSearch = (value: string) => {
        setState({ SearchQuery: value });
        if (value.trim() === "") {
            getData("", 1);
        }
    };

    const columns: { title: string; key: string; className?: string }[] = [
        { title: 'Table Name', key: 'TableName', className: 'min-w-[180px]' },
        { title: 'Field Name', key: 'FieldName', className: 'min-w-[180px]' },
        { title: 'Field Type', key: 'FieldType', className: 'min-w-[100px]' },
        { title: 'Key', key: 'KeyField', className: 'min-w-[80px] text-center' },
        { title: 'Verification', key: 'VerificationField', className: 'min-w-[110px] text-center' },
        { title: 'Comparative', key: 'ComparativeField', className: 'min-w-[110px] text-center' },
        { title: 'Display', key: 'DisplayField', className: 'min-w-[90px] text-center' },
    ];

    // Group data by table for visual grouping
    const groupedByTable: Record<string, ExistingRow[]> = {};
    state.SAPObjectTableFields.forEach(row => {
        if (!groupedByTable[row.TableName]) {
            groupedByTable[row.TableName] = [];
        }
        groupedByTable[row.TableName].push(row);
    });

    const data: Array<Record<string, React.ReactNode | string | number | boolean | undefined>> = state.SAPObjectTableFields.map((item, index) => {
        const isFirstInTable = groupedByTable[item.TableName]?.[0] === item;
        const tableRowSpan = groupedByTable[item.TableName]?.length || 1;
        const isModified = state.modifiedRows.has(item.SAPOTFMID);

        return {
            TableName: isFirstInTable ? (
                <div className="font-semibold text-gray-800" rowSpan={tableRowSpan}>
                    {item.TableName}
                    {item.TableDesc && (
                        <p className="text-xs text-gray-500 font-normal mt-1">{item.TableDesc}</p>
                    )}
                </div>
            ) : null,
            FieldName: (
                <div className="font-medium text-gray-700 flex items-center gap-2">
                    {item.FieldName}
                    {isModified && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                            Modified
                        </span>
                    )}
                </div>
            ),
            FieldType: item.FieldType || "-",
            KeyField: (
                <div className="flex justify-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={item.KeyField === "Yes"}
                            onChange={(e) => handleCheckboxChange(e, "KeyField", item)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0071E9]"></div>
                    </label>
                </div>
            ),
            VerificationField: (
                <div className="flex justify-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={item.VerificationField === "Yes"}
                            onChange={(e) => handleCheckboxChange(e, "VerificationField", item)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0071E9]"></div>
                    </label>
                </div>
            ),
            ComparativeField: (
                <div className="flex justify-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={item.ComparativeField === "Yes"}
                            onChange={(e) => handleCheckboxChange(e, "ComparativeField", item)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0071E9]"></div>
                    </label>
                </div>
            ),
            DisplayField: (
                <div className="flex justify-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={item.DisplayField === "Yes"}
                            onChange={(e) => handleCheckboxChange(e, "DisplayField", item)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0071E9]"></div>
                    </label>
                </div>
            ),
            actions: (
                <div className="relative flex items-center justify-center gap-2">
                    <ConfirmPopup
                        message="Are you sure you want to delete this item?"
                        onConfirm={() => handleDeleteItem(item)}
                    >
                        <button className="flex items-center text-red-600 hover:text-red-800">
                            <Trash2 className="cursor-pointer" size={18} />
                        </button>
                    </ConfirmPopup>
                </div>
            ),
        };
    });

    const hasModifications = state.modifiedRows.size > 0;

    if (state.IsLoading) return <div className="h-96 py-20"><SpinnerV2 {...{ text: "Fetching data..." }} /></div>;

    if (state.Error) return <ErrorScreen message={state.Error} />;

    return (
        <div className="pt-0 pb-6 px-2">
            <Toast
                message={state.toastMessage}
                show={state.showToast}
                onClose={() => setState({ showToast: false })}
            />

            <div className="flex justify-between items-center pb-4">
                <div className="w-96">
                    <SearchBar currentValue={state.SearchQuery} onSearch={handleSearch} size="medium" />
                </div>

                <div className="flex items-center space-x-2 gap-4">
                    {hasModifications && (
                        <>
                            <div className="text-sm text-gray-600">
                                <span className="font-semibold">{state.modifiedRows.size}</span> field(s) modified
                            </div>
                            <button
                                onClick={handleCancelAll}
                                className="text-red-600 px-4 py-2 rounded-lg text-sm flex items-center hover:bg-red-50 cursor-pointer border border-red-300"
                            >
                                <X size={16} className="mr-1" />
                                Cancel All
                            </button>
                            <button
                                onClick={handleSaveAll}
                                className="bg-[#0071E9] hover:bg-[#0071E9] text-white px-4 py-2 rounded-lg text-sm flex cursor-pointer items-center"
                                disabled={state.SavingLoader}
                            >
                                {state.SavingLoader ? (
                                    <SpinnerV2 {...{ text: "Saving..." }} />
                                ) : (
                                    <>
                                        <Save size={16} className="mr-1" />
                                        Save All Changes
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {state.SAPObjectTableFields.length === 0 && !state.IsLoading ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No fields found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        No fields are mapped to this object and transaction code.
                    </p>
                </div>
            ) : (
                <>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
                        <CustomTable 
                            columns={columns} 
                            data={data} 
                            responsive={true}
                            enableSelection={false}
                            showActions={true}
                        />
                    </div>

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
                </>
            )}

            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-6 text-xs flex-wrap">
                    <div className="flex items-center gap-2">
                        <div className="w-11 h-6 bg-green-600 rounded-full relative">
                            <div className="absolute right-[2px] top-[2px] bg-white rounded-full h-5 w-5"></div>
                        </div>
                        <span className="text-gray-600">= Enabled (Yes)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-11 h-6 bg-gray-200 rounded-full relative">
                            <div className="absolute left-[2px] top-[2px] bg-white rounded-full h-5 w-5"></div>
                        </div>
                        <span className="text-gray-600">= Disabled (No)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Modified</span>
                        <span className="text-gray-600">= Pending changes</span>
                    </div>
                </div>
            </div>
        </div>
    );
}