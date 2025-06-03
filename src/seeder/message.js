import { faker } from '@faker-js/faker';

const generateMessages = (chats, users, count = 50) => {
  const messages = [];
  for (let i = 0; i < count; i++) {
    // Get a random chat
    const chat = chats[faker.number.int({ min: 0, max: chats.length - 1 })];
    
    // Get possible senders (mentor and student from the chat)
    const possibleSenders = [
      users.find(user => user._id === chat.mentorId),
      users.find(user => user._id === chat.studentId)
    ].filter(Boolean);

    // Select random sender from possible senders
    const sender = faker.helpers.arrayElement(possibleSenders);

    messages.push({
      chatId: chat._id,
      senderId: sender._id,
      content: faker.lorem.paragraph(),
      isRead: faker.datatype.boolean(),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
    });
  }
  return messages;
};

export default generateMessages;
