import React from 'react';
import ExecutionAPI from "./ExecutionAPI";
import ExecutionTosca from "./ExecutionTosca";
import ExecutionSelenium from "./ExecutionSelenium";

type Pill = "API" | "TOSCA" | "SELENIUM";

type Props = {
    CurrPillActive: Pill;
    CurrentSprint?: Record<string, unknown>;
    CurrAddEditDetails?: Record<string, unknown>;
    children?: React.ReactNode;
};

export default function ExecutionDetails(props: Props) {
    return (
        <div className=" ">
            <div className="col-span-12 relative h-full      rounded-lg ">
                <div className="h-full relative">
                    {props.CurrPillActive === "API" && (
                        <div className="h-full relative  ">
                            <ExecutionAPI CurrAddEditDetails={props.CurrAddEditDetails} CurrentSprint={props?.CurrentSprint} />
                        </div>
                    )}

                    {props.CurrPillActive === "TOSCA" && (
                        <div>
                            <ExecutionTosca />
                        </div>
                    )}
                    {props.CurrPillActive === "SELENIUM" && (
                        <div>
                            <ExecutionSelenium />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
