export interface EmailTemplate {
    id?: string;
    tourId: string;
    templateType: EmailTemplateType;
    emailType?: string;
    subject: string;
    body: string;
    recipients: string[];
    replyToName?: string;
    replyToEmail?: string;
    cc?: string[];
    bcc?: string[];
    attachments?: EmailAttachment[];
    createdDate?: Date;
    createdBy?: string;
    modifiedDate?: Date;
    modifiedBy?: string;
}

export enum EmailTemplateType {
    TourConfirmation = 'TourConfirmation',
    ServiceUpdate = 'ServiceUpdate',
    PaymentReminder = 'PaymentReminder',
    BookingConfirmation = 'BookingConfirmation',
    CancellationNotice = 'CancellationNotice',
    SupplierRequest = 'SupplierRequest',
    SupplierConfirmation = 'SupplierConfirmation',
    Custom = 'Custom'
}

export interface EmailAttachment {
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
}

export interface SendEmailRequest {
    tourId: string;
    templateId?: string;
    template?: EmailTemplate;
    sourceSystem: EmailSourceSystem;
    sendImmediately: boolean;
    scheduledDate?: Date;
    productCode?: string;
    bookingName?: string;
}

export enum EmailSourceSystem {
    Sale = 'Sale',
    OPE = 'OPE'
}

export interface EmailHistory {
    id: string;
    tourId: string;
    productCode?: string;
    bookingName?: string;
    templateType: EmailTemplateType;
    subject: string;
    body: string;
    recipients: string[];
    cc?: string[];
    bcc?: string[];
    sentDate: Date;
    sentBy: string;
    sentByEmail?: string;
    status: EmailStatus;
    sourceSystem: EmailSourceSystem;
    errorMessage?: string;
    openedDate?: Date;
    clickedDate?: Date;
}

export enum EmailStatus {
    Pending = 'Pending',
    Sent = 'Sent',
    Failed = 'Failed',
    Queued = 'Queued',
    Opened = 'Opened',
    Clicked = 'Clicked'
}

export interface EmailHistoryFilter {
    tourId?: string;
    templateType?: EmailTemplateType;
    status?: EmailStatus;
    sourceSystem?: EmailSourceSystem;
    sentBy?: string;
    fromDate?: Date;
    toDate?: Date;
    pageIndex: number;
    pageSize: number;
}

export interface EmailRelayRequest {
    tourId: string;
    sourceSystem: EmailSourceSystem;
    targetSystem: EmailSourceSystem;
    emailData: any;
    relayType: RelayType;
}

export enum RelayType {
    SendToOPE = 'SendToOPE',
    SendToHotelTour = 'SendToHotelTour',
    Sync = 'Sync'
}

// Backend models (match C# structure)
export interface EmailLog {
    _id?: string;
    id?: string;
    confirmId: string;
    fromSupplier: boolean;
    data: EmailLogData;
    date: Date | string;
}

export interface EmailLogData {
    // EmailInfo base fields
    company?: any;
    supplier?: any;
    passCodeLogin?: string;
    masterCode?: string;
    type?: string;
    logs?: any[];
    items?: any[];
    reply_note?: string;
    bookedBy?: string;
    bookedDepartment?: string;
    modifiedBy?: string;
    modifiedDepartment?: string;
    
    // Custom email fields stored in Data object
    to?: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    subject?: string;
    body?: string;
    html?: string;
    status?: string;
    sentDate?: Date | string;
    sentBy?: string;
    sourceSystem?: string;
    templateType?: string;
    errorMessage?: string;
    openedDate?: Date | string;
    clickedDate?: Date | string;
    
    // Item info
    item?: any;
    
    // Additional fields with uppercase variants
    To?: string | string[];
    Cc?: string | string[];
    Bcc?: string | string[];
    Subject?: string;
    Body?: string;
    Html?: string;
    Status?: string;
    SentDate?: Date | string;
    SentBy?: string;
    SourceSystem?: string;
    TemplateType?: string;
    Type?: string;
    ErrorMessage?: string;
    OpenedDate?: Date | string;
    ClickedDate?: Date | string;
    Recipients?: string | string[];
}

export interface EmailLogResponse {
    datas?: EmailLog[];
    Datas?: EmailLog[];
    data?: EmailLog[];
    Data?: EmailLog[];
    total?: number;
    Total?: number;
}
