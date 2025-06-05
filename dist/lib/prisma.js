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
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.basePrisma = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("./logger");
exports.basePrisma = new client_1.PrismaClient();
exports.prisma = exports.basePrisma.$extends({
    name: 'GameStatusUpdate',
    query: {
        game: {
            update(_a) {
                return __awaiter(this, arguments, void 0, function* ({ args, query }) {
                    var _b, _c;
                    const result = yield query(args); // run actual update
                    if (result.status === client_1.Status.complete) {
                        try {
                            const { player1, player2, winner } = result;
                            const tie = winner === 'tie';
                            const updates = [];
                            if (player1) {
                                updates.push(exports.basePrisma.user.update({
                                    where: { id: player1 },
                                    data: {
                                        gamesPlayed: { increment: 1 },
                                        gamesWon: { increment: winner === player1 ? 1 : 0 },
                                        gamesLost: { increment: winner && winner !== player1 && !tie ? 1 : 0 },
                                        gamesDrawn: { increment: tie ? 1 : 0 },
                                    },
                                }));
                            }
                            if (player2) {
                                updates.push(exports.basePrisma.user.update({
                                    where: { id: player2 },
                                    data: {
                                        gamesPlayed: { increment: 1 },
                                        gamesWon: { increment: winner === player2 ? 1 : 0 },
                                        gamesLost: { increment: winner && winner !== player2 && !tie ? 1 : 0 },
                                        gamesDrawn: { increment: tie ? 1 : 0 },
                                    },
                                }));
                            }
                            const [prismaPlayer1, prismaPlayer2] = yield Promise.all(updates);
                            logger_1.logger.info(`Updated stats for: ${(_b = prismaPlayer1 === null || prismaPlayer1 === void 0 ? void 0 : prismaPlayer1.username) !== null && _b !== void 0 ? _b : 'P1'}, ${(_c = prismaPlayer2 === null || prismaPlayer2 === void 0 ? void 0 : prismaPlayer2.username) !== null && _c !== void 0 ? _c : 'P2'}`);
                        }
                        catch (err) {
                            logger_1.logger.error("Failed to update user stats after game completion", err);
                        }
                    }
                    return result;
                });
            },
        },
    }
});
