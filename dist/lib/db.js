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
const prisma_1 = require("./prisma");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const logger_1 = require("./logger");
function getUser(username) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const user = yield prisma_1.prisma.user.findUnique({
                where: {
                    username,
                },
            });
            return user;
        }
        catch (error) {
            logger_1.logger.error(`Error fetching user ${username}:`, error);
        }
        return null;
    });
}
function createUser(username, password) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
            const user = yield prisma_1.prisma.user.create({
                data: {
                    username: username,
                    password: hashedPassword,
                    url: `https://api.dicebear.com/5.x/initials/svg?seed=${username}`,
                },
            });
            return user;
        }
        catch (error) {
            logger_1.logger.error('Error creating user:', error);
        }
        return null;
    });
}
function updateUserLastLogin(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const user = yield prisma_1.basePrisma.user.update({
                where: {
                    id: userId,
                },
                data: {
                    lastLogin: new Date(),
                },
            });
            return user;
        }
        catch (error) {
            logger_1.logger.error('Error updating user last login:', error);
        }
        return null;
    });
}
function createGame(player1ID, lobbyName) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const game = yield prisma_1.prisma.game.create({
                data: {
                    lobbyName: lobbyName,
                    player1User: {
                        connect: { id: player1ID },
                    },
                    player2User: undefined,
                    status: 'waiting',
                },
            });
            return game;
        }
        catch (error) {
            logger_1.logger.error('Error creating game:', error);
        }
        return null;
    });
}
function joinGame(player2ID, lobbyName) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const game = yield prisma_1.prisma.game.update({
                where: {
                    lobbyName: lobbyName,
                },
                data: {
                    player2User: {
                        connect: { id: player2ID },
                    },
                    status: 'inProgress',
                },
            });
            return game;
        }
        catch (error) {
            logger_1.logger.error('Error joining game:', error);
        }
        return null;
    });
}
function getGameByLobbyName(lobbyName) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const game = yield prisma_1.prisma.game.findUnique({
                where: {
                    lobbyName: lobbyName,
                },
                include: {
                    player1User: true,
                    player2User: true,
                },
            });
            return game;
        }
        catch (error) {
            logger_1.logger.error('Error fetching game by lobby name:', error);
        }
        return null;
    });
}
function getAvailableGames() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const games = yield prisma_1.prisma.game.findMany({
                where: {
                    status: 'waiting',
                },
                orderBy: {
                    createdAt: 'asc',
                },
            });
            return games;
        }
        catch (error) {
            logger_1.logger.error('Error fetching available games:', error);
        }
        return [];
    });
}
function gameMove(lobbyName, board, current, winner, status) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const game = yield prisma_1.prisma.game.update({
                where: {
                    lobbyName: lobbyName,
                },
                data: {
                    board: board,
                    current: current,
                    winner: winner,
                    status: status,
                },
            });
            return game;
        }
        catch (error) {
            logger_1.logger.error('Error updating game move:', error);
        }
        return null;
    });
}
function createMessage(message, username, userId, url) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const chatMessage = yield prisma_1.prisma.chat.create({
                data: {
                    message: message,
                    username: username,
                    userId: userId,
                    url: url,
                },
            });
            return chatMessage;
        }
        catch (error) {
            logger_1.logger.error('Error creating message:', error);
        }
        return null;
    });
}
function getMessages() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const messages = yield prisma_1.prisma.chat.findMany({
                orderBy: {
                    createdAt: 'asc',
                },
            });
            return messages;
        }
        catch (error) {
            logger_1.logger.error('Error fetching messages:', error);
        }
        return [];
    });
}
const db = {
    getUser,
    createGame,
    getGameByLobbyName,
    getAvailableGames,
    gameMove,
    createMessage,
    getMessages,
    createUser,
    updateUserLastLogin,
    joinGame,
};
exports.default = db;
