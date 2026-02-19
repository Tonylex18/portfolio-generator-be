import { PortfolioModel } from "../../database/models/portfolio.schema";
import type {
	CreatePortfolioInput,
	UpdatePortfolioInput,
} from "./portfolio.validation";
import type { PortfolioRecord } from "./portfolio.types";

type ProjectWithImage = CreatePortfolioInput["projects"][number] & {
	imageUrl?: string;
};

type CreatePortfolioDbInput = Omit<CreatePortfolioInput, "projects"> & {
	projects: ProjectWithImage[];
	username: string;
	views: number;
	profileImageUrl?: string;
	resumeUrl?: string;
};

type UpdatePortfolioDbInput = Omit<UpdatePortfolioInput, "projects"> & {
	projects?: ProjectWithImage[];
	profileImageUrl?: string;
	resumeUrl?: string;
};

const create = async (
	payload: CreatePortfolioDbInput
): Promise<PortfolioRecord> => {
	const doc = await PortfolioModel.create(payload);
	return doc.toObject();
};

const existsByUsername = async (username: string): Promise<boolean> => {
	const existing = await PortfolioModel.exists({ username });
	return Boolean(existing);
};

const findByUsername = async (
	username: string
): Promise<PortfolioRecord | null> =>
	PortfolioModel.findOne({ username }).lean().exec();

const findByUsernameAndIncrementViews = async (
	username: string
): Promise<PortfolioRecord | null> =>
	PortfolioModel.findOneAndUpdate(
		{ username },
		{ $inc: { views: 1 } },
		{ new: true }
	)
		.lean()
		.exec();

const updateByUsername = async (
	username: string,
	updates: UpdatePortfolioDbInput
): Promise<PortfolioRecord | null> =>
	PortfolioModel.findOneAndUpdate(
		{ username },
		{ $set: updates },
		{ new: true, runValidators: true }
	)
		.lean()
		.exec();

export {
	create,
	existsByUsername,
	findByUsername,
	findByUsernameAndIncrementViews,
	updateByUsername,
};
