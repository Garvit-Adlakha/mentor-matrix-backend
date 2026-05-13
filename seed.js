import dotenv from 'dotenv';
import connectDB from './src/database/db.js';
import { seedMockData } from './src/seeder/mockDataSeeder.js';

dotenv.config();

const runSeeder = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Get counts from command line args or use defaults
    const studentCount = parseInt(process.argv[2]) || 5;
    const mentorCount = parseInt(process.argv[3]) || 5;

    // Seed mock data
    await seedMockData(studentCount, mentorCount);

    console.log('\n✅ Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

runSeeder();
