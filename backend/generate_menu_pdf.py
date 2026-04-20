"""Generate a printable 11x17 double-sided PDF menu for Fin & Feathers."""
import asyncio
import io
import os
from pathlib import Path
from PIL import Image as PILImage
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from motor.motor_asyncio import AsyncIOMotorClient

PAGE_W, PAGE_H = 17 * inch, 11 * inch
MARGIN = 0.45 * inch
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
    "salads": "Salads", "brunch": "Brunch Entrees", "brunch-sides": "Brunch Sides",
    "cocktails": "Cocktails",
}


def _img_reader(path):
    """Load image, resize for PDF, return ImageReader."""
    try:
        pil = PILImage.open(path).convert("RGB")
        pil.thumbnail((350, 350))
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
    c.setFont("Helvetica-Bold", 26)
    c.drawCentredString(PAGE_W / 2, y, title)
    c.setFillColor(TEXT_GRAY)
    c.setFont("Helvetica", 10)
    c.drawCentredString(PAGE_W / 2, y - 18, subtitle)
    c.setStrokeColor(RED)
    c.setLineWidth(0.8)
    c.line(PAGE_W / 2 - 1.8 * inch, y - 28, PAGE_W / 2 + 1.8 * inch, y - 28)
    return y - 42


def draw_footer(c):
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 6.5)
    c.drawCentredString(PAGE_W / 2, MARGIN - 0.1 * inch,
                        "* Contains dairy and/or undercooked meat  |  Please inform your server of any allergies  |  A 20% automatic gratuity is added to all checks  |  finandfeathers.live")


def draw_cat_header(c, x, y, label, col_w):
    c.setFillColor(RED)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(x, y, label.upper())
    c.setStrokeColor(DIVIDER)
    c.setLineWidth(0.4)
    c.line(x, y - 3, x + col_w - 0.2 * inch, y - 3)
    return y - 16


def draw_card(c, x, y, item, img_path, card_w):
    """Card with image + text. Returns new y."""
    card_h = 1.35 * inch
    img_w = 1.15 * inch
    img_h = card_h - 0.08 * inch

    c.setFillColor(CARD_BG)
    c.roundRect(x, y - card_h, card_w, card_h, 5, fill=1, stroke=0)

    if img_path:
        reader = _img_reader(img_path)
        if reader:
            c.drawImage(reader, x + 0.04 * inch, y - card_h + 0.04 * inch,
                        width=img_w, height=img_h, preserveAspectRatio=True, mask="auto")

    tx = x + img_w + 0.12 * inch
    text_w = card_w - img_w - 0.2 * inch
    name = item.get("name", "").replace("*", "")

    # Name
    c.setFillColor(TEXT_WHITE)
    c.setFont("Helvetica-Bold", 8.5)
    if len(name) > 26:
        name = name[:24] + ".."
    c.drawString(tx, y - 0.18 * inch, name)

    # Price
    price = item.get("price")
    if price:
        ps = f"${price:.0f}" if price == int(price) else f"${price:.2f}"
        c.setFillColor(RED)
        c.setFont("Helvetica-Bold", 9)
        c.drawRightString(x + card_w - 0.08 * inch, y - 0.18 * inch, ps)

    # Description
    desc = item.get("description", "")
    if desc:
        c.setFillColor(TEXT_MUTED)
        c.setFont("Helvetica", 6)
        max_ch = int(text_w / 2.8)
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
            c.drawString(tx, y - 0.32 * inch - i * 0.11 * inch, ln)

    # Badges
    badges = item.get("badges", [])
    bx = tx
    for badge in badges[:2]:
        c.setFillColor(HexColor("#ef4444") if badge == "Spicy" else GOLD if "Chef" in badge else TEXT_MUTED)
        c.setFont("Helvetica", 5)
        c.drawString(bx, y - card_h + 0.08 * inch, badge)
        bx += c.stringWidth(badge, "Helvetica", 5) + 6

    return y - card_h - 0.06 * inch


def draw_line(c, x, y, item, max_w):
    name = item.get("name", "").replace("*", "")
    price = item.get("price")
    c.setFillColor(TEXT_WHITE)
    c.setFont("Helvetica", 7.5)
    if len(name) > 38:
        name = name[:36] + ".."
    c.drawString(x, y, name)
    if price:
        ps = f"${price:.0f}" if price == int(price) else f"${price:.2f}"
        c.setFillColor(RED)
        c.setFont("Helvetica-Bold", 7.5)
        c.drawRightString(x + max_w, y, ps)
        nw = c.stringWidth(name, "Helvetica", 7.5)
        pw = c.stringWidth(ps, "Helvetica-Bold", 7.5) + 4
        c.setStrokeColor(DIVIDER)
        c.setDash(1, 2)
        c.line(x + nw + 4, y + 2, x + max_w - pw, y + 2)
        c.setDash()
    return y - 12


def draw_addons(c, x, y, addons):
    if not addons:
        return y
    c.setFillColor(TEXT_MUTED)
    c.setFont("Helvetica-Oblique", 6)
    parts = []
    for a in sorted(addons, key=lambda a: -(a.get("price", 0))):
        n = a["name"].replace("Add ", "").replace(" to Any Sandwich", "").replace(" to Any Salad", "").replace("*", "")
        parts.append(f"{n} ${a.get('price', 0):.0f}")
    c.drawString(x, y, "Add-ons: " + "  |  ".join(parts))
    return y - 12


class ColumnLayout:
    """Manage multi-column layout with auto-advance."""
    def __init__(self, n_cols, y_start, col_w, x_start=MARGIN, y_min=MARGIN + 0.25 * inch):
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
        """Get best column x, y."""
        ci = self.best_col()
        return ci, self.xs[ci], self.ys[ci]

    def set_y(self, col, y):
        self.ys[col] = y


async def generate_menu_pdf(output_path: str):
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

    c = canvas.Canvas(output_path, pagesize=(PAGE_W, PAGE_H))
    n_cols = 4
    col_w = (PAGE_W - 2 * MARGIN) / n_cols

    # ============ PAGE 1: MAIN FOOD ============
    draw_bg(c)
    y = draw_header(c, PAGE_H - MARGIN, "FIN & FEATHERS", "ELEVATED DINING MEETS SOUTHERN SOUL")
    layout = ColumnLayout(n_cols, y, col_w)

    for cat in ["starters", "entrees", "seafood-grits", "sandwiches", "salads", "sides"]:
        cat_items = by_cat.get(cat, [])
        if not cat_items:
            continue
        regular = [i for i in cat_items if not i["name"].lower().startswith("add ")]
        addons = [i for i in cat_items if i["name"].lower().startswith("add ")]

        ci, cx, cy = layout.get()
        cy = draw_cat_header(c, cx, cy, CATEGORY_LABELS.get(cat, cat), col_w)
        layout.set_y(ci, cy)

        use_cards = cat in ("starters", "entrees", "seafood-grits", "sandwiches", "salads")
        for item in regular:
            ci, cx, cy = layout.get()
            img = resolve_image(item) if use_cards else None
            needed = 1.45 * inch if img else 14
            if not layout.fits(ci, needed):
                continue  # skip if no space
            if img:
                cy = draw_card(c, cx, cy, item, img, col_w - 0.1 * inch)
            else:
                cy = draw_line(c, cx, cy, item, col_w - 0.15 * inch)
            layout.set_y(ci, cy)

        if addons:
            ci, cx, cy = layout.get()
            if layout.fits(ci, 14):
                cy = draw_addons(c, cx, cy, addons)
                layout.set_y(ci, cy)

        ci = layout.best_col()
        layout.set_y(ci, layout.ys[ci] - 0.08 * inch)

    draw_footer(c)

    # ============ PAGE 2: BRUNCH ============
    c.showPage()
    draw_bg(c)
    y = draw_header(c, PAGE_H - MARGIN, "FIN & FEATHERS", "BRUNCH MENU")
    layout = ColumnLayout(n_cols, y, col_w)

    for cat in ["brunch", "brunch-sides"]:
        cat_items = by_cat.get(cat, [])
        if not cat_items:
            continue
        regular = [i for i in cat_items if not i["name"].lower().startswith("add ")]

        ci, cx, cy = layout.get()
        cy = draw_cat_header(c, cx, cy, CATEGORY_LABELS.get(cat, cat), col_w)
        layout.set_y(ci, cy)

        use_cards = cat == "brunch"
        for item in regular:
            ci, cx, cy = layout.get()
            img = resolve_image(item) if use_cards else None
            needed = 1.45 * inch if img else 14
            if not layout.fits(ci, needed):
                continue
            if img:
                cy = draw_card(c, cx, cy, item, img, col_w - 0.1 * inch)
            else:
                cy = draw_line(c, cx, cy, item, col_w - 0.15 * inch)
            layout.set_y(ci, cy)

        ci = layout.best_col()
        layout.set_y(ci, layout.ys[ci] - 0.08 * inch)

    draw_footer(c)

    # ============ PAGE 3: COCKTAILS ============
    c.showPage()
    draw_bg(c)
    y = draw_header(c, PAGE_H - MARGIN, "FIN & FEATHERS", "COCKTAIL MENU")
    layout = ColumnLayout(n_cols, y, col_w)

    cocktails = by_cat.get("cocktails", []) + by_cat.get("signature-cocktails", [])
    if cocktails:
        ci, cx, cy = layout.get()
        cy = draw_cat_header(c, cx, cy, "Cocktails", col_w)
        layout.ys = [cy] * n_cols

        for item in cocktails:
            ci, cx, cy = layout.get()
            img = resolve_image(item)
            needed = 1.45 * inch if img else 14
            if not layout.fits(ci, needed):
                continue
            if img:
                cy = draw_card(c, cx, cy, item, img, col_w - 0.1 * inch)
            else:
                cy = draw_line(c, cx, cy, item, col_w - 0.15 * inch)
            layout.set_y(ci, cy)

    c.setFillColor(TEXT_MUTED)
    c.setFont("Helvetica", 7)
    c.drawCentredString(PAGE_W / 2, MARGIN - 0.1 * inch,
                        "21+ Establishment  |  A 20% automatic gratuity is added to all checks  |  finandfeathers.live")

    c.save()
    size_kb = os.path.getsize(output_path) // 1024
    print(f"PDF saved: {output_path} ({size_kb}KB, {c.getPageNumber()} pages)")


if __name__ == "__main__":
    asyncio.run(generate_menu_pdf("/app/frontend/public/menu/Fin-and-Feathers-Menu.pdf"))
