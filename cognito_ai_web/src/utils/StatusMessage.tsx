import React from "react";
import { motion, AnimatePresence } from "framer-motion";

type StatusType = "success" | "fail";

interface StatusMessageProps {
    status?: StatusType;
    message?: string;
    size?: number;
    className?: string;
    successColor?: string;
    failColor?: string;
    strokeWidth?: number;
}

export function StatusMessage({
                                  status = "success",
                                  message = "",
                                  size = 80,
                                  className = "",
                                  successColor = "#10B981", // Tailwind emerald-500
                                  failColor = "#F43F5E", // Tailwind rose-500
                                  strokeWidth = 3,
                              }: StatusMessageProps) {
    const isSuccess = status === "success";

    const ui = isSuccess
        ? {
            text: "text-emerald-700 ",
            glow: "shadow-[0_0_30px_rgba(16,185,129,0.25)]",
        }
        : {
            text: "text-rose-700 ",
            glow: "shadow-[0_0_30px_rgba(244,63,94,0.25)]",
        };

    const strokeColor = isSuccess ? successColor : failColor;

    const containerVariants = {
        initial: { opacity: 0, scale: 0.95, y: 8 },
        animate: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
        },
        exit: {
            opacity: 0,
            scale: 0.98,
            y: 6,
            transition: { duration: 0.25, ease: "easeInOut" },
        },
    };

    const circleVariants = {
        hidden: { pathLength: 0, rotate: -90 },
        visible: {
            pathLength: 1,
            rotate: -90,
            transition: { duration: 0.75, ease: "easeInOut" },
        },
    };

    const pathVariants = {
        hidden: { pathLength: 0, opacity: 0 },
        visible: (custom: { delay: number }) => ({
            pathLength: 1,
            opacity: 1,
            transition: {
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1],
                delay: custom.delay,
            },
        }),
    };

    // @ts-ignore
    // @ts-ignore
    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={`${status}-${message}-${strokeColor}-${strokeWidth}`}
                role="status"
                aria-live="polite"
                className={`w-full bg-white p-5 md:p-6 ${className}`}
                variants={containerVariants}
                initial="initial"
                animate="animate"
                exit="exit"
            >
                <div className="flex items-center gap-4">
                    {/* Animated SVG Icon */}
                    <motion.svg
                        width={size}
                        height={size}
                        viewBox="0 0 100 100"
                        className="shrink-0"
                    >
                        <motion.circle
                            cx="50"
                            cy="50"
                            r="42"
                            fill="none"
                            stroke={strokeColor}
                            strokeWidth={strokeWidth}
                            variants={circleVariants}
                            initial="hidden"
                            animate="visible"
                            strokeLinecap="round"
                        />

                        {isSuccess ? (
                            <motion.path
                                d="M30 52 L45 67 L72 40"
                                fill="none"
                                stroke={strokeColor}
                                strokeWidth={strokeWidth}
                                variants={pathVariants}
                                initial="hidden"
                                animate="visible"
                                custom={{ delay: 0.75 }}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        ) : (
                            <>
                                <motion.path
                                    d="M34 34 L66 66"
                                    fill="none"
                                    stroke={strokeColor}
                                    strokeWidth={strokeWidth}
                                    variants={pathVariants}
                                    initial="hidden"
                                    animate="visible"
                                    custom={{ delay: 0.75 }}
                                    strokeLinecap="round"
                                />
                                <motion.path
                                    d="M66 34 L34 66"
                                    fill="none"
                                    stroke={strokeColor}
                                    strokeWidth={strokeWidth}
                                    variants={pathVariants}
                                    initial="hidden"
                                    animate="visible"
                                    custom={{ delay: 1.35 }}
                                    strokeLinecap="round"
                                />
                            </>
                        )}
                    </motion.svg>

                    {/* Text Content */}
                    <div className="min-w-0">
                        <p className={`text-base md:text-lg font-semibold ${ui.text}`}>
                            {isSuccess ? "Success" : "Failed"}
                        </p>
                        {message && (
                            <p className="text-sm md:text-base text-gray-800 mt-0.5">
                                {message}
                            </p>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
