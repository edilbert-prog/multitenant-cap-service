import React, { useMemo } from "react";
import { FileText } from "lucide-react";
import SpinningGear from "../../../utils/SpinningGear";
import { HostConfig } from "../../../../HostConfig";
import { Delete02Icon, File02Icon, SourceCodeSquareIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Signavio from "../../../assets/icons/Signavio.svg";
import JIRA from "../../../assets/icons/JIRA.svg";
import StepProgressbar from "../../../utils/StepProgressbar";
import ConfirmPopup from "../../../utils/ConfirmPopup";
import CustomTableData from "../../../utils/CustomTableData";

interface DocumentItem {
    DocumentId?: string;
    DocumentName?: string;
    InputFileURL?: string;
    SourceType?: string;
    ElapsedTime?: string;
    Progress?: number | string;
    SessionStatus?: string;
    StatusInfo?: string;
    [key: string]: unknown;
}

interface Session {
    SessionId?: string;
    Documents?: DocumentItem[];
    [key: string]: unknown;
}

interface JiraConfig {
    BaseURL?: string;
    [key: string]: unknown;
}

interface SprintSessionTimelineV3Props {
    sessions?: Session[];
    CurrJIRAConfig?: JiraConfig | null;
    handleDeleteSession?: (session: Session) => void;
    onActionClick?: (payload: Record<string, unknown>) => void;
    loading?: boolean;
    IsWorkspaceLoading?: any;
}

interface Column {
    key: string;
    header: string;
    sortable?: boolean;
    filterable?: boolean;
    colWidth?: string;
    TruncateData?: boolean;
    truncateAt?: number;
    align?: "left" | "center" | "right";
}

type TableRow = { id: string } & Record<string, React.ReactNode>;

function getFileURL(path?: string | null): string {
    if (!path) return "";
    return path.replace("/var", "");
}

type SourceIconProps = {
    type?: string | null;
};

function SourceIcon(props: SourceIconProps): JSX.Element {
    const { type } = props;
    switch ((type || "").toLowerCase()) {
        case "jira":
            return <img src={JIRA as unknown as string} className="w-5 h-5 " />;
        case "document":
            return <HugeiconsIcon icon={File02Icon} />;
        case "signavio":
            return <img src={Signavio as unknown as string} className="w-5 h-5 " />;
        case "abap_program":
            return <HugeiconsIcon icon={SourceCodeSquareIcon} />;
        default:
            return <FileText className="w-5 h-5 text-gray-600" />;
    }
}

type StatusPillProps = {
    status?: string;
    statusInfo?: string | null;
    Progress?: number | string;
};

function StatusPill(props: StatusPillProps): JSX.Element {
    const { status, statusInfo, Progress } = props;
    if (status === "Completed") {
        return (
            <span className="inline-flex items-center rounded-md bg-[#E6FEEA] px-3 py-1 text-[0.80rem] font-semibold text-[#022622]">
        Scenarios Generated
      </span>
        );
    }
    return (
        <div>
      <span className="inline-flex text-sm items-center rounded-md text-[#1F1C00] bg-[#FFF4BF] px-2.5 py-1.5 font-medium ">
        <SpinningGear className="mr-2  text-[#1F1C00]" />
          {statusInfo || "In progress"} ({Progress})
      </span>
            <div className="pt-2">
                <StepProgressbar height="h-2" step={Progress as unknown as number} />
            </div>
        </div>
    );
}

type ActionClickPayload = Record<string, unknown>;

type ConfirmPopupProps = {
    message: string;
    onConfirm: () => void;
    children: React.ReactNode;
};

export default function SprintSessionTimelineV3(props: SprintSessionTimelineV3Props) {
    const {
        sessions = [],
        CurrJIRAConfig,
        handleDeleteSession,
        onActionClick,
        loading = false,
    } = props;

    const flatRows: { session: Session; doc: DocumentItem }[] = useMemo(
        () =>
            sessions.flatMap((session) =>
                (session.Documents || []).map((doc) => ({ session, doc }))
            ),
        [sessions]
    );

    const data: TableRow[] = useMemo(() => {
        return flatRows.map(({ session, doc }) => {
            const fileName = doc.DocumentName;
            const url =
                fileName?.includes("AIT-")
                    ? `${CurrJIRAConfig?.BaseURL || ""}/browse/AIT-1`
                    : `${HostConfig.LLMHost}${getFileURL(doc.InputFileURL)}`;

            const id = `${session.SessionId || "—"}-${doc.DocumentId || fileName || "row"}`;

            return {
                id,
                RunId: <span className="font-medium text-gray-900">{session.SessionId || "—"}</span>,

                SourceType: (
                    <div className="flex items-center gap-3">
                        <SourceIcon type={doc.SourceType || ""} />
                        <span className="font-medium text-gray-900">{doc.SourceType || "—"}</span>
                    </div>
                ),

                Source:
                    fileName && url ? (
                        <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sky-700 font-medium hover:underline break-all"
                        >
                            {fileName}
                        </a>
                    ) : (
                        <span className="text-gray-500">No File</span>
                    ),

                Status: (
                    <StatusPill
                        Progress={doc.Progress}
                        status={doc.SessionStatus}
                        statusInfo={doc.StatusInfo ?? undefined}
                    />
                ),

                ExecutionTime: <span className="text-gray-900">{doc.ElapsedTime || "—"}</span>,

                actions: (
                    <div className="flex items-center gap-4 ">
                        <button
                            onClick={() => onActionClick?.({ ...(session as ActionClickPayload), ...(doc as ActionClickPayload) })}
                            className="text-nowrap cursor-pointer text-[#1A1A1A] font-medium hover:underline"
                        >
                            View Scenarios
                        </button>
                        <ConfirmPopup
                            message="Are you sure you want to delete this item?"
                            onConfirm={() => handleDeleteSession?.(session)}
                        >
                            <button className="text-[#1A1A1A]" title="Delete">
                                <HugeiconsIcon icon={Delete02Icon} />
                            </button>
                        </ConfirmPopup>
                    </div>
                ),
            };
        });
    }, [flatRows, CurrJIRAConfig]);

    const columns: Column[] = useMemo(
        () => [
            { key: "RunId", header: "Run ID", sortable: true, filterable: false, colWidth: "10%" },
            { key: "SourceType", header: "Source Type", sortable: true, filterable: false, colWidth: "10%" },
            {
                key: "Source",
                header: "Source",
                sortable: true,
                filterable: false,
                colWidth: "16%",
                TruncateData: true,
                truncateAt: 60,
            },
            { key: "Status", header: "Status", sortable: false, filterable: false, colWidth: "15%" },
            { key: "ExecutionTime", header: "Execution Time", sortable: true, filterable: false, colWidth: "12%" },
            { key: "actions", header: "Action", sortable: false, filterable: false, colWidth: "10%", align: "left" },
        ],
        []
    );

    return (
        <div className="bg-white">
            <CustomTableData
                showSpinnerFlag={props.IsWorkspaceLoading}
                HorizontalScroll={false}
                scrollHeightClass="h-[calc(100vh-340px)]"
                truncateCharLimit={40}
                data={data}
                columns={columns}
                rowKey="id"
                emptyState={<div className="p-8 text-center text-slate-500">No sources available.</div>}
            />
        </div>
    );
}
