import React, { useReducer, useEffect } from 'react';
import { Plus, Save, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import SpinnerV2 from "../../../utils/SpinnerV2";
import CustomModal from "../../../utils/CustomModal";

interface DatasetItem {
    id: string;
    key: string;
    value: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null';
    selected: boolean;
    isMandatory: boolean;
    level: number;
    parentId: string | null;
    isExpanded?: boolean;
}

interface DatasetEditorState {
    datasetItems: DatasetItem[];
    savingLoader: boolean;
}

interface DatasetEditorPopupProps {
    isOpen: boolean;
    datasets: any[];
    currentStepData: any;
    onClose: () => void;
    onSave: (updatedDataset: any) => void;
}

const DatasetEditorPopup: React.FC<DatasetEditorPopupProps> = ({
    isOpen,
    datasets,
    currentStepData,
    onClose,
    onSave,
}) => {
    const generateId = () => `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const parseJsonToItems = (obj: any, parentId: string | null = null, level = 0): DatasetItem[] => {
        const items: DatasetItem[] = [];

        const processValue = (
            key: string,
            value: any,
            currentParentId: string | null,
            currentLevel: number
        ): DatasetItem[] => {
            const id = generateId();
            let type: DatasetItem['type'] = 'string';
            let processedValue = '';
            let childItems: DatasetItem[] = [];
            
            let cleanKey = key;
            let isMandatory = false;
            if (key.endsWith('__MANDATORY__')) {
                cleanKey = key.replace('__MANDATORY__', '');
                isMandatory = true;
            }

            if (value === null) {
                type = 'null';
                processedValue = 'null';
            } else if (Array.isArray(value)) {
                type = 'array';
                processedValue = `Array(${value.length})`;
                value.forEach((item, index) => {
                    childItems.push(...processValue(`[${index}]`, item, id, currentLevel + 1));
                });
            } else if (typeof value === 'object') {
                type = 'object';
                processedValue = 'Object';
                Object.entries(value).forEach(([k, v]) => {
                    childItems.push(...processValue(k, v, id, currentLevel + 1));
                });
            } else if (typeof value === 'boolean') {
                type = 'boolean';
                processedValue = String(value);
            } else if (typeof value === 'number') {
                type = 'number';
                processedValue = String(value);
            } else {
                type = 'string';
                processedValue = String(value);
            }

            const item: DatasetItem = {
                id,
                key: cleanKey,
                value: processedValue,
                type,
                selected: true,
                isMandatory: isMandatory,
                level: currentLevel,
                parentId: currentParentId,
                isExpanded: type === 'object' || type === 'array',
            };

            return [item, ...childItems];
        };

        if (Array.isArray(obj)) {
            obj.forEach((item, index) => {
                items.push(...processValue(`[${index}]`, item, parentId, level));
            });
        } else if (typeof obj === 'object' && obj !== null) {
            Object.entries(obj).forEach(([key, value]) => {
                items.push(...processValue(key, value, parentId, level));
            });
        }

        return items;
    };

    const [state, setState] = useReducer(
        (prev: DatasetEditorState, next: Partial<DatasetEditorState>) => ({ ...prev, ...next }),
        {
            datasetItems: [],
            savingLoader: false,
        }
    );

    // Initialize dataset items when popup opens or datasets change
    useEffect(() => {
        if (isOpen) {
            console.log('DatasetEditorPopup opened with datasets:', datasets);
            console.log('Current step data:', currentStepData);
            
            const initialDatasetToEdit = datasets && datasets.length > 0 ? datasets[0].Dataset : {};
            console.log('Parsing dataset:', initialDatasetToEdit);
            
            const initialItems = parseJsonToItems(initialDatasetToEdit);
            console.log('Parsed items:', initialItems);
            
            setState({ datasetItems: initialItems });
        }
    }, [isOpen, datasets]);

    const toggleExpand = (itemId: string) => {
        setState({
            datasetItems: state.datasetItems.map((item) =>
                item.id === itemId ? { ...item, isExpanded: !item.isExpanded } : item
            ),
        });
    };

    const updateItemValue = (itemId: string, field: 'key' | 'value' | 'type', newValue: string) => {
        setState({
            datasetItems: state.datasetItems.map((item) =>
                item.id === itemId ? { ...item, [field]: newValue } : item
            ),
        });
    };

    const addNewItem = (parentId: string | null) => {
        const parentItem = parentId ? state.datasetItems.find((i) => i.id === parentId) : null;
        const level = parentItem ? parentItem.level + 1 : 0;

        const newItem: DatasetItem = {
            id: generateId(),
            key: 'newKey',
            value: '',
            type: 'string',
            selected: true,
            isMandatory: false,
            level,
            parentId,
            isExpanded: false,
        };

        setState({
            datasetItems: [...state.datasetItems, newItem],
        });

        if (parentItem && !parentItem.isExpanded) {
            toggleExpand(parentItem.id);
        }
    };

    const deleteItem = (itemId: string) => {
        const deleteRecursive = (id: string): string[] => {
            const children = state.datasetItems.filter((i) => i.parentId === id);
            return [id, ...children.flatMap((c) => deleteRecursive(c.id))];
        };

        const idsToDelete = deleteRecursive(itemId);
        setState({
            datasetItems: state.datasetItems.filter((i) => !idsToDelete.includes(i.id)),
        });
    };

    const convertItemsToJson = (items: DatasetItem[]): any => {
        const buildTree = (parentId: string | null): any => {
            const children = items.filter((i) => i.parentId === parentId && i.selected);

            if (children.length === 0) return null;

            const isArray = children.some((c) => c.key.startsWith('['));

            if (isArray) {
                return children.map((child) => {
                    if (child.type === 'object' || child.type === 'array') {
                        return buildTree(child.id);
                    }
                    return parseValue(child.value, child.type);
                });
            } else {
                const obj: any = {};
                children.forEach((child) => {
                    if (child.type === 'object' || child.type === 'array') {
                        obj[child.key] = buildTree(child.id);
                    } else {
                        obj[child.key] = parseValue(child.value, child.type);
                    }
                });
                return obj;
            }
        };

        const parseValue = (value: string, type: DatasetItem['type']): any => {
            if (type === 'null') return null;
            if (type === 'boolean') return value === 'true';
            if (type === 'number') return Number(value);
            return value;
        };

        const rootItems = items.filter((i) => i.parentId === null && i.selected);
        if (rootItems.length === 0) return {};

        const result: any = {};
        rootItems.forEach((root) => {
            if (root.type === 'object' || root.type === 'array') {
                result[root.key] = buildTree(root.id);
            } else {
                result[root.key] = parseValue(root.value, root.type);
            }
        });

        return result;
    };

    const handleSaveDataset = () => {
        setState({ savingLoader: true });

        const jsonOutput = convertItemsToJson(state.datasetItems);
        console.log('Converted JSON:', jsonOutput);

        const datasetToSave = {
            Dataset: jsonOutput,
        };

        setTimeout(() => {
            onSave(datasetToSave);
            setState({ savingLoader: false });
        }, 500);
    };

    const renderTreeItem = (item: DatasetItem): JSX.Element => {
        const hasChildren = state.datasetItems.some((c) => c.parentId === item.id);
        const isKeyReadOnly = item.isMandatory;  // Key is read-only if mandatory
        const isTypeReadOnly = item.isMandatory; // Type is read-only if mandatory
        // Value is ALWAYS editable, even when mandatory

        return (
            <div key={item.id}>
                <div
                    className="flex items-center px-4 py-2 hover:bg-gray-50 border-b border-gray-100"
                    style={{ paddingLeft: `${item.level * 24 + 16}px` }}
                >
                    <div style={{ width: '35px' }} className="flex items-center">
                        {hasChildren && (
                            <button
                                onClick={() => toggleExpand(item.id)}
                                className="p-1 hover:bg-gray-200 rounded"
                            >
                                {item.isExpanded ? (
                                    <ChevronDown className="w-4 h-4" />
                                ) : (
                                    <ChevronRight className="w-4 h-4" />
                                )}
                            </button>
                        )}
                    </div>

                    <div style={{ width: '30px' }} className="flex items-center">
                        <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={(e) => {
                                if (!isKeyReadOnly) {
                                    setState({
                                        datasetItems: state.datasetItems.map((i) =>
                                            i.id === item.id ? { ...i, selected: e.target.checked } : i
                                        ),
                                    });
                                }
                            }}
                            disabled={isKeyReadOnly}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                    </div>

                    {/* KEY FIELD - Read-only when mandatory */}
                    <div style={{ width: '200px' }} className="ml-3">
                        <input
                            type="text"
                            value={item.key}
                            onChange={(e) => {
                                if (!isKeyReadOnly) {
                                    updateItemValue(item.id, 'key', e.target.value);
                                }
                            }}
                            disabled={isKeyReadOnly}
                            className={`w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                isKeyReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''
                            }`}
                            title={isKeyReadOnly ? "This key is mandatory and cannot be edited" : ""}
                        />
                    </div>

                    {/* TYPE FIELD - Read-only when mandatory */}
                    <div style={{ width: '90px' }} className="ml-3">
                        <select
                            value={item.type}
                            onChange={(e) => {
                                if (!isTypeReadOnly) {
                                    updateItemValue(item.id, 'type', e.target.value);
                                }
                            }}
                            disabled={isTypeReadOnly}
                            className={`w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                isTypeReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''
                            }`}
                        >
                            <option value="string">String</option>
                            <option value="number">Number</option>
                            <option value="boolean">Boolean</option>
                            <option value="object">Object</option>
                            <option value="array">Array</option>
                            <option value="null">Null</option>
                        </select>
                    </div>

                    {/* VALUE FIELD - ALWAYS editable, even when mandatory */}
                    <div className="flex-1 ml-3">
                        {item.type === 'boolean' ? (
                            <select
                                value={item.value}
                                onChange={(e) => {
                                    updateItemValue(item.id, 'value', e.target.value);
                                }}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="true">true</option>
                                <option value="false">false</option>
                            </select>
                        ) : item.type === 'object' || item.type === 'array' ? (
                            <span className="text-gray-500 text-sm italic">{item.value}</span>
                        ) : (
                            <input
                                type="text"
                                value={item.value}
                                onChange={(e) => {
                                    updateItemValue(item.id, 'value', e.target.value);
                                }}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder={item.isMandatory ? "Enter value (required)" : "Enter value"}
                            />
                        )}
                    </div>

                    <div style={{ width: '80px' }} className="flex items-center justify-center space-x-2">
                        {(item.type === 'object' || item.type === 'array') && (
                            <button
                                onClick={() => addNewItem(item.id)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                title="Add child item"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        )}
                        {!isKeyReadOnly && (
                            <button
                                onClick={() => deleteItem(item.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                title="Delete item"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {item.isExpanded && hasChildren && (
                    <div>
                        {state.datasetItems
                            .filter((c) => c.parentId === item.id)
                            .map((child) => renderTreeItem(child))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <CustomModal
            width="max-w-6xl"
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg">Dataset Editor</span>
                </div>
            }
            footerContent={
                <div className="flex items-center justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => addNewItem(null)}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <Plus className="w-4 h-4 inline mr-1" />
                        Add Root Item
                    </button>
                    <button
                        onClick={handleSaveDataset}
                        disabled={state.savingLoader}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        {state.savingLoader ? (
                            <SpinnerV2 text="Saving..." />
                        ) : (
                            <>
                                <Save className="w-4 h-4 inline mr-1" />
                                Save Dataset
                            </>
                        )}
                    </button>
                </div>
            }
        >
            <div className="max-h-[calc(90vh-200px)] overflow-auto">
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
                        <div className="flex items-center font-semibold text-sm text-gray-700">
                            <div style={{ width: '35px' }}></div>
                            <div style={{ width: '30px' }}></div>
                            <div style={{ width: '200px' }} className="ml-3">
                                Key Name
                            </div>
                            <div style={{ width: '90px' }} className="ml-3">
                                Type
                            </div>
                            <div className="flex-1 ml-3">Value</div>
                            <div style={{ width: '80px' }} className="text-center">
                                Actions
                            </div>
                        </div>
                    </div>

                    <div>
                        {state.datasetItems.filter((i) => i.parentId === null).map((i) =>
                            renderTreeItem(i)
                        )}
                    </div>

                    {state.datasetItems.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            No items added yet. Click "Add Root Item" to start.
                        </div>
                    )}
                </div>
            </div>
        </CustomModal>
    );
};

export default DatasetEditorPopup;
