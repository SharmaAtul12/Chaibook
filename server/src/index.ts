import { toNodeHandler } from 'better-auth/node';
import 'dotenv/config';
import express from "express";
import { auth } from './lib/auth.js';

const app = express();
const PORT = process.env.PORT || 8081;

app.all('/api/auth/{*any}', toNodeHandler(auth));
//! Mount express json middleware after Better Auth handler or only apply it to routes that don't interact with Better Auth
app.use(express.json());


app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.get("/health", (req, res) => {
  res.send("Server is healthy!");
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});