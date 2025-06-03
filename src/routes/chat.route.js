import { Router } from "express";
import { getChatById, getUserChats } from "../controllers/chat.controller.js";
import { isAuthenticated } from "../middleware/auth.middleware.js";

const router=Router()

router.get('/', isAuthenticated, getUserChats);
router.get('/:chatId', isAuthenticated, getChatById);
// router.get('/',isAuthenticated,getALlGroups)
export default router