import io
import os
import qrcode
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

def generate_convocation_card_pdf(
    card_id: str,
    app_id: str,
    student_name: str,
    department: str,
    degree: str,
    roll_number: str,
    registration_number: str,
    session: str,
    gown_size: str,
    guest_count: int,
    issued_at_str: str,
    digital_signature: str,
    verification_url: str,
    photo_url: str = None
) -> bytes:
    """
    Generates a high-resolution, print-ready PDF convocation pass
    with sharp QR code and cryptographic digital signature block.
    """
    buffer = io.BytesIO()
    
    # Card dimensions: 7.5 x 4.5 inches (standard academic entry pass)
    page_w = 7.5 * inch
    page_h = 4.8 * inch
    c = canvas.Canvas(buffer, pagesize=(page_w, page_h))
    
    # 1. Background & Outer Border
    c.setFillColor(colors.HexColor("#F8FAF9"))
    c.rect(0, 0, page_w, page_h, fill=1, stroke=0)
    
    # Double Academic Border
    c.setStrokeColor(colors.HexColor("#153A37"))
    c.setLineWidth(3)
    c.rect(10, 10, page_w - 20, page_h - 20, fill=0, stroke=1)
    
    c.setStrokeColor(colors.HexColor("#D4AF37")) # Warm Academic Gold
    c.setLineWidth(1)
    c.rect(14, 14, page_w - 28, page_h - 28, fill=0, stroke=1)
    
    # 2. Header Strip (Deep Academic Teal #153A37)
    c.setFillColor(colors.HexColor("#153A37"))
    c.rect(15, page_h - 68, page_w - 30, 53, fill=1, stroke=0)
    
    # Gold decorative separator line
    c.setStrokeColor(colors.HexColor("#F3A052"))
    c.setLineWidth(2)
    c.line(15, page_h - 68, page_w - 15, page_h - 68)
    
    # University Header Text
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(page_w / 2.0, page_h - 32, "ISLAMIC UNIVERSITY BANGLADESH")
    
    c.setFillColor(colors.HexColor("#F3A052"))
    c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(page_w / 2.0, page_h - 46, "5TH CONVOCATION 2027 — ENTRY CARD")
    
    c.setFillColor(colors.HexColor("#E2E8F0"))
    c.setFont("Helvetica-Bold", 7.5)
    c.drawCentredString(page_w / 2.0, page_h - 59, "DIGITALLY VERIFIED — EDUCATIONAL DEMONSTRATION")
    
    # 3. Candidate Photo Box (Left)
    photo_box_x = 28
    photo_box_y = page_h - 200
    photo_w = 95
    photo_h = 120
    
    c.setFillColor(colors.HexColor("#E5E7EB"))
    c.rect(photo_box_x, photo_box_y, photo_w, photo_h, fill=1, stroke=0)
    c.setStrokeColor(colors.HexColor("#075C55"))
    c.setLineWidth(1.5)
    c.rect(photo_box_x, photo_box_y, photo_w, photo_h, fill=0, stroke=1)
    
    # Photo insertion if local file exists
    drawn_photo = False
    if photo_url:
        clean_url = photo_url.replace("/uploads/", "")
        candidate_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads", clean_url)
        if os.path.exists(candidate_path):
            try:
                c.drawImage(candidate_path, photo_box_x, photo_box_y, width=photo_w, height=photo_h, preserveAspectRatio=True)
                drawn_photo = True
            except Exception:
                drawn_photo = False
                
    if not drawn_photo:
        c.setFillColor(colors.HexColor("#4B5563"))
        c.setFont("Helvetica", 8)
        c.drawCentredString(photo_box_x + photo_w / 2.0, photo_box_y + photo_h / 2.0, "PHOTO")
    
    # 4. Candidate Details (Middle Column)
    detail_x = 138
    y = page_h - 88
    
    c.setFillColor(colors.HexColor("#153A37"))
    c.setFont("Helvetica-Bold", 12)
    c.drawString(detail_x, y, student_name[:36])
    
    y -= 16
    c.setFont("Helvetica-Bold", 8.5)
    c.setFillColor(colors.HexColor("#075C55"))
    c.drawString(detail_x, y, f"Degree: {degree}")
    
    y -= 14
    c.setFont("Helvetica", 8.5)
    c.setFillColor(colors.HexColor("#1F2937"))
    c.drawString(detail_x, y, f"Department: {department[:40]}")
    
    y -= 14
    c.drawString(detail_x, y, f"Roll No: {roll_number}    Reg No: {registration_number or 'N/A'}")
    
    y -= 14
    c.drawString(detail_x, y, f"Session: {session}    Gown: {gown_size}    Guests: {guest_count}")
    
    y -= 14
    c.setFont("Helvetica-Bold", 8)
    c.setFillColor(colors.HexColor("#075C55"))
    c.drawString(detail_x, y, f"App ID: {app_id}    Card ID: {card_id}")
    
    y -= 15
    # Ceremony info strip
    c.setFillColor(colors.HexColor("#E6FFFA"))
    c.rect(detail_x, y - 6, 230, 18, fill=1, stroke=0)
    c.setStrokeColor(colors.HexColor("#B2F5EA"))
    c.rect(detail_x, y - 6, 230, 18, fill=0, stroke=1)
    
    c.setFillColor(colors.HexColor("#234E52"))
    c.setFont("Helvetica-Bold", 7.5)
    c.drawString(detail_x + 5, y - 1, "Ceremony: 02 February 2027 · 09:00 AM · Central Playground")
    
    # 5. QR Code Section (Right Column)
    qr_x = page_w - 145
    qr_y = page_h - 195
    qr_size = 115
    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=4,
        border=1,
    )
    qr.add_data(verification_url)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="#153A37", back_color="white")
    
    qr_buffer = io.BytesIO()
    qr_img.save(qr_buffer, format="PNG")
    qr_buffer.seek(0)
    
    # White background behind QR
    c.setFillColor(colors.white)
    c.rect(qr_x - 3, qr_y - 3, qr_size + 6, qr_size + 6, fill=1, stroke=0)
    c.setStrokeColor(colors.HexColor("#CBD5E1"))
    c.rect(qr_x - 3, qr_y - 3, qr_size + 6, qr_size + 6, fill=0, stroke=1)
    
    c.drawImage(ImageReader(qr_buffer), qr_x, qr_y, width=qr_size, height=qr_size)
    
    c.setFillColor(colors.HexColor("#4B5563"))
    c.setFont("Helvetica-Bold", 6.5)
    c.drawCentredString(qr_x + qr_size / 2.0, qr_y - 10, "SCAN TO VERIFY CARD")
    
    # 6. Digital Signature & Verification Box (Bottom)
    sig_box_y = 38
    c.setFillColor(colors.HexColor("#EDF2F7"))
    c.rect(20, sig_box_y, page_w - 40, 36, fill=1, stroke=0)
    c.setStrokeColor(colors.HexColor("#CBD5E0"))
    c.rect(20, sig_box_y, page_w - 40, 36, fill=0, stroke=1)
    
    c.setFillColor(colors.HexColor("#1A202C"))
    c.setFont("Helvetica-Bold", 7.5)
    c.drawString(28, sig_box_y + 22, "DIGITAL SIGNATURE & BACKEND VALIDATION:")
    
    c.setFont("Courier-Bold", 7.5)
    c.setFillColor(colors.HexColor("#0D9488"))
    c.drawString(210, sig_box_y + 22, digital_signature)
    
    c.setFont("Helvetica", 7)
    c.setFillColor(colors.HexColor("#4A5568"))
    c.drawString(28, sig_box_y + 9, f"Issued: {issued_at_str}  ·  Verification: {verification_url[:48]}...")
    
    # 7. Red Educational Disclaimer Banner (Absolute Bottom)
    c.setFillColor(colors.HexColor("#DC2626"))
    c.rect(15, 15, page_w - 30, 18, fill=1, stroke=0)
    
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 6.5)
    c.drawCentredString(
        page_w / 2.0, 
        21, 
        "EDUCATIONAL DEMONSTRATION ONLY — NOT AN OFFICIAL UNIVERSITY ISSUED PASS"
    )
    
    c.showPage()
    c.save()
    
    buffer.seek(0)
    return buffer.getvalue()
