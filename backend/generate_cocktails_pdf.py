"""Generate a Signature Cocktails PDF on 8.5×11 — 3 columns × 3 rows = 9 image cards per page.

Each card shows a square cocktail photo with the cocktail name, price, and description.
Run as a script or from the FastAPI route handler.
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

PAGE_W, PAGE_H = LETTER  # 8.5 x 11 inches in points
MARGIN = 0.45 * inch
GUTTER = 0.18 * inch
IMG_DIR = Path("/app/frontend/public")

# Palette — matches the dark/red house theme
BG = HexColor("#0a0a0a")
RED = HexColor("#dc2626")
GOLD = HexColor("#f59e0b")
TEXT_WHITE = HexColor("#f1f5f9")
TEXT_MUTED = HexColor("#94a3b8")
CARD_BG = HexColor("#171923")
CARD_BORDER = HexColor("#334155")


def _img_reader(path: str):
    """Resize & re-encode the image into a small in-memory JPEG for embedding."""
    try:
        pil = PILImage.open(path).convert("RGB")
        pil.thumbnail((420, 420))
        buf = io.BytesIO()
        pil.save(buf, format="JPEG", quality=78, optimize=True)
        buf.seek(0)
        return ImageReader(buf)
    except Exception:
        return None


def _resolve_image(item: dict):
    for field in ("image", "image_url", "imageUrl"):
        p = item.get(field) or ""
        if p:
            full = IMG_DIR / p.lstrip("/")
            if full.exists():
                return str(full)
    return None


def _wrap_text(text: str, max_chars: int, max_lines: int):
    """Greedy word-wrap. Truncates with an ellipsis if it overflows max_lines."""
    text = (text or "").strip()
    if not text:
        return []
    words = text.split()
    lines, line = [], ""
    for w in words:
        candidate = (line + " " + w).strip()
        if len(candidate) <= max_chars:
            line = candidate
        else:
            if line:
                lines.append(line)
            line = w
            if len(lines) >= max_lines:
                break
    if line and len(lines) < max_lines:
        lines.append(line)
    if len(lines) == max_lines and len(" ".join(lines)) < len(text):
        last = lines[-1]
        while last and len(last) > 1 and (last + "…")[-1] == "…" and len(last) > max_chars - 1:
            last = last[:-1]
        lines[-1] = (last.rstrip(",.;:") + "…")[: max_chars]
    return lines


def _format_price(price):
    if price is None:
        return ""
    try:
        if float(price) == int(float(price)):
            return f"${int(price)}"
        return f"${float(price):.2f}"
    except (ValueError, TypeError):
        return ""


# ---------- page chrome ----------

def _draw_background(c):
    c.setFillColor(BG)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)


def _draw_header(c, page_num, total_pages):
    title_y = PAGE_H - MARGIN - 4
    c.setFillColor(RED)
    c.setFont("Helvetica-Bold", 20)
    c.drawCentredString(PAGE_W / 2, title_y, "SIGNATURE COCKTAILS")
    c.setFillColor(TEXT_MUTED)
    c.setFont("Helvetica", 7.5)
    c.drawCentredString(PAGE_W / 2, title_y - 13, "HANDCRAFTED · POURED WITH PERSONALITY · FIN & FEATHERS")
    c.setStrokeColor(RED)
    c.setLineWidth(0.6)
    c.line(PAGE_W / 2 - 1.3 * inch, title_y - 21, PAGE_W / 2 + 1.3 * inch, title_y - 21)
    if total_pages > 1:
        c.setFillColor(TEXT_MUTED)
        c.setFont("Helvetica", 6.5)
        c.drawRightString(PAGE_W - MARGIN, title_y, f"PAGE {page_num} / {total_pages}")
    return title_y - 28  # y baseline where the grid should start


def _draw_footer(c):
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 5.4)
    c.drawCentredString(
        PAGE_W / 2,
        MARGIN - 0.10 * inch,
        "21+ for alcoholic beverages  |  A 20% service charge is added to all checks  |  finandfeathers.live",
    )


# ---------- card ----------

def _draw_card(c, x, y_top, w, h, item):
    """Draw a single cocktail card. (x, y_top) is the top-left corner; w/h are dimensions."""
    # Frame
    c.setFillColor(CARD_BG)
    c.setStrokeColor(CARD_BORDER)
    c.setLineWidth(0.4)
    c.roundRect(x, y_top - h, w, h, 5, fill=1, stroke=1)

    # Image area: top ~55% of card, full-width minus inner padding
    pad = 0.06 * inch
    img_h = h * 0.55
    img_w = w - 2 * pad
    img_path = _resolve_image(item)
    if img_path:
        reader = _img_reader(img_path)
        if reader:
            c.drawImage(
                reader,
                x + pad,
                y_top - pad - img_h,
                width=img_w,
                height=img_h,
                preserveAspectRatio=True,
                anchor="c",
                mask="auto",
            )

    # Text block beneath the image
    text_x = x + pad
    text_top = y_top - pad - img_h - 0.10 * inch

    # Name + price
    name = (item.get("name") or "").replace("*", "").strip()
    price_str = _format_price(item.get("price"))

    c.setFillColor(TEXT_WHITE)
    c.setFont("Helvetica-Bold", 8.5)
    # Truncate name if needed (rough width-based truncation)
    max_name_chars = 22
    if len(name) > max_name_chars:
        name = name[: max_name_chars - 1].rstrip() + "…"
    c.drawString(text_x, text_top, name)

    if price_str:
        c.setFillColor(RED)
        c.setFont("Helvetica-Bold", 9)
        c.drawRightString(x + w - pad, text_top, price_str)

    # Description — up to 4 wrapped lines at ~5.6pt
    desc = (item.get("description") or "").strip()
    if desc:
        c.setFillColor(TEXT_MUTED)
        c.setFont("Helvetica", 5.8)
        # Estimate characters that fit in the card width.
        # ~card_w in points / ~2.6pt avg per char at 5.8pt Helvetica.
        max_chars = int((w - 2 * pad) / 2.6)
        lines = _wrap_text(desc, max_chars=max_chars, max_lines=4)
        line_h = 0.105 * inch
        for i, ln in enumerate(lines):
            c.drawString(text_x, text_top - 0.13 * inch - i * line_h, ln)


# ---------- main ----------

async def generate_cocktails_pdf(output_path: str, location_slug: str = "edgewood-atlanta") -> str:
    client = AsyncIOMotorClient(os.environ.get("MONGO_URL", "mongodb://localhost:27017"))
    db = client[os.environ.get("DB_NAME", "test_database")]

    cocktails = await db.menu_items.find(
        {
            "location_slug": location_slug,
            "category": {"$in": ["cocktails", "signature-cocktails"]},
            "is_active": {"$ne": False},
        },
        {"_id": 0},
    ).to_list(2000)

    # Skip add-ons / non-cocktail mistakes
    cocktails = [
        i for i in cocktails
        if not (i.get("name") or "").lower().startswith("add ")
    ]

    # Sort: highest price first, then by display_order, then by name.
    cocktails.sort(
        key=lambda x: (
            -float(x.get("price") or 0),
            (x.get("display_order") if x.get("display_order") is not None else 9999),
            (x.get("name") or "").lower(),
        )
    )

    cards_per_row = 3
    rows_per_page = 3
    cards_per_page = cards_per_row * rows_per_page

    grid_w = PAGE_W - 2 * MARGIN
    card_w = (grid_w - (cards_per_row - 1) * GUTTER) / cards_per_row
    # Reserve space for header (top) + footer (bottom)
    header_reserve = 0.85 * inch
    footer_reserve = 0.45 * inch
    grid_h = PAGE_H - header_reserve - footer_reserve - MARGIN
    card_h = (grid_h - (rows_per_page - 1) * GUTTER) / rows_per_page

    total_pages = max(1, (len(cocktails) + cards_per_page - 1) // cards_per_page)

    c = canvas.Canvas(output_path, pagesize=LETTER)

    for page_idx in range(total_pages):
        _draw_background(c)
        grid_top = _draw_header(c, page_idx + 1, total_pages)
        page_items = cocktails[page_idx * cards_per_page : (page_idx + 1) * cards_per_page]
        for i, item in enumerate(page_items):
            row = i // cards_per_row
            col = i % cards_per_row
            x = MARGIN + col * (card_w + GUTTER)
            y_top = grid_top - row * (card_h + GUTTER)
            _draw_card(c, x, y_top, card_w, card_h, item)
        _draw_footer(c)
        if page_idx < total_pages - 1:
            c.showPage()

    c.save()
    size_kb = os.path.getsize(output_path) // 1024
    print(f"Signature Cocktails PDF saved: {output_path} ({size_kb}KB, {len(cocktails)} cocktails, {total_pages} pages)")
    return output_path


if __name__ == "__main__":
    out_dir = Path("/app/frontend/public/menu")
    out_dir.mkdir(parents=True, exist_ok=True)
    asyncio.run(
        generate_cocktails_pdf(str(out_dir / "Fin-and-Feathers-Signature-Cocktails.pdf"))
    )
