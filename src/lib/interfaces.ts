import { QueryFn } from '@angular/fire/firestore';

export interface SCOptions {
    query?: QueryFn;
    getOnce?: boolean;
}

export const DefaultSCOptions: SCOptions = {
    getOnce: false
}