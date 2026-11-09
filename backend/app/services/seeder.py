import json
from sqlalchemy.orm import Session
from app.models.models import Department, User, Application, FeeBreakdown, PaymentSimulation, Notice, ApplicationStatusHistory
from app.core.security import hash_password
from app.services.fee_engine import calculate_fees

DEPARTMENTS_DATA = [
    # THEOLOGY AND ISLAMIC STUDIES
    {"id": 1, "name": "Al-Quran and Islamic Studies", "faculty": "Faculty of Theology and Islamic Studies"},
    {"id": 5, "name": "Dawah & Islamic Studies", "faculty": "Faculty of Theology and Islamic Studies"},
    {"id": 2, "name": "Al-Hadith & Islamic Studies", "faculty": "Faculty of Theology and Islamic Studies"},
    {"id": 4, "name": "As-Sirat An-Nabawiyyah", "faculty": "Faculty of Theology and Islamic Studies"},
    {"id": 3, "name": "Comparative Tafseer", "faculty": "Faculty of Theology and Islamic Studies"},

    # FACULTY OF ARTS
    {"id": 28, "name": "Bengali", "faculty": "Faculty of Arts"},
    {"id": 29, "name": "English", "faculty": "Faculty of Arts"},
    {"id": 30, "name": "Islamic History and Culture", "faculty": "Faculty of Arts"},
    {"id": 27, "name": "Arabic Language and Literature", "faculty": "Faculty of Arts"},
    {"id": 31, "name": "Fine Arts", "faculty": "Faculty of Arts"},

    # FACULTY OF SOCIAL SCIENCES
    {"id": 32, "name": "Economics", "faculty": "Faculty of Social Sciences"},
    {"id": 33, "name": "Public Administration", "faculty": "Faculty of Social Sciences"},
    {"id": 34, "name": "Political Science", "faculty": "Faculty of Social Sciences"},
    {"id": 35, "name": "Folklore and Social Studies", "faculty": "Faculty of Social Sciences"},
    {"id": 36, "name": "Development Studies", "faculty": "Faculty of Social Sciences"},
    {"id": 37, "name": "Social Welfare", "faculty": "Faculty of Social Sciences"},
    {"id": 38, "name": "Communication and Multimedia Journalism", "faculty": "Faculty of Social Sciences"},
    {"id": 20, "name": "Physical Education & Sports Science", "faculty": "Faculty of Social Sciences"},

    # FACULTY OF BUSINESS ADMINISTRATION
    {"id": 21, "name": "Accounting and Information Systems", "faculty": "Faculty of Business Administration"},
    {"id": 22, "name": "Management", "faculty": "Faculty of Business Administration"},
    {"id": 23, "name": "Finance and Banking", "faculty": "Faculty of Business Administration"},
    {"id": 24, "name": "Marketing", "faculty": "Faculty of Business Administration"},
    {"id": 25, "name": "Human Resource Management", "faculty": "Faculty of Business Administration"},
    {"id": 26, "name": "Tourism and Hospitality Management", "faculty": "Faculty of Business Administration"},

    # FACULTY OF LAW
    {"id": 39, "name": "Law", "faculty": "Faculty of Law"},
    {"id": 40, "name": "Al-Fiqh and Law", "faculty": "Faculty of Law"},
    {"id": 41, "name": "Law and Land Administration", "faculty": "Faculty of Law"},

    # FACULTY OF SCIENCES
    {"id": 17, "name": "Mathematics", "faculty": "Faculty of Sciences"},
    {"id": 18, "name": "Statistics and Data Science", "faculty": "Faculty of Sciences"},
    {"id": 19, "name": "Environmental Science and Geography", "faculty": "Faculty of Sciences"},

    # FACULTY OF BIOLOGICAL SCIENCES
    {"id": 15, "name": "Applied Nutrition and Food Technology", "faculty": "Faculty of Biological Sciences"},
    {"id": 14, "name": "Biotechnology and Genetic Engineering", "faculty": "Faculty of Biological Sciences"},
    {"id": 16, "name": "Pharmacy", "faculty": "Faculty of Biological Sciences"},

    # FACULTY OF ENGINEERING & TECHNOLOGY
    {"id": 10, "name": "Computer Science and Engineering", "faculty": "Faculty of Engineering & Technology"},
    {"id": 9, "name": "Electrical and Electronic Engineering", "faculty": "Faculty of Engineering & Technology"},
    {"id": 12, "name": "Information and Communication Technology", "faculty": "Faculty of Engineering & Technology"},
    {"id": 13, "name": "Biomedical Engineering", "faculty": "Faculty of Engineering & Technology"},
    {"id": 11, "name": "Applied Chemistry and Chemical Engineering", "faculty": "Faculty of Engineering & Technology"}
]

NOTICES_DATA = [
    {
        "title": "ইসলামী বিশ্ববিদ্যালয়ের ৫ম সমাবর্তন-২০২৭ উপলক্ষে নিবন্ধন, ফি প্রদান ও অংশগ্রহণ সংক্রান্ত বিজ্ঞপ্তি।",
        "category": "Registration",
        "description": "এতদ্বারা ইসলামী বিশ্ববিদ্যালয়ের সম্মানীয় গ্র্যাজুয়েটবৃন্দের অবগতির জন্য জানানো যাচ্ছে যে, আগামী ০২ ফেব্রুয়ারি ২০২৭ খ্রি. তারিখে বিশ্ববিদ্যালয়ের ৫ম সমাবর্তন ২০২৭ অনুষ্ঠিত হবে। সমাবর্তনে অংশগ্রহণে ইচ্ছুক গ্র্যাজুয়েটদের আগামী ১০ নভেম্বর ২০২৬ হতে ২৫ নভেম্বর ২০২৬ তারিখের মধ্যে অনলাইন পোর্টালের মাধ্যমে নিবন্ধন সম্পন্ন করার জন্য অনুরোধ করা হলো।",
        "date": "09 Nov 2026",
        "is_published": True,
        "is_new": True,
        "pdf_link": "/docs/notice_5th_convocation_registration.pdf"
    },
    {
        "title": "সমাবর্তন ২০২৭: গাউন বিতরণ, মহড়া (Rehearsal) ও আসনবিন্যাস সম্পর্কিত প্রস্তুতিমূলক নির্দেশনা।",
        "category": "Guidelines",
        "description": "সমাবর্তনের মূল অনুষ্ঠানের পূর্বের দিন কেন্দ্রীয় খেলার মাঠে মহড়া অনুষ্ঠিত হবে। মহড়ায় অংশগ্রহণকারী সকল গ্র্যাজুয়েটকে নির্দিষ্ট কাউন্টার থেকে গাউন ও কনভোকেশন কিট সংগ্রহ করতে হবে। বিস্তারিত সূচি পরবর্তীতে পোর্টাল ও নোটিশে জানানো হবে।",
        "date": "08 Nov 2026",
        "is_published": True,
        "is_new": False,
        "pdf_link": "/docs/notice_gown_and_rehearsal.pdf"
    },
    {
        "title": "ডেমো পোর্টাল ঘোষণা — শিক্ষামূলক প্রদর্শনী ও ইউজার ইন্টারফেস পরীক্ষা সংক্রান্ত।",
        "category": "Demonstration",
        "description": "এটি একটি স্বাধীন ও অনানুষ্ঠানিক ডেমো পোর্টাল। এখানে প্রদর্শিত তথ্য, কিউআর কোড এবং নিবন্ধন প্রক্রিয়ায় কোনো বাস্তব লেনদেন সম্পন্ন হয় না। শিক্ষার্থীরা পোর্টালটি টেস্ট ও প্রিভিউ করার জন্য সকল ফিচার ব্যবহার করতে পারেন।",
        "date": "05 Nov 2026",
        "is_published": True,
        "is_new": False,
        "pdf_link": None
    }
]

def seed_database(db: Session):
    # 1. Seed Departments if empty
    if db.query(Department).count() == 0:
        for dept in DEPARTMENTS_DATA:
            db.add(Department(**dept))
        db.commit()

    # 2. Seed Notices if empty
    if db.query(Notice).count() == 0:
        for n in NOTICES_DATA:
            db.add(Notice(**n))
        db.commit()

    # 3. Seed Demo Admin Account
    admin_user = db.query(User).filter(User.role == "admin").first()
    if not admin_user:
        admin_user = User(
            email="admin@convocation.iu.ac.bd",
            mobile="01700000001",
            roll_number="ADMIN-001",
            password_hash=hash_password("AdminIU@2027"),
            role="admin",
            is_active=True
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)

    # 4. Seed Demonstration Student Account 1 (Approved demo student)
    demo_student_1 = db.query(User).filter(User.roll_number == "1812045").first()
    if not demo_student_1:
        demo_student_1 = User(
            email="arnob.ict@gmail.com",
            mobile="01811860339",
            roll_number="1812045",
            password_hash=hash_password("StudentIU@2027"),
            role="student",
            is_active=True
        )
        db.add(demo_student_1)
        db.commit()
        db.refresh(demo_student_1)

        # Create application for student 1
        dept_ict = db.query(Department).filter(Department.id == 12).first()
        app_1 = Application(
            app_id="IU27-DEMO-000101",
            user_id=demo_student_1.id,
            full_name="Md. Tuhassinul Islam Arnob",
            father_name="Md. Rafiqul Islam",
            mother_name="Mrs. Tahmina Khatun",
            date_of_birth="1999-05-14",
            gender="Male",
            mobile="01811860339",
            email="arnob.ict@gmail.com",
            present_address="Department of Information and Communication Technology, Islamic University, Kushtia",
            permanent_address="House 42, Road 5, Kushtia Sadar, Kushtia - 7000",
            department_id=dept_ict.id,
            degree_level="Honours",
            registration_category="Regular",
            admission_session="2017-18",
            roll_number="1812045",
            registration_number="1812045-IU",
            gown_size="L",
            guest_count=2,
            guest_details_json=json.dumps([
                {"name": "Md. Rafiqul Islam", "relation": "Father", "age": 58, "under_five": False},
                {"name": "Master Ayman Islam", "relation": "Nephew", "age": 4, "under_five": True}
            ]),
            original_certificate_held=False,
            degrees_json=json.dumps([
                {
                    "degree_type": "Honours",
                    "department": "Information and Communication Technology",
                    "session": "2017-18",
                    "exam_year": "2022",
                    "roll_number": "1812045",
                    "has_certificate": False
                }
            ]),
            photo_url="/uploads/demo_student_photo.png",
            status="Approved (Demo)",
            review_note="All departmental verification checks completed successfully in demonstration environment."
        )
        db.add(app_1)
        db.commit()
        db.refresh(app_1)

        # Fee calculation
        fee_calc = calculate_fees(
            registration_category="Regular",
            primary_degree_level="Honours",
            original_certificate_held=False,
            guests=[
                {"name": "Md. Rafiqul Islam", "relation": "Father", "age": 58, "under_five": False},
                {"name": "Master Ayman Islam", "relation": "Nephew", "age": 4, "under_five": True}
            ]
        )
        fee_1 = FeeBreakdown(
            application_id=app_1.id,
            registration_category=fee_calc["registration_category"],
            registration_fee=fee_calc["registration_fee"],
            certificate_fee=fee_calc["certificate_fee"],
            guest_fee=fee_calc["guest_fee"],
            chargeable_guests=fee_calc["chargeable_guests"],
            service_charge=fee_calc["service_charge"],
            total_payable=fee_calc["total_payable"]
        )
        db.add(fee_1)

        # Payment simulation record
        payment_1 = PaymentSimulation(
            application_id=app_1.id,
            reference_id="DEMO-IU-2027-BK9482",
            payment_method="bKash",
            amount=fee_calc["total_payable"],
            status="DEMO SUCCESS",
            transaction_type="DEMONSTRATION ONLY"
        )
        db.add(payment_1)

        # Status History
        h1 = ApplicationStatusHistory(
            application_id=app_1.id,
            previous_status=None,
            new_status="Account Created",
            admin_identifier="System",
            review_note="Demonstration account created."
        )
        h2 = ApplicationStatusHistory(
            application_id=app_1.id,
            previous_status="Account Created",
            new_status="Payment Simulated",
            admin_identifier="System",
            review_note="Simulated demonstration payment completed via bKash."
        )
        h3 = ApplicationStatusHistory(
            application_id=app_1.id,
            previous_status="Payment Simulated",
            new_status="Under Review",
            admin_identifier="admin@convocation.iu.ac.bd",
            review_note="Departmental verification initiated."
        )
        h4 = ApplicationStatusHistory(
            application_id=app_1.id,
            previous_status="Under Review",
            new_status="Approved (Demo)",
            admin_identifier="admin@convocation.iu.ac.bd",
            review_note="Approved for educational demonstration. Convocation card activated."
        )
        db.add_all([h1, h2, h3, h4])
        db.commit()

    # 5. Seed Demonstration Student Account 2 (Awaiting Payment / Under Review)
    demo_student_2 = db.query(User).filter(User.roll_number == "1910012").first()
    if not demo_student_2:
        demo_student_2 = User(
            email="sadia.cse@gmail.com",
            mobile="01712345678",
            roll_number="1910012",
            password_hash=hash_password("StudentIU@2027"),
            role="student",
            is_active=True
        )
        db.add(demo_student_2)
        db.commit()
        db.refresh(demo_student_2)

        dept_cse = db.query(Department).filter(Department.id == 10).first()
        app_2 = Application(
            app_id="IU27-DEMO-000102",
            user_id=demo_student_2.id,
            full_name="Sadia Afroze",
            father_name="Abdul Hakim",
            mother_name="Salma Begum",
            date_of_birth="2000-08-20",
            gender="Female",
            mobile="01712345678",
            email="sadia.cse@gmail.com",
            present_address="Begum Fazilatunnesa Mujib Hall, Islamic University, Kushtia",
            permanent_address="Sector 7, Uttara, Dhaka",
            department_id=dept_cse.id,
            degree_level="Honours",
            registration_category="Regular",
            admission_session="2018-19",
            roll_number="1910012",
            registration_number="1910012-IU",
            gown_size="M",
            guest_count=1,
            guest_details_json=json.dumps([
                {"name": "Abdul Hakim", "relation": "Father", "age": 55, "under_five": False}
            ]),
            original_certificate_held=True, # already has certificate!
            degrees_json=json.dumps([
                {
                    "degree_type": "Honours",
                    "department": "Computer Science and Engineering",
                    "session": "2018-19",
                    "exam_year": "2023",
                    "roll_number": "1910012",
                    "has_certificate": True
                }
            ]),
            photo_url=None,
            status="Under Review",
            review_note="Application submitted with simulated payment. Pending administrative review."
        )
        db.add(app_2)
        db.commit()
        db.refresh(app_2)

        fee_calc_2 = calculate_fees(
            registration_category="Regular",
            primary_degree_level="Honours",
            original_certificate_held=True,
            guests=[{"name": "Abdul Hakim", "relation": "Father", "age": 55, "under_five": False}]
        )
        fee_2 = FeeBreakdown(
            application_id=app_2.id,
            registration_category=fee_calc_2["registration_category"],
            registration_fee=fee_calc_2["registration_fee"],
            certificate_fee=fee_calc_2["certificate_fee"],
            guest_fee=fee_calc_2["guest_fee"],
            chargeable_guests=fee_calc_2["chargeable_guests"],
            service_charge=fee_calc_2["service_charge"],
            total_payable=fee_calc_2["total_payable"]
        )
        db.add(fee_2)

        payment_2 = PaymentSimulation(
            application_id=app_2.id,
            reference_id="DEMO-IU-2027-RC5521",
            payment_method="Rocket",
            amount=fee_calc_2["total_payable"],
            status="DEMO SUCCESS",
            transaction_type="DEMONSTRATION ONLY"
        )
        db.add(payment_2)

        h2_1 = ApplicationStatusHistory(
            application_id=app_2.id,
            previous_status=None,
            new_status="Account Created",
            admin_identifier="System",
            review_note="Demonstration account created."
        )
        h2_2 = ApplicationStatusHistory(
            application_id=app_2.id,
            previous_status="Account Created",
            new_status="Under Review",
            admin_identifier="System",
            review_note="Simulated Rocket payment confirmed; application queued for review."
        )
        db.add_all([h2_1, h2_2])
        db.commit()
