import React from 'react';
import { motion } from "framer-motion";
import {
    FaFileAlt,
    FaClipboardList,
    FaProjectDiagram,
    FaTruckLoading,
    FaAngleRight,
    FaAngleLeft
} from 'react-icons/fa';
import KnowledgeBase from '../KnowledgeBase/KnowledgeBase';
import DemoRetrofit from '../RetrofitTransports/demo';

type DashboardItemName =
| "Regression Test Scoping"
| "Retrofit Transport Deployment";

interface State {
    ActionType: string;
    SidebarMenuItemTitle?: DashboardItemName;
}

type Props = {
    children?: React.ReactNode;
};

export default function ImpactAnalysis(_props: Props) {
    const [state, setState] = React.useReducer(
        (s: State, ns: Partial<State>): State => ({ ...s, ...ns }),
        {
            ActionType: "",
        } as State
);
    const [tileState, setTileState] = React.useState<DashboardItemName | null>(null);
    const [retrofitTileState, setRetrofitTileState] = React.useState<"Knowledge Base" | "Retrofit Testing" | null>(null);

    const DashboardItems = [
        { name: "Regression Test Scoping", icon: <FaProjectDiagram className="w-8 h-8 text-[#0071E9]" /> },
        { name: "Retrofit Transport Deployment", icon: <FaTruckLoading className="w-8 h-8 text-[#0071E9]" /> },
    ] as const satisfies ReadonlyArray<{ name: DashboardItemName; icon: React.ReactNode }>;
    const retrofitDashboardItems = [
        { name: "Knowledge Base", icon: <FaFileAlt className="w-8 h-8 text-[#0071E9]" /> },
        { name: "Retrofit Testing", icon: <FaClipboardList className="w-8 h-8 text-[#0071E9]" /> },
    ] as const satisfies ReadonlyArray<{ name: "Knowledge Base" | "Retrofit Testing"; icon: React.ReactNode }>;

    const handleDashboardClick = (tile: DashboardItemName) => {
        if (tile === "Retrofit Transport Deployment") {
            setTileState("Retrofit Transport Deployment");
            setRetrofitTileState(null);
        } 
    };

    const handleRetrofitTileClick = (tile: "Knowledge Base" | "Retrofit Testing") => {
        setRetrofitTileState(tile);
    };

    const handleBackToMain = () => {
        setTileState(null);
        setRetrofitTileState(null);
    };

    const handleBackToRetrofitTiles = () => {
        setRetrofitTileState(null);
    };

    const showDashboardTiles = tileState === null;
    const showRetrofitTiles = tileState === "Retrofit Transport Deployment" && retrofitTileState === null;

    return (
        <div className=" w-full ">
            <div className="grid-cols-12 grid  overflow-y-auto  rounded-lg bg-white" style={{ height: "calc(100vh - 120px)" }}>
                <div className="col-span-12  p-3">
                    {showDashboardTiles && (
                        <div id='body'>
                        <div className="px-3 pb-4">
                        <p className="font-semibold text-xl">Impact Analysis</p>
                        </div>
                        <div className="flex items-center justify-center py-8 bg-gray-50 p-4">
                            <div className="grid grid-cols-3 gap-4">
                                {DashboardItems.map((tool) => (
                                        <motion.button
                                        key={tool.name}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="group relative bg-white aspect-square h-48 cursor-pointer rounded-2xl shadow-md flex flex-col items-center justify-center p-6 transition-colors hover:bg-gray-50"
                                        onClick={(): void => {
                                            handleDashboardClick(tool.name);
                                            setState({ SidebarMenuItemTitle: tool.name });
                                        }}>
                                            {tool.icon}
                                            <span className="mt-3 text-lg font-medium text-[#0071E9]">{tool.name}</span>
                                            <div className="absolute bottom-3 right-3 text-gray-400 text-lg transition-transform duration-300 ease-in-out group-hover:translate-x-1">
                                                <FaAngleRight />
                                            </div>
                                        </motion.button>
                                ))}
                            </div>
                        </div>
                    </div>
                    )}

                    {tileState === "Retrofit Transport Deployment" && (
                        <div className="space-y-6">
                            <button
                                type="button"
                                onClick={retrofitTileState === null ? handleBackToMain : handleBackToRetrofitTiles}
                                className="flex items-center text-[#0071E9] font-medium hover:underline"
                            >
                                <FaAngleLeft className="mr-2" />
                                {retrofitTileState === null ? "Back to Impact Analysis" : "Back to Retrofit Testing"}
                            </button>

                            {showRetrofitTiles && (
                                <div id='retrofit-body'>
                                    <div className="px-3 pb-4">
                                        <p className="font-semibold text-xl">Retrofit Testing</p>
                                    </div>
                                    <div className="flex items-center justify-center py-8 bg-gray-50 p-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            {retrofitDashboardItems.map((item) => (
                                                <motion.button
                                                    key={item.name}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    className="group relative bg-white aspect-square h-48 cursor-pointer rounded-2xl shadow-md flex flex-col items-center justify-center p-6 transition-colors hover:bg-gray-50"
                                                    onClick={() => handleRetrofitTileClick(item.name)}
                                                >
                                                    {item.icon}
                                                    <span className="mt-3 text-lg font-medium text-[#0071E9]">{item.name}</span>
                                                    <div className="absolute bottom-3 right-3 text-gray-400 text-lg transition-transform duration-300 ease-in-out group-hover:translate-x-1">
                                                        <FaAngleRight />
                                                    </div>
                                                </motion.button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {retrofitTileState === "Knowledge Base" && (
                                <KnowledgeBase />
                            )}

                            {retrofitTileState === "Retrofit Testing" && (
                                <DemoRetrofit/>
                            )}
                        </div>
                    )}


                </div>
            </div>
        </div>
    );
}
