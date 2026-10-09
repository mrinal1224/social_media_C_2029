import { createContext, useContext, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import axiosInstance from "../axiosCalls/axios";
import {
  clearCurrentUser,
  hydrateCurrentUser,
  setCurrentUser,
} from "../redux/authSlice";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const loading = useSelector((state) => state.auth.loading);

  useEffect(() => {
    dispatch(hydrateCurrentUser());
  }, [dispatch]);

  const setUser = (nextUser) => {
    dispatch(setCurrentUser(nextUser));
    // Obtain full profile/following data after login or registration.
    dispatch(hydrateCurrentUser());
  };

  const logout = async () => {
    try {
      await axiosInstance.post("/users/logout");
    } finally {
      dispatch(clearCurrentUser());
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
