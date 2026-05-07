import { inject, Injectable } from "@angular/core";
import { DomSanitizer, Title } from "@angular/platform-browser";
import { CurrencyPipe, DatePipe } from "@angular/common";
import { DbService } from "../connectData/db.service";
import { process } from "app/shared/utils/data-query.util";
import * as isglobals from "app/globals";
import * as _ from "lodash";
import * as $ from "jquery";
import * as moment from "moment";
import { environment as env, environment } from "environments/environment";
import { LibService } from "./lib.service";
import { Observable, Subject, takeUntil } from "rxjs";
// import { FeatureFlagManagerService } from "app/layout/common/feature-flag-manager.service";
// Constants
const PRICE_TYPES = {
  ACCOMMODATION_FEE: "ACCOMMODATIONFEE",
} as const;
@Injectable()
export class AppFactory extends LibService {
  constructor(
    protected _sanitizer: DomSanitizer,
    private currencyPipe: CurrencyPipe,
    private titleService: Title,
    private datePipe: DatePipe,
    private dbService: DbService,
  ) {
    super();
    // Cache user timezone once to avoid repeated calls to moment.tz.guess()
    this._cachedUserTimezone = moment.tz.guess();
  }
  listTypeBed: any = [];
  // private _featureFlagService = inject(FeatureFlagManagerService);
  private _unsubscribeAll: Subject<any> = new Subject<any>();
  feature: any = {};

  // Cache user timezone to avoid performance issues
  private _cachedUserTimezone: string = "Asia/Ho_Chi_Minh"; // Default fallback

  async getMasterCode() {
    let mcDate = new Date();
    let masterCode =
      "TC" +
      mcDate.getFullYear() +
      (mcDate.getMonth() + 1).toString().padStart(2, "0") +
      mcDate.getDate().toString().padStart(2, "0") +
      "-" +
      mcDate.getSeconds().toString().padStart(2, "0") +
      mcDate.getMilliseconds().toString().padStart(3, "0");
    return masterCode;
  }
  viewCurrencySymbol(currencyCode: string, locale: string = "en-US"): string {
    const currencyPipe = new CurrencyPipe(locale);
    // Using 0 as the amount to only get the currency symbol
    const currencySymbol = currencyPipe.transform(
      0,
      currencyCode,
      "symbol",
      "1.0-0",
    );
    // Extract the currency symbol from the transformed string
    return currencySymbol
      ? currencySymbol.replace(/\d/g, "").trim()
      : currencyCode;
  }
  convertDecimal(value) {
    if (value) return parseFloat(value.toString());
    else return 0;
    // const number = value.toFixed(2);
    // return parseFloat(number);
  }
  checknumberCol(data) {
    let lengthTiers = 0;
    data.forEach(function (value) {
      if (value.pax > 0) lengthTiers++;
    });
    return lengthTiers;
  }
  addDay(date, number) {
    const temp = new Date(date);
    return new Date(temp.setDate(temp.getDate() + number));
  }

  ConvertDateTimeToString(date: any, format: string): string {
    const value = date instanceof Date ? date : new Date(date);
    const result = this.datePipe.transform(value, format);
    return result || "";
  }

  // ============ STUB METHODS - Added to fix compilation errors ============

  getFeatureFlags(): any {
    return {};
  }

  setTitle(title: string): void {
    // Stub implementation
  }

  appendConfig(config: any): void {
    // Stub implementation
  }

  safeHtml(html: string): any {
    // Return the HTML as-is for now (you may want to implement DomSanitizer later)
    return html;
  }

  ngOnDestroy() {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }
}
