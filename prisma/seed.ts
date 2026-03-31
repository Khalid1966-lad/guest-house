import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Début du seed...')

  // Nettoyer la base de données existante
  await prisma.orderItem.deleteMany()
  await prisma.restaurantOrder.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.invoiceItem.deleteMany()
  await prisma.invoice.deleteMany()
  await prisma.booking.deleteMany()
  await prisma.expense.deleteMany()
  await prisma.menuItem.deleteMany()
  await prisma.guest.deleteMany()
  await prisma.roomPrice.deleteMany()
  await prisma.room.deleteMany()
  await prisma.amenity.deleteMany()
  await prisma.guestHouseSetting.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.user.deleteMany()
  await prisma.guestHouse.deleteMany()
  console.log('✅ Base de données nettoyée')

  // Créer la maison d'hôtes
  const guestHouse = await prisma.guestHouse.create({
    data: {
      name: 'Villa Azur',
      slug: 'villa-azur',
      description: "Maison d'hôtes de charme au bord de la mer",
      address: '123 Boulevard de la Plage',
      city: 'Nice',
      postalCode: '06000',
      country: 'France',
      phone: '+33 4 93 00 00 00',
      email: 'contact@villa-azur.fr',
      website: 'https://villa-azur.fr',
      currency: 'EUR',
      taxRate: 10.0,
      isActive: true,
      plan: 'pro',
    },
  })
  console.log('✅ Maison d\'hôtes créée:', guestHouse.name)

  // Créer l'utilisateur admin
  const hashedPassword = await bcrypt.hash('password123', 10)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@villa-azur.fr',
      password: hashedPassword,
      name: 'Jean Dupont',
      firstName: 'Jean',
      lastName: 'Dupont',
      phone: '+33 6 00 00 00 00',
      role: 'owner',
      guestHouseId: guestHouse.id,
      emailVerified: new Date(),
    },
  })
  console.log('✅ Utilisateur admin créé:', admin.email)

  // Créer des équipements
  const amenities = await Promise.all([
    prisma.amenity.create({
      data: { name: 'WiFi', icon: 'wifi', guestHouseId: guestHouse.id },
    }),
    prisma.amenity.create({
      data: { name: 'Climatisation', icon: 'wind', guestHouseId: guestHouse.id },
    }),
    prisma.amenity.create({
      data: { name: 'TV', icon: 'tv', guestHouseId: guestHouse.id },
    }),
    prisma.amenity.create({
      data: { name: 'Minibar', icon: 'glass-water', guestHouseId: guestHouse.id },
    }),
    prisma.amenity.create({
      data: { name: 'Coffre-fort', icon: 'lock', guestHouseId: guestHouse.id },
    }),
    prisma.amenity.create({
      data: { name: 'Balcon', icon: 'door-open', guestHouseId: guestHouse.id },
    }),
  ])
  console.log('✅ Équipements créés:', amenities.length)

  // Créer des chambres
  const rooms = await Promise.all([
    prisma.room.create({
      data: {
        number: '101',
        name: 'Chambre Mer',
        description: 'Vue mer, balcon privatif',
        type: 'double',
        capacity: 2,
        bedCount: 1,
        bedType: 'queen',
        size: 28,
        basePrice: 120,
        status: 'available',
        amenities: JSON.stringify(['wifi', 'ac', 'tv', 'minibar', 'balcon']),
        guestHouseId: guestHouse.id,
      },
    }),
    prisma.room.create({
      data: {
        number: '102',
        name: 'Chambre Jardin',
        description: 'Vue jardin, terrasse',
        type: 'double',
        capacity: 2,
        bedCount: 1,
        bedType: 'king',
        size: 32,
        basePrice: 150,
        status: 'available',
        amenities: JSON.stringify(['wifi', 'ac', 'tv', 'minibar', 'safe']),
        guestHouseId: guestHouse.id,
      },
    }),
    prisma.room.create({
      data: {
        number: '201',
        name: 'Suite Familiale',
        description: 'Suite familiale, 2 chambres',
        type: 'family',
        capacity: 4,
        bedCount: 2,
        bedType: 'double',
        size: 45,
        basePrice: 220,
        status: 'available',
        amenities: JSON.stringify(['wifi', 'ac', 'tv', 'minibar', 'safe', 'balcon']),
        guestHouseId: guestHouse.id,
      },
    }),
    prisma.room.create({
      data: {
        number: '301',
        name: 'Penthouse',
        description: 'Suite luxueuse avec terrasse panoramique',
        type: 'suite',
        capacity: 2,
        bedCount: 1,
        bedType: 'king',
        size: 55,
        basePrice: 350,
        status: 'occupied',
        amenities: JSON.stringify(['wifi', 'ac', 'tv', 'minibar', 'safe', 'balcon']),
        guestHouseId: guestHouse.id,
      },
    }),
  ])
  console.log('✅ Chambres créées:', rooms.length)

  // Créer des clients
  const guests = await Promise.all([
    prisma.guest.create({
      data: {
        firstName: 'Marie',
        lastName: 'Martin',
        email: 'marie.martin@email.com',
        phone: '+33 6 11 22 33 44',
        city: 'Paris',
        country: 'France',
        nationality: 'Française',
        guestHouseId: guestHouse.id,
      },
    }),
    prisma.guest.create({
      data: {
        firstName: 'Pierre',
        lastName: 'Bernard',
        email: 'pierre.bernard@email.com',
        phone: '+33 6 55 66 77 88',
        city: 'Lyon',
        country: 'France',
        nationality: 'Français',
        isVip: true,
        vipLevel: 'gold',
        guestHouseId: guestHouse.id,
      },
    }),
    prisma.guest.create({
      data: {
        firstName: 'Sophie',
        lastName: 'Dubois',
        email: 'sophie.dubois@email.com',
        phone: '+33 6 99 00 11 22',
        city: 'Marseille',
        country: 'France',
        nationality: 'Française',
        guestHouseId: guestHouse.id,
      },
    }),
    prisma.guest.create({
      data: {
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@email.com',
        phone: '+1 555 123 4567',
        city: 'New York',
        country: 'USA',
        nationality: 'Américain',
        isVip: true,
        vipLevel: 'platinum',
        guestHouseId: guestHouse.id,
      },
    }),
  ])
  console.log('✅ Clients créés:', guests.length)

  // Créer des réservations
  const today = new Date()
  const bookings = await Promise.all([
    // Réservation en cours (occupée)
    prisma.booking.create({
      data: {
        guestId: guests[0].id,
        roomId: rooms[3].id,
        guestHouseId: guestHouse.id,
        checkIn: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
        checkOut: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000),
        adults: 2,
        children: 0,
        nightlyRate: 350,
        totalPrice: 1750,
        grandTotal: 1750,
        source: 'direct',
        status: 'checked_in',
        paymentStatus: 'paid',
        createdBy: admin.id,
      },
    }),
    // Réservation future confirmée
    prisma.booking.create({
      data: {
        guestId: guests[1].id,
        roomId: rooms[0].id,
        guestHouseId: guestHouse.id,
        checkIn: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000),
        checkOut: new Date(today.getTime() + 8 * 24 * 60 * 60 * 1000),
        adults: 2,
        children: 0,
        nightlyRate: 120,
        totalPrice: 360,
        grandTotal: 360,
        source: 'booking',
        status: 'confirmed',
        paymentStatus: 'pending',
        createdBy: admin.id,
      },
    }),
    // Réservation en attente
    prisma.booking.create({
      data: {
        guestId: guests[2].id,
        roomId: rooms[1].id,
        guestHouseId: guestHouse.id,
        checkIn: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000),
        checkOut: new Date(today.getTime() + 12 * 24 * 60 * 60 * 1000),
        adults: 1,
        children: 0,
        nightlyRate: 150,
        totalPrice: 300,
        grandTotal: 300,
        source: 'direct',
        status: 'pending',
        paymentStatus: 'pending',
        createdBy: admin.id,
      },
    }),
  ])
  console.log('✅ Réservations créées:', bookings.length)

  // Créer des articles de menu
  const menuItems = await Promise.all([
    prisma.menuItem.create({
      data: {
        name: 'Petit-déjeuner continental',
        description: "Croissant, pain, beurre, confiture, café/jus d'orange",
        category: 'breakfast',
        price: 15,
        guestHouseId: guestHouse.id,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Petit-déjeuner anglais',
        description: 'Œufs, bacon, saucisses, haricots, toast',
        category: 'breakfast',
        price: 18,
        guestHouseId: guestHouse.id,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Salade César',
        description: 'Laitue romaine, parmesan, croûtons, sauce césar',
        category: 'lunch',
        price: 14,
        guestHouseId: guestHouse.id,
        isVegetarian: true,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Burger Maison',
        description: 'Bœuf 180g, cheddar, bacon, frites maison',
        category: 'lunch',
        price: 19,
        guestHouseId: guestHouse.id,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Filet de Saumon',
        description: 'Saumon grillé, légumes de saison, sauce citron',
        category: 'dinner',
        price: 26,
        guestHouseId: guestHouse.id,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Entrecôte',
        description: 'Entrecôte 300g, frites maison, sauce au choix',
        category: 'dinner',
        price: 32,
        guestHouseId: guestHouse.id,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Café',
        description: 'Espresso ou allongé',
        category: 'drinks',
        price: 3,
        guestHouseId: guestHouse.id,
      },
    }),
    prisma.menuItem.create({
      data: {
        name: 'Vin verre',
        description: 'Vin rouge, blanc ou rosé',
        category: 'drinks',
        price: 7,
        guestHouseId: guestHouse.id,
      },
    }),
  ])
  console.log('✅ Articles du menu créés:', menuItems.length)

  // Créer des dépenses
  const expenses = await Promise.all([
    prisma.expense.create({
      data: {
        guestHouseId: guestHouse.id,
        category: 'supplies',
        description: 'Produits ménagers',
        amount: 150,
        vendor: 'Carrefour',
        status: 'paid',
        createdBy: admin.id,
      },
    }),
    prisma.expense.create({
      data: {
        guestHouseId: guestHouse.id,
        category: 'food',
        description: 'Approvisionnement cuisine',
        amount: 450,
        vendor: 'Metro',
        status: 'paid',
        createdBy: admin.id,
      },
    }),
    prisma.expense.create({
      data: {
        guestHouseId: guestHouse.id,
        category: 'utilities',
        description: 'Électricité mensuelle',
        amount: 280,
        vendor: 'EDF',
        status: 'paid',
        createdBy: admin.id,
      },
    }),
    prisma.expense.create({
      data: {
        guestHouseId: guestHouse.id,
        category: 'maintenance',
        description: 'Réparation climatisation',
        amount: 180,
        vendor: 'ClimService',
        status: 'paid',
        createdBy: admin.id,
      },
    }),
    prisma.expense.create({
      data: {
        guestHouseId: guestHouse.id,
        category: 'salary',
        description: 'Salaire personnel',
        amount: 2400,
        status: 'pending',
        isRecurring: true,
        recurrence: 'monthly',
        createdBy: admin.id,
      },
    }),
    prisma.expense.create({
      data: {
        guestHouseId: guestHouse.id,
        category: 'marketing',
        description: 'Publicité Booking.com',
        amount: 350,
        vendor: 'Booking.com',
        status: 'paid',
        createdBy: admin.id,
      },
    }),
  ])
  console.log('✅ Dépenses créées:', expenses.length)

  // Créer des factures
  const invoices = await Promise.all([
    prisma.invoice.create({
      data: {
        guestHouseId: guestHouse.id,
        invoiceNumber: 'INV-2024-001',
        guestId: guests[0].id,
        bookingId: bookings[0].id,
        invoiceDate: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
        subtotal: 1750,
        taxes: 175,
        total: 1925,
        status: 'paid',
        paidAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.invoice.create({
      data: {
        guestHouseId: guestHouse.id,
        invoiceNumber: 'INV-2024-002',
        guestId: guests[3].id,
        invoiceDate: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000),
        subtotal: 890,
        taxes: 89,
        total: 979,
        status: 'paid',
        paidAt: new Date(today.getTime() - 12 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.invoice.create({
      data: {
        guestHouseId: guestHouse.id,
        invoiceNumber: 'INV-2024-003',
        guestId: guests[1].id,
        bookingId: bookings[1].id,
        invoiceDate: today,
        subtotal: 360,
        taxes: 36,
        total: 396,
        status: 'draft',
      },
    }),
  ])
  console.log('✅ Factures créées:', invoices.length)

  // Créer les paramètres
  await prisma.guestHouseSetting.create({
    data: {
      guestHouseId: guestHouse.id,
      checkInTime: '15:00',
      checkOutTime: '11:00',
      minBookingNotice: 1,
      maxBookingAdvance: 365,
      emailNotifications: true,
      smsNotifications: false,
      restaurantEnabled: true,
      restaurantOpenTime: '07:00',
      restaurantCloseTime: '22:00',
    },
  })
  console.log('✅ Paramètres créés')

  console.log('\n🎉 Seed terminé avec succès!')
  console.log('\n📋 Identifiants de connexion:')
  console.log('   Email: admin@villa-azur.fr')
  console.log('   Mot de passe: password123')
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
