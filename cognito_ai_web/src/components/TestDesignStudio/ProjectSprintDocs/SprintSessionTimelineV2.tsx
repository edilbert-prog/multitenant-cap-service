import React from "react";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { CheckCircle, Trash2 } from "lucide-react";
import SpinningGear from "../../../utils/SpinningGear";
import { HostConfig } from "../../../../HostConfig";
import StepProgressbar from "../../../utils/StepProgressbar";
import { toLocalTime } from "../../../utils/helpers/DateTimeParser";

const sessionVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.2, duration: 0.6 },
    }),
};

const StatusIcon = () => <CheckCircle className="text-green-600 w-5 h-5 mt-1" />;

function getFileName(path: string | null | undefined): string {
    if (!path) return "No File";
    const parts = path.split("/");
    const fileName = parts[parts.length - 1];
    const cleaned = fileName.replace(/^(\d+-?)+/, "");
    return cleaned.trim();
}

function getFileURL(path: string | null | undefined): string {
    if (!path) return "No URL";
    const url = path.replace("/var", "");
    return url;
}

interface SessionDocument {
    DocumentId: string;
    SourceType: string;
    InputFileURL: string;
    SessionStatus: "Completed" | string;
    StatusInfo?: string;
    Progress?: number | string;
    ElapsedTime?: string;
    [key: string]: unknown;
}

interface Session {
    SessionId: string;
    CreatedDate: string | number | Date;
    Documents?: SessionDocument[];
    action?: React.ReactElement<{ onClick?: () => void }>;
    index?: number;
    [key: string]: unknown;
}

interface JIRAConfig {
    BaseURL: string;
    [key: string]: unknown;
}

type SessionCardProps = {
    session: Session;
    handleDeleteSession: (session: Session) => void;
    CurrJIRAConfig: JIRAConfig;
    onActionClick?: (payload: Session & SessionDocument) => void;
    Title?: string;
};

function SessionCard(props: SessionCardProps) {
    const { session, handleDeleteSession, CurrJIRAConfig, onActionClick } = props;

    const handleClick = (doc: SessionDocument) => {
        if (onActionClick && typeof onActionClick === "function") {
            onActionClick({ ...(session as Session), ...(doc as SessionDocument) });
        }
    };

    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
    return (
        <motion.div
            className="rounded-xl border border-gray-300 shadow-sm bg-white"
            variants={sessionVariants}
            initial="hidden"
            animate="visible"
            custom={session.index}
        >
            <div className="px-4 py-3">
                <div className="text-gray-700 text-sm flex justify-between items-center">
                    <div>
                        <span className="font-semibold mr-2">SessionId:</span>
                        <span className="text-gray-700">{session.SessionId}</span>
                    </div>
                    <div className="flex text-nowrap items-center">
            <span className="mr-2 text-[0.79rem] font-medium text-gray-700">
              {toLocalTime(session.CreatedDate, "DD/MM/YYYY - hh:mm A")}
            </span>
                        <div
                            className="text-red-700 ml-4 cursor-pointer"
                            onClick={() => handleDeleteSession(session)}
                        >
                            <Trash2 />
                        </div>
                    </div>
                </div>
            </div>

            <div className="border-t border-gray-200  ">
                <div className="grid grid-cols-12 items-center ">
                    <div className="col-span-12">
                        <div className="w-full rounded-lg   border-gray-200 pb-4  ">
                            <table className="w-full divide-y rounded-full divide-gray-200 text-sm text-left">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-2 w-[22%]  bg-gray-100 font-medium text-gray-600">
                                        {" "}
                                        Source Type
                                    </th>
                                    <th className="px-6 py-2 w-[22%]  bg-gray-100 font-medium text-gray-600">
                                        {" "}
                                        Source
                                    </th>
                                    <th className="px-6 py-2  w-[20%] bg-gray-100 font-medium text-gray-600">
                                        Current Status
                                    </th>
                                    <th className="px-6 py-2  w-[22%] bg-gray-100 font-medium  text-gray-600">
                                        Progress
                                    </th>
                                    <th className="px-6 py-2  w-[15%] bg-gray-100 font-medium text-gray-600">
                                        Time
                                    </th>
                                    <th className="px-6 py-2  w-[10%] bg-gray-100 font-medium text-gray-600">
                                        Action
                                    </th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                {session.Documents && session.Documents.length > 0 ? (
                                    session.Documents.map((doc: SessionDocument) => (
                                        <tr key={doc.DocumentId} className="rounded-bl-md">
                                            <td className="px-6 py-4 font-semibold text-gray-900 ">
                                                {doc.SourceType}
                                            </td>
                                            <td className="px-6 py-4  text-gray-900 font-medium">
                                                <a
                                                    href={
                                                        getFileName(doc.InputFileURL).includes("AIT-")
                                                            ? `${CurrJIRAConfig.BaseURL}/browse/AIT-1`
                                                            : `${HostConfig.LLMHost}${getFileURL(doc.InputFileURL)}`
                                                    }
                                                    target="_blank"
                                                    className="text-sky-600 cursor-pointer"
                                                >
                                                    {getFileName(doc.InputFileURL)}
                                                </a>
                                            </td>
                                            <td className="px-6 py-4  text-gray-900 font-medium">
                                                <div className={`w-fit `}>
                                                    {doc.SessionStatus === "Completed" ? (
                                                        <div className="px-4 py-1 bg-green-100 ">
                                                            <p className="text-green-700 text-[0.80rem]">
                                                                Completed
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div className=" ">
                                                            <div className="px-2.5 py-1 rounded-md bg-orange-100 flex items-center">
                                                                <SpinningGear className="text-orange-700" size={15} />{" "}
                                                                <p className="ml-2 text-orange-700 text-[0.75rem] ">
                                                                    {doc.StatusInfo}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4  text-gray-900 font-medium">
                                                <StepProgressbar height="h-2" step={doc.Progress} />
                                            </td>
                                            <td className="px-6 py-4  text-gray-900 font-medium">
                                                {doc.ElapsedTime}
                                            </td>
                                            <td className="px-6 py-4  text-gray-900 font-medium">
                                                <div className="">
                                                    {session.action &&
                                                        React.cloneElement(session.action, {
                                                            onClick: () => handleClick(doc),
                                                        })}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr className="rounded-bl-md">
                                        <td colSpan={9} className="px-6 py-4  text-gray-900 font-medium">
                                            <div className="text-sm text-gray-500">
                                                No documents available.
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

type Props = {
    sessions: any;
    CurrJIRAConfig: JIRAConfig;
    handleDeleteSession: (session: Session) => void;
    Title?: string;
    onActionClick?: (payload: Session & SessionDocument) => void;
    children?: React.ReactNode;
};

export default function SprintSessionTimelineV2(props: Props) {
    const { sessions, CurrJIRAConfig, handleDeleteSession, Title, onActionClick } = props;

    return (
        <div className="relative pl-8 space-y-10 mr-7">
            <div className="absolute top-6 bottom-0 w-0.5 bg-gray-300" />
            {sessions.map((session: Session, index: number) => (
                <div key={index} className="relative">
          <span className="absolute left-[-15px] top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#464646] text-white text-sm font-semibold shadow z-10">
            {index + 1}
          </span>
                    <div className="ml-12 mt-1">
                        <SessionCard
                            CurrJIRAConfig={CurrJIRAConfig}
                            handleDeleteSession={handleDeleteSession}
                            session={{ ...session, index }}
                            Title={Title}
                            onActionClick={onActionClick}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}
