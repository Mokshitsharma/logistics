import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import "dotenv/config";

const PORT = 3000;

const app = express();
app.use(express.json());
app.use(cors());

async function startServer() {
  // API routes are now handled by Firestore on the client side.
  // This server primarily serves the static files and handles SPA routing.

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (process.env.VERCEL !== "1") {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

startServer();

export default app;
