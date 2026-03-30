import axios, { AxiosRequestConfig } from "axios";
import { HostConfig } from "../../../HostConfig";

export async function FileDownloader(
    apiUrl: string,
    body: unknown,
    fileName: string = "export.xlsx"
): Promise<void> {
    const baseUrl: string = `${HostConfig.BASE_URL}${apiUrl}`;
    try {
        const token = sessionStorage.getItem('access_token');
        const config: AxiosRequestConfig = {
            responseType: "blob",
            headers: {
                "Content-Type": "application/json",
                "authentication": token,
            },
        };

        const response = await axios.post<Blob>(baseUrl, body, config);

        let suggestedFileName: string = fileName;
        const headers = response.headers as unknown as Record<string, string | undefined>;
        const disposition = headers["content-disposition"];
        if (disposition && disposition.includes("filename=")) {
            suggestedFileName = disposition.split("filename=")[1]?.replace(/["']/g, "") ?? suggestedFileName;
        }

        const url: string = window.URL.createObjectURL(new Blob([response.data]));
        const a: HTMLAnchorElement = document.createElement("a");
        a.href = url;
        a.download = suggestedFileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    } catch (err) {
        console.error("Download error:", err);
        alert("Export failed. Please try again.");
    }
}
