import { QueryFn } from '@angular/fire/firestore';

export interface SCOptions {
    addId?: boolean;
    addSnapshot?: boolean;
    saveData?: boolean;
    query?: QueryFn;
}

export const DefaultSCOptions: SCOptions = {
    addId: true,
    addSnapshot: false,
    saveData: true
}