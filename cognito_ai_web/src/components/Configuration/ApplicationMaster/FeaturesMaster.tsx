import React, { useEffect, useReducer, useRef } from 'react';
import CustomTable from '../../../utils/CustomTable';
import { CircleAlert, Plus, Save, Trash2, X, SquarePen } from 'lucide-react';
import { apiRequest } from '../../../utils/helpers/ApiHelper';
import Spinner from '../../../utils/Spinner';
import ErrorScreen from '../../../utils/ErrorScreen';
import Pagination from '../../../utils/Pagination';
import Toast from '../../../utils/Toast';
import ConfirmPopup from '../../../utils/ConfirmPopup';
import useDebounce from '../../../utils/helpers/useDebounce';

interface FeatureItem {
  FeatureId: string;
  Feature: string;
  Description: string;
  [key: string]: any;
}

interface NewRow {
  FeatureId: '';
  Feature: string;
  Description: string;
  isNew: true;
  tempId: number;
  [key: string]: any;
}

type AnyRow = FeatureItem | NewRow;

interface State {
  Error: string;
  FeaturesMaster: FeatureItem[];
  TransactionsMasterList: any[];
  ViewAppDetails: boolean;
  SearchQuery: string;
  CurrentPage: number;
  TotalRecords: number;
  IsLoading: boolean;
  showToast: boolean;
  SavingLoader: boolean;
  isDataExist: string;
  editingRows: Record<string | number, boolean>;
  newRows: NewRow[];
  rowErrors: Record<string | number, Record<string, string> | undefined>;
  CurrAddEditDetails?: any;
}

type Props = {
  children?: React.ReactNode;
};

type Column = { title: string; key: string; className?: string };

export default function FeaturesMaster(_props: Props) {
  const initialState: State = {
    Error: '',
    FeaturesMaster: [],
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
    rowErrors: {}
  };

  const [state, setState] = useReducer((s: State, ns: Partial<State>): State => ({ ...s, ...ns }), initialState);

  const didFetchData = useRef<boolean>(false);
  useEffect(() => {
    if (didFetchData.current) return;
    didFetchData.current = true;

    const init = async () => {
      setState({ IsLoading: true });
      await getData('');
      await getTransactionsMasterList('');
      setState({ IsLoading: false });
    };

    init();
  }, []);

  const getTransactionsMasterList = async (SearchString: string = ''): Promise<void> => {
    try {
      const resp: any = await apiRequest('/GetTransactionsMaster', { SearchString });
      setState({
        TransactionsMasterList: resp.ResponseData
      });
    } catch (err) {
      console.error('Error loading Country/State/City:', err);
    }
  };

  const getData = async (SearchQuery: string = '', PageNo: number = 1): Promise<void> => {
    try {
      const resp: any = await apiRequest('/GetFeaturesMasterPaginationFilterSearch', {
        PageNo,
        StartDate: '',
        EndDate: '',
        SearchString: SearchQuery
      });
      if (resp.ResponseData.length > 0) {
        setState({ FeaturesMaster: resp.ResponseData, TotalRecords: resp.TotalRecords });
      } else {
        setState({ FeaturesMaster: [], TotalRecords: 0 });
      }
    } catch (err: unknown) {
      setState({ Error: (err as any).toString() });
    } finally {
      setState({ IsLoading: false });
    }
  };

  const handleAddNew = (): void => {
    const newRow: NewRow = {
      FeatureId: '',
      Feature: '',
      Description: '',
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

  const handleEdit = (item: AnyRow): void => {
    setState({
      editingRows: {
        ...state.editingRows,
        [(item as NewRow).isNew ? (item as NewRow).tempId : (item as FeatureItem).FeatureId]: true
      },
      rowErrors: {
        ...state.rowErrors,
        [(item as NewRow).isNew ? (item as NewRow).tempId : (item as FeatureItem).FeatureId]: {}
      }
    });
  };

  const handleCancelAll = (): void => {
    setState({
      editingRows: {},
      newRows: [],
      rowErrors: {}
    });
  };

  const validateAllRows = (): boolean => {
    const requiredFields = ['Feature'];
    const newRowErrors: Record<string | number, Record<string, string>> = {};
    let allValid = true;

    state.newRows.forEach((row) => {
      const rowId = row.tempId;
      newRowErrors[rowId] = {};

      requiredFields.forEach((field) => {
        if (!(row as any)[field]) {
          newRowErrors[rowId][field] = 'This field is required';
          allValid = false;
        }
      });
    });

    Object.keys(state.editingRows).forEach((id) => {
      if (typeof id === 'string') {
        const row = state.FeaturesMaster.find((t) => t.FeatureId === id);
        if (row) {
          newRowErrors[id] = {};
          requiredFields.forEach((field) => {
            if (!(row as any)[field]) {
              newRowErrors[id][field] = 'This field is required';
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
          .filter((id) => typeof id === 'string')
          .map((id) => state.FeaturesMaster.find((row) => row.FeatureId === id))
          .filter(Boolean) as FeatureItem[];

      const rowsToSend: any[] = [...editedRows, ...state.newRows];

      if (rowsToSend.length > 0) {
        await apiRequest('/AddUpdateFeaturesMaster', rowsToSend);
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
    } catch (error: unknown) {
      setState({ SavingLoader: false, Error: (error as any).toString() });
    }
  };

  const debouncedSearchQuery = useDebounce(state.SearchQuery, 300) as string;
  const didSearchRun = useRef<boolean>(false);

  useEffect(() => {
    if (!didSearchRun.current) {
      didSearchRun.current = true;
      return;
    }
    if (debouncedSearchQuery.trim() === '') return;

    getData(debouncedSearchQuery);
  }, [debouncedSearchQuery]);

  const handleDropdownClientInfo = (
      val: string | number | Array<string | number>,
      _options: any,
      name: string,
      item: AnyRow
  ): void => {
    if ((item as NewRow).isNew) {
      const updatedNewRows = state.newRows.map((row) => {
        if (row.tempId === (item as NewRow).tempId) {
          return { ...row, [name]: val };
        }
        return row;
      });
      setState({ newRows: updatedNewRows });
    } else {
      const updatedTransactions = state.FeaturesMaster.map((t) => {
        if (t.FeatureId === (item as FeatureItem).FeatureId) {
          return { ...t, [name]: val };
        }
        return t;
      });
      setState({ FeaturesMaster: updatedTransactions });
    }
  };

  const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
      name: string,
      item: AnyRow
  ): void => {
    if ((item as NewRow).isNew) {
      const updatedNewRows = state.newRows.map((row) => {
        if (row.tempId === (item as NewRow).tempId) {
          return { ...row, [name]: e.target.value };
        }
        return row;
      });
      setState({ newRows: updatedNewRows });
    } else {
      const updatedTransactions = state.FeaturesMaster.map((t) => {
        if (t.FeatureId === (item as FeatureItem).FeatureId) {
          return { ...t, [name]: e.target.value };
        }
        return t;
      });
      setState({ FeaturesMaster: updatedTransactions });
    }
  };

  const handlePageChange = (page: number): void => {
    setState({ CurrentPage: page });
    getData(state.SearchQuery, page);
  };

  const handleDeleteItem = async (item: AnyRow): Promise<void> => {
    if ((item as FeatureItem).FeatureId) {
      const resp: any = await apiRequest('/DeleteFeaturesMaster', item);
      if (resp) {
        setState({ showToast: true });
        getData();
        setTimeout(() => {
          setState({ showToast: false });
        }, 3000);
      }
    } else {
      setState({
        newRows: state.newRows.filter((row) => row.tempId !== (item as NewRow).tempId),
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

  const handleViewClientDetails = (item: any): void => {
    setState({ ViewAppDetails: true, CurrAddEditDetails: item });
  };

  const handleCloseClientDetails = (): void => {
    setState({ ViewAppDetails: false });
    getData();
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setState({ SearchQuery: value });
    if (value.trim() === '') {
      getData('');
    }
  };

  const columns: Column[] = [
    { title: 'Feature', key: 'Feature' },
    { title: 'Description', key: 'Description' }
  ];

  const allRows: AnyRow[] = [...state.newRows, ...state.FeaturesMaster];

  const data = allRows.map((item: AnyRow) => {
    const rowId = (item as NewRow).isNew ? (item as NewRow).tempId : (item as FeatureItem).FeatureId;
    const isEditing = state.editingRows[rowId];
    const errors = state.rowErrors[rowId] || {};

    if (isEditing) {
      return {
        Feature: (
            <div>
              <input
                  onChange={(e) => handleChange(e, 'Feature', item)}
                  value={(item as any).Feature}
                  type="text"
                  className={`w-full px-3 shadow text-[0.85rem] py-2 border ${
                      (errors as Record<string, string>).Feature ? 'border-red-500' : 'border-gray-200'
                  } rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Enter Screen Name"
                  required
              />
              {(errors as Record<string, string>).Feature && (
                  <div className="flex items-center mt-1 ml-2">
                    <CircleAlert size={14} className="text-red-500" />
                    <p className="ml-2 text-red-500 text-sm">{(errors as Record<string, string>).Feature}</p>
                  </div>
              )}
            </div>
        ),
        Description: (
            <div>
            <textarea
                onChange={(e) => handleChange(e, 'Description', item)}
                value={(item as any).Description}
                rows={3}
                className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter Description"
            />
            </div>
        ),
        actions: (
            <div className="relative flex items-center">
              <ConfirmPopup message="Are you sure you want to delete this item?" onConfirm={() => handleDeleteItem(item)}>
                <button className="pr-4 flex items-center">
                  <Trash2 className="text-[#1A1A1A] cursor-pointer" />
                </button>
              </ConfirmPopup>
            </div>
        )
      };
    }

    return {
      Feature: (item as any).Feature,
      Description: (item as any).Description,
      actions: (
          <div className="relative flex items-center">
            <button onClick={() => handleEdit(item)} className="ml-2 text-white px-3 py-1 rounded text-sm">
              <SquarePen className="text-[#1A1A1A] cursor-pointer" />
            </button>
            <ConfirmPopup message="Are you sure you want to delete this item?" onConfirm={() => handleDeleteItem(item)}>
              <button className="ml-2 pr-4 flex items-center">
                <Trash2 className="text-[#1A1A1A] cursor-pointer" />
              </button>
            </ConfirmPopup>
          </div>
      )
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
        <Toast message="Saved successfully!" show={state.showToast} onClose={() => setState({ showToast: false })} />

        <div className="flex justify-between items-center pb-4">
          <div className="flex items-center w-full max-w-md px-4 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg shadow-sm">
            <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
