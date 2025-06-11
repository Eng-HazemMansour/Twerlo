import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { User, Chat, Message } from '../types';

const api = axios.create({
  baseURL: '/api',
});

const mock = new MockAdapter(api, { delayResponse: 1000 });

const mockUsers: User[] = [
  {
    id: '1',
    email: 'test@chat.com',
    name: 'Test User',
    avatar: 'https://mui.com/static/images/avatar/1.jpg',
  },
  {
    id: '2',
    email: 'jane@chat.com',
    name: 'Jane Doe',
    avatar: 'https://mui.com/static/images/avatar/2.jpg',
  },
  {
    id: '3',
    email: 'john@chat.com',
    name: 'John Smith',
    avatar: 'https://mui.com/static/images/avatar/3.jpg',
  },
  {
    id: '4',
    email: 'alice@chat.com',
    name: 'Alice Johnson',
    avatar: 'https://mui.com/static/images/avatar/4.jpg',
  }
];

const mockChats: Chat[] = [
  {
    id: '1',
    participants: [mockUsers[0], mockUsers[1]],
    unreadCount: 0,
  },
  {
    id: '2',
    participants: [mockUsers[0], mockUsers[2]],
    unreadCount: 0,
  },
  {
    id: '3',
    participants: [mockUsers[0], mockUsers[3]],
    unreadCount: 0,
  }
];

const mockMessages: { [key: string]: Message[] } = {
  '1': [
    {
      id: '1',
      senderId: '2',
      receiverId: '1',
      content: 'Hey there!',
      timestamp: new Date(Date.now() - 3600000),
      type: 'text',
      status: 'read',
    },
  ],
  '2': [
    {
      id: '2',
      senderId: '3',
      receiverId: '1',
      content: 'Hi! How are you doing?',
      timestamp: new Date(Date.now() - 7200000),
      type: 'text',
      status: 'read',
    },
  ],
};

mock.onPost('/auth/login').reply((config) => {
  const { email, password } = JSON.parse(config.data);
  if (email === 'test@chat.com' && password === '123456') {
    return [200, { user: mockUsers[0] }];
  }
  return [401, { message: 'Invalid credentials' }];
});

mock.onGet('/chats').reply(200, mockChats);

mock.onGet(/\/chats\/\d+\/messages/).reply((config) => {
  const chatId = config.url?.split('/')[2];
  if (!chatId) return [404, { message: 'Chat not found' }];
  return [200, mockMessages[chatId] || []];
});

mock.onPost(/\/chats\/\d+\/messages/).reply((config) => {
  const chatId = config.url?.split('/')[2];
  if (!chatId) return [404, { message: 'Chat not found' }];
  const messageData = JSON.parse(config.data);
  const newMessage: Message = {
    id: Date.now().toString(),
    timestamp: new Date(),
    status: 'sent',
    ...messageData,
  };
  if (!mockMessages[chatId]) {
    mockMessages[chatId] = [];
  }
  mockMessages[chatId] = [...mockMessages[chatId], newMessage];
  return [201, newMessage];
});

mock.onPost('/upload').reply(async (config) => {
  const formData = config.data as FormData;
  const file = formData.get('file') as File;

  const reader = new FileReader();
  const dataUrlPromise = new Promise<string>((resolve) => {
    reader.onload = () => {
      resolve(reader.result as string);
    };
  });
  reader.readAsDataURL(file);
  const dataUrl = await dataUrlPromise;

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        200,
        {
          url: dataUrl,
          filename: file.name,
        },
      ]);
    }, 2000);
  });
});

mock.onGet('/users').reply(() => {
  return [200, mockUsers];
});

mock.onPost('/chats').reply((config) => {
  const { participantIds } = JSON.parse(config.data);
  const participants = mockUsers.filter(user => participantIds.includes(user.id));
  
  const newChat: Chat = {
    id: (mockChats.length + 1).toString(),
    participants,
    unreadCount: 0,
  };
  
  mockChats.push(newChat);
  return [201, newChat];
});

export default api; 