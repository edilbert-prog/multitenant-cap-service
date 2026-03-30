import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

type CustomModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  DisableScroll?: boolean;
  title?: React.ReactNode | string;
  modalZIndex?: number;
  showClose?: boolean;
  width?: string;
  footerContent?: React.ReactNode | React.ReactNode[] | null;
};

export default function CustomModal({
                                      isOpen,
                                      onClose,
                                      children,
                                      DisableScroll = false,
                                      title = "",
                                      modalZIndex = 999,
                                      showClose = true,
                                      width = "max-w-lg",
                                      footerContent = null,
                                    }: CustomModalProps) {
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

  return (
      <AnimatePresence>
        {isOpen && (
            <motion.div
                className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                style={{ zIndex: modalZIndex }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
            >
              <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 50 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 50 }}
                  transition={{ duration: 0.25 }}
                  className={`bg-white rounded-lg shadow-xl w-full ${width} mx-4 max-h-[90vh] flex flex-col`}
              >
                <div className="p-4 border-b rounded-lg border-gray-200 flex items-start justify-between sticky top-0 bg-white z-10">
                  <div>{title && <h2 className="text-xl font-semibold">{title}</h2>}</div>
                  {showClose && (
                      <button
                          onClick={onClose}
                          className="text-gray-500 cursor-pointer hover:text-black text-xl"
                      >
                        <X size={25} />
                      </button>
                  )}
                </div>

                <div className={`${DisableScroll ? "-y-hidden" : "overflow-y-auto"} px-6 py-4 flex-1`}>
                  {children}
                </div>

                {footerContent && (
                    <div className="p-3 rounded-lg border-t border-gray-200 flex justify-end gap-4 sticky bottom-0 bg-white z-10">
                      {Array.isArray(footerContent)
                          ? footerContent.map((el, i) => <span key={i}>{el}</span>)
                          : footerContent}
                    </div>
                )}
              </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
  );
}
