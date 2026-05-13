import { faker } from '@faker-js/faker';
import { User } from '../models/user.model.js';

const departments = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical Engineering', 'Civil Engineering'];
const studentSkills = ['JavaScript', 'Python', 'Java', 'C++', 'React', 'Node.js', 'MongoDB', 'Express', 'SQL', 'HTML/CSS'];
const mentorExpertise = ['Web Development', 'Machine Learning', 'Mobile Development', 'DevOps', 'Cloud Computing', 'Data Science', 'System Design'];
const fictionalInstitutions = [
  'Northbridge Institute of Technology',
  'Summit Valley College',
  'Cedar Peak University',
  'Harborview Technical Institute',
  'Lakeside School of Engineering',
  'Meadowbrook University',
  'Pinecrest Institute',
  'Silverline College of Computing'
];

const avatarUrl = 'https://res.cloudinary.com/garvitadlakha08/image/upload/v1745998142/b2nsmmeoqfyenykzeaiu.png';
const testPassword = 'password123';

const createTestEmail = (prefix, index) => `${prefix}${String(index + 1).padStart(2, '0')}@example.com`;

const createTestName = (label, index) => `${label} ${String(index + 1).padStart(2, '0')}`;

const removeExistingMockUsers = async () => {
  await User.deleteMany({
    email: {
      $regex: /@(example\.com)$/i,
    },
  });
};

export const generateMockStudents = async (count = 5) => {
  const students = [];

  for (let i = 0; i < count; i++) {
    const studentData = {
      name: createTestName('Test Student', i),
      email: createTestEmail('student', i),
      password: testPassword,
      role: 'student',
      status: 'active',
      roll_no: `TS${String(i + 1).padStart(4, '0')}`,
      university: fictionalInstitutions[i % fictionalInstitutions.length],
      department: faker.helpers.arrayElement(departments),
      yearOfStudy: (i % 4) + 1,
      skills: faker.helpers.shuffle(studentSkills).slice(0, 4),
      cgpa: Number((7.2 + (i % 8) * 0.3).toFixed(2)),
      bio: `Synthetic test student profile ${String(i + 1).padStart(2, '0')} for local development.`,
      avatar: {
        publicId: 'default_avatar.png',
        url: avatarUrl
      },
      availability: true,
    };

    try {
      const student = await User.create(studentData);
      students.push(student);
      console.log(`✅ Created student: ${studentData.email} (Roll: ${studentData.roll_no})`);
    } catch (error) {
      if (error.code === 11000) {
        console.log(`⚠️ Student already exists: ${studentData.email}`);
      } else {
        console.error(`❌ Failed to create student: ${studentData.email}`, error.message);
      }
    }
  }

  return students;
};

export const generateMockMentors = async (count = 5) => {
  const mentors = [];

  for (let i = 0; i < count; i++) {
    const mentorData = {
      name: createTestName('Test Mentor', i),
      email: createTestEmail('mentor', i),
      password: testPassword,
      role: 'mentor',
      status: 'active',
      university: fictionalInstitutions[i % fictionalInstitutions.length],
      department: faker.helpers.arrayElement(departments),
      expertise: faker.helpers.shuffle(mentorExpertise).slice(0, 3),
      bio: `Synthetic test mentor profile ${String(i + 1).padStart(2, '0')} for local development.`,
      avatar: {
        publicId: 'default_avatar.png',
        url: avatarUrl
      },
      availability: true,
    };

    try {
      const mentor = await User.create(mentorData);
      mentors.push(mentor);
      console.log(`✅ Created mentor: ${mentorData.email} (Expertise: ${mentorData.expertise.join(', ')})`);
    } catch (error) {
      if (error.code === 11000) {
        console.log(`⚠️ Mentor already exists: ${mentorData.email}`);
      } else {
        console.error(`❌ Failed to create mentor: ${mentorData.email}`, error.message);
      }
    }
  }

  return mentors;
};

export const seedMockData = async (studentCount = 5, mentorCount = 5) => {
  try {
    console.log('\n🌱 Starting mock data seeding...\n');

    console.log('🧹 Removing previous example.com mock users...');
    await removeExistingMockUsers();
    
    console.log(`📚 Generating ${studentCount} mock students...`);
    const students = await generateMockStudents(studentCount);
    
    console.log(`\n👨‍🏫 Generating ${mentorCount} mock mentors...`);
    const mentors = await generateMockMentors(mentorCount);
    
    console.log(`\n✨ Mock data seeding completed!`);
    console.log(`   - Students created: ${students.length}`);
    console.log(`   - Mentors created: ${mentors.length}`);
    console.log(`\n📝 Test Credentials: password123`);
    console.log(`   - Students: student01@example.com, student02@example.com, ...`);
    console.log(`   - Mentors: mentor01@example.com, mentor02@example.com, ...\n`);

    return { students, mentors };
  } catch (error) {
    console.error('❌ Error seeding mock data:', error.message);
    throw error;
  }
};
