"""
dummy_products.py
─────────────────
Seeds the database with 20 products per category (280 total).
Mix of Mercedes and BMW parts, various types (genuine/oem/aftermarket).

Usage:
    cd backend
    python dummy_products.py
"""

import sys
import os
import uuid
from datetime import datetime

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.product import Product
from app.models.category import Category

# ── Product data per category ─────────────────────────────────
PRODUCTS_BY_CATEGORY = {

    "engine-components": [
        # Mercedes
        ("MB-EC-001", "Mercedes Engine Oil Filter Assembly", "mercedes", "genuine", "A2761800009", 5200, 3800, 12, 3, "E200 E250 C200", 2014, 2020, "petrol"),
        ("MB-EC-002", "Mercedes Spark Plug Set x4", "mercedes", "oem", "A0031590403", 8500, 6200, 8, 3, "C180 C200 E200", 2012, 2022, "petrol"),
        ("MB-EC-003", "Mercedes Timing Chain Kit", "mercedes", "genuine", "A6510500311", 45000, 33000, 4, 2, "C220 E220 GLK220", 2010, 2018, "diesel"),
        ("MB-EC-004", "Mercedes Valve Cover Gasket", "mercedes", "oem", "A6460160121", 3800, 2700, 15, 5, "C200 E200", 2008, 2016, "diesel"),
        ("MB-EC-005", "Mercedes Crankshaft Position Sensor", "mercedes", "genuine", "A0031531228", 4200, 3000, 10, 3, "C180 C200 E200", 2010, 2022, "petrol"),
        ("MB-EC-006", "Mercedes Camshaft Adjuster Solenoid", "mercedes", "oem", "A6420700054", 6800, 4900, 6, 2, "C220 E220", 2009, 2019, "diesel"),
        ("MB-EC-007", "Mercedes Engine Mount Right", "mercedes", "genuine", "A2042400417", 8900, 6500, 8, 3, "C200 C250 C300", 2007, 2014, "petrol"),
        ("MB-EC-008", "Mercedes Piston Ring Set", "mercedes", "oem", "A6510300124", 12000, 8800, 5, 2, "E220 E250 ML250", 2011, 2019, "diesel"),
        ("MB-EC-009", "Mercedes Oil Pressure Sensor", "mercedes", "genuine", "A0041535328", 2800, 2000, 20, 5, "All Models", 2005, 2022, None),
        ("MB-EC-010", "Mercedes Thermostat Assembly", "mercedes", "genuine", "A6422000215", 5600, 4100, 9, 3, "C220 E220 GLC220", 2014, 2022, "diesel"),
        # BMW
        ("BMW-EC-001", "BMW Valve Cover Gasket N52 N54", "bmw", "genuine", "11127552281", 3500, 2500, 14, 4, "320i 325i 520i", 2006, 2013, "petrol"),
        ("BMW-EC-002", "BMW VANOS Solenoid Set", "bmw", "genuine", "11367585425", 18500, 13500, 5, 2, "118i 120i 320i 520i", 2007, 2016, "petrol"),
        ("BMW-EC-003", "BMW Timing Chain Kit N47", "bmw", "oem", "11317797914", 38000, 28000, 3, 2, "118d 320d 520d", 2007, 2015, "diesel"),
        ("BMW-EC-004", "BMW Spark Plugs Set x6 N52", "bmw", "genuine", "12120037244", 9500, 7000, 10, 3, "325i 330i 525i 530i", 2006, 2013, "petrol"),
        ("BMW-EC-005", "BMW Engine Mount Right E90 E60", "bmw", "oem", "22116779978", 6500, 4700, 8, 3, "316i 318i 320i", 2005, 2012, "petrol"),
        ("BMW-EC-006", "BMW Oil Pressure Switch", "bmw", "genuine", "12617501786", 1800, 1300, 25, 5, "All Models", 2000, 2022, None),
        ("BMW-EC-007", "BMW Crankshaft Sensor N47 Diesel", "bmw", "genuine", "13627804950", 4800, 3500, 7, 3, "118d 120d 318d 320d", 2007, 2019, "diesel"),
        ("BMW-EC-008", "BMW Thermostat N47 Diesel", "bmw", "oem", "11537534521", 4200, 3000, 10, 3, "118d 320d 520d X3 20d", 2007, 2019, "diesel"),
        ("BMW-EC-009", "BMW Intake Manifold Gasket N52", "bmw", "genuine", "11617548128", 2200, 1600, 12, 4, "320i 520i X3 X5", 2006, 2015, "petrol"),
        ("BMW-EC-010", "BMW Piston Set N47 Standard", "bmw", "oem", "11257807926", 28000, 20000, 4, 2, "118d 120d 320d", 2007, 2015, "diesel"),
    ],

    "transmission-drivetrain": [
        ("MB-TD-001", "Mercedes 7G-Tronic Fluid Change Kit", "mercedes", "genuine", "A0009896803", 8500, 6200, 10, 3, "C E S Class", 2005, 2022, None),
        ("MB-TD-002", "Mercedes Clutch Kit 3-Piece W204", "mercedes", "oem", "A6462500015", 32000, 23000, 4, 2, "C220 C250", 2007, 2014, "diesel"),
        ("MB-TD-003", "Mercedes Driveshaft Front Right W204", "mercedes", "genuine", "A2043502710", 28000, 20000, 3, 1, "C200 C220 4MATIC", 2007, 2014, None),
        ("MB-TD-004", "Mercedes Transfer Case Actuator", "mercedes", "genuine", "A1644270088", 15000, 11000, 5, 2, "ML350 GL350 GLE350", 2005, 2016, None),
        ("MB-TD-005", "Mercedes Gearbox Mount W204", "mercedes", "oem", "A2042403317", 4500, 3200, 8, 3, "C180 C200 C220", 2007, 2014, None),
        ("MB-TD-006", "Mercedes Flex Disc Guibo", "mercedes", "genuine", "A2104100015", 5800, 4200, 10, 3, "E200 E220 E320", 2002, 2009, None),
        ("MB-TD-007", "Mercedes Differential Oil Seal Rear", "mercedes", "oem", "A2103590052", 1200, 900, 20, 5, "C E Class RWD", 2000, 2020, None),
        ("MB-TD-008", "Mercedes Torque Converter 7G-Tronic", "mercedes", "genuine", "A0002705400", 65000, 48000, 2, 1, "C E S Class 7G", 2005, 2018, None),
        ("MB-TD-009", "Mercedes Center Support Bearing", "mercedes", "oem", "A2104100322", 3500, 2500, 12, 4, "E Class W210 W211", 2000, 2009, None),
        ("MB-TD-010", "Mercedes Mechatronic Seal Kit 722.9", "mercedes", "aftermarket", "A0002700698", 12000, 8800, 6, 2, "C E S Class 7G-Tronic", 2005, 2018, None),
        ("BMW-TD-001", "BMW ZF 6HP Automatic Fluid Kit", "bmw", "genuine", "83222289720", 6500, 4700, 10, 3, "320i 520i X5 X3", 2006, 2018, None),
        ("BMW-TD-002", "BMW Clutch Kit N47 Diesel 3 Series", "bmw", "oem", "21207531509", 28000, 20000, 4, 2, "118d 120d 318d 320d", 2007, 2015, "diesel"),
        ("BMW-TD-003", "BMW Driveshaft Front Right E90 xDrive", "bmw", "genuine", "31607545126", 22000, 16000, 3, 1, "325xi 330xi xDrive", 2006, 2012, None),
        ("BMW-TD-004", "BMW Transfer Case F30 xDrive", "bmw", "oem", "27107645966", 45000, 33000, 2, 1, "320i xDrive 328i xDrive", 2012, 2019, None),
        ("BMW-TD-005", "BMW Gearbox Mount E90 E60", "bmw", "genuine", "22316770689", 3800, 2700, 10, 3, "318i 320i 520i", 2005, 2013, None),
        ("BMW-TD-006", "BMW Flex Disc Guibo E90 E60", "bmw", "oem", "26117526284", 4200, 3000, 8, 3, "320i 520i 523i", 2005, 2013, None),
        ("BMW-TD-007", "BMW Differential Bearing Kit Rear", "bmw", "oem", "33101214924", 8500, 6200, 6, 2, "320i 325i 520i 525i", 2000, 2013, None),
        ("BMW-TD-008", "BMW Center Support Bearing E90", "bmw", "genuine", "26127501257", 4500, 3200, 10, 3, "320i 325i 330i", 2005, 2012, None),
        ("BMW-TD-009", "BMW Mechatronics Seal Kit ZF 6HP", "bmw", "aftermarket", "24347571535", 14000, 10000, 5, 2, "All ZF 6HP Models", 2006, 2018, None),
        ("BMW-TD-010", "BMW Prop Shaft Universal Joint", "bmw", "genuine", "26111227537", 5500, 4000, 8, 3, "320i 520i X5 X3", 2000, 2015, None),
    ],

    "braking-system": [
        ("MB-BS-001", "Mercedes Front Brake Pads W204", "mercedes", "genuine", "A0044207020", 8500, 6200, 15, 5, "C200 C220 C250", 2007, 2014, None),
        ("MB-BS-002", "Mercedes Rear Brake Pads W204", "mercedes", "oem", "A0054200720", 6800, 4900, 12, 4, "C180 C200 C220", 2007, 2014, None),
        ("MB-BS-003", "Mercedes Front Brake Discs W213", "mercedes", "genuine", "A2134211012", 18500, 13500, 6, 2, "E200 E220 E250", 2016, 2022, None),
        ("MB-BS-004", "Mercedes Rear Brake Discs W213", "mercedes", "oem", "A2134230312", 14500, 10500, 6, 2, "E200 E220 E250", 2016, 2022, None),
        ("MB-BS-005", "Mercedes Brake Caliper Front Right W205", "mercedes", "genuine", "A0054207083", 22000, 16000, 3, 1, "C200 C250 C300", 2014, 2021, None),
        ("MB-BS-006", "Mercedes ABS Sensor Front Right", "mercedes", "genuine", "A2045400717", 4200, 3000, 10, 3, "C E Class W204 W212", 2007, 2016, None),
        ("MB-BS-007", "Mercedes Brake Master Cylinder W212", "mercedes", "genuine", "A2124300101", 18000, 13000, 4, 2, "E200 E250 E350", 2009, 2016, None),
        ("MB-BS-008", "Mercedes Brake Booster W204", "mercedes", "oem", "A2044300030", 25000, 18000, 3, 1, "C180 C200 C250", 2007, 2014, None),
        ("MB-BS-009", "Mercedes Handbrake Shoes W204", "mercedes", "genuine", "A2044200120", 3500, 2500, 15, 5, "C Class W204 RWD", 2007, 2014, None),
        ("MB-BS-010", "Mercedes Brake Pad Wear Sensor", "mercedes", "genuine", "A0025429418", 1800, 1300, 25, 8, "C E S Class", 2005, 2022, None),
        ("BMW-BS-001", "BMW Front Brake Pads E90 316i-330i", "bmw", "genuine", "34116775328", 9500, 7000, 15, 5, "316i 318i 320i 325i 330i", 2005, 2012, None),
        ("BMW-BS-002", "BMW Rear Brake Pads E90 318i-330i", "bmw", "oem", "34216775244", 7500, 5500, 12, 4, "318i 320i 325i 330i", 2005, 2012, None),
        ("BMW-BS-003", "BMW Front Brake Discs F30 320i 328i", "bmw", "genuine", "34106797603", 16500, 12000, 6, 2, "318i 320i 328i", 2012, 2019, None),
        ("BMW-BS-004", "BMW Rear Brake Discs F30", "bmw", "oem", "34206797605", 13500, 9800, 6, 2, "316i 318i 320i 328i", 2012, 2019, None),
        ("BMW-BS-005", "BMW Brake Caliper Front Right E90", "bmw", "genuine", "34116756537", 20000, 14500, 3, 1, "320i 325i 330i", 2005, 2012, None),
        ("BMW-BS-006", "BMW ABS Wheel Speed Sensor Front", "bmw", "genuine", "34526869320", 3800, 2700, 12, 4, "318i 320i 520i X3 X5", 2005, 2019, None),
        ("BMW-BS-007", "BMW Brake Master Cylinder E90 E60", "bmw", "genuine", "34336769750", 16000, 11500, 4, 2, "320i 325i 520i 525i", 2005, 2013, None),
        ("BMW-BS-008", "BMW Brake Booster E90 320i 325i", "bmw", "oem", "34336761353", 22000, 16000, 3, 1, "316i 318i 320i 325i", 2005, 2012, None),
        ("BMW-BS-009", "BMW Handbrake Cable Rear Left E90", "bmw", "genuine", "34406789440", 3200, 2300, 10, 3, "316i 318i 320i", 2005, 2012, None),
        ("BMW-BS-010", "BMW Brake Pad Wear Sensor Front", "bmw", "genuine", "34356789440", 1600, 1100, 30, 8, "All E90 F30 Models", 2005, 2019, None),
    ],

    "suspension-steering": [
        ("MB-SS-001", "Mercedes Front Lower Control Arm W204", "mercedes", "genuine", "A2043306811", 14200, 10300, 5, 2, "C200 C220 C250", 2007, 2014, None),
        ("MB-SS-002", "Mercedes Front Shock Absorber W212", "mercedes", "oem", "A2123206813", 18500, 13500, 4, 2, "E200 E250 E350", 2009, 2016, None),
        ("MB-SS-003", "Mercedes Rear Shock Absorber W204", "mercedes", "genuine", "A2043200130", 15000, 11000, 6, 2, "C180 C200 C250", 2007, 2014, None),
        ("MB-SS-004", "Mercedes Tie Rod End Right W204", "mercedes", "oem", "A2044600705", 4800, 3500, 10, 3, "C Class W204", 2007, 2014, None),
        ("MB-SS-005", "Mercedes Sway Bar Link Front W204", "mercedes", "genuine", "A2043200589", 3200, 2300, 12, 4, "C180 C200 C220", 2007, 2014, None),
        ("MB-SS-006", "Mercedes Wheel Bearing Front W205", "mercedes", "genuine", "A0009810216", 8500, 6200, 8, 3, "C200 C250 C300", 2014, 2021, None),
        ("MB-SS-007", "Mercedes Air Suspension Strut W164", "mercedes", "genuine", "A1643206113", 65000, 47000, 2, 1, "ML350 ML500", 2005, 2011, None),
        ("MB-SS-008", "Mercedes Power Steering Pump W204", "mercedes", "oem", "A0044664201", 18000, 13000, 4, 2, "C180 C200 C220 Hydraulic", 2007, 2012, None),
        ("MB-SS-009", "Mercedes Steering Rack W204", "mercedes", "genuine", "A2044602100", 45000, 33000, 2, 1, "C200 C220 C250", 2007, 2014, None),
        ("MB-SS-010", "Mercedes Front Strut Mount W212", "mercedes", "oem", "A2123230544", 6500, 4700, 8, 3, "E200 E250 E350", 2009, 2016, None),
        ("BMW-SS-001", "BMW Front Control Arm E90 320i 325i", "bmw", "genuine", "31126768157", 12500, 9000, 6, 2, "316i 318i 320i 325i 330i", 2005, 2012, None),
        ("BMW-SS-002", "BMW Front Shock Absorber F30 320i", "bmw", "oem", "31316796507", 16500, 12000, 4, 2, "316i 318i 320i 328i", 2012, 2019, None),
        ("BMW-SS-003", "BMW Rear Shock Absorber E90 320i", "bmw", "genuine", "33526767205", 14000, 10200, 6, 2, "316i 318i 320i 325i", 2005, 2012, None),
        ("BMW-SS-004", "BMW Tie Rod End Right E90 F30", "bmw", "oem", "32216777501", 4200, 3000, 12, 4, "All E90 F30 Models", 2005, 2019, None),
        ("BMW-SS-005", "BMW Sway Bar Link Front E90", "bmw", "genuine", "31356756590", 2800, 2000, 15, 5, "316i 318i 320i 325i", 2005, 2012, None),
        ("BMW-SS-006", "BMW Front Wheel Bearing F30 320i", "bmw", "genuine", "31206880354", 7500, 5500, 8, 3, "316i 318i 320i 328i", 2012, 2019, None),
        ("BMW-SS-007", "BMW Air Suspension Strut E70 X5", "bmw", "genuine", "37116796927", 58000, 42000, 2, 1, "X5 E70 Air Suspension", 2007, 2013, None),
        ("BMW-SS-008", "BMW Power Steering Pump E90 E60", "bmw", "oem", "32416757914", 16000, 11500, 4, 2, "320i 325i 520i 525i", 2005, 2013, "petrol"),
        ("BMW-SS-009", "BMW Steering Rack F30 Electric", "bmw", "genuine", "32106876840", 48000, 35000, 2, 1, "316i 318i 320i 328i", 2012, 2019, None),
        ("BMW-SS-010", "BMW Rear Subframe Bushings E90 Set", "bmw", "aftermarket", "33319065881", 8500, 6200, 6, 2, "316i 318i 320i 325i", 2005, 2012, None),
    ],

    "electrical-electronics": [
        ("MB-EE-001", "Mercedes AGM Battery 80Ah W205", "mercedes", "genuine", "A0009829308", 28500, 21000, 5, 2, "C E S Class Start-Stop", 2014, 2022, None),
        ("MB-EE-002", "Mercedes Alternator W204 OM651", "mercedes", "oem", "A0141542002", 38000, 28000, 3, 1, "C220 E220 GLK220 Diesel", 2008, 2016, "diesel"),
        ("MB-EE-003", "Mercedes Starter Motor W204 M271", "mercedes", "genuine", "A0061517401", 22000, 16000, 4, 2, "C180 C200 E200 Petrol", 2007, 2014, "petrol"),
        ("MB-EE-004", "Mercedes SAM Control Unit Rear W204", "mercedes", "genuine", "A2049007701", 35000, 26000, 2, 1, "C Class W204", 2007, 2014, None),
        ("MB-EE-005", "Mercedes Glow Plugs Set x4 OM651", "mercedes", "genuine", "A6519900070", 6500, 4700, 10, 3, "C220 E220 GLK220", 2008, 2016, "diesel"),
        ("MB-EE-006", "Mercedes MAF Sensor W204 M271", "mercedes", "genuine", "A6510940048", 9800, 7100, 6, 2, "C180 C200 E200", 2010, 2018, "petrol"),
        ("MB-EE-007", "Mercedes Lambda O2 Sensor W212", "mercedes", "genuine", "A0075427818", 8500, 6200, 8, 3, "E200 E250 CGI", 2009, 2016, "petrol"),
        ("MB-EE-008", "Mercedes EIS Ignition Switch W211", "mercedes", "genuine", "A2115451908", 18000, 13000, 3, 1, "E Class W211", 2002, 2009, None),
        ("MB-EE-009", "Mercedes Throttle Body W204 M271", "mercedes", "oem", "A2711410125", 12000, 8800, 5, 2, "C180 C200 E200", 2007, 2015, "petrol"),
        ("MB-EE-010", "Mercedes Window Regulator Front Right", "mercedes", "genuine", "A2047200179", 8500, 6200, 6, 2, "C Class W204", 2007, 2014, None),
        ("BMW-EE-001", "BMW AGM Battery 90Ah F30 Start-Stop", "bmw", "genuine", "61216806755", 26000, 19000, 5, 2, "F30 F10 F20 Start-Stop", 2012, 2022, None),
        ("BMW-EE-002", "BMW Alternator N47 Diesel E90 F30", "bmw", "oem", "12317797221", 35000, 26000, 3, 1, "118d 120d 318d 320d", 2007, 2019, "diesel"),
        ("BMW-EE-003", "BMW Starter Motor N47 N20 Engine", "bmw", "genuine", "12417799166", 20000, 14500, 4, 2, "118i 120i 318i 320i", 2007, 2019, None),
        ("BMW-EE-004", "BMW DME ECU N47 320d F30", "bmw", "genuine", "13618577490", 55000, 40000, 1, 1, "320d F30 N47 Engine", 2012, 2016, "diesel"),
        ("BMW-EE-005", "BMW Glow Plugs Set x4 N47 Diesel", "bmw", "genuine", "12232306550", 5500, 4000, 12, 4, "118d 120d 318d 320d", 2007, 2019, "diesel"),
        ("BMW-EE-006", "BMW MAF Sensor N52 Petrol E90", "bmw", "genuine", "13627566984", 8500, 6200, 8, 3, "320i 325i 330i", 2006, 2013, "petrol"),
        ("BMW-EE-007", "BMW Lambda O2 Sensor N43 N46", "bmw", "genuine", "11787558073", 7500, 5500, 10, 3, "116i 118i 316i 318i", 2006, 2015, "petrol"),
        ("BMW-EE-008", "BMW CAS Module E90 Key Matching", "bmw", "genuine", "61356970369", 22000, 16000, 3, 1, "E90 E60 E87 All Models", 2005, 2012, None),
        ("BMW-EE-009", "BMW Throttle Body N52 E90 E60", "bmw", "oem", "13547548074", 10500, 7600, 6, 2, "320i 325i 330i 520i", 2006, 2013, "petrol"),
        ("BMW-EE-010", "BMW Window Regulator Front Right E90", "bmw", "genuine", "51337140589", 7500, 5500, 8, 3, "316i 318i 320i 325i", 2005, 2012, None),
    ],

    "lighting-system": [
        ("MB-LS-001", "Mercedes Headlight Right Xenon W212", "mercedes", "genuine", "A2128209061", 85000, 62000, 2, 1, "E Class W212 Facelift", 2013, 2016, None),
        ("MB-LS-002", "Mercedes Headlight Left LED W205", "mercedes", "genuine", "A2059068403", 95000, 69000, 1, 1, "C Class W205 LED", 2018, 2021, None),
        ("MB-LS-003", "Mercedes Taillight Right W204 Facelift", "mercedes", "genuine", "A2049068955", 22000, 16000, 3, 1, "C Class W204 2012+", 2012, 2014, None),
        ("MB-LS-004", "Mercedes DRL Daytime Running Light W205", "mercedes", "genuine", "A2059068900", 12000, 8800, 4, 2, "C Class W205", 2014, 2018, None),
        ("MB-LS-005", "Mercedes Xenon Ballast Unit W221", "mercedes", "oem", "A0008227026", 18000, 13000, 3, 1, "S Class W221 Xenon", 2006, 2013, None),
        ("MB-LS-006", "Mercedes Fog Light Right W204", "mercedes", "genuine", "A2048201856", 8500, 6200, 5, 2, "C Class W204", 2007, 2014, None),
        ("MB-LS-007", "Mercedes Interior Dome Light LED W205", "mercedes", "genuine", "A2058203601", 3500, 2500, 10, 3, "C Class W205", 2014, 2021, None),
        ("MB-LS-008", "Mercedes Headlight Washer Motor W212", "mercedes", "oem", "A2128690021", 4500, 3200, 6, 2, "E Class W212 Xenon", 2009, 2016, None),
        ("MB-LS-009", "Mercedes Turn Signal Bulb Holder W204", "mercedes", "genuine", "A2048201039", 2200, 1600, 15, 5, "C Class W204", 2007, 2014, None),
        ("MB-LS-010", "Mercedes Number Plate Light W212", "mercedes", "genuine", "A2038200356", 1800, 1300, 20, 6, "E Class W211 W212", 2002, 2016, None),
        ("BMW-LS-001", "BMW Adaptive Xenon Headlight Right F30", "bmw", "genuine", "63117339085", 78000, 57000, 1, 1, "320i 328i F30 Xenon", 2012, 2015, None),
        ("BMW-LS-002", "BMW LED Headlight Left F30 LCI", "bmw", "genuine", "63117419947", 88000, 64000, 1, 1, "F30 LCI 316i-330i", 2015, 2019, None),
        ("BMW-LS-003", "BMW Taillight Right LED E90 LCI", "bmw", "genuine", "63216924294", 18000, 13000, 3, 1, "E90 LCI 316i-330i", 2009, 2012, None),
        ("BMW-LS-004", "BMW Angel Eye LED Ring E90 LCI", "bmw", "genuine", "63116911379", 8500, 6200, 4, 2, "316i 318i 320i 325i LCI", 2009, 2012, None),
        ("BMW-LS-005", "BMW Xenon Control Unit Ballast E60", "bmw", "oem", "63126948180", 16000, 11500, 3, 1, "520i 525i 530i Xenon", 2003, 2010, None),
        ("BMW-LS-006", "BMW Front Fog Light Right F30", "bmw", "genuine", "63177248912", 7500, 5500, 5, 2, "316i 318i 320i 328i", 2012, 2019, None),
        ("BMW-LS-007", "BMW Interior Ambient Light Kit F30", "bmw", "genuine", "63316830006", 12000, 8800, 4, 2, "F30 F31 320i 328i", 2012, 2019, None),
        ("BMW-LS-008", "BMW Headlight Washer Nozzle F10", "bmw", "genuine", "61677206387", 3500, 2500, 8, 3, "520i 523i 528i 530i", 2010, 2017, None),
        ("BMW-LS-009", "BMW Indicator Repeater Side E90", "bmw", "genuine", "63137165741", 1800, 1300, 20, 6, "E90 E87 All Models", 2005, 2012, None),
        ("BMW-LS-010", "BMW Number Plate Light E90 F30", "bmw", "genuine", "63267193293", 1500, 1100, 25, 8, "All E90 F30 Models", 2005, 2019, None),
    ],

    "body-exterior": [
        ("MB-BE-001", "Mercedes Front Bumper Cover W205", "mercedes", "genuine", "A2058851325", 45000, 33000, 2, 1, "C Class W205 2014+", 2014, 2018, None),
        ("MB-BE-002", "Mercedes Front Wing Right W204", "mercedes", "genuine", "A2048800118", 28000, 20000, 3, 1, "C Class W204", 2007, 2014, None),
        ("MB-BE-003", "Mercedes Hood Bonnet W212", "mercedes", "genuine", "A2128800057", 55000, 40000, 1, 1, "E Class W212", 2009, 2016, None),
        ("MB-BE-004", "Mercedes Door Mirror Right W204", "mercedes", "genuine", "A2048102676", 18000, 13000, 3, 1, "C Class W204 Electric", 2007, 2014, None),
        ("MB-BE-005", "Mercedes Rear Bumper W205 AMG Line", "mercedes", "genuine", "A2058851278", 38000, 28000, 2, 1, "C Class W205 AMG", 2014, 2018, None),
        ("MB-BE-006", "Mercedes Front Grille W205", "mercedes", "genuine", "A2058880023", 12000, 8800, 4, 2, "C Class W205", 2014, 2018, None),
        ("MB-BE-007", "Mercedes Door Handle Right W204", "mercedes", "genuine", "A2047600934", 4500, 3200, 8, 3, "C Class W204 Chrome", 2007, 2014, None),
        ("MB-BE-008", "Mercedes Boot Lid Trunk W212", "mercedes", "genuine", "A2127400175", 48000, 35000, 1, 1, "E Class W212 Saloon", 2009, 2016, None),
        ("MB-BE-009", "Mercedes Windscreen Wiper Arm Front", "mercedes", "genuine", "A2048201644", 3200, 2300, 10, 3, "C Class W204", 2007, 2014, None),
        ("MB-BE-010", "Mercedes Door Seal Rubber Right W204", "mercedes", "genuine", "A2047250165", 4800, 3500, 8, 3, "C Class W204", 2007, 2014, None),
        ("BMW-BE-001", "BMW Front Bumper Cover F30 M-Sport", "bmw", "genuine", "51118067956", 42000, 31000, 2, 1, "F30 M-Sport 316i-330i", 2012, 2015, None),
        ("BMW-BE-002", "BMW Front Wing Right E90", "bmw", "genuine", "41357138528", 22000, 16000, 3, 1, "E90 316i 318i 320i", 2005, 2008, None),
        ("BMW-BE-003", "BMW Hood Bonnet F30 320i 328i", "bmw", "genuine", "41007259693", 48000, 35000, 1, 1, "F30 All Models", 2012, 2019, None),
        ("BMW-BE-004", "BMW Door Mirror Right F30 Electric", "bmw", "genuine", "51167373519", 16000, 11500, 3, 1, "F30 F31 316i-330i", 2012, 2019, None),
        ("BMW-BE-005", "BMW Rear Bumper F30 M-Sport", "bmw", "genuine", "51127259672", 35000, 26000, 2, 1, "F30 M-Sport 2012+", 2012, 2019, None),
        ("BMW-BE-006", "BMW Front Kidney Grille Set F30", "bmw", "genuine", "51712297586", 8500, 6200, 5, 2, "F30 316i 318i 320i 328i", 2012, 2019, None),
        ("BMW-BE-007", "BMW Door Handle Right Chrome E90", "bmw", "genuine", "51217207552", 3800, 2700, 10, 3, "E90 316i 318i 320i", 2005, 2012, None),
        ("BMW-BE-008", "BMW Boot Lid Trunk E90 Saloon", "bmw", "genuine", "41627202479", 42000, 31000, 1, 1, "E90 Saloon All Models", 2005, 2012, None),
        ("BMW-BE-009", "BMW Wiper Arm Front Right F30", "bmw", "genuine", "61617185218", 2800, 2000, 12, 4, "F30 F31 All Models", 2012, 2019, None),
        ("BMW-BE-010", "BMW Door Seal Rubber Right E90", "bmw", "genuine", "51727207519", 4200, 3000, 8, 3, "E90 316i 318i 320i", 2005, 2012, None),
    ],

    "interior-components": [
        ("MB-IC-001", "Mercedes Leather Seat Cover Front W205", "mercedes", "genuine", "A2059100046", 85000, 62000, 1, 1, "C Class W205 AMG Line", 2014, 2021, None),
        ("MB-IC-002", "Mercedes Dashboard Airbag Cover W204", "mercedes", "genuine", "A2048601187", 8500, 6200, 4, 2, "C Class W204", 2007, 2014, None),
        ("MB-IC-003", "Mercedes Steering Wheel W205 AMG", "mercedes", "genuine", "A0004606003", 45000, 33000, 2, 1, "C E Class AMG Multifunction", 2014, 2020, None),
        ("MB-IC-004", "Mercedes Center Console Armrest W204", "mercedes", "genuine", "A2046800048", 12000, 8800, 4, 2, "C Class W204 Black", 2007, 2014, None),
        ("MB-IC-005", "Mercedes Gear Shift Knob 7G-Tronic", "mercedes", "genuine", "A2122672010", 8500, 6200, 6, 2, "C E S Class 7G Auto", 2005, 2018, None),
        ("MB-IC-006", "Mercedes Door Panel Right Rear W204", "mercedes", "genuine", "A2047308070", 18000, 13000, 3, 1, "C Class W204", 2007, 2014, None),
        ("MB-IC-007", "Mercedes Sunroof Glass Panel W212", "mercedes", "genuine", "A2126700021", 55000, 40000, 1, 1, "E Class W212 Panoramic", 2009, 2016, None),
        ("MB-IC-008", "Mercedes Climate Control Unit W204", "mercedes", "genuine", "A2049006605", 28000, 20000, 2, 1, "C Class W204 Auto AC", 2007, 2014, None),
        ("MB-IC-009", "Mercedes Floor Mats Set W205 AMG", "mercedes", "genuine", "A2056801100", 8500, 6200, 8, 3, "C Class W205 4-piece", 2014, 2021, None),
        ("MB-IC-010", "Mercedes Window Switch Front Left W204", "mercedes", "genuine", "A2049053508", 3500, 2500, 10, 3, "C Class W204", 2007, 2014, None),
        ("BMW-IC-001", "BMW Sports Seat Cover Front Left F30", "bmw", "genuine", "52107354893", 75000, 55000, 1, 1, "F30 M-Sport Leather", 2012, 2019, None),
        ("BMW-IC-002", "BMW Dashboard Trim Set F30 M-Sport", "bmw", "genuine", "51459270217", 12000, 8800, 3, 1, "F30 316i-330i Carbon", 2012, 2019, None),
        ("BMW-IC-003", "BMW M-Sport Steering Wheel F30 F10", "bmw", "genuine", "32302231538", 38000, 28000, 2, 1, "F30 F10 F20 Multifunction", 2012, 2019, None),
        ("BMW-IC-004", "BMW Center Armrest E90 Black Leather", "bmw", "genuine", "51169150126", 8500, 6200, 5, 2, "E90 316i 318i 320i 325i", 2005, 2012, None),
        ("BMW-IC-005", "BMW Gear Shift Knob E90 6-Speed Manual", "bmw", "genuine", "25117572745", 5500, 4000, 8, 3, "E90 Manual Gearbox All", 2005, 2012, None),
        ("BMW-IC-006", "BMW Door Panel Right Front E90", "bmw", "genuine", "51417207407", 14000, 10200, 3, 1, "E90 316i 318i 320i", 2005, 2012, None),
        ("BMW-IC-007", "BMW Sunroof Motor E90 F30", "bmw", "genuine", "54107203689", 18000, 13000, 3, 1, "E90 F30 Electric Sunroof", 2005, 2019, None),
        ("BMW-IC-008", "BMW iDrive Controller Knob F30 F10", "bmw", "genuine", "65829252751", 12000, 8800, 4, 2, "F30 F10 F20 iDrive", 2012, 2019, None),
        ("BMW-IC-009", "BMW All-Weather Floor Mat Set F30", "bmw", "genuine", "51472339703", 7500, 5500, 10, 3, "F30 F31 4-piece Set", 2012, 2019, None),
        ("BMW-IC-010", "BMW Window Switch Front Left E90", "bmw", "genuine", "61319217335", 2800, 2000, 12, 4, "E90 316i 318i 320i", 2005, 2012, None),
    ],

    "cooling-air-system": [
        ("MB-CA-001", "Mercedes Radiator W204 OM651 Diesel", "mercedes", "genuine", "A2045001203", 22000, 16000, 4, 2, "C220 C250 Diesel", 2008, 2014, "diesel"),
        ("MB-CA-002", "Mercedes Engine Cooling Fan W204", "mercedes", "genuine", "A2045002293", 8500, 6200, 5, 2, "C180 C200 C220", 2007, 2014, None),
        ("MB-CA-003", "Mercedes Air Filter W204 M271 Petrol", "mercedes", "genuine", "A2710940004", 4200, 3000, 15, 5, "C180 C200 E200", 2007, 2015, "petrol"),
        ("MB-CA-004", "Mercedes Cabin Pollen Filter W204", "mercedes", "genuine", "A2048300318", 2800, 2000, 20, 6, "C Class W204 All", 2007, 2014, None),
        ("MB-CA-005", "Mercedes Intercooler W204 OM651", "mercedes", "genuine", "A6510900114", 35000, 26000, 2, 1, "C220 C250 CDI", 2008, 2014, "diesel"),
        ("MB-CA-006", "Mercedes Coolant Temperature Sensor", "mercedes", "genuine", "A0005422818", 2200, 1600, 20, 6, "C E Class Various", 2005, 2022, None),
        ("MB-CA-007", "Mercedes Water Pump M271 W204", "mercedes", "genuine", "A2712000007", 12000, 8800, 6, 2, "C180 C200 E200 Petrol", 2007, 2015, "petrol"),
        ("MB-CA-008", "Mercedes Expansion Tank W204", "mercedes", "genuine", "A2045002549", 4500, 3200, 8, 3, "C Class W204", 2007, 2014, None),
        ("MB-CA-009", "Mercedes EGR Valve W204 OM651", "mercedes", "oem", "A6511400660", 18000, 13000, 4, 2, "C220 E220 GLK220", 2008, 2016, "diesel"),
        ("MB-CA-010", "Mercedes Turbocharger W204 OM651", "mercedes", "oem", "A6510902180", 85000, 62000, 1, 1, "C220 CDI 170bhp", 2008, 2014, "diesel"),
        ("BMW-CA-001", "BMW Radiator N47 Diesel F30 E90", "bmw", "genuine", "17117600027", 20000, 14500, 4, 2, "316d 318d 320d 325d", 2005, 2019, "diesel"),
        ("BMW-CA-002", "BMW Electric Cooling Fan E90 N52", "bmw", "genuine", "17427543282", 7500, 5500, 5, 2, "320i 325i 330i N52", 2006, 2013, "petrol"),
        ("BMW-CA-003", "BMW Air Filter N47 Diesel F30 E90", "bmw", "genuine", "13717797465", 3800, 2700, 18, 6, "116d 118d 120d 316d 318d 320d", 2007, 2019, "diesel"),
        ("BMW-CA-004", "BMW Cabin Pollen Filter E90 F30", "bmw", "genuine", "64319171858", 2500, 1800, 20, 6, "All E90 F30 Models", 2005, 2019, None),
        ("BMW-CA-005", "BMW Intercooler N47 118d 120d 320d", "bmw", "genuine", "17517804830", 28000, 20000, 3, 1, "118d 120d 318d 320d N47", 2007, 2015, "diesel"),
        ("BMW-CA-006", "BMW Coolant Temperature Sensor N47", "bmw", "genuine", "13621433077", 2000, 1400, 20, 6, "All N47 Diesel Models", 2007, 2019, "diesel"),
        ("BMW-CA-007", "BMW Water Pump N52 Petrol E90 F30", "bmw", "genuine", "11517586925", 14000, 10200, 5, 2, "316i 318i 320i 325i 330i", 2006, 2016, "petrol"),
        ("BMW-CA-008", "BMW Expansion Tank F30 E90", "bmw", "genuine", "17137639021", 3800, 2700, 10, 3, "All F30 E90 Models", 2005, 2019, None),
        ("BMW-CA-009", "BMW EGR Valve N47 Diesel", "bmw", "oem", "11717804878", 16000, 11500, 4, 2, "118d 120d 318d 320d N47", 2007, 2015, "diesel"),
        ("BMW-CA-010", "BMW Turbocharger N47 320d 184bhp", "bmw", "oem", "11657823199", 78000, 57000, 1, 1, "320d F30 184bhp N47", 2012, 2016, "diesel"),
    ],

    "fuel-system": [
        ("MB-FS-001", "Mercedes Fuel Pump W204 OM651", "mercedes", "genuine", "A6510900150", 18000, 13000, 4, 2, "C220 E220 GLK220 Diesel", 2008, 2016, "diesel"),
        ("MB-FS-002", "Mercedes Fuel Filter W204 Diesel", "mercedes", "genuine", "A6510920201", 4500, 3200, 10, 3, "C220 E220 Diesel", 2008, 2016, "diesel"),
        ("MB-FS-003", "Mercedes Injector OM651 2.2 CDI", "mercedes", "genuine", "A6510701387", 28000, 20000, 4, 2, "C220 E220 ML250 Diesel", 2008, 2016, "diesel"),
        ("MB-FS-004", "Mercedes High Pressure Fuel Pump M271", "mercedes", "genuine", "A2710700401", 22000, 16000, 3, 1, "C200 E200 CGI Petrol", 2010, 2018, "petrol"),
        ("MB-FS-005", "Mercedes Fuel Pressure Regulator W204", "mercedes", "genuine", "A0000786628", 5500, 4000, 8, 3, "C E Class Various", 2007, 2018, None),
        ("MB-FS-006", "Mercedes Fuel Tank Cap W204 W212", "mercedes", "genuine", "A2014700005", 2500, 1800, 15, 5, "C E Class Models", 2007, 2016, None),
        ("MB-FS-007", "Mercedes Fuel Rail Common Rail OM651", "mercedes", "genuine", "A6510701254", 35000, 26000, 2, 1, "C220 E220 CDI 2.2", 2008, 2016, "diesel"),
        ("MB-FS-008", "Mercedes AdBlue Pump W222 S Class", "mercedes", "genuine", "A0004706194", 28000, 20000, 2, 1, "S Class E Class BlueTEC", 2013, 2020, "diesel"),
        ("MB-FS-009", "Mercedes Fuel Level Sender W204", "mercedes", "genuine", "A2044702894", 6500, 4700, 6, 2, "C Class W204", 2007, 2014, None),
        ("MB-FS-010", "Mercedes Fuel Filler Neck W204", "mercedes", "genuine", "A2044700662", 4200, 3000, 5, 2, "C Class W204", 2007, 2014, None),
        ("BMW-FS-001", "BMW Fuel Pump N47 Diesel E90 F30", "bmw", "genuine", "16117373503", 16000, 11500, 5, 2, "118d 120d 318d 320d", 2007, 2019, "diesel"),
        ("BMW-FS-002", "BMW Fuel Filter N47 Diesel", "bmw", "genuine", "13327811227", 4200, 3000, 12, 4, "118d 120d 318d 320d N47", 2007, 2019, "diesel"),
        ("BMW-FS-003", "BMW Injector N47 120d 320d 520d", "bmw", "genuine", "13537808087", 25000, 18000, 4, 2, "120d 320d 520d 163bhp", 2007, 2015, "diesel"),
        ("BMW-FS-004", "BMW High Pressure Fuel Pump N20 F30", "bmw", "genuine", "13517616170", 20000, 14500, 3, 1, "320i 328i F30 N20 Engine", 2012, 2019, "petrol"),
        ("BMW-FS-005", "BMW Fuel Pressure Sensor N47", "bmw", "genuine", "13537793672", 4800, 3500, 8, 3, "All N47 Diesel Models", 2007, 2019, "diesel"),
        ("BMW-FS-006", "BMW Fuel Tank Cap E90 F30", "bmw", "genuine", "16117222391", 2200, 1600, 15, 5, "All E90 F30 Models", 2005, 2019, None),
        ("BMW-FS-007", "BMW Common Rail N47 Diesel", "bmw", "genuine", "13537808053", 32000, 23000, 2, 1, "120d 320d 520d N47", 2007, 2015, "diesel"),
        ("BMW-FS-008", "BMW AdBlue Pump F10 F30 xDrive", "bmw", "genuine", "16197209953", 24000, 17500, 2, 1, "320d F30 520d F10 EfficientDynamics", 2014, 2019, "diesel"),
        ("BMW-FS-009", "BMW Fuel Level Sender E90 F30", "bmw", "genuine", "16117198052", 5500, 4000, 8, 3, "All E90 F30 Models", 2005, 2019, None),
        ("BMW-FS-010", "BMW Fuel Filler Neck E90 F30", "bmw", "genuine", "16117217497", 3800, 2700, 5, 2, "E90 F30 All Models", 2005, 2019, None),
    ],

    "seals-gaskets": [
        ("MB-SG-001", "Mercedes Head Gasket OM651 2.2 CDI", "mercedes", "genuine", "A6510160420", 8500, 6200, 6, 2, "C220 E220 GL220 CDI", 2008, 2016, "diesel"),
        ("MB-SG-002", "Mercedes Valve Cover Gasket M271", "mercedes", "genuine", "A2710160521", 3200, 2300, 12, 4, "C180 C200 E200 Petrol", 2007, 2015, "petrol"),
        ("MB-SG-003", "Mercedes Sump Pan Gasket OM651", "mercedes", "genuine", "A6510140222", 2500, 1800, 15, 5, "C220 E220 Diesel", 2008, 2016, "diesel"),
        ("MB-SG-004", "Mercedes Crankshaft Front Oil Seal", "mercedes", "genuine", "A2710150080", 1800, 1300, 20, 6, "M271 Petrol Engine", 2007, 2015, "petrol"),
        ("MB-SG-005", "Mercedes Rear Main Oil Seal OM651", "mercedes", "genuine", "A6510150080", 2200, 1600, 15, 5, "OM651 Diesel Engine", 2008, 2016, "diesel"),
        ("MB-SG-006", "Mercedes Exhaust Manifold Gasket M271", "mercedes", "genuine", "A2710140822", 2800, 2000, 10, 3, "C180 C200 E200 Petrol", 2007, 2015, "petrol"),
        ("MB-SG-007", "Mercedes Turbo Oil Feed Gasket OM651", "mercedes", "genuine", "A6510960945", 1200, 900, 20, 6, "C220 E220 CDI Turbo", 2008, 2016, "diesel"),
        ("MB-SG-008", "Mercedes Transfer Box Gasket W164", "mercedes", "genuine", "A1642710098", 3500, 2500, 8, 3, "ML GL R Class 4MATIC", 2005, 2012, None),
        ("MB-SG-009", "Mercedes Gearbox Pan Gasket 722.9", "mercedes", "genuine", "A2212770080", 4200, 3000, 8, 3, "C E S Class 7G-Tronic", 2005, 2018, None),
        ("MB-SG-010", "Mercedes Injector Copper Washer Set", "mercedes", "genuine", "A6519970045", 800, 580, 30, 10, "All OM651 CDI Models", 2008, 2016, "diesel"),
        ("BMW-SG-001", "BMW Head Gasket N47 Diesel Engine", "bmw", "genuine", "11127807021", 7500, 5500, 6, 2, "118d 120d 318d 320d N47", 2007, 2015, "diesel"),
        ("BMW-SG-002", "BMW Valve Cover Gasket N52 Petrol", "bmw", "genuine", "11127552281", 2800, 2000, 14, 5, "316i 318i 320i 325i N52", 2006, 2013, "petrol"),
        ("BMW-SG-003", "BMW Sump Pan Gasket N47 Diesel", "bmw", "genuine", "11137808793", 2200, 1600, 15, 5, "N47 All Diesel Models", 2007, 2015, "diesel"),
        ("BMW-SG-004", "BMW Crankshaft Front Seal N52 N54", "bmw", "genuine", "11117504535", 1500, 1100, 20, 6, "N52 N54 Petrol Engines", 2006, 2016, "petrol"),
        ("BMW-SG-005", "BMW Rear Main Oil Seal N47 Diesel", "bmw", "genuine", "11117788447", 1800, 1300, 15, 5, "N47 Diesel All Models", 2007, 2015, "diesel"),
        ("BMW-SG-006", "BMW Exhaust Manifold Gasket N47", "bmw", "genuine", "11627799963", 2500, 1800, 10, 3, "N47 Diesel All Models", 2007, 2015, "diesel"),
        ("BMW-SG-007", "BMW Turbo Oil Feed Pipe Seal N47", "bmw", "genuine", "11657799405", 1000, 720, 20, 6, "N47 Diesel Turbo Models", 2007, 2015, "diesel"),
        ("BMW-SG-008", "BMW Transfer Case Output Seal xDrive", "bmw", "genuine", "27107598531", 2800, 2000, 8, 3, "xDrive All Models", 2006, 2019, None),
        ("BMW-SG-009", "BMW Gearbox Pan Gasket ZF 6HP", "bmw", "genuine", "24117557014", 3800, 2700, 8, 3, "All ZF 6HP Auto Models", 2006, 2018, None),
        ("BMW-SG-010", "BMW Injector Copper Sealing Washer", "bmw", "genuine", "13537793786", 650, 460, 30, 10, "N47 Diesel All Models", 2007, 2015, "diesel"),
    ],

    "fasteners-hardware": [
        ("MB-FH-001", "Mercedes Wheel Bolt Set x20 W204", "mercedes", "genuine", "N910105014008", 4500, 3200, 10, 3, "C Class W204 17mm", 2007, 2014, None),
        ("MB-FH-002", "Mercedes Sump Plug Drain Bolt OM651", "mercedes", "genuine", "N007603014102", 350, 250, 40, 10, "All Diesel Models", 2000, 2022, None),
        ("MB-FH-003", "Mercedes Engine Undertray Clips Set", "mercedes", "genuine", "N910105011012", 800, 580, 25, 8, "C E Class Various", 2007, 2020, None),
        ("MB-FH-004", "Mercedes Brake Caliper Bolt Set Front", "mercedes", "genuine", "N000000003671", 1200, 880, 20, 6, "C E Class W204 W212", 2007, 2016, None),
        ("MB-FH-005", "Mercedes Exhaust Heat Shield Bolts", "mercedes", "genuine", "N000000005120", 600, 430, 30, 8, "All Models Various", 2000, 2022, None),
        ("MB-FH-006", "Mercedes Bumper Retaining Clips Set", "mercedes", "genuine", "N910105016054", 900, 650, 20, 6, "C E S Class All", 2007, 2022, None),
        ("MB-FH-007", "Mercedes Gearbox Mount Bolt Kit", "mercedes", "genuine", "N000000002802", 800, 580, 15, 5, "W204 W212 Various", 2007, 2016, None),
        ("MB-FH-008", "Mercedes Cylinder Head Bolt Set M271", "mercedes", "genuine", "N910105010218", 2500, 1800, 8, 3, "M271 Petrol Engine", 2007, 2015, "petrol"),
        ("MB-FH-009", "Mercedes Door Hinge Pin Set W204", "mercedes", "genuine", "A2047200137", 1800, 1300, 12, 4, "C Class W204", 2007, 2014, None),
        ("MB-FH-010", "Mercedes Interior Trim Clip Set 50pc", "mercedes", "aftermarket", "N910105011202", 1200, 880, 15, 5, "Mercedes Universal", 2000, 2022, None),
        ("BMW-FH-001", "BMW Wheel Bolt Set x20 E90 F30 17mm", "bmw", "genuine", "36136781151", 4200, 3000, 10, 3, "All E90 F30 Models", 2005, 2019, None),
        ("BMW-FH-002", "BMW Sump Plug Drain Bolt N47 N52", "bmw", "genuine", "07119905617", 320, 230, 40, 10, "All BMW Models", 2000, 2022, None),
        ("BMW-FH-003", "BMW Engine Undertray Clips Set", "bmw", "genuine", "51717157995", 750, 540, 25, 8, "E90 F30 E60 Models", 2005, 2019, None),
        ("BMW-FH-004", "BMW Brake Caliper Bolt Set Front E90", "bmw", "genuine", "34116761444", 1100, 800, 20, 6, "E90 F30 All Models", 2005, 2019, None),
        ("BMW-FH-005", "BMW Exhaust Heat Shield Bolts M8 Set", "bmw", "genuine", "07119904299", 550, 390, 30, 8, "All BMW Models", 2000, 2022, None),
        ("BMW-FH-006", "BMW Bumper Retaining Clip Set 20pc", "bmw", "genuine", "51117074368", 850, 610, 20, 6, "E90 F30 E60 All", 2005, 2019, None),
        ("BMW-FH-007", "BMW Subframe Bolt Kit E90 Front", "bmw", "genuine", "31106769091", 1500, 1100, 10, 3, "E90 All Models", 2005, 2012, None),
        ("BMW-FH-008", "BMW Cylinder Head Bolt Set N47", "bmw", "genuine", "11127807038", 2200, 1600, 8, 3, "N47 Diesel Engine", 2007, 2015, "diesel"),
        ("BMW-FH-009", "BMW Door Check Strap Bolt E90", "bmw", "genuine", "41517200585", 650, 460, 15, 5, "E90 All Models", 2005, 2012, None),
        ("BMW-FH-010", "BMW Interior Trim Clip Set 50pc", "bmw", "aftermarket", "51711957800", 1100, 800, 15, 5, "BMW Universal", 2000, 2022, None),
    ],

    "wheels-tyres": [
        ("MB-WT-001", "Mercedes 17 inch AMG Alloy Wheel W205", "mercedes", "genuine", "A2054010300", 35000, 26000, 4, 1, "C Class W205 AMG", 2014, 2021, None),
        ("MB-WT-002", "Mercedes 18 inch Alloy Wheel W212", "mercedes", "genuine", "A2124011402", 38000, 28000, 4, 1, "E Class W212 AMG Line", 2009, 2016, None),
        ("MB-WT-003", "Mercedes Tyre Pressure Sensor TPMS", "mercedes", "genuine", "A0009050030", 4500, 3200, 8, 3, "All Mercedes Models", 2010, 2022, None),
        ("MB-WT-004", "Mercedes Centre Cap 75mm AMG", "mercedes", "genuine", "A0004000900", 1800, 1300, 20, 6, "All AMG Alloy Wheels", 2005, 2022, None),
        ("MB-WT-005", "Mercedes Locking Wheel Bolt Set W204", "mercedes", "genuine", "A0009901207", 5500, 4000, 8, 3, "C Class W204 Security", 2007, 2014, None),
        ("MB-WT-006", "Mercedes Spare Wheel W204 Compact", "mercedes", "genuine", "A2044012202", 12000, 8800, 3, 1, "C Class W204 Space Saver", 2007, 2014, None),
        ("MB-WT-007", "Mercedes Tyre Repair Kit W205 W213", "mercedes", "genuine", "A0005832202", 3500, 2500, 6, 2, "C E Class No Spare", 2014, 2022, None),
        ("MB-WT-008", "Mercedes 16 inch Steel Wheel W204", "mercedes", "genuine", "A2044010802", 8500, 6200, 4, 1, "C Class W204 Winter", 2007, 2014, None),
        ("MB-WT-009", "Mercedes Wheel Arch Liner Front W205", "mercedes", "genuine", "A2056989130", 4200, 3000, 5, 2, "C Class W205", 2014, 2021, None),
        ("MB-WT-010", "Mercedes Valve Stem Set Rubber x4", "mercedes", "aftermarket", "A0009054000", 800, 580, 25, 8, "All Models Universal", 2000, 2022, None),
        ("BMW-WT-001", "BMW 17 inch M-Sport Alloy Wheel F30", "bmw", "genuine", "36117842650", 32000, 23000, 4, 1, "F30 316i-330i M-Sport", 2012, 2019, None),
        ("BMW-WT-002", "BMW 18 inch M-Sport Alloy Wheel F10", "bmw", "genuine", "36117841375", 36000, 26000, 4, 1, "F10 520i-530i M-Sport", 2010, 2017, None),
        ("BMW-WT-003", "BMW TPMS Tyre Pressure Sensor F30", "bmw", "genuine", "36106874830", 4200, 3000, 8, 3, "All F30 F10 F20 Models", 2012, 2019, None),
        ("BMW-WT-004", "BMW Centre Cap 68mm Blue Logo", "bmw", "genuine", "36136783536", 1500, 1100, 25, 8, "All BMW Alloy Wheels", 2000, 2022, None),
        ("BMW-WT-005", "BMW Locking Wheel Bolt Set E90 F30", "bmw", "genuine", "36136776076", 5000, 3600, 8, 3, "All BMW Models Security", 2005, 2022, None),
        ("BMW-WT-006", "BMW Space Saver Spare Wheel E90", "bmw", "genuine", "36116778961", 11000, 8000, 3, 1, "E90 All Models", 2005, 2012, None),
        ("BMW-WT-007", "BMW Tyre Mobility Kit F30 F10", "bmw", "genuine", "71102219985", 3200, 2300, 6, 2, "F30 F10 No Spare Models", 2012, 2019, None),
        ("BMW-WT-008", "BMW 16 inch Steel Winter Wheel E90", "bmw", "genuine", "36116796248", 7500, 5500, 4, 1, "E90 316i 318i 320i Winter", 2005, 2012, None),
        ("BMW-WT-009", "BMW Wheel Arch Liner Front F30", "bmw", "genuine", "51717281509", 3800, 2700, 6, 2, "F30 316i 318i 320i", 2012, 2019, None),
        ("BMW-WT-010", "BMW Valve Stem Set TPMS x4 F30", "bmw", "aftermarket", "36136874830", 750, 540, 25, 8, "All Models Universal", 2000, 2022, None),
    ],

    "accessories-misc": [
        ("MB-AM-001", "Mercedes Genuine Floor Mats W205 Set", "mercedes", "genuine", "A2056800139", 8500, 6200, 8, 3, "C Class W205 All", 2014, 2021, None),
        ("MB-AM-002", "Mercedes Boot Liner Tray W205", "mercedes", "genuine", "A2056800041", 5500, 4000, 5, 2, "C Class W205 Saloon", 2014, 2021, None),
        ("MB-AM-003", "Mercedes Tow Bar Hitch W204", "mercedes", "genuine", "A2044900341", 28000, 20000, 2, 1, "C Class W204 Detachable", 2007, 2014, None),
        ("MB-AM-004", "Mercedes Car Cover Indoor W205", "mercedes", "aftermarket", "A0001110200", 12000, 8800, 4, 2, "C Class W205 Custom", 2014, 2021, None),
        ("MB-AM-005", "Mercedes USB Charging Adapter W205", "mercedes", "genuine", "A2228200135", 4500, 3200, 8, 3, "C E Class Various", 2014, 2020, None),
        ("MB-AM-006", "Mercedes Roof Rails Set W205 Estate", "mercedes", "genuine", "A2056900000", 18000, 13000, 3, 1, "C Class W205 Estate", 2014, 2021, None),
        ("MB-AM-007", "Mercedes Winter Wiper Blades Set W204", "mercedes", "aftermarket", "A2048200145", 2800, 2000, 10, 3, "C Class W204 Pair", 2007, 2014, None),
        ("MB-AM-008", "Mercedes First Aid Kit Standard", "mercedes", "genuine", "A0005830050", 2500, 1800, 10, 3, "All Models Universal", 2000, 2022, None),
        ("MB-AM-009", "Mercedes Warning Triangle Foldable", "mercedes", "genuine", "A0005830150", 1800, 1300, 12, 4, "All Models Universal", 2000, 2022, None),
        ("MB-AM-010", "Mercedes Sunshade Windscreen W205", "mercedes", "genuine", "A2056710150", 3500, 2500, 8, 3, "C Class W205", 2014, 2021, None),
        ("BMW-AM-001", "BMW Genuine All-Season Floor Mats F30", "bmw", "genuine", "51472339703", 7500, 5500, 8, 3, "F30 F31 All Models", 2012, 2019, None),
        ("BMW-AM-002", "BMW Boot Liner Tray F30 Saloon", "bmw", "genuine", "51472407933", 4800, 3500, 5, 2, "F30 Saloon All Models", 2012, 2019, None),
        ("BMW-AM-003", "BMW Tow Bar Hitch F30 Detachable", "bmw", "genuine", "71602414789", 24000, 17500, 2, 1, "F30 F31 All Models", 2012, 2019, None),
        ("BMW-AM-004", "BMW Car Cover Indoor F30 Custom", "bmw", "aftermarket", "82110399901", 10000, 7300, 4, 2, "F30 All Models Custom", 2012, 2019, None),
        ("BMW-AM-005", "BMW USB Hub 4-Port F30 F10", "bmw", "genuine", "84109295892", 3800, 2700, 8, 3, "F30 F10 F20 NBT iDrive", 2012, 2019, None),
        ("BMW-AM-006", "BMW Roof Rack Base Bars F30 Saloon", "bmw", "genuine", "82712149758", 16000, 11500, 3, 1, "F30 Saloon 316i-330i", 2012, 2019, None),
        ("BMW-AM-007", "BMW Winter Wiper Blades Set F30", "bmw", "aftermarket", "61610427668", 2500, 1800, 10, 3, "F30 F31 Pair", 2012, 2019, None),
        ("BMW-AM-008", "BMW First Aid Kit DIN Standard", "bmw", "genuine", "71606801619", 2200, 1600, 10, 3, "All BMW Models", 2000, 2022, None),
        ("BMW-AM-009", "BMW Warning Triangle Official", "bmw", "genuine", "71600393493", 1600, 1150, 12, 4, "All BMW Models", 2000, 2022, None),
        ("BMW-AM-010", "BMW Sunshade Rear Window F30", "bmw", "genuine", "51462303938", 3200, 2300, 8, 3, "F30 All Models", 2012, 2019, None),
    ],
}


def seed():
    db = SessionLocal()
    inserted = 0
    skipped  = 0
    errors   = 0

    try:
        # Build slug → category_id map
        categories = db.query(Category).all()
        cat_map = {cat.slug: cat.id for cat in categories}

        if not cat_map:
            print("❌ No categories found. Run seed_categories.py first.")
            return

        print(f"✅ Found {len(cat_map)} categories\n")

        for slug, products in PRODUCTS_BY_CATEGORY.items():
            category_id = cat_map.get(slug)
            if not category_id:
                print(f"⚠️  Category not found: {slug} — skipping")
                continue

            cat_name = next(
                (c.name for c in categories if c.slug == slug), slug
            )
            print(f"\n📦 {cat_name} ({len(products)} products)")

            for item in products:
                (sku, name, brand, ptype, oem,
                 price, cost, stock, min_stock,
                 model_type, year_min, year_max,
                 engine_type) = item

                # Skip if SKU already exists
                exists = db.query(Product).filter(
                    Product.sku == sku
                ).first()
                if exists:
                    print(f"    ⏭️  Skipped: {sku}")
                    skipped += 1
                    continue

                product = Product(
                    id          = f"prod_{uuid.uuid4().hex[:10]}",
                    sku         = sku,
                    name        = name,
                    brand       = brand,
                    category_id = category_id,
                    type        = ptype,
                    oem_number  = oem,
                    price       = price,
                    cost        = cost,
                    stock       = stock,
                    min_stock   = min_stock,
                    description = f"{name} — compatible with {model_type or 'various models'}.",
                    supplier    = "Mercedes-Benz Kenya" if brand == "mercedes" else "BMW East Africa",
                    location    = f"Shelf {chr(65 + (inserted % 8))}-{(inserted % 20) + 1:02d}",
                    model_type  = model_type if model_type != "All Models" else None,
                    year_min    = year_min,
                    year_max    = year_max,
                    engine_type = engine_type,
                    images      = [],
                )

                db.add(product)
                print(f"    ✅ {sku} — {name[:45]}")
                inserted += 1

            db.commit()

        print(f"\n{'='*55}")
        print(f"✅ Done — {inserted} inserted, {skipped} skipped, {errors} errors")
        print(f"{'='*55}\n")

    except Exception as e:
        db.rollback()
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    print("\n🚗 German Garage — Seeding Products\n" + "="*55)
    seed()