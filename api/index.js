import { createApp } from "../backend/src/app.js";
import { validateProductionConfig } from "../backend/src/config.js";

validateProductionConfig();

let app = null;

export default async function handler(req, res) {
    if (!app) {
        console.log("[MAMA TIME] Initializing Express application...");
        app = await createApp();
    }

    return app(req, res);
}