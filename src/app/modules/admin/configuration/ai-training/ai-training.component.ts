import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DeepseekTrainingService, DeepseekTrainingRequest } from './deepseek-training.service';
import { finalize } from 'rxjs/operators';

@Component({
  standalone: false,
  selector: 'app-ai-training',
  templateUrl: './ai-training.component.html',
  styleUrls: ['./ai-training.component.scss']
})
export class AiTrainingComponent implements OnInit {
  trainingModel = {
    modelName: 'deepseek-chat',
    description: '',
    trainingData: ''
  };
  
  isLoading = false;
  trainingHistory: any[] = [];
  availableModels = [
    { id: 'deepseek-coder', name: 'Deepseek Coder' },
    { id: 'deepseek-chat', name: 'Deepseek Chat' },
    { id: 'deepseek-llm', name: 'Deepseek LLM' }
  ];

  constructor(
    private deepseekService: DeepseekTrainingService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadTrainingHistory();
  }

  resetForm(): void {
    this.trainingModel = {
      modelName: 'deepseek-chat',
      description: '',
      trainingData: ''
    };
  }

  onSubmit(): void {
    if (this.isLoading) return;

    if (!this.trainingModel.modelName || !this.trainingModel.description || this.trainingModel.description.length < 10 || !this.trainingModel.trainingData || this.trainingModel.trainingData.length < 100) {
      this.snackBar.open('Please fill all required fields correctly', 'Close', {
        duration: 3000,
        panelClass: 'error-snackbar'
      });
      return;
    }

    const request: DeepseekTrainingRequest = {
      modelName: this.trainingModel.modelName,
      description: this.trainingModel.description,
      trainingData: this.trainingModel.trainingData
    };

    this.isLoading = true;
    this.deepseekService.trainModel(request)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe(
        response => {
          this.snackBar.open('Training initiated successfully!', 'Close', {
            duration: 5000,
            panelClass: 'success-snackbar'
          });
          
          // Add the new training to history
          this.trainingHistory.unshift({
            trainingId: response.trainingId,
            modelName: request.modelName,
            description: request.description,
            startTime: new Date(response.startTime),
            status: 'in-progress',
            accuracy: 'N/A'
          });
          
          // Reset form
          this.resetForm();
        },
        error => {
          console.error('Training error:', error);
          this.snackBar.open(`Training failed: ${error.error?.message || 'Unknown error'}`, 'Close', {
            duration: 5000,
            panelClass: 'error-snackbar'
          });
        }
      );
  }

  loadTrainingHistory(): void {
    // This would typically come from an API call
    // For now, we'll use mock data
    this.trainingHistory = [
      {
        trainingId: 'tr_123456',
        modelName: 'deepseek-chat',
        description: 'Initial training for customer service',
        startTime: new Date(Date.now() - 86400000), // 1 day ago
        status: 'completed',
        accuracy: '87%'
      },
      {
        trainingId: 'tr_123457',
        modelName: 'deepseek-coder',
        description: 'Code completion training',
        startTime: new Date(Date.now() - 172800000), // 2 days ago
        status: 'completed',
        accuracy: '92%'
      }
    ];
  }

  getModelNameById(modelId: string): string {
    const model = this.availableModels.find(m => m.id === modelId);
    return model ? model.name : 'Unknown Model';
  }
}