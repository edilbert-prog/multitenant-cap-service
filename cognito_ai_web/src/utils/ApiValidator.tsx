import React, { useState } from "react";
import { motion } from "framer-motion";
import {
    FiSend,
    FiPlus,
    FiTrash2,
    FiAlertTriangle,
    FiCheckCircle,
    FiClipboard,
} from "react-icons/fi";
import { apiRequest } from "@/utils/helpers/ApiHelper";

const ApiValidator: React.FC = () => {
    const [endpoint, setEndpoint] = useState<string>("");
    const [method, setMethod] = useState<string>("GET");
    const [payload, setPayload] = useState<string>("{\n  \n}");
    const [headers, setHeaders] = useState<{ key: string; value: string }[]>([
        { key: "", value: "" },
    ]);
    const [contentType, setContentType] = useState<string>("application/json");

    const [rfcName, setRfcName] = useState<string>("");

    const [response, setResponse] = useState<any>(null);
    const [resHeaders, setResHeaders] = useState<any>(null);
    const [status, setStatus] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<any>(null);

    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<"data" | "headers" | "raw">("data");

    const PRIMARY = "#0071E9";

    const handleSendRequest = async () => {
        try {
            setLoading(true);
            setError(null);
            setResponse(null);
            setStatus(null);
            setResHeaders(null);

            const headerObj: Record<string, string> = {};
            headers.forEach((h) => {
                if (h.key.trim()) headerObj[h.key] = h.value;
            });

            let body: any = {};

            if (method === "RFC") {
                if (!rfcName.trim()) {
                    setError("RFC Name is required.");
                    setLoading(false);
                    return;
                }

                let parsedPayload: any = {};
                try {
                    parsedPayload = JSON.parse(payload);
                } catch (err) {
                    setError("Invalid JSON payload.");
                    setLoading(false);
                    return;
                }

                body = { method, RFC_Name: rfcName, RFC_Payload: parsedPayload };
            } else {
                let parsedPayload: any = {};
                try {
                    parsedPayload = JSON.parse(payload);
                } catch (err) {
                    setError("Invalid JSON payload.");
                    setLoading(false);
                    return;
                }
                body = {
                    url: endpoint,
                    method,
                    payload: parsedPayload,
                    headers: headerObj,
                    contentType,
                };
            }

            const res = await apiRequest("/ApiValidator", body);
            // const res = await apiRequest("/TestStepsValidation", body);
            setStatus(res.status);
            setResponse(res?.ResponseData);
            setResHeaders(res?.ResponseHeaders || {});
        } catch (err: any) {
            setError(err.response ? err.response.data : err.message);
            setStatus(
                err.response
                    ? `${err.response.status} ${err.response.statusText}`
                    : "Error"
            );
        } finally {
            setLoading(false);
        }
    };

    // ---- Syntax Highlighter ----
    const syntaxHighlight = (json: string) => {
        if (!json) return "";
        return json.replace(
            /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+)/g,
            (match) => {
                let cls = "text-gray-300";
                if (/^"/.test(match)) {
                    if (/:$/.test(match)) {
                        cls = "text-blue-400";
                    } else {
                        cls = "text-green-600";
                    }
                } else if (/true|false/.test(match)) {
                    cls = "text-yellow-400";
                } else if (/null/.test(match)) {
                    cls = "text-red-400";
                } else {
                    cls = "text-purple-400";
                }
                return `<span class="${cls}">${match}</span>`;
            }
        );
    };

    const handleCopy = () => {
        let textToCopy = "";
        if (activeTab === "data" && response) {
            textToCopy = JSON.stringify(response, null, 2);
        } else if (activeTab === "headers" && resHeaders) {
            textToCopy = Object.entries(resHeaders)
                .map(([key, value]) => `-H "${key}: ${value}"`)
                .join(" \\\n");
        } else if (activeTab === "raw" && (response || resHeaders)) {
            textToCopy = JSON.stringify(
                { data: response, headers: resHeaders },
                null,
                2
            );
        }
        if (textToCopy) {
            navigator.clipboard.writeText(textToCopy);
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
        }
    };

    const updateHeader = (index: number, field: "key" | "value", value: string) => {
        const updated = [...headers];
        updated[index][field] = value;
        setHeaders(updated);
    };
    const addHeader = () => setHeaders([...headers, { key: "", value: "" }]);
    const removeHeader = (index: number) =>
        setHeaders(headers.filter((_, i) => i !== index));

    return (
        <div className="mx-auto mt-2 p-4 rounded-2xl space-y-2">
            <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                API Testing
            </h1>

            {/* Method + Endpoint */}
            <div className="flex space-x-2">
                <select
                    className="p-2 border rounded-lg bg-gray-50 focus:ring"
                    style={{ borderColor: PRIMARY }}
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                >
                    <option>GET</option>
                    <option>POST</option>
                    <option>PUT</option>
                    <option>PATCH</option>
                    <option>DELETE</option>
                    <option>RFC</option>
                </select>

                {method !== "RFC" && (
                    <input
                        type="text"
                        placeholder="Enter API endpoint..."
                        className="flex-1 p-2 border rounded-lg focus:ring"
                        style={{ borderColor: PRIMARY }}
                        value={endpoint}
                        onChange={(e) => setEndpoint(e.target.value)}
                    />
                )}
            </div>

            {/* RFC Section */}
            {method === "RFC" && (
                <div className="space-y-4">
                    <div>
                        <label className="block mb-2 font-semibold text-gray-700">
                            RFC Name *
                        </label>
                        <input
                            type="text"
                            placeholder="Enter RFC name"
                            className="w-full p-2 border rounded-lg focus:ring"
                            style={{ borderColor: PRIMARY }}
                            value={rfcName}
                            onChange={(e) => setRfcName(e.target.value)}
                        />
                    </div>
                </div>
            )}

            {/* Common Payload Section */}
            <div>
                <label className="block mb-2 font-semibold text-gray-700">
                    Payload
                </label>
                <textarea
                    rows={6}
                    className="w-full p-3 border rounded-lg font-mono bg-gray-50 focus:ring"
                    style={{ borderColor: PRIMARY }}
                    value={payload}
                    onChange={(e) => setPayload(e.target.value)}
                ></textarea>
            </div>

            {/* Headers & Content-Type (only for REST) */}
            {method !== "RFC" && (
                <>
                    <div>
                        <label className="block mb-2 font-semibold text-gray-700">
                            Content-Type
                        </label>
                        <select
                            className="p-1 border rounded-lg bg-gray-50 focus:ring"
                            style={{ borderColor: PRIMARY }}
                            value={contentType}
                            onChange={(e) => setContentType(e.target.value)}
                        >
                            <option value="application/json">application/json</option>
                            <option value="application/x-www-form-urlencoded">
                                application/x-www-form-urlencoded
                            </option>
                            <option value="multipart/form-data">multipart/form-data</option>
                            <option value="text/plain">text/plain</option>
                        </select>
                    </div>

                    <div>
                        <label className="block mb-2 font-semibold text-gray-700">
                            Headers
                        </label>
                        {headers.map((header, index) => (
                            <div key={index} className="flex space-x-2 mb-2">
                                <input
                                    type="text"
                                    placeholder="Key"
                                    className="p-1.5 border rounded-lg flex-1 text-sm"
                                    style={{ borderColor: PRIMARY }}
                                    value={header.key}
                                    onChange={(e) => updateHeader(index, "key", e.target.value)}
                                />
                                <input
                                    type="text"
                                    placeholder="Value"
                                    className="p-1.5 border rounded-lg flex-1 text-sm"
                                    style={{ borderColor: PRIMARY }}
                                    value={header.value}
                                    onChange={(e) => updateHeader(index, "value", e.target.value)}
                                />
                                <button
                                    className="px-3 py-2 rounded-lg text-white"
                                    style={{ backgroundColor: PRIMARY }}
                                    onClick={() => removeHeader(index)}
                                >
                                    <FiTrash2 />
                                </button>
                            </div>
                        ))}
                        <button
                            className="mt-2 px-4 py-1 flex items-center gap-2 text-white rounded-lg text-sm"
                            style={{ backgroundColor: PRIMARY }}
                            onClick={addHeader}
                        >
                            <FiPlus /> Add Header
                        </button>
                    </div>
                </>
            )}

            {/* Send Button */}
            <motion.button
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 text-white flex items-center gap-2 rounded-xl shadow"
                style={{ backgroundColor: PRIMARY }}
                onClick={handleSendRequest}
                disabled={loading}
            >
                {loading ? "Sending..." : "Send Request"} <FiSend />
            </motion.button>

            {/* Status */}
            {status && (
                <div
                    className="p-3 rounded flex items-center gap-2"
                    style={{ backgroundColor: "#F3F0FF", borderLeft: `4px solid ${PRIMARY}` }}
                >
                    <FiCheckCircle style={{ color: PRIMARY }} />{" "}
                    <span className="font-semibold">Status:</span> {status}
                </div>
            )}

            {/* Response */}
            {(response || resHeaders) && (
                <div className="mt-4">
                    <div className="flex space-x-2 border-b mb-2">
                        {["data", "headers", "raw"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`px-4 py-2 rounded-t-lg text-sm font-semibold ${
                                    activeTab === tab
                                        ? "bg-gray-200 text-gray-800"
                                        : "bg-gray-100 text-gray-500"
                                }`}
                            >
                                {tab.toUpperCase()}
                            </button>
                        ))}
                    </div>

                    <div className="relative">
                        <button
                            onClick={handleCopy}
                            className={`absolute top-2 right-2 cursor-pointer p-2 rounded-lg text-xs flex items-center gap-1 ${
                                copied ? "bg-green-600 text-white" : "bg-gray-700 text-white"
                            }`}
                        >
                            <FiClipboard /> {copied ? "Copied!" : "Copy"}
                        </button>

                        {activeTab === "data" && response && (
                            <pre
                                className="p-4 bg-gray-100 rounded-lg overflow-auto text-sm font-mono max-h-96"
                                dangerouslySetInnerHTML={{
                                    __html: syntaxHighlight(JSON.stringify(response, null, 2)),
                                }}
                            />
                        )}

                        {activeTab === "headers" && resHeaders && (
                            <div className="p-4 bg-gray-100 rounded-lg overflow-auto text-sm max-h-96">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                    <tr className="border-b">
                                        <th className="p-2 font-semibold">Key</th>
                                        <th className="p-2 font-semibold">Value</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {Object.entries(resHeaders).map(([key, value]) => (
                                        <tr key={key} className="border-b">
                                            <td className="p-2 font-mono text-blue-700">{key}</td>
                                            <td className="p-2 font-mono text-gray-700">
                                                {String(value)}
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === "raw" && (
                            <pre
                                className="p-4 bg-gray-100 rounded-lg overflow-auto text-sm font-mono max-h-96"
                                dangerouslySetInnerHTML={{
                                    __html: syntaxHighlight(
                                        JSON.stringify({ data: response, headers: resHeaders }, null, 2)
                                    ),
                                }}
                            />
                        )}
                    </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="p-4 bg-red-50 text-sm rounded-lg flex gap-2 items-start">
                    <FiAlertTriangle className="text-yellow-600 mt-1" size={18} />
                    <pre
                        className="overflow-x-auto"
                        dangerouslySetInnerHTML={{
                            __html: syntaxHighlight(JSON.stringify(error, null, 2)),
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export default ApiValidator;
