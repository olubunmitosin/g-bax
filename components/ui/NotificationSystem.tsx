'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardBody } from '@heroui/card';
import { Chip } from '@heroui/chip';

export interface Notification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number;
}

interface NotificationSystemProps {
  notifications: Notification[];
  onRemoveNotification: (id: string) => void;
  className?: string;
}

export default function NotificationSystem({
  notifications,
  onRemoveNotification,
  className = "",
}: NotificationSystemProps) {
  
  // Auto-remove notifications after their duration
  useEffect(() => {
    notifications.forEach(notification => {
      const duration = notification.duration || 3000; // Default 3 seconds
      
      const timer = setTimeout(() => {
        onRemoveNotification(notification.id);
      }, duration);

      return () => clearTimeout(timer);
    });
  }, [notifications, onRemoveNotification]);

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'success': return 'success';
      case 'info': return 'primary';
      case 'warning': return 'warning';
      case 'error': return 'danger';
      default: return 'default';
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return '✅';
      case 'info': return 'ℹ️';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '📢';
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 space-y-2 ${className}`}>
      {notifications.map((notification, index) => (
        <Card
          key={notification.id}
          className={`min-w-[300px] max-w-[400px] animate-in slide-in-from-right-full duration-300`}
          style={{
            animationDelay: `${index * 100}ms`,
          }}
        >
          <CardBody className="p-4">
            <div className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">
                {getNotificationIcon(notification.type)}
              </span>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="font-semibold text-sm truncate">
                    {notification.title}
                  </h4>
                  <Chip
                    size="sm"
                    color={getNotificationColor(notification.type)}
                    variant="flat"
                  >
                    {notification.type}
                  </Chip>
                </div>
                
                <p className="text-sm text-default-600 break-words">
                  {notification.message}
                </p>
              </div>
              
              <button
                onClick={() => onRemoveNotification(notification.id)}
                className="text-default-400 hover:text-default-600 transition-colors flex-shrink-0"
                aria-label="Close notification"
              >
                ✕
              </button>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

// Hook for managing notifications
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = `notification_${Date.now()}_${Math.random()}`;
    const newNotification: Notification = {
      ...notification,
      id,
    };
    
    setNotifications(prev => [...prev, newNotification]);
    return id;
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Convenience methods
  const showSuccess = (title: string, message: string, duration?: number) => {
    return addNotification({ type: 'success', title, message, duration });
  };

  const showInfo = (title: string, message: string, duration?: number) => {
    return addNotification({ type: 'info', title, message, duration });
  };

  const showWarning = (title: string, message: string, duration?: number) => {
    return addNotification({ type: 'warning', title, message, duration });
  };

  const showError = (title: string, message: string, duration?: number) => {
    return addNotification({ type: 'error', title, message, duration });
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showInfo,
    showWarning,
    showError,
  };
}
