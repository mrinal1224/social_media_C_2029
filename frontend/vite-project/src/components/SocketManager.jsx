import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import socket from "../socket";

function SocketManager() {
  const { user, loading } = useAuth();

  useEffect(() => {
    // Wait until authentication has been checked
    if (loading) return;

    // If the user is not logged in, disconnect
    if (!user) {
      socket.disconnect();
      return;
    }

    // Runs after the user logs in or refreshes
    const handleConnect = () => {
      console.log("Socket connected:", socket.id);
    };

    const handleDisconnect = () => {
      console.log("Socket disconnected");
    };

    const handleError = (error) => {
      console.log("Socket connection error:", error.message);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleError);

    // Connect using the existing JWT cookie
    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleError);

      socket.disconnect();
    };
  }, [user?._id, loading]);

  return null;
}

export default SocketManager;