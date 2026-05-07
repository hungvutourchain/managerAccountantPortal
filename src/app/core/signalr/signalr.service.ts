import { Injectable, OnDestroy } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, Subject } from 'rxjs';
import { environment as env } from 'environments/environment';

export interface ConnectionStatus {
  status: 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error';
  message?: string;
}

export interface OnlineUser {
  username: string;
  email: string;
  fullname: string;
  avatar: string;
  connectedAt?: Date;
  lastActivity?: Date;
  currentUrl?: string;
  pageTitle?: string;
  activityStatus?: 'active' | 'idle' | 'away';
  lastInteraction?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class SignalRService implements OnDestroy {
  private hubConnection: signalR.HubConnection | undefined;
  private readonly websocketEnabled = (env as any).EnableWebSockets === true;
  private heartbeatInterval: any;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5; // Reduced from 10 to 5 to prevent connection storms
  private isReconnecting = false;
  private currentUser: any;
  
  // CONNECTION STORM FIX: Track rejection status and cooldown
  private isRejected = false;
  private rejectionCooldownTimer: any = null;
  private rejectionReason: string = '';
  private retryAfterSeconds: number = 60;
  
  // Activity tracking variables
  private activityCheckInterval: any;
  private lastInteractionTime: Date = new Date();
  private currentActivityStatus: 'active' | 'idle' | 'away' = 'active';
  private readonly IDLE_THRESHOLD = 2 * 60 * 1000; // 2 minutes
  private readonly AWAY_THRESHOLD = 10 * 60 * 1000; // 10 minutes
  private activityListeners: (() => void)[] = [];
  
  // Optimization: Throttle/debounce settings
  private lastPageInfoSent: Date = new Date(0);
  private lastActivityUpdateSent: Date = new Date(0);
  private readonly PAGE_INFO_THROTTLE = 5000; // 5 seconds - don't send page info more than once per 5s
  private readonly ACTIVITY_UPDATE_THROTTLE = 30000; // 30 seconds - activity updates
  private currentPageUrl: string = '';
  private currentPageTitle: string = '';
  private pendingActivityUpdate: any = null;

  // Observables
  private connectionStatus$ = new BehaviorSubject<ConnectionStatus>({ status: 'disconnected' });
  private onlineUsers$ = new BehaviorSubject<OnlineUser[]>([]);
  private globalMessages$ = new Subject<any>();
  private userStatusChanged$ = new Subject<void>();

  // Public observables
  public connectionStatus = this.connectionStatus$.asObservable();
  public onlineUsers = this.onlineUsers$.asObservable();
  public globalMessages = this.globalMessages$.asObservable();
  public userStatusChanged = this.userStatusChanged$.asObservable();

  constructor() {}

  // Initialize connection with user info
  async connect(user: any): Promise<void> {
    if (!this.websocketEnabled) {
      this.currentUser = user;
      this.connectionStatus$.next({ status: 'disconnected', message: 'Realtime disabled' });
      return;
    }

    if (this.hubConnection || !user) {
      return;
    }

    this.currentUser = user;
    this.connectionStatus$.next({ status: 'connecting', message: 'Connecting to server...' });

    try {
      const queryString = this.buildQueryString(user);

      this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl(env.RealtimeSignalR + '/messageHub?' + queryString, {
          skipNegotiation: true,
          transport: signalR.HttpTransportType.WebSockets,
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: retryContext => {
            // CONNECTION STORM FIX: Stop reconnecting if rejected by server
            if (this.isRejected) {
              console.warn('[SignalR Service] Connection was rejected by server. Stopping reconnection.');
              return null;
            }
            
            // Stop after max attempts
            if (retryContext.previousRetryCount >= this.maxReconnectAttempts) {
              console.warn('[SignalR Service] Max reconnection attempts reached.');
              return null;
            }
            
            // EXPONENTIAL BACKOFF: 2^n * 1000ms with jitter, max 60 seconds
            const baseDelay = Math.min(Math.pow(2, retryContext.previousRetryCount) * 1000, 60000);
            const jitter = Math.random() * 1000; // Add 0-1 second jitter
            const delay = baseDelay + jitter;
            
            console.log(`[SignalR Service] Retry ${retryContext.previousRetryCount + 1}/${this.maxReconnectAttempts} in ${Math.round(delay/1000)}s`);
            return delay;
          }
        })
        .configureLogging(signalR.LogLevel.Warning)
        .build();

      this.setupEventHandlers();

      await this.hubConnection.start();
      console.log('[SignalR Service] Connected successfully');
      
      this.connectionStatus$.next({ status: 'connected', message: 'Connected' });
      this.reconnectAttempts = 0;
      this.isReconnecting = false;

      // Register user info as fallback (in case query string didn't work)
      try {
        await this.hubConnection.invoke('RegisterUser', 
          user?.username || user?.Username || '',
          user?.email || user?.Email || '',
          user?.fullname || user?.FullName || '',
          user?.avatar || ''
        );
      } catch (error) {
        console.warn('[SignalR Service] Could not register user via method call:', error);
      }

      // Start heartbeat - DISABLED
      // this.startHeartbeat();

    } catch (error) {
      console.error('[SignalR Service] Connection failed:', error);
      this.connectionStatus$.next({ status: 'error', message: 'Connection failed' });
      this.handleConnectionError();
    }
  }

  // Disconnect from SignalR
  async disconnect(): Promise<void> {
    this.stopHeartbeat();

    if (this.hubConnection) {
      try {
        await this.hubConnection.stop();
        console.log('[SignalR Service] Disconnected successfully');
      } catch (error) {
        console.error('[SignalR Service] Error disconnecting:', error);
      } finally {
        this.hubConnection = undefined;
        this.connectionStatus$.next({ status: 'disconnected', message: 'Disconnected' });
      }
    }
  }

  // Send global message
  async sendGlobalMessage(message: string, type: string = 'info', notify: boolean = true): Promise<void> {
    if (!this.websocketEnabled) {
      return;
    }

    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      try {
        await this.hubConnection.invoke('SendGlobalMessage', message, type, notify);
      } catch (error) {
        console.error('[SignalR Service] Error sending global message:', error);
        throw error;
      }
    } else {
      throw new Error('SignalR connection not available');
    }
  }

  // Get connection state
  getConnectionState(): signalR.HubConnectionState | undefined {
    if (!this.websocketEnabled) {
      return undefined;
    }
    return this.hubConnection?.state;
  }

  // Check if connected
  isConnected(): boolean {
    if (!this.websocketEnabled) {
      return false;
    }
    return this.hubConnection?.state === signalR.HubConnectionState.Connected;
  }

  private buildQueryString(user: any): string {
    return `username=${encodeURIComponent(user?.username || user?.Username || '')}` +
      `&email=${encodeURIComponent(user?.email || user?.Email || '')}` +
      `&fullname=${encodeURIComponent(user?.fullname || user?.FullName || '')}` +
      `&avatar=${encodeURIComponent(user?.avatar || '')}`;
  }

  private setupEventHandlers(): void {
    if (!this.hubConnection) return;

    // CONNECTION STORM FIX: Handle server rejection
    this.hubConnection.on('ConnectionRejected', (data: { reason: string; retryAfterSeconds: number }) => {
      console.warn(`[SignalR Service] Connection rejected by server: ${data.reason}. Retry after ${data.retryAfterSeconds}s`);
      this.isRejected = true;
      this.rejectionReason = data.reason;
      this.retryAfterSeconds = data.retryAfterSeconds || 60;
      
      this.connectionStatus$.next({ 
        status: 'error', 
        message: `Connection rejected: ${data.reason}. Retry in ${data.retryAfterSeconds}s` 
      });
      
      // Clear any existing cooldown timer
      if (this.rejectionCooldownTimer) {
        clearTimeout(this.rejectionCooldownTimer);
      }
      
      // Set up cooldown timer to clear rejection status
      this.rejectionCooldownTimer = setTimeout(() => {
        console.log('[SignalR Service] Rejection cooldown expired. Ready to reconnect.');
        this.isRejected = false;
        this.rejectionReason = '';
        this.reconnectAttempts = 0;
        
        // Auto-reconnect after cooldown
        if (this.currentUser) {
          this.connect(this.currentUser);
        }
      }, this.retryAfterSeconds * 1000);
    });

    // Handle reconnecting event
    this.hubConnection.onreconnecting((error) => {
      console.log('[SignalR Service] Reconnecting...', error);
      this.isReconnecting = true;
      this.connectionStatus$.next({ status: 'reconnecting', message: 'Reconnecting...' });
      this.stopHeartbeat();
    });

      // Handle reconnected event
      this.hubConnection.onreconnected((connectionId) => {
        console.log('[SignalR Service] Reconnected with connectionId:', connectionId);
        this.isReconnecting = false;
        this.reconnectAttempts = 0;
        this.connectionStatus$.next({ status: 'connected', message: 'Reconnected' });
        
        // Re-register user after reconnection
        if (this.currentUser) {
          this.hubConnection?.invoke('RegisterUser', 
            this.currentUser?.username || this.currentUser?.Username || '',
            this.currentUser?.email || this.currentUser?.Email || '',
            this.currentUser?.fullname || this.currentUser?.FullName || '',
            this.currentUser?.avatar || ''
          ).catch(error => {
            console.warn('[SignalR Service] Could not re-register user after reconnection:', error);
          });
        }
        
        // this.startHeartbeat(); // DISABLED
      });    // Handle connection closed event
    this.hubConnection.onclose((error) => {
      console.log('[SignalR Service] Connection closed:', error);
      this.isReconnecting = false;
      this.stopHeartbeat();
      
      const status = error ? 'error' : 'disconnected';
      const message = error ? `Connection lost: ${error.message}` : 'Disconnected';
      this.connectionStatus$.next({ status, message });

      // Attempt manual reconnection if needed
      if (!error && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.handleConnectionError();
      }
    });

    // Listen for server events
    this.hubConnection.on('userStatusChanged', () => {
      console.log('[SignalR Service] User status changed event received');
      this.userStatusChanged$.next();
    });

    this.hubConnection.on('globalMessage', (message: any) => {
      console.log('[SignalR Service] Global message received:', message);
      this.globalMessages$.next(message);
    });
  }

  private startHeartbeat(): void {
    this.stopHeartbeat(); // Ensure no duplicate intervals

    this.sendHeartbeat(); // Send initial heartbeat
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 30000); // 30 seconds interval
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private sendHeartbeat(): void {
    if (this.hubConnection && 
        this.hubConnection.state === signalR.HubConnectionState.Connected && 
        this.currentUser) {
      
      this.hubConnection.invoke('Heartbeat', {
        username: this.currentUser?.username || this.currentUser?.Username || '',
        email: this.currentUser?.email || this.currentUser?.Email || '',
        fullname: this.currentUser?.fullname || this.currentUser?.FullName || '',
        avatar: this.currentUser?.avatar || '',
        time: new Date().toISOString(),
      }).catch((error) => {
        console.error('[SignalR Service] Error sending heartbeat:', error);
      });
    }
  }

  private handleConnectionError(): void {
    if (!this.websocketEnabled) {
      return;
    }

    // CONNECTION STORM FIX: Don't retry if rejected by server
    if (this.isRejected) {
      console.warn('[SignalR Service] Connection was rejected. Waiting for cooldown before retry.');
      return;
    }
    
    if (this.isReconnecting || this.reconnectAttempts >= this.maxReconnectAttempts) {
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.warn('[SignalR Service] Max reconnection attempts reached. Giving up.');
        this.connectionStatus$.next({ 
          status: 'error', 
          message: 'Max reconnection attempts reached. Please refresh the page.' 
        });
      }
      return;
    }

    this.reconnectAttempts++;
    this.isReconnecting = true;

    // EXPONENTIAL BACKOFF: 2^n * 1000ms with jitter, max 60 seconds  
    const baseDelay = Math.min(Math.pow(2, this.reconnectAttempts) * 1000, 60000);
    const jitter = Math.random() * 1000;
    const delay = baseDelay + jitter;
    
    console.log(`[SignalR Service] Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${Math.round(delay/1000)}s`);
    
    this.connectionStatus$.next({ 
      status: 'reconnecting', 
      message: `Reconnecting in ${Math.round(delay/1000)}s (${this.reconnectAttempts}/${this.maxReconnectAttempts})` 
    });
    
    setTimeout(() => {
      this.isReconnecting = false;
      if (this.hubConnection?.state === signalR.HubConnectionState.Disconnected) {
        this.hubConnection = undefined;
        this.connect(this.currentUser);
      }
    }, delay);
  }

  ngOnDestroy(): void {
    this.stopActivityTracking();
    this.disconnect();
    this.connectionStatus$.complete();
    this.onlineUsers$.complete();
    this.globalMessages$.complete();
    this.userStatusChanged$.complete();
  }
  
  // ========== Activity Tracking Methods ==========
  
  /**
   * Start tracking user activity (mouse, keyboard, scroll, page changes)
   */
  startActivityTracking(): void {
    if (!this.websocketEnabled) {
      return;
    }

    // Reset activity tracking
    this.lastInteractionTime = new Date();
    this.currentActivityStatus = 'active';
    
    // OPTIMIZATION: Use throttled event listeners
    let activityThrottle: any = null;
    const throttledActivity = () => {
      if (activityThrottle) return;
      activityThrottle = setTimeout(() => {
        this.onUserActivity();
        activityThrottle = null;
      }, 1000); // Throttle to max once per second
    };
    
    // Track user interactions with throttling
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    activityEvents.forEach(eventName => {
      window.addEventListener(eventName, throttledActivity, { passive: true });
      this.activityListeners.push(() => window.removeEventListener(eventName, throttledActivity));
    });
    
    // Track visibility changes
    const visibilityListener = this.onVisibilityChange.bind(this);
    document.addEventListener('visibilitychange', visibilityListener);
    this.activityListeners.push(() => document.removeEventListener('visibilitychange', visibilityListener));
    
    // Track route/URL changes
    this.trackPageChanges();
    
    // OPTIMIZATION: Check activity status less frequently
    this.activityCheckInterval = setInterval(() => {
      this.checkActivityStatus();
    }, 60000); // Check every 60 seconds (instead of 30)
    
    // Send initial page info after a short delay to ensure page is loaded
    setTimeout(() => {
      this.sendPageInfo();
    }, 2000);
    
    console.log('[SignalR Service] Activity tracking started (optimized)');
  }
  
  /**
   * Stop tracking user activity
   */
  stopActivityTracking(): void {
    // Remove all event listeners
    this.activityListeners.forEach(removeListener => removeListener());
    this.activityListeners = [];
    
    // Clear interval
    if (this.activityCheckInterval) {
      clearInterval(this.activityCheckInterval);
      this.activityCheckInterval = null;
    }
    
    // Clear pending updates
    if (this.pendingActivityUpdate) {
      clearTimeout(this.pendingActivityUpdate);
      this.pendingActivityUpdate = null;
    }
    
    console.log('[SignalR Service] Activity tracking stopped');
  }
  
  /**
   * Handle user activity events
   */
  private onUserActivity(): void {
    this.lastInteractionTime = new Date();
    
    // If status was idle or away, change to active and send update immediately
    if (this.currentActivityStatus !== 'active') {
      this.currentActivityStatus = 'active';
      this.sendActivityUpdate();
    }
    // If already active, update will be sent by periodic check (optimization)
  }
  
  /**
   * Handle visibility change (tab switch, minimize)
   */
  private onVisibilityChange(): void {
    if (!document.hidden) {
      // Tab became visible
      this.onUserActivity();
      this.sendPageInfo(); // Send updated page info when tab becomes visible
    }
  }
  
  /**
   * Track page/route changes
   */
  private trackPageChanges(): void {
    // Initial page info (with delay)
    setTimeout(() => {
      this.sendPageInfo();
    }, 1000);
    
    // OPTIMIZATION: Debounce route changes
    let routeChangeTimeout: any = null;
    const debouncedPageInfo = () => {
      if (routeChangeTimeout) {
        clearTimeout(routeChangeTimeout);
      }
      routeChangeTimeout = setTimeout(() => {
        this.sendPageInfo();
      }, 1000); // Wait 1s after navigation before sending
    };
    
    // Listen for Angular route changes (if using Angular Router)
    const popstateListener = () => {
      debouncedPageInfo();
    };
    window.addEventListener('popstate', popstateListener);
    this.activityListeners.push(() => window.removeEventListener('popstate', popstateListener));
    
    // Also listen for hash changes
    const hashchangeListener = () => {
      debouncedPageInfo();
    };
    window.addEventListener('hashchange', hashchangeListener);
    this.activityListeners.push(() => window.removeEventListener('hashchange', hashchangeListener));
  }
  
  /**
   * Check activity status based on last interaction time
   */
  private checkActivityStatus(): void {
    const now = new Date();
    const timeSinceLastActivity = now.getTime() - this.lastInteractionTime.getTime();
    
    let newStatus: 'active' | 'idle' | 'away';
    
    if (timeSinceLastActivity > this.AWAY_THRESHOLD) {
      newStatus = 'away';
    } else if (timeSinceLastActivity > this.IDLE_THRESHOLD) {
      newStatus = 'idle';
    } else {
      newStatus = 'active';
    }
    
    // If status changed, send update
    if (newStatus !== this.currentActivityStatus) {
      this.currentActivityStatus = newStatus;
      this.sendActivityUpdate();
    }
  }
  
  /**
   * Send current page info to server
   */
  private sendPageInfo(): void {
    if (!this.isConnected()) {
      console.warn('[SignalR Service] Not connected, cannot send page info');
      return;
    }
    
    // OPTIMIZATION: Throttle page info updates
    const now = new Date();
    const timeSinceLastSend = now.getTime() - this.lastPageInfoSent.getTime();
    
    const newUrl = window.location.href;
    const newTitle = document.title;
    
    // Only send if:
    // 1. Enough time has passed since last send, OR
    // 2. URL/Title actually changed
    const urlChanged = newUrl !== this.currentPageUrl;
    const titleChanged = newTitle !== this.currentPageTitle;
    const throttleExpired = timeSinceLastSend > this.PAGE_INFO_THROTTLE;
    
    if (!throttleExpired && !urlChanged && !titleChanged) {
      console.log('[SignalR Service] Page info throttled (no changes)');
      return;
    }
    
    this.currentPageUrl = newUrl;
    this.currentPageTitle = newTitle;
    this.lastPageInfoSent = now;
    
    const pageInfo = {
      url: newUrl,
      pathname: window.location.pathname,
      title: newTitle,
      activityStatus: this.currentActivityStatus,
      timestamp: now.toISOString(),
    };
    
    console.log('[SignalR Service] Sending page info:', pageInfo);
    
    this.hubConnection?.invoke('UpdatePageInfo', pageInfo)
      .then(() => {
        console.log('[SignalR Service] Page info sent successfully');
      })
      .catch(error => {
        console.error('[SignalR Service] Error sending page info:', error);
      });
  }
  
  /**
   * Send activity status update to server
   */
  private sendActivityUpdate(): void {
    if (!this.isConnected()) {
      return;
    }
    
    // OPTIMIZATION: Throttle activity updates
    const now = new Date();
    const timeSinceLastSend = now.getTime() - this.lastActivityUpdateSent.getTime();
    
    if (timeSinceLastSend < this.ACTIVITY_UPDATE_THROTTLE) {
      // If we recently sent an update, schedule a pending one
      if (!this.pendingActivityUpdate) {
        this.pendingActivityUpdate = setTimeout(() => {
          this.pendingActivityUpdate = null;
          this.sendActivityUpdate();
        }, this.ACTIVITY_UPDATE_THROTTLE - timeSinceLastSend);
      }
      console.log('[SignalR Service] Activity update throttled');
      return;
    }
    
    this.lastActivityUpdateSent = now;
    
    const activityUpdate = {
      activityStatus: this.currentActivityStatus,
      lastInteraction: this.lastInteractionTime.toISOString(),
      timestamp: now.toISOString(),
    };
    
    console.log('[SignalR Service] Sending activity update:', activityUpdate);
    
    this.hubConnection?.invoke('UpdateActivityStatus', activityUpdate)
      .then(() => {
        console.log('[SignalR Service] Activity status sent successfully');
      })
      .catch(error => {
        console.error('[SignalR Service] Error sending activity update:', error);
      });
  }
  
  // ngOnDestroy(): void {
  //   // CONNECTION STORM FIX: Cleanup rejection cooldown timer
  //   if (this.rejectionCooldownTimer) {
  //     clearTimeout(this.rejectionCooldownTimer);
  //     this.rejectionCooldownTimer = null;
  //   }
    
  //   this.disconnect();
  //   this.connectionStatus$.complete();
  //   this.onlineUsers$.complete();
  //   this.globalMessages$.complete();
  //   this.userStatusChanged$.complete();
  // }
}