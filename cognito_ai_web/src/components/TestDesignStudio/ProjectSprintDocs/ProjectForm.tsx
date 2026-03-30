// ProjectAddModal.tsx — Projects Add Form inside CustomModal
import React, { useEffect, useReducer, useRef } from "react";
import { CircleAlert, Save } from "lucide-react";
import Dropdown from "../../../utils/Dropdown";
import DatePicker from "../../../utils/DatePicker";
import SpinnerV2 from "../../../utils/SpinnerV2";
import { apiRequest } from "../../../utils/helpers/ApiHelper";
import { getDecryptedData } from "../../../utils/helpers/storageHelper";
import CustomModal from "../../../utils/CustomModal";

interface ProjectsProps {
    isOpen: boolean;
    onClose: () => void; // Close the modal from parent
    CurrClientDetails?: { ClientId?: string };
    title?: React.ReactNode | string;
    width?: string; // pass CustomModal width class, defaults to max-w-7xl
    onSaved?: () => void;
}

interface CurrAddEditObj {
    ClientId: string;
    ProjectId: string;
    ProjectTypeId: string;
    ProjectName: string;
    BusinessUnitId: string;
    StartDate: string;
    EndDate: string;
    Description: string;
}

interface State {
    Error: string;
    IsBootLoading: boolean;
    SavingLoader: boolean;
    CurrAddEditObj: CurrAddEditObj;
    BusinessUnitsList: any[];
    FormErrors: Record<string, string>;
    CurrClientDetails: { ClientId: string };
}

export default function ProjectAddModal(props: ProjectsProps) {
    const [state, setState] = useReducer(
        (s: State, n: Partial<State>): State => ({ ...s, ...n }),
        {
            Error: "",
            IsBootLoading: true,
            SavingLoader: false,
            BusinessUnitsList: [],
            CurrClientDetails: { ClientId: "" },
            CurrAddEditObj: {
                ClientId: "",
                ProjectId: "",
                ProjectTypeId: "Agile",
                ProjectName: "",
                BusinessUnitId: "",
                StartDate: "",
                EndDate: "",
                Description: "",
            },
            FormErrors: {},
        }
    );

    const didInit = useRef(false);

    useEffect(() => {
        if (!props.isOpen) return; // initialize when the modal opens
        if (didInit.current) return;
        didInit.current = true;

        const init = async () => {
            try {
                await setCurrentClient();
            } catch (e: any) {
                setState({ Error: e?.toString?.() ?? "Something went wrong" });
            } finally {
                setState({ IsBootLoading: false });
            }
        };

        init();
    }, [props.isOpen]);

    const setCurrentClient = async () => {
        let session: any = getDecryptedData("UserSession");
        const ClientId = props?.CurrClientDetails?.ClientId ?? session?.ClientId ?? "";
        setState({
  CurrClientDetails: { ClientId },
  CurrAddEditObj: {
    ...state.CurrAddEditObj,
    ClientId,
  },
});

        if (ClientId) await getBusinessUnitsList(ClientId);
    };

    const getBusinessUnitsList = async (ClientId = "") => {
        try {
            const resp: any = await apiRequest("/api/GetBusinessUnitMasterByClientId", { ClientId });
            setState({ BusinessUnitsList: resp?.ResponseData ?? [] });
        } catch (err) {
            console.error("Error loading Business Units:", err);
        }
    };

    const handleDateChange = (date: string, name: string) => {
        setState({ CurrAddEditObj: { ...state.CurrAddEditObj, [name]: date } as CurrAddEditObj });
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
        name: string
    ) => {
        setState({ CurrAddEditObj: { ...state.CurrAddEditObj, [name]: e.target.value } as CurrAddEditObj });
    };

    const handleDropdown = (val: string, _opt: any, name: string) => {
        const updated = { ...state.CurrAddEditObj, [name]: val } as CurrAddEditObj;
        setState({ CurrAddEditObj: updated });
    };

    const validate = () => {
        const errs: Record<string, string> = {};
        let ok = true;
        const required: Array<keyof CurrAddEditObj> = ["ClientId", "ProjectName", "BusinessUnitId"];
        required.forEach((k) => {
            const v = state.CurrAddEditObj[k];
            if (!v || String(v).trim() === "") {
                ok = false;
                errs[k] = "This field is required";
            }
        });

        // End >= Start check
        const { StartDate, EndDate } = state.CurrAddEditObj;
        if (StartDate && EndDate) {
            try {
                const start = new Date(StartDate).getTime();
                const end = new Date(EndDate).getTime();
                if (!isNaN(start) && !isNaN(end) && end < start) {
                    ok = false;
                    errs["EndDate"] = "End date cannot be before start date";
                }
            } catch {}
        }

        setState({ FormErrors: errs });
        return ok;
    };

    const resetForm = () => {
        setState({
            CurrAddEditObj: {
                ClientId: state.CurrClientDetails.ClientId || "",
                ProjectId: "",
                ProjectTypeId: "Agile",
                ProjectName: "",
                BusinessUnitId: "",
                StartDate: "",
                EndDate: "",
                Description: "",
            },
            FormErrors: {},
        });
    };

    const handleSave = async () => {
        if (!validate()) return;

        try {
            setState({ SavingLoader: true });
            const payload = { ...state.CurrAddEditObj };
            const resp: any = await apiRequest("/AddUpdateClientProject", payload);

            // Auto-create first sprint for Waterfall projects added fresh (kept from original logic)
            if (
                resp &&
                payload.ProjectTypeId === "Waterfall" &&
                (payload.ProjectId === "" || payload.ProjectId === undefined) &&
                resp?.addClientProject?.insertId
            ) {
                const reqObj = {
                    ClientId: payload.ClientId,
                    ProjectId: resp.addClientProject.insertId,
                    SprintId: "",
                    SprintName: "Sprint 1",
                    StartDate: "",
                    EndDate: "",
                    InputFileURL: "",
                    MarkdownFileURL: "",
                    DataParseStatus: "",
                };
                await apiRequest("/AddUpdateClientProjectSprint", reqObj);
            }

            // Optional parent refresh
            props.onSaved && props.onSaved();

            // Close the modal after successful save
            props.onClose();

            // Reset form for next open
            resetForm();
        } catch (e) {
            console.error(e);
            setState({ Error: (e as any)?.toString?.() ?? "Save failed" });
        } finally {
            setState({ SavingLoader: false });
        }
    };

    const footer = [
        <button
            key="close"
            onClick={() => {
                resetForm();
                props.onClose();
            }}
            className="mt-2 cursor-pointer px-5 py-2 bg-white text-blue-700 border border-blue-600 text-sm rounded-lg"
        >
            Close
        </button>,
        <button
            key="save"
            onClick={state.SavingLoader ? undefined : handleSave}
            className="mt-2 cursor-pointer px-5 py-2 bg-[#0071E9] hover:bg-[#005ABA] text-white text-sm rounded-lg flex items-center gap-2"
        >
            {state.SavingLoader ? <SpinnerV2 text="Saving..." /> : (<><Save className="w-4 h-4"/> Save</>)}
        </button>,
    ];

    return (
        <CustomModal
            width={props.width ?? "max-w-7xl"}
            isOpen={props.isOpen}
            onClose={() => {
                resetForm();
                props.onClose();
            }}
            title={props.title ?? <div className="font-medium text-base">Add Project</div>}
            footerContent={footer}
        >
            {state.IsBootLoading ? (
                <div className="h-64 py-20">
                    <SpinnerV2 text="Loading..." />
                </div>
            ) : (
                <div className="space-y-6 text-sm">
                    {state.Error && (
                        <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
                            {state.Error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Project Name */}
                        <div>
                            <label className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                Project Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                onChange={(e) => handleChange(e, "ProjectName")}
                                value={state.CurrAddEditObj.ProjectName}
                                type="text"
                                className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter Project Name"
                                required
                            />
                            {state.FormErrors.ProjectName && (
                                <div className="flex items-center mt-1 ml-2">
                                    <CircleAlert size={14} className="text-red-500" />
                                    <p className="ml-2 text-red-500 text-sm">{state.FormErrors.ProjectName}</p>
                                </div>
                            )}
                        </div>

                        {/* Business Unit */}
                        <div>
                            <label className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                                Business Unit <span className="text-red-500">*</span>
                            </label>
                            <Dropdown
                                mode="single"
                                options={state.BusinessUnitsList}
                                value={state.CurrAddEditObj.BusinessUnitId}
                                onChange={(val, item) => handleDropdown(val, item, "BusinessUnitId")}
                                onSearch={() => {}}
                            />
                            {state.FormErrors.BusinessUnitId && (
                                <div className="flex items-center mt-1 ml-2">
                                    <CircleAlert size={14} className="text-red-500" />
                                    <p className="text-red-500 text-sm">{state.FormErrors.BusinessUnitId}</p>
                                </div>
                            )}
                        </div>

                        {/* Start Date */}
                        <div>
                            <label className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">Start Date</label>
                            <DatePicker
                                value={state.CurrAddEditObj.StartDate}
                                onChange={(d) => handleDateChange(d, "StartDate")}
                            />
                        </div>

                        {/* End Date */}
                        <div>
                            <label className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">End Date</label>
                            <DatePicker
                                value={state.CurrAddEditObj.EndDate}
                                onChange={(d) => handleDateChange(d, "EndDate")}
                            />
                            {state.FormErrors.EndDate && (
                                <div className="flex items-center mt-1 ml-2">
                                    <CircleAlert size={14} className="text-red-500" />
                                    <p className="text-red-500 text-sm">{state.FormErrors.EndDate}</p>
                                </div>
                            )}
                        </div>

                        {/* Project Type */}
                        <div>
                            <label className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">Project Type</label>
                            <Dropdown
                                mode="single"
                                options={[
                                    { label: "Agile", value: "Agile" },
                                    { label: "Waterfall", value: "Waterfall" },
                                ]}
                                value={state.CurrAddEditObj.ProjectTypeId}
                                onChange={(val, item) => handleDropdown(val, item, "ProjectTypeId")}
                                onSearch={() => {}}
                            />
                        </div>

                        {/* Description */}
                        <div className="sm:col-span-2 lg:col-span-3">
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-[0.90rem] text-[#2C3E50] font-medium">Description</label>
                            </div>
                            <div className="relative">
                <textarea
                    onChange={(e) => handleChange(e, "Description")}
                    value={state.CurrAddEditObj.Description}
                    rows={4}
                    maxLength={2000}
                    placeholder="Description"
                    className="w-full px-4 shadow text-[0.85rem] py-3 pr-10 text-gray-700 border border-blue-300 rounded-md bg-[#f8f8f8] resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </CustomModal>
    );
}
