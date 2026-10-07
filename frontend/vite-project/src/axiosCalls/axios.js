// baseUrl - 
// Headers ; content-type : JSOn
// cookies
import axios from 'axios'

const axiosInstance = axios.create({
   baseURL : 'http://localhost:8084/',
   withCredentials : true,
   headers : {
     "Content-Type":"application/json"
   }

})

export default axiosInstance