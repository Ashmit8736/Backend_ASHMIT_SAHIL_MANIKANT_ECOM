import dotenv from "dotenv";
import ImageKit from "imagekit";
import sharp from "sharp";

dotenv.config();

const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

async function uploadImage(file) {
    try {

        if (!file) throw new Error("No file provided");

        // allow jpg / jpeg / png
        const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
        if (!allowedTypes.includes(file.mimetype)) {
            throw new Error("Only JPG and PNG formats are allowed");
        }

        // resize + compress
        const compressedBuffer = await sharp(file.buffer)
            .resize({ width: 1500, withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toBuffer();

        // reliable unique file name
        const fileName = "product_" + Date.now() + ".jpg";

        // upload file to imagekit
        const uploaded = await imagekit.upload({
            file: compressedBuffer,
            fileName: fileName,
            folder: "/products",
        });

        // create optimized URL (400x300)
        const optimized_url = imagekit.url({
            path: uploaded.filePath,
            transformation: [
                {
                    width: 400,
                    height: 300,
                    crop: "maintain_ratio",
                }
            ]
        });

        // return final data
        return {
            success: true,
            optimized_url,
            original_url: uploaded.url,
            fileId: uploaded.fileId,
        };

    } catch (error) {
        console.error("Image upload failed:", error);
        return {
            success: false,
            message: error.message,
        };
    }
}

export { uploadImage };
