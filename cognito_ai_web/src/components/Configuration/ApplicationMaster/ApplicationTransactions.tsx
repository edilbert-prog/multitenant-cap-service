import React, { useEffect, useReducer, useRef, useState } from 'react';
import CustomTable from "../../../utils/CustomTable";
import { ChevronLeft, CircleAlert, Plus, Save, Trash2, X, SquarePen } from "lucide-react";
import { apiRequest } from "../../../utils/helpers/ApiHelper";
import Spinner from "../../../utils/Spinner";
import ErrorScreen from "../../../utils/ErrorScreen";
import Pagination from "../../../utils/Pagination";
import Toast from "../../../utils/Toast";
import ConfirmPopup from "../../../utils/ConfirmPopup";
import useDebounce from '../../../utils/helpers/useDebounce';
import SearchBar from "../../../utils/SearchBar";
import Dropdown from "../../../utils/Dropdown";
import TransactionTablesMaster from "../Transactions/TransactionTablesMaster";

type Props = {
  CurrAppDetails: {
    ApplicationName: string;
    ApplicationId?: string;
    [key: string]: unknown;
  };
  children?: React.ReactNode;
};

interface FilterObj {
  Module: string;
  SubModule: string;
}

interface TcodeOption {
  value: string;
  label: string;
  __raw?: unknown;
  __autoTransaction?: string;
  __autoDescription?: string;
}

interface ExistingRow {
  ApplicationIdTransactionId: string;
  ApplicationId?: string;
  ApplicationName?: string;
  Module?: string;
  TransactionCode: string;
  Transaction: string;
  Description: string;
  isNew?: false;
}

interface NewRow {
  ApplicationName: string;
  Transaction: string;
  TransactionCode: string;
  Description: string;
  isNew: true;
  tempId: number;
}

type TableRow = ExistingRow | NewRow;

type EditingRows = Record<string | number, boolean>;
type RowErrors = Record<string | number, Record<string, string> | undefined>;

interface State {
  Error: string;
  ApplicationTransactions: ExistingRow[];
  SAPModuleList: Array<{ value: string; label: string } | Record<string, unknown>>;
  SAPSubModuleList: Array<{ value: string; label: string } | Record<string, unknown>>;
  SAPTcodeList: TcodeOption[];
  loadingTcodes: boolean;
  ViewAppDetails: boolean;
  SearchQuery: string;
  CurrentPage: number;
  TotalRecords: number;
  IsLoading: boolean;
  showToast: boolean;
  SavingLoader: boolean;
  isDataExist: string;
  FilterObj: FilterObj;
  editingRows: EditingRows;
  newRows: NewRow[];
  rowErrors: RowErrors;
  pillItems: ReadonlyArray<{ key: 'TransactionInfo' | 'TransactionFields'; label: string }>;
  CurrPillActive: 'TransactionInfo' | 'TransactionFields';
  CurrAddEditDetails?: ExistingRow | Record<string, unknown>;
}

type TableColumn = { title: string; key: string; className?: string };

export default function ApplicationTransactions(props: Props) {
  const [active, setActive] = useState<string>("file");
  const [state, setState] = useReducer(
      (s: State, ns: Partial<State>): State => ({ ...s, ...ns }),
      {
        Error: "",
        ApplicationTransactions: [],
        SAPModuleList: [],
        SAPSubModuleList: [],
        SAPTcodeList: [],
        loadingTcodes: false,
        ViewAppDetails: false,
        SearchQuery: "",
        CurrentPage: 1,
        TotalRecords: 0,
        IsLoading: true,
        showToast: false,
        SavingLoader: false,
        isDataExist: "",
        FilterObj: {
          Module: "",
          SubModule: "",
        },
        editingRows: {},
        newRows: [],
        rowErrors: {},
        pillItems: [
          { key: 'TransactionInfo', label: 'Transaction Info' },
          { key: 'TransactionFields', label: 'Transaction Fields' },
        ] as const,
        CurrPillActive: "TransactionInfo"
      } as State
  );

  const didFetchData = useRef<boolean>(false);
  useEffect(() => {
    if (didFetchData.current) return;
    didFetchData.current = true;

    const init = async () => {
      setState({ IsLoading: true });
      await getData("");
      await GetSAPModulesMaster("");
      await GetSAPTcodeList();
      setState({ IsLoading: false });
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const GetSAPTcodeList = async () => {
    try {
      setState({ loadingTcodes: true });
      const resp: any = await apiRequest("/GetSAPTcodeList", {});
      const list: TcodeOption[] = (resp?.ResponseData || []).map((r: any) => {
        const code: string = r.TransactionCode ?? r.Code ?? "";
        const desc: string = r.Description ?? r.Desc ?? "";
        const tx: string = r.Transaction ?? r.ScreenName ?? r.Name ?? "";
        return {
          value: code,
          label: desc ? `${code} - ${desc}` : code,
          __raw: r,
          __autoTransaction: tx,
          __autoDescription: desc,
        };
      });
      setState({ SAPTcodeList: list, loadingTcodes: false });
    } catch (err) {
      console.error("Error loading SAP Tcodes:", err);
      setState({ loadingTcodes: false });
    }
  };

  const handleRowDropdownChange = (
      val: string,
      option: TcodeOption,
      name: string,
      item: TableRow
  ) => {
    const autoTx = option?.__autoTransaction ?? "";
    const autoDesc = option?.__autoDescription ?? "";

    if ((item as NewRow).isNew) {
      const updatedNewRows = state.newRows.map(row => {
        if (row.tempId === (item as NewRow).tempId) {
          return {
            ...row,
            [name]: val,
            Transaction: autoTx,
            Description: autoDesc,
          };
        }
        return row;
      });
      setState({ newRows: updatedNewRows });
    } else {
      const updatedTransactions = state.ApplicationTransactions.map(t => {
        if (t.ApplicationId === (item as ExistingRow).ApplicationId) {
          return {
            ...t,
            [name]: val,
            Transaction: autoTx,
            Description: autoDesc,
          } as ExistingRow;
        }
        return t;
      });
      setState({ ApplicationTransactions: updatedTransactions });
    }
  };

  const GetSAPModulesMaster = async (_: string) => {
    try {
      const resp: any = await apiRequest("/GetSAPModulesMaster", {});
      setState({
        SAPModuleList: resp.ResponseData,
      });
    } catch (err) {
      console.error("Error loading Country/State/City:", err);
    }
  };

  const GetSAPSubModulesMasterByModule = async (Module: string = "") => {
    try {
      const resp: any = await apiRequest("/GetSAPSubModulesMasterByModule", { Module });
      setState({
        SAPSubModuleList: resp.ResponseData,
      });
    } catch (err) {
      console.error("Error loading Country/State/City:", err);
    }
  };

  const getData = async (
      SearchQuery: string = "",
      PageNo: number = 1,
      FilterObj: FilterObj = { Module: "", SubModule: "" }
  ) => {
    try {
      const resp: any = await apiRequest("/GetApplicationTransactionsMasterPaginationFilterSearchV2", {
        PageNo,
        StartDate: "",
        EndDate: "",
        ApplicationName: props.CurrAppDetails.ApplicationName,
        Module: FilterObj.Module,
        SubModule: FilterObj.SubModule,
        SearchString: SearchQuery
      });
      if (resp.ResponseData.length > 0) {
        setState({ ApplicationTransactions: resp.ResponseData, TotalRecords: resp.TotalRecords });
      } else {
        setState({ ApplicationTransactions: [], TotalRecords: 0 });
      }
    } catch (err: any) {
      setState({ Error: err.toString() });
    } finally {
      setState({ IsLoading: false });
    }
  };

  const handleAddNew = () => {
    const newRow: NewRow = {
      ApplicationName: props.CurrAppDetails.ApplicationName,
      Transaction: "",
      TransactionCode: "",
      Description: "",
      isNew: true,
      tempId: Date.now()
    };
    setState({
      newRows: [...state.newRows, newRow],
      editingRows: {
        ...state.editingRows,
        [newRow.tempId]: true
      },
      rowErrors: {
        ...state.rowErrors,
        [newRow.tempId]: {}
      }
    });
  };

  const handleEdit = (item: TableRow) => {
    setState({
      editingRows: {
        ...state.editingRows,
        [item.isNew ? (item as NewRow).tempId : (item as ExistingRow).ApplicationIdTransactionId]: true
      },
      rowErrors: {
        ...state.rowErrors,
        [item.isNew ? (item as NewRow).tempId : (item as ExistingRow).ApplicationId]: {}
      }
    });
  };

  const debouncedSearchQuery = useDebounce<string>(state.SearchQuery, 300);
  const didSearchRun = useRef<boolean>(false);

  useEffect(() => {
    if (!didSearchRun.current) {
      didSearchRun.current = true;
      return;
    }
    if (debouncedSearchQuery.trim() === "") return;
    getData(debouncedSearchQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchQuery]);

  const handleCancelAll = () => {
    setState({
      editingRows: {},
      newRows: [],
      rowErrors: {}
    });
  };

  const validateAllRows = () => {
    const requiredFields = ["TransactionCode"] as const;
    const newRowErrors: RowErrors = {};
    let allValid = true;

    state.newRows.forEach(row => {
      const rowId = row.tempId;
      newRowErrors[rowId] = {};
      requiredFields.forEach(field => {
        if (!row[field]) {
          (newRowErrors[rowId] as Record<string, string>)[field] = "This field is required";
          allValid = false;
        }
      });
    });

    Object.keys(state.editingRows).forEach((idKey) => {
      const isExisting = typeof (idKey as unknown as string | number) === 'string';
      if (isExisting) {
        const row = state.ApplicationTransactions.find(t => t.ApplicationIdTransactionId === idKey);
        if (row) {
          newRowErrors[idKey] = {};
          requiredFields.forEach(field => {
            if (!row[field]) {
              (newRowErrors[idKey] as Record<string, string>)[field] = "This field is required";
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
          .filter(id => typeof id === 'string')
          .map(id => state.ApplicationTransactions.find(row => row.ApplicationIdTransactionId === id))
          .filter(Boolean) as ExistingRow[];

      const rowsToSend: Array<Record<string, unknown>> = [
        ...editedRows,
        ...state.newRows
      ];

      if (rowsToSend.length > 0) {
        await apiRequest("/AddUpdateApplicationTransactionsMasterV2", rowsToSend as any);
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

    } catch (error: any) {
      setState({ SavingLoader: false, Error: error.toString() });
    }
  };

  const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
      name: string,
      item: TableRow
  ) => {
    if ((item as NewRow).isNew) {
      const updatedNewRows = state.newRows.map(row => {
        if (row.tempId === (item as NewRow).tempId) {
          return { ...row, [name]: e.target.value };
        }
        return row;
      });
      setState({ newRows: updatedNewRows });
    } else {
      const updatedTransactions = state.ApplicationTransactions.map(t => {
        if (t.ApplicationId === (item as ExistingRow).ApplicationId) {
          return { ...t, [name]: e.target.value } as ExistingRow;
        }
        return t;
      });
      setState({ ApplicationTransactions: updatedTransactions });
    }
  };

  const handlePageChange = (page: number) => {
    setState({ CurrentPage: page });
    getData(state.SearchQuery, page, state.FilterObj);
  };

  const handleDeleteItem = async (item: TableRow) => {
    if (!item.isNew && (item as ExistingRow).ApplicationName) {
      const resp: any = await apiRequest("/DeleteApplicationTransactionsMasterV2", item as any);
      if (resp) {
        setState({ showToast: true });
        getData(state.SearchQuery, state.CurrentPage, state.FilterObj);
        setTimeout(() => {
          setState({ showToast: false });
        }, 3000);
      }
    } else {
      setState({
        newRows: state.newRows.filter(row => row.tempId !== (item as NewRow).tempId),
        editingRows: {
          ...state.editingRows,
          [(item as NewRow).tempId]: false
        },
        rowErrors: {
          ...state.rowErrors,
          [(item as NewRow).tempId]: undefined
        }
      });
    }
  };

  const handleViewClientDetails = (item: ExistingRow) => {
    setState({ ViewAppDetails: true, CurrAddEditDetails: item });
  };

  const handleCloseClientDetails = () => {
    setState({ ViewAppDetails: false });
    getData("", state.CurrentPage);
  };

  const handleSearch = (value: string) => {
    setState({ SearchQuery: value });
    if (value.trim() === "") {
      getData("", 1, state.FilterObj);
    }
  };

  const handleDropdownClientInfo = (
      val: string,
      _options: unknown,
      name: keyof FilterObj
  ) => {
    const FilterObj = { ...state.FilterObj };
    FilterObj[name] = val;
    setState({ FilterObj });
    if (name === "Module") {
      GetSAPSubModulesMasterByModule(FilterObj[name]);
    }
    getData(state.SearchQuery, state.CurrentPage, FilterObj);
  };

  const columns: TableColumn[] = [
    { title: 'Transaction Code', key: 'TransactionCode' },
    { title: 'Transaction', key: 'Transaction' },
    { title: 'Description', key: 'Description', className: 'min-w-[400px]' },
  ];

  const allRows: TableRow[] = [...state.newRows, ...state.ApplicationTransactions];

  const data: Array<Record<string, React.ReactNode>> = allRows.map((item) => {
    const rowId: string | number = (item as NewRow).isNew ? (item as NewRow).tempId : (item as ExistingRow).ApplicationIdTransactionId;
    const isEditing = state.editingRows[rowId];
    const errors = state.rowErrors[rowId] || {};

    if (isEditing) {
      return {
        TransactionCode: (
            <div>
              {/* OLD: kept for reference, do not remove
            <input
              onChange={(e) => handleChange(e, "TransactionCode", item)}
              value={item.TransactionCode}
              type="text"
              className={`w-full px-3 shadow text-[0.85rem] py-2 border ${errors.TransactionCode ? 'border-red-500' : 'border-gray-200'} rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="Enter Transaction Code"
              required
            />
            */}
              <Dropdown
                  mode="single"
                  options={state.SAPTcodeList}
                  value={(item as NewRow | ExistingRow).TransactionCode}
                  onChange={(val: string, option: TcodeOption) =>
                      handleRowDropdownChange(val, option, "TransactionCode", item)
                  }
                  onSearch={(q: string) => console.log("Search Tcodes:", q)}
                  placeholder="Select Transaction Code"
                  loading={state.loadingTcodes}
                  searchable={true}
                  className={`w-full ${(errors as Record<string, string>).TransactionCode ? 'border-red-500' : 'border-gray-200'}`}
              />
              {(errors as Record<string, string>).TransactionCode &&
                  <div className="flex items-center mt-1 ml-2">
                    <CircleAlert size={14} className="text-red-500" />
                    <p className="ml-2 text-red-500 text-sm">{(errors as Record<string, string>).TransactionCode}</p>
                  </div>
              }
            </div>
        ),
        Transaction: (
            <div>
              <input
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(e, "Transaction", item)}
                  value={(item as NewRow | ExistingRow).Transaction}
                  type="text"
                  className={`w-full px-3 shadow text-[0.85rem] py-2 border ${(errors as Record<string, string>).Transaction ? 'border-red-500' : 'border-gray-200'} rounded-md bg-[#f0f0f0] cursor-not-allowed`}
                  placeholder="Enter Screen Name"
                  required
                  readOnly
              />
              {(errors as Record<string, string>).Transaction &&
                  <div className="flex items-center mt-1 ml-2">
                    <CircleAlert size={14} className="text-red-500" />
                    <p className="ml-2 text-red-500 text-sm">{(errors as Record<string, string>).Transaction}</p>
                  </div>
              }
            </div>
        ),
        Description: (
            <textarea
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange(e, "Description", item)}
                value={(item as NewRow | ExistingRow).Description}
                rows={3}
                className={`w-full px-3 shadow text-[0.85rem] py-2 border ${(errors as Record<string, string>).Description ? 'border-red-500' : 'border-gray-200'} rounded-md bg-[#f0f0f0] cursor-not-allowed`}
                placeholder="Enter Description"
                readOnly
            />
        ),
        actions: (
            <div className="relative flex items-center">
              <ConfirmPopup
                  message="Are you sure you want to delete this item?"
                  onConfirm={() => handleDeleteItem(item)}
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
      Module: (item as ExistingRow).Module,
      TransactionCode: (item as ExistingRow).TransactionCode,
      Transaction: (item as ExistingRow).Transaction,
      Description: (item as ExistingRow).Description,
      actions: (
          <div className="relative flex items-center">
            <button
                onClick={() => handleViewClientDetails(item as ExistingRow)}
                className="bg-[#0071E9] cursor-pointer text-gray-50 px-3 py-1 rounded text-sm"
            >
              Tables
            </button>
            <button
                onClick={() => handleEdit(item)}
                className="ml-2 text-white px-3 py-1 rounded text-sm"
            >
              <SquarePen className="text-[#1A1A1A] cursor-pointer" />
            </button>
            <ConfirmPopup
                message="Are you sure you want to delete this item?"
                onConfirm={() => handleDeleteItem(item)}
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

  if (state.IsLoading) {
    return (
        <div className="h-96 py-20">
          <Spinner size="lg" color="blue-500" text="Fetching data..." />
        </div>
    );
  }
  if (state.Error) return <ErrorScreen message={state.Error} />;

  return (
      <div className="pt-0 pb-6 px-6">
        {state.ViewAppDetails ? (
            <div>
              <div className="flex items-center justify-between pb-4 pt-2">
                <div
                    onClick={handleCloseClientDetails}
                    className="flex items-center cursor-pointer bg-[#f3f3f3]  w-fit px-4 py-0.5 rounded-full"
                >
                  <ChevronLeft size={17} className="text-[#891be9]" />
                  <span className="font-medium text-[0.86rem] text-[#891be9]"> Back to Transactions</span>
                </div>
                <p className="ml-0 font-semibold text-lg text-gray-700">
                  {(state.CurrAddEditDetails as ExistingRow)?.Transaction} - Tables
                </p>
                <div></div>
              </div>
              <TransactionTablesMaster CurrAddEditDetails={state.CurrAddEditDetails} />
            </div>
        ) : (
            <>
              <Toast
                  message="Saved successfully!"
                  show={state.showToast}
                  onClose={() => setState({ showToast: false })}
              />
              <div className="flex justify-between items-center pb-4">
                <div className="w-1/3">
                  <SearchBar currentValue={state.SearchQuery} onSearch={handleSearch} size="medium" />
                </div>

                <div className="flex w-full gap-5 ml-10">
                  <div className="w-[20%]">
                    <p className="text-[0.80rem] font-semibold">Module</p>
                    <Dropdown
                        size="small"
                        mode="single"
                        options={state.SAPModuleList}
                        value={state.FilterObj.Module}
                        onChange={(val: string, item: unknown) => handleDropdownClientInfo(val, item, "Module")}
                        onSearch={(q: string) => console.log("Search (Multi):", q)}
                    />
                  </div>

                  <div className="w-[20%]">
                    <p className="text-[0.80rem] font-semibold">Sub Module</p>
                    <Dropdown
                        size="small"
                        mode="single"
                        options={state.SAPSubModuleList}
                        value={state.FilterObj.SubModule}
                        onChange={(val: string, item: unknown) => handleDropdownClientInfo(val, item, "SubModule")}
                        onSearch={(q: string) => console.log("Search (Multi):", q)}
                    />
                  </div>
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
                              <Spinner size="xs" color="white" />
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

              <CustomTable columns={columns as unknown as any[]} data={data as unknown as any[]} responsive={true} />

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
      </div>
  );
}
