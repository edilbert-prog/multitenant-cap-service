import React, {useEffect, useMemo, useRef, useState, cloneElement} from "react";
import { AnimatePresence, motion } from "framer-motion";

export type MenuItem =
    | { type: "separator" }
    | {
    id: string;
    label: string;
    icon?: React.ReactNode;
    shortcut?: string;
    disabled?: boolean;
    danger?: boolean;
    onClick?: (item: Omit<MenuItem, "type">) => void;
};

export type MenuProps = {
    trigger: React.ReactElement;
    items: MenuItem[];
    onSelect?: (item: Exclude<MenuItem, { type: "separator" }>) => void;
    align?: "start" | "end";
    width?: number | "auto";
    closeOnSelect?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    portal?: boolean;
};
type Coords = {
    top?: number;
    left?: number;
    right?: number;
    width: number;
    placement: "bottom" | "top";
    originX: "left" | "right" | "center";
};
export default function Menu({
                                 trigger,
                                 items,
                                 onSelect,
                                 align = "start",
                                 width = 240,
                                 closeOnSelect = true,
                                 open: controlledOpen,
                                 onOpenChange,
                                 portal = false,
                             }: MenuProps) {
    const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
    const isControlled = typeof controlledOpen === "boolean";
    const open = isControlled ? !!controlledOpen : uncontrolledOpen;

    const setOpen = (next: boolean) => {
        if (isControlled) onOpenChange?.(next);
        else setUncontrolledOpen(next);
    };

    const [coords, setCoords] = useState<Coords>({
        width: 0,
        placement: "bottom",
        originX: "left",
    });
    const triggerRef = useRef<HTMLElement | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const focusIndexRef = useRef<number>(-1);

    const enhancedTrigger = useMemo(() => {
        const onClick = (e: React.MouseEvent) => {
            trigger.props?.onClick?.(e);
            setOpen(!open);
        };

        const setRef = (node: HTMLElement | null) => {
            triggerRef.current = node;
            const passedRef: any = (trigger as any).ref;
            if (typeof passedRef === "function") passedRef(node);
            else if (passedRef && typeof passedRef === "object") passedRef.current = node;
        };

        return cloneElement(trigger, {
            ref: setRef,
            "aria-haspopup": "menu",
            "aria-expanded": open,
            onClick,
        });
    }, [trigger, open]);

    useEffect(() => {
        function updatePosition() {
            const el = triggerRef.current;
            const menuEl = menuRef.current;
            if (!el) return;

            const rect = el.getBoundingClientRect();
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const gutter = 8;

            // Estimate menu size (use real size if rendered)
            let menuW = typeof width === "number" ? width : 260;
            let menuH = 200;
            if (menuEl) {
                const ms = menuEl.getBoundingClientRect();
                if (ms.width) menuW = ms.width;
                if (ms.height) menuH = ms.height;
            }

            // Vertical: prefer bottom, else top
            const canBottom = rect.bottom + gutter + menuH <= vh;
            const canTop = rect.top - gutter - menuH >= 0;
            const placement: "bottom" | "top" = canBottom || !canTop ? "bottom" : "top";

            // Horizontal: try requested align, then flip, else clamp
            const fitsStart = rect.left + menuW <= vw;
            const fitsEnd = rect.right - menuW >= 0;

            let left = rect.left;
            let originX: Coords["originX"] = "left";

            if (align === "end") {
                if (fitsEnd) {
                    left = rect.right - menuW;
                    originX = "right";
                } else if (fitsStart) {
                    left = rect.left;
                    originX = "left";
                } else {
                    left = Math.max(8, Math.min(rect.left, vw - menuW - 8));
                    originX = "center";
                }
            } else {
                if (fitsStart) {
                    left = rect.left;
                    originX = "left";
                } else if (fitsEnd) {
                    left = rect.right - menuW;
                    originX = "right";
                } else {
                    left = Math.max(8, Math.min(rect.left, vw - menuW - 8));
                    originX = "center";
                }
            }

            const topRaw = placement === "bottom" ? rect.bottom + gutter : rect.top - gutter - menuH;

            // Use viewport coords for portal (fixed), page coords for inline (absolute)
            const top = portal ? topRaw : topRaw + window.scrollY;
            const leftPx = portal ? left : left + window.scrollX;

            setCoords({ top, left: leftPx, right: undefined, width: rect.width, placement, originX });
        }

        updatePosition();
        if (open) {
            window.addEventListener("resize", updatePosition);
            window.addEventListener("scroll", updatePosition, true);
            return () => {
                window.removeEventListener("resize", updatePosition);
                window.removeEventListener("scroll", updatePosition, true);
            };
        }
    }, [open, align, width, portal]);


    // Close on outside click / ESC
    useEffect(() => {
        if (!open) return;
        function onDown(e: MouseEvent) {
            const t = e.target as Node;
            if (!menuRef.current || !triggerRef.current) return;
            if (menuRef.current.contains(t) || triggerRef.current.contains(t)) return;
            setOpen(false);
        }
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") setOpen(false);
        }
        document.addEventListener("mousedown", onDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    // Keyboard navigation within menu
    const focusableIndices = useMemo(
        () => items.map((it, idx) => (it && (it as any).disabled) || it.type === "separator" ? null : idx).filter((i): i is number => i !== null),
        [items]
    );

    const moveFocus = (dir: 1 | -1) => {
        if (!focusableIndices.length) return;
        const current = focusIndexRef.current;
        const pos = Math.max(0, focusableIndices.indexOf(current));
        const next = focusableIndices[(pos + (dir === 1 ? 1 : focusableIndices.length - 1)) % focusableIndices.length];
        focusIndexRef.current = next;
        const el = menuRef.current?.querySelector<HTMLElement>(`[data-index='${next}']`);
        el?.focus();
    };

    const handleMenuKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            if (focusIndexRef.current === -1 && focusableIndices.length) {
                focusIndexRef.current = focusableIndices[0];
                const el = menuRef.current?.querySelector<HTMLElement>(`[data-index='${focusIndexRef.current}']`);
                el?.focus();
            } else moveFocus(1);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            if (focusIndexRef.current === -1 && focusableIndices.length) {
                focusIndexRef.current = focusableIndices[focusableIndices.length - 1];
                const el = menuRef.current?.querySelector<HTMLElement>(`[data-index='${focusIndexRef.current}']`);
                el?.focus();
            } else moveFocus(-1);
        } else if (e.key === "Home") {
            e.preventDefault();
            if (focusableIndices.length) {
                focusIndexRef.current = focusableIndices[0];
                menuRef.current?.querySelector<HTMLElement>(`[data-index='${focusIndexRef.current}']`)?.focus();
            }
        } else if (e.key === "End") {
            e.preventDefault();
            if (focusableIndices.length) {
                focusIndexRef.current = focusableIndices[focusableIndices.length - 1];
                menuRef.current?.querySelector<HTMLElement>(`[data-index='${focusIndexRef.current}']`)?.focus();
            }
        }
    };

    const menu = (
        <AnimatePresence>
            {open && (
                <motion.div
                    ref={menuRef}
                    role="menu"
                    aria-label="Dropdown menu"
                    initial={{ opacity: 0, scale: 0.96, y: coords.placement === "bottom" ? -4 : 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 420, damping: 30, mass: 0.6 } }}
                    exit={{ opacity: 0, scale: 0.98, y: coords.placement === "bottom" ? -4 : 4, transition: { duration: 0.12 } }}
                    className="z-[1000] origin-top overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5"
                    style={{
                        position: portal ? "fixed" : "absolute",
                        top: coords.top,
                        left: coords.left,
                        minWidth: typeof width === "number" ? width : undefined,
                        width: width === "auto" ? "auto" : typeof width === "number" ? width : undefined,
                        transformOrigin: `${coords.placement === "bottom" ? "top" : "bottom"} ${coords.originX}`,
                    }}
                >
                <div className="py-2">
                        {items.map((item, idx) => {
                            if (item.type === "separator") {
                                return <div key={`sep-${idx}`} role="separator" className="my-1 border-t border-zinc-200/80 " />;
                            }
                            const disabled = item.disabled;
                            const base = "group flex w-full items-center gap-3 px-3 py-2 text-sm outline-none focus-visible:ring-2 ring-blue-500/60";
                            const state = disabled
                                ? "cursor-not-allowed text-zinc-400 "
                                : item.danger
                                    ? "text-red-600 hover:bg-red-50 active:bg-red-100 "
                                    : "text-zinc-900 hover:bg-zinc-50 active:bg-zinc-100 ";
                            return (
                                <button
                                    key={item.id}
                                    role="menuitem"
                                    tabIndex={0}
                                    data-index={idx}
                                    disabled={disabled}
                                    className={`${base} ${state} relative`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (disabled) return;
                                        // ripple
                                        spawnRipple(e.currentTarget, e.nativeEvent as any);
                                        item.onClick?.(item);
                                        onSelect?.(item);
                                        if (closeOnSelect) setOpen(false);
                                    }}
                                >
                                    {/* Icon */}
                                    <span className="inline-flex h-5 w-5 items-center justify-center ">
                    {item.icon ?? <DotIcon />}
                  </span>
                                    <span className="flex-1 text-left font-medium tracking-tight">{item.label}</span>
                                    {item.shortcut && (
                                        <span className="text-xs tabular-nums text-zinc-400 ">{item.shortcut}</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <div className="relative inline-flex">
            {enhancedTrigger}
            {portal ? (
                menu
            ) : (
                <div
                    style={{ position: "absolute", top: 0, left: 0, right: "auto", pointerEvents: "none" }}
                    aria-hidden
                >
                    <div style={{ pointerEvents: "auto", position: "absolute", top: 0, left: 0 }}>{menu}</div>
                </div>
            )}
        </div>
    );
}

/** Minimal icons to avoid external deps */
function DotIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <circle cx="10" cy="10" r="3" />
        </svg>
    );
}

function spawnRipple(target: HTMLElement, e: MouseEvent) {
    const rect = target.getBoundingClientRect();
    const ripple = document.createElement("span");
    const size = Math.max(rect.width, rect.height) * 1.2;
    const x = (e.clientX ?? rect.left + rect.width / 2) - rect.left - size / 2;
    const y = (e.clientY ?? rect.top + rect.height / 2) - rect.top - size / 2;
    ripple.style.position = "absolute";
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.borderRadius = "9999px";
    ripple.style.pointerEvents = "none";
    ripple.style.background = "currentColor";
    ripple.style.opacity = "0.15";
    ripple.style.transform = "scale(0)";
    ripple.style.transition = "transform 350ms cubic-bezier(.2,.8,.2,1), opacity 600ms linear";
    target.appendChild(ripple);
    requestAnimationFrame(() => {
        ripple.style.transform = "scale(1)";
        ripple.style.opacity = "0";
    });
    setTimeout(() => ripple.remove(), 650);
}
