import { faker } from '@faker-js/faker';

const generateProjects = (users, count = 10) => {
  const projects = [];
  
  // Filter mentors and students
  const mentors = users.filter(user => user.role === 'mentor');
  const students = users.filter(user => user.role === 'student');
  
  for (let i = 0; i < count; i++) {
    // Get random mentor and up to 4 students
    const mentor = mentors[faker.number.int({ min: 0, max: mentors.length - 1 })];
    const numStudents = faker.number.int({ min: 1, max: 4 });
    const projectStudents = faker.helpers.arrayElements(students, numStudents);
    
    projects.push({
      title: faker.company.catchPhrase(),
      description: faker.lorem.paragraph(),
      status: faker.helpers.arrayElement(['active', 'completed', 'on-hold']),
      technologies: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, 
        () => faker.hacker.noun()),
      mentorId: mentor._id,
      studentIds: projectStudents.map(student => student._id),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
    });
  }
  return projects;
};

export default generateProjects;
