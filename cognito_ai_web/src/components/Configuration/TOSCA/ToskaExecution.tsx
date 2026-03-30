import React, { useState, useEffect } from "react";
import { apiRequest } from "@/utils/helpers/ApiHelper";

interface ExecutionPayload {
    ProjectName: string;
    ExecutionEnvironment: string;
    Events: string[];
    ImportResult: boolean;
    Creator: string;
}

interface ExecutionResponse {
    executionId: string;
    dexResponse?: any;
}

interface ExecutionStatus {
    State?: string;
    Results?: any;
    Message?: string;
    Progress?: number;
    [key: string]: any;
}

// Helper to parse XML result into readable structure
const parseToscaXML = (xmlString: string) => {
    try {
        const parser = new DOMParser();
        const xml = parser.parseFromString(xmlString, "text/xml");

        const suite = xml.querySelector("testsuite");
        const suiteName = suite?.getAttribute("name") || "Unknown Suite";
        const totalTests = suite?.getAttribute("tests");
        const failures = suite?.getAttribute("failures");
        const duration = suite?.getAttribute("time");
        const timestamp = suite?.getAttribute("timestamp");

        const testCases = Array.from(xml.querySelectorAll("testcase")).map((t) => ({
            name: t.getAttribute("name") || "Unnamed Test",
            time: t.getAttribute("time") || "0",
            status: t.getAttribute("log")?.includes("Failed")
                ? "Failed"
                : "Passed",
            log: t.getAttribute("log") || "",
        }));

        return { suiteName, totalTests, failures, duration, timestamp, testCases };
    } catch (err) {
        console.error("Error parsing XML:", err);
        return null;
    }
};

const triggerExecution = async (payload: ExecutionPayload): Promise<ExecutionResponse> => {
    const res = await apiRequest("/tosca/execute", payload);
    return res;
};

const getExecutionStatus = async (executionId: string): Promise<ExecutionStatus> => {
    const reqObj = { ExecutionId: executionId };
    const res = await apiRequest(`/tosca/status`, reqObj);
    return res;
};

const ToscaExecutor: React.FC = () => {
    const [projectName, setProjectName] = useState("Shared Repository");
    const [executionEnv, setExecutionEnv] = useState("Dex");
    const [eventName, setEventName] = useState("Dex Demo");
    const [importResult, setImportResult] = useState(true);
    const [creator, setCreator] = useState("Execution From API");
    const [executionId, setExecutionId] = useState<string | null>(null);
    const [status, setStatus] = useState("Idle");
    const [resultXML, setResultXML] = useState<string | null>(null);
    const [parsedResults, setParsedResults] = useState<any | null>(null);
    const [polling, setPolling] = useState(false);
    const [progress, setProgress] = useState<number>(0);

    const handleExecute = async () => {
        if (!projectName || !eventName || !executionEnv) {
            alert("Please provide all required fields.");
            return;
        }

        setStatus("Triggering Tosca Execution...");
        setResultXML(null);
        setParsedResults(null);

        try {
            const payload: ExecutionPayload = {
                ProjectName: projectName,
                ExecutionEnvironment: executionEnv,
                Events: [eventName],
                ImportResult: importResult,
                Creator: creator,
            };

            const data = await triggerExecution(payload);
            setExecutionId(data.executionId);
            setStatus(`Execution started — ID: ${data.executionId}`);
            setPolling(true);
        } catch (error) {
            console.error(error);
            setStatus("Failed to trigger execution.");
        }
    };

    // Poll every 5s for status and fetch results once complete
    useEffect(() => {
        if (!polling || !executionId) return;

        const interval = setInterval(async () => {
            try {
                const statusData = await getExecutionStatus(executionId);
                console.log("Execution Status ===>", statusData);
                const state = statusData.status || "Unknown";
                setStatus(`Execution Status: ${state}`);

                if (["Completed", "Failed", "Error"].includes(state)) {
                    clearInterval(interval);
                    setPolling(false);

                    if (state === "Completed") {
                        try {
                            const resultData = await apiRequest("/tosca/results", {
                                ExecutionId: executionId,
                            });
                            console.log("Execution Results ===>", resultData);

                            // The Tosca results come as XML string
                            setResultXML(resultData);
                            const parsed = parseToscaXML(resultData);
                            setParsedResults(parsed);

                            setStatus("Execution Completed — Results fetched");
                        } catch (resErr) {
                            console.error("Error fetching results:", resErr);
                            setStatus("Execution Completed, but failed to fetch results.");
                        }
                    } else {
                        setStatus(`Execution ${state}`);
                    }
                }
            } catch (err) {
                console.error(err);
                clearInterval(interval);
                setPolling(false);
                setStatus("Error while fetching status.");
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [polling, executionId]);

    return (
        <div className="max-w-3xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-md border">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">
                Tosca Execution
            </h2>

            {/* Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-gray-600 mb-1">Project Name *</label>
                    <input
                        type="text"
                        className="w-full border rounded-lg p-2"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-gray-600 mb-1">Execution Environment *</label>
                    <select
                        className="w-full border rounded-lg p-2"
                        value={executionEnv}
                        onChange={(e) => setExecutionEnv(e.target.value)}
                    >
                        <option value="Dex">Dex</option>
                        <option value="Local">Local</option>
                        <option value="CI">CI</option>
                    </select>
                </div>

                <div>
                    <label className="block text-gray-600 mb-1">Event Name *</label>
                    <input
                        type="text"
                        className="w-full border rounded-lg p-2"
                        placeholder="Enter Tosca Event Name"
                        value={eventName}
                        onChange={(e) => setEventName(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-gray-600 mb-1">Creator</label>
                    <input
                        type="text"
                        className="w-full border rounded-lg p-2"
                        value={creator}
                        onChange={(e) => setCreator(e.target.value)}
                    />
                </div>
            </div>

            <div className="mt-3 flex items-center">
                <input
                    id="importResult"
                    type="checkbox"
                    className="mr-2"
                    checked={importResult}
                    onChange={(e) => setImportResult(e.target.checked)}
                />
                <label htmlFor="importResult" className="text-gray-600">
                    Import Result After Execution
                </label>
            </div>

            {/* Execute Button */}
            <button
                onClick={handleExecute}
                disabled={polling}
                className={`mt-4 ${
                    polling ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
                } text-white px-4 py-2 rounded-md`}
            >
                {polling ? "Running..." : "Run Execution"}
            </button>

            {/* Status */}
            <div className="mt-4">
                <p>
                    <strong>Status:</strong> {status}
                </p>
                {progress > 0 && progress < 100 && (
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                )}
            </div>

            {/* Render Parsed Results */}
            {parsedResults && (
                <div className="mt-6">
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                         Test Suite: {parsedResults.suiteName}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                        <strong>Tests:</strong> {parsedResults.totalTests} |{" "}
                        <strong>Failures:</strong> {parsedResults.failures} |{" "}
                        <strong>Duration:</strong> {parsedResults.duration}s |{" "}
                        <strong>Timestamp:</strong> {parsedResults.timestamp}
                    </p>

                    <table className="w-full border-collapse border text-sm">
                        <thead>
                        <tr className="bg-gray-100 text-left">
                            <th className="border p-2">Test Case</th>
                            <th className="border p-2">Status</th>
                            <th className="border p-2">Time (s)</th>
                        </tr>
                        </thead>
                        <tbody>
                        {parsedResults.testCases.map((t: any, i: number) => (
                            <tr key={i} className="hover:bg-gray-50">
                                <td className="border p-2">{t.name}</td>
                                <td
                                    className={`border p-2 font-semibold ${
                                        t.status === "Passed" ? "text-green-600" : "text-red-600"
                                    }`}
                                >
                                    {t.status}
                                </td>
                                <td className="border p-2">{parseFloat(t.time).toFixed(2)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Fallback raw XML*/}
            {resultXML && !parsedResults && (
                <pre className="bg-gray-100 p-3 mt-4 rounded-md text-xs overflow-x-auto">
          {resultXML}
        </pre>
            )}
        </div>
    );
};

export default ToscaExecutor;
