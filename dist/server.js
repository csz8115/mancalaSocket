"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// server.js (or server.ts if you want to use TypeScript)
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const db_1 = __importDefault(require("./lib/db")); // Make sure these paths are correct and compatible
const logger_1 = require("./lib/logger");
const game_logic_1 = require("./lib/game-logic");
const port = process.env.PORT || 3001;
const httpServer = (0, http_1.createServer)();
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});
io.on("connection", (socket) => {
    logger_1.logger.info("User connected");
    socket.on("disconnect", () => logger_1.logger.info("User disconnected"));
    socket.on("hello", () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const messages = yield db_1.default.getMessages();
            socket.emit("hello", { messages });
        }
        catch (error) {
            logger_1.logger.error("Error retrieving messages:", error);
            socket.emit("error", { message: "Failed to retrieve messages" });
        }
    }));
    socket.on("message", (data) => __awaiter(void 0, void 0, void 0, function* () { return io.emit("message", data); }));
    socket.on("create-room", (lobbyName) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            socket.join(lobbyName);
            const game = yield db_1.default.getGameByLobbyName(lobbyName);
            io.to(lobbyName).emit("game-start", game);
            logger_1.logger.info(`User created room: ${lobbyName}`);
        }
        catch (error) {
            logger_1.logger.error("Error creating room:", error);
            socket.emit("error", { message: "Failed to create room" });
        }
    }));
    socket.on("join-room", (lobbyName) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            socket.join(lobbyName);
            const game = yield db_1.default.getGameByLobbyName(lobbyName);
            io.to(lobbyName).emit("game-start", game);
            logger_1.logger.info(`User joined room: ${lobbyName}`);
        }
        catch (error) {
            logger_1.logger.error("Error joining room:", error);
            socket.emit("error", { message: "Failed to join room" });
        }
    }));
    socket.on("leave-room", (lobbyName) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            socket.leave(lobbyName);
            logger_1.logger.info(`User left room: ${lobbyName}`);
        }
        catch (error) {
            logger_1.logger.error("Error leaving room:", error);
        }
    }));
    socket.on("get-rooms", () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const rooms = yield db_1.default.getAvailableGames();
            socket.emit("rooms-list", rooms);
        }
        catch (error) {
            logger_1.logger.error("Error getting rooms:", error);
            socket.emit("error", { message: "Failed to get rooms" });
        }
    }));
    socket.on("player-move", (data) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { game, lobbyName, pitIndex } = data;
            let board = game.board || [4, 4, 4, 4, 4, 4, 0, 4, 4, 4, 4, 4, 4, 0];
            const isPlayer1Turn = game.current === "player1";
            if (!(0, game_logic_1.isValidMove)(pitIndex, board, isPlayer1Turn)) {
                socket.emit("error", { message: "Invalid move" });
                return;
            }
            const lastPit = (0, game_logic_1.distributeSeeds)(board, pitIndex, isPlayer1Turn);
            (0, game_logic_1.handleCapture)(board, lastPit, isPlayer1Turn);
            const winner = (0, game_logic_1.checkGameOver)(board);
            let winnerId = "";
            if (winner) {
                winnerId =
                    winner === "player1"
                        ? game.player1
                        : winner === "player2"
                            ? game.player2
                            : "tie";
            }
            const nextPlayer = (0, game_logic_1.getNextPlayer)(lastPit, isPlayer1Turn, game.current);
            const gameStatus = winner ? "complete" : "inProgress";
            const updatedGame = yield db_1.default.gameMove(lobbyName, board, nextPlayer, winnerId, gameStatus);
            io.to(lobbyName).emit("game-update", updatedGame);
            if (gameStatus === "complete") {
                const completedGame = yield db_1.default.getGameByLobbyName(lobbyName);
                io.to(lobbyName).emit("game-over", completedGame);
            }
        }
        catch (error) {
            logger_1.logger.error("Error processing player move:", error);
            socket.emit("error", { message: "Failed to process move" });
        }
    }));
});
httpServer.listen(port, () => {
    logger_1.logger.info(`> WebSocket server listening on port ${port}`);
});
