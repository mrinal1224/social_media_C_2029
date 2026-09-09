import axios from "axios";


export const axiosInstance = axios.create({
    baseURL : 'http://localhost:8089/',
    headers : {
        "Content-Type" : 'application/json'
    },
    withCredentials : true


})