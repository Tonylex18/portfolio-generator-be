import type { RequestHandler } from "express";
import createHttpError from "http-errors";
import { z } from "zod";
import { HttpStatusCode } from "../../shared/enums/http-status-code.tnum";

const usernameSchema = z
	.string()
	.trim()
	.min(3, "Username must be at least 3 characters")
	.max(50, "Username must be at most 50 characters")
	.regex(
		/^[a-z0-9][a-z0-9._-]*$/i,
		"Username may contain letters, numbers, dots, underscores, and hyphens"
	)
	.transform((value) => value.toLowerCase());

const projectSchema = z.object({
	projectName: z.string().trim().min(1, "Project name is required"),
	projectUrl: z
		.string()
		.trim()
		.url("Project URL must be a valid URL"),
	description: z.string().trim().min(1, "Project description is required"),
});

const createPortfolioSchema = z
	.object({
		fullName: z.string().trim().min(2, "Full name is required"),
		role: z.string().trim().min(2, "Role is required"),
		location: z.string().trim().min(2, "Location is required"),
		username: usernameSchema,
		bio: z.string().trim().min(1, "Bio is required"),
		primaryFocus: z.string().trim().min(1, "Primary focus is required"),
		secondaryFocus: z.string().trim().min(1, "Secondary focus is required"),
		stack: z.string().trim().min(1, "Stack is required"),
		tooling: z.string().trim().min(1, "Tooling is required"),
		projects: z.array(projectSchema).min(1, "At least one project is required"),
		github: z.string().trim().url("GitHub must be a valid URL").optional(),
		linkedin: z.string().trim().url("LinkedIn must be a valid URL").optional(),
		twitter: z.string().trim().url("Twitter must be a valid URL").optional(),
		email: z.string().trim().email("Email must be a valid email").optional(),
	})
	.strict();

const updatePortfolioSchema = createPortfolioSchema
	.partial()
	.refine((data) => Object.keys(data).length > 0, {
		message: "At least one field must be provided",
	});

const usernameParamSchema = z.object({
	username: usernameSchema,
});

type CreatePortfolioInput = z.infer<typeof createPortfolioSchema>;
type UpdatePortfolioInput = z.infer<typeof updatePortfolioSchema>;
type UsernameParamInput = z.infer<typeof usernameParamSchema>;

type ValidationTarget = "body" | "params";

const validate =
	(schema: z.ZodTypeAny, target: ValidationTarget): RequestHandler =>
	(req, _res, next) => {
		const result = schema.safeParse(req[target]);

		if (!result.success) {
			const message = result.error.issues
				.map((issue) => issue.message)
				.join(", ");
			return next(createHttpError(HttpStatusCode.BAD_REQUEST, message));
		}

		req[target] = result.data;
		return next();
	};

const validateCreatePortfolio = validate(createPortfolioSchema, "body");
const validateUpdatePortfolio = validate(updatePortfolioSchema, "body");
const validateUsernameParam = validate(usernameParamSchema, "params");

export {
	createPortfolioSchema,
	updatePortfolioSchema,
	usernameParamSchema,
	validateCreatePortfolio,
	validateUpdatePortfolio,
	validateUsernameParam,
	type CreatePortfolioInput,
	type UpdatePortfolioInput,
	type UsernameParamInput,
};
