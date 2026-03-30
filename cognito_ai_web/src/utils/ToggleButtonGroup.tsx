import React, { useLayoutEffect, useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";

type ItemKey = string | number;

interface ToggleItem {
  key: ItemKey;
  label: React.ReactNode;
  icon?: React.ReactNode;
}

type Size = "small" | "medium" | "large";

interface SizeStyle {
  padding: string;
  fontSize: string;
  iconSize: string;
  indicatorPadding: number;
  indicatorTopBottom: number;
}

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
} as const satisfies Record<Size, SizeStyle>;

type Props = {
  items?: ReadonlyArray<ToggleItem>;
  onChange?: (key: any) => void;
  initialKey?: ItemKey | null;
  color?: string;
  size?: Size;
  animationFlag?: boolean;
  children?: React.ReactNode;
};

export default function ToggleButtonGroup({
                                            items = [],
                                            onChange = (() => {}) as (key: ItemKey) => void,
    initialKey = null,
    color = "#76d300",
    size = "medium",
    animationFlag = true,
}: Props) {
  const [selectedKey, setSelectedKey] = useState<ItemKey | null | undefined>(
      initialKey || items[0]?.key
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

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const selectedIndex = items.findIndex((item) => item.key === selectedKey);
    const children = containerRef.current.children;
    if (children[selectedIndex]) {
      const el = children[selectedIndex] as HTMLElement;
      setActivePos({
        left: el.offsetLeft,
        width: el.offsetWidth,
      });
    }
  }, [selectedKey, items]);

  const handleSelect = (key: ItemKey): void => {
    setSelectedKey(key);
    onChange(key);
  };

  const {
    padding,
    fontSize,
    iconSize,
    indicatorPadding,
    indicatorTopBottom,
  } = SIZE_STYLES[size] || SIZE_STYLES.medium;

  return (
      <div
          className="relative inline-flex cursor-pointer bg-gray-100 shadow-md border"
          style={{
            borderColor: color,
            borderRadius: "0.65rem",
            padding: indicatorPadding,
          }}
      >
        <motion.div
            layout={animationFlag}
            transition={
              animationFlag
                  ? { type: "spring", stiffness: 300, damping: 25 }
                  : { duration: 0 }
            }
            className="absolute"
            style={{
              top: indicatorTopBottom,
              bottom: indicatorTopBottom,
              left: activePos.left + indicatorPadding,
              width: activePos.width - indicatorPadding * 0,
              backgroundColor: color,
              borderRadius: "0.5rem",
              zIndex: 0,
            }}
        />
        <div
            ref={containerRef}
            className="relative z-10 flex cursor-pointer"
            style={{ borderRadius: "inherit" }}
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

            return (
                <button
                    key={item.key}
                    onClick={() => handleSelect(item.key)}
                    className={`relative cursor-pointer flex items-center gap-2 transition-colors duration-200 ${
                        isSelected ? "text-gray-950" : "text-gray-700"
                    }`}
                    style={{
                      backgroundColor: "transparent",
                      fontSize,
                      padding,
                      ...radiusStyle,
                    }}
                >
                  {item.icon && (
                      <span style={{ fontSize: iconSize }}>{item.icon}</span>
                  )}
                  {item.label}
                </button>
            );
          })}
        </div>
      </div>
  );
}
