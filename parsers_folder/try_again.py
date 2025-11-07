import json
from pathlib import Path


INPUT_PATH = "target_data/csv_to_json.json"
OUTPUT_PATH = "target_data/2021_cleaned_data_i_cry.json"

TARGET_NEIGHBOURHOODS = [
    "Annex",
    "High Park-Swansea",
    "Casa Loma",
    "Kensington-Chinatown",
    "Moss Park",
    "Harbourfront-CityPlace",
    "South Riverdale",
    "Trinity-Bellwoods",
    "Yonge-Bay Corridor"
]

# keys to match (attributes)
INDUSTRY_KEYWORDS = [
    "11 Agriculture", "21 Mining", "22 Utilities", "23 Construction", "31-33 Manufacturing",
    "41 Wholesale trade", "44-45 Retail trade", "48-49 Transportation and warehousing",
    "51 Information and cultural industries", "52 Finance and insurance",
    "53 Real estate and rental and leasing", "54 Professional, scientific and technical services",
    "55 Management of companies and enterprises", "56 Administrative and support, waste management and remediation services",
    "61 Educational services", "62 Health care and social assistance", "71 Arts, entertainment and recreation",
    "72 Accommodation and food services", "81 Other services", "91 Public administration"
]

AGE_KEYWORDS = [
    "0 to 4 years", "5 to 9 years", "10 to 14 years",
    "15 to 19 years", "20 to 24 years", "25 to 29 years", "30 to 34 years",
    "35 to 39 years", "40 to 44 years", "45 to 49 years", "50 to 54 years",
    "55 to 59 years", "60 to 64 years", "65 to 69 years", "70 to 74 years",
    "75 to 79 years", "80 to 84 years", "85 to 89 years", "90 to 94 years",
    "95 to 99 years", "100 years and over",
]

COMMUTE_MODE_KEYWORDS = [
    "Car, truck or van - as a driver",
    "Car, truck or van - as a passenger",
    "Car, truck or van",
    "Public transit",
    "Walked",
    "Bicycle",
    "Other method"
]

COMMUTE_DURATION_KEYWORDS = [
    "Less than 15 minutes",
    "15 to 29 minutes",
    "30 to 44 minutes",
    "45 to 59 minutes",
    "60 minutes and over"
]

# helpers
def to_float(val):
    if val is None:
        return None
    try:
        return float(str(val).replace(",", "").strip())
    except Exception:
        return None


def contains_any(clean_key, keyword_list):
    ck = clean_key.lower()
    return any(k.lower() in ck for k in keyword_list)


# find key
def find_top_mode_of_transportation(attributes):
    # find any keys that match our commute keywords
    modes = {}
    for key, val in attributes.items():
        clean = key.strip()
        if contains_any(clean, COMMUTE_MODE_KEYWORDS):
            v = to_float(val)
            if v is not None:
                # normalize mode label: prefer the exact keyword matched (but keep original key for clarity)
                modes[clean] = v
    if not modes:
        return None
    # return label of highest value
    return max(modes.items(), key=lambda x: x[1])[0]


def find_median_commuting_duration(attributes):
    ranges = {}
    for key, val in attributes.items():
        clean = key.strip()
        if contains_any(clean, COMMUTE_DURATION_KEYWORDS):
            v = to_float(val)
            if v is not None:
                ranges[clean] = v
    if not ranges:
        return None
    return max(ranges.items(), key=lambda x: x[1])[0]


def find_top_industries(attributes):
    all_industries_val = None
    for k in attributes.keys():
        if "all industries" in k.lower():
            all_industries_val = to_float(attributes[k])
            break
    if not all_industries_val:
        return []

    industries = {}
    for key, val in attributes.items():
        clean = key.strip()
        # only consider keys that contain one of the explicit industry keywords
        if contains_any(clean, INDUSTRY_KEYWORDS):
            v = to_float(val)
            if v is None:
                continue
            # compute percentage of All industries
            pct = (v / all_industries_val) * 100
            industries[clean] = pct

    # sort and return top 3 as jsonaray
    top3 = sorted(industries.items(), key=lambda x: x[1], reverse=True)[:3]
    return [{k: round(v, 1)} for k, v in top3]


def find_top_age_groups(attributes):
    # denominator: total population
    total_pop_val = None
    for k in attributes.keys():
        if "total - age groups of the population" in k.lower():
            total_pop_val = to_float(attributes[k])
            break
    if not total_pop_val:
        return []

    ages = {}
    for key, val in attributes.items():
        clean = key.strip()
        if contains_any(clean, AGE_KEYWORDS):
            v = to_float(val)
            if v is None:
                continue
            pct = (v / total_pop_val) * 100
            ages[clean] = pct

    top3 = sorted(ages.items(), key=lambda x: x[1], reverse=True)[:3]
    return [{k: round(v, 1)} for k, v in top3]


# build
print("📘 Loading JSON data...")
with open(INPUT_PATH, "r") as f:
    data = json.load(f)
print(f"✅ Loaded {len(data)} neighbourhoods.")

results = []

for nbhd in TARGET_NEIGHBOURHOODS:
    if nbhd not in data:
        print(f"⚠️ Warning: Neighbourhood '{nbhd}' not found in source.")
        continue

    attrs = data[nbhd]

    # Housing: compute owner/renter % from totals
    total_households = to_float(attrs.get("Total - Private households by tenure - 25% sample data"))
    owner_count = to_float(attrs.get("  Owner")) or to_float(attrs.get("Owner"))
    renter_count = to_float(attrs.get("  Renter")) or to_float(attrs.get("Renter"))

    pct_owner = (owner_count / total_households * 100) if total_households and owner_count is not None else None
    pct_renter = (renter_count / total_households * 100) if total_households and renter_count is not None else None

    pct_owners_with_mortgage = to_float(attrs.get("  % of owner households with a mortgage")) \
        or to_float(attrs.get("% of owner households with a mortgage"))

    avg_value_dwelling = to_float(attrs.get("  Average value of dwellings ($)")) or to_float(attrs.get("Average value of dwellings ($)"))
    avg_shelter_owned = to_float(attrs.get("  Average monthly shelter costs for owned dwellings ($)")) or to_float(attrs.get("Average monthly shelter costs for owned dwellings ($)"))
    avg_shelter_rented = to_float(attrs.get("  Average monthly shelter costs for rented dwellings ($)")) or to_float(attrs.get("Average monthly shelter costs for rented dwellings ($)"))

    housing = {
        "%_owner": round(pct_owner, 1) if pct_owner is not None else None,
        "%_renter": round(pct_renter, 1) if pct_renter is not None else None,
        "%_owners_with_mortgage": round(pct_owners_with_mortgage, 1) if pct_owners_with_mortgage is not None else None,
        "average_value_of_dwelling": avg_value_dwelling,
        "average_monthly_shelter_costs_owned": avg_shelter_owned,
        "average_monthly_shelter_costs_rented": avg_shelter_rented
    }

    # Transportation
    top_mode = find_top_mode_of_transportation(attrs)
    median_commute_range = find_median_commuting_duration(attrs)
    transportation = {
        "top_mode_of_transportation": top_mode,
        "median_commuting_duration": median_commute_range
    }

    # Labour
    labour = {"top_3_industries": find_top_industries(attrs)}

    # Demographic
    demographic = {"top_3_age_groups": find_top_age_groups(attrs)}

    results.append({
        "neighbourhood": nbhd,
        "housing": housing,
        "transportation": transportation,
        "labour": labour,
        "demographic": demographic
    })

# Save
Path("target_data").mkdir(exist_ok=True)
with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2, ensure_ascii=False)

print(f"\n✅ JSON successfully created: {OUTPUT_PATH}")
print(f"📊 Extracted {len(results)} neighbourhoods.")
