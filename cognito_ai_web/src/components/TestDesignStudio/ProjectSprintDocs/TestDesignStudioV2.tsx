import React, { useEffect, useReducer, useRef, useState } from 'react';
import SprintDetailsV2Default from "./SprintDetailsV2";
import { useLocation } from "react-router-dom";

type PillItem = {
    key: string;
    label: string;
};

type MenuItem = {
    MenuName: string;
    Key: string;
    icon?: React.ReactNode;
};

interface SectionObj {
    Title: string;
    SubTitle: string;
}

interface State {
    CurrentTileMenu: string;
    CurrentMenuItem: Record<string, unknown>;
    CurrClientName: string;
    CurrentSectionObj: SectionObj;
    CurrPillActive: string;
    pillItems: PillItem[];
}

type UnderlineStyle = {
    left: number;
    width: number;
};

type SprintDetailsV2Props = {
    CurrPillActive: string;
    CurrentSectionObj: SectionObj;
    CurrentTileMenu: string;
    handleCurrentTileMenu: (Menu: string) => void;
    handleCurrentSection: (Title: string, SubTitle: string) => void;
    CurrentSprint: Record<string, unknown>;
};

const SprintDetailsV2 = SprintDetailsV2Default as React.ComponentType<SprintDetailsV2Props>;

export default function TestDesignStudioV2(): JSX.Element {
    const location = useLocation();

    const initialState: State = {
        CurrentTileMenu: "",
        CurrentMenuItem: {},
        CurrClientName: "",
        CurrentSectionObj: { Title: "Test Design Studio", SubTitle: "" },
        CurrPillActive: "ScenarioWorkspace",
        pillItems: [
            { key: 'Test Scenario Generation', label: 'Test Scenario Generation' },
            { key: 'Artifacts', label: 'Artifacts' },
        ],
    };

    const [state, setState] = useReducer(
        (s: State, ns: Partial<State>): State => ({ ...s, ...ns }),
        initialState
    );

    useEffect(() => {
        handleCurrentSection("Test Design Studio", "");
    }, [location.search]);

    const currentRoute: string = location.pathname.replace('/', "");
    const menuRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const [underlineStyle, setUnderlineStyle] = useState<UnderlineStyle>({ left: 0, width: 0 });

    useEffect(() => {
        const el = menuRefs.current[state.CurrPillActive];
        if (el) {
            const rect = el.getBoundingClientRect();
            const containerRect = el.parentElement!.getBoundingClientRect();
            setUnderlineStyle({
                left: rect.left - containerRect.left,
                width: rect.width,
            });
        }
    }, [state.CurrPillActive]);

    const handleCurrentTileMenu = (Menu: string): void => {
        setState({ CurrPillActive: Menu });
    };

    const handleCurrentSection = (Title: string, SubTitle: string): void => {
        const CurrentSectionObj: SectionObj = { Title, SubTitle };
        setState({ CurrentSectionObj });
    };

    const handlePillClick = (item: PillItem): void => {
        setState({ CurrPillActive: item.key });
    };

    const MenuItems: MenuItem[] = [
        { MenuName: "Scenario Workspace", Key: "ScenarioWorkspace" },
        { MenuName: "Test Scenarios", Key: "TestScenarios" },
        { MenuName: "Test Cases", Key: "TestCases" },
        { MenuName: "Iterative Workflow", Key: "Iterative" },
    ];

    return (
        <div className=" w-full ">
            <div className="grid-cols-12 grid  overflow-y-auto  rounded-lg bg-white" style={{ height: "calc(100vh - 120px)" }}>
                <div className="col-span-12  p-3">
                    <div className="">
                        <nav className="hidden   md:flex gap-4 relative border-b-2 border-b-[#F1F1F1]">
                            {MenuItems.map((item) => (
                                <div
                                    key={item.Key}
                                    ref={(el: HTMLDivElement | null) => {
                                        menuRefs.current[item.Key] = el;
                                    }}
                                    onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                                        e.preventDefault();
                                        handleCurrentTileMenu(item.Key);
                                    }}
                                    className={`flex items-center relative cursor-pointer text-sm       rounded-lg  px-3 py-2  transition text-[0.92rem] font-medium ${
                                        state.CurrPillActive === item.Key ? 'text-[#0071E9]' : '  text-[#616161]'
                                    }`}
                                >
                                    <span className="pr-1.5">{item.icon}  </span> {item.MenuName}
                                </div>
                            ))}
                            <span
                                className="absolute bottom-[-1px] h-[2px] bg-[#0071E9] rounded transition-all duration-300"
                                style={{
                                    left: underlineStyle.left,
                                    width: underlineStyle.width,
                                }}
                            />
                        </nav>
                    </div>
                    {
                        <SprintDetailsV2
                            CurrPillActive={state.CurrPillActive}
                            CurrentSectionObj={state.CurrentSectionObj}
                            CurrentTileMenu={state.CurrentTileMenu}
                            handleCurrentTileMenu={handleCurrentTileMenu}
                            handleCurrentSection={handleCurrentSection}
                            CurrentSprint={state.CurrentMenuItem}
                        />
                    }
                </div>
            </div>
        </div>
    );
}
