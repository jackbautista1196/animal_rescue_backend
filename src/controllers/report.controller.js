import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Crear reporte (perdido, encontrado o herido)
export const createReport = async (req, res) => {
  try {
    const {
      type,
      animalType,
      description,
      photoUrl,
      latitude,
      longitude,
      address,
      district,
      province,
      contactPhone,
      contactName
    } = req.body;

    // Validación básica
    if (!type || !animalType || !description || !latitude || !longitude || !address || !district || !contactPhone || !contactName) {
      return res.status(400).json({
        error: 'Faltan campos requeridos'
      });
    }

    // Crear el reporte
    const report = await prisma.report.create({
      data: {
        type,
        animalType,
        description,
        photoUrl,
        latitude,
        longitude,
        address,
        district,
        province: province || district,
        contactPhone,
        contactName,
        userId: req.userId
      }
    });

    // Si es LOST o FOUND, buscar matches automáticamente
    if (type === 'LOST' || type === 'FOUND') {
      await findMatches(report);
    }

    res.status(201).json({
      message: 'Reporte creado exitosamente',
      report
    });

  } catch (error) {
    console.error('Error en createReport:', error);
    res.status(500).json({ error: 'Error al crear reporte' });
  }
};

// Función para detectar matches entre reportes LOST y FOUND
async function findMatches(newReport) {
  try {
    // Determinar el tipo opuesto
    const oppositeType = newReport.type === 'LOST' ? 'FOUND' : 'LOST';

    // Buscar reportes del tipo opuesto en la misma zona (últimos 30 días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const potentialMatches = await prisma.report.findMany({
      where: {
        type: oppositeType,
        status: 'ACTIVE',
        district: newReport.district,
        createdAt: { gte: thirtyDaysAgo }
      }
    });

    // Calcular score y crear matches
    for (const potentialMatch of potentialMatches) {
      const distance = calculateDistance(
        newReport.latitude,
        newReport.longitude,
        potentialMatch.latitude,
        potentialMatch.longitude
      );

      // Solo considerar si está dentro de 5km
      if (distance <= 5) {
        const matchScore = calculateMatchScore(newReport, potentialMatch, distance);

        // Solo crear match si el score es mayor a 50
        if (matchScore >= 50) {
          const matchData = newReport.type === 'LOST'
            ? { lostReportId: newReport.id, foundReportId: potentialMatch.id }
            : { lostReportId: potentialMatch.id, foundReportId: newReport.id };

          await prisma.match.create({
            data: {
              ...matchData,
              matchScore,
              distance
            }
          });
        }
      }
    }
  } catch (error) {
    console.error('Error en findMatches:', error);
  }
}

// Calcular distancia entre dos puntos (fórmula de Haversine)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la Tierra en km
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

// Calcular score de match (qué tan probable es que coincidan)
function calculateMatchScore(report1, report2, distance) {
  let score = 100;

  // Penalizar por distancia
  score -= distance * 5; // -5 puntos por cada km

  // Bonus si el tipo de animal coincide
  if (report1.animalType.toLowerCase() === report2.animalType.toLowerCase()) {
    score += 20;
  }

  // Penalizar por tiempo entre reportes
  const timeDiff = Math.abs(new Date(report1.createdAt) - new Date(report2.createdAt));
  const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
  score -= daysDiff * 2; // -2 puntos por cada día de diferencia

  return Math.max(0, Math.min(100, score));
}

// Obtener reportes cercanos
export const getNearbyReports = async (req, res) => {
  try {
    const { latitude, longitude, radius = 10, type, status = 'ACTIVE' } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        error: 'Se requieren coordenadas (latitude, longitude)'
      });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const radiusKm = parseFloat(radius);

    // Aproximación simple: 1 grado ≈ 111km
    const latDelta = radiusKm / 111;
    const lonDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));

    const whereClause = {
      status,
      latitude: {
        gte: lat - latDelta,
        lte: lat + latDelta
      },
      longitude: {
        gte: lon - lonDelta,
        lte: lon + lonDelta
      }
    };

    if (type) {
      whereClause.type = type;
    }

    const reports = await prisma.report.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calcular distancia real y filtrar
    const reportsWithDistance = reports
      .map(report => ({
        ...report,
        distance: calculateDistance(lat, lon, report.latitude, report.longitude)
      }))
      .filter(report => report.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);

    res.json({
      count: reportsWithDistance.length,
      reports: reportsWithDistance
    });

  } catch (error) {
    console.error('Error en getNearbyReports:', error);
    res.status(500).json({ error: 'Error al obtener reportes' });
  }
};

// Obtener un reporte específico
export const getReportById = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!report) {
      return res.status(404).json({ error: 'Reporte no encontrado' });
    }

    res.json({ report });

  } catch (error) {
    console.error('Error en getReportById:', error);
    res.status(500).json({ error: 'Error al obtener reporte' });
  }
};

// Obtener mis reportes
export const getMyReports = async (req, res) => {
  try {
    const reports = await prisma.report.findMany({
      where: {
        userId: req.userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      count: reports.length,
      reports
    });

  } catch (error) {
    console.error('Error en getMyReports:', error);
    res.status(500).json({ error: 'Error al obtener reportes' });
  }
};

// Actualizar estado del reporte
export const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolutionNote, shareAsSuccess } = req.body;

    // Verificar que el reporte pertenece al usuario
    const report = await prisma.report.findUnique({
      where: { id }
    });

    if (!report) {
      return res.status(404).json({ error: 'Reporte no encontrado' });
    }

    if (report.userId !== req.userId) {
      return res.status(403).json({ error: 'No tienes permiso para actualizar este reporte' });
    }

    // Preparar datos para actualizar
    const updateData = { status };

    // Si se marca como RESOLVED, agregar fecha de resolución
    if (status === 'RESOLVED') {
      updateData.resolvedAt = new Date();

      // Agregar nota de resolución si existe
      if (resolutionNote) {
        updateData.resolutionNote = resolutionNote;
      }

      // Marcar si puede compartirse como caso de éxito
      if (shareAsSuccess !== undefined) {
        updateData.shareAsSuccess = shareAsSuccess;
      }
    }

    const updatedReport = await prisma.report.update({
      where: { id },
      data: updateData
    });

    res.json({
      message: status === 'RESOLVED'
        ? '¡Felicidades! Caso marcado como resuelto'
        : 'Estado actualizado exitosamente',
      report: updatedReport
    });

  } catch (error) {
    console.error('Error en updateReportStatus:', error);
    res.status(500).json({ error: 'Error al actualizar reporte' });
  }
};

// Obtener estadísticas globales (para el banner)
export const getGlobalStats = async (req, res) => {
  try {
    // Contar casos resueltos
    const resolvedCount = await prisma.report.count({
      where: { status: 'RESOLVED' }
    });

    // Contar por tipo de reporte resuelto
    const lostResolved = await prisma.report.count({
      where: {
        type: 'LOST',
        status: 'RESOLVED'
      }
    });

    const foundResolved = await prisma.report.count({
      where: {
        type: 'FOUND',
        status: 'RESOLVED'
      }
    });

    const injuredResolved = await prisma.report.count({
      where: {
        type: 'INJURED',
        status: 'RESOLVED'
      }
    });

    // Contar reportes activos
    const activeReports = await prisma.report.count({
      where: { status: 'ACTIVE' }
    });

    // Contar matches exitosos
    const successfulMatches = await prisma.match.count({
      where: { status: 'CONTACTED' }
    });

    // Casos de éxito recientes (últimos 5)
    const recentSuccesses = await prisma.report.findMany({
      where: {
        status: 'RESOLVED',
        shareAsSuccess: true
      },
      select: {
        id: true,
        type: true,
        animalType: true,
        description: true,
        photoUrl: true,
        resolvedAt: true,
        resolutionNote: true,
        district: true
      },
      orderBy: {
        resolvedAt: 'desc'
      },
      take: 5
    });

    res.json({
      totalResolved: resolvedCount,
      byType: {
        lost: lostResolved,
        found: foundResolved,
        injured: injuredResolved
      },
      activeReports,
      successfulMatches,
      recentSuccesses
    });

  } catch (error) {
    console.error('Error en getGlobalStats:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};