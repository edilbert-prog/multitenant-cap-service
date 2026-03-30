import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  title?: string | React.ReactNode;
  DisableScroll?: boolean;
  modalZIndex?: number;
  showClose?: boolean;
  width?: string;
};

export default function Modal({
                                isOpen,
                                onClose,
                                children,
                                title = "",
                                DisableScroll = false,
                                modalZIndex = 999,
                                showClose = true,
                                width = "max-w-lg",
                              }: ModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
      <AnimatePresence>
        <div
            className="fixed inset-0 h-screen flex items-center justify-center bg-black/40 backdrop-blur-sm"
            style={{ zIndex: modalZIndex }}
        >
          <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              transition={{ duration: 0.25 }}
              className={`bg-white absolute max-h-[90vh] ${
                  DisableScroll ? "" : "overflow-y-auto"
              } rounded-2xl shadow-xl ${width} w-full mx-4 p-6`}
          >
            {showClose && (
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-500 hover:text-black text-xl cursor-pointer"
                    aria-label="Close modal"
                >
                  &times;
                </button>
            )}
            {title && <h2 className="text-xl font-semibold mb-4">{title}</h2>}
            <div>{children}</div>
          </motion.div>
        </div>
      </AnimatePresence>
  );
}
