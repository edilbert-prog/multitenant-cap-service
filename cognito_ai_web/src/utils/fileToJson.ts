import * as XLSX from "xlsx";

export interface FileToJsonOptions {
    sheet?: string | number;   // Sheet name or index for Excel
    limit?: number;            // Limit number of rows
}

export type JsonRecord = Record<string, unknown>;

/**
 * Convert CSV or Excel file into JSON (array of objects)
 * @param file - File object (from input[type=file])
 * @param options - Parsing options
 * @returns Promise<JsonRecord[]>
 */
export const fileToJson = (
    file: File,
    options: FileToJsonOptions = {}
): Promise<JsonRecord[]> => {
    const { sheet = 0, limit } = options;

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event: ProgressEvent<FileReader>) => {
            const data = event.target?.result;
            if (!data) {
                reject(new Error("Failed to read file."));
                return;
            }

            try {
                // CSV => use `string` mode; Excel => use `array`
                const isCsv = file.name.toLowerCase().endsWith(".csv");
                const workbook = XLSX.read(data, {
                    type: isCsv ? "string" : "array",
                });

                // pick sheet (Excel has multiple, CSV always has one)
                const sheetName =
                    typeof sheet === "number"
                        ? workbook.SheetNames[sheet]
                        : sheet ?? workbook.SheetNames[0];

                const worksheet = workbook.Sheets[sheetName];
                if (!worksheet) {
                    reject(new Error(`Sheet not found: ${sheetName}`));
                    return;
                }

                // parse into JSON
                let rows: JsonRecord[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

                // apply row limit
                if (limit) {
                    rows = rows.slice(0, limit);
                }

                resolve(rows);
            } catch (err) {
                reject(err);
            }
        };

        if (file.name.toLowerCase().endsWith(".csv")) {
            reader.readAsText(file);         // CSV handled as plain text
        } else {
            reader.readAsArrayBuffer(file);  // Excel handled as binary buffer
        }
    });
};
