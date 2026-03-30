import { AnimatePresence, motion } from "framer-motion";
import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

type AccordionProps<T, K extends string | number = string> = {
    title: React.ReactNode;
    expandKey: K;
    item: T & Partial<{ selected: boolean }>;
    checkboxEnabled?: boolean;
    children: React.ReactNode;
    onCheckboxChange?: (item: T, checked: boolean) => void;
    onClick?: (item: T, willOpen: boolean) => void;
};

export default function Accordion<T, K extends string | number = string>({
    title,
    expandKey,
    item,
    checkboxEnabled = false,
    children,
    onCheckboxChange,
    onClick = () => {},
}: AccordionProps<T, K>) {
    const [openKey, setOpenKey] = useState<K | null>(null);

    const isOpen = openKey === expandKey;

    const toggle = (): void => {
        const willOpen = !isOpen;
        setOpenKey(willOpen ? expandKey : null);
        onClick(item, willOpen);
    };

    return (
        <div className="w-full rounded-md border border-gray-300 bg-white shadow transition-all duration-300">
            {/* Use div instead of button to avoid global click behavior */}
            <div className="flex items-center rounded-md jus pl-4  bg-gray-100">
                {checkboxEnabled && (
                    <label className="custom-checkbox cursor-pointer">
                        <input
                            type="checkbox"
                            checked={item?.selected ?? false}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                onCheckboxChange?.(item, e.target.checked)
                            }
                            onClick={(e: React.MouseEvent<HTMLInputElement>) => e.stopPropagation()}
                        />
                        <span className="checkmark" />
                    </label>
                )}
                <div
                    onClick={toggle}
                    className="flex w-full items-center justify-between pl-3 pr-5 py-2 text-left text-lg font-medium text-gray-800 cursor-pointer"
                >
                    <div className="flex items-center gap- hover:underline">{title}</div>
                    <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.25 }}>
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                    </motion.div>
                </div>
            </div>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        key="content"
                        initial="collapsed"
                        animate="open"
                        exit="collapsed"
                        variants={{
                            open: { height: "auto", opacity: 1 },
                            collapsed: { height: 0, opacity: 0 },
                        }}
                        transition={{ duration: 0.35, ease: "easeInOut" }}
                        className="overflow-hidden px-4"
                    >
                        <div className="py-4 text-gray-600">{children}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
