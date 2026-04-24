import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import UserModel, { UserDoc } from "@/model/auth";

declare global {
  namespace Express {
    interface Request {
      user?: UserDoc;
    }
  }
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Access denied. No token provided." });
    return;
  }

  const token = authHeader.split(" ")[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };

  const user = await UserModel.findById(decoded.id);
  if (!user) {
    res.status(401).json({ error: "User no longer exists." });
    return;
  }

  req.user = user;
  next();
};

export const isAdmin: RequestHandler = (req, res, next) => {
  if (req.user?.role !== "admin") {
    res.status(403).json({ error: "Access denied. Admins only." });
    return;
  }
  next();
};
