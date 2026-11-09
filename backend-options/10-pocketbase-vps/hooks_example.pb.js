/// 放到 pb_hooks/state_hooks.pb.js — PocketBase JS hooks
/// ⚠️ 版本注意：v0.22 及更早用 onRecordBeforeUpdateRequest；
/// v0.23+ 改名为 onRecordUpdateRequest（且回调内需调 e.next() 才继续执行）。
/// 下面按 v0.22 API 写；升级新版 PB 时改名并在末尾加 e.next()。
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
