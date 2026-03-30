import React, {
    forwardRef,
    useImperativeHandle,
    useRef,
    useState,
} from "react";
import { motion } from "framer-motion";
import axios, { type AxiosProgressEvent } from "axios";
import { CheckCircle, X, XCircle } from "lucide-react";

type UploadStatus = "success" | "error" | null;

type UploadItem = {
    file: File;
    progress: number;
    status: UploadStatus;
    uploadTime: number | null;
    startTime: number | null;
    id: string;
};

type ExtraPayload = Record<string, string | Blob>;
type FileUploadHandle = {
    upload: (meta?: ExtraPayload) => Promise<void>;
resetFile: () => void;
};

type FileUploadProps = {
    url: string;
    payload?: ExtraPayload;
    onFileSelect?: (names:string) => void;
    onSuccess?: (ok: boolean) => void;
    disabled?: boolean;
    accept?: string;
    multi?: boolean;
};

const FileUpload = forwardRef<FileUploadHandle, FileUploadProps>(
    (
        {
            url,
            payload = {},
            onFileSelect,
            onSuccess,
            disabled = false,
            accept = ".docx,.txt,.png",
            multi = false,
        },
        ref
    ) => {
        const [files, setFiles] = useState<UploadItem[]>([]);
        const fileInputRef = useRef<HTMLInputElement | null>(null);

        const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const fileList = e.target.files ? Array.from(e.target.files) : [];
            const newFiles: UploadItem[] = fileList.map((file) => ({
                file,
                progress: 0,
                status: null,
                uploadTime: null,
                startTime: null,
                id: `${file.name}-${file.lastModified}`,
            }));

            setFiles((prevFiles) => {
                const ids = new Set(prevFiles.map((f) => f.id));
                const combined = [...prevFiles];
                newFiles.forEach((f) => {
                    if (!ids.has(f.id)) combined.push(f);
                });
                return combined;
            });

            onFileSelect?.(newFiles.map((f) => f.file.name));

            if (e.target) {
                e.target.value = "";
            }
        };

        const handleRemoveFile = (id: string) => {
            setFiles((prev) => prev.filter((f) => f.id !== id));
        };

        const handleUpload = async (meta: ExtraPayload = {}) => {
            if (!files.length) return;

            const formData = new FormData();

            files.forEach((f) => {
                formData.append("file", f.file);
            });

            Object.entries(payload).forEach(([key, val]) => formData.append(key, val));
            Object.entries(meta).forEach(([key, val]) => formData.append(key, val));

            const updatedFiles = files.map((f) => ({
                ...f,
                startTime: Date.now(),
                status: null as UploadStatus,
            }));
            setFiles(updatedFiles);

            try {
                const token = sessionStorage.getItem('access_token');
                await axios.post(url, formData, {
                    headers: { "Content-Type": "multipart/form-data", "authentication": token, },
                    onUploadProgress: (e: AxiosProgressEvent) => {
                        const total = e.total ?? 1;
                        const percent = Math.round((e.loaded * 100) / total);
                        const start = updatedFiles[0]?.startTime ?? Date.now();
                        const elapsed = (Date.now() - start) / 1000;
                        const estimatedTotal = percent > 0 ? (elapsed / percent) * 100 : 0;
                        const remaining = Math.max(0, estimatedTotal - elapsed);

                        setFiles((prev) =>
                            prev.map((f) => ({
                                ...f,
                                progress: percent,
                                uploadTime: percent > 0 ? Math.ceil(remaining) : null,
                            }))
                        );
                    },
                });

                setFiles((prev) => prev.map((f) => ({ ...f, status: "success" })));
                onSuccess?.(true);
            } catch {
                setFiles((prev) => prev.map((f) => ({ ...f, status: "error" })));
            }
        };

        useImperativeHandle(ref, () => ({
            upload: handleUpload,
            resetFile: () => {
                setFiles([]);
                if (fileInputRef.current) fileInputRef.current.value = "";
                onFileSelect?.("");
            },
        }));

        return (
            <div className="max-w-xl mx-auto mt-4 p-2 rounded-md border-2 border-gray-300 dashed border-dashed">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">
                    Select one or more files
                </h2>

                <input
                    ref={fileInputRef}
                    type="file"
                    placeholder="Choose"
                    accept={accept}
                    multiple={multi}
                    onChange={handleFileChange}
                    className="mb-4 w-full  text-sm cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:cursor-pointer file:bg-[#0071E9] file:text-white hover:file:bg-[#0071E9]"
                    disabled={disabled}
                />

                <div className="border-t pt-4 border-t-gray-300">
                    {files.map((f) => (
                        <motion.div
                            key={f.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-4 p-4 rounded-xl bg-white shadow relative border border-gray-200"
                        >
                            <button
                                className="absolute top-3 cursor-pointer right-3 text-gray-400 hover:text-red-500"
                                onClick={() => handleRemoveFile(f.id)}
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <p className="text-gray-800 font-medium">{f.file.name}</p>
                            <p className="text-gray-500 text-sm">
                                {(f.file.size / (1024 * 1024)).toFixed(2)} MB
                            </p>

                            {f.progress > 0 || f.status ? (
                                <>
                                    <div className="w-full bg-gray-200 rounded-full h-3 my-2 overflow-hidden">
                                        <motion.div
                                            className={`h-3 ${
                                                f.status === "error"
                                                    ? "bg-red-500"
                                                    : f.status === "success"
                                                        ? "bg-green-700"
                                                        : "bg-blue-600"
                                            }`}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${f.progress}%` }}
                                            transition={{ ease: "easeOut", duration: 0.2 }}
                                        />
                                    </div>

                                    <div className="flex justify-between text-sm text-gray-700">
                                        <span>{f.progress}%</span>
                                        {f.uploadTime !== null &&
                                            !["success", "error"].includes(f.status ?? "") && (
                                                <span>~{f.uploadTime}s</span>
                                            )}
                                    </div>
                                </>
                            ) : (<div></div>
                                // <div className="text-blue-600 text-sm mt-2 font-medium">
                                //     Ready to upload
                                // </div>
                            )}

                            {f.progress > 0 && (
                                <div className="flex justify-between text-sm text-gray-700">
                                    <span>{f.progress}%</span>
                                    {f.uploadTime !== null &&
                                        !["success", "error"].includes(f.status ?? "") && (
                                            <span>~{f.uploadTime}s</span>
                                        )}
                                </div>
                            )}

                            {f.status === "success" && (
                                <div className="flex items-center gap-2 text-green-700 text-sm mt-2">
                                    <CheckCircle className="w-5 h-5" />
                                    Uploaded
                                </div>
                            )}
                            {f.status === "error" && (
                                <div className="flex items-center gap-2 text-red-600 text-sm mt-2">
                                    <XCircle className="w-5 h-5" />
                                    Failed
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>
        );
    }
);

export default FileUpload;
