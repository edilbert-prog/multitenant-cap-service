import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronDown, ChevronUp } from "lucide-react";

import TableWiseValidationReport from "../components/TestDesignStudio/Artifacts/TableWiseValidationReport";

interface PostmanViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: any;
    title?: string;
}

type TabType = 'report';

const TestcaseReportModal: React.FC<PostmanViewerModalProps> = ({
                                                                    isOpen,
                                                                    onClose,
                                                                    data,
                                                                    title = "Data Viewer",
                                                                }) => {
    const [itemTabs, setItemTabs] = useState<{ [key: number]: TabType }>({});
    const [collapsedItems, setCollapsedItems] = useState<Set<number>>(new Set());
    console.log("datadatadatadatadata", data);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent): void => {
            if (e.key === "Escape") onClose();
        };

        if (isOpen) {
            document.addEventListener("keydown", handleEsc);
            document.body.style.overflow = "hidden";
        }

        return () => {
            document.removeEventListener("keydown", handleEsc);
            document.body.style.overflow = "";
        };
    }, [isOpen, onClose]);

    const setItemTab = (index: number, tab: TabType) => {
        setItemTabs((prev) => ({ ...prev, [index]: tab }));
    };

    const getItemTab = (index: number): TabType => {
        return itemTabs[index] || "report";
    };

    const toggleItemCollapse = (index: number) => {
        setCollapsedItems((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    const parseIfJSON = (value: any): any => {
        if (typeof value === "string") {
            try {
                return JSON.parse(value);
            } catch {
                return value;
            }
        }
        return value;
    };

    // For Validation steps, extract the data we want to feed into TableWiseValidationReport
    const getValidationReportData = (item: any) => {
        let parsed={}
        if (item?.VCData.length>0){
              parsed = parseIfJSON(item?.VCData[0]);
              parsed.IterationNo=item.IterationNo
              parsed.Result=item.Result
        }
        // If your validation report payload already matches TableWiseValidationReport expectations,
        // just return parsed. Otherwise, adapt/massage here.
        return parsed ?? item?.VCData ?? item;
    };

    // Extract header fields (non-Data fields)
    const extractHeaderFields = (item: any): { [key: string]: any } => {
        const headerFields: { [key: string]: any } = {};
        Object.entries(item).forEach(([key, value]) => {
            if (key !== "Data") {
                headerFields[key] = value;
            }
        });
        return headerFields;
    };

    // Extract and parse Data field
    const extractDataFields = (item: any): { [key: string]: any } | null => {
        if (!item.Data) return null;

        try {
            const parsed = parseIfJSON(item.Data);

            // Navigate to the actual data object (d.__metadata path)
            if (parsed?.d) {
                const dataObj: { [key: string]: any } = {};

                Object.entries(parsed.d).forEach(([key, value]) => {
                    // Skip __metadata and nested objects (to_* fields and other objects)
                    if (
                        key !== "__metadata" &&
                        !key.startsWith("to_") &&
                        (typeof value !== "object" || value === null)
                    ) {
                        dataObj[key] = value;
                    }
                });

                return dataObj;
            }

            return null;
        } catch (error) {
            return null;
        }
    };

    const renderValue = (value: any): string => {
        if (value === null || value === undefined) {
            return "null";
        }
        if (typeof value === "boolean") {
            return value.toString();
        }
        if (typeof value === "string" && value.startsWith("/Date(")) {
            // Handle SAP date format (left as-is)
            return value;
        }
        return String(value);
    };

    // Default non-Validation table view
    const renderTableView = (itemData: any): JSX.Element => {
        const headerFields = extractHeaderFields(itemData);
        const dataFields = extractDataFields(itemData);

        // Split header fields into chunks of 3 for 3-column layout
        const headerEntries = Object.entries(headerFields);
        const chunkedHeaders: Array<Array<[string, any]>> = [];
        for (let i = 0; i < headerEntries.length; i += 3) {
            chunkedHeaders.push(headerEntries.slice(i, i + 3));
        }

        // Split data fields into chunks of 3 for 3-column layout
        const dataEntries = dataFields ? Object.entries(dataFields) : [];
        const chunkedData: Array<Array<[string, any]>> = [];
        for (let i = 0; i < dataEntries.length; i += 3) {
            chunkedData.push(dataEntries.slice(i, i + 3));
        }

        return (
            <div className="space-y-6">
                {/* Header Fields Table - 3 Columns */}
                {/*<div>*/}
                {/*    <h4 className="text-sm font-semibold text-gray-700 mb-3 px-1">*/}
                {/*        Header Information*/}
                {/*    </h4>*/}
                {/*    <div className="rounded-lg overflow-hidden">*/}
                {/*        <table className="w-full table-fixed">*/}
                {/*            <thead className="bg-gradient-to-r from-blue-50 to-blue-100">*/}
                {/*            /!*<tr>*!/*/}
                {/*            /!*    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-1/3">*!/*/}
                {/*            /!*        Field Name*!/*/}
                {/*            /!*    </th>*!/*/}
                {/*            /!*    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-1/3">*!/*/}
                {/*            /!*        Field Name*!/*/}
                {/*            /!*    </th>*!/*/}
                {/*            /!*    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-1/3">*!/*/}
                {/*            /!*        Field Name*!/*/}
                {/*            /!*    </th>*!/*/}
                {/*            /!*</tr>*!/*/}
                {/*            </thead>*/}
                {/*            <tbody className="bg-white">*/}
                {/*            {chunkedHeaders.map((chunk, rowIndex) => (*/}
                {/*                <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">*/}
                {/*                    {chunk.map(([key, value], colIndex) => (*/}
                {/*                        <td key={colIndex} className="px-3 py-3 align-top">*/}
                {/*                            <div className="space-y-1">*/}
                {/*                                <div className=" font-semibold text-gray-900  break-words">*/}
                {/*                                    {key}*/}
                {/*                                </div>*/}
                {/*                                <div className="text-sm font-semibold text-gray-700 break-words">*/}
                {/*                                    {renderValue(value)}*/}
                {/*                                </div>*/}
                {/*                            </div>*/}
                {/*                        </td>*/}
                {/*                    ))}*/}
                {/*                    {chunk.length < 3 &&*/}
                {/*                        Array.from({ length: 3 - chunk.length }).map((_, idx) => (*/}
                {/*                            <td key={`empty-${idx}`} className="px-3 py-3" />*/}
                {/*                        ))}*/}
                {/*                </tr>*/}
                {/*            ))}*/}
                {/*            </tbody>*/}
                {/*        </table>*/}
                {/*    </div>*/}
                {/*</div>*/}

                {/* Data Fields Table - 3 Columns */}
                {dataFields && Object.keys(dataFields).length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 px-1">
                            Component Data
                        </h4>
                        <div className="rounded-lg overflow-hidden">
                            <table className="w-full table-fixed">
                                {/*<thead className="bg-gradient-to-r from-green-50 to-green-100">*/}
                                {/*<tr>*/}
                                {/*    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-1/3">*/}
                                {/*        Field Name*/}
                                {/*    </th>*/}
                                {/*    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-1/3">*/}
                                {/*        Field Name*/}
                                {/*    </th>*/}
                                {/*    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-1/3">*/}
                                {/*        Field Name*/}
                                {/*    </th>*/}
                                {/*</tr>*/}
                                {/*</thead>*/}
                                <tbody className="bg-white">
                                {chunkedData.map((chunk, rowIndex) => (
                                    <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
                                        {chunk.map(([key, value], colIndex) => (
                                            <td key={colIndex} className="px-3 py-3 align-top">
                                                <div className="space-y-1">
                                                    <div className=" font-semibold text-gray-900  break-words">
                                                        {key}
                                                    </div>
                                                    <div className="text-sm text-gray-700 break-words">
                                                        {renderValue(value)}
                                                    </div>
                                                </div>
                                            </td>
                                        ))}
                                        {chunk.length < 3 &&
                                            Array.from({ length: 3 - chunk.length }).map((_, idx) => (
                                                <td key={`empty-${idx}`} className="px-3 py-3" />
                                            ))}
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Render for each iteration item
    const renderIterationItem = (item: any, index: number): JSX.Element => {
        const result = item.Result?.toLowerCase() || "";
        const isPass = result === "pass";
        const activeTab = getItemTab(index);
        const isCollapsed = collapsedItems.has(index);

        // Extract step information if available
        const stepNo = item.StepNo || null;
        const component = item.Component || null;
        const description = item.Description || null;
        const componentType = item.ComponentType || null;
        const hasStepInfo = stepNo || component || description;

        // Decide what to render inside the tab for this item
        const renderItemBody = () => {
            if (componentType?.toLowerCase() === "validation") {
                console.log("getValidationReportData",item)
                const reportData = getValidationReportData(item);
                return <TableWiseValidationReport data={reportData} />;
            }
            return renderTableView(item);
        };

        return (
            <div key={index} className="mb-4 border border-gray-300 rounded-lg overflow-hidden shadow-sm">
                {/* Step Information Header (if available) */}
                {hasStepInfo && (
                    <div className="bg-gray-100  p-3 border-b border-gray-300 top-0 sticky">
                        <div className="flex items-center gap-6 flex-wrap text-sm">
                            {stepNo && (
                                <div>
                                    <span className=" text-lg font-semibold">Step:</span>{" "}
                                    <span className="font-semibold text-lg font-semibold">{stepNo}</span>
                                </div>
                            )}
                            {componentType && (
                                <div>
                                    <span className="text-gray-600 font-medium">Type:</span>{" "}
                                    <span className="font-semibold text-gray-800">{componentType}</span>
                                </div>
                            )}
                            {component && (
                                <div>
                                    <span className="text-gray-600 font-medium">Component:</span>{" "}
                                    <span className="font-semibold text-gray-800">{component}</span>
                                </div>
                            )}
                            {description && (
                                <div className="flex-1">
                                    <span className="text-gray-600 font-medium">Description:</span>{" "}
                                    <span className="font-semibold">{description}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Iteration Header */}
                <div className="bg-s p-4 border-b border-gray-300">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-3 flex-1">
                            <button
                                onClick={() => toggleItemCollapse(index)}
                                className="text-gray-600 hover:text-gray-800 transition-colors"
                            >
                                {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                            </button>
                            {/*<h3 className="text-base font-semibold text-gray-800">*/}
                            {/*    {item.label || `Item ${index + 1}`}*/}
                            {/*</h3>*/}
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-sm">
                                <span className="text-gray-600 font-medium">Iteration:</span>{" "}
                                <span className="font-semibold text-gray-800">{item.IterationNo || "N/A"}</span>
                            </div>
                            <div className="text-sm">
                                <span className="text-gray-600 font-medium">Result:</span>{" "}
                                <span
                                    className={`font-bold uppercase px-2 py-1 rounded ${
                                        isPass ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                    }`}
                                >
                  {item.Result || "N/A"}
                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content for each iteration - only show if not collapsed */}
                {!isCollapsed && (
                    <div className="bg-gray-50">
                        {/* Tab Navigation for this item */}
                        {/*<div className="flex border-b border-gray-200 bg-white px-4">*/}
                        {/*    <button*/}
                        {/*        onClick={() => setItemTab(index, "report")}*/}
                        {/*        className={`px-6 py-3 text-sm font-medium transition-colors ${*/}
                        {/*            activeTab === "report"*/}
                        {/*                ? "text-orange-600 border-b-2 border-orange-600"*/}
                        {/*                : "text-gray-600 hover:text-gray-800"*/}
                        {/*        }`}*/}
                        {/*    >*/}
                        {/*        Report*/}
                        {/*    </button>*/}
                        {/*</div>*/}

                        {/* Tab Content for this item */}
                        <div className="p-4">{renderItemBody()}</div>
                    </div>
                )}
            </div>
        );
    };

    const renderContent = (): JSX.Element => {
        if (!data) {
            return <div className="p-8 text-center text-gray-500">No data available</div>;
        }

        // Array of items
        if (Array.isArray(data)) {
            return <div className="space-y-4">{data.map((item, index) => renderIterationItem(item, index))}</div>;
        }

        // Single object
        const result = data.Result?.toLowerCase() || "";
        const isPass = result === "pass";
        const activeTab = getItemTab(0);
        const isCollapsed = collapsedItems.has(0);
        const hasIterationData = data.IterationNo !== undefined || data.Result !== undefined;

        const renderSingleBody = () => {
            if (data?.ComponentType?.toLowerCase() === "validation") {
                const reportData = getValidationReportData(data);
                return <TableWiseValidationReport data={reportData} />;
            }
            return renderTableView(data);
        };

        return (
            <div className="border border-gray-300 rounded-lg overflow-hidden shadow-sm">
                {/* Header for single item - only show if iteration data exists */}
                {hasIterationData && (
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 border-b border-gray-300">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-3 flex-1">
                                <button
                                    onClick={() => toggleItemCollapse(0)}
                                    className="text-gray-600 cursor-pointer hover:text-gray-800 "
                                >
                                    {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                                </button>
                                <h3 className="text-base font-semibold text-gray-800">{data.label || "Data Item"}</h3>
                            </div>
                            <div className="flex items-center gap-4">
                                {data.IterationNo !== undefined && (
                                    <div className="text-sm">
                                        <span className="text-gray-600 font-medium">Iteration:</span>{" "}
                                        <span className="font-semibold text-gray-800">{data.IterationNo}</span>
                                    </div>
                                )}
                                {data.Result !== undefined && (
                                    <div className="text-sm">
                                        <span className="text-gray-600 font-medium">Result:</span>{" "}
                                        <span
                                            className={`font-bold uppercase px-2 py-1 rounded ${
                                                isPass ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                            }`}
                                        >
                      {data.Result}
                    </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Content - only show if not collapsed */}
                {!isCollapsed && (
                    <div className="bg-gray-50">
                        {/* Tab Navigation */}
                        <div className="flex border-b border-gray-200 bg-white px-4">
                            <button
                                onClick={() => setItemTab(0, "report")}
                                className={`px-6 py-3 text-sm font-medium transition-colors ${
                                    activeTab === "report"
                                        ? "text-orange-600 border-b-2 border-orange-600"
                                        : "text-gray-600 hover:text-gray-800"
                                }`}
                            >
                                Report
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="p-4">{renderSingleBody()}</div>
                    </div>
                )}
            </div>
        );
    };

    const countFields = (obj: any): number => {
        if (!obj) return 0;

        if (Array.isArray(obj)) {
            return obj.length;
        }

        const parsed = parseIfJSON(obj);
        if (typeof parsed === "object" && parsed !== null) {
            return Object.keys(parsed).length;
        }
        return 0;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                    style={{ zIndex: 1003 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 50 }}
                        transition={{ duration: 0.25 }}
                        className="bg-white rounded-lg shadow-xl w-full max-w-8xl mx-4 max-h-[90vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-4 border-b rounded-t-lg border-gray-200 flex items-start justify-between sticky top-0 bg-white z-10">
                            <div>
                                <h2 className="text-xl font-semibold">{title}</h2>
                                {/*{data && (*/}
                                {/*    <div className="text-xs text-gray-500 mt-1">*/}
                                {/*        {Array.isArray(data)*/}
                                {/*            ? `${countFields(data)} ${countFields(data) === 1 ? "iteration" : "iterations"}`*/}
                                {/*            : `${countFields(data)} fields`}*/}
                                {/*    </div>*/}
                                {/*)}*/}
                            </div>
                            <button onClick={onClose} className="text-gray-500 cursor-pointer hover:text-black text-xl" aria-label="Close">
                                <X size={25} />
                            </button>
                        </div>

                        {/* Content - Scrollable */}
                        <div className="overflow-y-auto px-6 py-4 flex-1">{renderContent()}</div>

                        {/* Footer */}
                        <div className="p-3 rounded-b-lg border-t border-gray-200 flex justify-end gap-4 sticky bottom-0 bg-white z-10">
                            <button
                                onClick={onClose}
                                className="cursor-pointer px-5 py-2 bg-white text-blue-700 border border-blue-600 text-sm rounded-lg hover:bg-blue-50"
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default TestcaseReportModal;
