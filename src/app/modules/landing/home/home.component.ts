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
        { "url": 'sign-in?type=hotel&redirectURL=%2Fhotel', 'type': 'hotel', "name": "ACCOMMODATION", "show": true, image: './assets/images/login/Hotel.jpg', contnet: 'Hotel platform to manage the  contracts from suppliers  on the system for (B2B & B2C)' },
        { "url": 'sign-in?type=tour&redirectURL=%2Ftours', 'type': 'tour', "name": "EXCURSION / BOOKINGS", "show": true, image: './assets/images/login/Tour.jpg', contnet: 'Excursion platform to maximize from contracting, product, quotation to operation.' },
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
