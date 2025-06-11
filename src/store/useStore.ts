import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState, Chat, Message, User } from '../types';

interface AppState {
  auth: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  
  isDarkMode: boolean;
  toggleTheme: () => void;
  
  chats: Chat[];
  activeChat: Chat | null;
  messages: { [chatId: string]: Message[] };
  setActiveChat: (chat: Chat | null) => void;
  sendMessage: (chatId: string, content: string, type: 'text' | 'image' | 'video', mediaUrl?: string) => Promise<void>;
  
  uploadProgress: { [fileId: string]: number };
  setUploadProgress: (fileId: string, progress: number) => void;
}

const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      auth: {
        user: null,
        isAuthenticated: false,
      },
      login: async (email, password) => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (email === 'test@chat.com' && password === '123456') {
          set({
            auth: {
              user: {
                id: '1',
                email,
                name: 'Test User',
                avatar: 'https://mui.com/static/images/avatar/1.jpg',
              },
              isAuthenticated: true,
            },
          });
        } else {
          throw new Error('Invalid credentials');
        }
      },
      logout: () => {
        set({
          auth: {
            user: null,
            isAuthenticated: false,
          },
        });
      },
      
      isDarkMode: false,
      toggleTheme: () => set(state => ({ isDarkMode: !state.isDarkMode })),
      
      chats: [],
      activeChat: null,
      messages: {},
      setActiveChat: (chat) => set({ activeChat: chat }),
      sendMessage: async (chatId, content, type, mediaUrl) => {
        const { auth, messages } = get();
        if (!auth.user) return;
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const newMessage: Message = {
          id: Date.now().toString(),
          senderId: auth.user.id,
          receiverId: chatId,
          content,
          timestamp: new Date(),
          type,
          mediaUrl,
          status: 'sent',
        };
        
        set({
          messages: {
            ...messages,
            [chatId]: [...(messages[chatId] || []), newMessage],
          },
        });
      },
      
      uploadProgress: {},
      setUploadProgress: (fileId, progress) => 
        set(state => ({
          uploadProgress: {
            ...state.uploadProgress,
            [fileId]: progress,
          },
        })),
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({
        auth: state.auth,
        isDarkMode: state.isDarkMode,
      }),
    }
  )
);

export default useStore; 