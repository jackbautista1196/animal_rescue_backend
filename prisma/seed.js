import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // 1. Crear admin
  const hashedAdminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@animalrescue.com' },
    update: {},
    create: {
      email: 'admin@animalrescue.com',
      password: hashedAdminPassword,
      role: 'SUPER_ADMIN'
    }
  });
  console.log('✅ Admin creado:', admin.email);

  // 2. Crear veterinarias de ejemplo en Chincha
  const veterinaries = [
    {
      name: 'Clínica Veterinaria San Martín',
      address: 'Av. José de San Martín 456',
      district: 'Chincha Alta',
      province: 'Chincha',
      latitude: -13.4103,
      longitude: -76.1344,
      phone: '987654321',
      whatsapp: '987654321',
      services: ['emergencias', 'consultas', 'cirugía', 'vacunación'],
      plan: 'PREMIUM',
      planStartDate: new Date('2024-01-01'),
      planEndDate: new Date('2024-12-31')
    },
    {
      name: 'Veterinaria PetCare',
      address: 'Jr. Libertad 234',
      district: 'Chincha Alta',
      province: 'Chincha',
      latitude: -13.4120,
      longitude: -76.1320,
      phone: '987654322',
      services: ['consultas', 'peluquería', 'vacunación'],
      plan: 'BASIC',
      planStartDate: new Date('2024-01-01'),
      planEndDate: new Date('2024-12-31')
    },
    {
      name: 'Veterinaria El Buen Pastor',
      address: 'Av. Benavides 789',
      district: 'Chincha Baja',
      province: 'Chincha',
      latitude: -13.4250,
      longitude: -76.1280,
      phone: '987654323',
      services: ['consultas', 'vacunación'],
      plan: 'FREE'
    }
  ];

  for (const vet of veterinaries) {
    await prisma.veterinary.create({ data: vet });
  }
  console.log(`✅ ${veterinaries.length} veterinarias creadas`);

  // 3. Crear refugio de ejemplo
  const shelter = await prisma.shelter.create({
    data: {
      name: 'Refugio Patitas Felices Chincha',
      address: 'Carretera Panamericana Sur Km 200',
      district: 'Chincha Alta',
      province: 'Chincha',
      latitude: -13.4200,
      longitude: -76.1400,
      phone: '987654324',
      whatsapp: '987654324',
      capacity: 50,
      services: ['temporal', 'adopción', 'veterinario']
    }
  });
  console.log('✅ Refugio creado:', shelter.name);

  // 4. Crear usuarios de prueba
  const hashedUserPassword = await bcrypt.hash('password123', 10);
  const users = [
    {
      name: 'María González',
      phone: '987111111',
      password: hashedUserPassword,
      email: 'maria@email.com',
      location: 'Chincha Alta'
    },
    {
      name: 'Carlos Rodríguez',
      phone: '987222222',
      password: hashedUserPassword,
      email: 'carlos@email.com',
      location: 'Chincha Alta'
    }
  ];

  const createdUsers = [];
  for (const user of users) {
    const created = await prisma.user.create({ data: user });
    createdUsers.push(created);
  }
  console.log(`✅ ${users.length} usuarios de prueba creados`);

  // 5. Crear reportes de ejemplo
  const reports = [
    {
      type: 'LOST',
      animalType: 'perro',
      description: 'Perro labrador color dorado, collar azul, responde al nombre "Rocky"',
      latitude: -13.4103,
      longitude: -76.1344,
      address: 'Av. San Martín cerca al mercado',
      district: 'Chincha Alta',
      province: 'Chincha',
      contactPhone: '987111111',
      contactName: 'María González',
      userId: createdUsers[0].id,
      status: 'ACTIVE'
    },
    {
      type: 'FOUND',
      animalType: 'perro',
      description: 'Perro grande, color dorado, muy amigable, encontrado en el parque',
      latitude: -13.4110,
      longitude: -76.1350,
      address: 'Parque Principal de Chincha',
      district: 'Chincha Alta',
      province: 'Chincha',
      contactPhone: '987222222',
      contactName: 'Carlos Rodríguez',
      userId: createdUsers[1].id,
      status: 'ACTIVE'
    },
    {
      type: 'INJURED',
      animalType: 'gato',
      description: 'Gato callejero herido, necesita atención veterinaria urgente',
      latitude: -13.4150,
      longitude: -76.1330,
      address: 'Jr. Comercio 456',
      district: 'Chincha Alta',
      province: 'Chincha',
      contactPhone: '987111111',
      contactName: 'María González',
      userId: createdUsers[0].id,
      status: 'ACTIVE'
    }
  ];

  for (const report of reports) {
    await prisma.report.create({ data: report });
  }
  console.log(`✅ ${reports.length} reportes de ejemplo creados`);

  console.log('\n🎉 Seed completado exitosamente!');
  console.log('\n📋 Credenciales de prueba:');
  console.log('Admin:');
  console.log('  Email: admin@animalrescue.com');
  console.log('  Password: admin123');
  console.log('\nUsuario de prueba:');
  console.log('  Phone: 987111111');
  console.log('  Password: password123');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
