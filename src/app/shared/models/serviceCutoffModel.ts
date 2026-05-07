
export class ServiceCutoffInfo {
    cutoffId: String;
    createdDate: Date;
    createdBy: String;
    numOfDay: Number;
    note: String;

    cutoffDate: Date;
    isDone: Boolean;
    checkDoneBy: String;
}

export class DataCutoffInfo {
    cutoff?: ServiceCutoffInfo;
    confirm? :any;
    tour: any;
    service: any;
    proposal?: any;
    proposalService?: any;
}
