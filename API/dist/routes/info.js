export async function infoRoutes(app) {
    app.get("/info", async () => ({
        name: "Einstore API",
        version: "1.0.0",
    }));
}
