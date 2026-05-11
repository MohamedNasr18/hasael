import { Router, type IRouter } from "express";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { db, farmsTable, usersTable } from "@workspace/db";
import { GetFeedQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/feed", async (req, res): Promise<void> => {
  const parsed = GetFeedQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { governorate, crop_type, min_size_feddan, max_size_feddan, page = 1, limit = 12 } = parsed.data;

  let farms = await db
    .select({
      farm: farmsTable,
      owner_name: usersTable.full_name,
    })
    .from(farmsTable)
    .leftJoin(usersTable, eq(farmsTable.owner_id, usersTable.id))
    .where(and(eq(farmsTable.is_published, true), eq(farmsTable.status, "available")))
    .orderBy(desc(farmsTable.published_at));

  // Filter in memory for flexibility
  if (governorate) farms = farms.filter(r => r.farm.governorate === governorate);
  if (crop_type) farms = farms.filter(r => r.farm.crop_type === crop_type);
  if (min_size_feddan !== undefined) farms = farms.filter(r => r.farm.size_feddan >= min_size_feddan);
  if (max_size_feddan !== undefined) farms = farms.filter(r => r.farm.size_feddan <= max_size_feddan);

  const total = farms.length;
  const skip = (page - 1) * limit;
  const paginated = farms.slice(skip, skip + limit);

  // Increment views_count in bulk (fire and forget)
  const ids = paginated.map(r => r.farm.id);
  if (ids.length > 0) {
    Promise.all(
      ids.map(id =>
        db.update(farmsTable)
          .set({ views_count: farmsTable.views_count })
          .where(eq(farmsTable.id, id))
      )
    ).catch(() => {});
  }

  res.json({
    data: paginated.map(({ farm: f, owner_name }) => ({
      id: f.id,
      name: f.name,
      crop_type: f.crop_type,
      size_feddan: f.size_feddan,
      location: { governorate: f.governorate, district: f.district, lat: f.lat, lng: f.lng },
      cover_image: f.cover_image,
      investment_terms: {
        min_investment: f.min_investment,
        expected_roi: f.expected_roi,
        duration_months: f.duration_months,
        profit_split: f.profit_split,
      },
      status: f.status,
      interest_count: f.interest_count,
      owner_name: owner_name ?? null,
    })),
    pagination: {
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    },
  });
});

export default router;
