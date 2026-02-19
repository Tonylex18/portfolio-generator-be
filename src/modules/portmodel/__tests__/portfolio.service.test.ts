import { describe, it, expect, vi, beforeEach } from "vitest";
import { Types } from "mongoose";
import { buildPortfolioService } from "../portfolio.service";
import type { PortfolioRecord } from "../portfolio.types";
import type {
	CreatePortfolioInput,
	UpdatePortfolioInput,
} from "../portfolio.validation";

const buildRecord = (overrides: Partial<PortfolioRecord> = {}): PortfolioRecord => ({
	_id: new Types.ObjectId(),
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
	views: 1,
	createdAt: new Date("2026-02-17T10:00:00.000Z"),
	updatedAt: new Date("2026-02-17T10:00:00.000Z"),
	...overrides,
});

describe("portfolio.service", () => {
	const repository = {
		create: vi.fn(),
		existsByUsername: vi.fn(),
		findByUsername: vi.fn(),
		findByUsernameAndIncrementViews: vi.fn(),
		updateByUsername: vi.fn(),
	};
	const log = { info: vi.fn(), debug: vi.fn() };
	const service = buildPortfolioService(repository, log);

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("creates a portfolio with normalized username", async () => {
		const payload: CreatePortfolioInput = {
			fullName: "Ada Lovelace",
			role: "Backend Engineer",
			location: "London",
			username: "Ada",
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
		const record = buildRecord({ username: "ada", views: 0 });
		repository.create.mockResolvedValueOnce(record);

		const result = await service.createPortfolio(payload);

		expect(repository.create).toHaveBeenCalledWith({
			...payload,
			username: "ada",
			views: 0,
		});
		expect(result.username).toBe("ada");
		expect(result.id).toBe(record._id.toString());
	});

	it("maps duplicate username to conflict error", async () => {
		const payload: CreatePortfolioInput = {
			fullName: "Ada Lovelace",
			role: "Backend Engineer",
			location: "London",
			username: "Ada",
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
		};
		repository.create.mockRejectedValueOnce({ code: 11000 });

		await expect(service.createPortfolio(payload)).rejects.toMatchObject({
			statusCode: 409,
		});
	});

	it("returns portfolio and increments views atomically", async () => {
		const record = buildRecord({ username: "ada", views: 2 });
		repository.findByUsernameAndIncrementViews.mockResolvedValueOnce(record);

		const result = await service.getPortfolioByUsername("Ada");

		expect(repository.findByUsernameAndIncrementViews).toHaveBeenCalledWith(
			"ada"
		);
		expect(result.views).toBe(2);
	});

	it("tracks views using aggregator when provided", async () => {
		const record = buildRecord({ username: "ada", views: 2 });
		repository.findByUsername.mockResolvedValueOnce(record);
		const viewTracker = { track: vi.fn() };
		const customService = buildPortfolioService(repository, log, viewTracker);

		const result = await customService.getPortfolioByUsername("Ada");

		expect(repository.findByUsername).toHaveBeenCalledWith("ada");
		expect(viewTracker.track).toHaveBeenCalledWith("ada");
		expect(result.username).toBe("ada");
	});

	it("throws not found when portfolio does not exist", async () => {
		repository.findByUsernameAndIncrementViews.mockResolvedValueOnce(null);

		await expect(service.getPortfolioByUsername("missing")).rejects.toMatchObject({
			statusCode: 404,
		});
	});

	it("checks username availability", async () => {
		repository.existsByUsername.mockResolvedValueOnce(false);

		const result = await service.checkUsernameAvailability("Ada");

		expect(repository.existsByUsername).toHaveBeenCalledWith("ada");
		expect(result.available).toBe(true);
	});

	it("updates portfolio and normalizes username changes", async () => {
		const payload: UpdatePortfolioInput = { username: "Ada.New" };
		const record = buildRecord({ username: "ada.new" });
		repository.updateByUsername.mockResolvedValueOnce(record);

		const result = await service.updatePortfolio("Ada", payload);

		expect(repository.updateByUsername).toHaveBeenCalledWith("ada", {
			username: "ada.new",
		});
		expect(result.username).toBe("ada.new");
	});

	it("throws not found on update when missing", async () => {
		repository.updateByUsername.mockResolvedValueOnce(null);

		await expect(
			service.updatePortfolio("missing", { role: "Engineer" })
		).rejects.toMatchObject({ statusCode: 404 });
	});

	it("maps duplicate username on update", async () => {
		repository.updateByUsername.mockRejectedValueOnce({ code: 11000 });

		await expect(
			service.updatePortfolio("ada", { username: "someone" })
		).rejects.toMatchObject({ statusCode: 409 });
	});
});
