import pino, { multistream } from "pino";
import pretty from "pino-pretty";
import fs from "fs";
import path from "path";

const prettyStream = pretty({
    colorize: true,
    levelFirst: true,
});

const streams: Array<{ stream: NodeJS.WritableStream; level?: string }> = [{ stream: prettyStream }];

// Only add file stream in non-production environments
if (process.env.NODE_ENV !== "production") {
    const logDir = path.join(process.cwd(), "logs");
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
    const fileStream = fs.createWriteStream(path.join(logDir, "app.log"), { flags: "a" });
    streams.push({ stream: fileStream, level: "error" });
}

export const logger = pino({}, multistream(streams));