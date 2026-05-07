import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface AiUserPermission {
  id?: string;
  userId: string;
  fullname: string;
  email: string;
  avatar?: string;
  allowedFeatures: string[];
  isActive: boolean;
  userCreate?: string;
  dateCreate?: string;
  userUpdate?: string;
  dateUpdate?: string;
}

export interface AiUserDto {
  userId: string;
  fullname: string;
  email: string;
  avatar?: string;
}

export interface CheckAiAccessResult {
  hasAccess: boolean;
  allowedFeatures: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AiUserPermissionService {
  private apiUrl = `${environment.urlOperationApi}/ai`;

  constructor(private http: HttpClient) {}

  getAvailableUsers(): Observable<AiUserDto[]> {
    return this.http.get<AiUserDto[]>(`${this.apiUrl}/users-available`);
  }

  getAllPermissions(): Observable<AiUserPermission[]> {
    return this.http.get<AiUserPermission[]>(`${this.apiUrl}/user-permissions`);
  }

  checkAccess(userId: string, feature?: string): Observable<CheckAiAccessResult> {
    let url = `${this.apiUrl}/user-permission/check?userId=${userId}`;
    if (feature) url += `&feature=${feature}`;
    return this.http.get<CheckAiAccessResult>(url);
  }

  savePermission(permission: any): Observable<AiUserPermission> {
    return this.http.post<AiUserPermission>(`${this.apiUrl}/user-permission`, permission);
  }

  deletePermission(id: string): Observable<boolean> {
    return this.http.delete<boolean>(`${this.apiUrl}/user-permission/${id}`);
  }
}
