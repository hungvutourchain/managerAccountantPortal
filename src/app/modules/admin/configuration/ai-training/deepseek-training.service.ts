import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface DeepseekTrainingRequest {
  trainingData: string;
  modelName: string;
  description: string;
}

export interface DeepseekTrainingResponse {
  success: boolean;
  message: string;
  trainingId: string;
  startTime: Date;
}

@Injectable({
  providedIn: 'root'
})
export class DeepseekTrainingService {
  private apiUrl = `${environment.urlOperationApi}/deepseek/training`;

  constructor(private http: HttpClient) { }

  trainModel(request: DeepseekTrainingRequest): Observable<DeepseekTrainingResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<DeepseekTrainingResponse>(this.apiUrl, request, { headers });
  }

  getTrainingStatus(trainingId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/status/${trainingId}`);
  }
}
