import React, { useEffect, useReducer, useRef } from "react";
import CustomTable from "../../../utils/CustomTable";
import { CircleAlert, Plus, Save, Trash2, X, SquarePen } from "lucide-react";
import { apiRequest } from "../../../utils/helpers/ApiHelper";
import Spinner from "../../../utils/Spinner";
import ErrorScreen from "../../../utils/ErrorScreen";
import Pagination from "../../../utils/Pagination";
import Toast from "../../../utils/Toast";
import ConfirmPopup from "../../../utils/ConfirmPopup";
import useDebounceImport from "../../../utils/helpers/useDebounce";

type Props = {
  children?: React.ReactNode;
};

type ProgramRow = {
  ProgramId?: string;
  ProgramName: string;
  Description?: string;
  isNew?: boolean;
  tempId?: number;
  [k: string]: unknown;
};

type TransactionsMasterItem = Record<string, unknown>;

type GetTransactionsResponse = {
  ResponseData: TransactionsMasterItem[];
};

type GetProgramsResponse = {
  ResponseData: ProgramRow[];
  TotalRecords: number;
};

type State = {
  Error: string;
  ProgramsMaster: ProgramRow[];
  TransactionsMasterList: TransactionsMasterItem[];
  ViewAppDetails: boolean;
  SearchQuery: string;
  CurrentPage: number;
  TotalRecords: number;
  IsLoading: boolean;
  showToast: boolean;
  SavingLoader: boolean;
  isDataExist: string;
  editingRows: Record<string | number, boolean>;
  newRows: ProgramRow[];
  rowErrors: Partial<Record<string | number, Record<string, string>>>;
  CurrAddEditDetails?: ProgramRow;
};

type DataRow = {
  ProgramName: React.ReactNode;
  Description: React.ReactNode;
  actions: React.ReactNode;
};

const useDebounce = useDebounceImport as <T>(value: T, delay: number) => T;
const apiReq = apiRequest as <TReq, TRes>(url: string, body: TReq) => Promise<TRes>;

export default function ProgramsMaster(_props: Props) {
  const [state, setState] = useReducer(
    (s: State, a: Partial<State>): State => ({ ...s, ...a }),
    {
      Error: "",
      ProgramsMaster: [],
      TransactionsMasterList: [],
      ViewAppDetails: false,
      SearchQuery: "",
      CurrentPage: 1,
      TotalRecords: 0,
      IsLoading: true,
      showToast: false,
      SavingLoader: false,
      isDataExist: "",
      editingRows: {},
      newRows: [],
      rowErrors: {},
    }
  );

  const didFetchData = useRef<boolean>(false);
  useEffect(() => {
    if (didFetchData.current) return;
    didFetchData.current = true;

    const init = async (): Promise<void> => {
      setState({ IsLoading: true });
      await void getData("");
      await void getTransactionsMasterList("");
      setState({ IsLoading: false });
    };

    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getTransactionsMasterList = async (SearchString: string = ""): Promise<void> => {
    try {
      const resp = await apiReq<{ SearchString: string }, GetTransactionsResponse>("/GetTransactionsMaster", {
        SearchString,
      });
      setState({
        TransactionsMasterList: resp.ResponseData,
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error loading transactions:", err);
    }
  };

  const getData = async (SearchQuery: string = "", PageNo: number = 1): Promise<void> => {
    try {
      const resp = await apiReq<
        { PageNo: number; StartDate: string; EndDate: string; SearchString: string },
        GetProgramsResponse
      >("/GetProgramsMasterPaginationFilterSearch", {
        PageNo,
        StartDate: "",
        EndDate: "",
        SearchString: SearchQuery,
      });
      if (resp.ResponseData.length > 0) {
        setState({ ProgramsMaster: resp.ResponseData, TotalRecords: resp.TotalRecords });
      } else {
        setState({ ProgramsMaster: [], TotalRecords: 0 });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setState({ Error: message });
    } finally {
      setState({ IsLoading: false });
    }
  };

  const handleAddNew = (): void => {
    const newRow: ProgramRow = {
      ProgramId: "",
      ProgramName: "",
      Description: "",
      isNew: true,
      tempId: Date.now(),
    };
    setState({
      newRows: [...state.newRows, newRow],
      editingRows: {
        ...state.editingRows,
        [newRow.tempId!]: true,
      },
      rowErrors: {
        ...state.rowErrors,
        [newRow.tempId!]: {},
      },
    });
  };

  const handleEdit = (item: ProgramRow): void => {
    setState({
      editingRows: {
        ...state.editingRows,
        [item.isNew ? (item.tempId as number) : (item.ProgramId as string)]: true,
      },
      rowErrors: {
        ...state.rowErrors,
        [item.isNew ? (item.tempId as number) : (item.ProgramId as string)]: {},
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
    const requiredFields: Array<keyof Pick<ProgramRow, "ProgramName">> = ["ProgramName"];
    const newRowErrors: Partial<Record<string | number, Record<string, string>>> = {};
    let allValid = true;

    state.newRows.forEach((row) => {
      const rowId = row.tempId as number;
      newRowErrors[rowId] = {};
      requiredFields.forEach((field) => {
        const v = row[field];
        if (!v) {
          (newRowErrors[rowId] as Record<string, string>)[field] = "This field is required";
          allValid = false;
        }
      });
    });

    Object.keys(state.editingRows).forEach((id) => {
      if (typeof id === "string") {
        const row = state.ProgramsMaster.find((t) => t.ProgramId === id);
        if (row) {
          newRowErrors[id] = {};
          requiredFields.forEach((field) => {
            const v = row[field];
            if (!v) {
              (newRowErrors[id] as Record<string, string>)[field] = "This field is required";
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
        .map((id) => state.ProgramsMaster.find((row) => row.ProgramId === id))
        .filter((r): r is ProgramRow => Boolean(r));

      const rowsToSend: ProgramRow[] = [...editedRows, ...state.newRows];

      if (rowsToSend.length > 0) {
        await apiReq("/AddUpdateProgramsMaster", rowsToSend);
      }

      setState({
        SavingLoader: false,
        showToast: true,
        editingRows: {},
        newRows: [],
        rowErrors: {},
      });

      await void getData();
      setTimeout(() => setState({ showToast: false }), 3000);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setState({ SavingLoader: false, Error: message });
    }
  };

  const debouncedSearchQuery = useDebounce<string>(state.SearchQuery, 300);
  const didSearchRun = useRef<boolean>(false);

  useEffect(() => {
    if (!didSearchRun.current) {
      didSearchRun.current = true;
      return;
    }
    if (debouncedSearchQuery.trim() === "") return;
    void getData(debouncedSearchQuery);
  }, [debouncedSearchQuery]);

  const handleDropdownClientInfo = <K extends keyof ProgramRow>(
    val: ProgramRow[K],
    _options: unknown,
    name: K,
    item: ProgramRow
  ): void => {
    if (item.isNew) {
      const updatedNewRows = state.newRows.map((row) => {
        if (row.tempId === item.tempId) {
          return { ...row, [name]: val };
        }
        return row;
      });
      setState({ newRows: updatedNewRows });
    } else {
      const updated = state.ProgramsMaster.map((t) => {
        if (t.ProgramId === item.ProgramId) {
          return { ...t, [name]: val };
        }
        return t;
      });
      setState({ ProgramsMaster: updated });
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    name: keyof ProgramRow,
    item: ProgramRow
  ): void => {
    if (item.isNew) {
      const updatedNewRows = state.newRows.map((row) => {
        if (row.tempId === item.tempId) {
          return { ...row, [name]: e.target.value };
        }
        return row;
      });
      setState({ newRows: updatedNewRows });
    } else {
      const updatedPrograms = state.ProgramsMaster.map((t) => {
        if (t.ProgramId === item.ProgramId) {
          return { ...t, [name]: e.target.value };
        }
        return t;
      });
      setState({ ProgramsMaster: updatedPrograms });
    }
  };

  const handlePageChange = (page: number): void => {
    setState({ CurrentPage: page });
    void getData(state.SearchQuery, page);
  };

  const handleDeleteItem = async (item: ProgramRow): Promise<void> => {
    if (item.ProgramId) {
      const resp = await apiReq<ProgramRow, unknown>("/DeleteProgramsMaster", item);
      if (resp) {
        setState({ showToast: true });
        void getData();
        setTimeout(() => {
          setState({ showToast: false });
        }, 3000);
      }
    } else {
      setState({
        newRows: state.newRows.filter((row) => row.tempId !== item.tempId),
        editingRows: {
          ...state.editingRows,
          [item.tempId as number]: false,
        },
        rowErrors: {
          ...state.rowErrors,
          [item.tempId as number]: undefined,
        },
      });
    }
  };

  const handleViewClientDetails = (item: ProgramRow): void => {
    setState({ ViewAppDetails: true, CurrAddEditDetails: item });
  };

  const handleCloseClientDetails = (): void => {
    setState({ ViewAppDetails: false });
    void getData();
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setState({ SearchQuery: value });
    if (value.trim() === "") {
      void getData("");
    }
  };

  if (state.IsLoading)
    return (
      <div className="h-96 py-20">
        <Spinner size="lg" color="blue-500" text="Fetching data..." />
      </div>
    );
  if (state.Error) return <ErrorScreen message={state.Error} />;

  const columns: ReadonlyArray<{ title: string; key: keyof DataRow | string }> = [
    { title: "ProgramName", key: "ProgramName" },
    { title: "Description", key: "Description" },
  ];

  const allRows: ProgramRow[] = [...state.newRows, ...state.ProgramsMaster];

  const data: DataRow[] = allRows.map((item) => {
    const rowId = item.isNew ? (item.tempId as number) : (item.ProgramId as string);
    const isEditing = !!state.editingRows[rowId];
    const errors = state.rowErrors[rowId] ?? {};

    if (isEditing) {
      return {
        ProgramName: (
          <div>
            <input
              onChange={(e) => handleChange(e, "ProgramName", item)}
              value={item.ProgramName}
              type="text"
              className={`w-full px-3 shadow text-[0.85rem] py-2 border ${
                (errors as Record<string, string>).ProgramName ? "border-red-500" : "border-gray-200"
              } rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="Enter Screen Name"
              required
            />
            {(errors as Record<string, string>).ProgramName && (
              <div className="flex items-center mt-1 ml-2">
                <CircleAlert size={14} className="text-red-500" />
                <p className="ml-2 text-red-500 text-sm">{(errors as Record<string, string>).ProgramName}</p>
              </div>
            )}
          </div>
        ),
        Description: (
          <div>
            <textarea
              onChange={(e) => handleChange(e, "Description", item)}
              value={item.Description}
              rows={3}
              className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter Description"
            />
          </div>
        ),
        actions: (
          <div className="relative flex items-center">
            <ConfirmPopup message="Are you sure you want to delete this item?" onConfirm={() => void handleDeleteItem(item)}>
              <button className="pr-4 flex items-center">
                <Trash2 className="text-[#1A1A1A] cursor-pointer" />
              </button>
            </ConfirmPopup>
          </div>
        ),
      };
    }

    return {
      ProgramName: item.ProgramName,
      Description: item.Description ?? "",
      actions: (
        <div className="relative flex items-center">
          <button onClick={() => handleEdit(item)} className="ml-2 text-white px-3 py-1 rounded text-sm">
            <SquarePen className="text-[#1A1A1A] cursor-pointer" />
          </button>
          <ConfirmPopup message="Are you sure you want to delete this item?" onConfirm={() => void handleDeleteItem(item)}>
            <button className="ml-2 pr-4 flex items-center">
              <Trash2 className="text-[#1A1A1A] cursor-pointer" />
            </button>
          </ConfirmPopup>
        </div>
      ),
    };
  });

  const hasEdits = Object.keys(state.editingRows).length > 0 || state.newRows.length > 0;

  return (
    <div className="pt-0 pb-6 px-6">
      <Toast message="Saved successfully!" show={state.showToast} onClose={() => setState({ showToast: false })} />

      <div className="flex justify-between items-center pb-4">
        <div className="flex items-center w-full max-w-md px-4 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg shadow-sm">
          <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"
            />
          </svg>
          <input
            onChange={handleSearch}
            value={state.SearchQuery}
            type="text"
            placeholder="Search"
            className="ml-3 text-[0.89rem] text bg-transparent outline-none placeholder-gray-500 w-full"
          />
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

      <CustomTable columns={columns as unknown as Record<string, unknown>} data={data} responsive={true} />

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
