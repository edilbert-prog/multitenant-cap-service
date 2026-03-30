import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface ToggleItem {
    key: string;
    label: React.ReactNode;
    icon?: React.ReactNode;
}

type Props = {
    items?: ToggleItem[];
    onChange?: (key: string) => void;
    initialKey?: string | null;
    color?: string;
    animationFlag?: boolean;
};

export default function ToggleButtonGroupV3({
                                                items = [],
                                                onChange = () => {},
                                                initialKey = null,
                                                color = "#0071E9",
                                                animationFlag = true,
                                            }: Props) {
    const [selectedKey, setSelectedKey] = useState<string>(
        initialKey || items[0]?.key || ""
    );
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [activePos, setActivePos] = useState<{ left: number; width: number }>({
        left: 0,
        width: 0,
    });

    useEffect(() => {
        if (initialKey && initialKey !== selectedKey) {
            setSelectedKey(initialKey);
        }
    }, [initialKey, selectedKey]);

    const updateActivePos = (): void => {
        if (!containerRef.current) return;
        const selectedIndex = items.findIndex((item) => item.key === selectedKey);
        const children = containerRef.current.children;
        if (selectedIndex > -1 && children[selectedIndex]) {
            const el = children[selectedIndex] as HTMLElement;
            setActivePos({
                left: el.offsetLeft,
                width: el.offsetWidth,
            });
        }
    };

    useLayoutEffect(() => {
        updateActivePos();
    }, [selectedKey, items]);

    useEffect(() => {
        if (!containerRef.current) return;
        const ro = new ResizeObserver(() => updateActivePos());
        ro.observe(containerRef.current);
        window.addEventListener("resize", updateActivePos);
        return () => {
            ro.disconnect();
            window.removeEventListener("resize", updateActivePos);
        };
    }, []);

    const handleSelect = (key: string): void => {
        setSelectedKey(key);
        onChange(key);
    };

    return (
        <div className="relative inline-flex items-center rounded-xl  p-1">
            {/* Animated purple pill background */}
            <motion.div
                layout
                animate={{ left: activePos.left, width: activePos.width }}
                transition={
                    animationFlag
                        ? { type: "spring", stiffness: 350, damping: 25 }
                        : { duration: 0 }
                }
                className="absolute top-1 bottom-1 rounded-lg bg-white  "
                style={{
                    borderColor: color,
                }}
            />

            <div
                ref={containerRef}
                className="relative z-10 flex items-center text-sm font-medium gap-4"
            >
                {items.map((item) => {
                    const isSelected = selectedKey === item.key;
                    return (
                        <button
                            key={item.key}
                            onClick={() => handleSelect(item.key)}
                            type="button"
                            className={`relative text-[#0071E9] border  border-[#0071E9]   flex cursor-pointer items-center gap-2 px-4 py-2 rounded-lg  
                ${isSelected ? "text-white bg-[#0071E9]" : " "}
              `}
                        >
                            {item.icon && (
                                <span className="text-base flex items-center justify-center">
                  {item.icon}
                </span>
                            )}
                            {item.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
