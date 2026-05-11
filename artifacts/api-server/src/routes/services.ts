import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, servicesTable, usersTable } from "@workspace/db";
import { protect, type AuthRequest } from "../middlewares/protect";
import { CreateServiceBody, BrowseServicesQueryParams, UpdateServiceParams, UpdateServiceBody, DeleteServiceParams } from "@workspace/api-zod";

const router: IRouter = Router();

async function serviceToResponse(s: typeof servicesTable.$inferSelect) {
  const [provider] = await db.select({ full_name: usersTable.full_name }).from(usersTable)
    .where(eq(usersTable.id, s.provider_id));
  return {
    id: s.id,
    provider_id: s.provider_id,
    provider_name: provider?.full_name ?? null,
    title: s.title,
    description: s.description,
    category: s.category,
    price_per_unit: s.price_per_unit,
    unit: s.unit,
    governorate: s.governorate,
    is_available: s.is_available,
    created_at: s.created_at,
  };
}

router.post("/services", protect, async (req: AuthRequest, res): Promise<void> => {
  const parsed = CreateServiceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Check user has service_provider role
  const userRoles = req.userRoles ?? [];
  if (!userRoles.includes("service_provider")) {
    res.status(403).json({ error: "Only service providers can create service listings" });
    return;
  }

  const { title, description, category, price_per_unit, unit, governorate, is_available } = parsed.data;

  const [service] = await db.insert(servicesTable).values({
    provider_id: req.userId!,
    title,
    description: description ?? null,
    category,
    price_per_unit,
    unit,
    governorate: governorate ?? null,
    is_available: is_available ?? true,
  }).returning();

  res.status(201).json(await serviceToResponse(service));
});

router.get("/services", async (req, res): Promise<void> => {
  const parsed = BrowseServicesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { category, governorate, page = 1, limit = 12 } = parsed.data;

  let services = await db.select().from(servicesTable)
    .where(eq(servicesTable.is_available, true));

  if (category) services = services.filter(s => s.category === category);
  if (governorate) services = services.filter(s => s.governorate === governorate);

  const total = services.length;
  const skip = (page - 1) * limit;
  const paginated = services.slice(skip, skip + limit);

  const data = await Promise.all(paginated.map(serviceToResponse));

  res.json({
    data,
    pagination: { total, page, limit, total_pages: Math.ceil(total / limit) },
  });
});

router.get("/services/my", protect, async (req: AuthRequest, res): Promise<void> => {
  const services = await db.select().from(servicesTable)
    .where(eq(servicesTable.provider_id, req.userId!));

  const data = await Promise.all(services.map(serviceToResponse));

  res.json({
    data,
    pagination: { total: data.length, page: 1, limit: data.length, total_pages: 1 },
  });
});

router.patch("/services/:serviceId", protect, async (req: AuthRequest, res): Promise<void> => {
  const params = UpdateServiceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateServiceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [service] = await db.select().from(servicesTable)
    .where(eq(servicesTable.id, params.data.serviceId));

  if (!service) {
    res.status(404).json({ error: "Service not found" });
    return;
  }

  if (service.provider_id !== req.userId) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  const body = parsed.data;
  const updates: Record<string, unknown> = {};
  if (body.title !== undefined) updates.title = body.title;
  if (body.description !== undefined) updates.description = body.description;
  if (body.category !== undefined) updates.category = body.category;
  if (body.price_per_unit !== undefined) updates.price_per_unit = body.price_per_unit;
  if (body.unit !== undefined) updates.unit = body.unit;
  if (body.governorate !== undefined) updates.governorate = body.governorate;
  if (body.is_available !== undefined) updates.is_available = body.is_available;

  const [updated] = await db.update(servicesTable)
    .set(updates)
    .where(eq(servicesTable.id, params.data.serviceId))
    .returning();

  res.json(await serviceToResponse(updated));
});

router.delete("/services/:serviceId", protect, async (req: AuthRequest, res): Promise<void> => {
  const params = DeleteServiceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [service] = await db.select().from(servicesTable)
    .where(eq(servicesTable.id, params.data.serviceId));

  if (!service) {
    res.status(404).json({ error: "Service not found" });
    return;
  }

  if (service.provider_id !== req.userId) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  await db.delete(servicesTable).where(eq(servicesTable.id, params.data.serviceId));

  res.json({ success: true, message: "Service deleted successfully" });
});

export default router;
