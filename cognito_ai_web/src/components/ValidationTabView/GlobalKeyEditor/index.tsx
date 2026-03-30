// import React, { useEffect, useMemo, useState } from 'react';
// import { Card, CardContent } from '../ui/card';
// import { Button } from '../ui/button';
// import { FieldValidationConfig } from '../types/validation';
// import { Search, PlusCircle, Loader2 } from 'lucide-react';
// import { Label } from '../ui/label';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
// import { Input } from '../ui/input';
// import { Checkbox } from '../ui/checkbox';
// import { ScrollArea } from '../ui/scroll-area';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
// import { cn } from '../lib/utils';
// import { Separator } from '../ui/separator';
// import { Trash2 } from 'lucide-react';
// import { toast } from 'sonner';
// import { AgGridReact } from 'ag-grid-react';
// import { createGlobalField, getFileData, getMasterDataFiles } from '../API/filesApi';

// interface GlobalKeyEditorProps {
//   config: Partial<FieldValidationConfig> & { fileId?: number };
//   setConfig: (config: Partial<FieldValidationConfig>) => void;
// }

// interface MasterFile {
//   id: number;
//   unique_id: string;
//   display_name: string;
// }

// interface FileData {
//   columns: string[];
//   data: any[];
// }

// type NewGlobalKey = {
//   id: string;
//   key: string;
//   value: string;
//   description: string;
// }

// export const GlobalKeyEditor: React.FC<GlobalKeyEditorProps> = ({ config, setConfig }) => {
//   const [sapValidationMaster, setSapValidationMaster] = useState(false);
//   const [masterFiles, setMasterFiles] = useState<MasterFile[]>([]);
//   const [selectedFile, setSelectedFile] = useState<MasterFile | null>(null);
  
//   const [fileData, setFileData] = useState<FileData | null>(null);
//   const [searchTerm, setSearchTerm] = useState('');
  
//   const [isLoadingFiles, setIsLoadingFiles] = useState(true);
//   const [isLoadingData, setIsLoadingData] = useState(false);
  
//   const [newGlobalKeys, setNewGlobalKeys] = useState<NewGlobalKey[]>([]);
//   const [isSavingNewKeys, setIsSavingNewKeys] = useState(false);

//   useEffect(() => {
//     const fetchFiles = async () => {
//       setIsLoadingFiles(true);
//       setMasterFiles([]);
//       setSelectedFile(null);
//       setFileData(null);
//       try {
//         const response = await getMasterDataFiles(sapValidationMaster);
//         if (response.status && Array.isArray(response.data)) {
//           setMasterFiles(response.data);
//         } else {
//           toast.error(response.message || "Failed to fetch master data files.");
//         }
//       } catch (error) {
//         toast.error("An error occurred while fetching master data files.");
//       } finally {
//         setIsLoadingFiles(false);
//       }
//     };
//     fetchFiles();
//   }, [sapValidationMaster]);

//   useEffect(() => {
//     if (selectedFile) {
//       const fetchFileData = async () => {
//         setIsLoadingData(true);
//         setFileData(null);
//         try {
//           const response = await getFileData(selectedFile.unique_id);
//           if (response.status && response.data) {
//             setFileData(response); // The response itself has data and columns
//           } else {
//             toast.error(response.message || "Failed to fetch file data.");
//           }
//         } catch (error) {
//           toast.error("An error occurred while fetching file data.");
//         } finally {
//           setIsLoadingData(false);
//         }
//       };
//       fetchFileData();
//     } else {
//       setFileData(null);
//     }
//   }, [selectedFile]);

//   const handleFileChange = (fileId: string) => {
//     const file = masterFiles.find(f => f.id === Number(fileId));
//     setSelectedFile(file || null);
//     setSearchTerm('');
//   };

//   const columnDefs = useMemo(() => {
//     return fileData?.columns.map(col => ({ field: col, headerName: col, filter: true, sortable: true, resizable: true })) || [];
//   }, [fileData]);

//   const filteredRowData = useMemo(() => {
//     if (!fileData || !fileData.data) return [];
//     if (!searchTerm) return fileData.data;
//     const lowerCaseSearchTerm = searchTerm.toLowerCase();
//     return fileData.data.filter(row => 
//       Object.values(row).some(value => String(value).toLowerCase().includes(lowerCaseSearchTerm))
//     );
//   }, [fileData, searchTerm]);

//   const addNewGlobalKeyRow = () => {
//     setNewGlobalKeys(prev => [...prev, { id: crypto.randomUUID(), key: '', value: '', description: '' }]);
//   };

//   const removeNewGlobalKeyRow = (id: string) => {
//     setNewGlobalKeys(prev => prev.filter(k => k.id !== id));
//   };

//   const updateNewGlobalKey = (id: string, field: keyof NewGlobalKey, value: string) => {
//     setNewGlobalKeys(prev => prev.map(k => k.id === id ? { ...k, [field]: value } : k));
//   };

//   const handleSaveNewKeys = async () => {
//     if (!selectedFile) {
//       toast.error("Please select a master data file first.");
//       return;
//     }
//     if (newGlobalKeys.some(k => !k.key || !k.value)) {
//       toast.error("Please fill in all Key and Value fields for new entries.");
//       return;
//     }

//     setIsSavingNewKeys(true);
//     const promises = newGlobalKeys.map(key => {
//       const payload = {
//         master_id: selectedFile.unique_id,
//         master_type: sapValidationMaster ? 'SAP' : 'Custom',
//         key_name: key.key,
//         key_description: key.description,
//         key_value: key.value
//       };
//       return createGlobalField(payload);
//     });

//     try {
//       await Promise.all(promises);
//       toast.success(`${newGlobalKeys.length} new global key(s) saved successfully!`);
//       setNewGlobalKeys([]); // Clear the form
//     } catch (error) {
//       toast.error("Failed to save one or more new keys.");
//     } finally {
//       setIsSavingNewKeys(false);
//     }
//   };

//   return (
//     <Card className="p-0 border-none shadow-none">
//       <CardContent className="p-1 space-y-4">
//         <div>
//           <div className="flex flex-col md:flex-row items-center justify-between p-1 gap-4">
//             <div className="relative w-full md:w-auto md:flex-grow">
//               <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-muted-foreground" />
//               <Input 
//                 placeholder="Search existing keys..." 
//                 value={searchTerm} 
//                 onChange={(e) => setSearchTerm(e.target.value)} 
//                 className="pl-8 h-9" 
//                 disabled={!fileData}
//               />
//             </div>
//             <div className="flex items-center space-x-2 flex-shrink-0">
//               <Checkbox id="sap-validation-master" checked={sapValidationMaster} onCheckedChange={(checked) => setSapValidationMaster(Boolean(checked))} />
//               <Label htmlFor="sap-validation-master" className="text-sm font-medium whitespace-nowrap">SAP Validation Master</Label>
//               <Select onValueChange={handleFileChange} value={selectedFile ? String(selectedFile.id) : ''} disabled={isLoadingFiles}>
//                 <SelectTrigger className="w-full md:w-[220px] h-9 flex-shrink-0">
//                   <SelectValue placeholder={isLoadingFiles ? "Loading..." : "Select Master Data List"} />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {masterFiles.map(item => <SelectItem key={item.id} value={String(item.id)}>{item.display_name}</SelectItem>)}
//                 </SelectContent>
//               </Select>
//             </div>
//           </div>
//           <div className="p-1 mt-2">
//             <div className="ag-theme-quartz" style={{ height: '400px', width: '100%' }}>
//               {isLoadingData ? (
//                 <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
//               ) : fileData ? (
//                 <AgGridReact
//                   rowData={filteredRowData}
//                   columnDefs={columnDefs}
//                   defaultColDef={{ flex: 1, minWidth: 150 }}
//                   pagination={true}
//                   paginationPageSize={10}
//                   paginationPageSizeSelector={[10, 25, 50]}
//                 />
//               ) : (
//                 <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Select a master data list to view its content.</div>
//               )}
//             </div>
//           </div>
//         </div>
//         <Separator />
//         <div className="px-1">
//           <div className='flex items-center justify-between mb-2'>
//             <h3 className="text-base font-semibold">Add New Global Keys</h3>
//             <Button variant="outline" size="sm" onClick={addNewGlobalKeyRow}><PlusCircle className="mr-2 h-4 w-4" /> Add Key</Button>
//           </div>
//           <div className="border rounded-md">
//             <Table>
//               <TableHeader><TableRow><TableHead>Key</TableHead><TableHead>Value</TableHead><TableHead>Description</TableHead><TableHead className="w-[80px]">Actions</TableHead></TableRow></TableHeader>
//               <TableBody>
//                 {newGlobalKeys.length === 0 && (
//                   <TableRow><TableCell colSpan={4} className='text-center text-muted-foreground h-24'>Click "Add Key" to start.</TableCell></TableRow>
//                 )}
//                 {newGlobalKeys.map((row) => (
//                   <TableRow key={row.id}>
//                     <TableCell><Input value={row.key} onChange={(e) => updateNewGlobalKey(row.id, 'key', e.target.value)} placeholder="New Key"/></TableCell>
//                     <TableCell><Input value={row.value} onChange={(e) => updateNewGlobalKey(row.id, 'value', e.target.value)} placeholder="New Value"/></TableCell>
//                     <TableCell><Input value={row.description} onChange={(e) => updateNewGlobalKey(row.id, 'description', e.target.value)} placeholder="Description"/></TableCell>
//                     <TableCell>
//                       <Button variant="ghost" size="icon" onClick={() => removeNewGlobalKeyRow(row.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
//                     </TableCell>
//                   </TableRow>
//                 ))}
//               </TableBody>
//             </Table>
//           </div>
//         </div>
//         <div className="flex justify-end space-x-2 p-1 pt-4">
//           <Button size="sm" onClick={handleSaveNewKeys} disabled={newGlobalKeys.length === 0 || isSavingNewKeys}>
//             {isSavingNewKeys && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
//             Save New Keys
//           </Button>
//         </div>
//       </CardContent>
//     </Card>
//   );
// };
import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { FieldValidationConfig } from '../types/validation';
import { Search, PlusCircle, Loader2, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { cn } from '../lib/utils';
import { Separator } from '../ui/separator';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { createGlobalField, getFileData, getMasterDataFiles } from '../API/filesApi';

interface GlobalKeyEditorProps {
  config: Partial<FieldValidationConfig> & { fileId?: number };
  setConfig: (config: Partial<FieldValidationConfig>) => void;
}

interface MasterFile {
  id: number;
  unique_id: string;
  display_name: string;
}

interface FileData {
  columns: string[];
  data: any[];
}

type NewGlobalKey = {
  id: string;
  key: string;
  value: string;
  description: string;
}

export const GlobalKeyEditor: React.FC<GlobalKeyEditorProps> = ({ config, setConfig }) => {
  // State variables
  const [sapValidationMaster, setSapValidationMaster] = useState(false);
  const [masterFiles, setMasterFiles] = useState<MasterFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<MasterFile | null>(null);
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [newGlobalKeys, setNewGlobalKeys] = useState<NewGlobalKey[]>([]);
  const [isSavingNewKeys, setIsSavingNewKeys] = useState(false);

  // Table state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Fetch master files when SAP validation master changes
  useEffect(() => {
    const fetchFiles = async () => {
      setIsLoadingFiles(true);
      setMasterFiles([]);
      setSelectedFile(null);
      setFileData(null);
      setCurrentPage(1);
      
      try {
        const response = await getMasterDataFiles(sapValidationMaster);
        if (response.status && Array.isArray(response.data)) {
          setMasterFiles(response.data);
        } else {
          toast.error(response.message || "Failed to fetch master data files.");
        }
      } catch (error) {
        toast.error("An error occurred while fetching master data files.");
      } finally {
        setIsLoadingFiles(false);
      }
    };
    
    fetchFiles();
  }, [sapValidationMaster]);

  // Fetch file data when selected file changes
  useEffect(() => {
    if (selectedFile) {
      const fetchFileData = async () => {
        setIsLoadingData(true);
        setFileData(null);
        setCurrentPage(1);
        
        try {
          const response = await getFileData(selectedFile.unique_id);
          if (response.status && response.data) {
            setFileData(response);
          } else {
            toast.error(response.message || "Failed to fetch file data.");
          }
        } catch (error) {
          toast.error("An error occurred while fetching file data.");
        } finally {
          setIsLoadingData(false);
        }
      };
      
      fetchFileData();
    } else {
      setFileData(null);
    }
  }, [selectedFile]);

  // Handle file selection
  const handleFileChange = (fileId: string) => {
    const file = masterFiles.find(f => f.id === Number(fileId));
    setSelectedFile(file || null);
    setSearchTerm('');
    setCurrentPage(1);
    setSortColumn('');
  };

  // Handle search term change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Filter and sort data
  const processedData = useMemo(() => {
    if (!fileData?.data) return [];
    
    let filtered = fileData.data;
    
    // Apply search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(row =>
        Object.values(row).some(value =>
          String(value || '').toLowerCase().includes(lowerSearchTerm)
        )
      );
    }
    
    // Apply sorting
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = String(a[sortColumn] || '');
        const bValue = String(b[sortColumn] || '');
        
        const comparison = aValue.localeCompare(bValue, undefined, { numeric: true });
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }
    
    return filtered;
  }, [fileData, searchTerm, sortColumn, sortDirection]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return processedData.slice(startIndex, startIndex + pageSize);
  }, [processedData, currentPage, pageSize]);

  const totalPages = Math.ceil(processedData.length / pageSize);

  // Handle column sorting
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Handle page size change
  const handlePageSizeChange = (newPageSize: string) => {
    setPageSize(Number(newPageSize));
    setCurrentPage(1);
  };

  // New global key management
  const addNewGlobalKeyRow = () => {
    setNewGlobalKeys(prev => [
      ...prev,
      { id: crypto.randomUUID(), key: '', value: '', description: '' }
    ]);
  };

  const removeNewGlobalKeyRow = (id: string) => {
    setNewGlobalKeys(prev => prev.filter(k => k.id !== id));
  };

  const updateNewGlobalKey = (id: string, field: keyof NewGlobalKey, value: string) => {
    setNewGlobalKeys(prev =>
      prev.map(k => k.id === id ? { ...k, [field]: value } : k)
    );
  };

  const handleSaveNewKeys = async () => {
    if (!selectedFile) {
      toast.error("Please select a master data file first.");
      return;
    }
    
    if (newGlobalKeys.some(k => !k.key || !k.value)) {
      toast.error("Please fill in all Key and Value fields for new entries.");
      return;
    }

    setIsSavingNewKeys(true);
    
    try {
      const promises = newGlobalKeys.map(key => {
        const payload = {
          master_id: selectedFile.unique_id,
          master_type: sapValidationMaster ? 'SAP' : 'Custom',
          key_name: key.key,
          key_description: key.description,
          key_value: key.value
        };
        return createGlobalField(payload);
      });

      await Promise.all(promises);
      toast.success(`${newGlobalKeys.length} new global key(s) saved successfully!`);
      setNewGlobalKeys([]);
    } catch (error) {
      toast.error("Failed to save one or more new keys.");
    } finally {
      setIsSavingNewKeys(false);
    }
  };

  return (
    <Card className="p-0 border-none shadow-none">
      <CardContent className="p-1 space-y-4">
        {/* Header Section */}
        <div>
          <div className="flex flex-col md:flex-row items-center justify-between p-1 gap-4">
            {/* Search Input */}
            <div className="relative w-full md:w-auto md:flex-grow">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search existing keys..." 
                value={searchTerm} 
                onChange={handleSearchChange} 
                className="pl-8 h-9" 
                disabled={!fileData}
              />
            </div>
            
            {/* Controls */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              <Checkbox 
                id="sap-validation-master" 
                checked={sapValidationMaster} 
                onCheckedChange={(checked) => setSapValidationMaster(Boolean(checked))} 
              />
              <Label htmlFor="sap-validation-master" className="text-sm font-medium whitespace-nowrap">
                SAP Validation Master
              </Label>
              <Select 
                onValueChange={handleFileChange} 
                value={selectedFile ? String(selectedFile.id) : ''} 
                disabled={isLoadingFiles}
              >
                <SelectTrigger className="w-full md:w-[220px] h-9 flex-shrink-0">
                  <SelectValue placeholder={isLoadingFiles ? "Loading..." : "Select Master Data List"} />
                </SelectTrigger>
                <SelectContent>
                  {masterFiles.map(item => (
                    <SelectItem key={item.id} value={String(item.id)}>
                      {item.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Data Table */}
          <div className="p-1 mt-2">
            <div className="border border-gray-300 rounded-md" style={{ height: '400px' }}>
              {isLoadingData ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : fileData && fileData.columns.length > 0 ? (
                <div className="h-full flex flex-col">
                  {/* Table */}
                  <div className="flex-1 overflow-auto">
                    <Table>
                      <TableHeader className="sticky top-0 bg-background z-10 border-b border-gray-300">
                        <TableRow className='border-gray-300'>
                          {fileData.columns.map((column) => (
                            <TableHead 
                              key={column}
                              className="cursor-pointer border-gray-300 hover:bg-muted/50 select-none px-4 py-2 font-semibold"
                              onClick={() => handleSort(column)}
                            >
                              <div className="flex items-center justify-between">
                                <span>{column}</span>
                                <div className="ml-2">
                                  {sortColumn === column ? (
                                    sortDirection === 'asc' ? 
                                      <ChevronUp className="h-4 w-4" /> : 
                                      <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <div className="h-4 w-4" />
                                  )}
                                </div>
                              </div>
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody className='border-gray-300'>
                        {paginatedData.length === 0 ? (
                          <TableRow className='border-gray-300'>
                            <TableCell 
                              colSpan={fileData.columns.length} 
                              className="text-center py-8 border-gray-300 text-muted-foreground"
                            >
                              {processedData.length === 0 && searchTerm ? 
                                'No results match your search' : 
                                'No data available'
                              }
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedData.map((row, rowIndex) => (
                            <TableRow key={rowIndex} className="hover:bg-muted/50 border-gray-300">
                              {fileData.columns.map((column) => (
                                <TableCell key={column} className="px-4 py-2">
                                  {String(row[column] || '')}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Pagination */}
                  {processedData.length > 0 && (
                    <div className="border-t border-gray-300 bg-background p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Showing</span>
                        <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                          <SelectTrigger className="h-8 w-[80px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                          </SelectContent>
                        </Select>
                        <span>of {processedData.length} entries</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                        >
                          <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-medium px-3">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronsRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  Select a master data list to view its content.
                </div>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Add New Global Keys Section */}
        <div className="px-1">
          <div className='flex items-center justify-between mb-2'>
            <h3 className="text-base font-semibold">Add New Global Keys</h3>
            <Button variant="outline" size="sm" onClick={addNewGlobalKeyRow}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Key
            </Button>
          </div>
          
          <div className="border border-gray-300 rounded-md">
            <Table className='border-gray-300'>
              <TableHeader className='border-gray-300'>
                <TableRow className='border-gray-300'>
                  <TableHead className='border-gray-300'>Key</TableHead>
                  <TableHead className='border-gray-300'>Value</TableHead>
                  <TableHead className='border-gray-300'>Description</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className='border-gray-300'>
                {newGlobalKeys.length === 0 ? (
                  <TableRow className='border-gray-300'>
                    <TableCell colSpan={4} className='text-center text-muted-foreground h-24'>
                      Click "Add Key" to start.
                    </TableCell>
                  </TableRow>
                ) : (
                  newGlobalKeys.map((row) => (
                    <TableRow className='border-gray-300' key={row.id}>
                      <TableCell>
                        <Input 
                          value={row.key} 
                          onChange={(e) => updateNewGlobalKey(row.id, 'key', e.target.value)} 
                          placeholder="New Key"
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          value={row.value} 
                          onChange={(e) => updateNewGlobalKey(row.id, 'value', e.target.value)} 
                          placeholder="New Value"
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          value={row.description} 
                          onChange={(e) => updateNewGlobalKey(row.id, 'description', e.target.value)} 
                          placeholder="Description"
                        />
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeNewGlobalKeyRow(row.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end space-x-2 p-1 pt-4">
          <Button 
            size="sm" 
            onClick={handleSaveNewKeys} 
            disabled={newGlobalKeys.length === 0 || isSavingNewKeys}
          >
            {isSavingNewKeys && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save New Keys
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};