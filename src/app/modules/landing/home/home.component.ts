import { Component, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { DbService } from 'app/shared/connectData/db.service';
import { environment as env } from 'environments/environment';
@Component({  standalone: false,
    selector: 'landing-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class LandingHomeComponent {
    /**
     * Constructor
     */
    currentYear = new Date().getFullYear();
    listMenu = [
        { "url": 'sign-in?type=hotel&redirectURL=%2Fconfiguration', 'type': 'hotel', "name": "PAYABLES / PAYROLL", "show": true, image: './assets/images/login/Hotel.jpg', contnet: 'Manage supplier bills, payroll cycles, and expense approvals in one accounting workspace.' },
        { "url": 'sign-in?type=tour&redirectURL=%2Fconfiguration', 'type': 'tour', "name": "LEDGER / REPORTING", "show": true, image: './assets/images/login/Tour.jpg', contnet: 'Control journal entries, reconciliations, and financial reporting from a unified dashboard.' },
    ]
    constructor(
        private _router: Router,
        private dbService: DbService,
    ) {
        this.loadInfo()
    }
    infoWeb: any = {}
    async loadInfo() {
        try {
            this.infoWeb = await this.dbService.getAdminImage(document.location.origin).toPromise()
        }
        catch (err) {
            console.log("Load data fail!", err)
        }
    }
    actionPage(url, type) {
        this._router.navigate([url], { queryParams: { type: type } });
    }
}
