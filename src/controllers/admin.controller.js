import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// ============= AUTH ADMIN =============

export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email y contraseña son requeridos' 
      });
    }

    const admin = await prisma.admin.findUnique({
      where: { email }
    });

    if (!admin) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const validPassword = await bcrypt.compare(password, admin.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { 
        adminId: admin.id, 
        email: admin.email,
        role: admin.role,
        isAdmin: true 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Login exitoso',
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role
      },
      token
    });

  } catch (error) {
    console.error('Error en loginAdmin:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

// ============= VETERINARIAS =============

export const createVeterinary = async (req, res) => {
  try {
    const {
      name,
      address,
      district,
      province,
      latitude,
      longitude,
      phone,
      email,
      whatsapp,
      openHours,
      services,
      plan = 'FREE'
    } = req.body;

    if (!name || !address || !district || !latitude || !longitude || !phone) {
      return res.status(400).json({ 
        error: 'Faltan campos requeridos' 
      });
    }

    const veterinary = await prisma.veterinary.create({
      data: {
        name,
        address,
        district,
        province: province || district,
        latitude,
        longitude,
        phone,
        email,
        whatsapp,
        openHours,
        services: services || [],
        plan
      }
    });

    res.status(201).json({
      message: 'Veterinaria creada exitosamente',
      veterinary
    });

  } catch (error) {
    console.error('Error en createVeterinary:', error);
    res.status(500).json({ error: 'Error al crear veterinaria' });
  }
};

export const updateVeterinary = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const veterinary = await prisma.veterinary.update({
      where: { id },
      data: updateData
    });

    res.json({
      message: 'Veterinaria actualizada exitosamente',
      veterinary
    });

  } catch (error) {
    console.error('Error en updateVeterinary:', error);
    res.status(500).json({ error: 'Error al actualizar veterinaria' });
  }
};

export const updateVeterinaryPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { plan, planStartDate, planEndDate } = req.body;

    if (!plan) {
      return res.status(400).json({ error: 'Plan es requerido' });
    }

    const veterinary = await prisma.veterinary.update({
      where: { id },
      data: {
        plan,
        planStartDate: planStartDate ? new Date(planStartDate) : null,
        planEndDate: planEndDate ? new Date(planEndDate) : null
      }
    });

    res.json({
      message: 'Plan actualizado exitosamente',
      veterinary
    });

  } catch (error) {
    console.error('Error en updateVeterinaryPlan:', error);
    res.status(500).json({ error: 'Error al actualizar plan' });
  }
};

export const deleteVeterinary = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.veterinary.delete({
      where: { id }
    });

    res.json({
      message: 'Veterinaria eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error en deleteVeterinary:', error);
    res.status(500).json({ error: 'Error al eliminar veterinaria' });
  }
};

export const toggleVeterinaryStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const veterinary = await prisma.veterinary.findUnique({
      where: { id }
    });

    if (!veterinary) {
      return res.status(404).json({ error: 'Veterinaria no encontrada' });
    }

    const updated = await prisma.veterinary.update({
      where: { id },
      data: { isActive: !veterinary.isActive }
    });

    res.json({
      message: `Veterinaria ${updated.isActive ? 'activada' : 'desactivada'} exitosamente`,
      veterinary: updated
    });

  } catch (error) {
    console.error('Error en toggleVeterinaryStatus:', error);
    res.status(500).json({ error: 'Error al cambiar estado' });
  }
};

// ============= REFUGIOS =============

export const createShelter = async (req, res) => {
  try {
    const {
      name,
      address,
      district,
      province,
      latitude,
      longitude,
      phone,
      email,
      whatsapp,
      capacity,
      services
    } = req.body;

    if (!name || !address || !district || !latitude || !longitude || !phone) {
      return res.status(400).json({ 
        error: 'Faltan campos requeridos' 
      });
    }

    const shelter = await prisma.shelter.create({
      data: {
        name,
        address,
        district,
        province: province || district,
        latitude,
        longitude,
        phone,
        email,
        whatsapp,
        capacity,
        services: services || []
      }
    });

    res.status(201).json({
      message: 'Refugio creado exitosamente',
      shelter
    });

  } catch (error) {
    console.error('Error en createShelter:', error);
    res.status(500).json({ error: 'Error al crear refugio' });
  }
};

export const updateShelter = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const shelter = await prisma.shelter.update({
      where: { id },
      data: updateData
    });

    res.json({
      message: 'Refugio actualizado exitosamente',
      shelter
    });

  } catch (error) {
    console.error('Error en updateShelter:', error);
    res.status(500).json({ error: 'Error al actualizar refugio' });
  }
};

export const deleteShelter = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.shelter.delete({
      where: { id }
    });

    res.json({
      message: 'Refugio eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error en deleteShelter:', error);
    res.status(500).json({ error: 'Error al eliminar refugio' });
  }
};

export const toggleShelterStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const shelter = await prisma.shelter.findUnique({
      where: { id }
    });

    if (!shelter) {
      return res.status(404).json({ error: 'Refugio no encontrado' });
    }

    const updated = await prisma.shelter.update({
      where: { id },
      data: { isActive: !shelter.isActive }
    });

    res.json({
      message: `Refugio ${updated.isActive ? 'activado' : 'desactivado'} exitosamente`,
      shelter: updated
    });

  } catch (error) {
    console.error('Error en toggleShelterStatus:', error);
    res.status(500).json({ error: 'Error al cambiar estado' });
  }
};

// ============= ESTADÍSTICAS =============

export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalReports,
      activeReports,
      totalVeterinaries,
      sponsoredVeterinaries,
      totalShelters,
      totalUsers,
      totalMatches
    ] = await Promise.all([
      prisma.report.count(),
      prisma.report.count({ where: { status: 'ACTIVE' } }),
      prisma.veterinary.count(),
      prisma.veterinary.count({ where: { plan: { not: 'FREE' } } }),
      prisma.shelter.count(),
      prisma.user.count(),
      prisma.match.count()
    ]);

    res.json({
      reports: {
        total: totalReports,
        active: activeReports
      },
      veterinaries: {
        total: totalVeterinaries,
        sponsored: sponsoredVeterinaries
      },
      shelters: {
        total: totalShelters
      },
      users: {
        total: totalUsers
      },
      matches: {
        total: totalMatches
      }
    });

  } catch (error) {
    console.error('Error en getDashboardStats:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};
