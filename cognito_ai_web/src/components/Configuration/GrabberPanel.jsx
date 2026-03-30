import React from 'react';
import GrabberTool from "../../utils/GrabberTool";
import {HostConfig} from "../../../HostConfig";

const GrabberPanel = () => {
    return (
        <div>
            <GrabberTool
                url={HostConfig.Domain}
            />
        </div>
    );
};

export default GrabberPanel;