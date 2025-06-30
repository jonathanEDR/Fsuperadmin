import { createContext, useContext } from "react";

export const RoleContext = createContext();
export const useRole = () => useContext(RoleContext);
