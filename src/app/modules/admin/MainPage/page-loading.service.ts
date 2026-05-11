import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable()
export class PageLoadingService {
  private readonly _loading$ = new BehaviorSubject<boolean>(false);
  readonly isLoading$ = this._loading$.asObservable();

  setLoading(value: boolean): void {
    this._loading$.next(value);
  }
}
