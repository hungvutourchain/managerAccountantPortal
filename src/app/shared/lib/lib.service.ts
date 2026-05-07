import { Injectable } from '@angular/core';
import { Moment } from 'moment';
import md5 from 'md5';
import * as _ from 'lodash';
import * as moment from 'moment-timezone';
import { Query } from '@syncfusion/ej2-data';
@Injectable({
  providedIn: 'root',
})
export class LibService {
  public tenantTimeZone: string;

  constructor() {
    this.tenantTimeZone = moment.tz.guess();
  }
  markupPercent(vl, percent) {
    return percent ? vl * (1 + percent / 100) : vl;
  }
  // ------------------------------------------------------------------------------------------
}
