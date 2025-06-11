export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'image' | 'video';
  mediaUrl?: string;
  status: 'sent' | 'delivered' | 'read';
}

export interface Chat {
  id: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  isGroup?: boolean;
  groupName?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export interface MediaUpload {
  id: string;
  file: File;
  progress: number;
  previewUrl: string;
  status: 'uploading' | 'completed' | 'error';
}