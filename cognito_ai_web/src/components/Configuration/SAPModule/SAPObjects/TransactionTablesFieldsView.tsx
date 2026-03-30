import React, { useEffect, useReducer, useRef } from 'react';
import CustomTable from "../../../../utils/CustomTable";
import { apiRequest } from "../../../../utils/helpers/ApiHelper";
import SpinnerV2 from "../../../../utils/SpinnerV2";
import ErrorScreen from "../../../../utils/ErrorScreen";
import Pagination from "../../../../utils/Pagination";
import useDebounce from "../../../../utils/helpers/useDebounce";
import SearchBar from "../../../../utils/SearchBar";
import { Plus } from "lucide-react";
import Toast from "../../../../utils/Toast";

export type Props = {
    CurrAddEditDetails: {
        TransactionCode: string;
        ObjectId?: string;
        [key: string]: any;
    };
};

type YesNo = "Yes" | "No";

interface TableFieldRow {
    STTMId: string | number;
    TransactionCode: string;
    SourceApplication: string;
    TableName: string;
    TableType?: string;
    TableDescription?: string;
    TableMarkedFlag?: YesNo;
    FieldId?: string | number;
    FieldName?: string;
    FieldType?: string;
    FieldDescription?: string;
    FieldMarkedFlag?: YesNo;
    KeyField?: YesNo;
    VerificationField?: YesNo;
    ComparativeField?: YesNo;
    DisplayField?: YesNo;
    SortKey?: number;
    SAPOTFMID?: string;
    IsInObjectMapping?: boolean;
}

interface State {
    Error: string;
    TableFields: TableFieldRow[];
    SearchQuery: string;
    CurrentPage: number;
    TotalRecords: number;
    IsLoading: boolean;
    showAddToObjectButton: boolean;
    showToast: boolean;
    toastMessage: string;
    SavingLoader: boolean;
}

export default function TransactionTablesFieldsView(props: Props) {
    const [state, setState] = useReducer(
        (prev: State, newState: Partial<State>): State => ({ ...prev, ...newState }),
        {
            Error: "",
            TableFields: [],
            SearchQuery: "",
            CurrentPage: 1,
            TotalRecords: 0,
            IsLoading: true,
            showAddToObjectButton: false,
            showToast: false,
            toastMessage: "",
            SavingLoader: false,
        } as State
    );

    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const didFetchData = useRef<boolean>(false);

    useEffect(() => {
        didFetchData.current = false;
    }, [props.CurrAddEditDetails.TransactionCode]);

    useEffect(() => {
        if (didFetchData.current) return;
        didFetchData.current = true;

        const init = async () => {
            setState({ IsLoading: true });
            await getData("", 1);
            setState({ IsLoading: false });
        };

        init();
    }, [props.CurrAddEditDetails.TransactionCode]);

    const getData = async (SearchQuery: string = "", PageNo: number = 1) => {
        try {
            const resp: any = await apiRequest("/GetTransactionTablesFieldsView", {
                PageNo,
                TransactionCode: props.CurrAddEditDetails.TransactionCode,
                ObjectId: props.CurrAddEditDetails.ObjectId,
                SearchString: SearchQuery,
            });

            if (resp.ResponseData && resp.ResponseData.length > 0) {
                // Mark fields that are already in SAPObjectTableFieldsMaster
                const processedData = resp.ResponseData.map((item: TableFieldRow) => ({
                    ...item,
                    // If SAPOTFMID exists, it means this field is already mapped to the object
                    FieldMarkedFlag: item.SAPOTFMID ? "Yes" : "No",
                    IsInObjectMapping: !!item.SAPOTFMID
                }));

                const hasSelection = processedData.some((f: TableFieldRow) => f.FieldMarkedFlag === "Yes");

                setState({
                    TableFields: processedData,
                    TotalRecords: resp.TotalRecords || processedData.length,
                    showAddToObjectButton: hasSelection
                });
            } else {
                setState({ TableFields: [], TotalRecords: 0, showAddToObjectButton: false });
            }
        } catch (err: unknown) {
            setState({ Error: String(err) });
        } finally {
            setState({ IsLoading: false });
        }
    };

    const handlePageChange = (page: number) => {
        setState({ CurrentPage: page });
        getData(state.SearchQuery, page);
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

    const handleSelectionChange = (
        newList: Array<Partial<TableFieldRow & { checkFlag?: boolean; id?: string }>> | null,
        item?: Partial<TableFieldRow & { checkFlag?: boolean; id?: string }>
    ) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            let updatedFields = [...state.TableFields];

            if (item && item.id) {
                // Single item changed - use the ID to find the exact row
                const parts = item.id.split('_');
                const index = parseInt(parts[parts.length - 1]);
                
                if (!isNaN(index) && index >= 0 && index < updatedFields.length) {
                    updatedFields[index] = {
                        ...updatedFields[index],
                        FieldMarkedFlag: (item.checkFlag ? "Yes" : "No") as YesNo
                    };
                }
            } else if (newList && newList.length > 0) {
                // Multiple items changed - use IDs to find exact rows
                const selectionMap = new Map<number, boolean>();
                
                newList.forEach(listItem => {
                    if (listItem.id) {
                        const parts = listItem.id.split('_');
                        const index = parseInt(parts[parts.length - 1]);
                        if (!isNaN(index)) {
                            selectionMap.set(index, listItem.checkFlag || false);
                        }
                    }
                });

                updatedFields = updatedFields.map((field, idx) => {
                    if (selectionMap.has(idx)) {
                        return {
                            ...field,
                            FieldMarkedFlag: (selectionMap.get(idx) ? "Yes" : "No") as YesNo
                        };
                    }
                    return field;
                });
            }

            // Check if any items are selected
            const hasSelection = updatedFields.some(f => f.FieldMarkedFlag === "Yes");

            setState({ 
                TableFields: updatedFields,
                showAddToObjectButton: hasSelection
            });
        }, 100);
    };

    const handleAddToObject = async () => {
        const selectedFields = state.TableFields.filter(field => 
            field.FieldMarkedFlag === "Yes" && 
            field.FieldName &&
            !field.IsInObjectMapping // Only add fields that are not already in the mapping
        );

        if (selectedFields.length === 0) {
            setState({ 
                showToast: true, 
                toastMessage: "No new fields to add. All selected fields are already in the object!" 
            });
            setTimeout(() => setState({ showToast: false }), 3000);
            return;
        }

        if (!props.CurrAddEditDetails.ObjectId) {
            setState({ 
                showToast: true, 
                toastMessage: "Object ID is required!" 
            });
            setTimeout(() => setState({ showToast: false }), 3000);
            return;
        }

        setState({ SavingLoader: true });

        try {
            const mappingData = selectedFields.map(row => ({
                ObjectId: props.CurrAddEditDetails.ObjectId,
                Tcode: props.CurrAddEditDetails.TransactionCode,
                SourceApplication: row.SourceApplication,
                TableName: row.TableName,
                TableType: row.TableType,
                TableDesc: row.TableDescription,
                FieldName: row.FieldName,
                FieldType: row.FieldType,
                ComparativeField: row.ComparativeField || "No",
                DisplayField: row.DisplayField || "No",
                KeyField: row.KeyField || "No",
                VerificationField: row.VerificationField || "No",
                MarkedFlag: "Yes",
                Description: row.FieldDescription,
                SortKey: row.SortKey || 0
            }));

            await apiRequest("/AddSAPObjectTableFieldMapping", mappingData);

            // Refresh data to get updated mappings
            await getData(state.SearchQuery, state.CurrentPage);

            setState({
                SavingLoader: false,
                showToast: true,
                toastMessage: `Successfully added ${selectedFields.length} field(s) to object!`,
            });

            setTimeout(() => setState({ showToast: false }), 3000);
        } catch (error: unknown) {
            setState({ 
                SavingLoader: false, 
                showToast: true,
                toastMessage: "Error adding to object!"
            });
            setTimeout(() => setState({ showToast: false }), 3000);
        }
    };

    const columns: { title: string; key: string; className?: string }[] = [
        { title: 'Table Name', key: 'TableName', className: 'min-w-[180px] font-medium' },
        { title: 'Source App', key: 'SourceApplication', className: 'w-32' },
        { title: 'Field Name', key: 'FieldName', className: 'min-w-[180px]' },
        { title: 'Field Type', key: 'FieldType', className: 'w-32' },
        { title: 'Key', key: 'KeyField', className: 'w-20 text-center' },
        { title: 'Verification', key: 'VerificationField', className: 'w-28 text-center' },
        { title: 'Comparative', key: 'ComparativeField', className: 'w-28 text-center' },
        { title: 'Display', key: 'DisplayField', className: 'w-24 text-center' },
    ];

    // Group data by table
    const groupedByTable: Record<string, TableFieldRow[]> = {};
    state.TableFields.forEach(row => {
        if (!groupedByTable[row.TableName]) {
            groupedByTable[row.TableName] = [];
        }
        groupedByTable[row.TableName].push(row);
    });

    const data = state.TableFields.map((item, index) => {
        const isFirstInTable = groupedByTable[item.TableName]?.[0] === item;
        const tableRowSpan = groupedByTable[item.TableName]?.length || 1;

        return {
            TableName: isFirstInTable ? (
                <div className="font-semibold text-gray-800" rowSpan={tableRowSpan}>
                    {item.TableName}
                    {/* {item.TableDescription && (
                        <p className="text-xs text-gray-500 font-normal mt-1">{item.TableDescription}</p>
                    )} */}
                </div>
            ) : null,
            SourceApplication: isFirstInTable ? (
                <div rowSpan={tableRowSpan}>{item.SourceApplication || "SAP"}</div>
            ) : null,
            FieldName: (
                <div className="font-medium text-gray-700 flex items-center gap-2">
                    {item.FieldName || "-"}
                    {item.IsInObjectMapping && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            Mapped
                        </span>
                    )}
                </div>
            ),
            FieldType: item.FieldType || "-",
            KeyField: (
                <div className="flex justify-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${item.KeyField === "Yes" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                        {item.KeyField || "No"}
                    </span>
                </div>
            ),
            VerificationField: (
                <div className="flex justify-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${item.VerificationField === "Yes" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-600"}`}>
                        {item.VerificationField || "No"}
                    </span>
                </div>
            ),
            ComparativeField: (
                <div className="flex justify-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${item.ComparativeField === "Yes" ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-600"}`}>
                        {item.ComparativeField || "No"}
                    </span>
                </div>
            ),
            DisplayField: (
                <div className="flex justify-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${item.DisplayField === "Yes" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-600"}`}>
                        {item.DisplayField || "No"}
                    </span>
                </div>
            ),
            id: `${item.TableName}_${item.FieldName || 'null'}_${index}`,
            TransactionCode: item.TransactionCode,
            TableName_key: item.TableName,
            FieldName_key: item.FieldName,
            selected: item.FieldMarkedFlag === "Yes",
        };
    });

    if (state.IsLoading) return <div className="h-96 py-20"><SpinnerV2 text="Fetching data..." /></div>;

    if (state.Error) return <ErrorScreen message={state.Error} />;

    return (
        <div className="pt-0 pb-6 px-2">
            <Toast
                message={state.toastMessage}
                show={state.showToast}
                onClose={() => setState({ showToast: false })}
            />

            <div className="flex justify-between items-center pb-4">
                <div className="flex items-center gap-4">
                    <div className="w-96">
                        <SearchBar currentValue={state.SearchQuery} onSearch={handleSearch} size="medium" />
                    </div>
                    {state.showAddToObjectButton && (
                        <button
                            onClick={handleAddToObject}
                            className="bg-[#0071E9] hover:bg-[#005ABA] text-[0.89rem] cursor-pointer text-white font-medium py-2 px-5 rounded-lg flex items-center space-x-2"
                            disabled={state.SavingLoader}
                        >
                            {state.SavingLoader ? (
                                <SpinnerV2 text="Adding..." />
                            ) : (
                                <>
                                    <Plus className="w-5 h-5" />
                                    <span>Add To Object</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
                <div className="text-sm text-gray-600 flex items-center gap-2">
                    <span className="font-semibold">Transaction:</span> 
                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-md font-medium">
                        {props.CurrAddEditDetails.TransactionCode}
                    </span>
                </div>
            </div>

            {state.TableFields.length === 0 && !state.IsLoading ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No table fields found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        No tables or fields are associated with this transaction code.
                    </p>
                </div>
            ) : (
                <>
                    
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
                        <CustomTable
                            onSelectionChange={handleSelectionChange}
                            enableSelection={true}
                            columns={columns}
                            data={data}
                            responsive={true}
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
                <div className="flex items-center gap-6 text-xs">
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-1 rounded bg-green-100 text-green-800 font-medium">Yes</span>
                        <span className="text-gray-600">= Field is marked/enabled</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-1 rounded bg-gray-100 text-gray-600 font-medium">No</span>
                        <span className="text-gray-600">= Field is not marked</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Mapped</span>
                        <span className="text-gray-600">= Already added to object</span>
                    </div>
                </div>
            </div>
        </div>
    );
}