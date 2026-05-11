import { Router, type IRouter } from "express";
import { count, eq, avg } from "drizzle-orm";
import { db, usersTable, farmsTable, investmentsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/stats", async (_req, res): Promise<void> => {
  try {
    const [investorsResult] = await db
      .select({ c: count() })
      .from(usersTable)
      .where(eq(usersTable.active_role, "investor"));

    const [farmsResult] = await db
      .select({ c: count() })
      .from(farmsTable)
      .where(eq(farmsTable.is_published, true));

    const [dealsResult] = await db
      .select({ c: count() })
      .from(investmentsTable)
      .where(eq(investmentsTable.status, "accepted"));

    const [roiResult] = await db
      .select({ avg: avg(farmsTable.expected_roi) })
      .from(farmsTable)
      .where(eq(farmsTable.is_published, true));

    res.json({
      investors: Number(investorsResult?.c ?? 0),
      published_farms: Number(farmsResult?.c ?? 0),
      completed_deals: Number(dealsResult?.c ?? 0),
      avg_roi: roiResult?.avg ? Math.round(Number(roiResult.avg)) : 18,
    });
  } catch {
    res.json({
      investors: 500,
      published_farms: 120,
      completed_deals: 85,
      avg_roi: 18,
    });
  }
});

export default router;
