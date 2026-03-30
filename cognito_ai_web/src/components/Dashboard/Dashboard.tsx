import React, { useEffect, useReducer, useRef } from "react";
import BarChart from "./BarChartV2";
import GreenCurve from "../../assets/icons/GreenCurve.svg";
import SkyblueCurve from "../../assets/icons/SkyblueCurve.svg";
import OrangeCurve from "../../assets/icons/OrangeCurve.svg";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../utils/helpers/ApiHelper";
import SpinnerV2 from "../../utils/SpinnerV2.jsx";
import ErrorScreen from "../../utils/ErrorScreen.jsx";
import Dropdown from "../../utils/Dropdown.jsx";
import dayjs from "dayjs";
import { getSocket, openSocket } from "../../utils/socket";

type Props = {};

interface DashboardStats {
    totalProjects: number;
    totalTestCases: number;
    totalSources: number;
}

interface TestCaseItem {
    date: string;
    count: number;
}

interface MonthOption {
    value: string;
    label: string;
}

interface RecentProject {
    ProjectId: string | number;
    ProjectName: string;
    totalTestCases?: number;
    relevance?: number;
}

interface Filters {
    ClientId: string;
    ProjectId: string;
    SprintId: string;
}

interface State {
    Error: string;
    IsLoading: boolean;
    dashboardStats: DashboardStats;
    testCasesData: TestCaseItem[];
    selectedMonth: string;
    availableMonths: MonthOption[];
    documentScenariosData: number[];
    scenarioLabels: string[];
    recentProjects: RecentProject[];
    filters: Filters;
}

type Action = Partial<State>;

const initialState: State = {
    Error: "",
    IsLoading: true,
    dashboardStats: {
        totalProjects: 0,
        totalTestCases: 0,
        totalSources: 0,
    },
    testCasesData: [],
    selectedMonth: dayjs().startOf("month").format("YYYY-MM-DD"),
    availableMonths: [],
    documentScenariosData: [],
    scenarioLabels: [],
    recentProjects: [],
    filters: {
        ClientId: "",
        ProjectId: "",
        SprintId: "",
    },
};

const reducer: (state: State, newState: Action) => State = (state, newState) => ({
    ...state,
    ...newState,
});

export default function Dashboard(props: Props) {

    const [state, setState] = useReducer(reducer, initialState);

    const didFetchData = useRef<boolean>(false);
 useEffect(() => {
  const sock = openSocket();
  console.log("[Dashboard] openSocket() returned id =", sock.id);

  const handler = (data: any) => {
    console.log("[Dashboard] 🔥 handler fired test-message:", data);
  };

  sock.on("test-message", handler);
  console.log("[Dashboard] listener attached for test-message");

  return () => {
    sock.off("test-message", handler);
    console.log("[Dashboard] listener removed");
  };
}, []);

    useEffect(() => {
        if (didFetchData.current) return;
        didFetchData.current = true;

        const init = async () => {
            setState({ IsLoading: true });

            generateAvailableMonths();

            await Promise.all([fetchDashboardStats(), fetchDocumentScenarios(), fetchRecentProjects()]);

            const currentMonth = dayjs().startOf("month").format("YYYY-MM-DD");
            setState({ selectedMonth: currentMonth });

            setState({ IsLoading: false });
        };

        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!state.selectedMonth) return;
        fetchTestCasesByMonth(state.selectedMonth);
    }, [state.selectedMonth]);

    const generateAvailableMonths = (): void => {
        const months: MonthOption[] = [];
        const currentDate = dayjs();
        const currentYear = currentDate.year();
        const currentMonth = currentDate.month();

        for (let i = currentMonth; i >= 0; i--) {
            const date = dayjs().year(currentYear).month(i).startOf("month");
            months.push({
                value: date.format("YYYY-MM-DD"),
                label: date.format("MMMM YYYY"),
            });
        }

        setState({ availableMonths: months });
    };

    const fetchDashboardStats = async (): Promise<void> => {
        try {
            const resp: any = await apiRequest("/dashboard/GetDashboardStats", state.filters);
            if (resp.ResponseData) {
                setState({
                    dashboardStats: {
                        totalProjects: resp.ResponseData.totalProjects || 0,
                        totalTestCases: resp.ResponseData.totalTestCases || 0,
                        totalSources: resp.ResponseData.totalSources || 0,
                    },
                });
            }
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error("Error fetching dashboard stats:", err);
        }
    };

    const fetchDocumentScenarios = async (): Promise<void> => {
        try {
            const resp: any = await apiRequest("/dashboard/GetDocumentScenariosCount", state.filters);
            if (resp.ResponseData && resp.ResponseData.length > 0) {
                const scenarios: Array<{ documentName: string; count: number }> = resp.ResponseData;
                setState({
                    scenarioLabels: scenarios.map((s) => s.documentName),
                    documentScenariosData: scenarios.map((s) => s.count),
                });
            }
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error("Error fetching document scenarios:", err);
        }
    };

    const fetchRecentProjects = async (): Promise<void> => {
        try {
            const resp: any = await apiRequest("/dashboard/GetRecentProjects", {
                ClientId: state.filters.ClientId,
                PageNo: 1,
                PageSize: 4,
            });

            if (resp.ResponseData) {
                setState({ recentProjects: (resp.ResponseData as RecentProject[]) || [] });
            }
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error("Error fetching recent projects:", err);
        }
    };

    const handleMonthChange = (val: string | null | undefined): void => {
        if (!val || val === "") {
            const currentMonth = dayjs().startOf("month").format("YYYY-MM-DD");
            setState({ selectedMonth: currentMonth });
            fetchTestCasesByMonth(currentMonth);
        } else {
            setState({ selectedMonth: val });
            fetchTestCasesByMonth(val);
        }
    };

    const fetchTestCasesByMonth = async (startDate: string): Promise<void> => {
        try {
            if (!startDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
                // eslint-disable-next-line no-console
                console.error("Invalid date format:", startDate);
                return;
            }

            const start = dayjs(startDate).startOf("month").format("YYYY-MM-DD");
            const end = dayjs(startDate).endOf("month").format("YYYY-MM-DD");

            const resp: any = await apiRequest("/dashboard/GetTestCasesByDateRange", {
                ...state.filters,
                StartDate: start,
                EndDate: end,
            });

            if (resp.ResponseData) {
                setState({ testCasesData: resp.ResponseData as TestCaseItem[] });
            }
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error("Error fetching test cases:", err);
            setState({ testCasesData: [] });
        }
    };

    const getTestCaseChartData = (): { labels: string[]; data: number[]; maxValue: number } => {
        if (!state.testCasesData || state.testCasesData.length === 0) {
            return { labels: [], data: [], maxValue: 0 };
        }

        const daysInMonth = dayjs(state.selectedMonth).daysInMonth();

        const labels: string[] = Array.from({ length: daysInMonth }, (_, i) => `Day ${i + 1}`);
        const data: number[] = Array(daysInMonth).fill(0);

        state.testCasesData.forEach((item) => {
            const day = dayjs(item.date).date();
            if (day >= 1 && day <= daysInMonth) {
                data[day - 1] = item.count;
            }
        });

        const firstNonZeroIndex = data.findIndex((count) => count > 0);

        let trimmedLabels = labels;
        let trimmedData = data;

        if (firstNonZeroIndex !== -1) {
            trimmedLabels = labels.slice(firstNonZeroIndex);
            trimmedData = data.slice(firstNonZeroIndex);
        }

        const maxValue = Math.max(...trimmedData, 0);

        return { labels: trimmedLabels, data: trimmedData, maxValue };
    };

    const testCaseChartData = getTestCaseChartData();

    if (state.IsLoading)
        return (
            <div className="h-96 py-20">
                <SpinnerV2 label="Fetching data..." />
            </div>
        );
    if (state.Error) return <ErrorScreen message={state.Error} />;

    return (
        <div className="pt-0 pb-6 px-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <div className="bg-white p-6 rounded-lg shadow flex justify-between items-start">
                    <div>
                        <div className="text-base font-semibold text-gray-800">Total projects</div>
                        <div className="text-3xl font-bold py-2">{state.dashboardStats.totalProjects}</div>
                        <div className="text-xs font-medium text-green-600 mt-2">As of {dayjs().format("MMMM D")}</div>
                    </div>
                    <div className="w-24 h-16">
                        <img src={GreenCurve} alt="Total Projects" className="w-full h-full object-contain" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow flex justify-between items-start">
                    <div>
                        <div className="text-base font-semibold text-gray-800">Total Test Cases</div>
                        <div className="text-3xl font-bold py-2">{state.dashboardStats.totalTestCases}</div>
                        <div className="text-xs font-semibold text-green-600 mt-2">
                            {/*Dollars Saved: ${(state.dashboardStats.totalTestCases * 0.05).toFixed(2)}*/}
                        </div>
                    </div>
                    <div className="w-24 h-16">
                        <img src={OrangeCurve} alt="Total Test Cases" className="w-full h-full object-contain" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow flex justify-between items-start">
                    <div>
                        <div className="text-base font-semibold text-gray-800">Test Sources</div>
                        <div className="text-3xl font-bold py-2">{state.dashboardStats.totalSources}</div>
                        <div className="text-xs font-medium text-green-600 mt-2">As of {dayjs().format("MMMM D")}</div>
                    </div>
                    <div className="w-24 h-16">
                        <img src={SkyblueCurve} alt="Test Executions" className="w-full h-full object-contain" />
                    </div>
                </div>
            </div>

            <div className="mb-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-semibold">
                            {`Test Cases in ${state.selectedMonth ? dayjs(state.selectedMonth).format("MMMM YYYY") : ""}`}
                        </h2>
                        <div className="w-48">
                            <Dropdown
                                mode="single"
                                size="small"
                                options={state.availableMonths}
                                value={state.selectedMonth}
                                onChange={(val: string) => handleMonthChange(val)}
                            />
                        </div>
                    </div>
                    {testCaseChartData.labels.length > 0 ? (
                        <BarChart
                            labels={testCaseChartData.labels}
                            data={testCaseChartData.data}
                            label={`Test Cases in ${dayjs(state.selectedMonth).format("MMMM YYYY")}`}
                            backgroundColor="rgba(59, 130, 246, 0.5)"
                            borderColor="rgba(59, 130, 246, 1)"
                            maxValue={testCaseChartData.maxValue}
                        />
                    ) : (
                        <div className="h-64 flex items-center justify-center text-gray-500">
                            No test case data available for this month
                        </div>
                    )}
                </div>
            </div>

            <div className="mb-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="font-semibold mb-4">Document Scenarios</h2>
                    {state.scenarioLabels.length > 0 ? (
                        <BarChart
                            labels={state.scenarioLabels}
                            data={state.documentScenariosData}
                            label="Scenarios Count"
                            backgroundColor="rgba(16, 185, 129, 0.5)"
                            borderColor="rgba(16, 185, 129, 1)"
                        />
                    ) : (
                        <div className="h-64 flex items-center justify-center text-gray-500">No document scenario data available</div>
                    )}
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="font-semibold mb-4">Recent Projects</h2>
                {state.recentProjects.length > 0 ? (
                    <table className="w-full text-sm">
                        <thead className="text-gray-500">
                        <tr>
                            <th className="text-left">#</th>
                            <th className="text-left">Name</th>
                            <th className="text-left">Total Test Cases</th>
                        </tr>
                        </thead>
                        <tbody>
                        {state.recentProjects.map((proj, index) => (
                            <tr key={proj.ProjectId} className="border-t">
                                <td className="py-4">{String(index + 1).padStart(2, "0")}</td>
                                <td>{proj.ProjectName}</td>

                                <td className="text-lg text-gray-600 font-semibold px-4">{proj.totalTestCases || 0}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="text-center py-8 text-gray-500">No recent projects available</div>
                )}
            </div>
        </div>
    );
}
