import { toNodeHandler } from 'better-auth/node';
import 'dotenv/config';
import express from "express";
import { auth } from './lib/auth.js';
import cors from 'cors';
import { registerRoutes } from './routes/index.js';
import { errorHandler } from './middlewares/error-handler.middleware.js';
import { serve } from "inngest/express";
import { inngest } from "./inngest/client.js";
import { functions } from "./inngest/index.js";


const app = express();
const PORT = process.env.PORT || 8081;

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
);


app.all('/api/auth/{*any}', toNodeHandler(auth));
//! Mount express json middleware after Better Auth handler or only apply it to routes that don't interact with Better Auth
app.use(express.json());

// Set up the "/api/inngest" (recommended) routes with the serve handler
app.use("/api/inngest", serve({ client: inngest, functions }));

app.get("/health", (req, res) => {
  res.send("Server is healthy!");
});

registerRoutes(app);
app.use(errorHandler);


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});