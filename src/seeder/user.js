// import { faker } from '@faker-js/faker';
// import axios from 'axios';

// const generateUsers = async (count = 10) => {
//   const users = [];
//   for (let i = 0; i < count; i++) {
//     const role = faker.helpers.arrayElement(['student', 'mentor']);
//     const userData = {
//       name: faker.person.fullName(),
//       email: faker.internet.email(),
//       password: 'password123',
//       role,
//       university: faker.company.name() + ' University',
//       department: faker.helpers.arrayElement(['Computer Science', 'IT', 'Electronics', 'Mechanical']),
//     };

//     if (role === 'student') {
//       userData.roll_no = faker.number.int({ min: 10000, max: 99999 }).toString();
//       userData.sap_id = faker.number.int({ min: 500000, max: 599999 }).toString();
//       userData.yearOfStudy = faker.number.int({ min: 1, max: 4 });
//       userData.skills = Array(3).fill().map(() => faker.helpers.arrayElement(['JavaScript', 'Python', 'Java', 'C++', 'React']));
//       userData.cgpa = faker.number.float({ min: 6, max: 10, precision: 0.01 });
//     } else {
//       userData.expertise = Array(3).fill().map(() => faker.helpers.arrayElement(['Web Development', 'Machine Learning', 'Mobile Development', 'DevOps']));
//     }

//     try {
//       const response = await axios.post('http://localhost:8000/api/v1/user/register', userData);
//       console.log(`Created user: ${userData.email}`);
//       users.push(response.data);
//     } catch (error) {
//       console.error(`Failed to create user: ${userData.email}`, error.response?.data || error.message);
//     }
//   }
  
//   return users;
// };

// export default generateUsers;
