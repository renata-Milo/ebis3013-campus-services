# Campus Services · EBIS3013

Interactive English prototype for the **Integrated Campus Cleaning and Lost-and-Found Management System**.

## Demonstration flows

- Cleaning: student submission → supervisor assignment → staff completion → supervisor review, including rework and a persistent activity timeline.
- Lost and found: public item search → ownership claim → administrator comparison and decision → collection and return recording.
- Four role views share the same server-side demo records. The reset tool restores the original fictional sample.

## Run

```bash
npm install
npm run db:push
npm run dev
```

The development server runs at `http://localhost:3000`.

```bash
npm run check
npm run build
npm start
```

The production build serves `dist/public` through the bundled Hono server at `dist/boot.js`.

## Structure

- `src/pages/`: role-specific views and forms
- `src/components/`: shared layout, record lists and ticket details
- `contracts/`: domain types and fictional initial data
- `api/demoRouter.ts`: validated workflow mutations
- `db/schema.ts`: shared demo-state persistence

The interface uses React, TypeScript, Tailwind CSS, Lucide icons and locally bundled Bricolage Grotesque. It includes responsive layouts, keyboard-accessible controls and installable PWA metadata.
