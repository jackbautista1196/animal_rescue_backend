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

export const searchMatchesWithRadius = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { radius = 2 } = req.query; // Default 2km

    // Verificar que el reporte existe y pertenece al usuario
    const report = await prisma.report.findUnique({
      where: { id: reportId }
    });

    if (!report) {
      return res.status(404).json({ error: 'Reporte no encontrado' });
    }

    if (report.userId !== req.userId) {
      return res.status(403).json({ error: 'No tienes permiso' });
    }

    // Determinar tipo opuesto
    const oppositeType = report.type === 'LOST' ? 'FOUND' : 'LOST';

    // Buscar reportes del tipo opuesto
    const potentialMatches = await prisma.report.findMany({
      where: {
        type: oppositeType,
        status: 'ACTIVE',
        district: report.district
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      }
    });

    // Calcular distancia y score para cada match potencial
    const matches = [];

    for (const match of potentialMatches) {
      const distance = calculateDistance(
        report.latitude,
        report.longitude,
        match.latitude,
        match.longitude
      );

      // Solo incluir si está dentro del radio
      if (distance <= parseFloat(radius)) {
        const matchScore = calculateMatchScore(report, match, distance);

        // Solo incluir si score es mayor a 30
        if (matchScore >= 30) {
          matches.push({
            ...match,
            distance: parseFloat(distance.toFixed(2)),
            matchScore,
            matchedKeywords: getMatchedKeywords(report.description, match.description)
          });
        }
      }
    }

    // Ordenar por score descendente
    matches.sort((a, b) => b.matchScore - a.matchScore);

    res.json({
      count: matches.length,
      radius: parseFloat(radius),
      matches
    });

  } catch (error) {
    console.error('Error en searchMatchesWithRadius:', error);
    res.status(500).json({ error: 'Error al buscar matches' });
  }
};

function getMatchedKeywords(desc1, desc2) {
  if (!desc1 || !desc2) return [];

  const matched = [];
  desc1 = desc1.toLowerCase();
  desc2 = desc2.toLowerCase();

  // Colores
  const colors = ['negro', 'blanco', 'marrón', 'gris', 'amarillo', 'café'];
  for (const color of colors) {
    if (desc1.includes(color) && desc2.includes(color)) {
      matched.push(`Color: ${color}`);
      break;
    }
  }

  // Tamaños
  const sizes = ['grande', 'pequeño', 'mediano', 'chico', 'gordo'];
  for (const size of sizes) {
    if (desc1.includes(size) && desc2.includes(size)) {
      matched.push(`Tamaño: ${size}`);
      break;
    }
  }

  // Razas
  const breeds = ['labrador', 'pitbull', 'schnauzer', 'cocker', 'golden', 'pastor'];
  for (const breed of breeds) {
    if (desc1.includes(breed) && desc2.includes(breed)) {
      matched.push(`Raza: ${breed}`);
      break;
    }
  }

  return matched;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

function compareDescriptions(desc1, desc2) {
  // (Copiar la función completa de arriba)
  if (!desc1 || !desc2) return 0;

  desc1 = desc1.toLowerCase().trim();
  desc2 = desc2.toLowerCase().trim();

  let matchPoints = 0;

  const colorKeywords = {
    negro: ['negro', 'oscuro', 'dark', 'prieto'],
    blanco: ['blanco', 'claro', 'blanquito'],
    marron: ['marrón', 'café', 'castaño', 'brown'],
    gris: ['gris', 'grey', 'gray', 'plomo']
  };

  const sizeKeywords = {
    grande: ['grande', 'gordo', 'big', 'robusto'],
    pequeno: ['pequeño', 'chico', 'mini', 'tiny'],
    mediano: ['mediano', 'medio', 'regular']
  };

  const commonBreeds = [
    'labrador', 'pitbull', 'schnauzer', 'cocker', 'golden',
    'pastor', 'poodle', 'bulldog', 'chihuahua'
  ];

  for (const [color, synonyms] of Object.entries(colorKeywords)) {
    const hasColor1 = synonyms.some(syn => desc1.includes(syn));
    const hasColor2 = synonyms.some(syn => desc2.includes(syn));
    if (hasColor1 && hasColor2) {
      matchPoints += 15;
      break;
    }
  }

  for (const [size, synonyms] of Object.entries(sizeKeywords)) {
    const hasSize1 = synonyms.some(syn => desc1.includes(syn));
    const hasSize2 = synonyms.some(syn => desc2.includes(syn));
    if (hasSize1 && hasSize2) {
      matchPoints += 10;
      break;
    }
  }

  for (const breed of commonBreeds) {
    if (desc1.includes(breed) && desc2.includes(breed)) {
      matchPoints += 20;
      break;
    }
  }

  return matchPoints;
};

function calculateMatchScore(report1, report2, distance) {
  // (Copiar la función completa de arriba)
  let score = 0;

  if (distance <= 0.5) score += 40;
  else if (distance <= 1) score += 35;
  else if (distance <= 2) score += 30;
  else score += 20;

  if (report1.animalType.toLowerCase() === report2.animalType.toLowerCase()) {
    score += 10;
  }

  const descriptionScore = compareDescriptions(report1.description, report2.description);
  score += descriptionScore;

  const timeDiff = Math.abs(new Date(report1.createdAt) - new Date(report2.createdAt));
  const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
  score -= Math.min(daysDiff * 2, 10);

  return Math.max(0, Math.min(100, Math.round(score)));
}