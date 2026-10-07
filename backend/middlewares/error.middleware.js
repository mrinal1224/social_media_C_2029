import multer from "multer";

const errorMiddleware = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            const isReel = req.originalUrl?.startsWith("/reel");
            return res.status(400).json({
                message: isReel
                    ? "Video must be 50MB or smaller"
                    : "Image must be 5MB or smaller"
            });
        }

        return res.status(400).json({ message: err.message });
    }

    if (
        err.message === "Only image files are allowed" ||
        err.message === "Only video files are allowed"
    ) {
        return res.status(400).json({ message: err.message });
    }

    console.error(err);

    return res.status(500).json({
        message: "Internal Server Error"
    });
};

export default errorMiddleware;
