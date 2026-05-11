import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, farmsTable } from "@workspace/db";
import { protect, type AuthRequest } from "../middlewares/protect";
import { CreateFarmBody, UpdateFarmBody, GetMyFarmsQueryParams, GetFarmParams, UpdateFarmParams, DeleteFarmParams } from "@workspace/api-zod";

const router: IRouter = Router();

function farmToResponse(f: typeof farmsTable.$inferSelect, ownerName?: string | null) {
  return {
    id: f.id,
    owner_id: f.owner_id,
    owner_name: ownerName ?? null,
    name: f.name,
    description: f.description,
    crop_type: f.crop_type,
    size_feddan: f.size_feddan,
    location: { governorate: f.governorate, district: f.district, lat: f.lat, lng: f.lng },
    cover_image: f.cover_image,
    images: f.images,
    investment_terms: {
      min_investment: f.min_investment,
      expected_roi: f.expected_roi,
      duration_months: f.duration_months,
      profit_split: f.profit_split,
    },
    is_published: f.is_published,
    published_at: f.published_at ? f.published_at.toISOString() : null,
    status: f.status,
    views_count: f.views_count,
    interest_count: f.interest_count,
    created_at: f.created_at,
  };
}

router.post("/farms", protect, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateFarmBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, description, crop_type, size_feddan, location, cover_image, images, investment_terms, is_published } = parsed.data;

  const now = new Date();
  const published_at = is_published ? now : null;

  const [farm] = await db.insert(farmsTable).values({
    owner_id: req.userId!,
    name,
    description: description ?? null,
    crop_type,
    size_feddan,
    governorate: location.governorate,
    district: location.district ?? null,
    lat: location.lat ?? null,
    lng: location.lng ?? null,
    cover_image: cover_image ?? null,
    images: images ?? [],
    min_investment: investment_terms.min_investment,
    expected_roi: investment_terms.expected_roi,
    duration_months: investment_terms.duration_months,
    profit_split: investment_terms.profit_split ?? 50,
    is_published: is_published ?? false,
    published_at,
    status: "available",
  }).returning();

  res.status(201).json(farmToResponse(farm));
});

router.get("/farms/my", protect, async (req: AuthRequest, res): Promise<void> => {
  const parsed = GetMyFarmsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { status, crop_type, is_published, page = 1, limit = 10 } = parsed.data;

  const allFarms = await db.select().from(farmsTable).where(eq(farmsTable.owner_id, req.userId!));

  const filtered = allFarms.filter(f => {
    if (status && f.status !== status) return false;
    if (crop_type && f.crop_type !== crop_type) return false;
    if (is_published !== undefined && f.is_published !== is_published) return false;
    return true;
  });

  const total = filtered.length;
  const skip = (page - 1) * limit;
  const data = filtered.slice(skip, skip + limit);

  res.json({
    data: data.map(f => farmToResponse(f)),
    pagination: {
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    },
  });
});

router.get("/farms/:farmId", async (req, res): Promise<void> => {
  const params = GetFarmParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [farm] = await db.select().from(farmsTable).where(eq(farmsTable.id, params.data.farmId));
  if (!farm) {
    res.status(404).json({ error: "Farm not found" });
    return;
  }

  res.json(farmToResponse(farm));
});

router.patch("/farms/:farmId", protect, async (req: AuthRequest, res): Promise<void> => {
  const params = UpdateFarmParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateFarmBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
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

  if (["funded", "closed"].includes(farm.status)) {
    res.status(400).json({ error: `Farm with status "${farm.status}" cannot be edited` });
    return;
  }

  const body = parsed.data;
  const updates: Record<string, unknown> = {};

  if (body.name !== undefined) updates.name = body.name;
  if (body.description !== undefined) updates.description = body.description;
  if (body.crop_type !== undefined) updates.crop_type = body.crop_type;
  if (body.size_feddan !== undefined) updates.size_feddan = body.size_feddan;
  if (body.cover_image !== undefined) updates.cover_image = body.cover_image;
  if (body.images !== undefined) updates.images = body.images;
  if (body.status !== undefined) updates.status = body.status;

  if (body.location) {
    if (body.location.governorate !== undefined) updates.governorate = body.location.governorate;
    if (body.location.district !== undefined) updates.district = body.location.district;
    if (body.location.lat !== undefined) updates.lat = body.location.lat;
    if (body.location.lng !== undefined) updates.lng = body.location.lng;
  }

  if (body.investment_terms) {
    if (body.investment_terms.min_investment !== undefined) updates.min_investment = body.investment_terms.min_investment;
    if (body.investment_terms.expected_roi !== undefined) updates.expected_roi = body.investment_terms.expected_roi;
    if (body.investment_terms.duration_months !== undefined) updates.duration_months = body.investment_terms.duration_months;
    if (body.investment_terms.profit_split !== undefined) updates.profit_split = body.investment_terms.profit_split;
  }

  if (body.is_published !== undefined) {
    updates.is_published = body.is_published;
    if (body.is_published && !farm.published_at) {
      updates.published_at = new Date();
    }
  }

  const [updated] = await db.update(farmsTable)
    .set(updates)
    .where(eq(farmsTable.id, params.data.farmId))
    .returning();

  res.json(farmToResponse(updated));
});

router.delete("/farms/:farmId", protect, async (req: AuthRequest, res): Promise<void> => {
  const params = DeleteFarmParams.safeParse(req.params);
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

  if (["under_negotiation", "funded"].includes(farm.status)) {
    res.status(400).json({ error: `Cannot delete a farm that is currently "${farm.status}"` });
    return;
  }

  await db.delete(farmsTable).where(eq(farmsTable.id, params.data.farmId));

  res.json({ success: true, message: "Farm deleted successfully" });
});

export default router;
