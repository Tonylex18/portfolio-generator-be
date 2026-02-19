import type { RequestHandler } from "express";
import createHttpError from "http-errors";
import { HttpStatusCode } from "../../shared/enums/http-status-code.tnum";

const parseProjectsField = (value: unknown) => {
	if (value === undefined || value === null || value === "") {
		return undefined;
	}

	if (Array.isArray(value)) {
		return value;
	}

	if (typeof value === "string") {
		try {
			const parsed = JSON.parse(value) as unknown;
			if (!Array.isArray(parsed)) {
				throw new Error("Projects must be an array");
			}
			return parsed;
		} catch {
			throw createHttpError(
				HttpStatusCode.BAD_REQUEST,
				"Projects must be a valid JSON array"
			);
		}
	}

	throw createHttpError(
		HttpStatusCode.BAD_REQUEST,
		"Projects must be a valid array"
	);
};

const parsePortfolioBody: RequestHandler = (req, _res, next) => {
	try {
		if (req.body && "projects" in req.body) {
			const parsed = parseProjectsField(req.body.projects);
			if (parsed) {
				req.body.projects = parsed;
			}
		}

		return next();
	} catch (error) {
		return next(error);
	}
};

export { parsePortfolioBody };
