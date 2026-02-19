import path from 'path';

// Helper function for saving files
const saveFile = (file: any) => {
    const filePath = path.join(__dirname, '../../uploads', file.originalname);
    file.mv(filePath, (err: any) => {
        if (err) {
            throw new Error("File upload failed");
        }
    });
    return filePath;
};

export default saveFile;