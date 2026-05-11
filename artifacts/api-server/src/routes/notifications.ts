import { Router, type IRouter } from "express";
import { eq, desc, count } from "drizzle-orm";
import { db, notificationsTable, farmsTable, investmentsTable, usersTable } from "@workspace/db";
import { protect, type AuthRequest } from "../middlewares/protect";
import { GetMyNotificationsQueryParams, MarkNotificationReadParams } from "@workspace/api-zod";

const router: IRouter = Router();

async function notifToResponse(n: typeof notificationsTable.$inferSelect) {
  let farm_name: string | null = null;
  let investor_name: string | null = null;

  if (n.farm_id) {
    const [farm] = await db.select({ name: farmsTable.name }).from(farmsTable).where(eq(farmsTable.id, n.farm_id));
    farm_name = farm?.name ?? null;
  }

  if (n.investment_id) {
    const [inv] = await db.select({ investor_id: investmentsTable.investor_id }).from(investmentsTable)
      .where(eq(investmentsTable.id, n.investment_id));
    if (inv) {
      const [investor] = await db.select({ full_name: usersTable.full_name }).from(usersTable)
        .where(eq(usersTable.id, inv.investor_id));
      investor_name = investor?.full_name ?? null;
    }
  }

  return {
    id: n.id,
    recipient_id: n.recipient_id,
    type: n.type,
    investment_id: n.investment_id,
    farm_id: n.farm_id,
    farm_name,
    investor_name,
    is_read: n.is_read,
    created_at: n.created_at,
  };
}

router.get("/notifications", protect, async (req: AuthRequest, res): Promise<void> => {
  const parsed = GetMyNotificationsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { page = 1, limit = 20 } = parsed.data;

  const all = await db.select().from(notificationsTable)
    .where(eq(notificationsTable.recipient_id, req.userId!))
    .orderBy(desc(notificationsTable.created_at));

  const unread_count = all.filter(n => !n.is_read).length;
  const total = all.length;
  const skip = (page - 1) * limit;
  const paginated = all.slice(skip, skip + limit);

  const data = await Promise.all(paginated.map(notifToResponse));

  res.json({
    data,
    pagination: { total, page, limit, total_pages: Math.ceil(total / limit) },
    unread_count,
  });
});

router.patch("/notifications/:notificationId/read", protect, async (req: AuthRequest, res): Promise<void> => {
  const params = MarkNotificationReadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [notif] = await db.select().from(notificationsTable)
    .where(eq(notificationsTable.id, params.data.notificationId));

  if (!notif) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }

  if (notif.recipient_id !== req.userId) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  const [updated] = await db.update(notificationsTable)
    .set({ is_read: true })
    .where(eq(notificationsTable.id, params.data.notificationId))
    .returning();

  res.json(await notifToResponse(updated));
});

router.patch("/notifications/read-all", protect, async (req: AuthRequest, res): Promise<void> => {
  await db.update(notificationsTable)
    .set({ is_read: true })
    .where(eq(notificationsTable.recipient_id, req.userId!));

  res.json({ success: true, message: "All notifications marked as read" });
});

export default router;
