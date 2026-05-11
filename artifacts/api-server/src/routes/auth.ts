import { Router, type IRouter } from "express";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { generateToken } from "../lib/auth";
import { SignUpBody, SignInBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/auth/signup", async (req, res): Promise<void> => {
  const parsed = SignUpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { full_name, email, password, roles, avatar, phone } = parsed.data;

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing.length > 0) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }

  const password_hash = await bcrypt.hash(password, 10);
  const active_role = roles[0];

  const [user] = await db.insert(usersTable).values({
    full_name,
    email,
    password_hash,
    roles: roles as string[],
    active_role,
    avatar: avatar ?? null,
    phone: phone ?? null,
  }).returning();

  const token = generateToken({ id: user.id, email: user.email, roles: user.roles, active_role: user.active_role });

  res.status(201).json({
    user: {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      roles: user.roles,
      active_role: user.active_role,
      created_at: user.created_at,
    },
    token,
  });
});

router.post("/auth/signin", async (req, res): Promise<void> => {
  const parsed = SignInBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = generateToken({ id: user.id, email: user.email, roles: user.roles, active_role: user.active_role });

  res.json({
    user: {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      roles: user.roles,
      active_role: user.active_role,
      created_at: user.created_at,
    },
    token,
  });
});

export default router;
