import { QueryFn } from '@angular/fire/firestore';

export interface SCOptions {
    query?: QueryFn;
    getOnce?: boolean;
    cacheData?: boolean;
}

export const DefaultSCOptions: SCOptions = {
    getOnce: false,
    cacheData: true
}