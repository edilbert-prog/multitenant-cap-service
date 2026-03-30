import React, { useEffect, useReducer, useRef } from "react";
import { CircleAlert, Save, SquarePen, X, Eye, EyeOff, Lock, Shield } from "lucide-react";
import { apiRequest as rawApiRequest } from "../../utils/helpers/ApiHelper";
import Spinner from "../../utils/Spinner";
import ErrorScreen from "../../utils/ErrorScreen";
import Toast from "../../utils/Toast";
import Dropdown from "../../utils/Dropdown";
import { getDecryptedData } from "../../utils/helpers/storageHelper";
import * as cryptojs from "crypto-js";

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

type UserSession = {
  UserId: string;
  ClientId?: string;
  FirstName?: string;
  LastName?: string;
  Password?: string;
  Email?: string;
  CountryId?: string | number;
  StateId?: string | number;
  CityId?: string | number;
  CountryCode?: string | number;
  [k: string]: unknown;
};

type State = {
  ActionType: string;
  Error: string;
  SearchQuery: string;
  CurrentPage: number;
  TotalRecords: number;
  MyProfile: unknown[];
  CurrUser: unknown[];
  IntegrationModeMasterList: unknown[];
  ApplicationsList: unknown[];
  Countries: CountriesStatesCitiesResponse["Countries"];
  CountryCodes: Array<{ value: string; label: string }>;
  States: Array<Record<string, unknown>>;
  Cities: Array<Record<string, unknown>>;
  ViewClientDetails: boolean;
  IsLoading: boolean;
  showToast: boolean;
  toastMessage: string;
  SavingLoader: boolean;
  isDataExist: string;
  ClientBusinessUnitActionType: string;
  showResetPasswordModal: boolean;
  resetPasswordLoading: boolean;
  resetPasswordData: {
    CurrentPassword: string;
    NewPassword: string;
    ConfirmPassword: string;
  };
  resetPasswordErrors: Partial<Record<"CurrentPassword" | "NewPassword" | "ConfirmPassword", string>>;
  CurrAddEditObj: {
    FirstName: string;
    LastName: string;
    Password: string;
    Email: string;
    CountryId?: string | number;
    StateId?: string | number;
    CityId?: string | number;
    CountryCode?: string | number;
    ClientId?: string;
    [k: string]: unknown;
  };
  ValidateFields: Record<"FirstName" | "LastName" | "Password" | "Email", string>;
  FormErrors: Partial<Record<keyof State["ValidateFields"] | "CountryId" | "StateId" | "CityId", string>>;
};

type Action = Partial<State>;

function request<T>(path: string, body: unknown): Promise<T> {
  return rawApiRequest(path, body) as Promise<T>;
}

export default function MyProfile() {
  const [showPassword, setShowPassword] = React.useState<{
    current: boolean;
    new: boolean;
    confirm: boolean;
  }>({
    current: false,
    new: false,
    confirm: false,
  });

  const [state, setState] = useReducer(
    (prev: State, next: Action): State => ({ ...prev, ...next }),
    {
      ActionType: "",
      Error: "",
      SearchQuery: "",
      CurrentPage: 1,
      TotalRecords: 1,
      MyProfile: [],
      CurrUser: [],
      IntegrationModeMasterList: [],
      ApplicationsList: [],
      Countries: [],
      CountryCodes: [],
      States: [],
      Cities: [],
      ViewClientDetails: false,
      IsLoading: true,
      showToast: false,
      toastMessage: "Saved successfully!",
      SavingLoader: false,
      isDataExist: "",
      ClientBusinessUnitActionType: "",
      showResetPasswordModal: false,
      resetPasswordLoading: false,
      resetPasswordData: {
        CurrentPassword: "",
        NewPassword: "",
        ConfirmPassword: "",
      },
      resetPasswordErrors: {},
      CurrAddEditObj: {
        FirstName: "",
        LastName: "",
        Password: "",
        Email: "",
      },
      ValidateFields: {
        FirstName: "",
        LastName: "",
        Password: "",
        Email: "",
      },
      FormErrors: {},
    }
  );

  const setCurrentClient = async (): Promise<void> => {
    const UserSession = getDecryptedData("UserSession") as UserSession | null;
    if (UserSession) {
      setState({ CurrAddEditObj: UserSession as State["CurrAddEditObj"] });
      await loadLocationData(UserSession.CountryId as string | number, UserSession.StateId as string | number);
    }
  };

  const loadLocationData = async (countryId: string | number = "", stateId: string | number = ""): Promise<void> => {
    const resp = await request<CountriesStatesCitiesResponse>("/global-constants/GetCountriesStatesCities", {
      CountryId: "",
      StateId: "",
    });

    if (resp.Countries.length > 0) {
      const CountryCodes: Array<{ value: string; label: string }> = [];
      resp.Countries.forEach((v) => {
        const phoneCode = String(v.phonecode).includes("+")
          ? String(v.phonecode).replace("+", "")
          : String(v.phonecode);
        CountryCodes.push({ value: `${v.CountryId}`, label: `${v.iso2} (+${phoneCode})` });
      });
      setState({ Countries: resp.Countries, CountryCodes });
    }

    if (countryId) {
      const stateResp = await request<CountriesStatesCitiesResponse>("/global-constants/GetCountriesStatesCities", {
        CountryId: countryId,
        StateId: "",
      });

      if (stateResp.States.length > 0) {
        setState({ States: stateResp.States });
      }

      if (stateId) {
        const cityResp = await request<CountriesStatesCitiesResponse>("/GetCountrieglobal-constants/GetCountriesStatesCitiessStatesCities", {
          CountryId: countryId,
          StateId: stateId,
        });

        if (cityResp.Cities.length > 0) {
          setState({ Cities: cityResp.Cities });
        }
      }
    }
  };

  const didFetchData = useRef<boolean>(false);
  useEffect(() => {
    if (didFetchData.current) return;
    didFetchData.current = true;

    const init = async () => {
      setState({ IsLoading: true });
      await setCurrentClient();
      setState({ IsLoading: false });
    };
    void init();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, name: keyof State["CurrAddEditObj"]): void => {
    const CurrAddEditObj = { ...state.CurrAddEditObj };
    CurrAddEditObj[name] = e.target.value;
    setState({ CurrAddEditObj });
  };

  const validateClientInfoForm = (): boolean => {
    const FormErrors: State["FormErrors"] = {};
    let formIsValid = true;

    const emailRegex = "";
    (Object.keys(state.ValidateFields) as Array<keyof State["ValidateFields"]>).forEach((name) => {
      const value = state.CurrAddEditObj[name];
      if (value === "" || value === 0) {
        formIsValid = false;
        FormErrors[name] = "This field is required";
      } else {
        if (name === "Email" && typeof value === "string" && !emailRegex.test(value)) {
          formIsValid = false;
          FormErrors[name] = "Please enter a valid email address";
        } else {
          FormErrors[name] = "";
        }
      }
    });
    setState({ FormErrors });
    return formIsValid;
  };

  const getCountryStateCity = async (CountryId: string | number = "", StateId: string | number = ""): Promise<void> => {
    const resp = await request<CountriesStatesCitiesResponse>("/global-constants/GetCountriesStatesCities", {
      CountryId,
      StateId,
    });
    if (resp.Countries.length > 0) {
      const CountryCodes: Array<{ value: string; label: string }> = [];
      resp.Countries.forEach((v) => {
        const phoneCode = String(v.phonecode).includes("+")
          ? String(v.phonecode).replace("+", "")
          : String(v.phonecode);
        CountryCodes.push({ value: `${v.CountryId}`, label: `${v.iso2} (+${phoneCode})` });
      });
      setState({ Countries: resp.Countries, CountryCodes });
    }
    if (resp.States.length > 0) {
      setState({ States: resp.States });
    }
    if (resp.Cities.length > 0) {
      setState({ Cities: resp.Cities });
    }
  };

  const handleDropdownClientInfo = (
    val: string | number,
    _options: unknown,
    name: "CountryId" | "StateId" | "CityId"
  ): void => {
    const CurrAddEditObj = { ...state.CurrAddEditObj };
    CurrAddEditObj[name] = val;
    if (name === "CountryId") {
      CurrAddEditObj.CountryCode = val;
      CurrAddEditObj.StateId = "";
      CurrAddEditObj.CityId = "";
      setState({ States: [], Cities: [] });
      void getCountryStateCity(val);
    }
    if (name === "StateId") {
      CurrAddEditObj.CityId = "";
      setState({ Cities: [] });
      void getCountryStateCity(CurrAddEditObj.CountryId as string | number, val);
    }
    if (name === "CityId") {
      CurrAddEditObj[name] = String(val) as unknown as typeof CurrAddEditObj[typeof name];
    }
    setState({ CurrAddEditObj });
  };

  console.log("tate.CurrAddEditObj ",state.CurrAddEditObj )

  const handleCancel = (): void => {
    setState({ ActionType: "" });
  };

  const handleResetPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    name: keyof State["resetPasswordData"]
  ): void => {
    const resetPasswordData = { ...state.resetPasswordData };
    resetPasswordData[name] = e.target.value;
    setState({ resetPasswordData });
  };

  const validateResetPasswordForm = (): boolean => {
    const resetPasswordErrors: State["resetPasswordErrors"] = {};
    let formIsValid = true;
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!state.resetPasswordData.CurrentPassword) {
      formIsValid = false;
      resetPasswordErrors.CurrentPassError = "Current password is required";
    }

    if (!state.resetPasswordErrors.NewPasswordError) {
      formIsValid = false;
      resetPasswordErrors.NewPasswordError = "New password is required";
    } else if (!passwordRegex.test(state.resetPasswordErrors.NewPasswordError)) {
      formIsValid = false;
      resetPasswordErrors.NewPasswordError =
        "Password must be at least 8 characters with uppercase, lowercase, number and special character";
    }

    if (!state.resetPasswordData.ConfirmPassword) {
      formIsValid = false;
      resetPasswordErrors.ConfirmPassword = "Confirm password is required";
    } else if (state.resetPasswordErrors.NewPasswordError !== state.resetPasswordData.ConfirmPassword) {
      formIsValid = false;
      resetPasswordErrors.ConfirmPassword = "Passwords do not match";
    }

    setState({ resetPasswordErrors });
    return formIsValid;
  };

  const handleResetPassword = async (): Promise<void> => {
    if (!validateResetPasswordForm()) {
      return;
    }

    setState({ resetPasswordLoading: true });

    const UserSession = getDecryptedData("UserSession") as UserSession | null;
    const encKey = (import.meta as unknown as { env: { VITE_AUTH_ENC: string } }).env.VITE_AUTH_ENC;
    const encryptedCurrentPass = cryptojs.AES.encrypt(
      state.resetPasswordData.CurrentPassword.trim(),
      encKey
    ).toString();
    const encryptedNewPass = cryptojs.AES.encrypt(
      state.resetPasswordErrors.NewPasswordError.trim(),
      encKey
    ).toString();
    const payload = {
      UserId: UserSession?.UserId as string,
      ClientId: UserSession?.ClientId || (state.CurrAddEditObj.ClientId as string | undefined),
      CurrentPassword: encryptedCurrentPass,
      NewPassword: encryptedNewPass,
    };

    try {
      const resp = await request<unknown>("/ResetUserPassword", payload);
      if (resp) {
        setState({
          resetPasswordLoading: false,
          showResetPasswordModal: false,
          showToast: true,
          toastMessage: "Password updated successfully!",
          resetPasswordData: {
            CurrentPassword: "",
            NewPassword: "",
            ConfirmPassword: "",
          },
          resetPasswordErrors: {},
        });
        setTimeout(() => {
          setState({ showToast: false });
        }, 3000);
      }
    } catch (error) {
      setState({ resetPasswordLoading: false });
      console.error("Password reset failed:", error);
    }
  };

  const closeResetPasswordModal = (): void => {
    setState({
      showResetPasswordModal: false,
      resetPasswordData: {
        CurrentPassword: "",
        NewPassword: "",
        ConfirmPassword: "",
      },
      resetPasswordErrors: {},
    });
  };

  const handleSubmitClientInfo = async (): Promise<void> => {
    if (!validateClientInfoForm()) {
      return;
    }
    setState({ SavingLoader: true });
    const resp = await request<unknown>("/AddUpdateUserMaster", state.CurrAddEditObj);
    if (resp) {
      setState({
        SavingLoader: false,
        showToast: true,
        toastMessage: "Profile saved successfully!",
        ActionType: "",
      });
      setTimeout(() => {
        setState({ showToast: false });
      }, 3000);
    }
  };

  const togglePasswordVisibility = (field: keyof typeof showPassword): void => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  if (state.IsLoading)
    return (
      <div className="h-96 py-20">
        <Spinner size="lg" color="blue-500" text="Fetching data..." />
      </div>
    );
  if (state.Error) return <ErrorScreen message={state.Error} />;

  return (
    <div className="relative w-full  pt-0 pb-6 px-6 ">
      <Toast message={state.toastMessage} show={state.showToast} onClose={() => null} />
      <div className=" w-full pt-2">
        <div className="flex justify-end">
          <div className="flex items-center">
            {state.ActionType !== "" && (
              <button
                onClick={handleCancel}
                className="bg-white border border-[#2196F3] mr-6 text-[0.89rem] cursor-pointer text-[#0582E5] font-medium py-2 px-5 rounded-lg flex items-center space-x-2"
              >
                <X className="w-5 h-5" />
                <span>CANCEL</span>
              </button>
            )}

            <button
              onClick={() => setState({ showResetPasswordModal: true })}
              className="bg-[#0071E9] hover:bg-[#005ABA] text-[0.89rem] cursor-pointer text-white font-medium py-2 px-5 rounded-lg flex items-center space-x-2 mr-4"
            >
              <SquarePen className="w-5 h-5" />
              <span>Reset Password</span>
            </button>

            <button
              onClick={state.SavingLoader ? undefined : () => void handleSubmitClientInfo()}
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
                  <span>Update</span>
                </>
              )}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
          <div className="">
            <label htmlFor="" className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
              First Name<span className="text-red-500">*</span>
            </label>
            <input
              onChange={(e) => handleChange(e, "FirstName")}
              value={state.CurrAddEditObj.FirstName}
              type="text"
              id="client"
              name="client"
              className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8]  focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter FirstName"
              required
            />
            {state.FormErrors.FirstName && (
              <div className="flex items-center mt-1 ml-2">
                <CircleAlert size={14} className="text-red-500" />
                <p className="ml-2 text-red-500 text-sm ">{state.FormErrors.FirstName}</p>
              </div>
            )}
            {state.isDataExist && (
              <div className="flex items-center mt-1 ml-2">
                <CircleAlert size={14} className="text-red-500" />
                <p className="ml-2 text-red-500 text-sm ">{state.isDataExist}</p>
              </div>
            )}
          </div>
          <div className="">
            <label htmlFor="" className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
              Last Name<span className="text-red-500">*</span>
            </label>
            <input
              onChange={(e) => handleChange(e, "LastName")}
              value={state.CurrAddEditObj.LastName}
              type="text"
              id="client"
              name="client"
              className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8]  focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter LastName"
              required
            />
            {state.FormErrors.LastName && (
              <div className="flex items-center mt-1 ml-2">
                <CircleAlert size={14} className="text-red-500" />
                <p className="ml-2 text-red-500 text-sm ">{state.FormErrors.LastName}</p>
              </div>
            )}
          </div>

          <div className="">
            <label htmlFor="" className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
              Email<span className="text-red-500">*</span>
            </label>
            <input
              onChange={(e) => handleChange(e, "Email")}
              value={state.CurrAddEditObj.Email}
              type="text"
              id="client"
              name="client"
              className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8]  focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter Email"
              required
            />
            {state.FormErrors.Email && (
              <div className="flex items-center mt-1 ml-2">
                <CircleAlert size={14} className="text-red-500" />
                <p className="ml-2 text-red-500 text-sm ">{state.FormErrors.Email}</p>
              </div>
            )}
          </div>

          <div className="">
            <label htmlFor="" className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
              Country <span className="text-red-500">*</span>
            </label>
            <Dropdown
              mode="single"
              options={state.Countries}
              value={state.CurrAddEditObj.CountryId as string | number}
              onChange={(val: string | number, item: unknown) => handleDropdownClientInfo(val, item, "CountryId")}
              onSearch={(q: string) => console.log("Search (Multi):", q)}
            />

            {state.FormErrors.CountryId && (
              <div className="flex items-center mt-1 ml-2">
                <CircleAlert size={14} className="text-red-500" />
                <p className="text-red-500 text-sm ">{state.FormErrors.CountryId}</p>
              </div>
            )}
          </div>
          <div className="">
            <label htmlFor="" className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
              State <span className="text-red-500">*</span>
            </label>
            <Dropdown
              mode="single"
              options={state.States}
              value={state.CurrAddEditObj.StateId as string | number}
              onChange={(val: string | number, item: unknown) => handleDropdownClientInfo(val, item, "StateId")}
              onSearch={(q: string) => console.log("Search (Multi):", q)}
            />
            {state.FormErrors.StateId && (
              <div className="flex items-center mt-1 ml-2">
                <CircleAlert size={14} className="text-red-500" />
                <p className="text-red-500 text-sm ">{state.FormErrors.StateId}</p>
              </div>
            )}
          </div>
          <div className="">
            <label htmlFor="" className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
              City <span className="text-red-500">*</span>
            </label>
            <Dropdown
              mode="single"
              options={state.Cities}
              value={state.CurrAddEditObj.CityId as string | number}
              onChange={(val: string | number, item: unknown) => handleDropdownClientInfo(val, item, "CityId")}
              onSearch={(q: string) => console.log("Search (Multi):", q)}
            />
            {state.FormErrors.CityId && (
              <div className="flex items-center mt-1 ml-2">
                <CircleAlert size={14} className="text-red-500" />
                <p className="text-red-500 text-sm ">{state.FormErrors.CityId}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {state.showResetPasswordModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-out" onClick={closeResetPasswordModal} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 ease-out scale-100 opacity-100"
              style={{
                animation: "modalSlideIn 0.3s ease-out",
              }}
            >
              <div className="bg-gradient-to-r from-black to-gray-600 rounded-t-2xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <Shield className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Reset Password</h3>
                      <p className="text-blue-100 text-sm">Update your account security</p>
                    </div>
                  </div>
                  <button onClick={closeResetPasswordModal} className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Current Password<span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showPassword.current ? "text" : "password"}
                        value={state.resetPasswordData.CurrentPassword}
                        onChange={(e) => handleResetPasswordChange(e, "CurrentPassword")}
                        className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility("current")}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword.current ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {state.resetPasswordErrors.CurrentPassError && (
                      <div className="flex items-center space-x-2 text-red-500 animate-fade-in">
                        <CircleAlert size={16} />
                        <p className="text-sm">{state.resetPasswordErrors.CurrentPassError}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      New Password<span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showPassword.new ? "text" : "password"}
                        value={state.resetPasswordErrors.NewPasswordError}
                        onChange={(e) => handleResetPasswordChange(e, "NewPassword")}
                        className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility("new")}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {state.resetPasswordErrors.NewPasswordError && (
                      <div className="flex items-center space-x-2 text-red-500 animate-fade-in">
                        <CircleAlert size={16} />
                        <p className="text-sm">{state.resetPasswordErrors.NewPasswordError}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Confirm Password<span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showPassword.confirm ? "text" : "password"}
                        value={state.resetPasswordData.ConfirmPassword}
                        onChange={(e) => handleResetPasswordChange(e, "ConfirmPassword")}
                        className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility("confirm")}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {state.resetPasswordErrors.ConfirmPassword && (
                      <div className="flex items-center space-x-2 text-red-500 animate-fade-in">
                        <CircleAlert size={16} />
                        <p className="text-sm">{state.resetPasswordErrors.ConfirmPassword}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 p-4 bg-red-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-red-800 font-medium mb-2">Password Requirements:</p>
                  <ul className="text-xs text-red-600 space-y-1">
                    <li>• At least 8 with uppercase, lowercase, number and special chars</li>
                    <li>• Must not match current password</li>
                    <li>• Confirm password must match new password</li>
                  </ul>
                </div>

                <div className="flex justify-end space-x-3 mt-8">
                  <button
                    onClick={closeResetPasswordModal}
                    className="px-6 py-2.5 text-gray-600 font-medium bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors duration-200 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={state.resetPasswordLoading ? undefined : () => void handleResetPassword()}
                    disabled={state.resetPasswordLoading}
                    className="bg-[#76d300] hover:bg-[#47a800] text-[0.89rem] cursor-pointer text-gray-950font-medium py-2 px-5 rounded-lg flex items-center space-x-2"
                  >
                    {state.resetPasswordLoading ? (
                      <>
                        <Spinner size="xs" color="white" text="" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Update Password</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        @keyframes slide-in {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }

        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
