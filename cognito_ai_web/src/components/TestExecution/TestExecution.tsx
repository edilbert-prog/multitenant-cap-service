import React, { useReducer } from 'react';
import { motion } from 'framer-motion';
import { FaAngleRight, FaChartBar, FaPlayCircle, FaPlusSquare } from 'react-icons/fa';

type Props = {
    children?: React.ReactNode;
};

interface State {
    ActionType: string;
    SidebarMenuItemTitle?: string;
}

export default function TestExecution(_props: Props) {
    const [state, setState] = useReducer(
        (s: State, ns: Partial<State>): State => ({ ...s, ...ns }),
        {
            ActionType: '',
        }
);

    const DashboardItems = [
        { name: 'Create Test-Set', icon: <FaPlusSquare className="w-7 h-7 text-[#0071E9]" /> },
        { name: 'Execute And Validate', icon: <FaPlayCircle className="w-7 h-7 text-[#0071E9]" /> },
        { name: 'Results', icon: <FaChartBar className="w-7 h-7 text-[#0071E9]" /> },
    ] as const satisfies ReadonlyArray<{ name: string; icon: React.ReactNode }>;

    return (
        <div className="p-4 w-full ">
            <div className="grid-cols-12 grid cardContainer rounded-lg bg-white">
                <div className="col-span-12 p-4 ">
                    <div className="px-3 pb-4">
                        <p className="font-semibold text-xl">Test Execution</p>
                    </div>
                    <div className="flex items-center justify-center py-8 bg-gray-50 p-4">
                        <div className="grid grid-cols-3 gap-4 py-16">
                            {DashboardItems.map((tool) => (
                                <motion.button
                                    key={tool.name}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="group relative bg-white aspect-square h-48 cursor-pointer rounded-2xl shadow-md flex flex-col items-center justify-center p-6 transition-colors hover:bg-gray-50"
                                    onClick={() => setState({ SidebarMenuItemTitle: tool.name })}
                                >
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
            </div>
        </div>
    );
}
