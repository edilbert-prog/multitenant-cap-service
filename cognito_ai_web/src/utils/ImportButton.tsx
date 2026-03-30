import React, { useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { FolderImportIcon } from "@hugeicons/core-free-icons";

export interface ImportButtonProps {
    onSelect: (file: File) => void; // callback when file is selected
    label?: string;                 // button text
    className?: string;             // extra styles
    accept?: string;                // file types
}

const baseBtn =
    "inline-flex items-center gap-2 rounded-2xl border px-4 py-1.5  " +
    "border-sky-400 text-sky-600 hover:bg-sky-50 active:bg-sky-100 " +
    "transition-colors select-none font-medium";

export const ImportButton: React.FC<ImportButtonProps> = ({
                                                              onSelect,
                                                              label = "Import",
                                                              className = "",
                                                              accept = ".csv,.xls,.xlsx",
                                                          }) => {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [fileName, setFileName] = useState<string>("");

    const trigger = () => inputRef.current?.click();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFileName(file.name);
            onSelect(file);
        }
        e.target.value = "";
    };

    return (
        <div className="flex flex-col items-start gap-2 ">
            <button
                type="button"
                onClick={trigger}
                className={`${baseBtn} ${className} text-sm`}
            >
                <HugeiconsIcon size={19} icon={FolderImportIcon} />
                <span>{label}</span>
            </button>

            <input
                ref={inputRef}
                type="file"
                accept={accept}
                className="hidden"
                onChange={handleChange}
            />

            {fileName && (
                <span className="text-sm text-gray-600"> {fileName}</span>
            )}
        </div>
    );
};
