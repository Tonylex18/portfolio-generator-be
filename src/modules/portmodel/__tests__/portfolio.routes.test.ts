import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../portfolio.service", () => ({
	portfolioService: {
		createPortfolio: vi.fn(),
		getPortfolioByUsername: vi.fn(),
		checkUsernameAvailability: vi.fn(),
		updatePortfolio: vi.fn(),
	},
}));

import express from "express";
import request from "supertest";
import "express-async-errors";
import portfolioRoutes from "../portfolio.route";
import globalErrorHandler from "../../../utils/global-errors/global-error.handler";
import { portfolioService } from "../portfolio.service";

const mockedService = vi.mocked(portfolioService);

const buildApp = () => {
	const app = express();
	app.use(express.json());
	app.use("/api/v1/portfolios", portfolioRoutes);
	app.use(globalErrorHandler);
	return app;
};

const validPayload = {
	fullName: "Ada Lovelace",
	role: "Backend Engineer",
	location: "London",
	username: "ada",
	bio: "Backend engineer focused on API design.",
	primaryFocus: "APIs",
	secondaryFocus: "Infrastructure",
	stack: "Node.js, TypeScript, MongoDB",
	tooling: "Docker, GitHub Actions",
	projects: [
		{
			projectName: "One-Click Portfolio",
			projectUrl: "https://example.com",
			description: "Instant portfolio generator.",
		},
	],
	github: "https://github.com/ada",
	linkedin: "https://linkedin.com/in/ada",
	twitter: "https://twitter.com/ada",
	email: "ada@example.com",
};

describe("portfolio.routes", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("creates a portfolio", async () => {
		mockedService.createPortfolio.mockResolvedValueOnce({
			id: "abc",
			...validPayload,
			views: 0,
		});

		const app = buildApp();
		const response = await request(app)
			.post("/api/v1/portfolios")
			.send(validPayload);

		expect(response.status).toBe(201);
		expect(response.body.success).toBe(true);
		expect(response.body.data.username).toBe("ada");
	});

	it("returns validation error for invalid payload", async () => {
		const app = buildApp();
		const response = await request(app)
			.post("/api/v1/portfolios")
			.send({ fullName: "Ada" });

		expect(response.status).toBe(400);
		expect(response.body.success).toBe(false);
	});

	it("returns portfolio by username", async () => {
		mockedService.getPortfolioByUsername.mockResolvedValueOnce({
			id: "abc",
			...validPayload,
			views: 1,
		});

		const app = buildApp();
		const response = await request(app).get("/api/v1/portfolios/ada");

		expect(response.status).toBe(200);
		expect(response.body.data.username).toBe("ada");
	});

	it("checks username availability", async () => {
		mockedService.checkUsernameAvailability.mockResolvedValueOnce({
			available: true,
		});

		const app = buildApp();
		const response = await request(app).get(
			"/api/v1/portfolios/check/ada"
		);

		expect(response.status).toBe(200);
		expect(response.body.data.available).toBe(true);
	});

	it("updates a portfolio", async () => {
		mockedService.updatePortfolio.mockResolvedValueOnce({
			id: "abc",
			...validPayload,
			role: "Senior Backend Engineer",
			views: 2,
		});

		const app = buildApp();
		const response = await request(app)
			.patch("/api/v1/portfolios/ada")
			.send({ role: "Senior Backend Engineer" });

		expect(response.status).toBe(200);
		expect(response.body.data.role).toBe("Senior Backend Engineer");
	});

	it("validates username params", async () => {
		const app = buildApp();
		const response = await request(app).get("/api/v1/portfolios/@@");

		expect(response.status).toBe(400);
		expect(response.body.success).toBe(false);
	});
});
