import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import charactersRouter from "./characters";
import chatRouter from "./chat";
import usersRouter from "./users";
import paymentsRouter from "./payments";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(charactersRouter);
router.use(chatRouter);
router.use(usersRouter);
router.use(paymentsRouter);

export default router;
