// baseUrl - 
// Headers ; content-type : JSOn
// cookies
import axios from 'axios'

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8084',
  withCredentials: true,


})

export default axiosInstance