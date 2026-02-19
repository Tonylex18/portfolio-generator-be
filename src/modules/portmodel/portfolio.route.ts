import { Router } from "express";
import {
	checkUsernameAvailabilityHandler,
	createPortfolioHandler,
	getPortfolioByUsernameHandler,
	updatePortfolioHandler,
} from "./portfolio.controller";
import { parsePortfolioBody } from "./portfolio.middleware";
import {
	validateCreatePortfolio,
	validateUpdatePortfolio,
	validateUsernameParam,
} from "./portfolio.validation";
import multer from "../../utils/multer/multer";

const router = Router();
const uploadFields = multer.upload.fields([
	{ name: "profileImage", maxCount: 1 },
	{ name: "resume", maxCount: 1 },
	{ name: "projectImages", maxCount: 10 },
]);

router.post(
	"/",
	uploadFields,
	parsePortfolioBody,
	validateCreatePortfolio,
	createPortfolioHandler
);
router.get("/check/:username", validateUsernameParam, checkUsernameAvailabilityHandler);
router.get("/:username", validateUsernameParam, getPortfolioByUsernameHandler);
router.patch(
	"/:username",
	uploadFields,
	parsePortfolioBody,
	validateUsernameParam,
	validateUpdatePortfolio,
	updatePortfolioHandler
);

export default router;
