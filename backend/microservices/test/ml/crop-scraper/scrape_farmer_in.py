import csv
import re
import time
import logging
from dataclasses import dataclass, asdict
from typing import Optional
 
import requests
from bs4 import BeautifulSoup
 
# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
 
BASE_URL = "https://farmer.in"
CROP_PLANNER_URL = f"{BASE_URL}/crop-planner/"
MANDI_BHAV_URL_TMPL = f"{BASE_URL}/mandi-bhav/{{slug}}/"
 
HEADERS = {
    # Real browser jaisa User-Agent bhejna zaroori hai, warna kai sites
    # bot requests ko block/redirect kar deti hain.
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-IN,en;q=0.9,hi;q=0.8",
}
 
# Har request ke beech itna wait (seconds) — server par load kam daalne
# aur rate-limit/block hone se bachne ke liye. Zaroorat pade to badha dena.
REQUEST_DELAY = 1.0
REQUEST_TIMEOUT = 15
 
OUT_PLANNER_CSV = "crops_planner.csv"
OUT_MANDI_CSV = "mandi_prices.csv"
 
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("farmer_scraper")
 
 
# ---------------------------------------------------------------------------
# Data models
# ---------------------------------------------------------------------------
 
@dataclass
class CropPlannerEntry:
    slug: str
    name: str
    category: str
    season: str
    sowing_window: str
    msp: str
    mandi_price: str
 
 
@dataclass
class MandiPriceRow:
    crop_slug: str
    crop_name: str
    mandi_name: str
    district_state: str
    min_price: str
    max_price: str
    modal_price: str
    arrivals: str
 
 
# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
 
def get_soup(url: str) -> Optional[BeautifulSoup]:
    """Fetch a URL and return a BeautifulSoup object, or None on failure."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
        return BeautifulSoup(resp.text, "html.parser")
    except requests.RequestException as e:
        log.warning(f"Fetch failed for {url}: {e}")
        return None
 
 
def parse_slug_from_href(href: str) -> Optional[str]:
    """'/crop-planner/wheat/' -> 'wheat'"""
    m = re.search(r"/crop-planner/([^/]+)/?", href)
    return m.group(1) if m else None
 
 
# ---------------------------------------------------------------------------
# Step 1: Crop planner listing (all 122 crops)
# ---------------------------------------------------------------------------
 
def scrape_crop_planner() -> list[CropPlannerEntry]:
    log.info(f"Fetching crop planner page: {CROP_PLANNER_URL}")
    soup = get_soup(CROP_PLANNER_URL)
    if soup is None:
        log.error("Crop planner page fetch nahi ho payi, ruk raha hoon.")
        return []
 
    entries: list[CropPlannerEntry] = []
 
    # Har category "Cereals (11)" jaisi <h2 class="section-title"> ke
    # baad wale <div class="imgcards ..."> mein uske crops hote hain.
    for section_title in soup.select("h2.section-title"):
        # Category name nikaalo, count wagera hata ke
        category = section_title.get_text(strip=True)
        category = re.sub(r"\(\d+\)\s*$", "", category).strip()
 
        cards_container = section_title.find_next_sibling("div", class_="imgcards")
        if cards_container is None:
            continue
 
        for card in cards_container.select("a.imgcard"):
            href = card.get("href", "")
            slug = parse_slug_from_href(href)
            if not slug:
                continue
 
            h3 = card.select_one("h3")
            name = h3.get_text(strip=True) if h3 else slug
 
            p = card.select_one("p")
            season, sowing_window, msp, mandi_price = "", "", "", ""
            if p:
                # p ke andar <br> se season aur MSP/mandi wali line alag hoti hai
                p_html = p.decode_contents()
                parts = re.split(r"<br\s*/?>", p_html)
                line1 = BeautifulSoup(parts[0], "html.parser").get_text(strip=True) if len(parts) > 0 else ""
                line2 = BeautifulSoup(parts[1], "html.parser").get_text(strip=True) if len(parts) > 1 else ""
 
                # line1 jaisa: "Rabi · sow Oct-Nov" ya sirf "Kharif"
                if "·" in line1:
                    season, sowing_window = [x.strip() for x in line1.split("·", 1)]
                    sowing_window = sowing_window.replace("sow", "").strip()
                else:
                    season = line1.strip()
 
                # line2 jaisa: "MSP ₹2,585 · mandi ₹2,530"
                msp_match = re.search(r"MSP\s*([₹\d,]+)", line2)
                mandi_match = re.search(r"mandi\s*([₹\d,]+)", line2)
                msp = msp_match.group(1) if msp_match else ""
                mandi_price = mandi_match.group(1) if mandi_match else ""
 
            entries.append(
                CropPlannerEntry(
                    slug=slug,
                    name=name,
                    category=category,
                    season=season,
                    sowing_window=sowing_window,
                    msp=msp,
                    mandi_price=mandi_price,
                )
            )
 
    log.info(f"Crop planner se {len(entries)} crops mile.")
    return entries
 
 
# ---------------------------------------------------------------------------
# Step 2: Mandi price table for a single crop
# ---------------------------------------------------------------------------
 
def scrape_mandi_prices_for_crop(slug: str, name: str) -> list[MandiPriceRow]:
    url = MANDI_BHAV_URL_TMPL.format(slug=slug)
    soup = get_soup(url)
    if soup is None:
        return []
 
    rows: list[MandiPriceRow] = []
 
    # Page mein 2 mandi-table ho sakte hain — ek "live" (JS-filled, humare
    # liye khaali) aur ek "real-prices" (static, server-rendered). Hume
    # wahi table chahiye jiski <tbody> mein actual <tr> rows already hon.
    tables = soup.select("table.mandi-table")
    for table in tables:
        tbody = table.select_one("tbody")
        if tbody is None:
            continue
        trs = tbody.select("tr")
        if not trs:
            continue  # empty tbody (JS-populated live table) -> skip
 
        for tr in trs:
            cells = [td.get_text(strip=True) for td in tr.select("td")]
            if len(cells) < 5:
                continue
            mandi_name = cells[0]
            district_state = cells[1]
            min_price = cells[2]
            max_price = cells[3]
            modal_price = cells[4]
            arrivals = cells[5] if len(cells) > 5 else ""
 
            rows.append(
                MandiPriceRow(
                    crop_slug=slug,
                    crop_name=name,
                    mandi_name=mandi_name,
                    district_state=district_state,
                    min_price=min_price,
                    max_price=max_price,
                    modal_price=modal_price,
                    arrivals=arrivals,
                )
            )
        break  # pehla non-empty table hi lena hai (real-prices wala)
 
    return rows
 
 
# ---------------------------------------------------------------------------
# Step 3: CSV writers
# ---------------------------------------------------------------------------
 
def write_csv(path: str, rows: list, fieldnames: list[str]) -> None:
    with open(path, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(asdict(row) if not isinstance(row, dict) else row)
    log.info(f"Likh diya: {path} ({len(rows)} rows)")
 
 
# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
 
def main():
    planner_entries = scrape_crop_planner()
    if not planner_entries:
        log.error("Koi crop nahi mila, mandi prices scrape nahi karunga.")
        return
 
    write_csv(
        OUT_PLANNER_CSV,
        planner_entries,
        fieldnames=["slug", "name", "category", "season", "sowing_window", "msp", "mandi_price"],
    )
 
    all_mandi_rows: list[MandiPriceRow] = []
    total = len(planner_entries)
 
    for i, entry in enumerate(planner_entries, start=1):
        log.info(f"[{i}/{total}] Mandi prices fetch kar raha hoon: {entry.name} ({entry.slug})")
        rows = scrape_mandi_prices_for_crop(entry.slug, entry.name)
        if not rows:
            log.warning(f"  -> '{entry.slug}' ke liye koi mandi price row nahi mili.")
        all_mandi_rows.extend(rows)
        time.sleep(REQUEST_DELAY)
 
    write_csv(
        OUT_MANDI_CSV,
        all_mandi_rows,
        fieldnames=[
            "crop_slug", "crop_name", "mandi_name", "district_state",
            "min_price", "max_price", "modal_price", "arrivals",
        ],
    )
 
    log.info("Sab ho gaya! 🎉")
 
 
if __name__ == "__main__":
    main()
 