import { io } from "socket.io-client";

const socket = io("http://localhost:8084" , {
    autoConnect : false,
    withCredentials : true 
});

export default socket