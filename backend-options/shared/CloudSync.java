package cn.fjnu.leaguetrace.util;

import org.json.JSONObject;
import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/**
 * CloudSync — App 端通用云端同步适配器（默认关闭，不影响纯本地）。
 *
 * 与网站 shared/cloud-sync.js 同一抽象：一个 JSON 文档的 pull/push。
 * 已内置 GitHub/Gitee/Worker/Supabase/Firebase/LeanCloud/Bmob/PocketBase/Appwrite 写协议。
 *
 * 用法（App 侧接入点）：
 *   CloudSync.Config c = CloudSync.github("icyteacn","CYSL-26CS","main","data/state.json",token);
 *   CloudSync.save(c);                                  // 存 SharedPreferences，不进代码
 *   JSONObject remote = CloudSync.pull();               // null = 未配置/拉不到
 *   CloudSync.push(Backup.bundle(db).toJson());         // 支委口令验证后调用
 *
 * 网络请求必须在 IO 线程跑（App.get().io().execute(...)）。
 * 只依赖 org.json + HttpURLConnection，不引第三方库。
 */
public final class CloudSync {

    public static final class Config {
        public String readUrl, writeUrl, writeMethod = "PUT";
        public Map<String,String> readHeaders = new HashMap<>();
        public Map<String,String> writeHeaders = new HashMap<>();
        /** 写体包装器：把业务 JSON 包成服务端要的形状 */
        public BodyWrap wrap = data -> data;
        /** 读体解包器：从响应 JSON 取出业务文档 */
        public Unwrap unwrap = j -> j;
        public interface BodyWrap { Object wrap(JSONObject data) throws Exception; }
        public interface Unwrap   { JSONObject unwrap(JSONObject resp) throws Exception; }
    }

    private static final String SP = "cloud_sync_cfg";

    /* ============ 各方案工厂（参数见各 README） ============ */

    public static Config github(String owner, String repo, String branch,
                                String path, String token) {
        Config c = new Config();
        c.readUrl = "https://raw.githubusercontent.com/" + owner + "/" + repo + "/" + branch + "/" + path;
        c.writeUrl = "https://api.github.com/repos/" + owner + "/" + repo + "/contents/" + path;
        c.writeHeaders.put("Authorization", "Bearer " + token);
        c.writeHeaders.put("Accept", "application/vnd.github+json");
        c.wrap = data -> {
            JSONObject j = new JSONObject();
            j.put("message", "chore: update state via app");
            j.put("branch", branch);
            j.put("content", android.util.Base64.encodeToString(
                    data.toString().getBytes(StandardCharsets.UTF_8), android.util.Base64.NO_WRAP));
            String sha = readSha(c.writeUrl, c.writeHeaders);
            if (sha != null) j.put("sha", sha);
            return j;
        };
        return c;
    }

    public static Config gitee(String owner, String repo, String branch,
                               String path, String token) {
        Config c = new Config();
        c.readUrl = "https://gitee.com/" + owner + "/" + repo + "/raw/" + branch + "/" + path;
        c.writeUrl = "https://gitee.com/api/v5/repos/" + owner + "/" + repo + "/contents/" + path;
        c.wrap = data -> {
            JSONObject j = new JSONObject();
            j.put("access_token", token);
            j.put("message", "chore: update state via app");
            j.put("branch", branch);
            j.put("content", android.util.Base64.encodeToString(
                    data.toString().getBytes(StandardCharsets.UTF_8), android.util.Base64.NO_WRAP));
            String sha = readSha(c.writeUrl + "?access_token=" + token, c.writeHeaders);
            if (sha != null) j.put("sha", sha);
            return j;
        };
        return c;
    }

    public static Config worker(String base, String token) {
        Config c = new Config();
        c.readUrl = base + "/state";
        c.writeUrl = base + "/state";
        c.writeHeaders.put("X-Write-Token", token);
        return c;
    }

    public static Config supabase(String url, String anonKey) {
        Config c = new Config();
        c.readUrl = url + "/rest/v1/state?id=eq.1&select=doc";
        c.readHeaders.put("apikey", anonKey);
        c.readHeaders.put("Authorization", "Bearer " + anonKey);
        c.writeUrl = url + "/rest/v1/state";
        c.writeMethod = "POST";
        c.writeHeaders.put("apikey", anonKey);
        c.writeHeaders.put("Authorization", "Bearer " + anonKey);
        c.writeHeaders.put("Prefer", "resolution=merge-duplicates,return=minimal");
        c.unwrap = j -> j.getJSONArray("_arr").getJSONObject(0);   // 见 pull() 特判
        c.wrap = data -> {
            JSONObject j = new JSONObject();
            j.put("id", 1); j.put("doc", data);
            j.put("updated_at", new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'",
                    java.util.Locale.US).format(new java.util.Date()));
            return j;
        };
        return c;
    }

    public static Config firebase(String base, String secret) {
        Config c = new Config();
        c.readUrl = base + "/state.json";
        c.writeUrl = base + "/state.json?auth=" + secret;
        return c;
    }

    public static Config leancloud(String appId, String appKey, String objectId) {
        String host = "https://" + appId.substring(0, 8) + ".lc-cn-n1-shared.com";
        Config c = new Config();
        c.readUrl = host + "/1.1/classes/State/" + objectId;
        c.readHeaders.put("X-LC-Id", appId);
        c.readHeaders.put("X-LC-Key", appKey);
        c.writeUrl = c.readUrl;
        c.writeHeaders.putAll(c.readHeaders);
        c.unwrap = j -> docOf(j);
        c.wrap = data -> new JSONObject().put("doc", data);
        return c;
    }

    public static Config bmob(String appId, String restKey, String objectId) {
        Config c = new Config();
        c.readUrl = "https://api2.bmob.cn/1/classes/State/" + objectId;
        c.readHeaders.put("X-Bmob-Application-Id", appId);
        c.readHeaders.put("X-Bmob-REST-API-Key", restKey);
        c.writeUrl = c.readUrl;
        c.writeHeaders.putAll(c.readHeaders);
        c.unwrap = j -> docOf(j);
        c.wrap = data -> new JSONObject().put("doc", data);
        return c;
    }

    public static Config pocketbase(String url, String recordId, String adminToken) {
        Config c = new Config();
        c.readUrl = url + "/api/collections/state/records/" + recordId + "?fields=doc";
        c.writeUrl = url + "/api/collections/state/records/" + recordId;
        c.writeMethod = "PATCH";
        c.writeHeaders.put("Authorization", "Bearer " + adminToken);
        c.unwrap = j -> docOf(j);
        c.wrap = data -> new JSONObject().put("doc", data);
        return c;
    }

    public static Config appwrite(String url, String project, String apiKey,
                                  String dbId, String colId) {
        Config c = new Config();
        c.readUrl = url + "/v1/databases/" + dbId + "/collections/" + colId + "/documents/state";
        c.readHeaders.put("X-Appwrite-Project", project);
        c.readHeaders.put("X-Appwrite-Key", apiKey);
        c.writeUrl = c.readUrl;
        c.writeMethod = "PATCH";
        c.writeHeaders.putAll(c.readHeaders);
        c.unwrap = j -> docOf(j);
        c.wrap = data -> {
            JSONObject inner = new JSONObject().put("doc", data);
            return new JSONObject().put("data", inner);
        };
        return c;
    }

    /* ============ 核心读写 ============ */

    public static JSONObject pull(Config c) {
        try {
            HttpURLConnection con = open(c.readUrl, "GET", c.readHeaders);
            if (con.getResponseCode() != 200) { con.disconnect(); return null; }
            String body = read(con.getInputStream());
            con.disconnect();
            JSONObject j = body.startsWith("[")
                    ? new JSONObject().put("_arr", new org.json.JSONArray(body))
                    : new JSONObject(body);
            return c.unwrap.unwrap(j);
        } catch (Exception e) { return null; }
    }

    public static boolean push(Config c, JSONObject data) {
        try {
            Object payload = c.wrap.wrap(data);
            HttpURLConnection con = open(c.writeUrl, c.writeMethod, c.writeHeaders);
            OutputStream os = con.getOutputStream();
            os.write(payload.toString().getBytes(StandardCharsets.UTF_8));
            os.close();
            int code = con.getResponseCode();
            con.disconnect();
            return code >= 200 && code < 300;
        } catch (Exception e) { return false; }
    }

    /* ============ 内部工具 ============ */

    /** doc 字段可能是 JSON 对象也可能是字符串（取决于建表类型），统一解出对象 */
    private static JSONObject docOf(JSONObject j) throws Exception {
        JSONObject o = j.optJSONObject("doc");
        if (o != null) return o;
        String s = j.optString("doc", null);
        return s == null || s.isEmpty() ? null : new JSONObject(s);
    }

    private static String readSha(String url, Map<String,String> headers) {
        try {
            HttpURLConnection con = open(url, "GET", headers);
            if (con.getResponseCode() != 200) { con.disconnect(); return null; }
            JSONObject j = new JSONObject(read(con.getInputStream()));
            con.disconnect();
            return j.optString("sha", null);
        } catch (Exception e) { return null; }
    }

    private static HttpURLConnection open(String url, String method,
                                          Map<String,String> headers) throws IOException {
        HttpURLConnection con = (HttpURLConnection) new URL(url).openConnection();
        con.setRequestMethod(method);
        con.setConnectTimeout(15000);
        con.setReadTimeout(20000);
        con.setRequestProperty("Content-Type", "application/json; charset=utf-8");
        for (Map.Entry<String,String> e : headers.entrySet())
            con.setRequestProperty(e.getKey(), e.getValue());
        if (!"GET".equals(method)) con.setDoOutput(true);
        return con;
    }

    private static String read(InputStream in) throws IOException {
        ByteArrayOutputStream b = new ByteArrayOutputStream();
        byte[] buf = new byte[8192];
        for (int n; (n = in.read(buf)) > 0; ) b.write(buf, 0, n);
        in.close();
        return b.toString("UTF-8");
    }
}
