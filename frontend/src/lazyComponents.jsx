import React from "react";

export const Login = React.lazy(() => import("./pages/login"));
export const Dashboard = React.lazy(() => import("./pages/Dashboard"));
export const Items = React.lazy(() => import("./pages/Items"));

export const CreateOrder = React.lazy(() => import("./pages/CreateOrder"));