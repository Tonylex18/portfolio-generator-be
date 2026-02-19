import type { ErrorRequestHandler } from "express";
import createHttpError from "http-errors";
import { HttpStatusCode } from "../../shared/enums/http-status-code.tnum";
import logger from "../logging";

// eslint-disable-next-line
const globalErrorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
	logger.errors.error(err.stack);

	if (createHttpError.isHttpError(err)) {
		return res.status(err.statusCode).json({
			success: false,
			message: err.message,
		});
	}

	const fallbackMessage = "An unexpected error occurred";
	const errorMessage =
		typeof err?.message === "string" && err.message.length > 0
			? err.message
			: fallbackMessage;
	const statusCode =
		typeof (err as { statusCode?: number })?.statusCode === "number"
			? (err as { statusCode: number }).statusCode
			: HttpStatusCode.INTERNAL_SERVER_ERROR;

	return res.status(statusCode).json({
		success: false,
		message: errorMessage,
	});
};

export default globalErrorHandler;
