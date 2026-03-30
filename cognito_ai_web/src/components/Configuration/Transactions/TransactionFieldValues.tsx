import React, { useEffect, useReducer, useRef } from "react";
import CustomTable from "../../../utils/CustomTable";
import { CircleAlert, Plus, Save, SquarePen, Trash2, X } from "lucide-react";
import { apiRequest } from "../../../utils/helpers/ApiHelper";
import Spinner from "../../../utils/Spinner";
import ErrorScreen from "../../../utils/ErrorScreen";
import Pagination from "../../../utils/Pagination";
import Toast from "../../../utils/Toast";
import ConfirmPopup from "../../../utils/ConfirmPopup";
import Dropdown from "../../../utils/Dropdown";
import Modal from "../../../utils/Modal";

type EquivalenceClass = {
  EQClass: number;
  LowerLimit: number;
  LwLimitBVN: number;
  LwLimitBVP: number;
  UpperLimit: number;
  UPLimitBVN: number;
  UPLimitBVP: number;
};

interface Row {
  TransactionId?: string;
  FieldValueId?: string;
  FieldName?: string;
  TestingTechniqueId?: string;
  TestingTechnique?: string;
  FieldValue?: string;
  MarkedFlag?: "Yes" | "No";
  EquivalenceClasses?: EquivalenceClass[];
  tempId?: number;
  isNew?: boolean;
  LowerLimit?: number | string;
  UpperLimit?: number | string;
  FieldId?: string;
  [key: string]: any;
}

type EditMap = { [key: string]: boolean } & { [key: number]: boolean };
type ErrorMap = { [key: string]: Record<string, string> } & {
  [key: number]: Record<string, string>;
};

interface State {
  Error: string;
  TransactionFieldValues: Row[];
  FieldTypesMasterList: unknown[];
  TestingTechniquesList: unknown[];
  EqClassesBaundaryValues: EquivalenceClass[];
  ViewAppDetails: boolean;
  SearchQuery: string;
  CurrentPage: number;
  TotalRecords: number;
  openModal2: boolean;
  CurrEQ: Partial<Row>;
  IsLoading: boolean;
  showToast: boolean;
  SavingLoader: boolean;
  isDataExist: string;
  editingRows: EditMap;
  newRows: Row[];
  rowErrors: ErrorMap;
  pillItems: { key: string; label: string }[];
  CurrPillActive: string;
  CurrAddEditDetails?: CurrAddEditDetails;
}

interface CurrAddEditDetails {
  FieldName: string;
  TransactionId: string;
  [key: string]: unknown;
}

type Props = {
  CurrAddEditDetails:  CurrAddEditDetails;
  children?: React.ReactNode;
};

export default function TransactionFieldValues(props: Props) {
  const [state, setState] = useReducer(
      (s: State, ns: Partial<State>): State => ({ ...s, ...ns }),
      {
        Error: "",
        TransactionFieldValues: [],
        FieldTypesMasterList: [],
        TestingTechniquesList: [],
        EqClassesBaundaryValues: [],
        ViewAppDetails: false,
        SearchQuery: "",
        CurrentPage: 1,
        TotalRecords: 0,
        openModal2: false,
        CurrEQ: {},
        IsLoading: true,
        showToast: false,
        SavingLoader: false,
        isDataExist: "",
        editingRows: {} as EditMap,
        newRows: [],
        rowErrors: {} as ErrorMap,
        pillItems: [
          { key: "TransactionInfo", label: "TestingTechniqueId Info" },
          { key: "TransactionFields", label: "TestingTechniqueId Fields" },
        ],
        CurrPillActive: "TransactionInfo",
        CurrAddEditDetails: props.CurrAddEditDetails,
      }
  );

  const didFetchData = useRef<boolean>(false);

  useEffect(() => {
    if (didFetchData.current) return;
    didFetchData.current = true;

    const init = async () => {
      setState({ IsLoading: true });

      await Promise.all([getData(""), getGetTestingTechnicsList("")]);

      setState({ IsLoading: false });
    };

    init();
  }, []);

  const getGetTestingTechnicsList = async (
      _ApplicationId: string = "APID-5",
      _SearchString: string = ""
  ) => {
    try {
      const resp: any = await apiRequest("/testing/GetTestingTechniquesMaster", {});
      setState({
        TestingTechniquesList: resp.ResponseData,
      });
    } catch (err) {
      console.error("Error loading Country/State/City:", err);
    }
  };

  const getData = async (SearchQuery: string = "", PageNo: number = 1) => {
    try {
      const resp: any = await apiRequest(
          "/GetSAPTableFieldValuesMasterPaginationFilterSearchV2",
          {
            PageNo,
            StartDate: "",
            EndDate: "",
            FieldName: props.CurrAddEditDetails.FieldName,
            SearchString: SearchQuery,
          }
      );
      if (resp.ResponseData.length > 0) {
        setState({
          TransactionFieldValues: resp.ResponseData as Row[],
          TotalRecords: resp.TotalRecords as number,
        });
      } else {
        setState({ TransactionFieldValues: [], TotalRecords: 0 });
      }
    } catch (err) {
      setState({ Error: String(err) });
    } finally {
      setState({ IsLoading: false });
    }
  };

  const handleAddNew = () => {
    const newRow: Row = {
      TransactionId: props.CurrAddEditDetails.TransactionId,
      FieldValueId: "",
      FieldName: props.CurrAddEditDetails.FieldName,
      TestingTechniqueId: "",
      FieldValue: "",
      MarkedFlag: "No",
      isNew: true,
      EquivalenceClasses: [],
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

  const handleEdit = (item: Row) => {
    setState({
      editingRows: {
        ...state.editingRows,
        [item.isNew ? (item.tempId as number) : (item.FieldValueId as string)]: true,
      },
      rowErrors: {
        ...state.rowErrors,
        [item.isNew ? (item.tempId as number) : (item.FieldValueId as string)]: {},
      },
    });
  };

  const handleCancelAll = () => {
    setState({
      editingRows: {} as EditMap,
      newRows: [],
      rowErrors: {} as ErrorMap,
    });
  };

  const validateAllRows = () => {
    const requiredFields = ["TestingTechniqueId", "FieldValue"];
    const newRowErrors: ErrorMap = {} as ErrorMap;
    let allValid = true;

    state.newRows.forEach((row) => {
      const rowId = row.tempId as number;
      newRowErrors[rowId] = {};
      requiredFields.forEach((field) => {
        if (!row[field]) {
          newRowErrors[rowId][field] = "This field is required";
          allValid = false;
        }
      });
    });

    Object.keys(state.editingRows).forEach((id) => {
      if (typeof id === "string") {
        const row = state.TransactionFieldValues.find(
            (t) => t.FieldValueId === id
        );
        if (row) {
          newRowErrors[id] = {};
          requiredFields.forEach((field) => {
            if (!row[field]) {
              newRowErrors[id][field] = "This field is required";
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
          .filter((id) => typeof id === "string")
          .map((id) =>
              state.TransactionFieldValues.find((row) => row.FieldValueId === id)
          )
          .filter(Boolean) as Row[];

      const rowsToSend = [...editedRows, ...state.newRows];

      if (rowsToSend.length > 0) {
        await apiRequest("/AddUpdateSAPTableFieldValuesMasterV2", rowsToSend);
      }

      setState({
        SavingLoader: false,
        showToast: true,
        editingRows: {} as EditMap,
        newRows: [],
        rowErrors: {} as ErrorMap,
      });

      await getData();
      setTimeout(() => setState({ showToast: false }), 3000);
    } catch (error) {
      setState({ SavingLoader: false, Error: String(error) });
    }
  };

  const handleDropdownClientInfo = (
      val: string,
      _options: unknown,
      name: string,
      item: Row
  ) => {
    if (item.isNew) {
      const updatedNewRows = state.newRows.map((row) => {
        if (row.tempId === item.tempId) {
          return { ...row, [name]: val };
        }
        return row;
      });
      setState({ newRows: updatedNewRows });
    } else {
      const updatedTransactions = state.TransactionFieldValues.map((t) => {
        if (t.FieldValueId === item.FieldValueId) {
          return { ...t, [name]: val };
        }
        return t;
      });
      setState({ TransactionFieldValues: updatedTransactions });
    }
  };

  const handleChange = (
      e: React.ChangeEvent<HTMLInputElement>,
      name: string,
      item: Row
  ) => {
    const value = e.target.value;

    const updatedNewRows = state.newRows.map((row) => {
      const isMatch = item.isNew
          ? row.tempId === item.tempId
          : row.FieldValueId && row.FieldValueId === item.FieldValueId;

      if (isMatch) {
        const updatedRow: Row = { ...row, [name]: value };

        if (name === "LowerLimit" || name === "UpperLimit") {
          const lower =
              name === "LowerLimit" ? value : (row.LowerLimit as any);
          const upper =
              name === "UpperLimit" ? value : (row.UpperLimit as any);
          updatedRow.EquivalenceClasses = generateOrderRanges(lower, upper);
        }

        return updatedRow;
      }
      return row;
    });

    const updatedTransactions = state.TransactionFieldValues.map((t) => {
      if (!item.isNew && t.FieldValueId === item.FieldValueId) {
        const updatedT: Row = { ...t, [name]: value };

        if (name === "LowerLimit" || name === "UpperLimit") {
          const lower =
              name === "LowerLimit" ? value : (t.LowerLimit as any);
          const upper =
              name === "UpperLimit" ? value : (t.UpperLimit as any);
          updatedT.EquivalenceClasses = generateOrderRanges(lower, upper);
        }

        return updatedT;
      }
      return t;
    });

    setState({
      newRows: updatedNewRows,
      TransactionFieldValues: updatedTransactions,
    });
  };

  const generateOrderRanges = (min: any, max: any): EquivalenceClass[] => {
    if (min == null || max == null || isNaN(min) || isNaN(max)) {
      return [];
    }

    const results: EquivalenceClass[] = [];

    if (min <= 0 && max >= 0) {
      results.push({
        EQClass: 0,
        LowerLimit: 0,
        LwLimitBVN: -1,
        LwLimitBVP: 1,
        UpperLimit: 9,
        UPLimitBVN: 8,
        UPLimitBVP: 10,
      });
    }

    let LowerLimit = 10;

    if (min > 0) {
      LowerLimit = Math.pow(10, Math.floor(Math.log10(min)));
    }

    while (LowerLimit <= max) {
      const UpperLimit = LowerLimit * 10 - 1;

      results.push({
        EQClass: LowerLimit,
        LowerLimit: LowerLimit,
        LwLimitBVN: LowerLimit - 1,
        LwLimitBVP: LowerLimit + 1,
        UpperLimit: UpperLimit,
        UPLimitBVN: UpperLimit - 1,
        UPLimitBVP: UpperLimit + 1,
      });

      LowerLimit *= 10;
    }

    return results;
  }

  const handlePageChange = (page: number) => {
    setState({ CurrentPage: page });
    getData(state.SearchQuery, page);
  };

  const handleDeleteItem = async (item: Row) => {
    if (item.FieldValueId) {
      const resp: any = await apiRequest(
          "/DeleteSAPTableFieldValuesMasterV2",
          item
      );
      if (resp) {
        setState({ showToast: true });
        getData();
        setTimeout(() => {
          setState({ showToast: false });
        }, 3000);
      }
    } else {
      const newRows = state.newRows.filter((row) => row.tempId !== item.tempId);
      const editingRows = { ...state.editingRows };
      const rowErrors = { ...state.rowErrors };
      if (item.tempId !== undefined) {
        delete editingRows[item.tempId];
        delete rowErrors[item.tempId];
      }
      setState({
        newRows,
        editingRows,
        rowErrors,
      });
    }
  };

  const handlCurrEQC = (item: Row) => {
    setState({
      openModal2: true,
      CurrEQ: item,
      EqClassesBaundaryValues: (item.EquivalenceClasses || []) as EquivalenceClass[],
    });
  };

  const handleViewClientDetails = (item: Row) => {
    setState({ ViewAppDetails: true, CurrAddEditDetails: item as any });
  };

  const handleCloseClientDetails = () => {
    setState({ ViewAppDetails: false });
    getData();
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setState({ SearchQuery: value });
    if (value.trim() === "") {
      getData("");
    }
  };

  const columns: { title: string; key: string }[] = [
    { title: "Testing Technique", key: "TestingTechniqueId" },
    { title: "Field Value", key: "FieldValue" },
    { title: "Lower Limit", key: "LowerLimit" },
    { title: "Upper Limit", key: "UpperLimit" },
  ];

  const allRows: Row[] = [...state.newRows, ...state.TransactionFieldValues];

  const data: Array<Record<string, React.ReactNode>> = allRows.map((item) => {
    const rowKey =
        item.isNew ? String(item.tempId ?? "") : String(item.FieldValueId ?? "");
    const isEditing = Boolean(state.editingRows[item.isNew ? (item.tempId as number) : (item.FieldValueId as string)]);
    const errors = state.rowErrors[item.isNew ? (item.tempId as number) : (item.FieldValueId as string)] || {};

    if (isEditing) {
      return {
        TestingTechniqueId: (
            <div>
              <Dropdown
                  mode="single"
                  options={state.TestingTechniquesList}
                  value={item.TestingTechniqueId}
                  onChange={(val: string, option: unknown) =>
                      handleDropdownClientInfo(val, option, "TestingTechniqueId", item)
                  }
                  onSearch={(q: string) => console.log("Search (Multi):", q)}
              />
              {errors.TestingTechniqueId && (
                  <div className="flex items-center mt-1 ml-2">
                    <CircleAlert size={14} className="text-red-500" />
                    <p className="ml-2 text-red-500 text-sm">
                      {errors.TestingTechniqueId}
                    </p>
                  </div>
              )}
            </div>
        ),
        FieldValue: (
            <div>
              <input
                  onChange={(e) => handleChange(e, "FieldValue", item)}
                  value={item.FieldValue || ""}
                  type="text"
                  className={`w-full px-3 shadow text-[0.85rem] py-2 border ${
                      errors.FieldValue ? "border-red-500" : "border-gray-200"
                  } rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Enter Field Value"
                  required
              />
              {errors.FieldValue && (
                  <div className="flex items-center mt-1 ml-2">
                    <CircleAlert size={14} className="text-red-500" />
                    <p className="ml-2 text-red-500 text-sm">{errors.FieldValue}</p>
                  </div>
              )}
            </div>
        ),
        LowerLimit: (
            <div>
              <input
                  onChange={(e) => handleChange(e, "LowerLimit", item)}
                  value={item.LowerLimit ?? ""}
                  type="text"
                  className={`w-full px-3 shadow text-[0.85rem] py-2 border ${
                      errors.LowerLimit ? "border-red-500" : "border-gray-200"
                  } rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Enter Lower Limit"
                  required
              />
              {errors.LowerLimit && (
                  <div className="flex items-center mt-1 ml-2">
                    <CircleAlert size={14} className="text-red-500" />
                    <p className="ml-2 text-red-500 text-sm">{errors.LowerLimit}</p>
                  </div>
              )}
            </div>
        ),
        UpperLimit: (
            <div>
              <input
                  onChange={(e) => handleChange(e, "UpperLimit", item)}
                  value={item.UpperLimit ?? ""}
                  type="text"
                  className={`w-full px-3 shadow text-[0.85rem] py-2 border ${
                      errors.UpperLimit ? "border-red-500" : "border-gray-200"
                  } rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Enter Upper Limit"
                  required
              />
              {errors.UpperLimit && (
                  <div className="flex items-center mt-1 ml-2">
                    <CircleAlert size={14} className="text-red-500" />
                    <p className="ml-2 text-red-500 text-sm">{errors.UpperLimit}</p>
                  </div>
              )}
            </div>
        ),
        actions: (
            <div className="relative flex items-center ">
              <button
                  onClick={() => handlCurrEQC(item)}
                  className="bg-black mr-4  cursor-pointer text-white px-3 py-1 rounded text-sm"
              >
                Boundary Values
              </button>
              <ConfirmPopup
                  message="Are you sure you want to delete this item?"
                  onConfirm={() => handleDeleteItem(item)}
              >
                <button className="pr-4 flex items-center" key={`del-${rowKey}`}>
                  <Trash2 className="text-[#1A1A1A] cursor-pointer" />
                </button>
              </ConfirmPopup>
            </div>
        ),
      };
    }

    return {
      TestingTechniqueId: item.TestingTechnique as React.ReactNode,
      FieldValue: item.FieldValue as React.ReactNode,
      FieldId: item.FieldId as React.ReactNode,
      UpperLimit: item.UpperLimit as React.ReactNode,
      LowerLimit: item.LowerLimit as React.ReactNode,
      actions: (
          <div className="relative flex items-center">
            <button
                onClick={() => handlCurrEQC(item)}
                className="bg-black mr-4  cursor-pointer text-white px-3 py-1 rounded text-sm"
            >
              Boundary Values
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
              <button className="ml-2 pr-4 flex items-center" key={`del2-${rowKey}`}>
                <Trash2 className="text-[#1A1A1A] cursor-pointer" />
              </button>
            </ConfirmPopup>
          </div>
      ),
    };
  });

  const hasEdits =
      Object.keys(state.editingRows).length > 0 || state.newRows.length > 0;

  if (state.IsLoading)
    return (
        <div className="h-96 py-20">
          <Spinner size="lg" color="blue-500" text="Fetching data..." />
        </div>
    );
  if (state.Error) return <ErrorScreen message={state.Error} />;

  return (
      <div className="pt-0 pb-6 ">
        <Modal
            width="max-w-7xl"
            isOpen={state.openModal2}
            onClose={() => setState({ openModal2: false })}
            title={`Field Value: ${state?.CurrEQ?.FieldValue ?? ""}`}
        >
          <div className="space-y-5 h-full flex flex-col">
            <div className="overflow-x-auto mt-1">
              <div>
                <p className="font-semibold">Boundary Values</p>
              </div>
              <table className="min-w-full mt-2 border border-gray-200 rounded-md">
                <thead>
                <tr className="bg-[#ebebeb] text-left">
                  <th className="p-2 font-semibold text-gray-700">Lower Limit</th>
                  <th className="p-2 font-semibold text-gray-700">
                    Lower Limit (-1)
                  </th>
                  <th className="p-2 font-semibold text-gray-700">
                    Lower Limit (+1)
                  </th>
                  <th className="p-2 font-semibold text-gray-700">Upper Limit</th>
                  <th className="p-2 font-semibold text-gray-700">
                    Upper Limit (-1)
                  </th>
                  <th className="p-2 font-semibold text-gray-700">
                    Upper Limit (+1)
                  </th>
                </tr>
                </thead>
                <tbody>
                {state.EqClassesBaundaryValues.map((item, id) => {
                  return (
                      <tr className="border-t border-gray-200 " key={id}>
                        <td className="p-3">{item.LowerLimit}</td>
                        <td className="p-3">{item.LwLimitBVN}</td>
                        <td className="p-3">{item.LwLimitBVP}</td>
                        <td className="p-3">{item.UpperLimit}</td>
                        <td className="p-3">{item.UPLimitBVN}</td>
                        <td className="p-3">{item.UPLimitBVP}</td>
                      </tr>
                  );
                })}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end items-center bottom-0 gap-6 border-t border-gray-300">
              <button
                  onClick={() => setState({ openModal2: false })}
                  className="cursor-pointer mt-4 px-5 py-2 bg-white text-blue-700 border border-blue-600 text-sm rounded-lg "
              >
                Close
              </button>
              <button className="cursor-pointer mt-4 px-5 py-2 bg-[#0071E9] text-white text-sm rounded-lg">
                Save
              </button>
            </div>
          </div>
        </Modal>

        {state.ViewAppDetails ? (
            <div></div>
        ) : (
            <>
              <Toast
                  message="Saved successfully!"
                  show={state.showToast}
                  onClose={() => setState({ showToast: false })}
              />

              <div className="flex justify-between items-center pb-4">
                <div className="flex items-center w-full max-w-md px-4 py-2 bg-[#F5F7FA] border border-gray-200 rounded-lg shadow-sm">
                  <svg
                      className="w-4 h-4 text-black"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                  >
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
            </>
        )}
      </div>
  );
}
