import React, { useEffect, useRef, useState } from "react";

type TabNavigationProps = {
    tabs: string[];
    handleCurrentTab: (tab: any) => void;
    children?: React.ReactNode;
};

export default function TabNavigation({ tabs, handleCurrentTab }: TabNavigationProps) {
    const [activeTab, setActiveTab] = useState<string>(tabs[0]);
    const [underlineStyle, setUnderlineStyle] = useState<{ left: number; width: number }>({
        left: 0,
        width: 0,
    });
    const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

    useEffect(() => {
        const el = tabRefs.current[activeTab];
        if (el) {
            const rect = el.getBoundingClientRect();
            const containerRect = el.parentElement?.getBoundingClientRect();
            if (containerRect) {
                setUnderlineStyle({
                    left: rect.left - containerRect.left,
                    width: rect.width,
                });
            }
        }
    }, [activeTab]);

    return (
        <div className="relative border-b-2 border-gray-200">
            <nav className="flex space-x-5 px-4">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        ref={(el) => {
                            tabRefs.current[tab] = el;
                        }}
                        onClick={() => {
                            handleCurrentTab(tab);
                            setActiveTab(tab);
                        }}
                        className={`cursor-pointer relative pb-4 text-[0.86rem] font-medium ${
                            activeTab === tab
                                ? "text-[#0071E9] font-semibold"
                                : "text-gray-700 hover:text-[#0071E9]"
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </nav>
            <span
                className="absolute bottom-0 h-[3px] bg-[#0071E9] rounded transition-all duration-300"
                style={{
                    left: underlineStyle.left,
                    width: underlineStyle.width,
                }}
            />
        </div>
    );
}
