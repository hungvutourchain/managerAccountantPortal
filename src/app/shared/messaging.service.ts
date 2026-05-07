import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
// import { Liquid } from 'liquidjs';
import { environment } from 'environments/environment';
// REMOVED: notification.service not found
// import { NotificationService } from './notification.service';

@Injectable({
    providedIn: 'root'
})
export class MessagingService {
    constructor(
        private http: HttpClient
        // REMOVED: NotificationService not found
        // private notificationService: NotificationService
    ) {
        if (!environment.notifyApiUrl)
            throw "Notification api url is required. Setting in environment please.";

        this.initInAppMessage();
        this.initTemplateEngine();
        this.loadTemplateData();
    }

    private notifyUrl: string = environment.notifyApiUrl;

    // --------------------------------------------------------------------- inapp controller
    private initInAppMessage() {
        // REMOVED: notificationService not found
        // this.notificationService.onInApp(this._onmessage);
    }
    private _onmessage = async (data) => {
        await this.loadMessage();
    }
    //
    private callback: Function;
    setCallBack(callback: Function) {
        this.callback = callback;
    }
    //
    private constNotReadOnly: string = "notReadOnly";
    getNotReadOnly() {
        let notReadOnly = localStorage.getItem(this.constNotReadOnly);
        if (!notReadOnly) {
            notReadOnly = 'true';
            localStorage.setItem(this.constNotReadOnly, notReadOnly);
        }
        return notReadOnly === 'true';
    }
    setNotReadOnly(notReadOnly = true) {
        localStorage.setItem(this.constNotReadOnly, notReadOnly.toString());
    }
    //
    private nation: string;
    setNation(nation: string) {
        this.nation = nation;
    }
    //
    private numOfMessage = 10;
    async loadMore() {
        this.numOfMessage += 10;
        await this.loadMessage();
    }
    getNumOfMessage() {
        return this.numOfMessage;
    }
    //
    loadMessage() {
        return new Promise((ok, fail) => {
            this.http.post(this.notifyUrl + "/inapp", {
                Nation: this.nation || '',

                Start: 0,
                Length: parseInt(this.numOfMessage.toString()),
                NotReadOnly: this.getNotReadOnly(),

                WithMessage: true,
                WithMessageConfirm: false,
                WithMessageRevise: false,
                WithRecentConfirmedBooking: false
            })
                .subscribe(data => {
                    if (this.callback)
                        this.callback(data);
                    ok(true);
                }, error => {
                    console.log("MessagingService.loadMessage()", error);
                    fail();
                });
        });

    }
    //
    markAll(mode) {
        return new Promise((resolve, reject) => {
            if (mode !== 'view' && mode !== 'read')
                reject("mode is required");

            this.http.put(this.notifyUrl + "/inapp/markall?handler=" + mode, null)
                .subscribe(data => {
                    resolve(data);
                    this.loadMessage();
                }, error => {
                    reject(error);
                });
        });
    }
    markAs(mode, lsMsgId) {
        return new Promise((resolve, reject) => {
            if (mode !== 'view' && mode !== 'read')
                reject("mode is required");

            if (!lsMsgId || !Array.isArray(lsMsgId) || lsMsgId.length === 0)
                reject("lsMsgId is required");

            this.http.put(this.notifyUrl + "/inapp?handler=" + mode, { MessageIds: lsMsgId })
                .subscribe(data => {
                    resolve(data);
                }, error => {
                    reject(error);
                });
        });
    }

    // notify controller
    sendMessages(emails: IEmail[], inApps: IInApp[]) {
        return this.send({ Emails: emails, InApps: inApps });
    }
    sendEmails(emails: IEmail[]) {
        return this.send({ Emails: emails, InApps: null });
    }
    sendNotifications(inApps: IInApp[]) {
        return this.send({ Emails: null, InApps: inApps });
    }
    private send(msg) {
        return new Promise((resolve, reject) => {
            if ((!msg.Emails || !Array.isArray(msg.Emails) || msg.Emails.length === 0)
                && (!msg.InApps || !Array.isArray(msg.InApps) || msg.InApps.length === 0))
                reject("Message is not valid. Required email list or notification list.");

            if (msg.Emails && msg.Emails.length > 0) {
                msg.Emails.forEach((element, index) => {
                    if (!element.Email)
                        reject("Email message " + index + " is not valid. Required email address.");
                    if (!element.Subject)
                        reject("Email message " + index + " is not valid. Required subject.");
                    if (!element.Content)
                        reject("Email message " + index + " is not valid. Required content.");
                });
            }

            if (msg.InApps && msg.InApps.length > 0) {
                msg.InApps.forEach((element, index) => {
                    if (!element.UserId && !element.UserName)
                        reject("Notification message " + index + " is not valid. Required user id or user name.");
                    if (!element.EventType)
                        reject("Notification message " + index + " is not valid. Required event type.");
                    if (!element.Subject)
                        reject("Notification message " + index + " is not valid. Required subject.");
                });
            }

            this.http.post(this.notifyUrl + "/notify", msg)
                .subscribe(data => {
                    resolve(data);
                }, error => {
                    reject(error);
                });
        });
    }

    // config controller
    getEmailConfig() {
        return this.http.get(this.notifyUrl + "/config/email");
    }
    setEmailConfig(emailConfig: IEmailConfig) {
        return this.http.post(this.notifyUrl + "/config/email", emailConfig);
    }

    getRemindConfig(nation) {
        return this.http.get<IRemindConfig>(this.notifyUrl + "/config/notAssignRemind?nation=" + nation);
    }
    setRemindConfig(remindConfig: IRemindConfigCommand) {
        return this.http.post<boolean>(this.notifyUrl + "/config/notAssignRemind", remindConfig);
    }
    testRemindConfig(nation:any) {
        return this.http.post<boolean>(this.notifyUrl + "/config/notAssignRemind/test", {nation: nation});
    }
    // default email OPE config
    getDefaultEmailOpeConfig(nation) {
        return this.http.get(environment.urlOperationApi + "/DefaultEmailOpe/GetConfig?nation=" + nation);
    }
    setDefaultEmailOpeConfig(config: IDefaultEmailOpeConfig) {
        return this.http.post<boolean>(environment.urlOperationApi + "/DefaultEmailOpe/SaveConfig", config);
    }

    // cutoff mail controller

    getCutoffmailConfig(nation) {
        return this.http.get<IRemindConfig>(this.notifyUrl + "/config/cutoffMailRemind?nation=" + nation);
    }
    setCutoffmailRemindConfig(remindConfig: any) {
        return this.http.post<boolean>(environment.urlOperationApi  + "/v1/cutoffMailRemind/TriggerCutoffNotification", remindConfig);
    }
    testCutoffmailRemindConfig(nation:any) {
        return this.http.post<boolean>(this.notifyUrl + "/cutoffMailRemind/test", {nation: nation});

    }

    // ---------------------------------------------------------------------------------------------------------
    private templateEngine: any;
    private initTemplateEngine() {
        this.templateEngine = {};
    }

    //
    private templateApiUrl = environment.notifyApiUrl;
    private templateData;
    private loadTemplateData() {
        return new Promise((resolve, reject) => {
            this.http.post(this.templateApiUrl + "/template", {}, { responseType: 'text' })
                .subscribe(data => {
                    this.templateData = eval(data);
                    resolve(true);
                }, error => {
                    reject({
                        errorText: "Fail in MessagingService when loadTemplateData()",
                        error
                    });
                });
        });
    }
    private getTemplate(name) {
        if (this.templateData && this.templateData.length) {
            let template = this.templateData.find(x => x.name === name);
            return template && template.value ? template.value : '';
        }
        else return ''
    }
    public renderTemplate(template, data) {
        return this.templateEngine.parseAndRenderSync(template, data);
    }
    public renderTemplateByName(templateName, data) {
        return this.renderTemplate(this.getTemplate(templateName), data);
    }



    // ---------------------------------------------------------------------------------------------------------
    // utilities
    // event ProposalUpdate
    createNotificationMessages_ProposalUpdate(user, assignedBys: string[], tour, oldBegindate, oldEnddate, auditCode) {
        return assignedBys.map(x => {
            let data = {
                _id: tour._id,
                productCode: tour.productCode,
                codeVersion: tour.codeVersion,
                bookingName: tour.bookingName,

                updatedBy: user.username,
                DateUpdate: tour.DateUpdate,

                oldBegindate: oldBegindate,
                oldEnddate: oldEnddate,
                begindate: tour.begindate,
                enddate: tour.enddate
            };

            return {
                Nation: user.nation,

                UserId: null,
                UserName: x,
                EventType: "ProposalUpdate",
                Subject: this.renderTemplateByName("ProposalUpdate", data),
                Link: "tours/auditlog?code=" + auditCode,
                Data: JSON.stringify(data),

                Unique: true,
                BookingId: tour._id
            };
        });
    }

    // event ProposalConfirmed
    createNotificationMessages_ProposalConfirmed(user, assignedBys: string[], tour, oldBegindate, oldEnddate, unique) {
        return assignedBys.map(x => {
            let data = {
                _id: tour._id,
                productCode: tour.productCode,
                codeVersion: tour.codeVersion,
                bookingName: tour.bookingName,

                updatedBy: user.username,
                DateUpdate: tour.DateUpdate,

                oldBegindate: oldBegindate,
                oldEnddate: oldEnddate,
                begindate: tour.begindate,
                enddate: tour.enddate
            };

            return {
                Nation: user.nation,

                UserId: null,
                UserName: x,
                EventType: "ProposalConfirmed",
                Filter: "ProposalConfirmed",
                Subject: this.renderTemplateByName("ProposalConfirmed", data),
                Link: "tours?code=" + tour._id,
                Data: JSON.stringify(data),

                Unique: unique,
                BookingId: tour._id
            };
        });
    }

    // email test
    createSendTestEmail(email) {
        const safeEmailTemplate = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Tour Chain - Email Configuration Test</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
                    <!-- Nội dung email -->
                    <main style="padding: 20px 0;">
                        <h2 style="color: #2c5aa0; margin-bottom: 20px;">Email Configuration Test - Successful</h2>
                        
                        <p style="margin-bottom: 15px;">Dear Valued Customer,</p>
                        
                        <p style="margin-bottom: 15px;">
                            This is a test email to verify that our email configuration is working correctly. 
                            If you receive this message, our email system is functioning properly.
                        </p>
                        
                        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #2c5aa0; margin: 20px 0;">
                            <h3 style="color: #2c5aa0; margin-top: 0;">Contact Information</h3>
                            <p style="margin: 5px 0;"><strong>Company:</strong> Tour Chain</p>
                            <p style="margin: 5px 0;"><strong>Email:</strong> info@tourchain.com</p>
                            <p style="margin: 5px 0;"><strong>Website:</strong> <a href="https://tourchain.com" style="color: #2c5aa0; text-decoration: none;">https://tourchain.com</a></p>
                            <p style="margin: 5px 0;"><strong>Business Hours:</strong> Monday - Friday, 9:00 AM - 6:00 PM</p>
                        </div>
    
                        <p style="margin-bottom: 15px;">
                            Thank you for your interest in our travel services. We look forward to serving you.
                        </p>
    
                        <p style="margin-bottom: 15px;">
                            Best regards,<br>
                            <strong>Tour Chain Team</strong>
                        </p>
                    </main>
    
                    <!-- Footer bắt buộc -->
                    <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center;">
                        <div style="margin-bottom: 15px;">
                            <strong style="color: #2c5aa0;">Tour Chain Company</strong><br>
                            [Complete Company Address]<br>
                            [City, Country]<br>
                            Phone: [Phone Number] | Fax: [Fax Number]
                        </div>
                        
                        <!-- Compliance Links -->
                        <div style="margin-bottom: 15px;">
                            <a href="{{unsubscribe}}" style="color: #2c5aa0; text-decoration: none; margin: 0 10px;">Unsubscribe</a> |
                            <a href="{{update_profile}}" style="color: #2c5aa0; text-decoration: none; margin: 0 10px;">Update Profile</a> |
                            <a href="https://tourchain.com/privacy-policy" style="color: #2c5aa0; text-decoration: none; margin: 0 10px;">Privacy Policy</a> |
                            <a href="https://tourchain.com/terms" style="color: #2c5aa0; text-decoration: none; margin: 0 10px;">Terms of Service</a>
                        </div>
                        
                        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;">
                            <p style="margin: 0; font-size: 11px;">
                                This email was sent to ${email} as part of our email configuration testing process.
                                This is an automated message from a legitimate business email system.
                            </p>
                            <p style="margin: 5px 0 0 0; font-size: 11px;">
                                © ${new Date().getFullYear()} Tour Chain. All rights reserved.
                            </p>
                        </div>
                    </footer>
                </div>
            </body>
            </html>
        `;
    
        let emailMsg: IEmail = {
            Email: email,
            Subject: "Tour Chain - Email Configuration Test Successful",
            Content: safeEmailTemplate,
            ReplyToEmail: '',
            ReplyToName: 'Tour Chain Support',
            CcEmails: []
        };
    
        return emailMsg;
    }
    createSendMarketingEmail(vl) {
        let emailMsg: IEmail = {
            Email: vl.Email,
            Subject: vl.Subject,
            Content: vl.Content,
            ReplyToEmail: vl.ReplyToName,
            ReplyToName: vl.ReplyToEmail,
            CcEmails: vl.CcEmails
        };
        return emailMsg
    }
}

export interface IEmail {
    Email: string,
    Subject: string,
    Content: string,
    ReplyToName: string,
    ReplyToEmail: string,
    CcEmails: string[],
}

export interface IInApp {
    Nation: string,

    UserId: string,
    UserName: string,
    EventType: string,
    Filter: string,
    Subject: string,
    Link: string,
    Data: string, // json

    // for only Booking Confirm Event
    Unique: boolean,
    BookingId: string
}

interface IMessage {
    Emails: IEmail[],
    InApps: IInApp[]
}

//
export interface IEmailConfig {
    mailServer: string,
    mailPort: number,
    senderName: string,
    sender: string,
    password: string,
    withCurrentUser: boolean,
}

export interface IRemindConfig {
    nation: string,
    travelDaysBefore: number,
    cron: string,
    emails: string[],
    watchId: string,
    updateBy: string,
    emailTemplateId?: string
}

export interface IRemindConfigCommand {
    cron: string,
    nation: string,
    userName: string,
    emails: string[],
    travelDaysBefore: number,
    baseUrl?: string,
    currency?: string,
    idTours?: string[],
    emailTemplateId?: string,
    emailTemplateContent?: string,
    emailTemplateSubject?: string
}

export interface IDefaultEmailOpeConfig {
    nation: string;
    userName: string;
    to: string[];
    cc: string[];
    bcc: string[];
}
