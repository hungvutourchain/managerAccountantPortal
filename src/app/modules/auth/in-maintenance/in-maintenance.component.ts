import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { DbService } from 'app/shared/connectData/db.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'app/core/auth/auth.service';
import { UserService } from 'app/core/user/user.service';
import { fuseAnimations } from '@fuse/animations';
import { HttpClient } from '@angular/common/http';

@Component({  standalone: false,
  selector: 'in-maintenance-page',
  styleUrl: './in-maintenance.component.scss',
  templateUrl: './in-maintenance.component.html',
  encapsulation: ViewEncapsulation.None,
  animations: fuseAnimations,
})
export class InMaintenanceComponent implements OnInit {

  constructor(
    private _userService: UserService,
    private _authService: AuthService,
    private activatedRoute: ActivatedRoute,
    private _router: Router,
    private http: HttpClient,
    private dbService: DbService
  ) {}
  
  ngOnInit() {
    // throw new Error("Method not implemented.");
  }
}
