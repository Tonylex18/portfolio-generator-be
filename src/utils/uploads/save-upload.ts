import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";

const BASE_UPLOAD_DIR = path.join(process.cwd(), "uploads");

const ensureDir = async (dirPath: string) => {
	await fs.mkdir(dirPath, { recursive: true });
};

const sanitizeExtension = (originalName: string) => {
	const ext = path.extname(originalName || "").toLowerCase();
	return ext.length > 0 ? ext : "";
};

const saveUpload = async (
	file: Express.Multer.File,
	folder: string
): Promise<string> => {
	const extension = sanitizeExtension(file.originalname);
	const fileName = `${randomUUID()}${extension}`;
	const targetDir = path.join(BASE_UPLOAD_DIR, folder);
	const targetPath = path.join(targetDir, fileName);

	await ensureDir(targetDir);
	await fs.writeFile(targetPath, file.buffer);

	return `/uploads/${folder}/${fileName}`;
};

export { saveUpload };
