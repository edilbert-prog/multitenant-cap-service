import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, X, XCircle, AlertTriangle, Info } from "lucide-react";

type ToastType = "success" | "fail" | "warning" | "info";

type ToastProps = {
  message: string;
  onClose: () => void;
  show: boolean;
  type?: ToastType;
  children?: React.ReactNode;
};

export default function Toast({ message, onClose, show, type = "success" }: ToastProps) {
  useEffect(() => {
    if (!show) return;

    const timer: ReturnType<typeof setTimeout> = setTimeout(onClose, 3500);

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [show, onClose]);

  const typeConfig = {
    success: {
      icon: <CheckCircle className="text-green-600" size={28} aria-hidden="true" />,
      textColor: "text-green-600",
    },
    fail: {
      icon: <XCircle className="text-red-600" size={28} aria-hidden="true" />,
      textColor: "text-red-600",
    },
    warning: {
      icon: <AlertTriangle className="text-yellow-500" size={28} aria-hidden="true" />,
      textColor: "text-yellow-600",
    },
    info: {
      icon: <Info className="text-blue-500" size={28} aria-hidden="true" />,
      textColor: "text-blue-600",
    },
  };

  return (
      <AnimatePresence>
        {show && (
            <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 20, opacity: 1 }}
                exit={{ y: -50, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999]"
                aria-live="polite"
                role="status"
            >
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 px-6 py-2.5 flex items-center gap-4 w-[320px]">
                {typeConfig[type].icon}
                <p className={`${typeConfig[type].textColor} font-medium flex-1`}>{message}</p>
                <button
                    onClick={onClose}
                    className="text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
                    aria-label="Close notification"
                >
                  <X size={20} />
                </button>
              </div>
            </motion.div>
        )}
      </AnimatePresence>
  );
}
