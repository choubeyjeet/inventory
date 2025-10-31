import React from "react";

export const Login = React.lazy(() => import("./pages/login"));
export const Dashboard = React.lazy(() => import("./pages/Dashboard"));
export const Items = React.lazy(() => import("./pages/Items"));
export const Invoice = React.lazy(() => import("./pages/Invoice"));