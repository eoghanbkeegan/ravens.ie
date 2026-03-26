import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // ── Races ──────────────────────────────────────────────
  await prisma.race.createMany({
    data: [
      { round: 1, date: new Date('2026-04-21'), time: '7:30 PM', isParaCycling: false },
      { round: 2, date: new Date('2026-05-05'), time: '7:30 PM', isParaCycling: false },
      { round: 3, date: new Date('2026-05-19'), time: '7:30 PM', isParaCycling: false },
      { round: 4, date: new Date('2026-06-23'), time: '6:00 PM', isParaCycling: true },
      { round: 5, date: new Date('2026-07-28'), time: '7:30 PM', isParaCycling: false },
      { round: 6, date: new Date('2026-08-11'), time: '7:30 PM', isParaCycling: false },
      { round: 7, date: new Date('2026-08-18'), time: '7:00 PM', isParaCycling: false },
    ],
    skipDuplicates: true,
  })

  // ── Demo members ───────────────────────────────────────
  await prisma.member.createMany({
    data: [
      { email: 'admin@ravens.ie',   name: 'Simon Ward',     role: 'ADMIN'  },
      { email: 'rider1@ravens.ie',  name: 'Aoife Murphy',   role: 'MEMBER' },
      { email: 'rider2@ravens.ie',  name: 'Ciarán Kelly',   role: 'MEMBER' },
      { email: 'rider3@ravens.ie',  name: 'Niamh O\'Brien', role: 'MEMBER' },
      { email: 'rider4@ravens.ie',  name: 'Seán Doyle',     role: 'MEMBER' },
      { email: 'rider5@ravens.ie',  name: 'Laura Byrne',    role: 'MEMBER' },
    ],
    skipDuplicates: true,
  })

  console.log('✅ Seeded: 7 races + 6 demo members')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())