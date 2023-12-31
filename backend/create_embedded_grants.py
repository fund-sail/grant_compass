import os
from datetime import date
import argparse
from typing import List

import xmltodict
import orjson
from backend.embed import get_embedding


def convert_date(date_str: str):
    return f"{date_str[-4:]}-{date_str[:2]}-{date_str[2:4]}"


def get_current_grants() -> List[dict]:
    grants_data = xmltodict.parse(open("./data/GrantsDBExtract20231102v2.xml").read())

    today = date.today()

    return sorted(
        [
            x
            for x in grants_data["Grants"]["OpportunitySynopsisDetail_1_0"]
            if "CloseDate" in x
            and convert_date(x["CloseDate"])
            >= f"{today.year}-{today.month:02}-{today.day:02}"
        ],
        key=lambda x: x["CloseDate"],
        reverse=True,
    )


def create_grant_test_data(n_grants: int = 50):
    print("Reading in raw data...")
    current_grants = get_current_grants()

    print("Beginning to create embeddings...")
    if n_grants == -1:
        n_grants = len(current_grants)
    fname = f"./data/test_grants_n={n_grants}.json"
    small_batch = current_grants[:n_grants]
    print(f"Embedding {len(small_batch)} documents")
    embeddings = get_embedding(
        [x["Description"] for x in small_batch if "Description" in x]
    )

    for i, item in enumerate(small_batch):
        item["embedding"] = embeddings[i]

    os.makedirs("./data", exist_ok=True)
    with open(fname, "wb") as f:
        f.write(orjson.dumps(small_batch))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Embed N currently open grants from hard-coded xml file (-1 for all grants)"
    )
    parser.add_argument(
        "--num_grants",
        type=int,
        default=50,
        help="The number of grants to create",
    )

    args = parser.parse_args()

    create_grant_test_data(args.num_grants)
