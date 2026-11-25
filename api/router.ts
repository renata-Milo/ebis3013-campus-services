import { createRouter } from "./middleware";
import { demoRouter } from "./demoRouter";

export const appRouter = createRouter({
  demo: demoRouter,
});

export type AppRouter = typeof appRouter;
