import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import charactersRouter from "./characters";
import chatRouter from "./chat";
import usersRouter from "./users";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(charactersRouter);
router.use(chatRouter);
router.use(usersRouter);

export default router;
