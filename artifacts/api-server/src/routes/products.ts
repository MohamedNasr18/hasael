import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, productsTable, usersTable } from "@workspace/db";
import { protect, type AuthRequest } from "../middlewares/protect";
import {
  CreateProductBody,
  UpdateProductBody,
  GetProductsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function productToResponse(p: typeof productsTable.$inferSelect) {
  const [owner] = await db
    .select({ full_name: usersTable.full_name, avatar: usersTable.avatar })
    .from(usersTable)
    .where(eq(usersTable.id, p.owner_id));

  return {
    id: p.id,
    owner_id: p.owner_id,
    owner_name: owner?.full_name ?? null,
    owner_avatar: owner?.avatar ?? null,
    title: p.title,
    description: p.description ?? null,
    price: p.price,
    category: p.category,
    quantity: p.quantity,
    images: p.images ?? [],
    is_available: p.is_available,
    created_at: p.created_at,
  };
}

router.get("/products", async (req, res): Promise<void> => {
  const parsed = GetProductsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { search, category, page, limit } = parsed.data;
  const pageNum = page ?? 1;
  const limitNum = limit ?? 12;

  let all = await db.select().from(productsTable);

  if (category) {
    all = all.filter((p) => p.category === category);
  }

  if (search) {
    const q = search.toLowerCase();
    all = all.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q)
    );
  }

  const total = all.length;
  const skip = (pageNum - 1) * limitNum;
  const paginated = all.slice(skip, skip + limitNum);
  const data = await Promise.all(paginated.map(productToResponse));

  res.json({
    data,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      total_pages: Math.ceil(total / limitNum),
    },
  });
});

router.get("/products/my", protect, async (req: AuthRequest, res): Promise<void> => {
  if (!req.userRoles?.includes("user")) {
    res.status(403).json({ error: "Only users with the 'user' role can manage products" });
    return;
  }

  const all = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.owner_id, req.userId!));

  const data = await Promise.all(all.map(productToResponse));

  res.json({
    data,
    pagination: { total: data.length, page: 1, limit: data.length, total_pages: 1 },
  });
});

router.get("/products/:productId", async (req, res): Promise<void> => {
  const productId = parseInt(req.params["productId"] ?? "", 10);
  if (isNaN(productId)) {
    res.status(400).json({ error: "Invalid product id" });
    return;
  }

  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, productId));

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(await productToResponse(product));
});

router.post("/products", protect, async (req: AuthRequest, res): Promise<void> => {
  if (!req.userRoles?.includes("user")) {
    res.status(403).json({ error: "Only users with the 'user' role can create products" });
    return;
  }

  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { title, description, price, category, quantity, images, is_available } = parsed.data;

  const [product] = await db
    .insert(productsTable)
    .values({
      owner_id: req.userId!,
      title,
      description: description ?? null,
      price,
      category,
      quantity,
      images: images ?? [],
      is_available: is_available ?? true,
    })
    .returning();

  res.status(201).json(await productToResponse(product));
});

router.patch("/products/:productId", protect, async (req: AuthRequest, res): Promise<void> => {
  if (!req.userRoles?.includes("user")) {
    res.status(403).json({ error: "Only users with the 'user' role can update products" });
    return;
  }

  const productId = parseInt(String(req.params["productId"] ?? ""), 10);
  if (isNaN(productId)) {
    res.status(400).json({ error: "Invalid product id" });
    return;
  }

  const [existing] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, productId));

  if (!existing) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  if (existing.owner_id !== req.userId) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db
    .update(productsTable)
    .set({ ...parsed.data })
    .where(eq(productsTable.id, productId))
    .returning();

  res.json(await productToResponse(updated));
});

router.delete("/products/:productId", protect, async (req: AuthRequest, res): Promise<void> => {
  if (!req.userRoles?.includes("user")) {
    res.status(403).json({ error: "Only users with the 'user' role can delete products" });
    return;
  }

  const productId = parseInt(String(req.params["productId"] ?? ""), 10);
  if (isNaN(productId)) {
    res.status(400).json({ error: "Invalid product id" });
    return;
  }

  const [existing] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, productId));

  if (!existing) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  if (existing.owner_id !== req.userId) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  await db.delete(productsTable).where(eq(productsTable.id, productId));

  res.json({ success: true, message: "Product deleted" });
});

export default router;
