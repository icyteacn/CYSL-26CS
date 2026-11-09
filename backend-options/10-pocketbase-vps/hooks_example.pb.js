/// 放到 pb_hooks/state_hooks.pb.js — PocketBase v0.20+ JS hooks
/// state 集合写入前：把旧 doc 复制到 state_history 集合（需先建该集合，同 schema）
onRecordBeforeUpdateRequest((e) => {
    const col = $app.dao().findCollectionByNameOrId('state_history');
    if (col) {
        const old = $app.dao().findRecordById('state', e.record.id);
        if (old) {
            const h = new Record(col);
            h.set('doc', old.get('doc'));
            h.set('backed_at', new Date().toISOString());
            $app.dao().saveRecord(h);
        }
    }
    e.record.set('updated_at', new Date().toISOString());
}, 'state');
