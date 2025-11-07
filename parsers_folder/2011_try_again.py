import json

TARGET_NEIGHBOURHOODS = [
    "Annex",
    "High Park-Swansea",
    "Casa Loma",
    "Kensington-Chinatown",
    "Moss Park",
    "Waterfront Communities-The Island",
    "South Riverdale",
    "Trinity-Bellwoods",
    "Bay Street Corridor",
]

INPUT_PATH = "data/neighbourhood-profiles-2011-140-model.json"
OUTPUT_PATH = "cleaned_data/2011_cleaned_data_i_cry.json"

def get_value(row, n):
    v = row.get(n)
    if v in (None, "", "x", ".."):
        return None
    try:
        return float(v)
    except Exception:
        return None

# Load dataset
print("📘 Loading 2011 JSON data...")
with open(INPUT_PATH, "r", encoding="utf-8") as f:
    data = json.load(f)
print(f"✅ Loaded {len(data)} rows")

profiles = []

# Reference lists
INDUSTRY_KEYS = [
    "11 Agriculture, forestry, fishing and hunting",
    "21 Mining, quarrying, and oil and gas extraction",
    "22 Utilities",
    "23 Construction",
    "31-33 Manufacturing",
    "41 Wholesale trade",
    "44-45 Retail trade",
    "48-49 Transportation and warehousing",
    "51 Information and cultural industries",
    "52 Finance and insurance",
    "53 Real estate and rental and leasing",
    "54 Professional, scientific and technical services",
    "55 Management of companies and enterprises",
    "56 Administrative and support, waste management and remediation services",
    "61 Educational services",
    "62 Health care and social assistance",
    "71 Arts, entertainment and recreation",
    "72 Accommodation and food services",
    "81 Other services (except public administration)",
    "91 Public administration",
]

AGE_KEYS = [
    "0 to 4 years", "5 to 9 years", "10 to 14 years",
    "15 to 19 years", "20 to 24 years", "25 to 29 years",
    "30 to 34 years", "35 to 39 years", "40 to 44 years",
    "45 to 49 years", "50 to 54 years", "55 to 59 years",
    "60 to 64 years", "65 to 69 years", "70 to 74 years",
    "75 to 79 years", "80 to 84 years", "85 years and over",
]

for n in TARGET_NEIGHBOURHOODS:
    profile = {
        "neighbourhood": n,
        "housing": {},
        "transportation": {},
        "labour": {},
        "demographic": {},
    }

    # -------- HOUSING --------
    tenure_total = next((r for r in data if "Housing tenure" in r.get("Topic", "") and "Total number" in r.get("Attribute", "")), None)
    owner_row = next((r for r in data if "Housing tenure" in r.get("Topic", "") and "Owner" in r.get("Attribute", "")), None)
    renter_row = next((r for r in data if "Housing tenure" in r.get("Topic", "") and "Renter" in r.get("Attribute", "")), None)
    mortgage_row = next((r for r in data if "% of owner households with a mortgage" in r.get("Attribute", "")), None)
    value_row = next((r for r in data if "Average value of dwellings" in r.get("Attribute", "")), None)
    shelter_owned_row = next((r for r in data if "Average monthly shelter costs for owned dwellings" in r.get("Attribute", "")), None)
    shelter_rented_row = next((r for r in data if "Average monthly shelter costs for rented dwellings" in r.get("Attribute", "")), None)

    total = get_value(tenure_total, n)
    owners = get_value(owner_row, n)
    renters = get_value(renter_row, n)

    profile["housing"]["%_owner"] = round(owners / total * 100, 1) if total and owners else None
    profile["housing"]["%_renter"] = round(renters / total * 100, 1) if total and renters else None
    profile["housing"]["%_owners_with_mortgage"] = get_value(mortgage_row, n) if mortgage_row else None
    profile["housing"]["average_value_of_dwelling"] = get_value(value_row, n) if value_row else None
    profile["housing"]["average_monthly_shelter_costs_owned"] = get_value(shelter_owned_row, n) if shelter_owned_row else None
    profile["housing"]["average_monthly_shelter_costs_rented"] = get_value(shelter_rented_row, n) if shelter_rented_row else None

    # -------- TRANSPORTATION --------
    commute_rows = [
        r for r in data
        if r.get("Category") == "Journey to work"
        and r.get("Topic") == "Main mode of commuting"
        and any(x in r.get("Attribute", "") for x in [
            "Car, truck or van - as a driver",
            "Car, truck or van - as a passenger",
            "Public transit",
            "Walked",
            "Bicycle",
            "Other method"
        ])
    ]
    duration_rows = [
        r for r in data
        if r.get("Category") == "Journey to work"
        and "Commuting duration" in r.get("Attribute", "")
        and any(x in r.get("Attribute", "") for x in [
            "Less than 15 minutes",
            "15 to 29 minutes",
            "30 to 44 minutes",
            "45 to 59 minutes",
            "60 minutes and over",
        ])
    ]

    top_mode = None
    if commute_rows:
        mode_val = max(
            ((r["Attribute"].strip(), get_value(r, n)) for r in commute_rows if get_value(r, n)),
            key=lambda x: x[1],
            default=(None, None)
        )[0]
        top_mode = mode_val

    top_duration = None
    if duration_rows:
        duration_val = max(
            ((r["Attribute"].strip(), get_value(r, n)) for r in duration_rows if get_value(r, n)),
            key=lambda x: x[1],
            default=(None, None)
        )[0]
        top_duration = duration_val

    profile["transportation"]["top_mode_of_transportation"] = top_mode
    profile["transportation"]["median_commuting_duration"] = top_duration

    # -------- LABOUR --------
    total_labour_row = next(
        (r for r in data if "Industry - North American Industry Classification System" in r.get("Topic", "")
         and "All industries" in r.get("Attribute", "")),
        None
    )
    total_labour = get_value(total_labour_row, n) if total_labour_row else None
    industry_rows = [r for r in data if any(x in r.get("Attribute", "") for x in INDUSTRY_KEYS)]

    top_3 = []
    if total_labour and industry_rows:
        industries = []
        for r in industry_rows:
            for k in INDUSTRY_KEYS:
                if k in r["Attribute"]:
                    val = get_value(r, n)
                    if val:
                        industries.append((k, val / total_labour * 100))
        top_3 = sorted(industries, key=lambda x: x[1], reverse=True)[:3]
    profile["labour"]["top_3_industries"] = [{k: round(v, 1)} for k, v in top_3]

    # -------- DEMOGRAPHIC --------
    total_age_row = next(
        (r for r in data if r.get("Category") == "Population" and "Total - Age" in r.get("Attribute", "")),
        None
    )
    total_age = get_value(total_age_row, n) if total_age_row else None
    age_rows = [
        r for r in data
        if r.get("Category") == "Population"
        and r.get("Topic") == "Age characteristics"
        and any(x in r.get("Attribute", "") for x in AGE_KEYS)
    ]

    top_3_ages = []
    if total_age and age_rows:
        ages = []
        for r in age_rows:
            for k in AGE_KEYS:
                if k in r["Attribute"]:
                    val = get_value(r, n)
                    if val:
                        ages.append((k, val / total_age * 100))
        top_3_ages = sorted(ages, key=lambda x: x[1], reverse=True)[:3]
    profile["demographic"]["top_3_age_groups"] = [{k: round(v, 1)} for k, v in top_3_ages]

    profiles.append(profile)

# Save
with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
    json.dump(profiles, f, indent=2, ensure_ascii=False)

print(f"sucess! written to {OUTPUT_PATH}")
