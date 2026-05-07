import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
@Component({  standalone: false,
    selector: 'view-ls-assigned-service',
    template: `
        <div class="col-md-12 mb-2">
        <p class="text-center" style="color: red;"> *The service(s) had been assigned. Do you want to continue?</p>
        <hr class="mt-2">
        </div>
        <div class="col-md-12 mb-2">
            <p>Service: <b> {{tempValueNotification.name }} {{tempValueNotification.NamePackge || ''}}</b></p>
            <p>Supplier: <b>{{tempValueNotification?.supplierName || ''}}</b></p>
            <p>Service Type: <b>{{tempValueNotification?.types || ''}}</b></p>
            <p>Location: <b>{{tempValueNotification?.location || ''}}</b></p>
            <p>Begin: <b>{{tempValueNotification?.strbegindate}}</b></p>
            <p>End Date: <b>{{tempValueNotification?.strenddate || ''}}</b></p>
        </div>
        <div class="col-md-12" *ngIf="tempValueNotification?.Items_Calculator?.lsAssignedService?.length">
            <table class="table table-bordered table-hover">
            <thead>
                <tr>
                <th scope="col">Service</th>
                <th scope="col">Location</th>
                <th scope="col">Phone</th>
                <th scope="col">Email</th>
                <th scope="col">Remarks</th>
                <th scope="col">Status</th>
                </tr>
            </thead>
            <tbody>
                <tr *ngFor="let item of tempValueNotification?.Items_Calculator?.lsAssignedService">
                <td>{{item.serviceName || ''}}</td>
                <td>{{item.location || ''}}</td>
                <td>{{item.phone || ''}}</td>
                <td>{{item.email || ''}}</td>
                <td>{{item.note || ''}}</td>
                <td>{{item.status || ''}}</td>
                </tr>
            </tbody>
            </table>
        </div>
    `,
    styles: [``]
})
export class ViewLsAssignedServiceComponent implements OnChanges {
    @Input() tempValueNotification: any = {}; // periods of option select this.   
    constructor(
    ) { }
    ngOnChanges(changes: SimpleChanges): void {

    }
}
