import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Info } from "lucide-react";

type ConfirmPopupProps = {
  message: string;
  icon?: React.ReactNode;
  yesText?: string;
  noText?: string;
  onConfirm?: () => void;
  children: React.ReactNode;
};

export default function ConfirmPopup({
                                       message,
                                       icon = <Info className="w-7 h-7 text-yellow-500" />,
                                       yesText = "Yes",
                                       noText = "No",
                                       onConfirm,
                                       children,
                                     }: ConfirmPopupProps) {
  const [open, setOpen] = useState<boolean>(false);
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);

  const handleConfirm = (): void => {
    setOpen(false);
    onConfirm?.();
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (
          popupRef.current &&
          !popupRef.current.contains(target) &&
          !(triggerRef.current && triggerRef.current.contains(target))
      ) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
      <div className="relative block">
        <div ref={triggerRef} onClick={() => setOpen((prev) => !prev)} className="cursor-pointer">
          {children}
        </div>

        <AnimatePresence>
          {open && (
              <motion.div
                  ref={popupRef}
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute z-50 w-72 max-w-[calc(100vw-2rem)] bg-white border border-gray-200 shadow-xl rounded-xl p-3
                       top-1/2 -left-2/12  -translate-x-full -translate-y-1/2 right-1/2"
              >
                <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rotate-45 shadow z-10"></div>

                <div className="flex items-start justify-between gap-3">
                  <div className="pt-0.5">{icon}</div>
                  <div className="text-sm text-gray-900 font-medium flex-1 text-center">{message}</div>
                </div>

                <div className="flex justify-end items-center mt-4 space-x-2">
                  <button
                      onClick={() => setOpen(false)}
                      className="px-4 py-1 text-sm cursor-pointer rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
                  >
                    {noText}
                  </button>
                  <button
                      onClick={handleConfirm}
                      className="px-4 py-1 text-sm cursor-pointer rounded-md bg-green-600 text-white hover:bg-green-700 transition"
                  >
                    {yesText}
                  </button>
                </div>
              </motion.div>
          )}
        </AnimatePresence>
      </div>
  );
}
