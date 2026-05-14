require('dotenv').config();
const pool = require('../src/config/db');

// days offset from now
const daysFromNow = (d) => new Date(Date.now() + d * 86400_000).toISOString();

async function seed() {
  const client = await pool.connect();
  try {
    const { rows: doctors  } = await client.query('SELECT id, name, specialty FROM doctors ORDER BY specialty, name');
    const { rows: patients } = await client.query('SELECT id, name, address FROM patients ORDER BY name');

    if (!doctors.length || !patients.length) {
      console.error('No doctors or patients found — run seed.js first.');
      process.exit(1);
    }

    // shorthand aliases
    const [amit, ananya, kavita, priya, rohan, suresh, sunita, vikram] = doctors;
    const [arjun, kiran, meera, rahul, sneha] = patients;

    await client.query('BEGIN');

    // ── Bookings ────────────────────────────────────────────────────────────────
    // Mix of statuses, types, and schedules spread across past / present / future
    const bookingRows = [
      // completed home visits (will get ratings)
      [rahul.id,  ananya.id, 'home_visit', 'completed', daysFromNow(-10), rahul.address ],
      [sneha.id,  rohan.id,  'home_visit', 'completed', daysFromNow(-8),  sneha.address ],
      [arjun.id,  priya.id,  'home_visit', 'completed', daysFromNow(-7),  arjun.address ],
      [meera.id,  suresh.id, 'home_visit', 'completed', daysFromNow(-6),  meera.address ],
      [kiran.id,  kavita.id, 'home_visit', 'completed', daysFromNow(-5),  kiran.address ],
      [rahul.id,  vikram.id, 'home_visit', 'completed', daysFromNow(-4),  rahul.address ],
      [sneha.id,  sunita.id, 'home_visit', 'completed', daysFromNow(-3),  sneha.address ],
      [arjun.id,  amit.id,   'home_visit', 'completed', daysFromNow(-2),  arjun.address ],

      // completed calls (will get ratings)
      [meera.id,  ananya.id, 'call', 'completed', daysFromNow(-9),  null],
      [kiran.id,  priya.id,  'call', 'completed', daysFromNow(-6),  null],
      [rahul.id,  suresh.id, 'call', 'completed', daysFromNow(-4),  null],
      [sneha.id,  amit.id,   'call', 'completed', daysFromNow(-2),  null],

      // confirmed — upcoming
      [arjun.id,  rohan.id,  'home_visit', 'confirmed', daysFromNow(1), arjun.address],
      [meera.id,  kavita.id, 'call',       'confirmed', daysFromNow(2), null         ],
      [kiran.id,  vikram.id, 'home_visit', 'confirmed', daysFromNow(3), kiran.address],

      // pending — just created
      [rahul.id,  sunita.id, 'call',       'pending', daysFromNow(4), null         ],
      [sneha.id,  ananya.id, 'home_visit', 'pending', daysFromNow(5), sneha.address],

      // cancelled
      [arjun.id,  priya.id,  'call',       'cancelled', daysFromNow(-1), null         ],
      [meera.id,  rohan.id,  'home_visit', 'cancelled', daysFromNow(-3), meera.address],
    ];

    const bookingIds = [];
    for (const [pid, did, btype, status, sat, addr] of bookingRows) {
      const { rows } = await client.query(
        `INSERT INTO bookings (patient_id, doctor_id, booking_type, status, scheduled_at, patient_address)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, doctor_id, patient_id, status`,
        [pid, did, btype, status, sat, addr]
      );
      bookingIds.push(rows[0]);
    }

    // ── Ratings (only for completed bookings) ───────────────────────────────────
    // stars chosen to give each doctor a believable spread
    const starsMap = [5, 4, 5, 4, 5, 3, 4, 5, 4, 5, 4, 5]; // index-aligned with completed rows
    const completed = bookingIds.filter(b => b.status === 'completed');

    for (let i = 0; i < completed.length; i++) {
      const b = completed[i];
      const stars = starsMap[i] ?? 4;
      await client.query(
        `INSERT INTO ratings (booking_id, patient_id, doctor_id, stars)
         VALUES ($1,$2,$3,$4)`,
        [b.id, b.patient_id, b.doctor_id, stars]
      );
    }

    // ── Refresh avg_rating / rating_count on doctors ────────────────────────────
    await client.query(`
      UPDATE doctors d
      SET avg_rating   = sub.avg,
          rating_count = sub.cnt
      FROM (
        SELECT doctor_id, ROUND(AVG(stars)::numeric, 2) AS avg, COUNT(*) AS cnt
        FROM ratings
        GROUP BY doctor_id
      ) sub
      WHERE d.id = sub.doctor_id
    `);

    await client.query('COMMIT');

    console.log(`Seeded ${bookingIds.length} bookings and ${completed.length} ratings.`);

    // quick summary
    const { rows: summary } = await client.query(
      `SELECT name, avg_rating, rating_count FROM doctors ORDER BY avg_rating DESC`
    );
    console.log('\nDoctor ratings after seed:');
    summary.forEach(r => console.log(`  ${r.name.padEnd(22)} avg=${r.avg_rating}  (${r.rating_count} rating${r.rating_count !== '1' ? 's' : ''})`));
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
