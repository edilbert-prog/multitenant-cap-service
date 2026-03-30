import React from 'react';
import ProjectSprintBPSPMapping from "./ProjectSprintBPSPMapping";

type Props = {
    CurrentSprint: any;
    children?: React.ReactNode;
};

export default function SprintDetails(props: Props) {
    return (
        <div className="grid grid-cols-12 gap-4 relative h-full">
            <div className="col-span-12 relative h-full cardContainer rounded-lg bg-white">
                <div className="h-full relative">
                    <div className="h-full relative pt-3 pb-3 px-3">
                        <ProjectSprintBPSPMapping CurrentSprint={props.CurrentSprint} Sprint={true} />
                    </div>
                </div>
            </div>
        </div>
    );
}
