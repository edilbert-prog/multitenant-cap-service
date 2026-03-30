import React, { createContext, useContext } from "react";

interface SidebarContextType {
    refreshSidebar: () => void;
    toggleCollapse: () => void;
    selectFirstSprint: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = (): SidebarContextType => {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error("useSidebar must be used within a SidebarContext.Provider");
    }
    return context;
};

export default SidebarContext;
