import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, investmentsTable, farmsTable, notificationsTable, usersTable } from "@workspace/db";
import { protect, type AuthRequest } from "../middlewares/protect";
import {
  CreateInvestmentBody,
  GetMyInvestmentsQueryParams,
  GetFarmInvestmentsParams,
  RespondToInvestmentParams,
  RespondToInvestmentBody,
  CancelInvestmentParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function investmentToResponse(inv: typeof investmentsTable.$inferSelect) {
  const [farm] = await db.select({ name: farmsTable.name }).from(farmsTable).where(eq(farmsTable.id, inv.farm_id));
  const [investor] = await db.select({ full_name: usersTable.full_name }).from(usersTable).where(eq(usersTable.id, inv.investor_id));
  return {
    id: inv.id,
    farm_id: inv.farm_id,
    farm_name: farm?.name ?? null,
    investor_id: inv.investor_id,
    investor_name: investor?.full_name ?? null,
    amount: inv.amount,
    message: inv.message,
    status: inv.status,
    type: inv.type,
    created_at: inv.created_at,
  };
}

async function createNotification(recipientId: number, type: string, investmentId: number, farmId: number) {
  await db.insert(notificationsTable).values({
    recipient_id: recipientId,
    type,
    investment_id: investmentId,
    farm_id: farmId,
    is_read: false,
  });
}

router.post("/investments", protect, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateInvestmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { farm_id, type, amount, message } = parsed.data;

  const [farm] = await db.select().from(farmsTable).where(eq(farmsTable.id, farm_id));
  if (!farm) {
    res.status(404).json({ error: "Farm not found" });
    return;
  }

  if (farm.owner_id === req.userId) {
    res.status(400).json({ error: "You cannot invest in your own farm" });
    return;
  }

  if (!farm.is_published || farm.status !== "available") {
    res.status(400).json({ error: "Farm is not available for investment" });
    return;
  }

  const [investment] = await db.insert(investmentsTable).values({
    farm_id,
    investor_id: req.userId!,
    owner_id: farm.owner_id,
    amount: amount ?? null,
    message: message ?? null,
    status: "pending",
    type,
  }).returning();

  // Increment farm interest_count
  await db.update(farmsTable)
    .set({ interest_count: farm.interest_count + 1 })
    .where(eq(farmsTable.id, farm_id));

  // Notify farm owner
  await createNotification(farm.owner_id, "investment_received", investment.id, farm_id);

  res.status(201).json(await investmentToResponse(investment));
});

router.get("/investments/my", protect, async (req: AuthRequest, res): Promise<void> => {
  const parsed = GetMyInvestmentsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { status, page = 1, limit = 10 } = parsed.data;

  let investments = await db.select().from(investmentsTable)
    .where(eq(investmentsTable.investor_id, req.userId!));

  if (status) investments = investments.filter(i => i.status === status);

  const total = investments.length;
  const skip = (page - 1) * limit;
  const paginated = investments.slice(skip, skip + limit);

  const data = await Promise.all(paginated.map(investmentToResponse));

  res.json({
    data,
    pagination: { total, page, limit, total_pages: Math.ceil(total / limit) },
  });
});

router.get("/investments/farm/:farmId", protect, async (req: AuthRequest, res): Promise<void> => {
  const params = GetFarmInvestmentsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [farm] = await db.select().from(farmsTable).where(eq(farmsTable.id, params.data.farmId));
  if (!farm) {
    res.status(404).json({ error: "Farm not found" });
    return;
  }

  if (farm.owner_id !== req.userId) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  const investments = await db.select().from(investmentsTable)
    .where(eq(investmentsTable.farm_id, params.data.farmId));

  const data = await Promise.all(investments.map(investmentToResponse));

  res.json({
    data,
    pagination: { total: data.length, page: 1, limit: data.length, total_pages: 1 },
  });
});

router.patch("/investments/:investmentId/respond", protect, async (req: AuthRequest, res): Promise<void> => {
  const params = RespondToInvestmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = RespondToInvestmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [investment] = await db.select().from(investmentsTable)
    .where(eq(investmentsTable.id, params.data.investmentId));

  if (!investment) {
    res.status(404).json({ error: "Investment not found" });
    return;
  }

  if (investment.owner_id !== req.userId) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  if (investment.status !== "pending") {
    res.status(400).json({ error: "Can only respond to pending investments" });
    return;
  }

  const { action } = parsed.data;

  const [updated] = await db.update(investmentsTable)
    .set({ status: action })
    .where(eq(investmentsTable.id, params.data.investmentId))
    .returning();

  if (action === "accepted") {
    await db.update(farmsTable)
      .set({ status: "under_negotiation" })
      .where(eq(farmsTable.id, investment.farm_id));
  }

  const notifType = action === "accepted" ? "investment_accepted" : "investment_rejected";
  await createNotification(investment.investor_id, notifType, investment.id, investment.farm_id);

  res.json(await investmentToResponse(updated));
});

router.patch("/investments/:investmentId/cancel", protect, async (req: AuthRequest, res): Promise<void> => {
  const params = CancelInvestmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [investment] = await db.select().from(investmentsTable)
    .where(eq(investmentsTable.id, params.data.investmentId));

  if (!investment) {
    res.status(404).json({ error: "Investment not found" });
    return;
  }

  if (investment.investor_id !== req.userId) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  if (investment.status !== "pending") {
    res.status(400).json({ error: "Can only cancel pending investments" });
    return;
  }

  const [updated] = await db.update(investmentsTable)
    .set({ status: "cancelled" })
    .where(eq(investmentsTable.id, params.data.investmentId))
    .returning();

  await createNotification(investment.owner_id, "investment_cancelled", investment.id, investment.farm_id);

  res.json(await investmentToResponse(updated));
});

export default router;
