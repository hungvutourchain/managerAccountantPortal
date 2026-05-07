import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface AiKnowledgeEntry {
  id?: string;
  category: string;
  title: string;
  content: string;
  hotelName?: string;
  tags?: string[];
  scope: string;
  priority: number;
  isActive: boolean;
  source?: string;
  usageCount?: number;
  userCreate?: string;
  dateCreate?: string;
  userUpdate?: string;
  dateUpdate?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AiKnowledgeService {
  private apiUrl = `${environment.urlOperationApi}/ai`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<AiKnowledgeEntry[]> {
    return this.http.get<AiKnowledgeEntry[]>(`${this.apiUrl}/knowledge`);
  }

  getActive(scope: string = 'all', hotelName: string = ''): Observable<AiKnowledgeEntry[]> {
    let url = `${this.apiUrl}/knowledge/active?scope=${encodeURIComponent(scope)}`;
    if (hotelName) {
      url += `&hotelName=${encodeURIComponent(hotelName)}`;
    }
    return this.http.get<AiKnowledgeEntry[]>(url);
  }

  save(entry: any): Observable<AiKnowledgeEntry> {
    return this.http.post<AiKnowledgeEntry>(`${this.apiUrl}/knowledge`, entry);
  }

  delete(id: string): Observable<boolean> {
    return this.http.delete<boolean>(`${this.apiUrl}/knowledge/${id}`);
  }
}
