import { prisma, basePrisma } from "./prisma";
import { User, Status, Current } from "@prisma/client";
import bcrypt from "bcryptjs";
import { logger } from "./logger";

async function getUser(username: string): Promise<User | null> {
    try {
        const user = await prisma.user.findUnique({
            where: {
                username,
            },
        });
        return user;
    }
    catch (error) {
        logger.error(`Error fetching user ${username}:`, error);
    }
    return null;
}

async function createUser(username: string, password: string) {
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                username: username,
                password: hashedPassword,
                url: `https://api.dicebear.com/5.x/initials/svg?seed=${username}`,
            },
        });
        return user;
    } catch (error) {
        logger.error('Error creating user:', error);
    }
    return null;
}

async function updateUserLastLogin(userId: string) {
    try {
        const user = await basePrisma.user.update({
            where: {
                id: userId,
            },
            data: {
                lastLogin: new Date(),
            },
        });
        return user;
    } catch (error) {
        logger.error('Error updating user last login:', error);
    }
    return null;
}

async function createGame(player1ID: string, lobbyName: string) {
    try {
        const game = await prisma.game.create({
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
    } catch (error) {
        logger.error('Error creating game:', error);
    }
    return null;
}

async function joinGame(player2ID: string, lobbyName: string) {
    try {
        const game = await prisma.game.update({
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
    } catch (error) {
        logger.error('Error joining game:', error);
    }
    return null;
}

async function getGameByLobbyName(lobbyName: string) {
    try {
        const game = await prisma.game.findUnique({
            where: {
                lobbyName: lobbyName,
            },
            include: {
                player1User: true,
                player2User: true,
            },
        });
        return game;
    } catch (error) {
        logger.error('Error fetching game by lobby name:', error);
    }
    return null;
}

async function getAvailableGames() {
    try {
        const games = await prisma.game.findMany({
            where: {
                status: 'waiting',
            },
            orderBy: {
                createdAt: 'asc',
            },
        });
        return games;  
    } catch (error) {
        logger.error('Error fetching available games:', error);
    }
    return [];
}

async function gameMove(lobbyName: string, board: number[], current: Current, winner: string, status: Status) {
    try {
        const game = await prisma.game.update({
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
    } catch (error) {
        logger.error('Error updating game move:', error);
    }
    return null;
}

async function createMessage(message: string, username: string, userId: string, url: string) {
    try {
        const chatMessage = await prisma.chat.create({
            data: {
                message: message,
                username: username,
                userId: userId,
                url: url,
            },
        });
        return chatMessage;
    } catch (error) {
        logger.error('Error creating message:', error);
    }
    return null;
}

async function getMessages() {
    try {
        const messages = await prisma.chat.findMany({
            orderBy: {
                createdAt: 'asc',
            },
        });
        return messages;
    } catch (error) {
        logger.error('Error fetching messages:', error);
    }
    return [];
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

export default db;