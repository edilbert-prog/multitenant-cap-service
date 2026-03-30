import React, { useState, useRef, useLayoutEffect, useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

type Placement = "top" | "bottom" | "left" | "right";

type Props = {
    children: React.ReactNode;
    placement?: Placement;
    title?: React.ReactNode;
    content?: React.ReactNode;
    offset?: number;
    className?: string;
};

export default function Tooltip(props: Props) {
    const {
        children,
        placement = "top",
        title,
        content,
        offset = 10,
        className = "",
    } = props;

    const [open, setOpen] = useState<boolean>(false);
    const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
    const [actualPlacement, setActualPlacement] = useState<Placement>(placement);
    const [arrow, setArrow] = useState<{ left: number; top: number }>({ left: 0, top: 0 });
    const [size, setSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

    const triggerRef = useRef<HTMLSpanElement | null>(null);
    const tooltipRef = useRef<HTMLDivElement | null>(null);

    const show = () => setOpen(true);
    const hide = () => setOpen(false);

    useEffect(() => {
        function handle() {
            if (!open) return;
            computeAndSetPosition(placement);
        }
        window.addEventListener("resize", handle);
        window.addEventListener("scroll", handle, true);
        return () => {
            window.removeEventListener("resize", handle);
            window.removeEventListener("scroll", handle, true);
        };
    }, [open, placement]);

    useLayoutEffect(() => {
        if (!open) return;
        computeAndSetPosition(placement);
        const ro = new ResizeObserver(() => {
            if (open) computeAndSetPosition(placement);
        });
        if (tooltipRef.current) ro.observe(tooltipRef.current);
        return () => ro.disconnect();
    }, [open, placement, title, content]);

    function computeAndSetPosition(requestedPlacement: Placement) {
        const el = triggerRef.current;
        const tip = tooltipRef.current;
        if (!el || !tip) return;

        const rect = el.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        const tipRect = tip.getBoundingClientRect();
        const tw = tipRect.width;
        const th = tipRect.height;

        setSize({ width: tw, height: th });

        function place(p: Placement) {
            let top = 0,
                left = 0;
            if (p === "top") {
                top = rect.top - th - offset;
                left = rect.left + rect.width / 2 - tw / 2;
            } else if (p === "bottom") {
                top = rect.bottom + offset;
                left = rect.left + rect.width / 2 - tw / 2;
            } else if (p === "left") {
                top = rect.top + rect.height / 2 - th / 2;
                left = rect.left - tw - offset;
            } else if (p === "right") {
                top = rect.top + rect.height / 2 - th / 2;
                left = rect.right + offset;
            }
            return { top, left };
        }

        function fits(_p: Placement, pos: { top: number; left: number }) {
            const pad = 4;
            return pos.left >= pad && pos.top >= pad && pos.left + tw <= vw - pad && pos.top + th <= vh - pad;
        }

        const order: Placement[] = (function () {
            if (requestedPlacement === "top") return ["top", "bottom", "left", "right"];
            if (requestedPlacement === "bottom") return ["bottom", "top", "left", "right"];
            if (requestedPlacement === "left") return ["left", "right", "top", "bottom"];
            return ["right", "left", "top", "bottom"];
        })();

        let chosen: Placement = order[0];
        let pos = place(chosen);
        for (const p of order) {
            const candidate = place(p);
            if (fits(p, candidate)) {
                chosen = p;
                pos = candidate;
                break;
            }
        }

        const pad = 8;
        pos.left = Math.max(pad, Math.min(vw - tw - pad, pos.left));
        pos.top = Math.max(pad, Math.min(vh - th - pad, pos.top));

        let arrowLeft = tw / 2;
        let arrowTop = th / 2;
        if (chosen === "top" || chosen === "bottom") {
            const targetX = rect.left + rect.width / 2;
            arrowLeft = targetX - pos.left;
            arrowLeft = Math.max(10, Math.min(tw - 10, arrowLeft));
            arrowTop = chosen === "top" ? th : 0;
        } else if (chosen === "left" || chosen === "right") {
            const targetY = rect.top + rect.height / 2;
            arrowTop = targetY - pos.top;
            arrowTop = Math.max(10, Math.min(th - 10, arrowTop));
            arrowLeft = chosen === "left" ? tw : 0;
        }

        setActualPlacement(chosen);
        setCoords({ top: pos.top, left: pos.left });
        setArrow({ left: arrowLeft, top: arrowTop });
    }

    const transformOrigin: string = (function () {
        if (actualPlacement === "top") return `${arrow.left}px ${size.height}px`;
        if (actualPlacement === "bottom") return `${arrow.left}px 0px`;
        if (actualPlacement === "left") return `${size.width}px ${arrow.top}px`;
        return `0px ${arrow.top}px`;
    })();

    return (
        <span
            ref={triggerRef}
            className="inline-flex"
            onMouseEnter={show}
            onMouseLeave={hide}
            onFocus={show}
            onBlur={hide}
        >
      {children}
            {typeof window !== "undefined" &&
                createPortal(
                    <AnimatePresence>
                        {open && (
                            <motion.div
                                ref={tooltipRef}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                                style={{
                                    position: "fixed",
                                    top: coords.top,
                                    left: coords.left,
                                    transformOrigin,
                                    zIndex: 2147483647,
                                    pointerEvents: "none",
                                }}
                                className={`rounded-2xl border border-gray-300 shadow-xl bg-white text-gray-900 px-3 py-2 text-sm max-w-xs ${className}`}
                            >
                                <div
                                    aria-hidden
                                    className="absolute"
                                    style={((): React.CSSProperties => {
                                        const arrowSize = 8;
                                        const borderWidth = 1;
                                        if (actualPlacement === "top") {
                                        return {
                                        left: arrow.left - arrowSize,
                                        top: size.height - borderWidth,
                                        width: 0,
                                        height: 0,
                                        borderStyle: "solid",
                                        borderWidth: `${1}px ${1}px 0 ${1}px`,
                                        borderColor: "transparent transparent transparent transparent",
                                        borderTopColor: "#d1d5db",
                                        backgroundColor: "#ffffff",
                                    };
                                    }
                                        if (actualPlacement === "bottom") {
                                        return {
                                        left: arrow.left - arrowSize,
                                        top: -arrowSize,
                                        width: 0,
                                        height: 0,
                                        borderStyle: "solid",
                                        borderWidth: `0 ${arrowSize}px ${arrowSize}px ${arrowSize}px`,
                                        borderColor: "transparent transparent transparent transparent",
                                        borderBottomColor: "#d1d5db",
                                        backgroundColor: "#ffffff",
                                    };
                                    }
                                        if (actualPlacement === "left") {
                                        return {
                                        top: arrow.top - arrowSize,
                                        left: size.width - borderWidth,
                                        width: 0,
                                        height: 0,
                                        borderStyle: "solid",
                                        borderWidth: `${arrowSize}px 0 ${arrowSize}px ${arrowSize}px`,
                                        borderColor: "transparent transparent transparent transparent",
                                        borderLeftColor: "#d1d5db",
                                        backgroundColor: "#ffffff",
                                    };
                                    }
                                        return {
                                        top: arrow.top - arrowSize,
                                        left: -arrowSize,
                                        width: 0,
                                        height: 0,
                                        borderStyle: "solid",
                                        borderWidth: `${arrowSize}px ${arrowSize}px ${arrowSize}px 0`,
                                        borderColor: "transparent transparent transparent transparent",
                                        borderRightColor: "#e8e8e8",
                                        backgroundColor: "#ffffff",
                                    };
                                    })()}
                                />
                                {title && <div className="font-semibold mb-1 leading-none">{title}</div>}
                                {content}
                            </motion.div>
                        )}
                    </AnimatePresence>,
                    document.body
                )}
    </span>
    );
}
