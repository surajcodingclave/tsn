"use client";

import { io } from "socket.io-client";

let socket = null;

/** Get (or lazily create) a socket.io connection using the session token. */
export function getSocket(token) {
  if (socket && socket.connected) return socket;
  if (socket) socket.disconnect();
  socket = io({ path: "/socket.io", transports: ["websocket", "polling"], auth: { token } });
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}