import React from 'react';
import ProjectSprintSessionsV2 from "./ProjectSprintSessionsV2";
import ProjectSprintSessionDetailsV2 from "../Artifacts/ProjectSprintSessionDetailsV2";
import ProjectSprintSessionTestCases from "../Artifacts/ProjectSprintSessionTestCasesV2";
import IterativeWorkFlow from "@/components/TestDesignStudio/ProjectSprintDocs/IterativeWorkFlow";

type Pill = "ScenarioWorkspace" | "TestScenarios" | "TestCases";

type Props = {
    CurrPillActive: Pill;
    CurrentSprint?: Record<string, unknown>;
    children?: React.ReactNode;
};

export default function SprintDetailsV2(props: Props) {
    return (
        <div className=" ">
            <div className="col-span-12 relative h-full      rounded-lg ">
                <div className="h-full relative">
                    {props.CurrPillActive === "ScenarioWorkspace" && (
                        <div className="h-full relative  ">
                            <ProjectSprintSessionsV2 CurrentSprint={props?.CurrentSprint} />
                        </div>
                    )}

                    {props.CurrPillActive === "TestScenarios" && (
                        <div>
                            <ProjectSprintSessionDetailsV2 />
                        </div>
                    )}
                    {props.CurrPillActive === "TestCases" && (
                        <div>
                            <ProjectSprintSessionTestCases />
                        </div>
                    )}
                    {props.CurrPillActive === "Iterative" && (
                         <div>
                            <IterativeWorkFlow handleCurrentTileMenu={props.handleCurrentTileMenu} />
                         </div>
                    )}
                </div>
            </div>
        </div>
    );
}
