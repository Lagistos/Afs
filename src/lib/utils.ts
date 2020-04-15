export function mapDoc(action, addSnapshot: boolean = false) {
    const docsnapshot = action.payload.doc;
    const id = action.payload.id;
    const data = action.payload.data();
    return { id, ...data, ...(addSnapshot) && { docsnapshot: docsnapshot } };
};

export function mapActions(actions, addSnapshot: boolean = false) {
    return actions.map(a => {
        const docsnapshot = a.payload.doc;
        const id = a.payload.doc.id;
        const data = a.payload.doc.data();
        return { id, ...data, ...(addSnapshot) && { docsnapshot: docsnapshot } };
    });
};

export function LogServiceStatus(serviceName: string, status: 'started' | 'stoped') {
    console.log(`${serviceName} service ${status}`);
}

export function GenerateUniqeId(items: any[]): string {
    const UniqeId = () => Math.random().toString(36).substr(2, 9);

    let id = UniqeId();
    while (items.some(s => s.id == id)) id = UniqeId();
    return id;
}
