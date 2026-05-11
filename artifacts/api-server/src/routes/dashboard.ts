import { Router, type IRouter } from "express";
import { eq, count } from "drizzle-orm";
import { db, farmsTable, investmentsTable, notificationsTable, servicesTable } from "@workspace/db";
import { protect, type AuthRequest } from "../middlewares/protect";

const router: IRouter = Router();

router.get("/dashboard/summary", protect, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.userId!;

  const [farmsResult] = await db.select({ c: count() }).from(farmsTable).where(eq(farmsTable.owner_id, userId));
  const [activeFarmsResult] = await db.select({ c: count() }).from(farmsTable)
    .where(eq(farmsTable.status, "available"));

  const [myInvestmentsResult] = await db.select({ c: count() }).from(investmentsTable)
    .where(eq(investmentsTable.investor_id, userId));
  const [pendingInvestmentsResult] = await db.select({ c: count() }).from(investmentsTable)
    .where(eq(investmentsTable.investor_id, userId));

  const [unreadResult] = await db.select({ c: count() }).from(notificationsTable)
    .where(eq(notificationsTable.recipient_id, userId));

  const [interestResult] = await db.select({ c: count() }).from(investmentsTable)
    .where(eq(investmentsTable.owner_id, userId));

  const [servicesResult] = await db.select({ c: count() }).from(servicesTable)
    .where(eq(servicesTable.provider_id, userId));

  res.json({
    total_farms: Number(farmsResult?.c ?? 0),
    total_investments: Number(myInvestmentsResult?.c ?? 0),
    pending_investments: Number(pendingInvestmentsResult?.c ?? 0),
    active_farms: Number(activeFarmsResult?.c ?? 0),
    unread_notifications: Number(unreadResult?.c ?? 0),
    total_interest_received: Number(interestResult?.c ?? 0),
    total_services: Number(servicesResult?.c ?? 0),
  });
});

export default router;
