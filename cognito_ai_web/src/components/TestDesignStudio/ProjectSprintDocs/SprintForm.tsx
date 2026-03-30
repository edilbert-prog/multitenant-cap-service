import React, { useEffect, useReducer } from "react";
import { CircleAlert, Save, X } from "lucide-react";
import CustomModal from "../../../utils/CustomModal";
import DatePicker from "../../../utils/DatePicker";
import SpinnerV2 from "../../../utils/SpinnerV2";
import { apiRequest } from "@/utils/helpers/ApiHelper";

interface CurrProjectRef {
    ClientId: string;
    ProjectId: string;
    BusinessUnitId?: string;
    ProjectTypeId?: string;
}

interface CurrAddEditObj {
    ClientId: string;
    ProjectId: string;
    SprintId: string;
    SprintName: string;
    StartDate: string | Date;
    EndDate: string | Date;
    InputFileURL: string;
    MarkdownFileURL: string;
    DataParseStatus: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void; // Close modal from parent
    CurrProject: CurrProjectRef; // used to pre-fill ClientId & ProjectId
    title?: React.ReactNode | string;
    width?: string; // default max-w-2xl
    onSaved?: () => void; // optional callback after successful save
}

interface State {
    SavingLoader: boolean;
    FormErrors: Record<string, string>;
    CurrAddEditObj: CurrAddEditObj;
}

const makeInitialSprint = (project: CurrProjectRef): CurrAddEditObj => ({
    ClientId: project?.ClientId ?? "",
    ProjectId: project?.ProjectId ?? "",
    SprintId: "",
    SprintName: "",
    StartDate: "",
    EndDate: "",
    InputFileURL: "",
    MarkdownFileURL: "",
    DataParseStatus: "",
});

export default function SprintForm({ isOpen, onClose, CurrProject, title, width = "max-w-2xl", onSaved }: Props) {
    const [state, setState] = useReducer(
        (s: State, n: Partial<State>): State => ({ ...s, ...n }),
        {
            SavingLoader: false,
            FormErrors: {},
            CurrAddEditObj: makeInitialSprint(CurrProject),
        }
    );

    // Reset form each time the modal opens or project changes
    useEffect(() => {
        if (isOpen) {
            setState({ CurrAddEditObj: makeInitialSprint(CurrProject), FormErrors: {} });
        }
    }, [isOpen, CurrProject?.ClientId, CurrProject?.ProjectId]);

    const handleDateChange = (date: string | Date, name: keyof CurrAddEditObj) => {
        setState({ CurrAddEditObj: { ...state.CurrAddEditObj, [name]: date } as CurrAddEditObj });
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
        name: keyof CurrAddEditObj
    ) => {
        setState({ CurrAddEditObj: { ...state.CurrAddEditObj, [name]: e.target.value } as CurrAddEditObj });
    };

    const validate = () => {
        const errs: Record<string, string> = {};
        let ok = true;

        // Required fields
        if (!state.CurrAddEditObj.SprintName || String(state.CurrAddEditObj.SprintName).trim() === "") {
            errs.SprintName = "This field is required";
            ok = false;
        }

        // End >= Start if both present
        const { StartDate, EndDate } = state.CurrAddEditObj;
        const startT = StartDate ? new Date(StartDate).getTime() : NaN;
        const endT = EndDate ? new Date(EndDate).getTime() : NaN;
        if (!Number.isNaN(startT) && !Number.isNaN(endT) && endT < startT) {
            errs.EndDate = "End date cannot be before start date";
            ok = false;
        }

        setState({ FormErrors: errs });
        return ok;
    };

    const resetAndClose = () => {
        setState({ CurrAddEditObj: makeInitialSprint(CurrProject), FormErrors: {} });
        onClose();
    };

    const handleSave = async () => {
        if (!validate()) return;
        try {
            setState({ SavingLoader: true });
            const payload = { ...state.CurrAddEditObj };
            await apiRequest("/AddUpdateClientProjectSprint", payload);

            onSaved && onSaved();
            resetAndClose();
        } catch (e) {
            setState({ FormErrors: { ...state.FormErrors, _root: (e as any)?.toString?.() ?? "Save failed" } });
        } finally {
            setState({ SavingLoader: false });
        }
    };

    const footer = [
        <button
            key="close"
            onClick={resetAndClose}
            className="cursor-pointer px-5 py-2 bg-white text-blue-700 border border-blue-600 text-sm rounded-lg"
        >
            Close
        </button>,
        <button
            key="save"
            onClick={state.SavingLoader ? undefined : handleSave}
            className="cursor-pointer px-5 py-2 bg-[#0071E9] hover:bg-[#005ABA] text-white text-sm rounded-lg flex items-center gap-2"
        >
            {state.SavingLoader ? <SpinnerV2 text="Saving..." /> : (<><Save className="w-4 h-4"/> Save</>)}
        </button>,
    ];

    return (
        <CustomModal
            width={width}
            isOpen={isOpen}
            onClose={resetAndClose}
            title={title ?? <div className="font-medium text-base">New Sprint</div>}
            footerContent={footer}
        >
            <div className="space-y-6">
                {state.FormErrors._root && (
                    <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
                        {state.FormErrors._root}
                    </div>
                )}

                {/* Sprint Name */}
                <div>
                    <label className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">
                        Sprint Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        onChange={(e) => handleChange(e, "SprintName")}
                        value={state.CurrAddEditObj.SprintName as string}
                        type="text"
                        className="w-full px-3 shadow text-[0.85rem] py-2 border border-gray-200 rounded-md bg-[#f8f8f8] focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter Sprint Name"
                        required
                    />
                    {state.FormErrors.SprintName && (
                        <div className="flex items-center mt-1 ml-2">
                            <CircleAlert size={14} className="text-red-500" />
                            <p className="ml-2 text-red-500 text-sm">{state.FormErrors.SprintName}</p>
                        </div>
                    )}
                </div>

                {/* Start Date */}
                <div>
                    <label className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">Start Date</label>
                    <DatePicker value={state.CurrAddEditObj.StartDate} onChange={(d) => handleDateChange(d, "StartDate")} />
                </div>

                {/* End Date */}
                <div>
                    <label className="block text-[0.90rem] text-[#2C3E50] font-medium mb-1">End Date</label>
                    <DatePicker value={state.CurrAddEditObj.EndDate} onChange={(d) => handleDateChange(d, "EndDate")} />
                    {state.FormErrors.EndDate && (
                        <div className="flex items-center mt-1 ml-2">
                            <CircleAlert size={14} className="text-red-500" />
                            <p className="ml-2 text-red-500 text-sm">{state.FormErrors.EndDate}</p>
                        </div>
                    )}
                </div>

                {/* Description (optional) */}
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-[0.90rem] text-[#2C3E50] font-medium">Description (optional)</label>
                    </div>
                    <textarea
                        onChange={(e) => handleChange(e, "MarkdownFileURL")}
                        value={String(state.CurrAddEditObj.MarkdownFileURL ?? "")}
                        placeholder="You can repurpose this field or adjust the payload to include a dedicated Description field on the API."
                        rows={3}
                        className="w-full px-4 shadow text-[0.85rem] py-3 pr-10 text-gray-700 border border-blue-300 rounded-md bg-[#f8f8f8] resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                </div>
            </div>
        </CustomModal>
    );
}
