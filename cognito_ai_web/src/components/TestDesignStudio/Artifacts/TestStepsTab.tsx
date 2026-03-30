import React from 'react';
import CustomTableData from "@/utils/CustomTableData";
import DropdownV2 from "../../../utils/DropdownV2";
import Spinner from "../../../utils/Spinner";
import { CircleAlert, Info } from "lucide-react";

interface TestStepsTabProps {
    testStepsHeaderList: any[];
    selectedTestStepsHeader: string;
    onTestStepsHeaderChange: (value: string) => void;
    availableTestSteps: any[];
    selectedTestStepsIds: string[];
    onTestStepSelection: (id: string) => void;
    onSelectAllTestSteps: (checked: boolean) => void;
    onAssignTestSteps: () => void;
    savingLoader: boolean;
}

const TestStepsTab: React.FC<TestStepsTabProps> = ({
    testStepsHeaderList,
    selectedTestStepsHeader,
    onTestStepsHeaderChange,
    availableTestSteps,
    selectedTestStepsIds,
    onTestStepSelection,
    onSelectAllTestSteps,
    onAssignTestSteps,
    savingLoader,
}) => {
    const AvailableTestStepsColumns = [
        {
            key: "Select",
            header: (
                <input
                    type="checkbox"
                    checked={availableTestSteps.length > 0 && selectedTestStepsIds.length === availableTestSteps.length}
                    onChange={(e) => onSelectAllTestSteps(e.target.checked)}
                    className="w-4 h-4 cursor-pointer"
                />
            ),
            sortable: false,
            filterable: false,
            TruncateData: false,
            colWidth: "5%",
        },
        {
            key: "StepNo",
            header: "Step No",
            sortable: false,
            filterable: false,
            TruncateData: false,
            colWidth: "8%",
        },
        {
            key: "Description",
            header: "Description",
            sortable: false,
            filterable: false,
            TruncateData: false,
            colWidth: "28%",
            truncateAt: 50,
        },
        {
            key: "ExpectedResult",
            header: "Expected Result",
            sortable: false,
            filterable: false,
            TruncateData: false,
            colWidth: "28%",
            truncateAt: 50,
        },
        {
            key: "ComponentType",
            header: "Component Type",
            sortable: false,
            filterable: false,
            TruncateData: false,
            colWidth: "12%",
        },
        {
            key: "Component",
            header: "Component",
            sortable: false,
            filterable: false,
            TruncateData: false,
            colWidth: "15%",
        },
    ];

    const AvailableTestStepsData = availableTestSteps.map((v: any, index: number) => {
        const isSelected = selectedTestStepsIds.includes(v.TestStepDetailId) || v.isAssignedAlready === true;
        console.log("header =>", v);
        return {
            Select: (
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onTestStepSelection(v.TestStepDetailId)}
                    className="w-4 h-4 cursor-pointer"
                />
            ),
            StepNo: v.StepNo || index + 1,
            Description: v.Description || "-",
            ExpectedResult: v.ExpectedResult || "-",
            ComponentType: `${v?.ComponentTypeMaster?.ComponentTypeName} - ${v?.ComponentType}` || "-",
           Component: v?.ComponentTypeMaster?.ComponentIdLabel
                ? v?.ComponentTypeMaster?.ComponentIdLabel
                ? `${v.Description} - (${v.Component})`
                : v.component.Component
                : v?.component?.ExecutionComponentId
                ? v.component.ExecutionComponentId
                : "-"
        };
    });

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Test Steps Header
                    </label>
                    <DropdownV2
                        key={`test-steps-header-${testStepsHeaderList.length}`}
                        size="medium"
                        mode="single"
                        searchable={true}
                        options={testStepsHeaderList}
                        value={selectedTestStepsHeader || (testStepsHeaderList.length > 0 ? testStepsHeaderList[0].value : "")}
                        onChange={(val: any) => {
                            if (val && val !== 'undefined') {
                                onTestStepsHeaderChange(val);
                            } else {
                                onTestStepsHeaderChange("");
                            }
                        }}
                        onSearch={() => {}}
                        placeholder="Select Test Steps Header"
                    />
                </div>
                {selectedTestStepsHeader && selectedTestStepsIds.length > 0 && (
                    <div className="pt-6">
                        <button
                            onClick={onAssignTestSteps}
                            disabled={savingLoader}
                            className="px-6 py-2 bg-[#0071E9] text-white rounded-lg cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {savingLoader ? (
                                <>
                                    <Spinner size="sm" color="white" />
                                    Assigning...
                                </>
                            ) : (
                                "Assign To Test Case"
                            )}
                        </button>
                    </div>
                )}
            </div>

            {selectedTestStepsHeader && availableTestSteps.length > 0 && (
                <div>
                    <div className="mb-2">
                        <p className="font-semibold text-sm">
                            Available Test Steps ({selectedTestStepsIds.length} selected)
                        </p>
                    </div>
                    <CustomTableData
                        spinnerLabel=""
                        showSpinnerFlag={false}
                        scrollHeightClass="max-h-96"
                        truncateCharLimit={50}
                        data={AvailableTestStepsData}
                        columns={AvailableTestStepsColumns}
                        rowKey="id"
                    />
                </div>
            )}

            {selectedTestStepsHeader && availableTestSteps.length === 0 && (
                <div className="text-center py-12 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                    <CircleAlert size={48} className="mx-auto mb-3 text-yellow-500" />
                    <p className="text-lg font-medium text-gray-700">No Test Steps Defined</p>
                    <p className="text-sm mt-2 text-gray-600">
                        The selected Test Steps Header "<strong>{
                            testStepsHeaderList.find(h => h.value === selectedTestStepsHeader)?.label
                        }</strong>" doesn't have any test step details yet.
                    </p>
                    <p className="text-sm mt-1 text-gray-600">
                        Please select a different header or add test steps to this header first.
                    </p>
                </div>
            )}

            {!selectedTestStepsHeader && testStepsHeaderList.length > 0 && (
                <div className="text-center py-8 text-gray-500">
                    <Info size={48} className="mx-auto mb-2 text-gray-400" />
                    <p>Please select a Test Steps Header to view available test steps</p>
                </div>
            )}
            
            {testStepsHeaderList.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    <CircleAlert size={48} className="mx-auto mb-2 text-yellow-500" />
                    <p>No Test Steps Headers available for this transaction code</p>
                </div>
            )}
        </div>
    );
};

export default TestStepsTab;