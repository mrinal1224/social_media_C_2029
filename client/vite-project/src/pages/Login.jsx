import React, { useState } from 'react'
import { Link , useNavigate } from 'react-router-dom'
import { axiosInstance } from '../axiosCalls/axios'


function Login() {
    const [form, setForm] = useState({email: '', password: '' })

    const [loader , setLoader] = useState(false)

    const navigate = useNavigate()


    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    }





    const handleSubmit = async(e)=>{
           
          e.preventDefault()
          try {
           await axiosInstance.post('/users/login' , form) 
           // Add all the validation errors
           // Add a Loader



           console.log("User Logged in")

           navigate('/home')




          } catch (error) {
            console.log(error)
          }
    }








    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
            <div className="w-full max-w-md space-y-8 rounded-3xl bg-white p-8 shadow-sm border border-slate-100">

                {/* Branding & Header */}
                <div className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white font-black text-xl shadow-lg shadow-indigo-200">
                        sst
                    </div>
                    <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
                        Log in to SST Social
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Connect seamlessly. Share effortlessly.
                    </p>
                </div>

                {/* Form */}
                <form className="mt-8 space-y-4">

                    {/* Email Field */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                            Email Address
                        </label>
                        <input
                            type="email"
                            name="email"
                            onChange={handleChange}
                            placeholder="alex@example.com"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-800 text-sm placeholder-slate-400 transition-all focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                        />
                    </div>

                    {/* Password Field */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            name="password"
                            onChange={handleChange}
                            placeholder="Password"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-800 text-sm placeholder-slate-400 transition-all focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                        />
                    </div>

                    {/* Register Button */}
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        className="w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white shadow-md shadow-indigo-100 transition-all hover:bg-indigo-700 active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-indigo-500/20 mt-2"
                    >
                        Log in 
                    </button>
                </form>

                {/* Footer / Login Link */}
                <div className="border-t border-slate-100 pt-6 text-center">
                    <p className="text-sm text-slate-500">
                        New User , Please {' '}
                        <Link to="/signup" className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline">
                            Sign up
                        </Link>
                    </p>
                </div>

            </div>
        </div>
    )
}

export default Login