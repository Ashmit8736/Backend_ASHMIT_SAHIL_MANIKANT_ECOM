import ImageKit from "imagekit";

const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

export const imagekitAuth = (req, res) => {
    try {
        const authParams = imagekit.getAuthenticationParameters();
        res.json(authParams);
    } catch (err) {
        res.status(500).json({ message: "ImageKit auth failed" });
    }
};
