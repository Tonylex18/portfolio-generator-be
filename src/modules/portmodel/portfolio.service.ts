import createHttpError from "http-errors";
import { HttpStatusCode } from "../../shared/enums/http-status-code.tnum";
import logger from "../../utils/logging";
import { saveUpload } from "../../utils/uploads/save-upload";
import type {
	CreatePortfolioInput,
	UpdatePortfolioInput,
} from "./portfolio.validation";
import {
	create,
	existsByUsername,
	findByUsername,
	findByUsernameAndIncrementViews,
	updateByUsername,
} from "./portfolio.repository";
import { toPortfolioPublic, type PortfolioPublic } from "./portfolio.types";

const DUPLICATE_KEY_CODE = 11000;

type DuplicateKeyError = { code?: number };

type PortfolioRepository = {
	create: typeof create;
	existsByUsername: typeof existsByUsername;
	findByUsername: typeof findByUsername;
	findByUsernameAndIncrementViews: typeof findByUsernameAndIncrementViews;
	updateByUsername: typeof updateByUsername;
};

type GeneralLogger = {
	info: (message: string) => void;
	debug?: (message: string) => void;
};

type ViewTracker = {
	track: (username: string) => void;
};

type PortfolioUploadFiles = {
	profileImage?: Express.Multer.File;
	resume?: Express.Multer.File;
	projectImages?: Express.Multer.File[];
};

type ProjectWithImage = CreatePortfolioInput["projects"][number] & {
	imageUrl?: string;
};

const normalizeUsername = (username: string) => username.trim().toLowerCase();

const isDuplicateKeyError = (error: unknown): error is DuplicateKeyError =>
	typeof error === "object" &&
	error !== null &&
	"code" in error &&
	(error as DuplicateKeyError).code === DUPLICATE_KEY_CODE;

const handleMongoError = (error: unknown): never => {
	if (isDuplicateKeyError(error)) {
		throw createHttpError(
			HttpStatusCode.CONFLICT,
			"Username is already taken"
		);
	}

	throw error;
};

const buildPortfolioService = (
	repository: PortfolioRepository,
	log: GeneralLogger = logger.general,
	viewTracker?: ViewTracker
) => {
	const saveProjectImages = async (
		files: Express.Multer.File[] | undefined,
		count: number
	): Promise<(string | undefined)[]> => {
		if (!files || files.length === 0) {
			return Array.from({ length: count }, () => undefined);
		}

		const limited = files.slice(0, count);
		const urls = await Promise.all(
			limited.map((file) => saveUpload(file, "projects"))
		);

		return Array.from({ length: count }, (_, index) => urls[index]);
	};

	const createPortfolio = async (
		payload: CreatePortfolioInput,
		files?: PortfolioUploadFiles
	): Promise<PortfolioPublic> => {
		const normalizedUsername = normalizeUsername(payload.username);

		try {
			const profileImageUrl = files?.profileImage
				? await saveUpload(files.profileImage, "profiles")
				: undefined;
			const resumeUrl = files?.resume
				? await saveUpload(files.resume, "resumes")
				: undefined;
			const projectImageUrls = await saveProjectImages(
				files?.projectImages,
				payload.projects.length
			);

			const projects = payload.projects.map((project, index) => ({
				...project,
				imageUrl: projectImageUrls[index],
			}));

			const record = await repository.create({
				...payload,
				projects,
				username: normalizedUsername,
				views: 0,
				profileImageUrl,
				resumeUrl,
			});

			log.info(`Portfolio created for ${normalizedUsername}.`);

			return toPortfolioPublic(record);
		} catch (error) {
			return handleMongoError(error);
		}
	};

	const getPortfolioByUsername = async (
		username: string
	): Promise<PortfolioPublic> => {
		const normalizedUsername = normalizeUsername(username);

		const portfolio = viewTracker
			? await repository.findByUsername(normalizedUsername)
			: await repository.findByUsernameAndIncrementViews(normalizedUsername);

		if (!portfolio) {
			throw createHttpError(HttpStatusCode.NOT_FOUND, "Portfolio not found");
		}

		if (viewTracker) {
			viewTracker.track(normalizedUsername);
		} else {
			log.debug?.(`Portfolio viewed for ${normalizedUsername}.`);
		}

		return toPortfolioPublic(portfolio);
	};

	const checkUsernameAvailability = async (
		username: string
	): Promise<{ available: boolean }> => {
		const normalizedUsername = normalizeUsername(username);
		const existing = await repository.existsByUsername(normalizedUsername);

		return { available: !existing };
	};

	const updatePortfolio = async (
		username: string,
		payload: UpdatePortfolioInput,
		files?: PortfolioUploadFiles
	): Promise<PortfolioPublic> => {
		const normalizedUsername = normalizeUsername(username);
		const updates: UpdatePortfolioInput = payload.username
			? { ...payload, username: normalizeUsername(payload.username) }
			: payload;

		try {
			if (files?.projectImages && !updates.projects) {
				throw createHttpError(
					HttpStatusCode.BAD_REQUEST,
					"Project images require corresponding project data."
				);
			}

			const profileImageUrl = files?.profileImage
				? await saveUpload(files.profileImage, "profiles")
				: undefined;
			const resumeUrl = files?.resume
				? await saveUpload(files.resume, "resumes")
				: undefined;

			const projects: ProjectWithImage[] | undefined = updates.projects
				? updates.projects.map((project) => ({ ...project }))
				: undefined;

			if (projects) {
				const projectImageUrls = await saveProjectImages(
					files?.projectImages,
					projects.length
				);
				projects.forEach((project, index) => {
					if (projectImageUrls[index]) {
						project.imageUrl = projectImageUrls[index];
					}
				});
			}

			const updatePayload: typeof updates & {
				projects?: typeof projects;
				profileImageUrl?: string;
				resumeUrl?: string;
			} = { ...updates };

			if (projects) {
				updatePayload.projects = projects;
			}

			if (profileImageUrl) {
				updatePayload.profileImageUrl = profileImageUrl;
			}

			if (resumeUrl) {
				updatePayload.resumeUrl = resumeUrl;
			}

			const updated = await repository.updateByUsername(
				normalizedUsername,
				updatePayload
			);

			if (!updated) {
				throw createHttpError(HttpStatusCode.NOT_FOUND, "Portfolio not found");
			}

			log.info(`Portfolio updated for ${normalizedUsername}.`);

			return toPortfolioPublic(updated);
		} catch (error) {
			return handleMongoError(error);
		}
	};

	return {
		createPortfolio,
		getPortfolioByUsername,
		checkUsernameAvailability,
		updatePortfolio,
	};
};

const portfolioService = buildPortfolioService({
	create,
	existsByUsername,
	findByUsername,
	findByUsernameAndIncrementViews,
	updateByUsername,
});

export { buildPortfolioService, portfolioService };
