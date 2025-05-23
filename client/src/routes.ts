import { type RouteConfig, index, route } from "@react-router/dev/routes"

export default [
    index("index.tsx"),
    route("/auth/login", "auth/login.tsx"),
    route("/auth/register", "auth/register.tsx"),
    route("/auth/profile", "auth/profile.tsx"),
] satisfies RouteConfig
