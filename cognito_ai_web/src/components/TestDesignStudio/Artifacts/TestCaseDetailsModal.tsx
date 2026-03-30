import React, { useState, useEffect } from 'react';
import CustomModal from "../../../utils/CustomModal";
import ToggleButtonGroupV3 from "@/utils/ToggleButtonGroupV3";
import CustomTableData from "@/utils/CustomTableData";
import { FaListCheck } from "react-icons/fa6";
import { Info } from "lucide-react";
import TestStepsTab from "./TestStepsTab";
import AssignedTestCaseStepsTab from "./AssignedTestCaseStepsTab";
// import TestCaseKeysTab from "./TestCaseKeysTab";
// import TestCaseKeysTab from "./TestCaseKeysTabV2";
import TestCaseKeysTab from "./TestCaseKeysTabV3";
import SpecificTestStepsMaster from "./SpecificTestStepsMaster";

interface TestCaseDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    testCase: any;
    currentTab: string;
    onTabChange: (key: string) => void;
    testStepsHeaderList: any[];
    selectedTestStepsHeader: string;
    onTestStepsHeaderChange: (value: string) => void;
    availableTestSteps: any[];
    selectedTestStepsIds: string[];
    onTestStepSelection: (id: string) => void;
    onSelectAllTestSteps: (checked: boolean) => void;
    onAssignTestSteps: () => void;
    savingLoader: boolean;
    assignedTestCaseSteps: any[];
    assignedTestStepsFilter: string;
    onAssignedTestStepsFilterChange: (value: string) => void;
    onExecuteSteps: () => void;
    executingSteps: boolean;
    onDeleteAssignedStep: (payload: any) => void;
    deletingId: string | null;
    onShowApiDetails: (component: any) => void;
    onUpdateAssignedSteps: (updatedSteps: any[]) => void;
}

const TestCaseDetailsModal: React.FC<TestCaseDetailsModalProps> = ({
    isOpen,
    onClose,
    testCase,
    currentTab,
    onTabChange,
    testStepsHeaderList,
    selectedTestStepsHeader,
    onTestStepsHeaderChange,
    availableTestSteps,
    selectedTestStepsIds,
    onTestStepSelection,
    onSelectAllTestSteps,
    onAssignTestSteps,
    savingLoader,
    assignedTestCaseSteps,
    assignedTestStepsFilter,
    onAssignedTestStepsFilterChange,
    onExecuteSteps,
    executingSteps,
    onDeleteAssignedStep,
    deletingId,
    onShowApiDetails,
    onUpdateAssignedSteps,
}) => {
    const TC_Tabs = [
        { key: "Test Steps", label: "Test Steps", icon: <FaListCheck size={15} /> },
        { key: "Assigned TestCaseSteps", label: "Assigned Test Steps", icon: <FaListCheck size={15} /> },
        { key: "Test Case Keys", label: "Test Case Keys", icon: <FaListCheck size={15} /> },
        { key: "Specific Test Cases", label: "Specific Test Cases", icon: <FaListCheck size={15} /> },
        { key: "Test Steps AI", label: "Test Steps AI", icon: <FaListCheck size={15} /> },
        { key: "Test Dataset", label: "Test Dataset", icon: <FaListCheck size={15} /> },
    ];

    const TestStepsColumsAI = [
        {
            key: "StepNo",
            header: "Step No",
            sortable: false,
            filterable: false,
            TruncateData: false,
            colWidth: "5%",
        },
        {
            key: "Description",
            header: "Description",
            sortable: false,
            filterable: false,
            TruncateData: false,
            colWidth: "24%",
            truncateAt: 20,
        },
        {
            key: "ExpectedResult",
            header: "ExpectedResult",
            sortable: false,
            filterable: false,
            TruncateData: false,
            colWidth: "24%",
            truncateAt: 20,
        },
    ];

    const rawSteps = testCase.TestSteps;
    const TestStepsDataAI = Array.isArray(rawSteps)
        ? rawSteps.map((v: any, i: number) => {
            if (typeof v === "string") {
                return {
                    StepNo: i + 1,
                    Description: v,
                    ExpectedResult: "-",
                };
            } else if (typeof v === "object" && v !== null) {
                return {
                    StepNo: v.StepNo ?? i + 1,
                    ExpectedResult: v.ExpectedResult ?? JSON.stringify(v.ExpectedResult),
                    Description: v.StepDescription ?? JSON.stringify(v.StepDescription),
                };
            } else {
                return {
                    StepNo: i + 1,
                    ExpectedResult: "-",
                    Description: String(v),
                };
            }
        })
        : [];

    return (
        <CustomModal
            // width="max-w-7xl"
            width="max-w-[95vw]" 
            modalZIndex={1002}
            isOpen={isOpen}
            onClose={onClose}
            title={<div className="font-medium text-base">{testCase.TestCase}</div>}
            footerContent={[
                <button
                    key="close"
                    onClick={onClose}
                    className="mt-2 cursor-pointer px-5 py-2 bg-white text-blue-700 border border-blue-600 text-sm rounded-lg"
                >
                    Close
                </button>,
            ]}
        >
            <div className="space-y-6 h-full flex flex-col text-sm">
                <table className="min-w-full border border-gray-300 rounded-md">
                    <tbody>
                        <tr className="border-t border-gray-200 bg-gray-50">
                            <td className="p-3 font-semibold text-gray-700 w-1/4 border-r border-gray-300">Test Case:</td>
                            <td className="p-3 text-gray-800">{testCase.TestCase}</td>
                        </tr>
                        <tr className="border-t border-gray-200">
                            <td className="p-3 font-medium text-gray-700 border-r border-gray-300">Pre Conditions:</td>
                            <td className="p-3 text-gray-800">{testCase.PreConditions}</td>
                        </tr>
                        <tr className="border-t border-gray-200 bg-gray-50">
                            <td className="p-3 font-medium text-gray-700 border-r border-gray-300">Expected Result:</td>
                            <td className="p-3 text-gray-800">{testCase.ExpectedResult}</td>
                        </tr>
                        <tr className="border-t border-gray-200 bg-gray-50">
                            <td className="p-3 font-medium text-gray-700 border-r border-gray-300">Priority:</td>
                            <td className="p-3 text-gray-800">{testCase.Priority}</td>
                        </tr>
                        <tr className="border-t border-gray-200">
                            <td className="p-3 font-medium text-gray-700 border-r border-gray-300">Test Type:</td>
                            <td className="p-3 text-gray-800">{testCase.TestType}</td>
                        </tr>
                        <tr className="border-t border-gray-200 bg-gray-50">
                            <td className="p-3 font-medium text-gray-700 border-r border-gray-300">Module:</td>
                            <td className="p-3 text-gray-800">{testCase.Module}</td>
                        </tr>
                    </tbody>
                </table>

                <div>
                    <ToggleButtonGroupV3
                        variant="underline"
                        animationFlag={false}
                        initialKey={currentTab}
                        items={TC_Tabs}
                        onChange={onTabChange}
                    />
                </div>

                {currentTab === "Test Steps" && (
                    <TestStepsTab
                        testStepsHeaderList={testStepsHeaderList}
                        selectedTestStepsHeader={selectedTestStepsHeader}
                        onTestStepsHeaderChange={onTestStepsHeaderChange}
                        availableTestSteps={availableTestSteps}
                        selectedTestStepsIds={selectedTestStepsIds}
                        onTestStepSelection={onTestStepSelection}
                        onSelectAllTestSteps={onSelectAllTestSteps}
                        onAssignTestSteps={onAssignTestSteps}
                        savingLoader={savingLoader}
                    />
                )}

                {currentTab === "Assigned TestCaseSteps" && (
                    <AssignedTestCaseStepsTab
                        assignedTestCaseSteps={assignedTestCaseSteps}
                        testStepsHeaderList={testStepsHeaderList}
                        assignedTestStepsFilter={assignedTestStepsFilter}
                        onAssignedTestStepsFilterChange={onAssignedTestStepsFilterChange}
                        onExecuteSteps={onExecuteSteps}
                        executingSteps={executingSteps}
                        onDeleteAssignedStep={onDeleteAssignedStep}
                        deletingId={deletingId}
                        onShowApiDetails={onShowApiDetails}
                        onUpdateAssignedSteps={onUpdateAssignedSteps}
                    />
                )}

                {currentTab === "Test Case Keys" && (
                    <TestCaseKeysTab
                        testCase={testCase}
                        testStepsHeaderList={testStepsHeaderList}
                        assignedTestCaseSteps={assignedTestCaseSteps}
                    />
                )}

                {currentTab === "Specific Test Cases" && (
                    <div className="space-y-4">
                        <div className="bg-white rounded-lg">
                            <p className="font-semibold text-lg mb-">Specific Test Steps</p>
                            {selectedTestStepsHeader ? (
                                <SpecificTestStepsMaster 
                                    TestStepsId={selectedTestStepsHeader} 
                                    TestCaseId={testCase.TestCaseId}
                                    assignedTestCaseSteps={assignedTestCaseSteps}
                                />
                            ) : (
                                <div className="text-center py-12 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                                    <Info size={48} className="mx-auto mb-3 text-yellow-500" />
                                    <p className="text-lg font-medium text-gray-700">No Test Steps Header Selected</p>
                                    <p className="text-sm mt-2 text-gray-600">
                                        Please go to the "Test Steps" tab and select a Test Steps Header first.
                                    </p>
                                    <button
                                        onClick={() => onTabChange("Test Steps")}
                                        className="mt-4 px-6 py-2 bg-[#0071E9] text-white rounded-lg hover:bg-[#5d1fd9]"
                                    >
                                        Go to Test Steps
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {currentTab === "Test Steps AI" && (
                    <div>
                        <div>
                            <p className="font-semibold text-lg pb-2 pl-2">Test Steps (AI):</p>
                        </div>
                        <CustomTableData
                            spinnerLabel=""
                            showSpinnerFlag={false}
                            truncateCharLimit={40}
                            data={TestStepsDataAI}
                            columns={TestStepsColumsAI}
                            rowKey="id"
                        />
                    </div>
                )}

                {currentTab === "Test Dataset" && (
                    <div>
                        {testCase.TestData && (
                            <div>
                                <p className="font-semibold pb-2 pl-2">Test Data:</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Object.entries((testCase.TestData as Record<string, unknown>)).map(([key, value]) => (
                                        <div key={key} className="border border-gray-300 rounded p-3 bg-gray-50">
                                            <p className="text-gray-700">
                                                <span className="font-medium">{JSON.stringify(key)}:</span> {JSON.stringify(value) || '—'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </CustomModal>
    );
};

export default TestCaseDetailsModal;