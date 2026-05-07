import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from 'app/core/user/user.service';
import { AiServiceConfig, AiServiceConfigService } from './ai-service-config.service';
import { AiUserPermission, AiUserDto, AiUserPermissionService } from './ai-user-permission.service';
import { take } from 'rxjs/operators';

interface AiFeatureCard {
  title: string;
  description: string;
  icon: string;
  route: string;
  queryParams?: { [key: string]: string };
  color: string;
  stats?: { label: string; value: string }[];
}

interface AiFeatureOption {
  key: string;
  label: string;
  icon: string;
}

interface AiModelReference {
  name: string;
  provider: 'OpenAI' | 'Anthropic' | 'Google' | 'Meta' | 'Other';
  supportsNativePdf: boolean;
  maxOutputTokens: number;
  maxImagePages: number;
  note: string;
}

@Component({
  standalone: false,
  selector: 'app-ai-management',
  templateUrl: './ai-management.component.html',
  styleUrls: ['./ai-management.component.scss']
})
export class AiManagementComponent implements OnInit {

  currentUser: any = null;

  featureCards: AiFeatureCard[] = [
    {
      title: 'AI Prompt Configuration Hotel/Cruise',
      description: 'Manage AI prompts & knowledge base for hotel and cruise contract processing. Configure prompts for contract upload, analysis, and refinement.',
      icon: 'bi bi-file-earmark-text',
      route: '/configuration/ai-prompt-config',
      queryParams: { type: 'hotel' },
      color: '#4f46e5',
      stats: [
        { label: 'Feature', value: 'Contract AI' },
        { label: 'Type', value: 'Hotel/Cruise' }
      ]
    },
    {
      title: 'AI Prompt Configuration Service',
      description: 'Manage AI system prompt for service contract reading. Configure the prompt used when extracting service options from uploaded contracts (key: service_contract_read).',
      icon: 'bi bi-gear-wide-connected',
      route: '/configuration/ai-prompt-config',
      queryParams: { type: 'service' },
      color: '#0d9488',
      stats: [
        { label: 'Feature', value: 'Service AI' },
        { label: 'Key', value: 'service_contract_read' }
      ]
    },
    {
      title: 'AI Model Training',
      description: 'Train Deepseek AI models with custom data to improve performance for specific use cases like contract analysis and chat.',
      icon: 'bi bi-cpu',
      route: '/configuration/ai-train',
      color: '#0891b2',
      stats: [
        { label: 'Feature', value: 'Model Training' },
        { label: 'Type', value: 'Deepseek AI' }
      ]
    }    
  ];

  // Azure OpenAI Config
  serviceConfigs: AiServiceConfig[] = [];
  azureConfig: AiServiceConfig = this.getDefaultAzureConfig();
  isEditingConfig = false;
  configLoading = false;
  configSaving = false;
  showApiKey = false;
  configMessage: { type: 'success' | 'error'; text: string } | null = null;

  // AI User Permissions
  userPermissions: AiUserPermission[] = [];
  availableUsers: AiUserDto[] = [];
  filteredUsers: AiUserDto[] = [];
  userSearchText = '';
  permissionsLoading = false;
  permissionSaving = false;
  usersLoading = false;
  permissionMessage: { type: 'success' | 'error'; text: string } | null = null;
  showAddUserPanel = false;
  selectedUser: AiUserDto | null = null;
  selectedFeatures: string[] = ['all'];

  aiFeatureOptions: AiFeatureOption[] = [
    { key: 'all', label: 'All Features', icon: 'bi bi-stars' },
    { key: 'contract_upload', label: 'Contract Upload', icon: 'bi bi-cloud-upload' },
    { key: 'contract_analysis', label: 'Contract Analysis', icon: 'bi bi-graph-up' },
    { key: 'chat', label: 'AI Chat', icon: 'bi bi-chat-dots' }
  ];

  // Model reference guide — grouped by provider
  modelReferences: AiModelReference[] = [
    // ── OpenAI: GPT-4 series ──
    { name: 'GPT-4o',        provider: 'OpenAI', supportsNativePdf: true,  maxOutputTokens: 16384,  maxImagePages: 20, note: 'Native PDF + Vision. Best for contract upload' },
    { name: 'GPT-4o-mini',   provider: 'OpenAI', supportsNativePdf: true,  maxOutputTokens: 16384,  maxImagePages: 20, note: 'Faster & cheaper, native PDF support' },
    { name: 'GPT-4.1',       provider: 'OpenAI', supportsNativePdf: false, maxOutputTokens: 32768,  maxImagePages: 30, note: 'High output, PDF → images. Recommended' },
    { name: 'GPT-4.1-mini',  provider: 'OpenAI', supportsNativePdf: false, maxOutputTokens: 16384,  maxImagePages: 20, note: 'Balanced speed & quality' },
    { name: 'GPT-4.1-nano',  provider: 'OpenAI', supportsNativePdf: false, maxOutputTokens: 16384,  maxImagePages: 15, note: 'Fastest, best for chat & simple tasks' },
    { name: 'GPT-4-turbo',   provider: 'OpenAI', supportsNativePdf: false, maxOutputTokens: 4096,   maxImagePages: 20, note: 'Legacy model, limited output' },
    // ── OpenAI: Reasoning models ──
    { name: 'o1',            provider: 'OpenAI', supportsNativePdf: false, maxOutputTokens: 100000, maxImagePages: 20, note: 'Deep reasoning, very high output' },
    { name: 'o3',            provider: 'OpenAI', supportsNativePdf: false, maxOutputTokens: 100000, maxImagePages: 20, note: 'Advanced reasoning model' },
    { name: 'o3-mini',       provider: 'OpenAI', supportsNativePdf: false, maxOutputTokens: 100000, maxImagePages: 20, note: 'Compact reasoning model' },
    { name: 'o4-mini',       provider: 'OpenAI', supportsNativePdf: false, maxOutputTokens: 100000, maxImagePages: 20, note: 'Latest compact reasoning' },
    // ── OpenAI: GPT-5+ (future) ──
    { name: 'GPT-5',         provider: 'OpenAI', supportsNativePdf: true,  maxOutputTokens: 32768,  maxImagePages: 30, note: 'Next-gen (check docs when available)' },
    { name: 'GPT-5-mini',    provider: 'OpenAI', supportsNativePdf: true,  maxOutputTokens: 16384,  maxImagePages: 20, note: 'Next-gen compact (check docs)' },
    // ── Anthropic: Claude ──
    { name: 'Claude 4 Opus',   provider: 'Anthropic', supportsNativePdf: true, maxOutputTokens: 32000, maxImagePages: 20, note: 'Native PDF via document block' },
    { name: 'Claude 4 Sonnet', provider: 'Anthropic', supportsNativePdf: true, maxOutputTokens: 16000, maxImagePages: 20, note: 'Fast + PDF support' },
    { name: 'Claude 3.5 Sonnet', provider: 'Anthropic', supportsNativePdf: true, maxOutputTokens: 8192, maxImagePages: 20, note: 'Balanced performance' },
    // ── Google: Gemini ──
    { name: 'Gemini 2.5 Pro', provider: 'Google', supportsNativePdf: true, maxOutputTokens: 65536, maxImagePages: 30, note: 'Native PDF. High output capacity' },
    { name: 'Gemini 2.5 Flash', provider: 'Google', supportsNativePdf: true, maxOutputTokens: 65536, maxImagePages: 30, note: 'Fast & efficient with PDF support' },
    { name: 'Gemini 2.0 Flash', provider: 'Google', supportsNativePdf: true, maxOutputTokens: 8192,  maxImagePages: 20, note: 'Previous gen, still good' },
  ];
  showModelGuide = false;

  constructor(
    private router: Router,
    private userService: UserService,
    private serviceConfigService: AiServiceConfigService,
    private userPermissionService: AiUserPermissionService
  ) {}

  ngOnInit(): void {
    this.userService.user$.pipe(take(1)).subscribe((user) => {
      this.currentUser = user;      
      this.loadServiceConfigs();
      this.loadUserPermissions();      
    });
  }

  navigateTo(card: AiFeatureCard): void {
    this.router.navigate([card.route], { queryParams: card.queryParams || {} });
  }

  // === Service Config Methods ===

  private getDefaultAzureConfig(): AiServiceConfig {
    return {
      configKey: 'azure_openai',
      name: 'Azure OpenAI',
      endpoint: '',
      apiKey: '',
      deploymentName: 'gpt-4o',
      apiVersion: '2025-01-01-preview',
      isActive: true,
      supportsNativePdf: false,
      maxImagePages: 20,
      maxOutputTokens: 16384
    };
  }

  loadServiceConfigs(): void {
    this.configLoading = true;
    this.serviceConfigService.getAllConfigs().subscribe({
      next: (configs) => {
        this.serviceConfigs = configs;
        const active = configs.find(c => c.configKey === 'azure_openai' && c.isActive);
        if (active) {
          this.azureConfig = { ...active };
        }
        this.configLoading = false;
      },
      error: () => {
        this.configLoading = false;
      }
    });
  }

  startEditConfig(): void {
    this.isEditingConfig = true;
    this.configMessage = null;
  }

  cancelEditConfig(): void {
    this.isEditingConfig = false;
    this.configMessage = null;
    const active = this.serviceConfigs.find(c => c.configKey === 'azure_openai' && c.isActive);
    if (active) {
      this.azureConfig = { ...active };
    } else {
      this.azureConfig = this.getDefaultAzureConfig();
    }
  }

  saveConfig(): void {
    if (!this.azureConfig.endpoint || !this.azureConfig.apiKey || !this.azureConfig.deploymentName) {
      this.configMessage = { type: 'error', text: 'Endpoint, API Key, and Deployment Name are required.' };
      return;
    }

    this.configSaving = true;
    this.configMessage = null;

    const payload: any = {
      configKey: 'azure_openai',
      name: this.azureConfig.name || 'Azure OpenAI',
      endpoint: this.azureConfig.endpoint,
      apiKey: this.azureConfig.apiKey,
      deploymentName: this.azureConfig.deploymentName,
      apiVersion: this.azureConfig.apiVersion || '2025-01-01-preview',
      isActive: true,
      supportsNativePdf: this.azureConfig.supportsNativePdf ?? false,
      maxImagePages: this.azureConfig.maxImagePages || 20,
      maxOutputTokens: this.azureConfig.maxOutputTokens || 16384,
      userName: 'admin'
    };
    if (this.azureConfig.id) {
      payload.id = this.azureConfig.id;
    }

    this.serviceConfigService.saveConfig(payload).subscribe({
      next: (saved) => {
        this.azureConfig = { ...saved };
        this.isEditingConfig = false;
        this.configSaving = false;
        this.configMessage = { type: 'success', text: 'Configuration saved successfully.' };
        this.loadServiceConfigs();
        setTimeout(() => this.configMessage = null, 4000);
      },
      error: (err) => {
        this.configSaving = false;
        this.configMessage = { type: 'error', text: 'Failed to save configuration: ' + (err.error?.message || err.message) };
      }
    });
  }

  toggleApiKeyVisibility(): void {
    this.showApiKey = !this.showApiKey;
  }

  getMaskedApiKey(key: string): string {
    if (!key) return '';
    if (key.length <= 8) return '••••••••';
    return key.substring(0, 4) + '••••••••••••' + key.substring(key.length - 4);
  }

  applyModelPreset(model: AiModelReference): void {
    this.azureConfig.supportsNativePdf = model.supportsNativePdf;
    this.azureConfig.maxOutputTokens = model.maxOutputTokens;
    this.azureConfig.maxImagePages = model.maxImagePages;
  }

  getMatchingModel(): AiModelReference | null {
    if (!this.azureConfig.deploymentName) return null;
    const name = this.azureConfig.deploymentName.toLowerCase();
    // Try exact match first, then partial (longer names first to avoid 'gpt-4' matching 'gpt-4o')
    const sorted = [...this.modelReferences].sort((a, b) => b.name.length - a.name.length);
    return sorted.find(m => name.includes(m.name.toLowerCase())) || null;
  }

  getProviders(): string[] {
    const seen = new Set<string>();
    return this.modelReferences.filter(m => {
      if (seen.has(m.provider)) return false;
      seen.add(m.provider);
      return true;
    }).map(m => m.provider);
  }

  getModelsByProvider(provider: string): AiModelReference[] {
    return this.modelReferences.filter(m => m.provider === provider);
  }

  getProviderIcon(provider: string): string {
    switch (provider) {
      case 'OpenAI': return 'bi bi-stars';
      case 'Anthropic': return 'bi bi-lightning-charge';
      case 'Google': return 'bi bi-google';
      case 'Meta': return 'bi bi-meta';
      default: return 'bi bi-cpu';
    }
  }

  getProviderColor(provider: string): string {
    switch (provider) {
      case 'OpenAI': return '#10a37f';
      case 'Anthropic': return '#d97706';
      case 'Google': return '#4285f4';
      case 'Meta': return '#0668E1';
      default: return '#6b7280';
    }
  }

  toggleModelGuide(): void {
    this.showModelGuide = !this.showModelGuide;
  }

  // === User Permission Methods ===

  loadUserPermissions(): void {
    this.permissionsLoading = true;
    this.userPermissionService.getAllPermissions().subscribe({
      next: (perms) => {
        this.userPermissions = perms;
        this.permissionsLoading = false;
      },
      error: () => {
        this.permissionsLoading = false;
      }
    });
  }

  openAddUserPanel(): void {
    this.showAddUserPanel = true;
    this.selectedUser = null;
    this.selectedFeatures = ['all'];
    this.userSearchText = '';
    this.filteredUsers = [];
    this.permissionMessage = null;
    this.usersLoading = true;

    // Load available users
    this.userPermissionService.getAvailableUsers().subscribe({
      next: (users) => {
        // Filter out users who already have permissions
        const existingUserIds = new Set(this.userPermissions.map(p => p.userId));
        this.availableUsers = users.filter(u => !existingUserIds.has(u.userId));
        // Re-apply current search filter (user may have typed while loading)
        this.filterUsers();
        this.usersLoading = false;
      },
      error: (err) => {
        console.error('Failed to load available users:', err);
        this.availableUsers = [];
        this.filteredUsers = [];
        this.usersLoading = false;
      }
    });
  }

  closeAddUserPanel(): void {
    this.showAddUserPanel = false;
    this.selectedUser = null;
  }

  filterUsers(): void {
    const q = this.userSearchText.toLowerCase().trim();
    if (!q) {
      this.filteredUsers = this.availableUsers;
    } else {
      this.filteredUsers = this.availableUsers.filter(u =>
        (u.fullname || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q)
      );
    }
  }

  selectUser(user: AiUserDto): void {
    this.selectedUser = user;
  }

  isFeatureSelected(key: string): boolean {
    return this.selectedFeatures.includes(key);
  }

  toggleFeature(key: string): void {
    if (key === 'all') {
      this.selectedFeatures = ['all'];
      return;
    }
    // Remove 'all' if selecting specific feature
    this.selectedFeatures = this.selectedFeatures.filter(f => f !== 'all');

    if (this.selectedFeatures.includes(key)) {
      this.selectedFeatures = this.selectedFeatures.filter(f => f !== key);
    } else {
      this.selectedFeatures.push(key);
    }
    // If nothing selected, default to 'all'
    if (this.selectedFeatures.length === 0) {
      this.selectedFeatures = ['all'];
    }
  }

  saveUserPermission(): void {
    if (!this.selectedUser) return;

    this.permissionSaving = true;
    this.permissionMessage = null;

    const payload = {
      userId: this.selectedUser.userId,
      fullname: this.selectedUser.fullname,
      email: this.selectedUser.email,
      avatar: this.selectedUser.avatar || '',
      allowedFeatures: this.selectedFeatures,
      isActive: true,
      userName: 'admin'
    };

    this.userPermissionService.savePermission(payload).subscribe({
      next: () => {
        this.permissionSaving = false;
        this.showAddUserPanel = false;
        this.permissionMessage = { type: 'success', text: `AI access granted to ${this.selectedUser!.fullname}.` };
        this.loadUserPermissions();
        setTimeout(() => this.permissionMessage = null, 4000);
      },
      error: (err) => {
        this.permissionSaving = false;
        this.permissionMessage = { type: 'error', text: 'Failed: ' + (err.error?.message || err.message) };
      }
    });
  }

  toggleUserActive(perm: AiUserPermission): void {
    const payload = {
      id: perm.id,
      userId: perm.userId,
      fullname: perm.fullname,
      email: perm.email,
      avatar: perm.avatar,
      allowedFeatures: perm.allowedFeatures,
      isActive: !perm.isActive,
      userName: 'admin'
    };

    this.userPermissionService.savePermission(payload).subscribe({
      next: () => {
        perm.isActive = !perm.isActive;
      }
    });
  }

  removeUserPermission(perm: AiUserPermission): void {
    if (!perm.id) return;
    this.userPermissionService.deletePermission(perm.id).subscribe({
      next: () => {
        this.userPermissions = this.userPermissions.filter(p => p.id !== perm.id);
        this.permissionMessage = { type: 'success', text: `Removed AI access for ${perm.fullname}.` };
        setTimeout(() => this.permissionMessage = null, 4000);
      }
    });
  }

  getFeatureLabel(key: string): string {
    const opt = this.aiFeatureOptions.find(f => f.key === key);
    return opt ? opt.label : key;
  }

  getFeatureIcon(key: string): string {
    const opt = this.aiFeatureOptions.find(f => f.key === key);
    return opt ? opt.icon : 'bi bi-gear';
  }

  getUserInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
}
