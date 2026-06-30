function isKnownError(error) {
    return (error instanceof Error &&
        typeof error.statusCode === "number" &&
        typeof error.code === "string");
}
export function notFoundHandler(req, res) {
    res.status(404).json({
        success: false,
        message: `Route non trouvée : ${req.method} ${req.originalUrl}`,
        code: "ROUTE_NOT_FOUND",
    });
}
export const errorHandler = (error, req, res, next) => {
    if (res.headersSent) {
        next(error);
        return;
    }
    if (isKnownError(error)) {
        res.status(error.statusCode).json({
            success: false,
            message: error.message,
            code: error.code,
        });
        return;
    }
    console.error("❌ Erreur non gérée:", error);
    res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
    });
};
//# sourceMappingURL=error.middleware.js.map