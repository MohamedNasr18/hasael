import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import farmsRouter from "./farms";
import feedRouter from "./feed";
import investmentsRouter from "./investments";
import notificationsRouter from "./notifications";
import servicesRouter from "./services";
import dashboardRouter from "./dashboard";
import statsRouter from "./stats";
import uploadRouter from "./upload";
import productsRouter from "./products";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(farmsRouter);
router.use(feedRouter);
router.use(investmentsRouter);
router.use(notificationsRouter);
router.use(servicesRouter);
router.use(dashboardRouter);
router.use(statsRouter);
router.use(uploadRouter);
router.use(productsRouter);

export default router;
