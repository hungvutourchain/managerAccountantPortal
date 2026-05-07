import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { environment } from 'environments/environment';
import { AppModule } from 'app/app.module';
import { registerLicense } from '@syncfusion/ej2-base';

// Import Angular compiler for JIT compilation only when needed
if (environment.production) {
  import('@angular/compiler');
}
// import * as Sentry from '@sentry/angular';

// registerLicense('Ngo9BigBOggjHTQxAR8/V1NDaF5cWWtCf1FpRmJGdld5fUVHYVZUTXxaS00DNHVRdkdnWH5ccnZXRGBYUkx+WEs='); // 27.x.xx
// registerLicense('Ngo9BigBOggjHTQxAR8/V1NMaF5cXmBCf1FpRmJGdld5fUVHYVZUTXxaS00DNHVRdkdmWX1ceHRUQ2NZVkV1WEU='); // 28.x.xx
// registerLicense('ORg4AjUWIQA/Gnt3VVhhQlJDfV5AQmBIYVp/TGpJfl96cVxMZVVBJAtUQF1hTH5UdkZjWn9acXZVRmBfWkd2'); // 30.x.xx
registerLicense('Ngo9BigBOggjHTQxAR8/V1JFaF5cXGRCf1FpRmJGdld5fUVHYVZUTXxaS00DNHVRdkdmWXZceXZXRWZcU0Z0VkFWYEg='); // 31.x.xx
// Sentry.init({
//     dsn: environment.Sentry.dsn,
//     integrations: [
//       Sentry.browserTracingIntegration(),
//       Sentry.replayIntegration(),
//     ],
//     // Tracing
//     tracesSampleRate: 1.0, //  Capture 100% of the transactions
//     // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
//     tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],
//     // Session Replay
//     replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
//     replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
//   });
// Will enable when needed
// if (typeof localStorage !== 'undefined') {
//   let shouldHaveFullReload = false;
//   const versionKey = '_version.hotelTourPortal',
//     localVersion = localStorage.getItem(versionKey);
//   // TODO: check with the remote (API calling)
//   // Currently use the static text first
//   const remoteVersion = '1.0.3';

//   if (!localVersion || localVersion !== remoteVersion) {
//     localStorage.setItem(versionKey, remoteVersion);
//     shouldHaveFullReload = true;
//   }

//   if (shouldHaveFullReload) {
//     window.location.href = window.location.pathname + '?cacheBust=' + Date.now();
//   }
// }
if (environment.production) {
  enableProdMode();

  // Override console methods
  console.log = () => {};
  console.debug = () => {};
  // console.error = () => {};
}

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch((err) => console.error(err));
