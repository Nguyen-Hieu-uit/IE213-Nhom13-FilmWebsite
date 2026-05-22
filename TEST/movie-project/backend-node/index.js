import dotenv from "dotenv";
import { app, server } from "./app.js";
import cors from "cors";
import { expressMiddleware } from "@as-integrations/express5";
import { createLoaders } from "./graphql/loader/index.js";
import mongoose from "mongoose";
import * as models from "./models/index.js";
import express from "express";
import { verifyToken, extractTokenFromHeader } from "./utils/auth.js";

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to the database successfully");
  } catch (error) {
    console.error("Failed to connect to the database:", error);
    process.exit(1); // Exit the application with an error code
  }
};

const PORT = process.env.PORT || 3000;

const run = async () => {
  await connectDB();
  await server.start();

  app.use(
    "/graphql",
    cors(),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        // Extract JWT from Authorization header
        const token = extractTokenFromHeader(req.headers.authorization);
        let user = null;

        if (token) {
          const decoded = verifyToken(token);
          if (decoded) {
            user = {
              userId: decoded.userId,
              role: decoded.role,
            };
          }
        }

        return {
          loaders: createLoaders(),
          user,
        };
      },
    }),
  );

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}/graphql`);
  });
};
run();
