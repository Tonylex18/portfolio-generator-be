import type { Types } from "mongoose";
import type { Portfolio } from "../../database/models/portfolio.schema";

export type PortfolioRecord = Portfolio & {
	_id: Types.ObjectId;
	createdAt?: Date;
	updatedAt?: Date;
};

export type PortfolioPublic = {
	id: string;
	fullName: string;
	role: string;
	location: string;
	username: string;
	bio: string;
	primaryFocus: string;
	secondaryFocus: string;
	stack: string;
	tooling: string;
	projects: Portfolio["projects"];
	profileImageUrl?: string;
	resumeUrl?: string;
	github?: string;
	linkedin?: string;
	twitter?: string;
	email?: string;
	views: number;
	createdAt?: Date;
	updatedAt?: Date;
};

const toPortfolioPublic = (record: PortfolioRecord): PortfolioPublic => ({
	id: record._id.toString(),
	fullName: record.fullName,
	role: record.role,
	location: record.location,
	username: record.username,
	bio: record.bio,
	primaryFocus: record.primaryFocus,
	secondaryFocus: record.secondaryFocus,
	stack: record.stack,
	tooling: record.tooling,
	projects: record.projects,
	profileImageUrl: record.profileImageUrl,
	resumeUrl: record.resumeUrl,
	github: record.github,
	linkedin: record.linkedin,
	twitter: record.twitter,
	email: record.email,
	views: record.views,
	createdAt: record.createdAt,
	updatedAt: record.updatedAt,
});

export { toPortfolioPublic };
