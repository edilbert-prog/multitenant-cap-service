import { io, type Socket, type ManagerOptions, type SocketOptions } from "socket.io-client";
import { HostConfig } from "../../HostConfig.js"; // adjust relative path if needed

const TARGET = HostConfig?.socketURL || window.location.origin;
console.log("[socket.ts] SOCKET TARGET =", TARGET);

const options = {
  path: "/socket.io",
  transports: ["websocket", "polling"],
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000
} as Partial<ManagerOptions & SocketOptions>;

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(TARGET, options);

    socket.on("connect", () => console.log("[SOCKET] Connected: ID =", socket?.id));
    socket.on("connect_error", (err) => console.error("[SOCKET] connect_error", err));
    socket.on("disconnect", (reason) => console.warn("[SOCKET] disconnected", reason));

    // expose for debugging
    try { (window as any).__SOCKET__ = socket; } catch (e) {}
  }
  return socket;
}

export function openSocket() {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

export function closeSocket() {
  if (!socket) return;
  try { socket.disconnect(); } catch(e) {}
  socket = null;
  try { delete (window as any).__SOCKET__; } catch(e) {}
}
export default getSocket();