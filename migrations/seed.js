require('dotenv').config();
const pool = require('../src/config/db');

const doctors = [
  { name: 'Dr. Ananya Sharma',   phone: '+919876500001', specialty: 'general',      home_visit_price: 500,  call_price: 200 },
  { name: 'Dr. Rohan Mehta',     phone: '+919876500002', specialty: 'cardiology',   home_visit_price: 1200, call_price: 500 },
  { name: 'Dr. Priya Nair',      phone: '+919876500003', specialty: 'diabetes',     home_visit_price: 800,  call_price: 300 },
  { name: 'Dr. Suresh Iyer',     phone: '+919876500004', specialty: 'paediatrics',  home_visit_price: 700,  call_price: 250 },
  { name: 'Dr. Kavita Desai',    phone: '+919876500005', specialty: 'orthopaedics', home_visit_price: 1000, call_price: 400 },
  { name: 'Dr. Amit Verma',      phone: '+919876500006', specialty: 'general',      home_visit_price: 450,  call_price: 180 },
  { name: 'Dr. Sunita Rao',      phone: '+919876500007', specialty: 'diabetes',     home_visit_price: 850,  call_price: 350 },
  { name: 'Dr. Vikram Joshi',    phone: '+919876500008', specialty: 'cardiology',   home_visit_price: 1100, call_price: 450 },
];

const patients = [
  { name: 'Rahul Gupta',    phone: '+919800000001', address: '12 MG Road, Pune, Maharashtra 411001' },
  { name: 'Sneha Patil',    phone: '+919800000002', address: '45 FC Road, Pune, Maharashtra 411004' },
  { name: 'Arjun Kulkarni', phone: '+919800000003', address: '7 Baner Road, Pune, Maharashtra 411045' },
  { name: 'Meera Jain',     phone: '+919800000004', address: '22 Koregaon Park, Pune, Maharashtra 411001' },
  { name: 'Kiran Reddy',    phone: '+919800000005', address: '3 Hadapsar, Pune, Maharashtra 411028' },
];

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const d of doctors) {
      await client.query(
        `INSERT INTO doctors (name, phone, specialty, home_visit_price, call_price)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (phone) DO NOTHING`,
        [d.name, d.phone, d.specialty, d.home_visit_price, d.call_price]
      );
    }

    for (const p of patients) {
      await client.query(
        `INSERT INTO patients (name, phone, address)
         VALUES ($1, $2, $3)
         ON CONFLICT (phone) DO NOTHING`,
        [p.name, p.phone, p.address]
      );
    }

    await client.query('COMMIT');
    console.log(`Seeded ${doctors.length} doctors and ${patients.length} patients.`);
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
