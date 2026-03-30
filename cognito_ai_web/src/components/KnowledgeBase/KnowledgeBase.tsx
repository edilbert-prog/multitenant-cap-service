import React from 'react';
import {
    IllustratedMessage,
    FileUploader,
    Button,
    BusyIndicator,
    Dialog
} from '@ui5/webcomponents-react';
import ButtonDesign from '@ui5/webcomponents/dist/types/ButtonDesign.js';
import { apiRequest } from '@/utils/helpers/ApiHelper';
import { uploadStyles } from '../RetrofitTransports/demo/styles';
import { toast } from 'sonner';
import axios from 'axios';
import { HostConfig } from '../../../HostConfig';


type UploadStatus = 'idle' | 'uploading' | 'in-progress' | 'error';

type KnowledgeBaseRecord = {
    requestId: string | null;
    jiraNumber: string | null;
    transportNumbers: string[];
    transportCount: number | null;
    status: string | null;
    lastUpdated: string | null;
    summary: string | null;
    knowledgeBaseLink: string | null;
    filePath: string | null;
    uploadedBy: string | null;
    createdAt: string | null;
    parentRequestId: string | null;
};

const KNOWLEDGE_BASE_LIST_ENDPOINT = '/GetRetroKBList';

const emptyRecord: KnowledgeBaseRecord = {
    requestId: null,
    jiraNumber: null,
    transportNumbers: [],
    transportCount: null,
    status: null,
    lastUpdated: null,
    summary: null,
    knowledgeBaseLink: null,
    filePath: null,
    uploadedBy: null,
    createdAt: null,
    parentRequestId: null,
};

export default function KnowledgeBase() {
    const uploaderRef = React.useRef<any>(null);

    const [file, setFile] = React.useState<File | null>(null);
    const [uploading, setUploading] = React.useState(false);
    const [status, setStatus] = React.useState<UploadStatus>('idle');
    const [error, setError] = React.useState<string | null>(null);
    const [records, setRecords] = React.useState<KnowledgeBaseRecord[]>([]);
    const [isDragging, setIsDragging] = React.useState(false);
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [tableLoading, setTableLoading] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState('');

    const dropAreaStyle = React.useMemo(
        () => (isDragging ? { ...uploadStyles.dropArea, ...uploadStyles.dropAreaActive } : uploadStyles.dropArea),
        [isDragging]
    );

    const compactDropAreaStyle = React.useMemo(
        () => ({
            ...dropAreaStyle,
            padding: '12px 10px',
            minHeight: 130,
            maxHeight: 220,
            overflow: 'hidden',
        }),
        [dropAreaStyle]
    );

    const extractSharepointLink = React.useCallback((response: any): string | null => {
        if (!response || typeof response !== 'object') {
            return null;
        }

        return (
            response.kb_link ??
            response.downloadLink ??
            response.sharepointLink ??
            response.sharePointLink ??
            response.sharepointLocation ??
            response.sharePointLocation ??
            response.sharepointUrl ??
            response.sharePointUrl ??
            response.knowledgeBaseLink ??
            response.link ??
            null
        );
    }, []);

    const parseTransportNumbers = React.useCallback((value: unknown): string[] => {
        if (Array.isArray(value)) {
            return value
                .map((item) => (typeof item === 'string' ? item : String(item)))
                .map((item) => item.trim())
                .filter((item) => item.length > 0);
        }
        if (typeof value === 'string') {
            return value
                .split(/[,;]+/)
                .map((item) => item.trim())
                .filter((item) => item.length > 0);
        }
        return [];
    }, []);

    const parseNumber = React.useCallback((value: unknown): number | null => {
        if (typeof value === 'number' && Number.isFinite(value)) return value;
        if (typeof value === 'string') {
            const parsed = Number(value);
            return Number.isFinite(parsed) ? parsed : null;
        }
        return null;
    }, []);

    const normaliseRecord = React.useCallback(
        (payload: any): KnowledgeBaseRecord => ({
            requestId: payload?.request_id ?? payload?.requestId ?? null,
            jiraNumber:
                payload?.jira_number ??
                payload?.jiraNumber ??
                payload?.jira ??
                payload?.JiraNumber ??
                payload?.Jira ??
                null,
            transportNumbers: parseTransportNumbers(
                payload?.transport_numbers ??
                payload?.transportNumbers ??
                payload?.transport_number ??
                payload?.transportNumber ??
                payload?.transports
            ),
            transportCount:
                parseNumber(
                    payload?.transport_count ??
                    payload?.transportCount ??
                    payload?.count
                ) ??
                parseNumber(
                    payload?.transport_numbers_count ??
                    payload?.transportNumbersCount
                ) ??
                null,
            status: payload?.status ?? null,
            lastUpdated: payload?.last_updated ?? payload?.lastUpdated ?? null,
            summary: payload?.summary ?? null,
            knowledgeBaseLink: extractSharepointLink(payload),
            filePath: payload?.file_path ?? payload?.filePath ?? null,
            uploadedBy: payload?.uploaded_by ?? payload?.uploadedBy ?? null,
            createdAt: payload?.created_at ?? payload?.createdAt ?? null,
            parentRequestId: payload?.parent_request_id ?? payload?.parentRequestId ?? null,
        }),
        [extractSharepointLink, parseNumber, parseTransportNumbers]
    );

    const normaliseResponse = React.useCallback(
        (response: any): KnowledgeBaseRecord[] => {
            const entries: KnowledgeBaseRecord[] = [];

            const addIfPresent = (item: any) => {
                if (!item) return;
                const record = normaliseRecord(item);
                if (
                    record.requestId ||
                    record.jiraNumber ||
                    record.transportNumbers.length > 0 ||
                    record.knowledgeBaseLink
                ) {
                    entries.push(record);
                }
            };

            if (Array.isArray(response)) {
                response.forEach(addIfPresent);
            } else if (Array.isArray(response?.ResponseData)) {
                response.ResponseData.forEach(addIfPresent);
            } else if (Array.isArray(response?.records)) {
                response.records.forEach(addIfPresent);
            } else if (Array.isArray(response?.data)) {
                response.data.forEach(addIfPresent);
            } else if (Array.isArray(response?.results)) {
                response.results.forEach(addIfPresent);
            } else {
                addIfPresent(response);
            }

            return entries.length ? entries : [emptyRecord];
        },
        [normaliseRecord]
    );

    const fetchKnowledgeBaseRecords = React.useCallback(async () => {
        setTableLoading(true);
        setError(null);
        try {
            const response = await apiRequest<any>(
                KNOWLEDGE_BASE_LIST_ENDPOINT
            );
            const processedRecords = normaliseResponse(response);
            setRecords(processedRecords);
        } catch (err: any) {
            const message = typeof err === 'string' ? err : err?.message || 'Failed to fetch knowledge base records.';
            setError(message);
        } finally {
            setTableLoading(false);
        }
    }, [normaliseResponse]);

    const resetFileSelection = React.useCallback(() => {
        setFile(null);
        if (uploaderRef.current) {
            uploaderRef.current.value = '';
        }
    }, []);

    const handleFileSelection = React.useCallback(
        (nextFile: File | undefined) => {
            if (!nextFile || uploading) return;
            setFile(nextFile);
            setError(null);
            setStatus('idle');
        },
        [uploading]
    );

    const handleDragOver = React.useCallback(
        (event: React.DragEvent<HTMLDivElement>) => {
            event.preventDefault();
            if (uploading) return;
            event.dataTransfer.dropEffect = 'copy';
            if (!isDragging) setIsDragging(true);
        },
        [isDragging, uploading]
    );
// 1) Add a helper at component scope
 // we’ll parse origin from this

const downloadWithAuth = async (href: string, fallbackName = 'download.bin') => {
  try {
    // 1) Build an absolute URL WITHOUT baseURL concatenation
    //    If href is absolute, keep it. If it’s a /path, glue to API ORIGIN only.
    const apiOrigin = HostConfig.Domain; // e.g. http://localhost:5200
    const absoluteUrl = /^https?:\/\//i.test(href) ? href : `${apiOrigin}${href}`;

    console.log("absoluteUrlabsoluteUrl",absoluteUrl);
    
    // 2) Attach Authorization header directly
    const token = sessionStorage.getItem('access_token');
    const res = await axios.get(absoluteUrl, {
      responseType: 'blob',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      withCredentials: true, // keep if your backend uses cookies as well
    });

    // 3) Extract filename from Content-Disposition (if present)
    const cd = res.headers?.['content-disposition'] ?? '';
    const match =
      /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(cd) ||
      /filename="?([^";]+)"?/i.exec(cd);
    const filename = match ? decodeURIComponent(match[1]) : fallbackName;

    // 4) Save
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (e: any) {
    toast.error(e?.message ?? 'Download failed');
  }
};


    const handleDragLeave = React.useCallback(
        (event: React.DragEvent<HTMLDivElement>) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node) && !uploading) {
                setIsDragging(false);
            }
        },
        [uploading]
    );

    const handleDrop = React.useCallback(
        (event: React.DragEvent<HTMLDivElement>) => {
            event.preventDefault();
            if (uploading) return;
            setIsDragging(false);
            const dropped = event.dataTransfer?.files?.[0];
            handleFileSelection(dropped);
        },
        [handleFileSelection, uploading]
    );

    const handleSubmit = async () => {
        if (!file) {
            setError('Please select an Excel file before submitting.');
            return;
        }

        toast.info('Knowledge base fetching is in progress. Click the refresh button to view the latest status.');

        const selectedFile = file;
        const formData = new FormData();
        formData.append('excel', selectedFile);
        formData.append('uploaded_by', 'john.doe');

        setUploading(true);
        setStatus('uploading');
        setError(null);
        setIsDragging(false);
        setDialogOpen(false);

        try {
            apiRequest<any>(
                '/UploadRetroExcel',
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );
        } catch (err: any) {
            const message = typeof err === 'string' ? err : err?.message || 'Failed to send file.';
            setError(message);
            setStatus('error');
        } finally {
            setUploading(false);
            resetFileSelection();
        }
    };

    const clearSelection = () => {
        resetFileSelection();
        setError(null);
    };

    React.useEffect(() => {
        void fetchKnowledgeBaseRecords();
    }, [fetchKnowledgeBaseRecords]);

    const statusLabel = React.useMemo(() => {
        switch (status) {
            case 'uploading':
                return 'Sending file to extractor…';
            case 'in-progress':
                return 'In progress';
            case 'error':
                return 'Upload failed';
            default:
                return 'Waiting for upload';
        }
    }, [status]);

    const statusPillClass = React.useMemo(() => {
        switch (status) {
            case 'error':
                return 'bg-red-100 text-red-700';
            case 'uploading':
                return 'bg-blue-100 text-blue-700';
            case 'in-progress':
                return 'bg-green-100 text-green-700';
            default:
                return 'bg-blue-50 text-blue-700';
        }
    }, [status]);

    const displayRecords = React.useMemo(
        () =>
            records.filter(
                (record) =>
                    record.requestId ||
                    record.jiraNumber ||
                    record.transportNumbers.length > 0 ||
                    record.knowledgeBaseLink ||
                    record.status ||
                    record.summary
            ),
        [records]
    );

    const filteredRecords = React.useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return displayRecords;

        return displayRecords.filter((record) => {
            const values: string[] = [];
            if (record.requestId) values.push(record.requestId);
            if (record.jiraNumber) values.push(record.jiraNumber);
            if (record.status) values.push(record.status);
            if (record.summary) values.push(record.summary);
            if (record.uploadedBy) values.push(record.uploadedBy);
            if (record.parentRequestId) values.push(record.parentRequestId);
            if (record.knowledgeBaseLink) values.push(record.knowledgeBaseLink);
            if (record.filePath) values.push(record.filePath);
            if (record.transportNumbers.length) values.push(record.transportNumbers.join(' '));

            const haystack = values.join(' ').toLowerCase();
            return haystack.includes(term);
        });
    }, [displayRecords, searchTerm]);

    const formatTimestamp = React.useCallback((value: string | null): string => {
        if (!value) return '—';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '—';
        return date.toLocaleString();
    }, []);

    return (
        <div className="px-3">
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 space-y-6">
                <header className="space-y-2">
                    <h2 className="text-2xl font-semibold text-gray-800">Knowledge Base</h2>
                </header>

                <section className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        {/* <div className="space-y-1">
                            <h3 className="text-lg font-semibold text-gray-800">Add Knowledge Base</h3>
                        </div> */}
                        <Button
                            design={ButtonDesign.Emphasized}
                            icon="paper-plane"
                            onClick={() => {
                                setError(null);
                                resetFileSelection();
                                setIsDragging(false);
                                setDialogOpen(true);
                            }}
                            disabled={uploading}
                            style={{marginLeft:'auto'}}
                        >
                            Add Knowledge Base
                        </Button>
                        
                    </div>
                </section>

                <section className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-lg font-semibold text-gray-800">Knowledge Base Records</h3>
                        <div className="flex flex-wrap items-center gap-3">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                placeholder="Search by request, JIRA, status…"
                                className="w-64 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <Button
                                design={ButtonDesign.Transparent}
                                icon="refresh"
                                onClick={fetchKnowledgeBaseRecords}
                            >
                                Refresh
                            </Button>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-gray-200">
                        <div className="relative">
                            {tableLoading ? (
                                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-sm">
                                    <BusyIndicator active size="L" />
                                </div>
                            ) : null}
                            <div className="max-h-[28rem] overflow-y-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                                                Jira Number
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                                                Request ID
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                                                Transport Count
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                                                Transport Numbers
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                                                Status
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                                                Last Updated
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                                                Summary
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                                                Knowledge Base Link
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white">
                                        {filteredRecords.length > 0 ? (
                                            filteredRecords.map((record, index) => {
                                                const transportCount = record.transportCount ?? (record.transportNumbers.length || null);
                                                const linkHref = record.knowledgeBaseLink || record.filePath;
                                                return (
                                                    <tr key={record.requestId ?? record.jiraNumber ?? index}>
                                                        <td className="px-6 py-4 text-sm text-gray-700">
                                                            {record.jiraNumber ?? '—'}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-700">
                                                            {record.requestId ?? '—'}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-700">
                                                            {transportCount ?? '—'}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-700">
                                                            {record.transportNumbers.length
                                                                ? record.transportNumbers.join(', ')
                                                                : '—'}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-700">
                                                            {record.status ?? '—'}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-700">
                                                            {formatTimestamp(record.lastUpdated)}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-700">
                                                            {record.summary ?? '—'}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-700">
                                                            {linkHref ? (
                                                                <a
                                                                    onClick={() => downloadWithAuth(linkHref!, record.jiraNumber ?? 'kb-download')}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-[#0071E9] cursor-pointer underline break-all"
                                                                >
                                                                    {record.knowledgeBaseLink ? 'Download' : linkHref}
                                                                </a>
                                                            ) : (
                                                                <span className="text-gray-400">Awaiting link…</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={8} className="px-6 py-6 text-center text-sm text-gray-500">
                                                    {searchTerm.trim()
                                                        ? 'No records match your search.'
                                                        : 'No knowledge base records available yet.'}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <Dialog
                open={dialogOpen}
                headerText="Upload Excel File"
                onClose={() => {
                    setDialogOpen(false);
                    setIsDragging(false);
                }}
                style={{ width: '60rem', height: '40rem' }}
            >
                <div style={{height:'100%'}}>
                    <p className="text-sm text-gray-600">
                        Select the Excel extract that lists transports for retrofit testing. Supported formats: .xlsx, .xls, .xlsm, .csv, .zip.
                    </p>
                    <div
                        id='drag_drop_KB'
                        onDragOver={handleDragOver}
                        onDragEnter={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        style={{ ...compactDropAreaStyle, height: '100%', display: 'flex', alignItems: 'center', maxHeight: '28rem', justifyContent: 'center' }}
                    >
                        <IllustratedMessage
                            name="UploadCollection"
                            design="Spot"
                            style={{ width: '100%', maxWidth: 320 }}
                            titleText={file ? 'File ready' : 'Drag a file here'}
                            subtitleText="Drop the file anywhere in this area or use Browse to pick manually."
                        >
                            <div style={{ ...uploadStyles.uploadActions, height: '100%', justifyContent: 'center', width: '100%', maxWidth: 280 }}>
                                <FileUploader
                                    ref={uploaderRef}
                                    multiple={false}
                                    disabled={uploading}
                                    accept=".xlsx,.xls,.xlsm,.csv,.zip"
                                    style={{ width: '280px' }}
                                    onChange={(event: any) => {
                                        const nextFile: File | undefined = event?.detail?.files?.[0] || event?.target?.files?.[0];
                                        handleFileSelection(nextFile);
                                    }}
                                >
                                    <Button
                                        design={ButtonDesign.Emphasized}
                                        icon="upload"
                                        disabled={uploading}
                                    >
                                        {uploading ? 'Uploading…' : 'Browse'}
                                    </Button>
                                </FileUploader>

                                {file ? (
                                    <span style={uploadStyles.fileName}>{file.name}</span>
                                ) : (
                                    <span style={uploadStyles.helperText}>No file selected</span>
                                )}

                                {file ? (
                                    <button
                                        type="button"
                                        onClick={clearSelection}
                                        className="text-xs text-gray-500 hover:text-gray-700 mt-2"
                                    >
                                        Clear selection
                                    </button>
                                ) : null}

                                {error && status === 'error' ? (
                                    <span style={{ color: '#b00', fontSize: 12 }}>{error}</span>
                                ) : null}
                            </div>
                        </IllustratedMessage>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            design={ButtonDesign.Transparent}
                            onClick={() => {
                                setDialogOpen(false);
                                setIsDragging(false);
                                resetFileSelection();
                            }}
                            disabled={uploading}
                        >
                            Cancel
                        </Button>
                        <Button
                            design={ButtonDesign.Emphasized}
                            icon="paper-plane"
                            onClick={handleSubmit}
                            disabled={!file || uploading}
                        >
                            {uploading ? 'Uploading…' : 'Upload & Generate'}
                        </Button>
                    </div>
                </div>
            </Dialog>
        </div>
    );
}
