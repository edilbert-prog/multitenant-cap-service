import React, { useRef, useEffect, useState } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import { FaCommentDots } from "react-icons/fa";
import { MdClose } from "react-icons/md";

const ChatBot = ({
                     messages = [],
                     onOptionClick,
                     onUserMessage,
                     fromColor = "#DCF8C6",
                     toColor = "#E5E5EA",
                 }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [loadingOptionId, setLoadingOptionId] = useState(null);
    const scrollRef = useRef(null);

    const x = useMotionValue(0);
    const y = useMotionValue(0);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSend = () => {
        if (input.trim()) {
            const now = new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            });
            onUserMessage({ text: input, timestamp: now });
            setInput("");
        }
    };

    const handleOptionClick = async (option) => {
        setLoadingOptionId(option);
        await onOptionClick(option);
        setLoadingOptionId(null);
    };

    const openChat = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();

        const startX = rect.left + rect.width / 2 - 160;
        const startY = rect.top + rect.height / 2 - 250;

        x.set(startX);
        y.set(startY);

        setIsOpen(true);
        animate(x, 0, { duration: 0.4, ease: "easeOut" });
        animate(y, 0, { duration: 0.4, ease: "easeOut" });
    };

    return (
        <>
            {!isOpen && (
                <motion.button
                    className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white p-4 rounded-full shadow-lg "
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.4 }}
                    onClick={openChat}
                >
                    <FaCommentDots size={24} />
                </motion.button>
            )}

            {isOpen && (
                <motion.div
                    className="fixed bottom-6 right-6 z-50 w-80 h-[500px] bg-white shadow-xl rounded-xl flex flex-col border border-gray-300"
                    style={{ x, y }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                >
                    <div className="flex items-center justify-between p-3 bg-blue-600 text-white rounded-t-xl">
                        <h3 className="text-lg font-semibold">Chat Assistant</h3>
                        <button onClick={() => setIsOpen(false)} className="cursor-pointer">
                            <MdClose size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-4 bg-gray-50" ref={scrollRef}>
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex flex-col ${
                                    msg.sender === "user" ? "items-end" : "items-start"
                                }`}
                            >
                                <motion.div
                                    className="px-4 py-2 rounded-xl text-sm shadow-md whitespace-pre-wrap"
                                    style={{
                                        backgroundColor: msg.sender === "user" ? fromColor : toColor,
                                        borderTopLeftRadius: msg.sender === "user" ? "1rem" : "0.25rem",
                                        borderTopRightRadius: msg.sender === "bot" ? "1rem" : "0.25rem",
                                        maxWidth: "75%",
                                    }}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <span>
                                        {msg.text.split(/(\*\*.*?\*\*)/).map((part, idx) =>
                                            part.startsWith('**') && part.endsWith('**') ? (
                                                <span key={idx} className="bg-yellow-100 px-1 rounded">
                                                    {part.slice(2, -2)}
                                                </span>
                                            ) : (
                                                part
                                            )
                                        )}
                                    </span>
                                </motion.div>
                                <span className="text-xs text-gray-500 mt-1">
                                    {msg.timestamp}
                                </span>

                                {msg.sender === "bot" && msg.options && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {msg.options.map((opt, i) => (
                                            <button
                                                key={i}
                                                disabled={loadingOptionId === opt}
                                                onClick={() => handleOptionClick(opt)}
                                                className={`px-3 py-1 text-xs border rounded-full transition ${
                                                    loadingOptionId === opt
                                                        ? "bg-gray-200 text-gray-500 border-gray-300"
                                                        : "border-blue-500 text-blue-600 hover:bg-blue-50"
                                                }`}
                                            >
                                                {loadingOptionId === opt ? "Loading..." : opt}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="p-3 border-t border-t-gray-300">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                className="flex-1 border border-gray-400 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Type a message..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSend();
                                }}
                            />
                            <button
                                onClick={handleSend}
                                className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm  transition"
                            >
                                Send
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </>
    );
};

export default ChatBot;
