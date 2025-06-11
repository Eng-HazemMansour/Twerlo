import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Avatar,
  CircularProgress,
  LinearProgress,
  ImageList,
  ImageListItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Tooltip,
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Campaign as CampaignIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

import useStore from '../store/useStore';
import api from '../services/api';
import { Message, User, Chat } from '../types';

interface UploadingFile {
  file: File;
  progress: number;
  previewUrl?: string;
  uploadedUrl?: string;
  abortController?: AbortController;
}

interface ProgressEvent {
  loaded: number;
  total?: number;
}

interface BroadcastDialogProps {
  open: boolean;
  onClose: () => void;
  onBroadcast: (userIds: string[]) => void;
}

const BroadcastDialog: React.FC<BroadcastDialogProps> = ({ open, onClose, onBroadcast }) => {
  const { auth } = useStore();
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get<User[]>('/users');
        const filteredUsers = response.data.filter((user: User) => user.id !== auth.user?.id);
        setUsers(filteredUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchUsers();
      setSelectedUsers([]);
    }
  }, [open, auth.user?.id]);

  const handleToggleUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.id));
    }
  };

  const handleBroadcast = () => {
    onBroadcast(selectedUsers);
    setSelectedUsers([]);
    onClose();
  };

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose}>
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      PaperProps={{
        sx: { minWidth: { xs: '90%', sm: 400 } }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Broadcast Message</h2>
          <Button onClick={handleSelectAll} color="primary">
            {selectedUsers.length === users.length ? 'Deselect All' : 'Select All'}
          </Button>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <p style={{ color: 'text.secondary', marginBottom: '16px' }}>
          Selected: {selectedUsers.length} of {users.length} users
        </p>
        <List sx={{ minWidth: 300, maxHeight: 400, overflowY: 'auto' }}>
          {users.map(user => (
            <ListItem 
              key={user.id} 
              button 
              onClick={() => handleToggleUser(user.id)}
              sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
            >
              <ListItemIcon>
                <Checkbox
                  edge="start"
                  checked={selectedUsers.includes(user.id)}
                  tabIndex={-1}
                  disableRipple
                />
              </ListItemIcon>
              <ListItemText 
                primary={user.name} 
                secondary={user.email}
                primaryTypographyProps={{
                  variant: 'body1',
                  fontWeight: selectedUsers.includes(user.id) ? 'bold' : 'normal',
                }}
              />
              <Avatar src={user.avatar} sx={{ ml: 2 }} />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button
          onClick={handleBroadcast}
          variant="contained"
          disabled={selectedUsers.length === 0}
          startIcon={<CampaignIcon />}
        >
          Broadcast ({selectedUsers.length})
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const ChatWindow: React.FC = () => {
  const { auth, activeChat, messages: storeMessages, chats: storeChats } = useStore();
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, UploadingFile>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [broadcastDialogOpen, setBroadcastDialogOpen] = useState(false);

  const messages = storeMessages[activeChat?.id || ''] || [];
  
  const hasUploadingFiles = () => {
    return Object.values(uploadingFiles).some(file => !file.uploadedUrl);
  };

  const getSendButtonTooltip = () => {
    if (hasUploadingFiles()) {
      return "Waiting for files to upload...";
    }
    if (!newMessage.trim() && Object.keys(uploadingFiles).length === 0) {
      return "Type a message or attach files";
    }
    return "Send message";
  };

  useEffect(() => {
    const fetchMessages = async () => {
      if (!activeChat) return;
      
      setIsLoading(true);
      try {
        const response = await api.get(`/chats/${activeChat.id}/messages`);
        useStore.setState((state) => ({
          messages: {
            ...state.messages,
            [activeChat.id]: response.data,
          },
        }));
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast.error('Failed to load messages');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [activeChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      Object.values(uploadingFiles).forEach((file) => {
        if (file.previewUrl) {
          URL.revokeObjectURL(file.previewUrl);
        }
      });
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && Object.keys(uploadingFiles).length === 0) return;
    if (!activeChat || !auth.user) return;

    try {
      if (newMessage.trim()) {
        const response = await api.post(`/chats/${activeChat.id}/messages`, {
          content: newMessage,
          type: 'text',
          senderId: auth.user.id,
          receiverId: activeChat.id,
        });

        useStore.setState((state) => ({
          messages: {
            ...state.messages,
            [activeChat.id]: [...(state.messages[activeChat.id] || []), response.data],
          },
        }));

        useStore.setState((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === activeChat.id
              ? { ...chat, lastMessage: response.data }
              : chat
          ),
        }));
      }

      const uploadedFiles = Object.entries(uploadingFiles).filter(([_, file]) => file.uploadedUrl);
      for (const [_, uploadingFile] of uploadedFiles) {
        const isImage = uploadingFile.file.type.startsWith('image/');
        const messageResponse = await api.post(`/chats/${activeChat.id}/messages`, {
          content: '',
          type: isImage ? 'image' : 'video',
          mediaUrl: uploadingFile.uploadedUrl,
          senderId: auth.user.id,
          receiverId: activeChat.id,
        });

        useStore.setState((state) => ({
          messages: {
            ...state.messages,
            [activeChat.id]: [...(state.messages[activeChat.id] || []), messageResponse.data],
          },
          chats: state.chats.map((chat) =>
            chat.id === activeChat.id
              ? { ...chat, lastMessage: messageResponse.data }
              : chat
          ),
        }));
      }

      setNewMessage('');
      setUploadingFiles({});
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !activeChat || !auth.user) return;

    for (const file of Array.from(files) as File[]) {
      const fileId = Date.now().toString();
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (!isImage && !isVideo) {
        toast.error('Only images and videos are supported');
        continue;
      }

      try {
        const reader = new FileReader();
        const previewPromise = new Promise<string>((resolve) => {
          reader.onload = (e) => {
            resolve(e.target?.result as string);
          };
        });
        reader.readAsDataURL(file);
        const previewUrl = await previewPromise;

        const abortController = new AbortController();
        
        setUploadingFiles((prev) => {
          const newState = {
            ...prev,
            [fileId]: { file, progress: 0, previewUrl, abortController },
          };
          return newState;
        });

        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post('/upload', formData, {
          signal: abortController.signal,
          onUploadProgress: (progressEvent: ProgressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 100)
            );
            setUploadingFiles((prev) => ({
              ...prev,
              [fileId]: { ...prev[fileId], progress },
            }));
          },
        });

        setUploadingFiles((prev) => ({
          ...prev,
          [fileId]: { ...prev[fileId], uploadedUrl: response.data.url },
        }));

        toast.success('File uploaded successfully');
      } catch (error) {
        console.error('Error details:', error);
        if (!(error instanceof Error) || error.name !== 'AbortError') {
          toast.error('Failed to upload file');
        }
        
        setUploadingFiles((prev) => {
          const { [fileId]: removed, ...rest } = prev;
          return rest;
        });
      }
    }

    event.target.value = '';
  };

  const handleBroadcast = async (userIds: string[]) => {
    if (!newMessage.trim() || !auth.user) return;

    try {
      for (const userId of userIds) {
        let targetChat: Chat | undefined = storeChats.find(chat =>
          chat.participants.length === 2 &&
          chat.participants.some(p => p.id === userId) &&
          chat.participants.some(p => p.id === auth.user?.id)
        );

        if (!targetChat) {
          const response = await api.post<Chat>('/chats', {
            participantIds: [auth.user.id, userId],
          });
          targetChat = response.data;
          useStore.setState(state => ({
            chats: [...state.chats, targetChat as Chat],
          }));
        }

        if (!targetChat) {
          console.error('Failed to create or find chat with user:', userId);
          continue;
        }

        const response = await api.post(`/chats/${targetChat.id}/messages`, {
          content: newMessage,
          type: 'text',
          senderId: auth.user.id,
          receiverId: userId,
        });

        useStore.setState((state) => ({
          messages: {
            ...state.messages,
            [targetChat!.id]: [...(state.messages[targetChat!.id] || []), response.data],
          },
          chats: state.chats.map((chat) =>
            chat.id === targetChat!.id
              ? { ...chat, lastMessage: response.data }
              : chat
          ),
        }));
      }

      setNewMessage('');
      toast.success('Broadcast sent successfully!');
    } catch (error) {
      console.error('Error broadcasting message:', error);
      toast.error('Failed to broadcast message');
    }
  };

  const renderMessage = (message: Message) => {
    const isOwnMessage = message.senderId === auth.user?.id;

    return (
      <div
        key={message.id}
        style={{
          display: 'flex',
          justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
          marginBottom: '16px',
        }}
      >
        {!isOwnMessage && (
          <Avatar
            src={activeChat?.participants.find((p) => p.id === message.senderId)?.avatar}
            sx={{ mr: 1 }}
          />
        )}
        <div style={{ maxWidth: '70%', minWidth: '100px' }}>
          <div
            style={{
              padding: '16px',
              backgroundColor: isOwnMessage ? 'var(--primary-main)' : 'var(--background-paper)',
              color: isOwnMessage ? 'var(--primary-contrast-text)' : 'var(--text-primary)',
              borderRadius: '8px',
            }}
          >
            {message.type === 'text' ? (
              <p>{message.content}</p>
            ) : message.type === 'image' ? (
              <img
                src={message.mediaUrl}
                alt="Shared image"
                style={{
                  maxWidth: '100%',
                  maxHeight: '300px',
                  objectFit: 'contain',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
                onClick={() => window.open(message.mediaUrl, '_blank')}
                onError={(e) => {
                  console.error('Error loading image:', e);
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5FcnJvciBsb2FkaW5nIGltYWdlPC90ZXh0Pjwvc3ZnPg==';
                }}
              />
            ) : (
              <video
                controls
                style={{
                  maxWidth: '100%',
                  borderRadius: '4px',
                }}
              >
                <source src={message.mediaUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            )}
            <small
              style={{
                display: 'block',
                marginTop: '4px',
                color: isOwnMessage ? 'var(--primary-contrast-text)' : 'var(--text-secondary)',
                opacity: 0.8,
              }}
            >
              {format(new Date(message.timestamp), 'p')}
            </small>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
          <CircularProgress />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', backgroundColor: 'var(--background-default)' }}>
        {messages.map(renderMessage)}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {Object.keys(uploadingFiles).length > 0 && (
          <div style={{ 
            padding: '16px', 
            backgroundColor: 'var(--background-paper)', 
            borderTop: '1px solid var(--divider)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ margin: 0, fontSize: '0.75rem' }}>
                Uploading {Object.keys(uploadingFiles).length} file(s)
              </p>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  Object.values(uploadingFiles).forEach(file => {
                    if (file?.abortController && !file.uploadedUrl) {
                      file.abortController.abort();
                    }
                  });
                  setUploadingFiles({});
                }}
                sx={{ opacity: 0.7 }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </div>
            <ImageList cols={3} rowHeight={100} gap={8}>
              {Object.entries(uploadingFiles).map(([fileId, uploadingFile]) => {
                if (!uploadingFile) return null;
                const isVideo = uploadingFile.file?.type?.startsWith('video/') || false;
                return (
                  <ImageListItem 
                    key={fileId}
                    sx={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      '&:hover .remove-button': {
                        opacity: 1,
                      },
                    }}
                  >
                    <div style={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      height: '100px',
                      width: '100%',
                    }}>
                      <div style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'var(--grey-100)',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        padding: isVideo ? '8px' : '0',
                      }}>
                        {isVideo ? (
                          <p style={{
                            margin: 0,
                            textAlign: 'center',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}>
                            {uploadingFile.file?.name || 'Unknown file'}
                          </p>
                        ) : (
                          <img
                            src={uploadingFile.previewUrl}
                            alt={uploadingFile.file?.name || 'Uploading file'}
                            loading="lazy"
                            style={{ 
                              height: '100%', 
                              width: '100%',
                              objectFit: 'cover',
                            }}
                            onError={(e) => {
                              console.error('Error loading preview:', e);
                              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5FcnJvciBsb2FkaW5nIGltYWdlPC90ZXh0Pjwvc3ZnPg==';
                            }}
                          />
                        )}
                      </div>
                      <div style={{ 
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        justifyContent: 'flex-end',
                        padding: '4px',
                      }}>
                        <IconButton
                          size="small"
                          className="remove-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            if (uploadingFile.abortController && !uploadingFile.uploadedUrl) {
                              uploadingFile.abortController.abort();
                            }
                            setUploadingFiles(prev => {
                              const { [fileId]: removed, ...rest } = prev;
                              return rest;
                            });
                          }}
                          sx={{
                            bgcolor: 'rgba(0, 0, 0, 0.5)',
                            opacity: 0,
                            transition: 'opacity 0.2s',
                            '&:hover': {
                              bgcolor: 'rgba(0, 0, 0, 0.7)',
                            },
                            '& .MuiSvgIcon-root': {
                              color: 'white',
                            },
                          }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </div>
                      <LinearProgress
                        variant="determinate"
                        value={uploadingFile.progress}
                        sx={{ width: '100%' }}
                      />
                    </div>
                  </ImageListItem>
                );
              })}
            </ImageList>
          </div>
        )}

        <div style={{ 
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'var(--background-paper)',
        }}>
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            style={{ display: 'none' }}
            ref={fileInputRef}
            onChange={handleFileSelect}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <IconButton
              color="primary"
              onClick={() => fileInputRef.current?.click()}
              size="medium"
            >
              <AttachFileIcon />
            </IconButton>
            <Tooltip 
              title={!newMessage.trim() ? "Type a message first" : "Broadcast Message"} 
              arrow
              placement="top"
            >
              <span>
                <IconButton
                  color="primary"
                  onClick={() => setBroadcastDialogOpen(true)}
                  size="medium"
                  disabled={!newMessage.trim()}
                  sx={{
                    '&:hover': {
                      backgroundColor: theme => !newMessage.trim() ? 'transparent' : theme.palette.primary.light,
                    },
                    opacity: theme => !newMessage.trim() ? 0.38 : 1,
                  }}
                >
                  <CampaignIcon />
                </IconButton>
              </span>
            </Tooltip>
          </div>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !hasUploadingFiles()) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            placeholder="Type a message..."
            variant="outlined"
            size="small"
          />
          <Tooltip 
            title={getSendButtonTooltip()}
            arrow
            placement="top"
          >
            <span>
              <IconButton
                color="primary"
                onClick={handleSendMessage}
                disabled={hasUploadingFiles() || (!newMessage.trim() && Object.keys(uploadingFiles).length === 0)}
                size="medium"
              >
                <SendIcon />
              </IconButton>
            </span>
          </Tooltip>
        </div>
      </div>

      <BroadcastDialog
        open={broadcastDialogOpen}
        onClose={() => setBroadcastDialogOpen(false)}
        onBroadcast={handleBroadcast}
      />
    </div>
  );
};

export default ChatWindow; 