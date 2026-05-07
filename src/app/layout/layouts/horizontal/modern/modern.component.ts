import { Component, OnDestroy, OnInit, ViewEncapsulation, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { FuseNavigationService, FuseVerticalNavigationComponent } from '@fuse/components/navigation';
import { Navigation } from 'app/core/navigation/navigation.types';
import { NavigationService } from 'app/core/navigation/navigation.service';
import { UserService } from 'app/core/user/user.service';
import { AuthService } from 'app/core/auth/auth.service';
import { DbService } from 'app/shared/connectData/db.service';
import { environment as env } from 'environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
// data indexedDB
import { AppFactory } from 'app/shared/lib/common.service';
import * as signalR from '@microsoft/signalr';
import { LocalStorageService } from 'angular-web-storage';
import { MatSnackBar } from '@angular/material/snack-bar';
@Component({
  standalone: false,
  selector: 'modern-layout',
  templateUrl: './modern.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class ModernLayoutComponent implements OnInit, OnDestroy {
  isScreenSmall: boolean;
  navigation: Navigation;
  dialogObj: any;
  private _unsubscribeAll: Subject<any> = new Subject<any>();
  private router = inject(Router);
  private _snackBar = inject(MatSnackBar);
  private local = inject(LocalStorageService);
  /**
   * Constructor
   */
  constructor(
    private afac: AppFactory,
    private dbService: DbService,
    private http: HttpClient,
    private _userService: UserService,
    private _authService: AuthService,
    private _navigationService: NavigationService,
    private _fuseMediaWatcherService: FuseMediaWatcherService,
    private _fuseNavigationService: FuseNavigationService
  ) {}

  // -----------------------------------------------------------------------------------------------------
  // @ Accessors
  // -----------------------------------------------------------------------------------------------------

  /**
   * Getter for current year
   */
  get currentYear(): number {
    return new Date().getFullYear();
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  user: any = {};
  showCountriesSelect: any;
  countriesSelect: any;
  objectToken: any;
  countriesSelectValue: any;
  Country: any;
  showLinkHotels: boolean = false;
  infoWeb: any = {};
  lsCountry: any = [];
  async innitCountrySource(refresh: boolean = false) {
    let lsCountry: any;
    lsCountry = await this.dbService.getCountries().toPromise();
    this.lsCountry = lsCountry;
  }

  async innitCountrySelected(nation: any, refresh: boolean = false) {
    let countrySelected: any = '';
    if (refresh) {
      countrySelected = this.countriesSelect?.find((x) => x.nation == nation);
    }
  }

  private isDataEqual(data1: any, data2: any): boolean {
    return JSON.stringify(data1) === JSON.stringify(data2);
  }
  hiddenSelectSource: boolean = false;
  async ngOnInit(): Promise<void> {
    this.hiddenSelectSource = document.location.pathname.includes('/hotel');
    // Subscribe to navigation data
    await this.innitCountrySource();
    this.infoWeb = await this.dbService.getAdminImage(document.location.origin).toPromise();
    this.afac.appendConfig(this.infoWeb);

    this._navigationService.navigation$.pipe(takeUntil(this._unsubscribeAll)).subscribe((navigation: Navigation) => {
      this.navigation = navigation;
    });
    this._userService.user$.pipe(takeUntil(this._unsubscribeAll)).subscribe(async (user: any) => {
      if (user && user?._id) {
        this.user = user;
        this.InitSignalR();
        // this.startPeriodicInternetCheck();
        let temp = this.user?.role?.find((x) => x?.code == 'Product');
        this.Country = this.lsCountry?.find((x) => x.nation === this.user.nation);
        if (this.user.IsAdmin || this.user.IsProduct || (temp && temp.code == 'Product')) {
          this.showLinkHotels = true;
        }
        if (this.user?.multiNation?.length > 1) {
          this.showCountriesSelect = true;
          this.countriesSelectValue = this.user.nation;
          this.countriesSelect = this.lsCountry?.filter((x) => this.user.multiNation.find((n) => n === x.nation));
          this.innitCountrySelected(this.countriesSelectValue);
          this.objectToken = this.getDecodedAccessToken();
          // this.checkAndReloadData();
        }
      }
      // else {
      //   this.router.navigate(['/sign-out']);
      // }
    });

    // Subscribe to media changes
    this._fuseMediaWatcherService.onMediaChange$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(({ matchingAliases }) => {
        // Check if the screen is small
        this.isScreenSmall = !matchingAliases.includes('md');
      });
  }
  internetResult: any = {};
  internetQuality: string = 'Checking...';
  internetSpeed: number = 0;
  private intervalId: any;
  lastUpdateTime: Date = new Date();
  startPeriodicInternetCheck(): void {
    // Check immediately
    this.checkInternetQuality();
    // Then check every 30 minutes (reduced from 5 minutes to minimize server load)
    this.intervalId = setInterval(() => {
      // prevent wasting resources when the page is not in used
      if (document.hasFocus()) this.checkInternetQuality();
    }, 30 * 60 * 1000);
  }

  stopPeriodicInternetCheck(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private isCheckingInternet = false;

  checkInternetQuality(): void {
    // Prevent multiple simultaneous requests
    if (this.isCheckingInternet) {
      console.log('Internet quality check already in progress, skipping...');
      return;
    }

    this.isCheckingInternet = true;
    const startTime = new Date().getTime();
    const testFileSize = 100 * 1024; // 100KB (reduced from 1MB to minimize bandwidth usage)

    // Simulate a 1MB file download
    this.http
      .get(`${env.urlOperationApi}/config/GenerateTestFile?size=${testFileSize}`, { responseType: 'arraybuffer' })
      .subscribe(
        (response) => {
          const endTime = new Date().getTime();
          const clientDuration = endTime - startTime;
          const actualFileSize = response.byteLength;

          // Send the client-measured duration and actual file size to the server
          this.http
            .get<any>(
              `${env.urlOperationApi}/config/CheckInternetQuality?clientDuration=${clientDuration}&fileSize=${actualFileSize}`
            )
            .subscribe(
              (result) => {
                this.internetResult = result;
                this.internetQuality = result.quality;
                this.internetSpeed = result.downloadSpeed;
                this.lastUpdateTime = new Date();

                console.log(
                  `Internet Quality: Latency: ${result.latency}ms, Download: ${result.downloadSpeed}Mbps, Upload: ${result.uploadSpeed}Mbps, Quality: ${result.quality}, Client Duration: ${clientDuration}ms`
                );
                this.isCheckingInternet = false;
              },
              (error) => {
                console.error('Error processing internet quality result:', error);
                this.handleErrorState();
                this.isCheckingInternet = false;
              }
            );
        },
        (error) => {
          console.error('Error simulating file download:', error);
          this.handleErrorState();
          this.isCheckingInternet = false;
        }
      );
  }

  private handleErrorState(): void {
    this.internetQuality = 'Unable to check';
    this.internetSpeed = 0;
    this.lastUpdateTime = new Date();
  }
  SystemNotification: boolean = false;
  SystemNotificationMessage: any;
  InitSignalR(): void {
    let connection = new signalR.HubConnectionBuilder()
      .withUrl(env.RealtimeSignalR + '/messageHub', {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets,
      })
      .build();
    connection.on('checkuserlogin', async (rs) => {
      if (!rs?.notify) {
        if (rs?.userId && rs?.userId === this.user._id) {
          // User login check removed
        }
      } else {
        this.SystemNotificationMessage = this.afac.safeHtml(rs.message || '');
        this.SystemNotification = true;
      }
    });
    connection.start().catch((err) => console.log(err));
  }
  getClientInfo(callback: (clientInfo: string) => void) {
    const headers = new HttpHeaders({
      Authorization: '',
      'Content-Type': 'text/plain',
    });
    this.http
      .get('https://www.cloudflare.com/cdn-cgi/trace', { responseType: 'text', headers, withCredentials: false })
      .subscribe(
        (response: string) => {
          const lines = response.split('\n');
          const data = {};
          lines.forEach((line) => {
            const [key, value] = line.split('=');
            if (key && value) {
              data[key.trim()] = value.trim();
            }
          });

          const ip = data['ip'] || 'Unknown';
          const userAgent = navigator.userAgent;
          const screenResolution = `${window.screen.width}x${window.screen.height}`;
          const clientInfo = `IP: ${ip}, UserAgent: ${userAgent}, Screen: ${screenResolution}`;
          callback(clientInfo);
        },
        (error) => {
          console.error('Error fetching client info:', error);
          const fallbackInfo = `UserAgent: ${navigator.userAgent}, Screen: ${window.screen.width}x${window.screen.height}`;
          callback(fallbackInfo);
        }
      );
  }

  private checkAndReloadData(): void {
    const lastReloadDate = localStorage.getItem('lastReloadDate');
    const today = new Date().toDateString();

    if (lastReloadDate !== today) {
      this.reloadData(this.user.nation);
      localStorage.setItem('lastReloadDate', today);
    }
  }

  getDecodedAccessToken(): any {
    try {
      let token: any = this._authService.accessToken;
      return jwtDecode(token);
    } catch (Error) {
      return null;
    }
  }
  /**
   * On destroy
   */
  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this._unsubscribeAll.next(true);
    this._unsubscribeAll.complete();
    this.stopPeriodicInternetCheck();
  }
  changeNation(nation: any) {
    let username = this.user.username;
    this.innitCountrySelected(nation, true);
    localStorage.removeItem('AuthToken');
    this._authService
      .signIn({ username: username, password: this.objectToken.Password, nation: nation }, true)
      .subscribe(
        (rs) => {
          window.location.reload();
        },
        (response) => {
          alert('login failed');
        }
      );
  }
  notifi(type, mes, miliseconds = 4000, confirm = 'OK'): void {
    this._snackBar.open(mes, confirm, {
      duration: miliseconds,
      panelClass: [type === 'error' ? 'red-snackbar' : 'blue-snackbar'],
      verticalPosition: 'top',
      horizontalPosition: 'center',
    });
  }
  async reloadData(nation: string) {
    await this.dbService.ClearCachingRedis().toPromise();
    this.notifi('success', 'Purge Cache Successfull');
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Toggle navigation
   *
   * @param name
   */
  toggleNavigation(name: string): void {
    // Get the navigation
    const navigation = this._fuseNavigationService.getComponent<FuseVerticalNavigationComponent>(name);

    if (navigation) {
      // Toggle the opened status
      navigation.toggle();
    }
  }
}
