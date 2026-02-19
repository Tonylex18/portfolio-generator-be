import type { Request, Response } from "express";
import { HttpStatusCode } from "../../shared/enums/http-status-code.tnum";
import { portfolioService } from "./portfolio.service";
import type {
	CreatePortfolioInput,
	UpdatePortfolioInput,
	UsernameParamInput,
} from "./portfolio.validation";

const sendSuccess = <T>(
	res: Response,
	statusCode: HttpStatusCode,
	message: string,
	data?: T
) => {
	const payload =
		data === undefined
			? { success: true, message }
			: { success: true, message, data };
	return res.status(statusCode).json(payload);
};

type CreatePortfolioRequest = Request<
	Record<string, never>,
	unknown,
	CreatePortfolioInput
>;

type UpdatePortfolioRequest = Request<
	UsernameParamInput,
	unknown,
	UpdatePortfolioInput
>;

type UsernameRequest = Request<UsernameParamInput>;

type PortfolioFiles = {
	profileImage?: Express.Multer.File[];
	resume?: Express.Multer.File[];
	projectImages?: Express.Multer.File[];
};

const extractFiles = (req: Request) => {
	const files = req.files as PortfolioFiles | undefined;

	return {
		profileImage: files?.profileImage?.[0],
		resume: files?.resume?.[0],
		projectImages: files?.projectImages ?? [],
	};
};

const createPortfolioHandler = async (
	req: CreatePortfolioRequest,
	res: Response
) => {
	const portfolio = await portfolioService.createPortfolio(
		req.body,
		extractFiles(req)
	);

	return sendSuccess(
		res,
		HttpStatusCode.CREATED,
		"Portfolio created successfully.",
		portfolio
	);
};

const getPortfolioByUsernameHandler = async (
	req: UsernameRequest,
	res: Response
) => {
	const portfolio = await portfolioService.getPortfolioByUsername(
		req.params.username
	);

	return sendSuccess(
		res,
		HttpStatusCode.OK,
		"Portfolio retrieved successfully.",
		portfolio
	);
};

const checkUsernameAvailabilityHandler = async (
	req: UsernameRequest,
	res: Response
) => {
	const availability = await portfolioService.checkUsernameAvailability(
		req.params.username
	);

	return sendSuccess(
		res,
		HttpStatusCode.OK,
		"Username availability checked.",
		availability
	);
};

const updatePortfolioHandler = async (
	req: UpdatePortfolioRequest,
	res: Response
) => {
	const portfolio = await portfolioService.updatePortfolio(
		req.params.username,
		req.body,
		extractFiles(req)
	);

	return sendSuccess(
		res,
		HttpStatusCode.OK,
		"Portfolio updated successfully.",
		portfolio
	);
};

export {
	createPortfolioHandler,
	getPortfolioByUsernameHandler,
	checkUsernameAvailabilityHandler,
	updatePortfolioHandler,
};
