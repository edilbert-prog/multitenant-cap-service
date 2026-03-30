import React, { useReducer } from 'react';
import { motion } from 'framer-motion';
import { FaAngleRight, FaBalanceScale, FaCheckCircle, FaExchangeAlt, FaFileAlt, FaPlay } from 'react-icons/fa';
import {Link, useNavigate} from "react-router-dom";

interface State {
    ActionType: string;
    SidebarMenuItemTitle: string;
}

interface DashboardItem {
    name: string;
    icon: React.ReactNode;
}

export default function TestAutomation() {
    const navigate = useNavigate();
    const [state, setState] = useReducer(
        (s: State, ns: Partial<State>): State => ({ ...s, ...ns }),
        {
            ActionType: '',
            SidebarMenuItemTitle: '',
        }
);

    const DashboardItems = [
        { name: 'Execution Components', icon: <FaPlay className="w-7 h-7 text-[#0071E9]" /> },
        { name: 'Validation Components', icon: <FaCheckCircle className="w-7 h-7 text-[#0071E9]" /> },
        { name: 'Comparators', icon: <FaBalanceScale className="w-7 h-7 text-[#0071E9]" /> },
        { name: 'Test Cases', icon: <FaFileAlt className="w-7 h-7 text-[#0071E9]" /> },
        { name: 'Data Conversion Components', icon: <FaExchangeAlt className="w-7 h-7 text-[#0071E9]" /> },
    ] satisfies ReadonlyArray<DashboardItem>;

    const handleCurrentTitle:(tile: any)=>void =(tile:string)=>{
        if (tile==="Validation Components"){
            navigate("/ValidationComponents");
        }
        // if (tile==="Execution Components"){
        //     navigate("/ExecutionComponent");
        // }
    }
    return (
        <div className="p-4 w-full ">
            <div className="grid-cols-12 grid cardContainer   rounded-lg bg-white">
                <div className="col-span-12 p-4 ">
                    <div className="px-3 pb-4">
                        <p className="font-semibold text-xl">Test Automation</p>
                    </div>
                    <div className="flex items-center justify-center py-8 bg-gray-50 p-4">
                        <div className="grid grid-cols-3 gap-4 py-16">
                            {DashboardItems.map((tool) => (
                                <div onClick={()=>handleCurrentTitle(tool.name)}>
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
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
