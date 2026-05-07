export class MessageFilter {
    notDone?: boolean;

    begindate?: Date;
    enddate?: Date;
    date?: Date;

    types?: string[];
    location?: string[];
    ageny?: string;

    userCreate: string;
    nation: string;
    productCode?: string;

    constructor(nation: string, username: any = null, productCode: any = null) {
        this.nation = nation;
        this.userCreate = username ?? undefined;
        this.productCode = productCode ?? undefined;
    }
}
