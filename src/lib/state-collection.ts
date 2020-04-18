import { BehaviorSubject, Observable, combineLatest, Subject } from 'rxjs';
import { LogServiceStatus, mapDoc, mapActions } from './utils';
import { map, find, flatMap, filter, takeUntil } from 'rxjs/operators';
import { SCOptions, DefaultSCOptions } from './interfaces';
import { AngularFirestore } from '@angular/fire/firestore';

interface SModel<T> {
    data: T[];
    loaded: boolean;
    loading: boolean;
}

export class StateCollection<T> {

    protected readonly initValue = {
        data: undefined,
        loaded: false,
        loading: false
    };

    protected state = new BehaviorSubject<SModel<T>>(this.initValue);

    private destroySubject = new Subject();

    constructor(
        protected collection: string,
        protected store: { db: AngularFirestore },
        protected consoleLogStages: boolean = false) {
        if (consoleLogStages) LogServiceStatus(collection, 'started');
    }

    getOne(id: string): Observable<T> {
        if (this.value.loaded || this.value.loading) {
            return this.state.pipe(
                map(s => s?.data),
                flatMap(v => v),
                find(v => v['id'] == id)
            );
        }

        return this.store.db.collection<T>(this.collection).doc<T>(id)
            .snapshotChanges()
            .pipe(map(a => mapDoc(a)));
    }

    getAll(options: SCOptions = DefaultSCOptions): Observable<T[]> {

        if (options.getOnce) {
            return this.store.db.collection<T>(this.collection, options.query)
                .get({ source: 'server' })
                .pipe(map(v => v.docs.map(doc => ({ id: doc.id, ...doc.data() }) as any))) as Observable<T[]>;
        } else {
            const req = this.store.db.collection<T>(this.collection, options.query)
                .snapshotChanges()
                .pipe(map(actions => mapActions(actions)))

            if (options.query || !options.cacheData) return req;

            else {
                if (!this.value.loaded && !this.value.loading) {
                    this.state.next({ ...this.value, loading: true });
                    req.pipe(takeUntil(this.destroySubject))
                        .subscribe(c => {
                            this.state.next({ loaded: true, loading: false, data: c });
                        });
                }

                return this.state.pipe(map(s => s.data));
            }
        }
    }

    getByList(ids: string[]): Observable<T[]> {

        if (this.value.loaded || this.value.loading) {
            return this.state.pipe(map(s => s.data.filter(v => ids.includes(v['id']))))
        }

        const queries = ids.map(id => {
            return this.store.db.collection(this.collection).doc(id)
                .snapshotChanges()
                .pipe(map(a => mapDoc(a)));
        });

        return combineLatest(...queries)
            .pipe(filter(v => Object.keys(v).length > 1))
    }

    addOne(item: T): Promise<any> {
        return this.store.db.collection(this.collection).add(item);
    }

    updateOne(id: string, item: T, action: 'set' | 'update' = 'update'): Promise<any> {
        return this.store.db.collection(this.collection).doc(id)[action](item);
    }

    updateByList(list: T[],
        docIdProp: string = 'id',
        action: 'set' | 'update' = 'update'): Promise<any> {

        const batch = this.store.db.firestore.batch();

        list.forEach(item => {
            const ref = this.store.db.collection(this.collection)
                .doc(item[docIdProp]).ref;
            batch[action](ref, item);
        });

        return batch.commit();
    }

    deleteOne(id: string): Promise<any> {
        return this.store.db.collection(this.collection).doc(id).delete();
    }

    destroy() {
        if (this.consoleLogStages) LogServiceStatus(this.collection, 'stoped');
        this.state.next(this.initValue);
        this.destroySubject.next();
    }

    private get value(): SModel<T> {
        return this.state.getValue();
    }

}