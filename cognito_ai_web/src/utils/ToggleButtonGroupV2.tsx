import React, { useLayoutEffect, useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";

type Size = "small" | "medium" | "large";
type Variant = "pill" | "underline" | "both";

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
    size?: Size;
    animationFlag?: boolean;
    variant?: Variant;
    bottomBarHeight?: number;
};

const SIZE_STYLES = {
    small: {
        padding: "0.25rem 0.5rem",
        fontSize: "0.75rem",
        iconSize: "1rem",
        indicatorPadding: 2,
        indicatorTopBottom: 2,
    },
    medium: {
        padding: "0.375rem 0.75rem",
        fontSize: "0.875rem",
        iconSize: "1.125rem",
        indicatorPadding: 4,
        indicatorTopBottom: 4,
    },
    large: {
        padding: "0.5rem 1rem",
        fontSize: "1rem",
        iconSize: "1.25rem",
        indicatorPadding: 6,
        indicatorTopBottom: 6,
    },
} as const;

export default function ToggleButtonGroupV2({
                                                items = [],
                                                onChange = () => {},
                                                initialKey = null,
                                                color = "#0071E9",
                                                size = "medium",
                                                animationFlag = true,
                                                variant = "underline",
                                                bottomBarHeight = 2,
                                            }: Props) {
    const [selectedKey, setSelectedKey] = useState<string>(initialKey || items[0]?.key || "");
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [activePos, setActivePos] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

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

    const { padding, fontSize, iconSize, indicatorPadding, indicatorTopBottom } =
    SIZE_STYLES[size] || SIZE_STYLES.medium;

    const showPill = variant === "pill" || variant === "both";
    const showUnderline = variant === "underline" || variant === "both";

    return (
        <div
            className="relative inline-flex cursor-pointer"
            style={{
                borderColor: color,
                borderRadius: "0.65rem",
                padding: indicatorPadding,
                paddingBottom: indicatorPadding + (showUnderline ? bottomBarHeight + 2 : 0),
            }}
        >
            {showPill && (
                <motion.div
                    layout={animationFlag}
                    transition={animationFlag ? { type: "spring", stiffness: 300, damping: 25 } : { duration: 0 }}
                    className="absolute"
                    style={{
                        top: indicatorTopBottom,
                        bottom: indicatorTopBottom + (showUnderline ? bottomBarHeight + 2 : 0),
                        left: activePos.left + indicatorPadding,
                        width: activePos.width,
                        backgroundColor: color,
                        borderRadius: "0.5rem",
                        zIndex: 0,
                    }}
                />
            )}

            {showUnderline && (
                <motion.div
                    layout={animationFlag}
                    transition={animationFlag ? { type: "spring", stiffness: 350, damping: 28 } : { duration: 0 }}
                    className="absolute"
                    style={{
                        height: bottomBarHeight,
                        left: activePos.left + indicatorPadding,
                        width: activePos.width,
                        backgroundColor: color,
                        bottom: indicatorPadding,
                        borderRadius: bottomBarHeight,
                        zIndex: 5,
                    }}
                />
            )}

            <div
                ref={containerRef}
                className="relative z-10 flex cursor-pointer"
                style={{ borderRadius: "inherit", gap: "0.125rem", paddingBottom: 0 }}
            >
                {items.map((item, index) => {
                    const isSelected = selectedKey === item.key;
                    const isFirst = index === 0;
                    const isLast = index === items.length - 1;

                    const radiusStyle: React.CSSProperties = {
                        borderTopLeftRadius: isFirst ? "0.5rem" : 0,
                        borderBottomLeftRadius: isFirst ? "0.5rem" : 0,
                        borderTopRightRadius: isLast ? "0.5rem" : 0,
                        borderBottomRightRadius: isLast ? "0.5rem" : 0,
                    };

                    const selectedTextClass = variant === "underline" ? undefined : "text-white";
                    const baseTextClass = "text-gray-700";

                    return (
                        <button
                            key={item.key}
                            onClick={() => handleSelect(item.key)}
                            className={`relative cursor-pointer flex items-center gap-2 transition-colors duration-200 ${
                                isSelected ? selectedTextClass || "" : baseTextClass
                            }`}
                            style={{
                                backgroundColor: "transparent",
                                fontSize,
                                padding,
                                color: isSelected && variant === "underline" ? color : undefined,
                                ...radiusStyle,
                            }}
                            type="button"
                        >
                            {item.icon && <span style={{ fontSize: iconSize }}>{item.icon}</span>}
                            {item.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
