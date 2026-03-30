import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronDown, ChevronUp } from "lucide-react";

interface PostmanViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: any;
    title?: string;
}

type TabType = 'pretty' | 'raw';

const PostmanViewerModal: React.FC<PostmanViewerModalProps> = ({ 
    isOpen, 
    onClose, 
    data,
    title = "Data Viewer"
}) => {
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [copiedAll, setCopiedAll] = useState<string | null>(null);
    const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
    const [itemTabs, setItemTabs] = useState<{ [key: number]: TabType }>({});
    const [collapsedItems, setCollapsedItems] = useState<Set<number>>(new Set());
    console.log("datadatadatadatadata",data)
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
        setItemTabs(prev => ({ ...prev, [index]: tab }));
    };

    const getItemTab = (index: number): TabType => {
        return itemTabs[index] || 'pretty';
    };

    const toggleItemCollapse = (index: number) => {
        setCollapsedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    const copyToClipboard = (text: string, key?: string): void => {
        navigator.clipboard.writeText(text);
        if (key) {
            setCopiedKey(key);
            setTimeout(() => setCopiedKey(null), 2000);
        }
    };

    const copyAllToClipboard = (text: string, itemIndex: number): void => {
        navigator.clipboard.writeText(text);
        setCopiedAll(`item-${itemIndex}`);
        setTimeout(() => setCopiedAll(null), 2000);
    };

    const toggleExpanded = (key: string): void => {
        setExpandedKeys(prev => {
            const newSet = new Set(prev);
            if (newSet.has(key)) {
                newSet.delete(key);
            } else {
                newSet.add(key);
            }
            return newSet;
        });
    };

    const parseIfJSON = (value: any): any => {
        if (typeof value === 'string') {
            try {
                return JSON.parse(value);
            } catch {
                return value;
            }
        }
        return value;
    };

    const isExpandable = (value: any): boolean => {
        const parsed = parseIfJSON(value);
        return parsed !== null && 
               parsed !== undefined && 
               typeof parsed === 'object' && 
               !Array.isArray(parsed) &&
               Object.keys(parsed).length > 0;
    };

    const renderNestedObject = (obj: any, parentKey: string = '', level: number = 0): JSX.Element => {
        if (obj === null || obj === undefined) {
            return <span className="text-gray-400 italic">null</span>;
        }

        const parsed = parseIfJSON(obj);

        // Handle primitives
        if (typeof parsed !== 'object') {
            return renderPrimitiveValue(parsed);
        }

        // Handle arrays
        if (Array.isArray(parsed)) {
            return (
                <div className="mt-1">
                    <pre className="text-xs bg-gray-800 text-green-400 p-2 rounded overflow-auto max-h-40">
                        {JSON.stringify(parsed, null, 2)}
                    </pre>
                </div>
            );
        }

        // Handle objects
        const entries = Object.entries(parsed);
        const uniqueKey = `${parentKey}-${level}`;
        const isExpanded = expandedKeys.has(uniqueKey);

        if (entries.length === 0) {
            return <span className="text-gray-400 italic">{'{}'}</span>;
        }

        // Show inline preview for small objects
        if (entries.length <= 3 && level > 0 && !isExpanded) {
            return (
                <div className="inline-flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                        {'{'} {entries.length} {entries.length === 1 ? 'field' : 'fields'} {'}'}
                    </span>
                    <button
                        onClick={() => toggleExpanded(uniqueKey)}
                        className="text-xs text-blue-600 hover:text-blue-800"
                    >
                        Expand
                    </button>
                </div>
            );
        }

        return (
            <div className={`${level > 0 ? 'mt-2 ml-4 border-l-2 border-gray-200 pl-3' : ''}`}>
                {level > 0 && (
                    <button
                        onClick={() => toggleExpanded(uniqueKey)}
                        className="text-xs text-blue-600 hover:text-blue-800 mb-2"
                    >
                        {isExpanded ? '▼ Collapse' : '▶ Expand'}
                    </button>
                )}
                {(level === 0 || isExpanded) && entries.map(([key, value], index) => (
                    <div 
                        key={`${uniqueKey}-${key}-${index}`}
                        className="mb-2 bg-white border border-gray-200 rounded p-2"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-semibold text-gray-700 font-mono">
                                        {key}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        ({typeof parseIfJSON(value)})
                                    </span>
                                </div>
                                <div className="text-sm">
                                    {isExpandable(value) ? (
                                        renderNestedObject(value, `${uniqueKey}-${key}`, level + 1)
                                    ) : (
                                        renderValue(value)
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    const copyValue = typeof parseIfJSON(value) === 'object' 
                                        ? JSON.stringify(parseIfJSON(value), null, 2) 
                                        : String(value);
                                    copyToClipboard(copyValue, `${uniqueKey}-${key}`);
                                }}
                                className="ml-2 text-xs text-blue-600 hover:text-blue-800 flex-shrink-0"
                            >
                                {copiedKey === `${uniqueKey}-${key}` ? '✓' : 'Copy'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderPrimitiveValue = (value: any): JSX.Element => {
        if (value === null || value === undefined) {
            return <span className="text-gray-400 italic">null</span>;
        }
        
        if (typeof value === 'boolean') {
            return <span className="text-purple-600 font-semibold">{value.toString()}</span>;
        }
        
        if (typeof value === 'number') {
            return <span className="text-blue-600 font-semibold">{value}</span>;
        }
        
        return <span className="text-gray-700 break-all">{String(value)}</span>;
    };

    const renderValue = (value: any): JSX.Element => {
        const parsed = parseIfJSON(value);

        if (parsed === null || parsed === undefined) {
            return <span className="text-gray-400 italic">null</span>;
        }
        
        if (typeof parsed === 'boolean') {
            return <span className="text-purple-600 font-semibold">{parsed.toString()}</span>;
        }
        
        if (typeof parsed === 'number') {
            return <span className="text-blue-600 font-semibold">{parsed}</span>;
        }
        
        if (typeof parsed === 'string') {
            return <span className="text-gray-700 break-all">{parsed}</span>;
        }
        
        if (typeof parsed === 'object') {
            return (
                <div className="mt-1">
                    <pre className="text-xs bg-gray-800 text-green-400 p-2 rounded overflow-auto max-h-40">
                        {JSON.stringify(parsed, null, 2)}
                    </pre>
                </div>
            );
        }
        
        return <span className="text-gray-700 break-all">{String(value)}</span>;
    };

    const renderPrettyView = (itemData: any): JSX.Element => {
        if (!itemData) {
            return <div className="p-8 text-center text-gray-500">No data available</div>;
        }

        return (
            <div className="space-y-2">
                {renderNestedObject(itemData)}
            </div>
        );
    };

    const renderRawView = (itemData: any, itemIndex: number): JSX.Element => {
        if (!itemData) {
            return <div className="p-8 text-center text-gray-500">No data available</div>;
        }

        const parsed = parseIfJSON(itemData);
        const jsonString = typeof parsed === 'object' 
            ? JSON.stringify(parsed, null, 2)
            : typeof itemData === 'object'
            ? JSON.stringify(itemData, null, 2)
            : String(itemData);

        return (
            <div className="relative">
                <button
                    onClick={() => copyAllToClipboard(jsonString, itemIndex)}
                    className={`absolute top-2 right-2 z-10 px-3 py-1 text-xs rounded transition-colors ${
                        copiedAll === `item-${itemIndex}`
                            ? 'bg-green-600 text-white' 
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                >
                    {copiedAll === `item-${itemIndex}` ? '✓ Copied!' : 'Copy All'}
                </button>
                <pre className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm overflow-auto max-h-[400px]">
                    {jsonString}
                </pre>
            </div>
        );
    };

    const renderIterationItem = (item: any, index: number): JSX.Element => {
        const result = item.Result?.toLowerCase() || '';
        const isPass = result === 'pass';
        const activeTab = getItemTab(index);
        const isCollapsed = collapsedItems.has(index);
        
        return (
            <div key={index} className="mb-4 border border-gray-300 rounded-lg overflow-hidden shadow-sm">
                {/* Header for each iteration */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 border-b border-gray-300">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-3 flex-1">
                            <button
                                onClick={() => toggleItemCollapse(index)}
                                className="text-gray-600 hover:text-gray-800 transition-colors"
                            >
                                {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                            </button>
                            <h3 className="text-base font-semibold text-gray-800">
                                {item.label || `Item ${index + 1}`}
                            </h3>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-sm">
                                <span className="text-gray-600 font-medium">Iteration:</span>{' '}
                                <span className="font-semibold text-gray-800">{item.IterationNo || 'N/A'}</span>
                            </div>
                            <div className="text-sm">
                                <span className="text-gray-600 font-medium">Result:</span>{' '}
                                <span className={`font-bold uppercase px-2 py-1 rounded ${
                                    isPass ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                    {item.Result || 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content for each iteration - only show if not collapsed */}
                {!isCollapsed && (
                    <div className="bg-gray-50">
                        {/* Tab Navigation for this item */}
                        <div className="flex border-b border-gray-200 bg-white px-4">
                            <button
                                onClick={() => setItemTab(index, 'raw')}
                                className={`px-6 py-3 text-sm font-medium transition-colors ${
                                    activeTab === 'raw'
                                        ? 'text-orange-600 border-b-2 border-orange-600'
                                        : 'text-gray-600 hover:text-gray-800'
                                }`}
                            >
                                Raw
                            </button>
                            
                            <button
                                onClick={() => setItemTab(index, 'pretty')}
                                className={`px-6 py-3 text-sm font-medium transition-colors ${
                                    activeTab === 'pretty'
                                        ? 'text-orange-600 border-b-2 border-orange-600'
                                        : 'text-gray-600 hover:text-gray-800'
                                }`}
                            >
                                Pretty
                            </button>
                        </div>

                        {/* Tab Content for this item */}
                        <div className="p-4">
                            {activeTab === 'pretty' ? renderPrettyView(item) : renderRawView(item, index)}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderContent = (): JSX.Element => {
        if (!data) {
            return <div className="p-8 text-center text-gray-500">No data available</div>;
        }

        // Check if data is an array
        if (Array.isArray(data)) {
            return (
                <div className="space-y-4">
                    {data.map((item, index) => renderIterationItem(item, index))}
                </div>
            );
        }

        // If data is a single object, render with header and tabs
        const result = data.Result?.toLowerCase() || '';
        const isPass = result === 'pass';
        const activeTab = getItemTab(0);
        const isCollapsed = collapsedItems.has(0);
        const hasIterationData = data.IterationNo !== undefined || data.Result !== undefined;

        return (
            <div className="border border-gray-300 rounded-lg overflow-hidden shadow-sm">
                {/* Header for single item - only show if iteration data exists */}
                {hasIterationData && (
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 border-b border-gray-300">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-3 flex-1">
                                <button
                                    onClick={() => toggleItemCollapse(0)}
                                    className="text-gray-600 hover:text-gray-800 transition-colors"
                                >
                                    {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                                </button>
                                <h3 className="text-base font-semibold text-gray-800">
                                    {data.label || 'Data Item'}
                                </h3>
                            </div>
                            <div className="flex items-center gap-4">
                                {data.IterationNo !== undefined && (
                                    <div className="text-sm">
                                        <span className="text-gray-600 font-medium">Iteration:</span>{' '}
                                        <span className="font-semibold text-gray-800">{data.IterationNo}</span>
                                    </div>
                                )}
                                {data.Result !== undefined && (
                                    <div className="text-sm">
                                        <span className="text-gray-600 font-medium">Result:</span>{' '}
                                        <span className={`font-bold uppercase px-2 py-1 rounded ${
                                            isPass ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
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
                                onClick={() => setItemTab(0, 'pretty')}
                                className={`px-6 py-3 text-sm font-medium transition-colors ${
                                    activeTab === 'pretty'
                                        ? 'text-orange-600 border-b-2 border-orange-600'
                                        : 'text-gray-600 hover:text-gray-800'
                                }`}
                            >
                                Pretty
                            </button>
                            <button
                                onClick={() => setItemTab(0, 'raw')}
                                className={`px-6 py-3 text-sm font-medium transition-colors ${
                                    activeTab === 'raw'
                                        ? 'text-orange-600 border-b-2 border-orange-600'
                                        : 'text-gray-600 hover:text-gray-800'
                                }`}
                            >
                                Raw
                            </button>
                            

                        </div>

                        {/* Tab Content */}
                        <div className="p-4">
                            {activeTab === 'pretty' ? renderPrettyView(data) : renderRawView(data, 0)}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const countFields = (obj: any): number => {
        if (!obj) return 0;
        
        // If it's an array, return the count of items
        if (Array.isArray(obj)) {
            return obj.length;
        }
        
        const parsed = parseIfJSON(obj);
        if (typeof parsed === 'object' && parsed !== null) {
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
                        className="bg-white rounded-lg shadow-xl w-full max-w-7xl mx-4 max-h-[90vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-4 border-b rounded-t-lg border-gray-200 flex items-start justify-between sticky top-0 bg-white z-10">
                            <div>
                                <h2 className="text-xl font-semibold">{title}</h2>
                                {data && (
                                    <div className="text-xs text-gray-500 mt-1">
                                        {Array.isArray(data) 
                                            ? `${countFields(data)} ${countFields(data) === 1 ? 'iteration' : 'iterations'}`
                                            : `${countFields(data)} fields`
                                        }
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={onClose}
                                className="text-gray-500 cursor-pointer hover:text-black text-xl"
                            >
                                <X size={25} />
                            </button>
                        </div>

                        {/* Content - Scrollable */}
                        <div className="overflow-y-auto px-6 py-4 flex-1">
                            {renderContent()}
                        </div>

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

export default PostmanViewerModal;