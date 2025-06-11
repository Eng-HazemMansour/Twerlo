import React, { useState, useEffect } from 'react';
import {
  Drawer,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  DarkMode,
  LightMode,
  ExitToApp,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import useStore from '../store/useStore';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';

const DRAWER_WIDTH = 320;

const Chat: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const { isDarkMode, toggleTheme, logout, auth, activeChat } = useStore();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.info('Logged out successfully');
  };

  useEffect(() => {
    if (isMobile && activeChat) {
      setMobileOpen(false);
    }
  }, [activeChat, isMobile]);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <header style={{
        position: 'fixed',
        width: isMobile ? '100%' : `calc(100% - ${DRAWER_WIDTH}px)`,
        marginLeft: isMobile ? 0 : `${DRAWER_WIDTH}px`,
        backgroundColor: 'var(--primary-main)',
        color: 'var(--primary-contrast-text)',
        zIndex: 1100,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          minHeight: '64px',
          padding: '0 16px',
        }}>
          {isMobile && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              style={{ marginRight: '16px' }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <h1 style={{
            margin: 0,
            fontSize: '1.25rem',
            fontWeight: 500,
            flexGrow: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {activeChat
              ? activeChat.isGroup
                ? activeChat.groupName
                : activeChat.participants.find(p => p.id !== auth.user?.id)?.name
              : 'Select a chat'}
          </h1>
          <IconButton color="inherit" onClick={toggleTheme}>
            {isDarkMode ? <LightMode /> : <DarkMode />}
          </IconButton>
          <IconButton color="inherit" onClick={handleLogout}>
            <ExitToApp />
          </IconButton>
        </div>
      </header>

      <nav style={{ 
        width: isMobile ? 0 : DRAWER_WIDTH,
        flexShrink: 0,
      }}>
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
        >
          <ChatList />
        </Drawer>
      </nav>

      <main style={{
        flexGrow: 1,
        padding: '24px',
        width: isMobile ? '100%' : `calc(100% - ${DRAWER_WIDTH}px)`,
        marginTop: '64px',
        height: 'calc(100vh - 64px)',
        display: 'flex',
      }}>
        {activeChat ? (
          <ChatWindow />
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
          }}>
            <p style={{
              fontSize: '1.25rem',
              color: 'var(--text-secondary)',
            }}>
              Select a chat to start messaging
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Chat; 