"""Generate a double-sided 8.5x11 letter-size PDF menu for Fin & Feathers.

Page 1 (front): Food menu (starters, entrees, seafood-grits, sandwiches, salads, sides)
Page 2 (back):  Brunch + Cocktails
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

PAGE_W, PAGE_H = LETTER  # 612 x 792 points = 8.5 x 11 inches
MARGIN = 0.35 * inch
IMG_DIR = Path("/app/frontend/public")

BG = HexColor("#0a0a0a")
RED = HexColor("#dc2626")
GOLD = HexColor("#f59e0b")
TEXT_WHITE = HexColor("#f1f5f9")
TEXT_GRAY = HexColor("#94a3b8")
TEXT_MUTED = HexColor("#64748b")
CARD_BG = HexColor("#1e293b")
DIVIDER = HexColor("#334155")

CATEGORY_LABELS = {
    "starters": "Starters", "sides": "Sides", "entrees": "Entrees",
    "seafood-grits": "Seafood & Grits", "sandwiches": "Sandwiches",
    "salads": "Salads", "brunch": "Brunch", "brunch-sides": "Brunch Sides",
    "brunch-drinks": "Brunch Cocktails", "cocktails": "Cocktails",
}


def _img_reader(path):
    try:
        pil = PILImage.open(path).convert("RGB")
        pil.thumbnail((220, 220))
        buf = io.BytesIO()
        pil.save(buf, format="JPEG", quality=72, optimize=True)
        buf.seek(0)
        return ImageReader(buf)
    except Exception:
        return None


def resolve_image(item):
    for field in ("image", "image_url", "imageUrl"):
        p = item.get(field, "")
        if p:
            full = IMG_DIR / p.lstrip("/")
            if full.exists():
                return str(full)
    return None


def draw_bg(c):
    c.setFillColor(BG)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)


def draw_header(c, y, title, subtitle):
    c.setFillColor(RED)
    c.setFont("Helvetica-Bold", 18)
    c.drawCentredString(PAGE_W / 2, y, title)
    c.setFillColor(TEXT_GRAY)
    c.setFont("Helvetica", 7)
    c.drawCentredString(PAGE_W / 2, y - 12, subtitle)
    c.setStrokeColor(RED)
    c.setLineWidth(0.6)
    c.line(PAGE_W / 2 - 1.2 * inch, y - 20, PAGE_W / 2 + 1.2 * inch, y - 20)
    return y - 30


def draw_footer(c, note):
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 5.2)
    c.drawCentredString(PAGE_W / 2, MARGIN - 0.08 * inch, note)


def draw_cat_header(c, x, y, label, col_w):
    c.setFillColor(RED)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(x, y, label.upper())
    c.setStrokeColor(DIVIDER)
    c.setLineWidth(0.3)
    c.line(x, y - 2, x + col_w - 0.15 * inch, y - 2)
    return y - 11


def draw_card_compact(c, x, y, item, img_path, card_w):
    """Compact card with small image + text."""
    card_h = 0.78 * inch
    img_w = 0.62 * inch
    img_h = card_h - 0.06 * inch

    c.setFillColor(CARD_BG)
    c.roundRect(x, y - card_h, card_w, card_h, 3, fill=1, stroke=0)

    if img_path:
        reader = _img_reader(img_path)
        if reader:
            c.drawImage(reader, x + 0.03 * inch, y - card_h + 0.03 * inch,
                        width=img_w, height=img_h, preserveAspectRatio=True, mask="auto")

    tx = x + img_w + 0.08 * inch
    text_w = card_w - img_w - 0.14 * inch
    name = item.get("name", "").replace("*", "")

    c.setFillColor(TEXT_WHITE)
    c.setFont("Helvetica-Bold", 6.5)
    if len(name) > 22:
        name = name[:20] + ".."
    c.drawString(tx, y - 0.12 * inch, name)

    price = item.get("price")
    if price is not None:
        ps = f"${price:.0f}" if price == int(price) else f"${price:.2f}"
        c.setFillColor(RED)
        c.setFont("Helvetica-Bold", 7)
        c.drawRightString(x + card_w - 0.06 * inch, y - 0.12 * inch, ps)

    desc = item.get("description", "")
    if desc:
        c.setFillColor(TEXT_MUTED)
        c.setFont("Helvetica", 4.6)
        max_ch = int(text_w / 2.1)
        words, lines, line = desc.split(), [], ""
        for w in words:
            if len(line) + len(w) + 1 <= max_ch:
                line = f"{line} {w}" if line else w
            else:
                lines.append(line)
                line = w
        if line:
            lines.append(line)
        for i, ln in enumerate(lines[:5]):
            c.drawString(tx, y - 0.22 * inch - i * 0.08 * inch, ln)

    return y - card_h - 0.04 * inch


def draw_line(c, x, y, item, max_w):
    name = item.get("name", "").replace("*", "")
    price = item.get("price")
    c.setFillColor(TEXT_WHITE)
    c.setFont("Helvetica", 6.5)
    if len(name) > 36:
        name = name[:34] + ".."
    c.drawString(x, y, name)
    if price is not None:
        ps = f"${price:.0f}" if price == int(price) else f"${price:.2f}"
        c.setFillColor(RED)
        c.setFont("Helvetica-Bold", 6.5)
        c.drawRightString(x + max_w, y, ps)
        nw = c.stringWidth(name, "Helvetica", 6.5)
        pw = c.stringWidth(ps, "Helvetica-Bold", 6.5) + 3
        c.setStrokeColor(DIVIDER)
        c.setDash(1, 2)
        c.line(x + nw + 3, y + 2, x + max_w - pw, y + 2)
        c.setDash()
    return y - 9


def draw_addons(c, x, y, addons):
    if not addons:
        return y
    c.setFillColor(TEXT_MUTED)
    c.setFont("Helvetica-Oblique", 4.8)
    parts = []
    for a in sorted(addons, key=lambda a: -(a.get("price", 0))):
        n = a["name"].replace("Add ", "").replace(" to Any Sandwich", "").replace(" to Any Salad", "").replace("*", "")
        parts.append(f"{n} ${a.get('price', 0):.0f}")
    text = "Add-ons: " + "  |  ".join(parts)
    if len(text) > 80:
        text = text[:78] + ".."
    c.drawString(x, y, text)
    return y - 9


class ColumnLayout:
    def __init__(self, n_cols, y_start, col_w, x_start=MARGIN, y_min=MARGIN + 0.2 * inch):
        self.n = n_cols
        self.col_w = col_w
        self.xs = [x_start + i * col_w for i in range(n_cols)]
        self.ys = [y_start] * n_cols
        self.y_min = y_min

    def best_col(self):
        return max(range(self.n), key=lambda i: self.ys[i])

    def fits(self, col, needed):
        return self.ys[col] - needed >= self.y_min

    def get(self):
        ci = self.best_col()
        return ci, self.xs[ci], self.ys[ci]

    def set_y(self, col, y):
        self.ys[col] = y


def render_category(c, layout, cat_items, cat_label, col_w, use_cards):
    """Render a category into the column layout."""
    regular = [i for i in cat_items if not i["name"].lower().startswith("add ")]
    addons = [i for i in cat_items if i["name"].lower().startswith("add ")]

    ci, cx, cy = layout.get()
    if not layout.fits(ci, 0.5 * inch):
        return  # not enough space
    cy = draw_cat_header(c, cx, cy, cat_label, col_w)
    layout.set_y(ci, cy)

    for item in regular:
        ci, cx, cy = layout.get()
        img = resolve_image(item) if use_cards else None
        needed = 0.82 * inch if img else 10
        if not layout.fits(ci, needed):
            continue
        if img:
            cy = draw_card_compact(c, cx, cy, item, img, col_w - 0.08 * inch)
        else:
            cy = draw_line(c, cx, cy, item, col_w - 0.12 * inch)
        layout.set_y(ci, cy)

    if addons:
        ci, cx, cy = layout.get()
        if layout.fits(ci, 10):
            cy = draw_addons(c, cx, cy, addons)
            layout.set_y(ci, cy)

    ci = layout.best_col()
    layout.set_y(ci, layout.ys[ci] - 0.05 * inch)


async def generate_letter_menu_pdf(output_path: str):
    """Generate the double-sided 8.5x11 letter menu PDF."""
    client = AsyncIOMotorClient(os.environ.get("MONGO_URL", "mongodb://localhost:27017"))
    db = client[os.environ.get("DB_NAME", "test_database")]

    items = await db.menu_items.find(
        {"location_slug": "edgewood-atlanta", "is_active": {"$ne": False}},
        {"_id": 0}
    ).to_list(2000)

    by_cat = {}
    for item in items:
        cat = item.get("category", "")
        by_cat.setdefault(cat, []).append(item)

    c = canvas.Canvas(output_path, pagesize=LETTER)
    n_cols = 3
    col_w = (PAGE_W - 2 * MARGIN) / n_cols

    # ============ FRONT (PAGE 1): FOOD MENU ============
    draw_bg(c)
    y = draw_header(c, PAGE_H - MARGIN - 5, "FIN & FEATHERS", "ELEVATED DINING MEETS SOUTHERN SOUL")
    layout = ColumnLayout(n_cols, y, col_w)

    for cat in ["starters", "entrees", "seafood-grits", "sandwiches", "salads", "sides"]:
        cat_items = by_cat.get(cat, [])
        if not cat_items:
            continue
        use_cards = cat in ("starters", "entrees", "seafood-grits", "sandwiches", "salads")
        render_category(c, layout, cat_items, CATEGORY_LABELS.get(cat, cat), col_w, use_cards)

    draw_footer(c, "* Contains dairy and/or undercooked meat  |  Please inform your server of any allergies  |  A 20% service charge is added to all checks  |  finandfeathers.live")

    # ============ BACK (PAGE 2): BRUNCH + COCKTAILS ============
    c.showPage()
    draw_bg(c)
    y = draw_header(c, PAGE_H - MARGIN - 5, "BRUNCH & COCKTAILS", "WEEKEND BRUNCH 10AM-3PM  |  COCKTAILS NIGHTLY")
    layout = ColumnLayout(n_cols, y, col_w)

    for cat in ["brunch", "brunch-sides", "brunch-drinks", "cocktails"]:
        cat_items = by_cat.get(cat, [])
        if not cat_items:
            continue
        use_cards = cat in ("brunch", "brunch-drinks", "cocktails")
        render_category(c, layout, cat_items, CATEGORY_LABELS.get(cat, cat), col_w, use_cards)

    draw_footer(c, "21+ for alcoholic beverages  |  A 20% service charge is added to all checks  |  finandfeathers.live")

    c.save()
    size_kb = os.path.getsize(output_path) // 1024
    print(f"Letter PDF saved: {output_path} ({size_kb}KB)")


if __name__ == "__main__":
    out_dir = Path("/app/frontend/public/menu")
    out_dir.mkdir(parents=True, exist_ok=True)
    asyncio.run(generate_letter_menu_pdf(str(out_dir / "Fin-and-Feathers-Menu-Letter.pdf")))
