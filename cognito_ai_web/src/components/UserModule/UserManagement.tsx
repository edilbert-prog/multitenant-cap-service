import React, { useEffect, useReducer, useRef } from "react";
import CustomTable from "../../utils/CustomTable";
import { ChevronLeft, CircleAlert, Plus, Save, SquarePen, ToggleLeft, ToggleRight } from "lucide-react";
import { apiRequest as rawApiRequest } from "../../utils/helpers/ApiHelper";
import Spinner from "../../utils/Spinner";
import ErrorScreen from "../../utils/ErrorScreen";
import Pagination from "../../utils/Pagination";
import Toast from "../../utils/Toast";
import useDebounce from "../../utils/helpers/useDebounce";
import Dropdown from "../../utils/Dropdown";
import ConfirmPopup from "../../utils/ConfirmPopup";
import { getDecryptedData } from "../../utils/helpers/storageHelper";
import * as cryptojs from "crypto-js";
import SearchBar from "../../utils/SearchBar";

type RoleOption = { value: string; label: string };

type User = {
  UserId: string;
  RoleId: string;
  FirstName: string;
  LastName: string;
  Email: string;
  Password?: string;
  CountryId: string | number;
  StateId: string | number;
  CityId: string | number;
  Status: 0 | 1;
  RoleName?: string;
  [k: string]: unknown;
};

type CountriesStatesCitiesResponse = {
  Countries: Array<{
    CountryId: string | number;
    iso2: string;
    phonecode: string;
    [k: string]: unknown;
  }>;
  States: Array<Record<string, unknown>>;
  Cities: Array<Record<string, unknown>>;
};

type GetUserMasterResponse = {
  ResponseData: User[];
};

type State = {
  ActionType: "" | "Add" | "Update";
  Error: string;
  SearchQuery: string;
  CurrentPage: number;
  TotalRecords: number;
  UsersMaster: User[];
  Countries: CountriesStatesCitiesResponse["Countries"];
  CountryCodes: Array<{ value: string; label: string }>;
  States: Array<Record<string, unknown>>;
  Cities: Array<Record<string, unknown>>;
  Roles: RoleOption[];
  ViewUserDetails: boolean;
  IsLoading: boolean;
  showToast: boolean;
  SavingLoader: boolean;
  showPasswordInput: boolean;
  isDataExist: string;
  UserActionType: string;
  ClientId: string;
  CurrAddEditObj: {
    UserId: string;
    authUserRoleId: string | undefined;
    ClientId: string;
    RoleId: string;
    FirstName: string;
    LastName: string;
    Email: string;
    Password: string;
    CountryId: string | number;
    StateId: string | number;
    CityId: string | number;
    Status: 0 | 1;
  };
  ValidateFields: Record<
    "FirstName" | "LastName" | "Email" | "Password" | "RoleId" | "CountryId" | "StateId" | "CityId",
    string
  >;
  FormErrors: Partial<Record<keyof State["ValidateFields"], string>>;
};

type Action = Partial<State>;

type ToggleStatusPayload = {
  UserId: string;
  ClientId: string;
  Status: 0 | 1;
};

function request<T>(path: string, body: unknown): Promise<T> {
  return rawApiRequest(path, body) as Promise<T>;
}

export default function UserManagement() {
  const userSession = getDecryptedData("UserSession") as { RoleId?: string } | null;
  const roleId = userSession?.RoleId;

  const [state, setState] = useReducer(
    (prev: State, next: Action): State => ({ ...prev, ...next }),
    {
      ActionType: "",
      Error: "",
      SearchQuery: "",
      CurrentPage: 1,
      TotalRecords: 1,
      UsersMaster: [],
      Countries: [],
      CountryCodes: [],
      States: [],
      Cities: [],
      Roles: [],
      ViewUserDetails: false,
      IsLoading: true,
      showToast: false,
      SavingLoader: false,
      showPasswordInput: false,
      isDataExist: "",
      UserActionType: "",
      ClientId: "CLID-1",
      CurrAddEditObj: {
        UserId: "",
        authUserRoleId: roleId,
        ClientId: "CLID-1",
        RoleId: "",
        FirstName: "",
        LastName: "",
        Email: "",
        Password: "",
        CountryId: "",
        StateId: "",
        CityId: "",
        Status: 1,
      },
      ValidateFields: {
        FirstName: "",
        LastName: "",
        Email: "",
        Password: "",
        RoleId: "",
        CountryId: "",
        StateId: "",
        CityId: "",
      },
      FormErrors: {},
    }
  );

  const didFetchData = useRef<boolean>(false);

  useEffect(() => {
    if (didFetchData.current) return;
    didFetchData.current = true;

    const init = async () => {
      setState({ IsLoading: true });

      await Promise.all([getData(""), getCountryStateCity(), getRoles()]);

      setState({ IsLoading: false });
    };

    void init();
  }, []);

  const getRoles = async (): Promise<void> => {
    try {
      const mockRoles: RoleOption[] = [
        { value: "RL-0001", label: "Administrator" },
        { value: "RL-0002", label: "Test Engineer" },
      ];
      setState({ Roles: mockRoles });
    } catch (err) {
      console.error("Error loading roles:", err);
    }
  };

  const getCountryStateCity = async (
    CountryId: string | number = "",
    StateId: string | number = ""
  ): Promise<void> => {
    try {
      const resp = await request<CountriesStatesCitiesResponse>("/global-constants/GetCountriesStatesCities", {
        CountryId,
        StateId,
      });

      const CountryCodes = resp.Countries.map((v) => {
        const phoneCode = String(v.phonecode).replace("+", "");
        return { value: `${v.CountryId}`, label: `${v.iso2} (+${phoneCode})` } as const;
      });

      setState({
        Countries: resp.Countries || [],
        CountryCodes,
        States: resp.States || [],
        Cities: resp.Cities || [],
      });
    } catch (err) {
      console.error("Error loading Country/State/City:", err);
    }
  };

  const getData = async (SearchQuery: string = "", PageNo: number = 1): Promise<void> => {
    try {
      const resp = await request<GetUserMasterResponse>("/GetUserMaster", {
        ClientId: state.ClientId,
        Status: "All",
      });

      let filteredData: User[] = resp.ResponseData || [];

      if (SearchQuery.trim() !== "") {
        const q = SearchQuery.toLowerCase();
        filteredData = filteredData.filter(
          (user) =>
            user.FirstName?.toLowerCase().includes(q) ||
            user.LastName?.toLowerCase().includes(q) ||
            user.Email?.toLowerCase().includes(q)
        );
      }

      const pageSize = 10;
      const startIndex = (PageNo - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedData = filteredData.slice(startIndex, endIndex);

      setState({
        UsersMaster: paginatedData,
        TotalRecords: filteredData.length,
      });
    } catch (err) {
      setState({ Error: String(err) });
    } finally {
      setState({ IsLoading: false });
    }
  };

  const handleAddUser = (): void => {
    const CurrAddEditObj: State["CurrAddEditObj"] = {
      UserId: "",
      authUserRoleId: roleId,
      ClientId: state.ClientId,
      RoleId: "",
      FirstName: "",
      LastName: "",
      Email: "",
      Password: "",
      CountryId: "",
      StateId: "",
      CityId: "",
      Status: 1,
    };
    setState({ ActionType: "Add", CurrAddEditObj, FormErrors: {} });
  };

  const handleEdit = (item: User): void => {
    void getCountryStateCity(item.CountryId, item.StateId);
    setState({ ActionType: "Update", CurrAddEditObj: item as State["CurrAddEditObj"] });
  };

  const handleCancel = (): void => {
    const CurrAddEditObj: State["CurrAddEditObj"] = {
      UserId: "",
      authUserRoleId: roleId,
      ClientId: state.ClientId,
      RoleId: "",
      FirstName: "",
      LastName: "",
      Email: "",
      Password: "",
      CountryId: "",
      StateId: "",
      CityId: "",
      Status: 1,
    };
    setState({ ActionType: "", CurrAddEditObj });
    void getData("");
  };

  const debouncedSearchQuery = useDebounce(state.SearchQuery, 300) as string;
  const didSearchRun = useRef<boolean>(false);

  useEffect(() => {
    if (!didSearchRun.current) {
      didSearchRun.current = true;
      return;
    }
    void getData(debouncedSearchQuery, 1);
    setState({ CurrentPage: 1 });
  }, [debouncedSearchQuery]);

  const handleSearch = (value: string): void => {
    setState({ SearchQuery: value });
    if (value.trim() === "") {
      void getData("");
    }
  };

  const handleChangeUserInfo = (
    e: React.ChangeEvent<HTMLInputElement>,
    name: keyof State["CurrAddEditObj"]
  ): void => {
    const CurrAddEditObj = { ...state.CurrAddEditObj };
    // @ts-expect-error - dynamic assignment based on key union; values are strings/numbers
    CurrAddEditObj[name] = e.target.value;
    setState({ CurrAddEditObj });
  };

  const validateUserInfoForm = (): boolean => {
    const FormErrors: State["FormErrors"] = {};
    let formIsValid = true;

    const emailRegex = "";
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    (Object.keys(state.ValidateFields) as Array<keyof State["ValidateFields"]>).forEach((name) => {
      // @ts-expect-error - CurrAddEditObj shares these keys
      const value = state.CurrAddEditObj[name];
      if (value === "" || value === 0) {
        formIsValid = false;
        FormErrors[name] = "This field is required";
      } else {
        if (name === "Email" && typeof value === "string" && !emailRegex.test(value)) {
          formIsValid = false;
          FormErrors[name] = "Please enter a valid email address";
        } else if (name === "Password" && state.ActionType === "Add") {
          if (typeof value === "string" && !passwordRegex.test(value)) {
            formIsValid = false;
            FormErrors[name] =
              "Password must be at least 8 characters with uppercase, lowercase, number and special character";
          } else {
            FormErrors[name] = "";
          }
        } else {
          FormErrors[name] = "";
        }
      }
    });

    setState({ FormErrors });
    return formIsValid;
  };

  const handlePageChange = (page: number): void => {
    setState({ CurrentPage: page });
    void getData(state.SearchQuery, page);
  };

  const handleDropdownUserInfo = (
    val: string | number,
    _options: unknown,
    name: "CountryId" | "StateId" | "CityId" | "RoleId"
  ): void => {
    const CurrAddEditObj = { ...state.CurrAddEditObj };
    // @ts-expect-error - dynamic assignment
    CurrAddEditObj[name] = val;
    if (name === "CountryId") {
      void getCountryStateCity(val);
      CurrAddEditObj.StateId = "" as unknown as State["CurrAddEditObj"]["StateId"];
      CurrAddEditObj.CityId = "" as unknown as State["CurrAddEditObj"]["CityId"];
    }
    if (name === "StateId") {
      void getCountryStateCity(CurrAddEditObj.CountryId, val);
      CurrAddEditObj.CityId = "" as unknown as State["CurrAddEditObj"]["CityId"];
    }
    if (name === "CityId") {
      CurrAddEditObj[name] = String(val) as unknown as typeof CurrAddEditObj[typeof name];
    }
    setState({ CurrAddEditObj });
  };

  const handleSubmitUserInfo = async (): Promise<void> => {
    if (!validateUserInfoForm()) {
      return;
    }
    setState({ SavingLoader: true });

    try {
      const submitData: User = { ...(state.CurrAddEditObj as unknown as User) };
      if (state.ActionType === "Update" && !submitData.Password) {
        delete submitData.Password;
      } else {
        const encKey = (import.meta as unknown as { env: { VITE_AUTH_ENC: string } }).env.VITE_AUTH_ENC;
        const encryptedPass = cryptojs.AES.encrypt(submitData.Password!.trim(), encKey).toString();
        submitData.Password = encryptedPass;
      }

      const resp = await request<unknown>("/AddUpdateUserMaster", submitData);
      if (resp) {
        setState({ SavingLoader: false, showToast: true, ActionType: "" });
        void getData();
        setTimeout(() => {
          setState({ showToast: false });
        }, 3000);
      }
    } catch (err) {
      setState({ SavingLoader: false, Error: String(err) });
    }
  };

  const handleDeleteUser = async (item: User): Promise<void> => {
    try {
      const resp = await request<unknown>("/DeleteUserMaster", {
        UserId: item.UserId,
        ClientId: state.ClientId,
      });
      if (resp) {
        setState({ showToast: true });
        void getData();
        setTimeout(() => {
          setState({ showToast: false });
        }, 3000);
      }
    } catch (err) {
      setState({ Error: String(err) });
    }
  };

  const handleToggleUserStatus = async (item: User): Promise<void> => {
    try {
      const payload: ToggleStatusPayload = {
        UserId: item.UserId,
        ClientId: state.ClientId,
        Status: item.Status,
      };
      const resp = await request<unknown>("/ToggleUserStatus", payload);
      if (resp) {
        setState({ showToast: true });
        void getData();
        setTimeout(() => {
          setState({ showToast: false });
        }, 3000);
      }
    } catch (err) {
      setState({ Error: String(err) });
    }
  };

  if (state.IsLoading)
    return (
      <div className="h-96 py-20">
        <Spinner size="lg" color="blue-500" text="Fetching data..." />
      </div>
    );
  if (state.Error) return <ErrorScreen message={state.Error} />;

  const columns: Array<{ title: string; key: string }> = [
    { title: "User ID", key: "UserId" },
    { title: "First Name", key: "FirstName" },
    { title: "Last Name", key: "LastName" },
    { title: "Email", key: "Email" },
    { title: "Role", key: "RoleName" },
    { title: "Status", key: "Status" },
  ];

  const data = state.UsersMaster.map((v) => ({
    UserId: v.UserId,
    FirstName: v.FirstName,
    LastName: v.LastName,
    Email: v.Email,
    RoleName: v.RoleName || "N/A",
    Status: (
      <button
        onClick={() => void handleToggleUserStatus(v)}
        className={`flex items-center cursor-pointer hover:opacity-80 transition ${
          v.Status === 1 ? "text-green-600" : "text-red-600"
        }`}
      >
        {v.Status === 1 ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
        <span className="ml-1">{v.Status === 1 ? "Active" : "Inactive"}</span>
      </button>
    ),
    actions: (
      <>
        <button onClick={() => handleEdit(v)} className="">
          <SquarePen className="text-[#1A1A1A] cursor-pointer" />
        </button>
      </>
    ),
  }));

  return (
    <div className="pt-0 pb-6 px-6">
      <Toast message="Saved successfully!" show={state.showToast} onClose={() => null} />
      {state.ActionType !== "" ? (
        <div className="w-full pt-2">
          <div className="flex justify-between items-center pb-4">
            <div
              onClick={handleCancel}
              className="flex items-center cursor-pointer bg-[#f3f3f3] w-fit px-4 py-1 rounded-full"
            >
              <ChevronLeft className="text-gray-700" />
              <span className="font-medium text-sm text-gray-700"> Back</span>
            </div>
            <div className="flex items-center justify-between">
              <button
                onClick={state.SavingLoader ? undefined : () => void handleSubmitUserInfo()}
                className="bg-[#0071E9] hover:bg-[#005ABA] text-[0.89rem] cursor-pointer text-white font-medium py-2 px-5 rounded-lg flex items-center space-x-2"
              >
                {state.SavingLoader ? (
                  <>
                    <Spinner size="xs" color="white" text="" />
                    <span>Saving..</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>SAVE</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="">
              <label className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                onChange={(e) => handleChangeUserInfo(e, "FirstName")}
                value={state.CurrAddEditObj.FirstName}
                type="text"
                className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter first name"
                required
              />
              {state.FormErrors.FirstName && (
                <div className="flex items-center mt-1 ml-2">
                  <CircleAlert size={14} className="text-red-500" />
                  <p className="ml-2 text-red-500 text-sm">{state.FormErrors.FirstName}</p>
                </div>
              )}
            </div>

            <div className="">
              <label className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                onChange={(e) => handleChangeUserInfo(e, "LastName")}
                value={state.CurrAddEditObj.LastName}
                type="text"
                className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter last name"
                required
              />
              {state.FormErrors.LastName && (
                <div className="flex items-center mt-1 ml-2">
                  <CircleAlert size={14} className="text-red-500" />
                  <p className="ml-2 text-red-500 text-sm">{state.FormErrors.LastName}</p>
                </div>
              )}
            </div>

            <div className="">
              <label className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                onChange={(e) => handleChangeUserInfo(e, "Email")}
                value={state.CurrAddEditObj.Email}
                type="email"
                className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter email address"
                required
              />
              {state.FormErrors.Email && (
                <div className="flex items-center mt-1 ml-2">
                  <CircleAlert size={14} className="text-red-500" />
                  <p className="ml-2 text-red-500 text-sm">{state.FormErrors.Email}</p>
                </div>
              )}
            </div>

            <div className="">
              <label className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                Password {state.ActionType === "Add" && <span className="text-red-500">*</span>}
                {state.ActionType === "Update" && !state.showPasswordInput && (
                  <span
                    onClick={() => setState({ showPasswordInput: true })}
                    className="text-blue-600 cursor-pointer underline ml-2 text-[0.75rem]"
                  >
                    Do you want to update password?
                  </span>
                )}
              </label>

              {(state.ActionType === "Add" || state.showPasswordInput) && (
                <>
                  <input
                    onChange={(e) => handleChangeUserInfo(e, "Password")}
                    value={state.CurrAddEditObj.Password}
                    type="password"
                    className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter password"
                  />
                  {state.FormErrors.Password && (
                    <div className="flex items-center mt-1 ml-2">
                      <CircleAlert size={14} className="text-red-500" />
                      <p className="ml-2 text-red-500 text-sm">{state.FormErrors.Password}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="">
              <label className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                Role <span className="text-red-500">*</span>
              </label>
              <Dropdown
                mode="single"
                options={state.Roles}
                value={state.CurrAddEditObj.RoleId}
                onChange={(val: string, item: unknown) => handleDropdownUserInfo(val, item, "RoleId")}
                onSearch={(q: string) => console.log("Search Role:", q)}
              />
              {state.FormErrors.RoleId && (
                <div className="flex items-center mt-1 ml-2">
                  <CircleAlert size={14} className="text-red-500" />
                  <p className="ml-2 text-red-500 text-sm">{state.FormErrors.RoleId}</p>
                </div>
              )}
            </div>

            <div className="">
              <label className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                Country <span className="text-red-500">*</span>
              </label>
              <Dropdown
                mode="single"
                options={state.Countries}
                value={state.CurrAddEditObj.CountryId}
                onChange={(val: string | number, item: unknown) =>
                  handleDropdownUserInfo(val, item, "CountryId")
                }
                onSearch={(q: string) => console.log("Search Country:", q)}
              />
              {state.FormErrors.CountryId && (
                <div className="flex items-center mt-1 ml-2">
                  <CircleAlert size={14} className="text-red-500" />
                  <p className="ml-2 text-red-500 text-sm">{state.FormErrors.CountryId}</p>
                </div>
              )}
            </div>

            <div className="">
              <label className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                State <span className="text-red-500">*</span>
              </label>
              <Dropdown
                mode="single"
                options={state.States}
                value={state.CurrAddEditObj.StateId}
                onChange={(val: string | number, item: unknown) => handleDropdownUserInfo(val, item, "StateId")}
                onSearch={(q: string) => console.log("Search State:", q)}
              />
              {state.FormErrors.StateId && (
                <div className="flex items-center mt-1 ml-2">
                  <CircleAlert size={14} className="text-red-500" />
                  <p className="ml-2 text-red-500 text-sm">{state.FormErrors.StateId}</p>
                </div>
              )}
            </div>

            <div className="">
              <label className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                City <span className="text-red-500">*</span>
              </label>
              <Dropdown
                mode="single"
                options={state.Cities}
                value={state.CurrAddEditObj.CityId}
                onChange={(val: string | number, item: unknown) => handleDropdownUserInfo(val, item, "CityId")}
                onSearch={(q: string) => console.log("Search City:", q)}
              />
              {state.FormErrors.CityId && (
                <div className="flex items-center mt-1 ml-2">
                  <CircleAlert size={14} className="text-red-500" />
                  <p className="ml-2 text-red-500 text-sm">{state.FormErrors.CityId}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center pb-4">
            <div className="flex justify-between items-center pb-4">
              <SearchBar currentValue={state.SearchQuery} onSearch={handleSearch} size="medium" />
            </div>
            <div>
              <button
                onClick={handleAddUser}
                className="bg-[#0071E9] hover:bg-[#005ABA] text-[0.89rem] cursor-pointer text-white font-medium py-2 px-5 rounded-lg flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Add User</span>
              </button>
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
