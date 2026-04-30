"""
seed_categories.py
──────────────────
Populates the categories table with the 14 standard part categories.
Safe to run multiple times — skips existing slugs.

Usage:
    cd backend
    python seed_categories.py
"""

import sys
import os

# Make sure app is importable from backend/
sys.path.append(os.path.dirname(__file__))

from app.database import SessionLocal
from app.models.category import Category


# ── 14 Standard Categories ────────────────────────────────────
CATEGORIES = [
    {
        "slug":        "engine-components",
        "name":        "Engine Components",
        "description": "Pistons, spark plugs, injectors, timing chains, oil pumps, sensors",
        "sort_order":  1,
    },
    {
        "slug":        "transmission-drivetrain",
        "name":        "Transmission & Drivetrain",
        "description": "Gearboxes, mechatronics, valve bodies, clutches, driveshafts, differentials",
        "sort_order":  2,
    },
    {
        "slug":        "braking-system",
        "name":        "Braking System",
        "description": "Brake pads, discs, rotors, calipers, ABS modules, brake sensors",
        "sort_order":  3,
    },
    {
        "slug":        "suspension-steering",
        "name":        "Suspension & Steering",
        "description": "Control arms, bushings, shock absorbers, air suspension, steering racks",
        "sort_order":  4,
    },
    {
        "slug":        "electrical-electronics",
        "name":        "Electrical & Electronics",
        "description": "ECU modules, alternators, starters, batteries, wiring harnesses, sensors",
        "sort_order":  5,
    },
    {
        "slug":        "lighting-system",
        "name":        "Lighting System",
        "description": "Headlights, tail lights, fog lights, bulbs, ballasts, adaptive headlight motors",
        "sort_order":  6,
    },
    {
        "slug":        "body-exterior",
        "name":        "Body & Exterior",
        "description": "Panels, bumpers, doors, mirrors, grilles, windscreens, wipers",
        "sort_order":  7,
    },
    {
        "slug":        "interior-components",
        "name":        "Interior Components",
        "description": "Seats, trim panels, switches, instrument clusters, climate controls, displays",
        "sort_order":  8,
    },
    {
        "slug":        "cooling-air-system",
        "name":        "Cooling & Air System",
        "description": "Radiators, water pumps, thermostats, intercoolers, air filters, MAF sensors",
        "sort_order":  9,
    },
    {
        "slug":        "fuel-system",
        "name":        "Fuel System",
        "description": "Fuel pumps, injectors, fuel filters, pressure regulators, fuel rails",
        "sort_order":  10,
    },
    {
        "slug":        "seals-gaskets",
        "name":        "Seals & Gaskets",
        "description": "Head gaskets, valve cover gaskets, oil seals, O-rings, camshaft seals",
        "sort_order":  11,
    },
    {
        "slug":        "fasteners-hardware",
        "name":        "Fasteners & Hardware",
        "description": "Bolts, nuts, clips, brackets, mounting hardware, heat shields",
        "sort_order":  12,
    },
    {
        "slug":        "wheels-tyres",
        "name":        "Wheels & Tyres",
        "description": "Alloy wheels, tyre pressure sensors, wheel bearings, hub assemblies",
        "sort_order":  13,
    },
    {
        "slug":        "accessories-misc",
        "name":        "Accessories & Misc",
        "description": "Floor mats, tow bars, roof racks, car care products, miscellaneous parts",
        "sort_order":  14,
    },
]


def seed():
    db = SessionLocal()
    inserted = 0
    skipped  = 0

    try:
        for data in CATEGORIES:
            # Check if slug already exists — skip if so
            existing = db.query(Category).filter(
                Category.slug == data["slug"]
            ).first()

            if existing:
                print(f"  ⏭  Skipped  : {data['name']} (already exists)")
                skipped += 1
                continue

            category = Category(**data)
            db.add(category)
            inserted += 1
            print(f"  ✅ Inserted : {data['name']}")

        db.commit()
        print(f"\n  Done — {inserted} inserted, {skipped} skipped.\n")

    except Exception as e:
        db.rollback()
        print(f"\n  ❌ Error: {e}\n")
        raise

    finally:
        db.close()


if __name__ == "__main__":
    print("\n── Seeding Categories ──────────────────────────────")
    seed()