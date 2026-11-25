import { useEffect, useState } from "react";
import type { Role } from "@contracts/types";

export const ROLE_LABELS: Record<Role, string> = {
  student: "Student",
  supervisor: "Cleaning Supervisor",
  staff: "Cleaning Staff",
  admin: "Lost-and-Found Administrator",
};

export interface AppRoute {
  role: Role;
  parts: string[];
}

const roles = Object.keys(ROLE_LABELS) as Role[];

export function readRoute(): AppRoute {
  const parts = window.location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  const role = roles.includes(parts[0] as Role) ? (parts[0] as Role) : "student";
  const routeParts = roles.includes(parts[0] as Role) ? parts.slice(1) : [];
  return { role, parts: routeParts.length ? routeParts : ["home"] };
}

export function go(role: Role, ...parts: string[]) {
  window.location.hash = `/${[role, ...parts].map(encodeURIComponent).join("/")}`;
}

export function useRoute() {
  const [route, setRoute] = useState<AppRoute>(readRoute);
  useEffect(() => {
    const update = () => {
      setRoute(readRoute());
      window.scrollTo({ top: 0, behavior: "instant" });
    };
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  return route;
}
