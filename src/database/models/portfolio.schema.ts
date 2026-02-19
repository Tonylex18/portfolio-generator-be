import mongoose, { Schema, type Model } from "mongoose";

export interface Project {
	projectName: string;
	projectUrl: string;
	description: string;
	imageUrl?: string;
}

export interface Portfolio {
	fullName: string;
	role: string;
	location: string;
	username: string;
	bio: string;
	primaryFocus: string;
	secondaryFocus: string;
	stack: string;
	tooling: string;
	projects: Project[];
	profileImageUrl?: string;
	resumeUrl?: string;
	github?: string;
	linkedin?: string;
	twitter?: string;
	email?: string;
	views: number;
	createdAt?: Date;
	updatedAt?: Date;
}

const projectSchema = new Schema<Project>(
	{
		projectName: { type: String, required: true, trim: true },
		projectUrl: { type: String, required: true, trim: true },
		description: { type: String, required: true, trim: true },
		imageUrl: { type: String, trim: true },
	},
	{ _id: false }
);

const portfolioSchema = new Schema<Portfolio>(
	{
		fullName: { type: String, required: true, trim: true },
		role: { type: String, required: true, trim: true },
		location: { type: String, required: true, trim: true },
		username: {
			type: String,
			required: true,
			unique: true,
			index: true,
			trim: true,
			lowercase: true,
		},
		bio: { type: String, required: true, trim: true },
		primaryFocus: { type: String, required: true, trim: true },
		secondaryFocus: { type: String, required: true, trim: true },
		stack: { type: String, required: true, trim: true },
		tooling: { type: String, required: true, trim: true },
		projects: { type: [projectSchema], required: true, default: [] },
		profileImageUrl: { type: String, trim: true },
		resumeUrl: { type: String, trim: true },
		github: { type: String, trim: true },
		linkedin: { type: String, trim: true },
		twitter: { type: String, trim: true },
		email: { type: String, trim: true, lowercase: true },
		views: { type: Number, default: 0 },
	},
	{ timestamps: true, versionKey: false }
);

export type PortfolioDocument = mongoose.HydratedDocument<Portfolio>;

const PortfolioModel =
	(mongoose.models.Portfolio as Model<Portfolio> | undefined) ??
	mongoose.model<Portfolio>("Portfolio", portfolioSchema);

export { PortfolioModel };
