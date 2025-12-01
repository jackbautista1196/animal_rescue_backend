import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Registro rápido y simple
export const register = async (req, res) => {
  try {
    const { name, phone, password, email, location } = req.body;

    // Validación básica
    if (!name || !phone || !password) {
      return res.status(400).json({
        error: 'Nombre, teléfono y contraseña son requeridos'
      });
    }

    // Verificar si el teléfono ya existe
    const existingUser = await prisma.user.findUnique({
      where: { phone }
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'Este teléfono ya está registrado'
      });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        name,
        phone,
        password: hashedPassword,
        email: email || null,
        location: location || null
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        location: true,
        createdAt: true
      }
    });

    // Generar token
    const token = jwt.sign(
      { userId: user.id, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user,
      token
    });

  } catch (error) {
    console.error('Error en register:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        error: 'Teléfono y contraseña son requeridos'
      });
    }

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { phone }
    });

    if (!user) {
      return res.status(401).json({
        error: 'Credenciales inválidas'
      });
    }

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({
        error: 'Credenciales inválidas'
      });
    }

    // Generar token
    const token = jwt.sign(
      { userId: user.id, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Login exitoso',
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        location: user.location
      },
      token
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

// Obtener perfil del usuario
export const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        location: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ user });

  } catch (error) {
    console.error('Error en getProfile:', error);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
};

// Actualizar perfil del usuario
export const updateProfile = async (req, res) => {
  try {
    const { name, email, location } = req.body;

    // Validación básica
    if (!name) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    // Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: {
        name,
        email: email || null,
        location: location || null,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        location: true,
        createdAt: true
      }
    });

    res.json({
      message: 'Perfil actualizado exitosamente',
      user: updatedUser
    });

  } catch (error) {
    console.error('Error en updateProfile:', error);
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
};

// Cambiar contraseña
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Contraseña actual y nueva contraseña son requeridas'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'La nueva contraseña debe tener al menos 6 caracteres'
      });
    }

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    });

    // Verificar contraseña actual
    const validPassword = await bcrypt.compare(currentPassword, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña
    await prisma.user.update({
      where: { id: req.userId },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Contraseña actualizada exitosamente' });

  } catch (error) {
    console.error('Error en changePassword:', error);
    res.status(500).json({ error: 'Error al cambiar contraseña' });
  }
};

// Obtener estadísticas del usuario
export const getUserStats = async (req, res) => {
  try {
    const [totalReports, activeReports, totalMatches] = await Promise.all([
      prisma.report.count({ where: { userId: req.userId } }),
      prisma.report.count({ where: { userId: req.userId, status: 'ACTIVE' } }),
      prisma.match.count({
        where: {
          OR: [
            { lostReport: { userId: req.userId } },
            { foundReport: { userId: req.userId } }
          ]
        }
      })
    ]);

    res.json({
      stats: {
        totalReports,
        activeReports,
        totalMatches
      }
    });

  } catch (error) {
    console.error('Error en getUserStats:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};