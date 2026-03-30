import React, { useEffect, useReducer, useRef } from 'react';
import CustomTable from '../../../utils/CustomTable';
import { ChevronLeft, CircleAlert, Plus, Save, Trash2, X, SquarePen } from 'lucide-react';
import { apiRequest } from '../../../utils/helpers/ApiHelper';
import Spinner from '../../../utils/Spinner';
import ErrorScreen from '../../../utils/ErrorScreen';
import Pagination from '../../../utils/Pagination';
import Toast from '../../../utils/Toast';
import ConfirmPopup from '../../../utils/ConfirmPopup';
import TransactionFieldsMaster from './TransactionFieldsMaster';
import Dropdown from '../../../utils/Dropdown';

type YesNo = 'Yes' | 'No';

interface TransactionFlowItem {
  TransactionsFlowId: string;
  PreTransactionId: string[] | string;
  NextTransactionId: string[] | string;
  PreTransaction?: string;
  NextTransaction?: string;
  [key: string]: unknown;
}

interface NewTransactionFlowRow {
  TransactionsFlowId: string;
  PreTransactionId: string[] | string;
  NextTransactionId: string[] | string;
  isNew: true;
  tempId: number;
}

type AnyRow = TransactionFlowItem | NewTransactionFlowRow;

interface GetTransactionsFlowResponse {
  ResponseData: TransactionFlowItem[];
  TotalRecords: number;
}

interface GetTransactionsMasterResponse {
  ResponseData: unknown[];
}

type RowErrorMap = Record<string, string>;
type RowErrors = Record<string | number, RowErrorMap | undefined>;

interface State {
  Error: string;
  TransactionMapingMaster: TransactionFlowItem[];
  TransactionsMasterList: unknown[];
  ViewAppDetails: boolean;
  SearchQuery: string;
  CurrentPage: number;
  TotalRecords: number;
  IsLoading: boolean;
  showToast: boolean;
  SavingLoader: boolean;
  isDataExist: string;
  editingRows: Record<string | number, boolean>;
  newRows: NewTransactionFlowRow[];
  rowErrors: RowErrors;
  pillItems: ReadonlyArray<{ key: 'TransactionInfo' | 'TransactionFields'; label: string }>;
  CurrPillActive: 'TransactionInfo' | 'TransactionFields';
  CurrAddEditDetails?: TransactionFlowItem;
}

type Props = {
  children?: React.ReactNode;
};

interface TableColumn {
  title: string;
  key: string;
}

export default function TransactionMapingMaster(_: Props) {
  const initialState: State = {
    Error: '',
    TransactionMapingMaster: [],
    TransactionsMasterList: [],
    ViewAppDetails: false,
    SearchQuery: '',
    CurrentPage: 1,
    TotalRecords: 0,
    IsLoading: true,
    showToast: false,
    SavingLoader: false,
    isDataExist: '',
    editingRows: {},
    newRows: [],
    rowErrors: {},
    pillItems: [
      { key: 'TransactionInfo', label: 'Transaction Info' },
      { key: 'TransactionFields', label: 'Transaction Fields' },
    ] as const,
    CurrPillActive: 'TransactionInfo',
  };

  const [state, setState] = useReducer(
    (prev: State, next: Partial<State>): State => ({ ...prev, ...next }),
    initialState
  );

  const didFetchData = useRef<boolean>(false);
  useEffect((): void => {
    if (didFetchData.current) return;
    didFetchData.current = true;

    const init = async (): Promise<void> => {
      setState({ IsLoading: true });
      await getData('');
      await getTransactionsMasterList('');
      setState({ IsLoading: false });
    };

    void init();
  }, []);

  const getTransactionsMasterList = async (SearchString = ''): Promise<void> => {
    try {
      const resp = (await apiRequest('/GetTransactionsMaster', { SearchString })) as GetTransactionsMasterResponse;
      setState({
        TransactionsMasterList: resp.ResponseData,
      });
    } catch (_err) {
      // eslint-disable-next-line no-console
      console.error('Error loading transactions master list:', _err);
    }
  };

  const getData = async (SearchQuery = '', PageNo = 1): Promise<void> => {
    try {
      const resp = (await apiRequest('/GetTransactionsFlowMasterPaginationFilterSearch', {
        PageNo,
        StartDate: '',
        EndDate: '',
        SearchString: SearchQuery,
      })) as GetTransactionsFlowResponse;
      if (resp.ResponseData.length > 0) {
        setState({ TransactionMapingMaster: resp.ResponseData, TotalRecords: resp.TotalRecords });
      } else {
        setState({ TransactionMapingMaster: [], TotalRecords: 0 });
      }
    } catch (err: unknown) {
      setState({ Error: err instanceof Error ? err.message : String(err) });
    } finally {
      setState({ IsLoading: false });
    }
  };

  const handleAddNew = (): void => {
    const newRow: NewTransactionFlowRow = {
      PreTransactionId: [],
      TransactionsFlowId: '',
      NextTransactionId: [],
      isNew: true,
      tempId: Date.now(),
    };
    setState({
      newRows: [...state.newRows, newRow],
      editingRows: {
        ...state.editingRows,
        [newRow.tempId]: true,
      },
      rowErrors: {
        ...state.rowErrors,
        [newRow.tempId]: {},
      },
    });
  };

  const handleEdit = (item: AnyRow): void => {
    const key = 'isNew' in item && item.isNew ? item.tempId : (item as TransactionFlowItem).TransactionsFlowId;
    setState({
      editingRows: {
        ...state.editingRows,
        [key]: true,
      },
      rowErrors: {
        ...state.rowErrors,
        [key]: {},
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
    const requiredFields: Array<'PreTransactionId' | 'NextTransactionId'> = ['PreTransactionId', 'NextTransactionId'];
    const newRowErrors: RowErrors = {};
    let allValid = true;

    state.newRows.forEach((row) => {
      const rowId = row.tempId;
      newRowErrors[rowId] = {};
      requiredFields.forEach((field) => {
        const val = row[field];
        const isEmptyArray = Array.isArray(val) && val.length === 0;
        if (val === '' || val == null || isEmptyArray) {
          (newRowErrors[rowId] as RowErrorMap)[field] = 'This field is required';
          allValid = false;
        }
      });
    });

    Object.keys(state.editingRows).forEach((id) => {
      if (typeof id === 'string') {
        const row = state.TransactionMapingMaster.find((t) => t.TransactionsFlowId === id);
        if (row) {
          newRowErrors[id] = {};
          requiredFields.forEach((field) => {
            const val = row[field];
            const isEmptyArray = Array.isArray(val) && val.length === 0;
            if (val === '' || val == null || isEmptyArray) {
              (newRowErrors[id] as RowErrorMap)[field] = 'This field is required';
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
        .filter((id): id is string => typeof id === 'string')
        .map((id) => state.TransactionMapingMaster.find((row) => row.TransactionsFlowId === id))
        .filter(Boolean) as TransactionFlowItem[];

      const rowsToSend: (TransactionFlowItem | NewTransactionFlowRow)[] = [...editedRows, ...state.newRows];

      if (rowsToSend.length > 0) {
        await apiRequest('/AddUpdateTransactionsFlowMaster', rowsToSend);
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
    } catch (error: unknown) {
      setState({ SavingLoader: false, Error: error instanceof Error ? error.message : String(error) });
    }
  };

  const handleDropdownClientInfo = (
    val: unknown,
    _options: unknown,
    name: 'PreTransactionId' | 'NextTransactionId',
    item: AnyRow
  ): void => {
    if ('isNew' in item && item.isNew) {
      const updatedNewRows = state.newRows.map((row) => {
        if (row.tempId === item.tempId) {
          return { ...row, [name]: val as string[] | string };
        }
        return row;
      });
      setState({ newRows: updatedNewRows });
    } else {
      const updatedTransactions = state.TransactionMapingMaster.map((t) => {
        if (t.TransactionsFlowId === (item as TransactionFlowItem).TransactionsFlowId) {
          return { ...t, [name]: val as string[] | string };
        }
        return t;
      });
      setState({ TransactionMapingMaster: updatedTransactions });
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    name: string,
    item: AnyRow
  ): void => {
    const value = e.target.value;
    if ('isNew' in item && item.isNew) {
      const updatedNewRows = state.newRows.map((row) => {
        if (row.tempId === item.tempId) {
          return { ...row, [name]: value };
        }
        return row;
      });
      setState({ newRows: updatedNewRows });
    } else {
      const updatedTransactions = state.TransactionMapingMaster.map((t) => {
        if (t.TransactionsFlowId === (item as TransactionFlowItem).TransactionsFlowId) {
          return { ...t, [name]: value };
        }
        return t;
      });
      setState({ TransactionMapingMaster: updatedTransactions });
    }
  };

  const handlePageChange = (page: number): void => {
    setState({ CurrentPage: page });
    void getData(state.SearchQuery, page);
  };

  const handleDeleteItem = async (item: AnyRow): Promise<void> => {
    if (!('isNew' in item) && (item as TransactionFlowItem).TransactionsFlowId) {
      const resp = await apiRequest('/DeleteTransactionsFlowMaster', item);
      if (resp) {
        setState({ showToast: true });
        void getData();
        setTimeout(() => {
          setState({ showToast: false });
        }, 3000);
      }
    } else {
      const tempId = (item as NewTransactionFlowRow).tempId;
      setState({
        newRows: state.newRows.filter((row) => row.tempId !== tempId),
        editingRows: {
          ...state.editingRows,
          [tempId]: false,
        },
        rowErrors: {
          ...state.rowErrors,
          [tempId]: undefined,
        },
      });
    }
  };

  const handleViewClientDetails = (item: TransactionFlowItem): void => {
    setState({ ViewAppDetails: true, CurrAddEditDetails: item });
  };

  const handleCloseClientDetails = (): void => {
    setState({ ViewAppDetails: false });
    void getData();
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setState({ SearchQuery: value });
    if (value.trim() === '') {
      void getData('');
    }
  };

  const columns: ReadonlyArray<TableColumn> = [
    { title: 'Pre Transaction', key: 'PreTransactionId' },
    { title: 'Next Transaction', key: 'NextTransactionId' },
  ];

  const allRows: AnyRow[] = [...state.newRows, ...state.TransactionMapingMaster];

  const data = allRows.map((item) => {
    const rowId = 'isNew' in item && item.isNew ? item.tempId : (item as TransactionFlowItem).TransactionsFlowId;
    const isEditing = Boolean(state.editingRows[rowId]);
    const errors = (state.rowErrors[rowId] || {}) as RowErrorMap;

    if (isEditing) {
      return {
        PreTransactionId: (
          <div>
            <Dropdown
              mode="multiple"
              options={state.TransactionsMasterList}
              value={('PreTransactionId' in item ? item.PreTransactionId : []) as unknown}
              onChange={(val, option): void => handleDropdownClientInfo(val, option, 'PreTransactionId', item)}
              onSearch={(q: string): void => {
                // eslint-disable-next-line no-console
                console.log('Search (Multi):', q);
              }}
            />
            {errors.Transaction && (
              <div className="flex items-center mt-1 ml-2">
                <CircleAlert size={14} className="text-red-500" />
                <p className="ml-2 text-red-500 text-sm">{errors.Transaction}</p>
              </div>
            )}
          </div>
        ),
        NextTransactionId: (
          <div>
            <Dropdown
              mode="multiple"
              options={state.TransactionsMasterList}
              value={('NextTransactionId' in item ? item.NextTransactionId : []) as unknown}
              onChange={(val, option): void => handleDropdownClientInfo(val, option, 'NextTransactionId', item)}
              onSearch={(q: string): void => {
                // eslint-disable-next-line no-console
                console.log('Search (Multi):', q);
              }}
            />
            {errors.TransactionCode && (
              <div className="flex items-center mt-1 ml-2">
                <CircleAlert size={14} className="text-red-500" />
                <p className="ml-2 text-red-500 text-sm">{errors.TransactionCode}</p>
              </div>
            )}
          </div>
        ),
        actions: (
          <div className="relative flex items-center">
            <ConfirmPopup message="Are you sure you want to delete this item?" onConfirm={(): void => handleDeleteItem(item)}>
              <button className="pr-4 flex items-center">
                <Trash2 className="text-[#1A1A1A] cursor-pointer" />
              </button>
            </ConfirmPopup>
          </div>
        ),
      };
    }

    const existing = item as TransactionFlowItem;
    return {
      PreTransactionId: existing.PreTransaction,
      NextTransactionId: existing.NextTransaction,
      actions: (
        <div className="relative flex items-center">
          <button onClick={(): void => handleEdit(item)} className="ml-2 text-white px-3 py-1 rounded text-sm">
            <SquarePen className="text-[#1A1A1A] cursor-pointer" />
          </button>
          <ConfirmPopup message="Are you sure you want to delete this item?" onConfirm={(): void => handleDeleteItem(item)}>
            <button className="ml-2 pr-4 flex items-center">
              <Trash2 className="text-[#1A1A1A] cursor-pointer" />
            </button>
          </ConfirmPopup>
        </div>
      ),
    };
  });

  const hasEdits = Object.keys(state.editingRows).length > 0 || state.newRows.length > 0;

  if (state.IsLoading)
    return (
      <div className="h-96 py-20">
        <Spinner size="lg" color="blue-500" text="Fetching data..." />
      </div>
    );
  if (state.Error) return <ErrorScreen message={state.Error} />;

  return (
    <div className="pt-0 pb-6 px-6">
      {state.ViewAppDetails ? (
        <div>
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center cursor-pointer" onClick={handleCloseClientDetails}>
              <ChevronLeft className="text-gray-700" /> <span className="font-medium text-[#891be9]"> Back to Transactions</span>
            </div>
            <p className="ml-0 font-semibold text-lg text-gray-700">{state.CurrAddEditDetails?.Transaction as string} Fields</p>
            <div></div>
          </div>
          <TransactionFieldsMaster CurrAddEditDetails={state.CurrAddEditDetails as TransactionFlowItem} />
        </div>
      ) : (
        <>
          <Toast message="Saved successfully!" show={state.showToast} onClose={(): void => setState({ showToast: false })} />

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

          <CustomTable columns={columns} data={data} responsive={true} />

          {state.TotalRecords > 10 && (
            <div className="pt-4 flex justify-end">
              <Pagination total={state.TotalRecords} current={state.CurrentPage} pageSize={10} onChange={handlePageChange} showSizeChanger={false} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
