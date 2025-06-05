import { PrismaClient, Status, User } from '@prisma/client';
import { logger } from './logger';

export const basePrisma = new PrismaClient();

export const prisma = basePrisma.$extends({
    name: 'GameStatusUpdate',
    query: {
        game: {
            async update({ args, query }) {
                const result = await query(args); // run actual update

                if (result.status === Status.complete) {
                    try {
                        const { player1, player2, winner } = result;
                        const tie = winner === 'tie';

                        const updates: Promise<User>[] = [];

                        if (player1) {
                            updates.push(
                                basePrisma.user.update({
                                    where: { id: player1 },
                                    data: {
                                        gamesPlayed: { increment: 1 },
                                        gamesWon: { increment: winner === player1 ? 1 : 0 },
                                        gamesLost: { increment: winner && winner !== player1 && !tie ? 1 : 0 },
                                        gamesDrawn: { increment: tie ? 1 : 0 },
                                    },
                                })
                            );
                        }

                        if (player2) {
                            updates.push(
                                basePrisma.user.update({
                                    where: { id: player2 },
                                    data: {
                                        gamesPlayed: { increment: 1 },
                                        gamesWon: { increment: winner === player2 ? 1 : 0 },
                                        gamesLost: { increment: winner && winner !== player2 && !tie ? 1 : 0 },
                                        gamesDrawn: { increment: tie ? 1 : 0 },
                                    },
                                })
                            );
                        }

                        const [prismaPlayer1, prismaPlayer2] = await Promise.all(updates);
                        logger.info(
                            `Updated stats for: ${prismaPlayer1?.username ?? 'P1'}, ${prismaPlayer2?.username ?? 'P2'}`
                        );
                    } catch (err) {
                        logger.error("Failed to update user stats after game completion", err);
                    }
                }

                return result;
            },
        },
    }
});
