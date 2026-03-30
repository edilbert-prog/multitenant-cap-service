import React, { useEffect, useReducer, useRef } from 'react';
import { Plus, Save, Trash2, Upload, ChevronDown, ChevronRight, X, SquarePen } from 'lucide-react';
import { apiRequest } from "../../../../utils/helpers/ApiHelper";
import SpinnerV2 from "../../../../utils/SpinnerV2";
import Toast from "../../../../utils/Toast";
import ConfirmPopup from "../../../../utils/ConfirmPopup";
import CustomTable from "../../../../utils/CustomTable";
import SearchBar from "../../../../utils/SearchBar";

interface DatasetItem {
  id: string;
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null';
  selected: boolean;
  isMandatory: boolean; // NEW: Is Mandatory field
  level: number;
  parentId: string | null;
  isExpanded?: boolean;
}

interface State {
  DatasetList: any[];
  DatasetItems: DatasetItem[];
  IsLoading: boolean;
  SavingLoader: boolean;
  showToast: boolean;
  toastMessage: string;
  jsonInput: string;
  jsonError: string;
  showJsonInput: boolean;
  editingDatasetId: string | null;
  SearchQuery: string;
  showAddOptions: boolean;
}

type TableRow = Record<string, React.ReactNode>;

const initialState: State = {
  DatasetList: [],
  DatasetItems: [],
  IsLoading: true,
  SavingLoader: false,
  showToast: false,
  toastMessage: '',
  jsonInput: '',
  jsonError: '',
  showJsonInput: false,
  editingDatasetId: null,
  SearchQuery: '',
  showAddOptions: false,
};

export default function DatasetDetailsMaster(props: any) {
  const { CurrAddEditDetails } = props;
  const [state, setState] = useReducer(
      (prev: State, next: Partial<State>) => ({ ...prev, ...next }),
      initialState
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const addButtonRef = useRef<HTMLDivElement>(null);
  const didFetchData = useRef(false);

  useEffect(() => {
    if (didFetchData.current) return;
    didFetchData.current = true;
    void getData();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (addButtonRef.current && !addButtonRef.current.contains(event.target as Node)) {
        setState({ showAddOptions: false });
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getData = async () => {
    setState({ IsLoading: true });
    try {
      const resp: any = await apiRequest('/GetObjectAPIDataSetMaster', {
        ApiId: CurrAddEditDetails.ApiId,
        ObjectId: CurrAddEditDetails.ObjectId,
      });

      console.log('GetObjectAPIDataSetMaster Response:', resp);

      if (resp?.ResponseData && resp.ResponseData.length > 0) {
        console.log('Setting DatasetList with', resp.ResponseData.length, 'items');
        setState({
          DatasetList: resp.ResponseData,
          IsLoading: false
        });
      } else {
        console.log('No data found, setting empty array');
        setState({
          DatasetList: [],
          IsLoading: false
        });
      }
    } catch (error) {
      console.error('Error fetching datasets:', error);
      setState({
        DatasetList: [],
        IsLoading: false
      });
    }
  };

  const handleSearch = (query: string) => setState({ SearchQuery: query });

  const generateId = () =>
      `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // --- helpers for tree operations (used by Insert Record as well) ---
  const getById = (id: string) => state.DatasetItems.find((i) => i.id === id);
  const getChildren = (parentId: string) => state.DatasetItems.filter((i) => i.parentId === parentId);

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

      // Check if key has mandatory suffix and extract clean key
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
        key: cleanKey, // Use clean key without suffix
        value: processedValue,
        type,
        selected: true,
        isMandatory: isMandatory, // Set based on parsed suffix
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

  // FILE UPLOAD
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        const items = parseJsonToItems(parsed);
        setState({
          DatasetItems: items,
          jsonInput: JSON.stringify(parsed, null, 2),
          jsonError: '',
          showJsonInput: false,
          showAddOptions: false,
        });
      } catch (error) {
        console.error('Error parsing JSON file:', error);
        setState({
          jsonError: 'Invalid JSON file',
          toastMessage: 'Invalid JSON file format',
          showToast: true,
          showAddOptions: false,
        });
      }
    };
    reader.onerror = () => {
      setState({
        jsonError: 'Error reading file',
        toastMessage: 'Error reading file',
        showToast: true,
        showAddOptions: false,
      });
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleJsonTextParse = () => {
    try {
      const parsed = JSON.parse(state.jsonInput);
      const items = parseJsonToItems(parsed);
      setState({ DatasetItems: items, jsonError: '', showJsonInput: false });
    } catch {
      setState({ jsonError: 'Invalid JSON format' });
    }
  };

  // EDIT EXISTING
  const handleEditDataset = (dataset: any) => {
    try {
      // Backend returns Dataset column; it may be an object or a string
      const raw = dataset.Dataset ?? dataset.DatasetData ?? '';
      let parsed: any;
      if (typeof raw === 'string') {
        parsed = JSON.parse(raw);
      } else {
        parsed = raw;
      }

      const items = parseJsonToItems(parsed);
      setState({
        DatasetItems: items,
        editingDatasetId: dataset.DatasetId,
        jsonInput: JSON.stringify(parsed, null, 2),
      });
    } catch (error) {
      console.error('Error parsing dataset:', error);
      setState({ toastMessage: 'Error loading dataset', showToast: true });
    }
  };

  const handleCancelEdit = () => {
    setState({
      DatasetItems: [],
      editingDatasetId: null,
      jsonInput: '',
      showJsonInput: false,
    });
  };

  const addNewItem = (parentId: string | null) => {
    const newItem: DatasetItem = {
      id: generateId(),
      key: '',
      value: '',
      type: 'string',
      selected: true,
      isMandatory: false, // NEW: Default to NO
      level: parentId ? (state.DatasetItems.find((i) => i.id === parentId)?.level ?? 0) + 1 : 0,
      parentId,
      isExpanded: false,
    };
    setState({ DatasetItems: [...state.DatasetItems, newItem] });
  };

  const updateItem = (id: string, updates: Partial<DatasetItem>) => {
    // If updating 'selected', cascade to all children
    if ('selected' in updates) {
      const newSelectedState = updates.selected;

      // Get all child IDs recursively
      const getAllChildIds = (parentId: string): string[] => {
        const childIds: string[] = [];
        state.DatasetItems.forEach((i) => {
          if (i.parentId === parentId) {
            childIds.push(i.id);
            childIds.push(...getAllChildIds(i.id)); // Recursively get nested children
          }
        });
        return childIds;
      };

      const childIds = getAllChildIds(id);
      const idsToUpdate = [id, ...childIds];

      setState({
        DatasetItems: state.DatasetItems.map((item) =>
            idsToUpdate.includes(item.id)
                ? { ...item, selected: newSelectedState }
                : item
        ),
      });
    } else {
      // For non-selection updates, just update the single item
      setState({
        DatasetItems: state.DatasetItems.map((item) =>
            item.id === id ? { ...item, ...updates } : item
        ),
      });
    }
  };

  const toggleExpand = (id: string) => {
    setState({
      DatasetItems: state.DatasetItems.map((item) =>
          item.id === id ? { ...item, isExpanded: !item.isExpanded } : item
      ),
    });
  };

  const deleteItemAndChildren = (id: string) => {
    const toDelete = new Set<string>([id]);
    const findChildren = (parentId: string) => {
      state.DatasetItems.forEach((item) => {
        if (item.parentId === parentId) {
          toDelete.add(item.id);
          findChildren(item.id);
        }
      });
    };
    findChildren(id);
    setState({
      DatasetItems: state.DatasetItems.filter((item) => !toDelete.has(item.id)),
    });
  };

  // Build the JSON for saving with mandatory flags embedded in keys
  // Only includes items where selected = true
  const buildJsonFromItems = (): any => {
    const itemMap = new Map(state.DatasetItems.map((item) => [item.id, item]));
    const buildObject = (parentId: string | null): any => {
      // Only process selected children
      const children = state.DatasetItems.filter((item) => item.parentId === parentId && item.selected);
      if (children.length === 0) return null;

      const hasArrayChild = children.some((c) => c.key.startsWith('['));
      if (hasArrayChild) {
        const arr: any[] = [];
        children
            .sort((a, b) => {
              const aIdx = parseInt(a.key.replace(/\[|\]/g, ''), 10);
              const bIdx = parseInt(b.key.replace(/\[|\]/g, ''), 10);
              return aIdx - bIdx;
            })
            .forEach((child) => {
              if (child.type === 'object' || child.type === 'array') {
                const childObj = buildObject(child.id);
                // Only add if child has selected content
                if (childObj !== null && (Array.isArray(childObj) ? childObj.length > 0 : Object.keys(childObj).length > 0)) {
                  arr.push(childObj);
                }
              } else {
                let val: any = child.value;
                if (child.type === 'number') val = Number(val);
                else if (child.type === 'boolean') val = val === 'true';
                else if (child.type === 'null') val = null;
                arr.push(val);
              }
            });
        return arr;
      } else {
        const obj: any = {};
        children.forEach((child) => {
          // Add mandatory suffix to key if it's mandatory
          let keyName = child.key;
          if (child.isMandatory) {
            keyName = `${child.key}__MANDATORY__`;
          }

          if (child.type === 'object' || child.type === 'array') {
            const childObj = buildObject(child.id);
            // Only add if child has selected content
            if (childObj !== null && (Array.isArray(childObj) ? childObj.length > 0 : Object.keys(childObj).length > 0)) {
              obj[keyName] = childObj;
            }
          } else {
            let val: any = child.value;
            if (child.type === 'number') val = Number(val);
            else if (child.type === 'boolean') val = val === 'true';
            else if (child.type === 'null') val = null;
            obj[keyName] = val;
          }
        });
        return obj;
      }
    };

    return buildObject(null);
  };

  const handleSaveDataset = async () => {
    setState({ SavingLoader: true });
    try {
      const datasetJson = buildJsonFromItems();

      const payload: any = {
        ApiId: CurrAddEditDetails.ApiId,
        ObjectId: CurrAddEditDetails.ObjectId,
        Dataset: JSON.stringify(datasetJson),
        Status: 1,
      };

      // Use single endpoint for both add and update
      const endpoint = '/AddUpdateObjectAPIDataSetMaster';
      if (state.editingDatasetId) {
        payload.DatasetId = state.editingDatasetId;
      }

      const resp: any = await apiRequest(endpoint, payload);
      console.log('Save Response:', resp);

      // Check for success based on actual response format
      const isAddSuccess = resp?.addObjectAPIDataSetMaster?.affectedRows > 0;
      const isUpdateSuccess = resp?.updateObjectAPIDataSetMaster?.affectedRows > 0;

      if (isAddSuccess || isUpdateSuccess) {
        console.log('Save successful, clearing editor state...');

        // First clear the editor state
        setState({
          DatasetItems: [],
          editingDatasetId: null,
          jsonInput: '',
          showJsonInput: false,
        });

        console.log('Fetching updated data...');
        // Then refresh the data
        await getData();

        console.log('Showing success message...');
        // Finally show success message
        setState({
          toastMessage: state.editingDatasetId ? 'Dataset updated successfully' : 'Dataset added successfully',
          showToast: true,
        });
      } else {
        console.error('Save failed:', resp);
        setState({
          toastMessage: 'Failed to save dataset',
          showToast: true,
        });
      }
    } catch (error) {
      console.error('Error saving dataset:', error);
      setState({
        toastMessage: 'Error saving dataset',
        showToast: true,
      });
    } finally {
      setState({ SavingLoader: false });
    }
  };

  const handleDeleteDataset = async (datasetId: string) => {
    try {
      const resp: any = await apiRequest('/DeleteObjectAPIDataSetMaster', {
        DatasetId: datasetId,
      });
      console.log('Delete Response:', resp);

      // Check for success based on actual response format
      const isSuccess = resp?.deleteObjectAPIDataSetMaster?.affectedRows > 0;

      if (isSuccess) {
        setState({ toastMessage: 'Dataset deleted successfully', showToast: true });
        await getData();
      } else {
        setState({ toastMessage: 'Failed to delete dataset', showToast: true });
      }
    } catch (error) {
      console.error('Error deleting dataset:', error);
      setState({ toastMessage: 'Error deleting dataset', showToast: true });
    }
  };

  // NEW: Toggle mandatory status with cascading to children
  const toggleMandatory = (id: string) => {
    const item = state.DatasetItems.find((i) => i.id === id);
    if (!item) return;

    const newMandatoryState = !item.isMandatory;

    // Get all child IDs recursively
    const getAllChildIds = (parentId: string): string[] => {
      const childIds: string[] = [];
      state.DatasetItems.forEach((i) => {
        if (i.parentId === parentId) {
          childIds.push(i.id);
          childIds.push(...getAllChildIds(i.id)); // Recursively get nested children
        }
      });
      return childIds;
    };

    const childIds = getAllChildIds(id);
    const idsToUpdate = [id, ...childIds];

    setState({
      DatasetItems: state.DatasetItems.map((item) =>
          idsToUpdate.includes(item.id)
              ? { ...item, isMandatory: newMandatoryState }
              : item
      ),
    });
  };

  // ===========================
  // INSERT RECORD (ARRAY OF OBJECTS) — NEW
  // ===========================

  // returns the first child under an array that is an object (our "template")
  const findFirstObjectChild = (arrayId: string) =>
      getChildren(arrayId).find((i) => i.type === 'object');

  // find index in the flat list to insert a whole block after the last existing object under the array
  const findInsertIndexAfterLastObject = (arrayId: string) => {
    const items = state.DatasetItems;
    const getChildren = (pid: string) => items.filter((i) => i.parentId === pid);

    const objectChildren = getChildren(arrayId).filter((c) => c.type === 'object');
    if (objectChildren.length === 0) return items.length;

    const last = objectChildren[objectChildren.length - 1];

    const blockIds = new Set<string>();
    (function collect(id: string) {
      blockIds.add(id);
      getChildren(id).forEach((c) => collect(c.id));
    })(last.id);

    let maxIdx = -1;
    items.forEach((it, idx) => {
      if (blockIds.has(it.id)) maxIdx = Math.max(maxIdx, idx);
    });

    return maxIdx + 1;
  };

  // deep clone a node (and all its descendants) to a new parent
  const cloneSubtreeUnder = (
      sourceNodeId: string,
      newParentId: string,
      newLevel: number,
      opts?: { clearLeafValues?: boolean }
  ): DatasetItem[] => {
    const byId = new Map(state.DatasetItems.map((i) => [i.id, i] as const));

    const cloneNode = (nodeId: string, parentId: string, level: number): DatasetItem[] => {
      const orig = byId.get(nodeId);
      if (!orig) return [];

      const newId = generateId();
      const isContainer = orig.type === 'object' || orig.type === 'array';

      const copy: DatasetItem = {
        ...orig,
        id: newId,
        parentId,
        level,
        selected: true,
        isExpanded: true, // open the inserted block
      };

      if (opts?.clearLeafValues && !isContainer && orig.type !== 'null') {
        copy.value = '';
      }

      const children = state.DatasetItems.filter((i) => i.parentId === orig.id);
      const acc: DatasetItem[] = [copy];
      for (const child of children) {
        acc.push(...cloneNode(child.id, newId, level + 1));
      }
      return acc;
    };

    return cloneNode(sourceNodeId, newParentId, newLevel);
  };

  const insertRecord = (arrayId: string) => {
    const arrayNode = state.DatasetItems.find((i) => i.id === arrayId);
    if (!arrayNode || arrayNode.type !== 'array') return;

    const getChildren = (pid: string) => state.DatasetItems.filter((i) => i.parentId === pid);
    const template = getChildren(arrayId).find((i) => i.type === 'object');
    if (!template) return;

    // clone the template object subtree under the same array
    const newItems = cloneSubtreeUnder(template.id, arrayId, template.level, {
      clearLeafValues: true,
    });

    // set the top new object's key to next index like "[2]"
    const currentObjectCount = getChildren(arrayId).filter((c) => c.type === 'object').length;
    if (newItems.length > 0) {
      const topCloned = newItems[0];
      if (topCloned && topCloned.parentId === arrayId) {
        topCloned.key = `[${currentObjectCount}]`;
      }
    }

    // compute insertion point against CURRENT state (no functional setState)
    const insertAt = findInsertIndexAfterLastObject(arrayId);
    const before = state.DatasetItems.slice(0, insertAt);
    const after = state.DatasetItems.slice(insertAt);

    setState({
      DatasetItems: [...before, ...newItems, ...after],
    });
  };
  const renderTreeItem = (item: DatasetItem): React.ReactNode => {
    const hasChildren = state.DatasetItems.some((i) => i.parentId === item.id);
    const canExpand = item.type === 'object' || item.type === 'array' || hasChildren;

    // determine if this item is an array of objects (to show Insert button)
    const isArrayOfObjects =
        item.type === 'array' &&
        getChildren(item.id).some((c) => c.type === 'object');

    return (
        <div key={item.id}>
          <div
              className="flex items-center px-4 py-2 hover:bg-gray-50 border-b border-gray-100"
              style={{ paddingLeft: `${item.level * 24 + 16}px` }}
          >
            {/* Expand/Collapse */}
            <div style={{ width: '35px' }}>
              {canExpand && (
                  <button
                      onClick={() => toggleExpand(item.id)}
                      className="w-5 h-5 flex items-center justify-center hover:bg-gray-200 rounded"
                  >
                    {item.isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                    ) : (
                        <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
              )}
            </div>

            {/* Select Checkbox */}
            <div style={{ width: '30px' }}>
              <input
                  type="checkbox"
                  checked={item.selected}
                  onChange={(e) => updateItem(item.id, { selected: e.target.checked })}
                  className="w-4 h-4 cursor-pointer"
              />
            </div>

            {/* Key Name */}
            <div style={{ width: '200px' }} className="ml-3">
              <input
                  type="text"
                  value={item.key}
                  onChange={(e) => updateItem(item.id, { key: e.target.value })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Key name"
              />
            </div>

            {/* Is Mandatory Toggle */}
            <div style={{ width: '100px' }} className="ml-3 flex items-center justify-center">
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input
                      type="checkbox"
                      checked={item.isMandatory}
                      onChange={() => toggleMandatory(item.id)}
                      className="sr-only"
                  />
                  <div
                      className={`block w-10 h-6 rounded-full transition ${
                          item.isMandatory ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                  ></div>
                  <div
                      className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                          item.isMandatory ? 'transform translate-x-4' : ''
                      }`}
                  ></div>
                </div>
              </label>
            </div>

            {/* Type Dropdown */}
            <div style={{ width: '90px' }} className="ml-3">
              <select
                  value={item.type}
                  onChange={(e) =>
                      updateItem(item.id, {
                        type: e.target.value as DatasetItem['type'],
                      })
                  }
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="string">String</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
                <option value="object">Object</option>
                <option value="array">Array</option>
                <option value="null">Null</option>
              </select>
            </div>

            {/* Value Input */}
            <div className="flex-1 ml-3">
              {item.type === 'boolean' ? (
                  <select
                      value={item.value}
                      onChange={(e) => updateItem(item.id, { value: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
              ) : item.type === 'object' || item.type === 'array' ? (
                  <span className="text-sm text-gray-500 italic">{item.value}</span>
              ) : item.type === 'null' ? (
                  <span className="text-sm text-gray-500 italic">null</span>
              ) : (
                  <input
                      type={item.type === 'number' ? 'number' : 'text'}
                      value={item.value}
                      onChange={(e) => updateItem(item.id, { value: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Value"
                  />
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ width: '140px' }} className="flex items-center justify-center space-x-1">
              {(item.type === 'object' || item.type === 'array') && (
                  <button
                      onClick={() => addNewItem(item.id)}
                      className="p-1 hover:bg-blue-100 rounded"
                      title="Add child"
                  >
                    <Plus className="w-4 h-4 text-blue-600" />
                  </button>
              )}

              {/* NEW: Insert Record for arrays of objects */}
              {isArrayOfObjects && (
                  <button
                      onClick={() => insertRecord(item.id)}
                      className="px-2 py-1 text-xs font-semibold border rounded hover:bg-sky-50 border-sky-600 text-sky-800"
                      title="Insert record (duplicate object)"
                  >
                    Clone
                  </button>
              )}

              <button
                  onClick={() => deleteItemAndChildren(item.id)}
                  className="p-1 hover:bg-red-100 rounded"
                  title="Delete"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </button>
            </div>
          </div>

          {item.isExpanded &&
              state.DatasetItems
                  .filter((c) => c.parentId === item.id)
                  .map((child) => renderTreeItem(child))}
        </div>
    );
  };

  const columns = [
    { title: 'Dataset ID', key: 'DatasetId', className: 'min-w-[160px]' },
    { title: 'API ID', key: 'ApiId', className: 'min-w-[140px]' },
    { title: 'Object ID', key: 'ObjectId', className: 'min-w-[180px]' },
    { title: 'Status', key: 'Status', className: 'min-w-[120px]' },
  ];

  // search like reference (string-coerced)
  const filteredDatasets = state.DatasetList.filter((ds) => {
    if (!state.SearchQuery) return true;
    const q = state.SearchQuery.toLowerCase();
    const s = (v: any) => String(v ?? '').toLowerCase();
    return s(ds.DatasetId).includes(q) || s(ds.ApiId).includes(q) || s(ds.ObjectId).includes(q);
  });

  const data: TableRow[] = filteredDatasets.map((dataset) => ({
    DatasetId: dataset.DatasetId,
    ApiId: dataset.ApiId,
    ObjectId: dataset.ObjectId,
    Status: dataset.Status === 1 ? 'Active' : 'Inactive',
    actions: (
        <div className="relative flex items-center justify-center">
          <button
              onClick={() => void handleEditDataset(dataset)}
              className="ml-2 px-2 py-1"
              title="Edit"
          >
            <SquarePen className="text-[#1A1A1A] cursor-pointer" />
          </button>
          <ConfirmPopup
              message="Are you sure you want to delete this dataset?"
              onConfirm={() => void handleDeleteDataset(dataset.DatasetId)}
          >
            <button className="ml-2 pr-2 flex items-center" title="Delete">
              <Trash2 className="text-[#1A1A1A] cursor-pointer" />
            </button>
          </ConfirmPopup>
        </div>
    ),
  }));
  // ---------- END TABLE ----------

  if (state.IsLoading) {
    return (
        <div className="flex justify-center items-center py-20">
          <SpinnerV2 text="Fetching data..." />
        </div>
    );
  }

  return (
      <div className="pb-20">
        <Toast
            message={state.toastMessage}
            show={state.showToast}
            onClose={() => setState({ showToast: false })}
        />

        {state.DatasetItems.length === 0 && !state.showJsonInput ? (
            <div className="pt-0 pb-6 px-6">
              <div className="flex justify-between items-center pb-4">
                <div className="w-1/3">
                  <SearchBar
                      currentValue={state.SearchQuery}
                      onSearch={handleSearch}
                      size="medium"
                  />
                </div>

                <div className="flex items-center space-x-2 gap-4" ref={addButtonRef}>
                  <div className="relative">
                    <button
                        onClick={() => setState({ showAddOptions: !state.showAddOptions })}
                        className="bg-[#0071E9] hover:bg-[#005ABA] text-[0.89rem] cursor-pointer text-white font-medium py-2 px-5 rounded-lg flex items-center space-x-2"
                    >
                      <Plus className="w-5 h-5" />
                      <span>Add</span>
                    </button>

                    {state.showAddOptions && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                          <div className="py-1">
                            <label
                                htmlFor="json-file-upload"
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                            >
                              <Upload className="w-4 h-4 inline mr-2" />
                              Upload JSON File
                            </label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".json"
                                onChange={handleFileUpload}
                                className="hidden"
                                id="json-file-upload"
                            />
                            <button
                                onClick={() => {
                                  setState({ showJsonInput: true, showAddOptions: false });
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <Plus className="w-4 h-4 inline mr-2" />
                              Paste JSON
                            </button>
                          </div>
                        </div>
                    )}
                  </div>
                </div>
              </div>

              <CustomTable columns={columns} data={data} responsive={true} />
            </div>
        ) : state.showJsonInput ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Paste JSON</h3>
              <textarea
                  value={state.jsonInput}
                  onChange={(e) => setState({ jsonInput: e.target.value })}
                  className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder='{"example": "json"}'
              />
              {state.jsonError && <p className="text-red-500 text-sm mt-2">{state.jsonError}</p>}
              <div className="flex justify-end space-x-3 mt-4">
                <button
                    onClick={() => setState({ showJsonInput: false, jsonInput: '', jsonError: '' })}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                    onClick={handleJsonTextParse}
                    className="px-4 py-2 bg-[#0071E9] text-white rounded-lg hover:bg-[#005ABA]"
                >
                  Parse JSON
                </button>
              </div>
            </div>
        ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                <h3 className="text-lg font-semibold text-[#2C3E50]">Dataset Editor</h3>
                <div className="flex items-center space-x-3">
                  <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg"
                  >
                    <X className="w-4 h-4 inline mr-1" />
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
                      onClick={() => void handleSaveDataset()}
                      disabled={state.SavingLoader}
                      className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {state.SavingLoader ? (
                        <SpinnerV2 text="Saving..." />
                    ) : (
                        <>
                          <Save className="w-4 h-4 inline mr-1" />
                          Save Dataset
                        </>
                    )}
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
                    <div className="flex items-center font-semibold text-sm text-gray-700">
                      <div style={{ width: '35px' }}></div>
                      <div style={{ width: '30px' }}></div>
                      <div style={{ width: '200px' }} className="ml-3">
                        Key Name
                      </div>
                      <div style={{ width: '100px' }} className="ml-3 text-center">
                        Is Mandatory
                      </div>
                      <div style={{ width: '90px' }} className="ml-3">
                        Type
                      </div>
                      <div className="flex-1 ml-3">Value</div>
                      <div style={{ width: '140px' }} className="text-center">
                        Actions
                      </div>
                    </div>
                  </div>

                  <div>
                    {state.DatasetItems.filter((i) => i.parentId === null).map((i) =>
                        renderTreeItem(i)
                    )}
                  </div>

                  {state.DatasetItems.length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        No items added yet. Click "Add Root Item" to start.
                      </div>
                  )}
                </div>
              </div>
            </div>
        )}
      </div>
  );
}
