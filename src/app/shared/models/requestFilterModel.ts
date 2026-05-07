
export class RequestFilter {
    agentMd5Code: string;
    location: string[];
    nation: string;
    search: string;
    statuses: RequestStatus[];

    _pageNumber: number;
    _pageSize: number;
}

export type RequestStatus = 'rejected' | 'approved' | 'cancel' | 'draft' | 'requested';
