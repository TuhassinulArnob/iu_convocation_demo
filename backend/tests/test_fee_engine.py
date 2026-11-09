import pytest
from app.services.fee_engine import calculate_fees

def test_regular_registration_fee_single_honours():
    """
    Test Regular registration with Honours certificate needed.
    Reg: 4500, Honours cert: 500, Service: 32.50 = 5032.50
    """
    res = calculate_fees(
        registration_category="Regular",
        primary_degree_level="Honours",
        original_certificate_held=False,
        guests=[]
    )
    assert res["registration_category"] == "Regular"
    assert res["registration_fee"] == 4500.0
    assert res["certificate_fee"] == 500.0
    assert res["guest_fee"] == 0.0
    assert res["service_charge"] == 32.50
    assert res["total_payable"] == 5032.50

def test_regular_registration_certificate_already_held():
    """
    If applicant already holds certificate, certificate fee should be 0.
    Reg: 4500, Cert: 0, Service: 32.50 = 4532.50
    """
    res = calculate_fees(
        registration_category="Regular",
        primary_degree_level="Honours",
        original_certificate_held=True,
        guests=[]
    )
    assert res["registration_fee"] == 4500.0
    assert res["certificate_fee"] == 0.0
    assert res["total_payable"] == 4532.50

def test_evening_registration_with_masters():
    """
    Evening registration (5500) + Masters cert (700) + Service: 32.50 = 6232.50
    """
    res = calculate_fees(
        registration_category="Evening",
        primary_degree_level="Masters",
        original_certificate_held=False,
        guests=[]
    )
    assert res["registration_category"] == "Evening"
    assert res["registration_fee"] == 5500.0
    assert res["certificate_fee"] == 700.0
    assert res["total_payable"] == 6232.50

def test_guest_fees_with_under_five_exemption():
    """
    2 guests: 1 adult (1000) and 1 under 5 (free).
    Reg: 4500, Guest: 1000, Service: 32.50 = 5532.50
    """
    guests = [
        {"name": "Spouse", "relation": "Spouse", "age": 28, "under_five": False},
        {"name": "Toddler", "relation": "Child", "age": 3, "under_five": True}
    ]
    res = calculate_fees(
        registration_category="Regular",
        primary_degree_level="Honours",
        original_certificate_held=True,
        guests=guests
    )
    assert res["chargeable_guests"] == 1
    assert res["exempt_guests"] == 1
    assert res["guest_fee"] == 1000.0
    assert res["total_payable"] == 5532.50

def test_max_guests_limit():
    """
    Enforces maximum of 3 guests even if 5 provided.
    """
    guests = [{"name": f"Guest {i}", "age": 30, "under_five": False} for i in range(5)]
    res = calculate_fees(
        registration_category="Regular",
        original_certificate_held=True,
        guests=guests
    )
    assert res["chargeable_guests"] == 3
    assert res["guest_fee"] == 3000.0
