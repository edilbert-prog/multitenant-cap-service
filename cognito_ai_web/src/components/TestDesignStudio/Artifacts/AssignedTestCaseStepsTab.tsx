import React, { useState } from 'react';
import CustomTableData from "@/utils/CustomTableData";
import DropdownV2 from "../../../utils/DropdownV2";
import Spinner from "../../../utils/Spinner";
import {PlayCircle, Trash2, Info, History, Database, FileText, ClipboardList} from "lucide-react";
import { FaListCheck } from "react-icons/fa6";
import ConfirmPopup from "../../../utils/ConfirmPopup";
import { apiRequest } from "../../../utils/helpers/ApiHelper";
import DatasetEditorPopup from "./DatasetEditorPopup";
import TestcaseReportModal from "../../../utils/TestcaseReportModal";

interface AssignedTestCaseStepsTabProps {
    assignedTestCaseSteps: any[];
    testStepsHeaderList: any[];
    assignedTestStepsFilter: string;
    onAssignedTestStepsFilterChange: (value: string) => void;
    onExecuteSteps: () => void;
    executingSteps: boolean;
    onDeleteAssignedStep: (payload: any) => void;
    deletingId: string | null;
    onShowApiDetails: (component: any) => void;
    onUpdateAssignedSteps: (updatedSteps: any[]) => void;
}

interface ConfirmPopupProps {
    message: string;
    onConfirm: () => void;
    children: React.ReactNode;
    [key: string]: unknown;
}

const ConfirmPopupTyped = ConfirmPopup as React.ComponentType<ConfirmPopupProps>;

const AssignedTestCaseStepsTab: React.FC<AssignedTestCaseStepsTabProps> = ({
    assignedTestCaseSteps,
    testStepsHeaderList,
    assignedTestStepsFilter,
    onAssignedTestStepsFilterChange,
    onExecuteSteps,
    executingSteps,
    onDeleteAssignedStep,
    deletingId,
    onShowApiDetails,
    onUpdateAssignedSteps,
}) => {
    const [isLoadingExecution, setIsLoadingExecution] = useState<string | null>(null);
    const [showAllReports, setShowAllReports] = useState(false);
    const [allReportsData, setAllReportsData] = useState<any[]>([]);
    const [datasetEditor, setDatasetEditor] = useState<{
        isOpen: boolean;
        datasets: any[];
        currentStepData: any;
    }>({
        isOpen: false,
        datasets: [],
        currentStepData: null,
    });

    const handleShowExecutionDetails = async (result: any) => {
        const TestStepsId = result?.TestStepsId || '';
        const TestCaseId = result?.TestCaseId || '';
        const StepNo = result?.StepNo || '';
        
        if (!TestStepsId || !TestCaseId) {
            console.error('TestStepsId or TestCaseId is missing');
            return;
        }
        
        const loadingKey = `${TestCaseId}-${TestStepsId}`;
        setIsLoadingExecution(loadingKey);
        
        try {
            const response = await apiRequest('/GetTestCaseExecutionResultsByIds', {
                    TestCaseId: TestCaseId,
                    TestStepsId: TestStepsId,
                    StepNo: StepNo
            });
            
            const data = response; 
            
            console.log(
                "data.ResponseData", 
                data.ResponseData
            );

            if (data.ResponseData && data.ResponseData.length > 0) {
                onShowApiDetails(data.ResponseData);
            } else {
                console.error('No execution results found');
                onShowApiDetails([]);
            }
        } catch (error) {
            console.error('Error fetching execution results:', error);
        } finally {
            setIsLoadingExecution(null);
        }
    };

    const handleShowAllReports = async () => {
        const reportsData: any[] = [];
        
        for (const testCaseStep of assignedTestCaseSteps) {
            if (Array.isArray(testCaseStep.TestCaseStepsResults) && testCaseStep.TestCaseStepsResults.length > 0) {
                for (const result of testCaseStep.TestCaseStepsResults) {
                    const componentTypeDisplay = result?.component?.ComponentTypeName || result?.DetailComponentType || "";
            console.log("testCaseSteptestCaseSteptestCaseStep",result)

                    // Skip if component type is "Validation"
                    if (componentTypeDisplay === "Validation") {
                        const enrichedData ={
                            StepNo: result?.StepNo ?? "-",
                            IterationNo: result?.LatestExecutionResult.IterationNo?? "-",
                            Result: result?.LatestExecutionResult.Result?? "-",
                            VCData: result?.LatestExecutionResult.Data.data ?? "-",
                            Component: `${result?.ComponentTypeInfo?.ComponentIdLabel || ""}`.trim() || "-",
                            Description: result?.DetailDescription || testCaseStep?.Description || "-",
                            ComponentType: componentTypeDisplay,
                        };
                        reportsData.push(enrichedData);
                    }else{
                        const TestStepsId = result?.TestStepsId || '';
                        const TestCaseId = result?.TestCaseId || '';
                        const StepNo = result?.StepNo || '';
                        const IterationNo = result?.LatestExecutionResult?.IterationNo || '';

                        if (!TestStepsId || !TestCaseId) {
                            continue;
                        }

                        try {
                            const response = await apiRequest('/GetTestCaseExecutionResultsByIterationId', {
                                TestCaseId: TestCaseId,
                                TestStepsId: TestStepsId,
                                StepNo: StepNo,
                                IterationNo: IterationNo,
                            });

                            const data = response;

                            if (data.ResponseData && data.ResponseData.length > 0) {
                                // Add step metadata to each report
                                const enrichedData = data.ResponseData.map((item: any) => ({
                                    ...item,
                                    StepNo: result?.StepNo ?? "-",
                                    Component: `${result?.ComponentTypeInfo?.ComponentIdLabel || ""}`.trim() || "-",
                                    Description: result?.DetailDescription || testCaseStep?.Description || "-",
                                    ComponentType: componentTypeDisplay,
                                }));

                                reportsData.push(...enrichedData);
                            }
                        } catch (error) {
                            console.error('Error fetching execution results:', error);
                        }
                    }


                }
            }
        }
        
        setAllReportsData(reportsData);
        setShowAllReports(true);
    };

    const handleOpenDatasetEditor = (result: any, datasets: any[]) => {
        setDatasetEditor({
            isOpen: true,
            datasets: datasets,
            currentStepData: result,
        });
    };

    const handleCloseDatasetEditor = () => {
        setDatasetEditor({
            isOpen: false,
            datasets: [],
            currentStepData: null,
        });
    };

    const handleSaveDataset = (updatedDataset: any) => {
        // Helper function to remove __MANDATORY__ suffix from keys
        const cleanDatasetKeys = (dataset: any) => {
            if (!dataset || typeof dataset !== 'object') return dataset;
            
            const cleanedDataset: any = Array.isArray(dataset) ? [] : {};
            
            for (const key in dataset) {
                // Remove __MANDATORY__ suffix if it exists
                const cleanKey = key.replace(/__MANDATORY__$/g, '');
                cleanedDataset[cleanKey] = dataset[key];
            }
            
            return cleanedDataset;
        };

        // Clean the updated dataset
        const cleanedUpdatedDataset = cleanDatasetKeys(updatedDataset);

        // Update the assignedTestCaseSteps in the background (in props)
        const updatedSteps = assignedTestCaseSteps.map(step => {
            if (step.TestCaseResultId === datasetEditor.currentStepData.TestCaseResultId) {
                return {
                    ...step,
                    TestCaseStepsResults: step.TestCaseStepsResults.map((result: any) => {
                        if (result.TestCaseResultId === datasetEditor.currentStepData.TestCaseResultId) {
                            // Get existing datasets and clean their keys too
                            const existingDatasets = result.component?.ApiDetails?.Datasets || [];
                            const cleanedExistingDatasets = existingDatasets.map((dataset: any) => 
                                cleanDatasetKeys(dataset)
                            );
                            
                            return {
                                ...result,
                                component: {
                                    ...result.component,
                                    ApiDetails: {
                                        ...result.component?.ApiDetails,
                                        Datasets: [...cleanedExistingDatasets, cleanedUpdatedDataset]
                                    }
                                }
                            };
                        }
                        return result;
                    })
                };
            }
            return step;
        });

        console.log('Updated assignedTestCaseSteps with new dataset:', updatedSteps);
        
        // Update parent component's state
        onUpdateAssignedSteps(updatedSteps);
        
        // Close the editor
        handleCloseDatasetEditor();
    };
    
    const AssignedTestCaseStepsColumns = [
        { key: "StepNo", header: "Step No", sortable: false, filterable: false, TruncateData: false, colWidth: "7%" },
        { key: "TestLevel", header: "Test Level", sortable: false, filterable: false, TruncateData: false, colWidth: "10%" },
        { key: "Description", header: "Description", sortable: false, filterable: false, TruncateData: false, colWidth: "20%", truncateAt: 50 },
        { key: "ExpectedResult", header: "Expected Result", sortable: false, filterable: false, TruncateData: false, colWidth: "20%", truncateAt: 50 },
        { key: "ComponentType", header: "Component Type", sortable: false, filterable: false, TruncateData: false, colWidth: "11%" },
        { key: "Component", header: "Component", sortable: false, filterable: false, TruncateData: false, colWidth: "13%" },
        { key: "Dataset", header: "Dataset", sortable: false, filterable: false, TruncateData: false, colWidth: "5%" },
        { key: "Result", header: "Result", sortable: false, filterable: false, TruncateData: false, colWidth: "8%" },
        { key: "Actions", header: "", sortable: false, filterable: false, TruncateData: false, colWidth: "5%" },
    ];

    const AssignedTestCaseStepsData = assignedTestCaseSteps.flatMap((testCaseStep: any) => {
        if (Array.isArray(testCaseStep.TestCaseStepsResults) && testCaseStep.TestCaseStepsResults.length > 0) {
            return testCaseStep.TestCaseStepsResults.map((result: any) => {
                const hasApiData = !!(result?.component?.ApiDetails);
                const latestExecution = result?.LatestExecutionResult;
                const hasExecutionReport = !!latestExecution?.Result;
                const componentTypeDisplay = result?.component?.ComponentTypeName || result?.DetailComponentType || "-";
                const TestStepsId = result?.TestStepsId || '';
                const TestCaseId = result?.TestCaseId || '';
                const loadingKey = `${TestCaseId}-${TestStepsId}`;
                const isCurrentlyLoading = isLoadingExecution === loadingKey;
                let LatestExecutionResult = { ComponentType: componentTypeDisplay, ...result.LatestExecutionResult };
                
                // Get datasets from ApiDetails
                const datasets = result?.component?.ApiDetails?.Datasets || [];
                const hasDatasets = datasets.length > 0;

                return {
                    RowId: `${result.TestCaseResultId}-${result?.StepNo ?? "NA"}`,
                    TestCaseResultId: result.TestCaseResultId,
                    TestCaseId: result.TestCaseId,
                    TestStepsId: result.TestStepsId,
                    StepNo: result?.StepNo ?? "-",
                    TestLevel: testCaseStep?.TestLevel || testCaseStep?.TestStepsHeader?.TestLevel || "-",
                    Description: result?.DetailDescription || testCaseStep?.Description || "-",
                    ExpectedResult: result?.DetailExpectedResult || "-",
                    ComponentType: componentTypeDisplay,
                    Component: (
                        <div className="flex items-center gap-2">
                            <span>
                                {`${result?.ComponentTypeInfo?.ComponentIdLabel || ""}`.trim() || "-"}
                            </span>

                            {hasApiData && (
                                <button
                                    onClick={() => onShowApiDetails(result?.component?.ApiDetails)}
                                    className="text-blue-600 hover:text-blue-800"
                                    title="View API Details"
                                >
                                    <Info size={18} className="text-blue-600 cursor-pointer" />
                                </button>
                            )}
                        </div>
                    ),
                    Dataset: (
                        <div className="flex items-center justify-center">
                            <button
                                onClick={() => handleOpenDatasetEditor(result, datasets)}
                                className={`${
                                    hasDatasets ? 'text-green-600 hover:text-green-800' : 'text-gray-400 hover:text-gray-600'
                                }`}
                                title={hasDatasets ? "Edit Dataset" : "Add Dataset"}
                            >
                                <Database size={18} className="cursor-pointer" />
                            </button>
                        </div>
                    ),
                    Result: (
                        <div className="flex items-center gap-2">
                            <span
                                className={`px-2 py-1 rounded text-xs ${
                                result?.Result === "pass"
                                    ? "bg-green-100 text-green-800"
                                    : result?.Result === "fail"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                            >
                                {result?.Result?.toUpperCase() || "none"}
                            </span>
                            {hasExecutionReport && (
                                <button
                                    onClick={() => onShowApiDetails(LatestExecutionResult)}
                                    className="text-blue-600 hover:text-blue-800"
                                    title="View Execution Report"
                                >
                                    <FileText size={18}  className="cursor-pointer text-purple-600" />
                                </button>
                            )}
                            {/*{hasExecutionReport && componentTypeDisplay !== "Validation" && (*/}
                            {/*    <button*/}
                            {/*        onClick={() => handleShowExecutionDetails(result)}*/}
                            {/*        disabled={isCurrentlyLoading}*/}
                            {/*        className="text-blue-600 hover:text-blue-800 disabled:opacity-50"*/}
                            {/*        title="View Execution Report"*/}
                            {/*    >*/}
                            {/*        {isCurrentlyLoading ? (*/}
                            {/*            <Spinner size="sm" />*/}
                            {/*        ) : (*/}
                            {/*            <History size={18} />*/}
                            {/*        )}*/}
                            {/*    </button>*/}
                            {/*)}*/}
                        </div>
                    ),
                    Actions: (
                        <div className="flex items-center justify-center gap-1">
                            <ConfirmPopupTyped
                                message="Are you sure you want to delete this Test Case Step?"
                                onConfirm={() => {
                                    return onDeleteAssignedStep({
                                        TestCaseResultId: result.TestCaseResultId,
                                        TestStepsId: result.TestStepsId,
                                        TestCaseId: result.TestCaseId,
                                    });
                                }}
                            >
                                <button 
                                    className="pr-4 flex items-center" 
                                    type="button" 
                                    disabled={deletingId === result.TestCaseResultId}
                                >
                                    <Trash2 
                                        className={`text-[#1A1A1A] ${
                                            deletingId === result.TestCaseResultId
                                                ? 'opacity-50 cursor-not-allowed' 
                                                : 'cursor-pointer'
                                        }`}
                                        size={18}
                                    />
                                </button>
                            </ConfirmPopupTyped>
                        </div>
                    ),
                };
            });
        }

        return [{
            RowId: `${testCaseStep.TestCaseResultId}-NA`,
            TestCaseResultId: testCaseStep.TestCaseResultId,
            TestCaseId: testCaseStep.TestCaseId,
            TestStepsId: testCaseStep.TestStepsId,
            StepNo: "-",
            TestLevel: testCaseStep?.TestLevel || testCaseStep?.TestStepsHeader?.TestLevel || "-",
            Description: testCaseStep?.Description || "-",
            ExpectedResult: "-",
            ComponentType: "-",
            Component: "-",
            Dataset: "-",
            Result: (
                <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-800">
                    {testCaseStep?.Result || "none"}
                </span>
            ),
            Actions: (
                <ConfirmPopupTyped
                    message="Are you sure you want to delete this Test Case Step?"
                    onConfirm={() => {
                        return onDeleteAssignedStep({
                            TestCaseResultId: testCaseStep.TestCaseResultId,
                            TestStepsId: testCaseStep.TestStepsId,
                            TestCaseId: testCaseStep.TestCaseId,
                        });
                    }}
                >
                    <button 
                        className="p-1 rounded hover:bg-red-50 text-red-600 hover:text-red-800"
                        title="Delete Step"
                        type="button"
                        disabled={deletingId === testCaseStep.TestCaseResultId}
                    >
                        <Trash2 size={18} />
                    </button>
                </ConfirmPopupTyped>
            ),
        }];
    });

    // Check if there are any execution reports available
    const hasAnyExecutionReports = assignedTestCaseSteps.some((step: any) => 
        Array.isArray(step.TestCaseStepsResults) && 
        step.TestCaseStepsResults.some((result: any) => result?.LatestExecutionResult?.Result)
    );

    return (
        <div className="space-y-4">
            {/* All Reports Modal */}
            <TestcaseReportModal
                isOpen={showAllReports}
                onClose={() => setShowAllReports(false)}
                data={allReportsData}
                title="Test Steps Execution Report"
            />

            {/* Dataset Editor Modal */}
            <DatasetEditorPopup
                isOpen={datasetEditor.isOpen}
                datasets={datasetEditor.datasets}
                currentStepData={datasetEditor.currentStepData}
                onClose={handleCloseDatasetEditor}
                onSave={handleSaveDataset}
            />
            
            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Filter by Test Steps Header
                    </label>
                    <DropdownV2
                        size="medium"
                        mode="single"
                        searchable={true}
                        options={testStepsHeaderList}
                        value={assignedTestStepsFilter || (testStepsHeaderList[0]?.value || "")}
                        onChange={(val: any) => {
                            const newFilter = val || testStepsHeaderList[0]?.value || "";
                            onAssignedTestStepsFilterChange(newFilter);
                        }}
                        onSearch={() => {}}
                        placeholder="Select test steps header"
                    />
                </div>
            </div>

            <div className="flex justify-between items-center">
                <div className="flex items-center">
                    <p className="font-semibold text-lg">
                        Assigned Test Case Steps
                    {/*    <span className="text-sm font-normal text-gray-600 ml-2">*/}
                    {/*    (Filtered by: {*/}
                    {/*        testStepsHeaderList.find(h => h.value === assignedTestStepsFilter)?.label ||*/}
                    {/*        testStepsHeaderList[0]?.label ||*/}
                    {/*        "None"*/}
                    {/*    })*/}
                    {/*</span>*/}
                    </p>
                    {(() => {
                        const firstResult = assignedTestCaseSteps
                            .flatMap((step: any) => step.TestCaseStepsResults || [])
                            .find((result: any) => result?.LatestExecutionResult?.IterationNo);

                        return firstResult?.LatestExecutionResult?.IterationNo && (
                            <span className="px-3 ml-4 py-0.5 border border-[#0071E9] text-blue-700 rounded-full font-medium text-[0.70rem] ">
                                ITERATION NO: {firstResult.LatestExecutionResult.IterationNo}
                            </span>
                        );
                    })()}
                </div>

                <div className="flex items-center gap-3">

                    {hasAnyExecutionReports && (
                        <button
                            onClick={handleShowAllReports}
                            className="px-6 py-2 border border-[#0071E9] text-[#0071E9] font-semibold hover:bg-[#0071E9] hover:text-white rounded-lg cursor-pointer  flex items-center gap-2"
                        >
                            <ClipboardList size={18} />
                            View Report
                        </button>
                    )}
                    {assignedTestCaseSteps.length > 0 && (
                        <button
                            onClick={onExecuteSteps}
                            disabled={executingSteps}
                            className="px-6 py-2 bg-[#0071E9] text-base text-white rounded-lg cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {executingSteps ? (
                                <>
                                    <Spinner size="sm" color="white" />
                                    Executing...
                                </>
                            ) : (
                                <>
                                    <PlayCircle size={18} />
                                    Execute Test Case
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {assignedTestCaseSteps.length > 0 ? (
                <CustomTableData
                    spinnerLabel=""
                    showSpinnerFlag={false}
                    scrollHeightClass="max-h-96"
                    truncateCharLimit={50}
                    data={AssignedTestCaseStepsData}
                    columns={AssignedTestCaseStepsColumns}
                    rowKey="RowId"
                />
            ) : (
                <div className="text-center py-12 text-gray-500">
                    <FaListCheck size={48} className="mx-auto mb-3 text-gray-400" />
                    <p className="text-lg font-medium">
                        {assignedTestStepsFilter 
                            ? "No test steps found for this filter"
                            : "No test steps assigned yet"
                        }
                    </p>
                    <p className="text-sm mt-1">
                        {assignedTestStepsFilter
                            ? "Try selecting a different filter or clear the filter to see all assigned steps"
                            : "Assign test steps from the 'Test Steps' tab"
                        }
                    </p>
                </div>
            )}
        </div>
    );
};

export default AssignedTestCaseStepsTab;
