import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SignalRService, ConnectionStatus } from 'app/core/signalr/signalr.service';
import { environment as env } from 'environments/environment';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { trigger, transition, style, animate } from '@angular/animations';
import { DbService } from 'app/shared/connectData/db.service';

@Component({
  standalone: false,
  selector: 'app-online-users',
  templateUrl: './online-users.component.html',
  styleUrls: ['./online-users.component.scss'],
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ height: '0', opacity: 0, overflow: 'hidden' }),
        animate('300ms ease-out', style({ height: '*', opacity: 1 }))
      ]),
      transition(':leave', [
        style({ height: '*', opacity: 1, overflow: 'hidden' }),
        animate('200ms ease-in', style({ height: '0', opacity: 0 }))
      ])
    ])
  ]
})
export class OnlineUsersComponent implements OnInit, OnDestroy {
  onlineUsers: any[] = [];
  groupedUsers: any[] = []; // Grouped by user with tabs
  filteredUsers: any[] = []; // Filtered list for display
  private destroy$ = new Subject<void>();
  public connectionStatus: string = 'Disconnected';
  
  // Tab management
  activeTab: 'online' | 'report' = 'online';
  
  // Filter properties
  showFilterPanel = false;
  filterConfig = {
    searchText: '',
    activityStatus: 'all', // all, active, idle, away
    minTabs: 1,
    maxTabs: 10,
    isAdmin: false,
    recentlyJoined: false
  };
  
  // Report properties
  reportData: any = null;
  reportStats: any = null;
  reportLoading = false;
  reportDateRange = {
    startDate: '',
    endDate: ''
  };
  reportSearchText = '';
  reportSelectedUserId = ''; // For user dropdown filter
  allUsersList: any[] = []; // List of all users from API
  filteredReportUsers: any[] = [];

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private signalRService: SignalRService,
    private dbService: DbService
  ) {
    // Initialize date range
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    this.reportDateRange.startDate = this.formatDateForInput(firstDay);
    this.reportDateRange.endDate = this.formatDateForInput(today);
  }

  ngOnInit() {
    this.initializeComponent();
    this.loadReportStats();
    this.loadAllUsers();
  }

  private initializeComponent() {
    // Load initial data
    this.loadOnlineUsers();
    
    // Subscribe to SignalR connection status
    this.signalRService.connectionStatus
      .pipe(takeUntil(this.destroy$))
      .subscribe((status: ConnectionStatus) => {
        this.connectionStatus = status.message || status.status;
        this.cdr.detectChanges();
      });
    
    // Subscribe to user status changes
    this.signalRService.userStatusChanged
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        console.log('[OnlineUsers] User status changed - refreshing list');
        this.loadOnlineUsers();
      });
    
    // Set up periodic refresh as fallback
    interval(60000) // Refresh every minute as backup
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (!this.signalRService.isConnected()) {
          this.loadOnlineUsers();
        }
      });
  }

  async loadOnlineUsers() {
    try {
      const response = await this.http.get<any[]>(env.urlOperationApi + '/ManagerUser/onlineUsers').toPromise();
      
      if (response && Array.isArray(response)) {
        // Map all connections with full data
        this.onlineUsers = response.map(user => ({
          ...user,
          displayName: user.fullname || user.FullName || user.username || user.Username || 'Unknown User',
          avatar: user.avatar || user.Avatar || 'assets/images/logo/Tour_Chain.png',
          email: user.email || user.Email || '',
          currentUrl: user.currentUrl || user.CurrentUrl || '',
          pageTitle: user.pageTitle || user.PageTitle || '',
          activityStatus: user.activityStatus || user.ActivityStatus || 'unknown',
          lastInteraction: user.lastInteraction || user.LastInteraction,
          connectionId: user.connectionId || user.ConnectionId || '',
          lastSeen: new Date()
        }));
        
        // Group by user and organize tabs
        this.groupUsersByTabs();
      } else {
        this.onlineUsers = [];
        this.groupedUsers = [];
      }

      console.log('[OnlineUsers] Loaded connections:', this.onlineUsers.length);
      console.log('[OnlineUsers] Unique users:', this.groupedUsers.length);
      this.cdr.detectChanges();
      
    } catch (error) {
      console.error('[OnlineUsers] Error loading online users:', error);
      this.onlineUsers = [];
      this.groupedUsers = [];
      this.cdr.detectChanges();
    }
  }
  
  // Group users by email/username and organize their tabs
  private groupUsersByTabs() {
    const userMap = new Map<string, any>();
    
    this.onlineUsers.forEach(connection => {
      const userKey = connection.email || connection.username || connection.connectionId;
      
      if (!userMap.has(userKey)) {
        userMap.set(userKey, {
          displayName: connection.displayName,
          email: connection.email,
          username: connection.username,
          avatar: connection.avatar,
          tabs: [],
          totalTabs: 0,
          mostRecentActivity: connection.lastActivity || connection.lastInteraction,
          isOnline: true
        });
      }
      
      const user = userMap.get(userKey);
      user.tabs.push({
        connectionId: connection.connectionId,
        currentUrl: connection.currentUrl,
        pageTitle: connection.pageTitle,
        activityStatus: connection.activityStatus,
        lastActivity: connection.lastActivity,
        lastInteraction: connection.lastInteraction,
        connectedAt: connection.connectedAt
      });
      
      // Update most recent activity
      const tabActivity = connection.lastInteraction || connection.lastActivity;
      if (tabActivity && new Date(tabActivity) > new Date(user.mostRecentActivity)) {
        user.mostRecentActivity = tabActivity;
      }
      
      user.totalTabs = user.tabs.length;
    });
    
    // Convert map to array and sort
    this.groupedUsers = Array.from(userMap.values())
      .sort((a, b) => {
        // Sort by name
        const nameA = (a.displayName || a.username || '').toLowerCase();
        const nameB = (b.displayName || b.username || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
    
    // Sort tabs within each user by activity
    this.groupedUsers.forEach(user => {
      user.tabs.sort((a: any, b: any) => {
        const timeA = new Date(a.lastInteraction || a.lastActivity).getTime();
        const timeB = new Date(b.lastInteraction || b.lastActivity).getTime();
        return timeB - timeA; // Most recent first
      });
    });
    
    // Apply filters
    this.applyFilters();
  }
  
  // Filter methods
  toggleFilterPanel() {
    this.showFilterPanel = !this.showFilterPanel;
  }
  
  applyFilters() {
    this.filteredUsers = this.groupedUsers.filter(user => {
      // Search text filter
      if (this.filterConfig.searchText) {
        const searchLower = this.filterConfig.searchText.toLowerCase();
        const matchesSearch = 
          (user.displayName || '').toLowerCase().includes(searchLower) ||
          (user.email || '').toLowerCase().includes(searchLower) ||
          (user.username || '').toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }
      
      // Activity status filter
      if (this.filterConfig.activityStatus !== 'all') {
        const userStatus = this.getUserOverallStatus(user);
        if (userStatus.toLowerCase() !== this.filterConfig.activityStatus) {
          return false;
        }
      }
      
      // Tabs count filter
      if (user.totalTabs < this.filterConfig.minTabs || user.totalTabs > this.filterConfig.maxTabs) {
        return false;
      }
      
      // Admin filter
      if (this.filterConfig.isAdmin && !this.isAdminUser(user)) {
        return false;
      }
      
      // Recently joined filter
      if (this.filterConfig.recentlyJoined && !this.isRecentlyJoined(user)) {
        return false;
      }
      
      return true;
    });
    
    this.cdr.detectChanges();
  }
  
  resetFilters() {
    this.filterConfig = {
      searchText: '',
      activityStatus: 'all',
      minTabs: 1,
      maxTabs: 10,
      isAdmin: false,
      recentlyJoined: false
    };
    this.applyFilters();
  }
  
  getActiveFilterCount(): number {
    let count = 0;
    if (this.filterConfig.searchText) count++;
    if (this.filterConfig.activityStatus !== 'all') count++;
    if (this.filterConfig.minTabs > 1) count++;
    if (this.filterConfig.maxTabs < 10) count++;
    if (this.filterConfig.isAdmin) count++;
    if (this.filterConfig.recentlyJoined) count++;
    return count;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Public method to refresh the list manually
  refreshUsers() {
    this.loadOnlineUsers();
  }

  // TrackBy function for better performance
  trackByUser(index: number, user: any): string {
    return user.username || user.Username || user.email || user.Email || index.toString();
  }

  // Helper methods for UI
  getTimeAgo(date: string | Date): string {
    if (!date) return 'Unknown';
    
    const now = new Date();
    const targetDate = new Date(date);
    const diffMs = now.getTime() - targetDate.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return targetDate.toLocaleDateString();
  }

  getRecentlyActiveCount(): number {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return this.groupedUsers.filter(user => {
      const lastActivity = new Date(user.mostRecentActivity);
      return lastActivity > fiveMinutesAgo;
    }).length;
  }

  isRecentlyJoined(user: any): boolean {
    if (!user.tabs || user.tabs.length === 0) return false;
    const firstTab = user.tabs[0];
    if (!firstTab.connectedAt) return false;
    const joinTime = new Date(firstTab.connectedAt);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return joinTime > fiveMinutesAgo;
  }

  isAdminUser(user: any): boolean {
    // Check if user is admin based on email, username, or role
    const adminIndicators = ['admin', 'administrator', 'root', 'manager'];
    const userEmail = (user.email || '').toLowerCase();
    const userName = (user.username || '').toLowerCase();
    
    return adminIndicators.some(indicator => 
      userEmail.includes(indicator) || userName.includes(indicator)
    );
  }

  // Get activity status for a tab
  getTabActivityStatus(tab: any): string {
    const status = tab.activityStatus?.toLowerCase();
    
    switch (status) {
      case 'active':
        return 'Active';
      case 'idle':
        return 'Idle';
      case 'away':
        return 'Away';
      default:
        // Fallback to old logic if no status
        if (!tab.lastActivity && !tab.lastInteraction) return 'Unknown';
        
        const lastActivity = new Date(tab.lastInteraction || tab.lastActivity);
        const now = new Date();
        const diffMinutes = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60));
        
        if (diffMinutes < 2) return 'Active';
        if (diffMinutes < 10) return 'Idle';
        return 'Away';
    }
  }
  
  // Get most active status among all tabs for a user
  getUserOverallStatus(user: any): string {
    if (!user.tabs || user.tabs.length === 0) return 'Unknown';
    
    const statuses = user.tabs.map((tab: any) => this.getTabActivityStatus(tab));
    
    // Priority: Active > Idle > Away > Unknown
    if (statuses.includes('Active')) return 'Active';
    if (statuses.includes('Idle')) return 'Idle';
    if (statuses.includes('Away')) return 'Away';
    return 'Unknown';
  }

  getActivityStatusClass(status: string): string {
    switch (status) {
      case 'Active': return 'active';
      case 'Idle': return 'idle';
      case 'Away': return 'away';
      default: return 'unknown';
    }
  }

  getActivityIcon(status: string): string {
    switch (status) {
      case 'Active': return 'fas fa-bolt';
      case 'Idle': return 'fas fa-clock';
      case 'Away': return 'fas fa-moon';
      default: return 'fas fa-question-circle';
    }
  }
  
  // Get page title or fallback to URL
  getPageInfo(tab: any): string {
    if (tab.pageTitle) {
      return tab.pageTitle;
    }
    if (tab.currentUrl) {
      try {
        const url = new URL(tab.currentUrl);
        return url.pathname || 'Unknown Page';
      } catch (e) {
        return tab.currentUrl;
      }
    }
    return 'No page info';
  }
  
  // Get shortened URL for display
  getShortenedUrl(tab: any): string {
    if (!tab.currentUrl) return '';
    
    try {
      const url = new URL(tab.currentUrl);
      return url.pathname + url.search;
    } catch (e) {
      return tab.currentUrl;
    }
  }
  
  // Get full URL
  getFullUrl(tab: any): string {
    return tab.currentUrl || '';
  }

  // Action methods
  viewUserDetails(user: any): void {
    console.log('View details for user:', user);
    // Implement user details modal or navigation
  }

  sendMessage(user: any): void {
    console.log('Send message to user:', user);
    // Implement messaging functionality
  }

  monitorUser(user: any): void {
    console.log('Monitor user:', user);
    // Implement user monitoring functionality
  }
  
  // ========== REPORT TAB METHODS ==========
  
  switchTab(tab: 'online' | 'report'): void {
    this.activeTab = tab;
    if (tab === 'report' && !this.reportData) {
      this.loadActivityReport();
    }
  }
  
  async loadReportStats(): Promise<void> {
    try {
      const response = await this.http.get<any>(env.urlOperationApi + '/UserActivity/stats').toPromise();
      this.reportStats = response;
      this.cdr.detectChanges();
    } catch (error) {
      console.error('[OnlineUsers] Error loading report stats:', error);
    }
  }
  
  async loadAllUsers(): Promise<void> {
    try {
      // Get user info to determine nation
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const nation = user.nation || 'vn'; // Default to 'vn' if not found
      
      // Use dbService to get users (same method as edit.component.ts)
      this.dbService.getUsers(nation, true).subscribe({
        next: (response) => {
          this.allUsersList = response || [];
          console.log('[OnlineUsers] Loaded all users via dbService:', this.allUsersList.length);
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('[OnlineUsers] Error loading all users:', error);
          this.allUsersList = [];
          this.cdr.detectChanges();
        }
      });
    } catch (error) {
      console.error('[OnlineUsers] Error in loadAllUsers:', error);
      this.allUsersList = [];
    }
  }
  
  
  async loadActivityReport(): Promise<void> {
    this.reportLoading = true;
    try {
      // Ensure dates are in YYYY-MM-DD format
      const startDate = this.reportDateRange.startDate;
      const endDate = this.reportDateRange.endDate;
      
      // Validate date format
      if (!startDate || !endDate) {
        console.error('[OnlineUsers] Invalid date range');
        return;
      }
      
      const response = await this.http.get<any>(
        `${env.urlOperationApi}/UserActivity/report`,
        {
          params: {
            startDate: startDate,
            endDate: endDate,
            username: this.reportSelectedUserId || '',
          }
        }
      ).toPromise();
      
      this.reportData = response;
      this.filteredReportUsers = response?.users || [];
      
      console.log('[OnlineUsers] Activity report loaded:', response);
    } catch (error) {
      console.error('[OnlineUsers] Error loading activity report:', error);
      this.reportData = null;
      this.filteredReportUsers = [];
    } finally {
      this.reportLoading = false;
      this.cdr.detectChanges();
    }
  }
  
  async exportReport(): Promise<void> {
    try {
      const startDate = this.reportDateRange.startDate;
      const endDate = this.reportDateRange.endDate;
      
      const url = `${env.urlOperationApi}/UserActivity/export?startDate=${startDate}&endDate=${endDate}`;
      
      // Download file
      window.open(url, '_blank');
      
      console.log('[OnlineUsers] Exporting report...');
    } catch (error) {
      console.error('[OnlineUsers] Error exporting report:', error);
    }
  }
  
  formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  calculatePercentage(part: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((part / total) * 100);
  }
  
  getPercentageClass(percentage: number): string {
    if (percentage >= 70) return 'high';
    if (percentage >= 40) return 'medium';
    return 'low';
  }
}
