import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink, localLink, type TRPCLink } from "@trpc/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import superjson from "superjson";
import type { AppRouter } from "../../api/router";
import type { ReactNode } from "react";
import { staticDemoRouter } from "@/lib/staticDemoRouter";

export const trpc = createTRPCReact<AppRouter>();

const queryClient = new QueryClient();
const isStaticDemo = import.meta.env.VITE_STATIC_DEMO === "true";
const staticLink = localLink({
  router: staticDemoRouter,
  transformer: superjson,
  createContext: async () => ({}),
}) as TRPCLink<AppRouter>;
const trpcClient = trpc.createClient({
  links: [
    isStaticDemo
      ? staticLink
      : httpBatchLink({
          url: "/api/trpc",
          transformer: superjson,
          fetch(input, init) {
            return globalThis.fetch(input, {
              ...(init ?? {}),
              credentials: "include",
            });
          },
        }),
  ],
});

export function TRPCProvider({ children }: { children: ReactNode }) {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
