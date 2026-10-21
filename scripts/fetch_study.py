# -*- coding: utf-8 -*-
"""每周抓取中国青年网'青春创作/独家特稿'频道，更新 data/feed.json 的 study[]（c='特稿'）。
幂等：按 URL 去重，最多保留 40 条特稿；有新增才提交。"""
import json, re, sys, urllib.request

SRC = "https://qnzz.youth.cn/qckc/"
FEED = "data/feed.json"
MAX = 40

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    raw = urllib.request.urlopen(req, timeout=30).read()
    for enc in ("utf-8", "gbk"):
        try:
            return raw.decode(enc)
        except UnicodeDecodeError:
            continue
    return raw.decode("gbk", errors="replace")

def main():
    html = fetch(SRC)
    items = []
    for href, title in re.findall(r'href="([^"]+\.(?:htm|shtml)[^"]*)"[^>]*>([^<]{5,60})<', html):
        title = title.strip()
        if not title or "更多" in title:
            continue
        url = href if href.startswith("http") else urllib.request.urljoin(SRC, href)
        m = re.search(r"t(\d{4})(\d{2})(\d{2})_", url)
        if not m:
            continue
        date = f"{m.group(1)}.{int(m.group(2))}.{int(m.group(3))}"
        items.append({"c": "特稿", "t": title,
                      "s": f"中国青年网 · 独家特稿 {date}", "b": "", "u": url})
    if not items:
        print("no items parsed"); sys.exit(0)

    feed = json.load(open(FEED, encoding="utf-8"))
    study = feed.get("study", [])
    old_special = [x for x in study if x.get("c") == "特稿"]
    rest = [x for x in study if x.get("c") != "特稿"]
    seen = {x["u"] for x in items}
    merged = items + [x for x in old_special if x.get("u") not in seen]
    merged = merged[:MAX]
    if merged == old_special:
        print("no change"); sys.exit(0)
    feed["study"] = rest + merged
    feed["version"] = int(feed.get("version", 0)) + 1
    json.dump(feed, open(FEED, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"updated: {len(merged)} 特稿, version -> {feed['version']}")

if __name__ == "__main__":
    main()
