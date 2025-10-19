import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  layout("routes/_layouts.tsx", [
    index("routes/home.tsx"),
    route("create", "routes/create.tsx"),
    route("campaign/:id", "routes/campaign.$id.tsx"),
  ])
] satisfies RouteConfig;
