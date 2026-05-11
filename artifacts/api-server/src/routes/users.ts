import { Router, type IRouter } from "express";
import bcrypt from "bcrypt";
import { eq, and } from "drizzle-orm";
import { db, usersTable, farmsTable } from "@workspace/db";
import { protect, type AuthRequest } from "../middlewares/protect";
import { UpdateMeBody, SwitchRoleBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/users/me", protect, async (req: AuthRequest, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    phone: user.phone,
    avatar: user.avatar,
    roles: user.roles,
    active_role: user.active_role,
    created_at: user.created_at,
  });
});

router.patch("/users/me", protect, async (req: AuthRequest, res): Promise<void> => {
  const parsed = UpdateMeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Record<string, unknown> = {};
  const { full_name, phone, avatar, password } = parsed.data;
  if (full_name) updates.full_name = full_name;
  if (phone) updates.phone = phone;
  if (avatar) updates.avatar = avatar;
  if (password) updates.password_hash = await bcrypt.hash(password, 10);

  const [user] = await db.update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, req.userId!))
    .returning();

  res.json({
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    phone: user.phone,
    avatar: user.avatar,
    roles: user.roles,
    active_role: user.active_role,
    created_at: user.created_at,
  });
});

router.patch("/users/me/switch-role", protect, async (req: AuthRequest, res): Promise<void> => {
  const parsed = SwitchRoleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const { role } = parsed.data;
  if (!user.roles.includes(role)) {
    res.status(400).json({ error: "Role not in your account. Add it first." });
    return;
  }

  const [updated] = await db.update(usersTable)
    .set({ active_role: role })
    .where(eq(usersTable.id, req.userId!))
    .returning();

  res.json({
    id: updated.id,
    full_name: updated.full_name,
    email: updated.email,
    phone: updated.phone,
    avatar: updated.avatar,
    roles: updated.roles,
    active_role: updated.active_role,
    created_at: updated.created_at,
  });
});

router.get("/users/:userId/profile", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
  const userId = parseInt(raw, 10);
  if (isNaN(userId)) {
    res.status(400).json({ error: "Invalid user ID" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  // Determine if requester is the owner (check auth header)
  let isOwner = false;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const { verifyToken } = await import("../lib/auth");
      const payload = verifyToken(authHeader.split(" ")[1]);
      isOwner = payload.id === userId;
    } catch {
      // not authenticated — fine, show public farms only
    }
  }

  const farmsQuery = isOwner
    ? db.select().from(farmsTable).where(eq(farmsTable.owner_id, userId))
    : db.select().from(farmsTable).where(and(eq(farmsTable.owner_id, userId), eq(farmsTable.is_published, true)));

  const farms = await farmsQuery;

  res.json({
    id: user.id,
    full_name: user.full_name,
    avatar: user.avatar,
    roles: user.roles,
    farms: farms.map(f => ({
      id: f.id,
      name: f.name,
      crop_type: f.crop_type,
      size_feddan: f.size_feddan,
      location: { governorate: f.governorate, district: f.district, lat: f.lat, lng: f.lng },
      cover_image: f.cover_image,
      investment_terms: { min_investment: f.min_investment, expected_roi: f.expected_roi, duration_months: f.duration_months, profit_split: f.profit_split },
      status: f.status,
      interest_count: f.interest_count,
      owner_name: user.full_name,
    })),
  });
});

export default router;
