"use client";

import React, {
  useState,
  useRef,
  useLayoutEffect,
  useCallback,
  ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

type TooltipPosition = "top" | "bottom" | "left" | "right";

interface TooltipState {
  position: TooltipPosition;
  offset: number;
}

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  initialPosition?: TooltipPosition;
  offset?: number; // Distance from the target
}

const TooltipV2: React.FC<TooltipProps> = ({
  content,
  children,
  initialPosition = "top",
  offset = 12,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [state, setState] = useState<TooltipState>({
    position: initialPosition,
    offset,
  });

  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const targetRef = useRef<HTMLDivElement | null>(null);

  const windowPadding = 16;

  const determineBestPosition = useCallback(() => {
    if (!tooltipRef.current || !targetRef.current || !isVisible) return;

    const targetRect = targetRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();

    const checkSpace = {
      top: targetRect.top - tooltipRect.height - offset - windowPadding,
      bottom:
        window.innerHeight -
        (targetRect.bottom + tooltipRect.height + offset) -
        windowPadding,
      left: targetRect.left - tooltipRect.width - offset - windowPadding,
      right:
        window.innerWidth -
        (targetRect.right + tooltipRect.width + offset) -
        windowPadding,
    };

    let bestPosition: TooltipPosition = initialPosition;
    const isValid = (pos: TooltipPosition) => checkSpace[pos] > 0;

    if (!isValid(initialPosition)) {
      const positions = [
        { pos: "top", space: checkSpace.top },
        { pos: "bottom", space: checkSpace.bottom },
        { pos: "left", space: checkSpace.left },
        { pos: "right", space: checkSpace.right },
      ];
      positions.sort((a, b) => b.space - a.space);
      bestPosition = positions[0].pos as TooltipPosition;
    }

    // Compute fixed coordinates for the chosen position
    let top = 0;
    let left = 0;

    switch (bestPosition) {
      case "top":
        top = targetRect.top - tooltipRect.height - offset;
        left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
        break;
      case "bottom":
        top = targetRect.bottom + offset;
        left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
        break;
      case "left":
        top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2;
        left = targetRect.left - tooltipRect.width - offset;
        break;
      case "right":
        top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2;
        left = targetRect.right + offset;
        break;
    }

    // Clamp within viewport horizontally/vertically
    left = Math.max(
      windowPadding,
      Math.min(left, window.innerWidth - tooltipRect.width - windowPadding)
    );
    top = Math.max(
      windowPadding,
      Math.min(top, window.innerHeight - tooltipRect.height - windowPadding)
    );

    setState((prev) =>
      prev.position === bestPosition && prev.offset === offset
        ? prev
        : { position: bestPosition, offset }
    );
    setCoords({ top, left });
  }, [isVisible, initialPosition, offset]);

  useLayoutEffect(() => {
    determineBestPosition();
  }, [determineBestPosition]);

  // Recalculate on window resize/scroll while visible
  useLayoutEffect(() => {
    if (!isVisible) return;
    const handler = () => determineBestPosition();
    window.addEventListener("resize", handler);
    window.addEventListener("scroll", handler, true);
    return () => {
      window.removeEventListener("resize", handler);
      window.removeEventListener("scroll", handler, true);
    };
  }, [isVisible, determineBestPosition]);

  const getVariants = (pos: TooltipPosition) => {
    const common = { opacity: 0, scale: 0.95 };
    const travel = offset / 2;

    switch (pos) {
      case "top":
        return {
          initial: { ...common, y: travel },
          animate: { opacity: 1, scale: 1, y: 0 },
          exit: { ...common, y: travel },
        };
      case "bottom":
        return {
          initial: { ...common, y: -travel },
          animate: { opacity: 1, scale: 1, y: 0 },
          exit: { ...common, y: -travel },
        };
      case "left":
        return {
          initial: { ...common, x: travel },
          animate: { opacity: 1, scale: 1, x: 0 },
          exit: { ...common, x: travel },
        };
      case "right":
        return {
          initial: { ...common, x: -travel },
          animate: { opacity: 1, scale: 1, x: 0 },
          exit: { ...common, x: -travel },
        };
    }
  };

  const currentVariants = getVariants(state.position);

  const getArrowClass = () => {
    // triangle with 1 colored border + 3 transparent
    switch (state.position) {
      case "top":
        // arrow points down (tooltip above)
        return "absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-solid border-x-transparent border-b-transparent border-t border-t-gray-300";
      case "bottom":
        // arrow points up (tooltip below)
        return "absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full w-0 h-0 border-solid border-x-transparent border-t-transparent border-b border-b-gray-300";
      case "left":
        // arrow points right (tooltip left)
        return "absolute right-0 top-1/2 -translate-y-1/2 translate-x-full w-0 h-0 border-solid border-y-transparent border-r-transparent border-l border-l-gray-300";
      case "right":
        // arrow points left (tooltip right)
        return "absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full w-4 h-0 border-solid border-y-transparent border-l-transparent border-r border-r-gray-300";
    }
  };

  const tooltipNode =
    isVisible &&
    createPortal(
      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={tooltipRef}
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              zIndex: 9999,
              pointerEvents: "none",
            }}
            variants={currentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: "spring", damping: 25, stiffness: 400 }}
          >
            <div
              className="
                relative
                whitespace-nowrap
                bg-white
                text-black
                text-[0.82rem]
                py-1 px-3
                rounded-xl
                shadow-md
                border border-gray-300
              "
            >
              {content}
              <div className={getArrowClass()} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    );

  return (
    <>
      <div
        className="inline-block"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        ref={targetRef}
      >
        {children}
      </div>
      {tooltipNode}
    </>
  );
};

export default TooltipV2;
