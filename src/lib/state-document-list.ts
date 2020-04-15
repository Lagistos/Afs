import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { LogServiceStatus, mapDoc, GenerateUniqeId } from './utils';
import { map, take, takeUntil } from 'rxjs/operators';
import { AngularFirestore } from '@angular/fire/firestore';

interface SModel<T> {
    data: T[];
    loaded: boolean;
    loading: boolean
}

export class StateDocumentListClass<T> {

    private readonly initValue = {
        data: undefined,
        loaded: false,
        loading: false
    };

    private state = new BehaviorSubject<SModel<T>>(this.initValue);

    private destroySubject = new Subject();

    constructor(
        protected document: string,
        protected store: { db: AngularFirestore },
        protected consoleLogStages: boolean = false) {
        if (consoleLogStages) LogServiceStatus(this.document, 'started');
    }

    getAll(): Observable<T[]> {
        if (!this.svalue.loaded && !this.svalue.loading) {
            this.state.next({ ...this.svalue, loading: true });

            this.store.db.doc(this.document)
                .snapshotChanges()
                .pipe(
                    takeUntil(this.destroySubject),
                    map(actions => mapDoc(actions)))
                .subscribe(c => {
                    this.state.next({ loaded: true, loading: false, data: (c && c.list) ? c.list : [] })
                })
        }
        return this.state.pipe(map(s => s.data));
    }

    updateList(list: T[]): Promise<any> {
        return this.store.db.doc(this.document).set({ list })
    }

    async addOrUpdateOne(item: T): Promise<any> {
        const list = await this.getAll()
            .pipe(take(1))
            .toPromise();

        if (item['id']) {
            const fitem = list.findIndex(s => s['id'] == item['id']);
            if (fitem != -1) list[fitem] = item;
        } else {
            item['id'] = GenerateUniqeId(list);
            list.push(item);
        }
        return this.updateList(list);
    }

    async deleteOne(id: string): Promise<any> {
        const list = await this.getAll()
            .pipe(take(1))
            .toPromise();

        const filterdlist = list.filter(s => s['id'] != id);
        return this.updateList(filterdlist);
    }

    private get svalue(): SModel<T> {
        return this.state.getValue();
    }

    destroy() {
        if (this.consoleLogStages) LogServiceStatus(this.document, 'stoped');
        this.state.next(this.initValue);
        this.destroySubject.next();
    }
}