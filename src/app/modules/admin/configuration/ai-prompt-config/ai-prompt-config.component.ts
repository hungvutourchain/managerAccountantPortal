import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, ActivatedRoute } from '@angular/router';
import { AiPromptConfigService, AiPromptConfig } from './ai-prompt-config.service';
import { AiKnowledgeService, AiKnowledgeEntry } from './ai-knowledge.service';
import { finalize } from 'rxjs/operators';

@Component({
  standalone: false,
  selector: 'app-ai-prompt-config',
  templateUrl: './ai-prompt-config.component.html',
  styleUrls: ['./ai-prompt-config.component.scss']
})
export class AiPromptConfigComponent implements OnInit {

  // Tab control
  activeTab: 'prompts' | 'knowledge' = 'prompts';

  // Page type: hotel = Hotel/Cruise, service = Service contract
  pageType: 'hotel' | 'service' = 'hotel';

  get pageTitle(): string {
    return this.pageType === 'service'
      ? 'AI Prompt Configuration Service'
      : 'AI Prompt Configuration Hotel/Cruise';
  }

  get pageSubtitle(): string {
    return this.pageType === 'service'
      ? 'Manage system prompt for service contract reading.'
      : 'Manage system prompts and knowledge base for hotel & cruise contract AI.';
  }

  get showKnowledgeTab(): boolean {
    return this.pageType === 'hotel';
  }

  get availablePromptKeys() {
    if (this.pageType === 'service') {
      return [
        { text: 'Service Contract Read', value: 'service_contract_read' },
        { text: 'Custom', value: 'custom' }
      ];
    }
    return [
      { text: 'Contract Upload', value: 'contract_upload' },
      { text: 'Contract Upload - User Instructions', value: 'contract_upload_user_instructions' },
      { text: 'Contract Analysis', value: 'contract_analysis' },
      { text: 'Chat Query', value: 'chat_query' },
      { text: 'Custom', value: 'custom' }
    ];
  }

  get filteredPromptConfigs(): AiPromptConfig[] {
    if (this.pageType === 'service') {
      return this.promptConfigs.filter(p =>
        p.promptKey === 'service_contract_read' || p.promptKey === 'custom'
      );
    }
    return this.promptConfigs.filter(p => p.promptKey !== 'service_contract_read');
  }

  promptConfigs: AiPromptConfig[] = [];
  isLoading = false;
  isSaving = false;

  // Form model
  editMode: 'create' | 'edit' = 'create';
  showForm = false;
  formModel: AiPromptConfig = this.getEmptyModel();

  // Predefined prompt keys (legacy, kept for compatibility — use availablePromptKeys getter instead)
  promptKeyOptions = [
    { text: 'Contract Upload', value: 'contract_upload' },
    { text: 'Contract Upload - User Instructions', value: 'contract_upload_user_instructions' },
    { text: 'Contract Analysis', value: 'contract_analysis' },
    { text: 'Chat Query', value: 'chat_query' },
    { text: 'Service Contract Read', value: 'service_contract_read' },
    { text: 'Custom', value: 'custom' }
  ];

  // ===== Knowledge Base state =====
  knowledgeEntries: AiKnowledgeEntry[] = [];
  filteredKnowledgeEntries: AiKnowledgeEntry[] = [];
  isKbLoading = false;
  isKbSaving = false;
  showKbForm = false;
  kbEditMode: 'create' | 'edit' = 'create';
  kbFormModel: AiKnowledgeEntry = this.getEmptyKbModel();
  kbTagsInput = '';

  // Filters
  kbFilterCategory = '';
  kbFilterScope = '';
  kbFilterStatus = '';
  kbSearchText = '';

  // Category / Scope maps
  private categoryLabels: Record<string, string> = {
    contract_rule: 'Contract Rule',
    pricing_pattern: 'Pricing Pattern',
    correction: 'Correction',
    best_practice: 'Best Practice',
    hotel_specific: 'Hotel Specific',
    general: 'General'
  };

  private categoryIcons: Record<string, string> = {
    contract_rule: 'fa-gavel',
    pricing_pattern: 'fa-money',
    correction: 'fa-check-circle',
    best_practice: 'fa-star',
    hotel_specific: 'fa-building',
    general: 'fa-globe'
  };

  private scopeLabels: Record<string, string> = {
    all: 'Global (All)',
    contract_upload: 'Contract Upload',
    contract_analysis: 'Contract Analysis',
    chat: 'Chat'
  };

  constructor(
    private promptService: AiPromptConfigService,
    private knowledgeService: AiKnowledgeService,
    private snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.pageType = params['type'] === 'service' ? 'service' : 'hotel';
      if (this.pageType === 'service') {
        this.activeTab = 'prompts';
      }
      this.loadPrompts();
    });
  }

  goBackToManager() {
    this.router.navigate(['/configuration/ai-management']);
  }

  getEmptyModel(): AiPromptConfig {
    return {
      promptKey: this.pageType === 'service' ? 'service_contract_read' : 'contract_upload',
      name: '',
      description: '',
      systemPrompt: '',
      isActive: true
    };
  }

  loadPrompts(): void {
    this.isLoading = true;
    this.promptService.getAllPrompts()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe(
        (data) => {
          this.promptConfigs = data || [];
        },
        (error) => {
          console.error('Error loading prompts:', error);
          this.snackBar.open('Failed to load prompt configs', 'Close', { duration: 3000 });
        }
      );
  }

  onCreateNew(): void {
    this.editMode = 'create';
    this.formModel = this.getEmptyModel();
    this.showForm = true;
  }

  onEdit(config: AiPromptConfig): void {
    this.editMode = 'edit';
    this.formModel = { ...config };
    this.showForm = true;
  }

  onDuplicate(config: AiPromptConfig): void {
    this.editMode = 'create';
    this.formModel = {
      promptKey: config.promptKey,
      name: config.name + ' (Copy)',
      description: config.description,
      systemPrompt: config.systemPrompt,
      isActive: false
    };
    this.showForm = true;
  }

  onCancel(): void {
    this.showForm = false;
    this.formModel = this.getEmptyModel();
  }

  onSave(): void {
    if (this.isSaving) return;

    if (!this.formModel.promptKey || !this.formModel.name || !this.formModel.systemPrompt) {
      this.snackBar.open('Please fill all required fields (Key, Name, System Prompt)', 'Close', { duration: 3000 });
      return;
    }

    const payload: any = {
      promptKey: this.formModel.promptKey,
      name: this.formModel.name,
      description: this.formModel.description || '',
      systemPrompt: this.formModel.systemPrompt,
      isActive: this.formModel.isActive,
      userName: 'admin'
    };

    if (this.editMode === 'edit' && this.formModel.id) {
      payload.id = this.formModel.id;
    }

    this.isSaving = true;
    this.promptService.savePrompt(payload)
      .pipe(finalize(() => this.isSaving = false))
      .subscribe(
        () => {
          this.snackBar.open(
            this.editMode === 'create' ? 'Prompt created successfully!' : 'Prompt updated successfully!',
            'Close',
            { duration: 3000, panelClass: 'success-snackbar' }
          );
          this.showForm = false;
          this.loadPrompts();
        },
        (error) => {
          console.error('Error saving prompt:', error);
          this.snackBar.open(`Failed to save: ${error.error?.message || 'Unknown error'}`, 'Close', {
            duration: 5000, panelClass: 'error-snackbar'
          });
        }
      );
  }

  onDelete(config: AiPromptConfig): void {
    if (!config.id) return;
    if (!confirm(`Are you sure you want to delete "${config.name}"?`)) return;

    this.promptService.deletePrompt(config.id).subscribe(
      () => {
        this.snackBar.open('Prompt deleted successfully', 'Close', { duration: 3000 });
        this.loadPrompts();
      },
      (error) => {
        console.error('Error deleting prompt:', error);
        this.snackBar.open('Failed to delete prompt', 'Close', { duration: 3000 });
      }
    );
  }

  onToggleActive(config: AiPromptConfig): void {
    const payload: any = {
      id: config.id,
      promptKey: config.promptKey,
      name: config.name,
      description: config.description,
      systemPrompt: config.systemPrompt,
      isActive: !config.isActive,
      userName: 'admin'
    };

    this.promptService.savePrompt(payload).subscribe(
      () => {
        this.snackBar.open(
          `Prompt "${config.name}" ${!config.isActive ? 'activated' : 'deactivated'}`,
          'Close',
          { duration: 3000 }
        );
        this.loadPrompts();
      },
      (error) => {
        console.error('Error toggling prompt:', error);
        this.snackBar.open('Failed to update prompt status', 'Close', { duration: 3000 });
      }
    );
  }

  getPromptPreview(text: string): string {
    if (!text) return '';
    return text.length > 200 ? text.substring(0, 200) + '...' : text;
  }

  getLineCount(text: string): number {
    if (!text) return 0;
    return text.split('\n').length;
  }

  // ===================================================
  // Knowledge Base Methods
  // ===================================================

  switchToKnowledgeTab(): void {
    this.activeTab = 'knowledge';
    if (this.knowledgeEntries.length === 0 && !this.isKbLoading) {
      this.loadKnowledge();
    }
  }

  getEmptyKbModel(): AiKnowledgeEntry {
    return {
      category: 'general',
      title: '',
      content: '',
      hotelName: '',
      tags: [],
      scope: 'all',
      priority: 0,
      isActive: true,
      source: 'manual'
    };
  }

  loadKnowledge(): void {
    this.isKbLoading = true;
    this.knowledgeService.getAll()
      .pipe(finalize(() => this.isKbLoading = false))
      .subscribe(
        (data) => {
          this.knowledgeEntries = data || [];
          this.applyKbFilters();
        },
        (error) => {
          console.error('Error loading knowledge base:', error);
          this.snackBar.open('Failed to load knowledge base', 'Close', { duration: 3000 });
        }
      );
  }

  applyKbFilters(): void {
    let entries = [...this.knowledgeEntries];

    if (this.kbFilterCategory) {
      entries = entries.filter(e => e.category === this.kbFilterCategory);
    }
    if (this.kbFilterScope) {
      entries = entries.filter(e => e.scope === this.kbFilterScope);
    }
    if (this.kbFilterStatus === 'active') {
      entries = entries.filter(e => e.isActive);
    } else if (this.kbFilterStatus === 'inactive') {
      entries = entries.filter(e => !e.isActive);
    }
    if (this.kbSearchText) {
      const search = this.kbSearchText.toLowerCase();
      entries = entries.filter(e =>
        (e.title && e.title.toLowerCase().includes(search)) ||
        (e.content && e.content.toLowerCase().includes(search)) ||
        (e.hotelName && e.hotelName.toLowerCase().includes(search)) ||
        (e.tags && e.tags.some(t => t.toLowerCase().includes(search)))
      );
    }

    // Sort by priority desc, then by dateUpdate desc
    entries.sort((a, b) => {
      if ((b.priority || 0) !== (a.priority || 0)) return (b.priority || 0) - (a.priority || 0);
      const dateA = a.dateUpdate ? new Date(a.dateUpdate).getTime() : 0;
      const dateB = b.dateUpdate ? new Date(b.dateUpdate).getTime() : 0;
      return dateB - dateA;
    });

    this.filteredKnowledgeEntries = entries;
  }

  getActiveKbCount(): number {
    return this.knowledgeEntries.filter(e => e.isActive).length;
  }

  getTotalKbUsage(): number {
    return this.knowledgeEntries.reduce((sum, e) => sum + (e.usageCount || 0), 0);
  }

  getCategoryLabel(category: string): string {
    return this.categoryLabels[category] || category;
  }

  getCategoryIcon(category: string): string {
    return this.categoryIcons[category] || 'fa-file-text-o';
  }

  getScopeLabel(scope: string): string {
    return this.scopeLabels[scope] || scope;
  }

  getKbContentPreview(text: string): string {
    if (!text) return '';
    return text.length > 300 ? text.substring(0, 300) + '...' : text;
  }

  onCreateKnowledge(): void {
    this.kbEditMode = 'create';
    this.kbFormModel = this.getEmptyKbModel();
    this.kbTagsInput = '';
    this.showKbForm = true;
  }

  onEditKnowledge(entry: AiKnowledgeEntry): void {
    this.kbEditMode = 'edit';
    this.kbFormModel = { ...entry };
    this.kbTagsInput = (entry.tags || []).join(', ');
    this.showKbForm = true;
  }

  onDuplicateKnowledge(entry: AiKnowledgeEntry): void {
    this.kbEditMode = 'create';
    this.kbFormModel = {
      category: entry.category,
      title: entry.title + ' (Copy)',
      content: entry.content,
      hotelName: entry.hotelName,
      tags: [...(entry.tags || [])],
      scope: entry.scope,
      priority: entry.priority,
      isActive: false,
      source: entry.source
    };
    this.kbTagsInput = (entry.tags || []).join(', ');
    this.showKbForm = true;
  }

  onCancelKnowledge(): void {
    this.showKbForm = false;
    this.kbFormModel = this.getEmptyKbModel();
    this.kbTagsInput = '';
  }

  onSaveKnowledge(): void {
    if (this.isKbSaving) return;

    if (!this.kbFormModel.title || !this.kbFormModel.content || !this.kbFormModel.category) {
      this.snackBar.open('Please fill all required fields (Category, Title, Content)', 'Close', { duration: 3000 });
      return;
    }

    // Parse tags from comma-separated input
    const tags = this.kbTagsInput
      ? this.kbTagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0)
      : [];

    const payload: any = {
      category: this.kbFormModel.category,
      title: this.kbFormModel.title,
      content: this.kbFormModel.content,
      hotelName: this.kbFormModel.hotelName || '',
      tags: tags,
      scope: this.kbFormModel.scope,
      priority: this.kbFormModel.priority || 0,
      isActive: this.kbFormModel.isActive,
      source: this.kbFormModel.source || 'manual',
      userName: 'admin'
    };

    if (this.kbEditMode === 'edit' && this.kbFormModel.id) {
      payload.id = this.kbFormModel.id;
    }

    this.isKbSaving = true;
    this.knowledgeService.save(payload)
      .pipe(finalize(() => this.isKbSaving = false))
      .subscribe(
        () => {
          this.snackBar.open(
            this.kbEditMode === 'create' ? 'Knowledge entry created!' : 'Knowledge entry updated!',
            'Close',
            { duration: 3000, panelClass: 'success-snackbar' }
          );
          this.showKbForm = false;
          this.loadKnowledge();
        },
        (error) => {
          console.error('Error saving knowledge entry:', error);
          this.snackBar.open(`Failed to save: ${error.error?.message || 'Unknown error'}`, 'Close', {
            duration: 5000, panelClass: 'error-snackbar'
          });
        }
      );
  }

  onDeleteKnowledge(entry: AiKnowledgeEntry): void {
    if (!entry.id) return;
    if (!confirm(`Are you sure you want to delete "${entry.title}"?`)) return;

    this.knowledgeService.delete(entry.id).subscribe(
      () => {
        this.snackBar.open('Knowledge entry deleted', 'Close', { duration: 3000 });
        this.loadKnowledge();
      },
      (error) => {
        console.error('Error deleting knowledge entry:', error);
        this.snackBar.open('Failed to delete knowledge entry', 'Close', { duration: 3000 });
      }
    );
  }

  onToggleKnowledgeActive(entry: AiKnowledgeEntry): void {
    const payload: any = {
      id: entry.id,
      category: entry.category,
      title: entry.title,
      content: entry.content,
      hotelName: entry.hotelName,
      tags: entry.tags,
      scope: entry.scope,
      priority: entry.priority,
      isActive: !entry.isActive,
      source: entry.source,
      userName: 'admin'
    };

    this.knowledgeService.save(payload).subscribe(
      () => {
        this.snackBar.open(
          `"${entry.title}" ${!entry.isActive ? 'activated' : 'deactivated'}`,
          'Close',
          { duration: 3000 }
        );
        this.loadKnowledge();
      },
      (error) => {
        console.error('Error toggling knowledge entry:', error);
        this.snackBar.open('Failed to update entry', 'Close', { duration: 3000 });
      }
    );
  }
}
