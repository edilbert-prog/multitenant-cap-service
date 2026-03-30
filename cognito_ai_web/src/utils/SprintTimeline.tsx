import React, {
    cloneElement,
    ReactElement,
    ReactNode,
    MouseEventHandler,
} from "react";
import { motion, Variants } from "framer-motion";
import { CheckCircle } from "lucide-react";

type ActionElementProps = {
    onClick?: MouseEventHandler<HTMLElement>;
};

interface Session {
    user: string;
    appName: string;
    time: string;
    SprintName: string;
    TotalSessions: number;
    StartDate: string;
    EndDate: string;
    action?: ReactElement<ActionElementProps>;
    index?: number;
}

interface SessionCardProps {
    session: Session;
    Title: string;
    onActionClick?: (session: Session) => void;
    children?: ReactNode;
}

interface SprintTimelineProps {
    sessions: any;
    Title: string;
    onActionClick?: (session: unknown) => void;
    children?: ReactNode;
}

const sessionVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.2, duration: 0.6 },
    }),
};

const StatusIcon = () => (
    <CheckCircle className="text-green-600 w-5 h-5 mt-1" />
);

function SessionCard({ session, Title, onActionClick }: SessionCardProps) {
    const handleClick = (): void => {
        if (onActionClick) {
            onActionClick(session);
        }
    };

    return (
        <motion.div
            className="rounded-xl border border-gray-300 shadow-sm bg-white"
            variants={sessionVariants}
            initial="hidden"
            animate="visible"
            custom={session.index}
        >
            <div className="px-4 py-3">
                <div className="text-gray-700 text-sm">
                    <span className="font-semibold">{session.user}</span> created
                    <span className="ml-1 font-semibold text-purple-700">
            {session.appName}
          </span>{" "}
                    · <span className="text-gray-500">{session.time}</span>
                </div>
            </div>

            <div className="border-t border-gray-200">
                <div className="grid grid-cols-12 items-center">
                    <div className="col-span-12">
                        <div className="w-full rounded-lg border-gray-200 pb-4">
                            <table className="w-full divide-y rounded-full divide-gray-200 text-sm text-left">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-2 bg-gray-100 font-medium text-gray-600">
                                        {Title}
                                    </th>
                                    <th className="px-6 py-2 bg-gray-100 font-medium text-gray-600">
                                        Total Documents
                                    </th>
                                    <th className="px-6 py-2 bg-gray-100 font-medium text-gray-600">
                                        Start Date
                                    </th>
                                    <th className="px-6 py-2 bg-gray-100 font-medium text-gray-600">
                                        End Date
                                    </th>
                                    <th className="px-6 py-2 bg-gray-100 font-medium text-gray-600">
                                        Action
                                    </th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                <tr className="rounded-bl-md">
                                    <td className="px-6 py-4 rounded-bl-md text-gray-900 font-medium">
                                        <div className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                            <StatusIcon />
                                            {session.SprintName}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-900 font-medium">
                                        {session.TotalSessions}
                                    </td>
                                    <td className="px-6 py-4 text-gray-900 font-medium">
                                        {session.StartDate}
                                    </td>
                                    <td className="px-6 py-4 text-gray-900 font-medium">
                                        {session.EndDate}
                                    </td>
                                    <td className="px-6 py-4 text-gray-900">
                                        <div>
                                            {session.action &&
                                                cloneElement<ActionElementProps>(session.action, {
                                                    onClick: handleClick,
                                                })}
                                        </div>
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export default function SprintTimeline({
                                           sessions,
                                           Title,
                                           onActionClick,
                                       }: SprintTimelineProps) {
    return (
        <div className="relative pl-12 space-y-10">
            <div className="absolute top-6 bottom-0 w-0.5 bg-gray-300" />
            {sessions.map((session: Session, index: number) => (
                <div key={index} className="relative">
          <span className="absolute left-[-15px] top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#464646] text-white text-sm font-semibold shadow z-10">
            {index + 1}
          </span>
                    <div className="ml-12 mt-1">
                        <SessionCard
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
