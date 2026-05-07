import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface AiServiceConfig {
  id?: string;
  configKey: string;
  name: string;
  endpoint: string;
  apiKey: string;
  deploymentName: string;
  apiVersion: string;
  isActive: boolean;
  supportsNativePdf?: boolean;
  maxImagePages?: number;
  maxOutputTokens?: number;
  userCreate?: string;
  dateCreate?: string;
  userUpdate?: string;
  dateUpdate?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AiServiceConfigService {
  private apiUrl = `${environment.urlOperationApi}/ai`;

  constructor(private http: HttpClient) {}

  getAllConfigs(): Observable<AiServiceConfig[]> {
    return this.http.get<AiServiceConfig[]>(`${this.apiUrl}/service-configs`);
  }

  getActiveConfig(key: string): Observable<AiServiceConfig> {
    return this.http.get<AiServiceConfig>(`${this.apiUrl}/service-config/${key}`);
  }

  saveConfig(config: AiServiceConfig): Observable<AiServiceConfig> {
    return this.http.post<AiServiceConfig>(`${this.apiUrl}/service-config`, config);
  }

  deleteConfig(id: string): Observable<boolean> {
    return this.http.delete<boolean>(`${this.apiUrl}/service-config/${id}`);
  }
}
