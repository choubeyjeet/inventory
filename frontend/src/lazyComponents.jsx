import React from "react";

export const Signup = React.lazy(() => import("./pages/Signup"));
export const Login = React.lazy(() => import("./pages/login"));
export const Dashboard = React.lazy(() => import("./pages/Dashboard"));
export const Items = React.lazy(() => import("./pages/Items"));
export const Purchase = React.lazy(() => import("./pages/Purchase"));
export const Sales = React.lazy(() => import("./pages/Sales"));
export const Debt = React.lazy(() => import("./pages/Debt"));

export const CreateOrder = React.lazy(() => import("./pages/CreateOrder"));