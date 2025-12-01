import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Obtener matches de mis reportes
export const getMyMatches = async (req, res) => {
  try {
    // Obtener todos los reportes del usuario
    const myReports = await prisma.report.findMany({
      where: {
        userId: req.userId,
        type: { in: ['LOST', 'FOUND'] },
        status: 'ACTIVE'
      },
      select: { id: true }
    });

    const reportIds = myReports.map(r => r.id);

    if (reportIds.length === 0) {
      return res.json({ count: 0, matches: [] });
    }

    // Buscar matches donde aparezcan mis reportes
    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { lostReportId: { in: reportIds } },
          { foundReportId: { in: reportIds } }
        ]
      },
      include: {
        lostReport: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        foundReport: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        matchScore: 'desc'
      }
    });

    res.json({
      count: matches.length,
      matches
    });

  } catch (error) {
    console.error('Error en getMyMatches:', error);
    res.status(500).json({ error: 'Error al obtener matches' });
  }
};

// Obtener matches de un reporte específico
export const getMatchesForReport = async (req, res) => {
  try {
    const { reportId } = req.params;

    // Verificar que el reporte existe y pertenece al usuario
    const report = await prisma.report.findUnique({
      where: { id: reportId }
    });

    if (!report) {
      return res.status(404).json({ error: 'Reporte no encontrado' });
    }

    if (report.userId !== req.userId) {
      return res.status(403).json({ error: 'No tienes permiso para ver estos matches' });
    }

    // Buscar matches
    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { lostReportId: reportId },
          { foundReportId: reportId }
        ]
      },
      include: {
        lostReport: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        foundReport: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        matchScore: 'desc'
      }
    });

    res.json({
      count: matches.length,
      matches
    });

  } catch (error) {
    console.error('Error en getMatchesForReport:', error);
    res.status(500).json({ error: 'Error al obtener matches' });
  }
};

// Marcar match como notificado
export const markMatchAsNotified = async (req, res) => {
  try {
    const { matchId } = req.params;

    const match = await prisma.match.update({
      where: { id: matchId },
      data: {
        notified: true,
        notifiedAt: new Date()
      }
    });

    res.json({
      message: 'Match marcado como notificado',
      match
    });

  } catch (error) {
    console.error('Error en markMatchAsNotified:', error);
    res.status(500).json({ error: 'Error al marcar match' });
  }
};
