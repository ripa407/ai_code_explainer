import { Router } from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { AuthController } from './auth.controller';
import { loginZodSchema, socialSyncZodSchema, forgotPasswordZodSchema, resetPasswordZodSchema } from './auth.zod';

const router = Router();

router.post('/login', validateRequest(loginZodSchema), AuthController.login);
router.post('/social-sync', validateRequest(socialSyncZodSchema), AuthController.socialSync);
router.post('/forgot-password', validateRequest(forgotPasswordZodSchema), AuthController.forgotPassword);
router.post('/reset-password', validateRequest(resetPasswordZodSchema), AuthController.resetPassword);
router.post('/refresh-token', AuthController.refreshToken);
router.post('/logout', AuthController.logout);

export const authRouter = router;
