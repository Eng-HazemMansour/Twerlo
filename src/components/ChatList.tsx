import React, { useEffect, useState } from 'react';
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Badge,
  Toolbar,
  TextField,
  InputAdornment,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import useStore from '../store/useStore';
import api from '../services/api';
import { Chat, User } from '../types';

const ChatList: React.FC = () => {
  const { auth, chats: storeChats, setActiveChat, activeChat } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await api.get('/chats');
        const chats = response.data;
        useStore.setState({ chats });

        for (const chat of chats) {
          try {
            const messagesResponse = await api.get(`/chats/${chat.id}/messages`);
            useStore.setState((state) => ({
              messages: {
                ...state.messages,
                [chat.id]: messagesResponse.data,
              },
            }));
          } catch (error) {
            console.error(`Error fetching messages for chat ${chat.id}:`, error);
          }
        }
      } catch (error) {
        console.error('Error fetching chats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, []);

  const filteredChats = storeChats.filter((chat) => {
    const otherParticipant = chat.participants.find(
      (p) => p.id !== auth.user?.id
    );
    const searchString = chat.isGroup
      ? chat.groupName?.toLowerCase()
      : otherParticipant?.name.toLowerCase();
    return searchString?.includes(searchQuery.toLowerCase());
  });

  const getLastMessage = (chat: Chat) => {
    const chatMessages = useStore.getState().messages[chat.id];
    if (!chatMessages || chatMessages.length === 0) return 'No messages yet';
    
    const lastMessage = chatMessages[chatMessages.length - 1];
    if (lastMessage.type !== 'text') {
      return lastMessage.type === 'image' ? '📷 Image' : '🎥 Video';
    }
    return lastMessage.content;
  };

  const getParticipantName = (chat: Chat) => {
    if (chat.isGroup) return chat.groupName;
    const otherParticipant = chat.participants.find(
      (p) => p.id !== auth.user?.id
    );
    return otherParticipant?.name || 'Unknown User';
  };

  const getParticipantAvatar = (chat: Chat) => {
    if (chat.isGroup) return '/group-avatar.png';
    const otherParticipant = chat.participants.find(
      (p) => p.id !== auth.user?.id
    );
    return otherParticipant?.avatar;
  };

  if (loading) {
    return (
      <div style={{ padding: '16px' }}>
        <p>Loading chats...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <header style={{ 
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        minHeight: '64px',
        borderBottom: '1px solid var(--divider)'
      }}>
        <h1 style={{ 
          margin: 0,
          fontSize: '1.25rem',
          fontWeight: 500,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          Chats
        </h1>
      </header>

      <div style={{ padding: '16px' }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search chats..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </div>

      <List sx={{ width: '100%', bgcolor: 'background.paper', flex: 1, overflowY: 'auto' }}>
        {filteredChats.map((chat) => (
          <React.Fragment key={chat.id}>
            <ListItem
              alignItems="flex-start"
              button
              selected={activeChat?.id === chat.id}
              onClick={() => setActiveChat(chat)}
            >
              <ListItemAvatar>
                <Badge
                  badgeContent={chat.unreadCount}
                  color="primary"
                  invisible={chat.unreadCount === 0}
                >
                  <Avatar alt={getParticipantName(chat)} src={getParticipantAvatar(chat)} />
                </Badge>
              </ListItemAvatar>
              <ListItemText
                primary={getParticipantName(chat)}
                secondary={
                  <div>
                    <p style={{
                      display: 'inline',
                      margin: 0,
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem'
                    }}>
                      {getLastMessage(chat)}
                    </p>
                    {chat.lastMessage && (
                      <time
                        style={{
                          display: 'block',
                          color: 'var(--text-secondary)',
                          fontSize: '0.75rem'
                        }}
                      >
                        {format(new Date(chat.lastMessage.timestamp), 'p')}
                      </time>
                    )}
                  </div>
                }
              />
            </ListItem>
            <hr style={{ 
              margin: 0,
              marginLeft: '72px',
              border: 'none',
              borderBottom: '1px solid var(--divider)',
              opacity: 0.4
            }} />
          </React.Fragment>
        ))}
      </List>
    </div>
  );
};

export default ChatList; 