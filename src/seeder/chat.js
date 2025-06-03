import { faker } from '@faker-js/faker';

const generateChats = (count = 10) => {
  const chats = [];
  for (let i = 0; i < count; i++) {
    chats.push({
      mentorId: null, // to be set when using
      studentId: null, // to be set when using
      lastMessage: faker.lorem.sentence(),
      isActive: faker.datatype.boolean(),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
    });
  }
  return chats;
};

export default generateChats;
