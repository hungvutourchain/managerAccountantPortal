import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface AiPromptConfig {
  id?: string;
  promptKey: string;
  name: string;
  description: string;
  systemPrompt: string;
  isActive: boolean;
  version?: number;
  userCreate?: string;
  dateCreate?: string;
  userUpdate?: string;
  dateUpdate?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AiPromptConfigService {
  private apiUrl = `${environment.urlOperationApi}/ai`;

  constructor(private http: HttpClient) {}

  getAllPrompts(): Observable<AiPromptConfig[]> {
    return this.http.get<AiPromptConfig[]>(`${this.apiUrl}/prompt-configs`);
  }

  getActivePrompt(key: string): Observable<AiPromptConfig> {
    return this.http.get<AiPromptConfig>(`${this.apiUrl}/prompt-config/${key}`);
  }

  savePrompt(prompt: AiPromptConfig): Observable<AiPromptConfig> {
    return this.http.post<AiPromptConfig>(`${this.apiUrl}/prompt-config`, prompt);
  }

  deletePrompt(id: string): Observable<boolean> {
    return this.http.delete<boolean>(`${this.apiUrl}/prompt-config/${id}`);
  }
}
