"""Generate a printable "Menu Master Sheet" PDF for staff training.

One row per distinct menu item (deduplicated across locations):
    [thumbnail]  Name       Description                              Price
Grouped by category with printed section headers between groups.
Runs on Letter portrait, multi-page.
"""
import asyncio
import io
import os
from pathlib import Path

from PIL import Image as PILImage
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from motor.motor_asyncio import AsyncIOMotorClient

PAGE_W, PAGE_H = LETTER
MARGIN_X = 0.5 * inch
MARGIN_TOP = 0.55 * inch
MARGIN_BOTTOM = 0.55 * inch
ROW_H = 0.85 * inch
ROW_PAD = 0.05 * inch

IMG_ROOT = Path("/app/frontend/public")

# Column layout (x positions from left margin, all in points)
COL_IMG_X = MARGIN_X
COL_IMG_W = 0.85 * inch
COL_NAME_X = COL_IMG_X + COL_IMG_W + 0.15 * inch
COL_NAME_W = 1.75 * inch
COL_DESC_X = COL_NAME_X + COL_NAME_W + 0.1 * inch
COL_PRICE_X = PAGE_W - MARGIN_X          # right-aligned
COL_DESC_W = COL_PRICE_X - COL_DESC_X - 0.35 * inch

# Palette
BG = HexColor("#ffffff")
BORDER = HexColor("#cbd5e1")
NAME_COLOR = HexColor("#0f172a")
DESC_COLOR = HexColor("#475569")
PRICE_COLOR = HexColor("#dc2626")
CAT_BG = HexColor("#0f172a")
CAT_TEXT = HexColor("#f8fafc")
CAT_ACCENT = HexColor("#dc2626")
FOOTER_COLOR = HexColor("#94a3b8")


# Category order + display labels
CATEGORY_ORDER = [
    ("starters", "Starters"),
    ("brunch", "Brunch"),
    ("entrees", "Entrees"),
    ("sandwiches", "Sandwiches"),
    ("sides", "Sides"),
    ("desserts", "Desserts"),
    ("daily-specials", "$5 Daily Specials"),
    ("cocktails", "Signature Cocktails"),
    ("brunch-drinks", "Brunch Drinks"),
    ("mocktails", "Mocktails"),
    ("teas-lemonades", "Teas & Lemonades"),
    ("sodas-spritzers", "Sodas & Spritzers"),
    ("shots", "Shots"),
    ("spirits", "Spirits"),
    ("beer-wine", "Beer & Wine"),
    ("hookah", "Hookah"),
    ("hookah-premium", "Hookah — Premium"),
]


def _resolve_image_path(item: dict):
    for field in ("image", "image_url"):
        p = item.get(field) or ""
        if not p:
            continue
        p = p.lstrip("/")
        full = IMG_ROOT / p
        if full.exists():
            return str(full)
    return None


def _thumb_reader(path: str):
    try:
        pil = PILImage.open(path).convert("RGB")
        pil.thumbnail((260, 260))
        buf = io.BytesIO()
        pil.save(buf, format="JPEG", quality=78, optimize=True)
        buf.seek(0)
        return ImageReader(buf)
    except Exception:
        return None


def _wrap(c, text: str, max_w: float, font: str, size: float, max_lines: int):
    words = (text or "").strip().split()
    lines, cur = [], ""
    for w in words:
        candidate = (cur + " " + w).strip()
        if c.stringWidth(candidate, font, size) <= max_w:
            cur = candidate
        else:
            if cur:
                lines.append(cur)
            cur = w
            if len(lines) >= max_lines:
                break
    if cur and len(lines) < max_lines:
        lines.append(cur)
    if lines and len(lines) == max_lines:
        last = lines[-1]
        while c.stringWidth(last + "…", font, size) > max_w and len(last) > 1:
            last = last[:-1]
        if len(" ".join(lines)) < len(text or ""):
            lines[-1] = last.rstrip(",.;: ") + "…"
    return lines


def _format_price(price):
    if price is None or price == "":
        return ""
    try:
        p = float(price)
        return f"${int(p)}" if p == int(p) else f"${p:.2f}"
    except (TypeError, ValueError):
        return str(price)


def _draw_header(c, page_num, total_pages):
    c.setFillColor(HexColor("#0f172a"))
    c.setFont("Helvetica-Bold", 16)
    c.drawString(MARGIN_X, PAGE_H - MARGIN_TOP + 0.1 * inch, "FIN & FEATHERS — MENU MASTER SHEET")
    c.setFillColor(FOOTER_COLOR)
    c.setFont("Helvetica", 8)
    c.drawRightString(PAGE_W - MARGIN_X, PAGE_H - MARGIN_TOP + 0.1 * inch,
                      f"Server Training Reference · Page {page_num}/{total_pages}")
    c.setStrokeColor(CAT_ACCENT)
    c.setLineWidth(1.2)
    c.line(MARGIN_X, PAGE_H - MARGIN_TOP - 0.02 * inch,
           PAGE_W - MARGIN_X, PAGE_H - MARGIN_TOP - 0.02 * inch)


def _draw_footer(c):
    c.setFillColor(FOOTER_COLOR)
    c.setFont("Helvetica-Oblique", 6.5)
    c.drawCentredString(
        PAGE_W / 2, MARGIN_BOTTOM - 0.25 * inch,
        "21+ for alcohol · Confirm allergens · Prices reflect base menu (specials vary) · finandfeathers.live"
    )


def _draw_category_header(c, y, label):
    """Draw a full-width category band. Returns the y-position beneath it."""
    band_h = 0.32 * inch
    c.setFillColor(CAT_BG)
    c.rect(MARGIN_X, y - band_h, PAGE_W - 2 * MARGIN_X, band_h, fill=1, stroke=0)
    c.setFillColor(CAT_ACCENT)
    c.rect(MARGIN_X, y - band_h, 0.12 * inch, band_h, fill=1, stroke=0)
    c.setFillColor(CAT_TEXT)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(MARGIN_X + 0.28 * inch, y - band_h + 0.09 * inch, label.upper())
    return y - band_h - 0.08 * inch


def _draw_row(c, y, item):
    """Draw one item row starting at top-y. Returns the y-position beneath it."""
    top = y
    bottom = top - ROW_H

    # Faint separator line under the row
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.3)
    c.line(MARGIN_X, bottom, PAGE_W - MARGIN_X, bottom)

    # Image (or placeholder rectangle)
    img_path = _resolve_image_path(item)
    img_side = ROW_H - 2 * ROW_PAD
    img_x = COL_IMG_X + (COL_IMG_W - img_side) / 2
    img_y = bottom + ROW_PAD
    if img_path:
        reader = _thumb_reader(img_path)
        if reader:
            c.drawImage(reader, img_x, img_y, width=img_side, height=img_side,
                        preserveAspectRatio=True, anchor="c", mask="auto")
    else:
        c.setFillColor(HexColor("#f1f5f9"))
        c.setStrokeColor(BORDER)
        c.rect(img_x, img_y, img_side, img_side, fill=1, stroke=1)
        c.setFillColor(FOOTER_COLOR)
        c.setFont("Helvetica", 6)
        c.drawCentredString(img_x + img_side / 2, img_y + img_side / 2 - 3, "no photo")

    # Name (bold), price (red, right-aligned) on same line
    name = (item.get("name") or "").replace("*", "").strip()
    price = _format_price(item.get("price"))
    c.setFillColor(NAME_COLOR)
    c.setFont("Helvetica-Bold", 10)
    name_lines = _wrap(c, name, COL_NAME_W, "Helvetica-Bold", 10, 2)
    ny = top - 0.19 * inch
    for line in name_lines:
        c.drawString(COL_NAME_X, ny, line)
        ny -= 0.15 * inch

    c.setFillColor(PRICE_COLOR)
    c.setFont("Helvetica-Bold", 11)
    c.drawRightString(COL_PRICE_X, top - 0.19 * inch, price)

    # Description (up to 4 wrapped lines)
    desc = (item.get("description") or "").strip()
    if desc:
        c.setFillColor(DESC_COLOR)
        c.setFont("Helvetica", 7.6)
        desc_lines = _wrap(c, desc, COL_DESC_W, "Helvetica", 7.6, 4)
        dy = top - 0.19 * inch
        for line in desc_lines:
            c.drawString(COL_DESC_X, dy, line)
            dy -= 0.135 * inch

    return bottom - 0.05 * inch


async def generate_master_sheet_pdf(output_path: str) -> str:
    client = AsyncIOMotorClient(os.environ.get("MONGO_URL", "mongodb://localhost:27017"))
    db = client[os.environ.get("DB_NAME", "test_database")]

    docs = await db.menu_items.find({}, {"_id": 0}).to_list(20000)

    # Deduplicate by (name, category) — prefer entries that have an image
    dedup: dict = {}
    for it in docs:
        if it.get("is_active") is False:
            continue
        name = (it.get("name") or "").strip()
        cat = (it.get("category") or "").strip()
        if not name or not cat:
            continue
        # Skip obvious add-ons ("Add cheese", etc.)
        if name.lower().startswith("add "):
            continue
        key = (name, cat)
        existing = dedup.get(key)
        has_img = bool(it.get("image") or it.get("image_url"))
        existing_has_img = bool(existing and (existing.get("image") or existing.get("image_url")))
        if existing is None or (has_img and not existing_has_img):
            dedup[key] = it

    known_cats = {slug: label for slug, label in CATEGORY_ORDER}

    # Group by category using our known order; unknown categories appended alphabetically at end.
    groups: dict = {}
    unknown_cats = set()
    for (name, cat), it in dedup.items():
        groups.setdefault(cat, []).append(it)
        if cat not in known_cats:
            unknown_cats.add(cat)
    ordered_cats = [slug for slug, _ in CATEGORY_ORDER if slug in groups]
    ordered_cats.extend(sorted(unknown_cats))

    # Sort items in each category
    for cat in ordered_cats:
        groups[cat].sort(key=lambda x: (
            x.get("display_order") if isinstance(x.get("display_order"), (int, float)) else 9999,
            (x.get("name") or "").lower(),
        ))

    # === Two-pass render — pass 1 counts pages ===
    def _paginate():
        pages, cursor_y = [], 0
        current_page = []
        top_start = PAGE_H - MARGIN_TOP - 0.25 * inch
        cursor_y = top_start
        for cat in ordered_cats:
            label = known_cats.get(cat) or cat.replace("-", " ").title()
            # Category header height
            cat_h = 0.32 * inch + 0.08 * inch
            # If category header + at least 1 row won't fit, page break
            if cursor_y - cat_h - ROW_H - 0.05 * inch < MARGIN_BOTTOM:
                pages.append(current_page)
                current_page = []
                cursor_y = top_start
            current_page.append(("cat", label))
            cursor_y -= cat_h
            for item in groups[cat]:
                row_total = ROW_H + 0.05 * inch
                if cursor_y - row_total < MARGIN_BOTTOM:
                    pages.append(current_page)
                    current_page = []
                    cursor_y = top_start
                current_page.append(("item", item))
                cursor_y -= row_total
        if current_page:
            pages.append(current_page)
        return pages

    pages = _paginate()
    total_pages = max(1, len(pages))

    # === Pass 2 — draw ===
    c = canvas.Canvas(output_path, pagesize=LETTER)
    for pi, page in enumerate(pages):
        c.setFillColor(BG)
        c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
        _draw_header(c, pi + 1, total_pages)
        y = PAGE_H - MARGIN_TOP - 0.25 * inch
        for kind, payload in page:
            if kind == "cat":
                y = _draw_category_header(c, y, payload)
            else:
                y = _draw_row(c, y, payload)
        _draw_footer(c)
        if pi < len(pages) - 1:
            c.showPage()
    c.save()

    size_kb = os.path.getsize(output_path) // 1024
    total_items = sum(len(groups[c]) for c in ordered_cats)
    print(f"Master Sheet PDF: {output_path} ({size_kb}KB, {total_items} items, {total_pages} pages)")
    return output_path


if __name__ == "__main__":
    out_dir = Path("/app/frontend/public/menu")
    out_dir.mkdir(parents=True, exist_ok=True)
    asyncio.run(generate_master_sheet_pdf(str(out_dir / "Fin-and-Feathers-Menu-Master-Sheet.pdf")))
