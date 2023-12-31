from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List

from backend.request_types import ChatRequest
from backend.grant_chat import chat_with_grant
from backend.pull_full_grants_data import get_full_grants_data
from backend.search_text import search_embeddings

app = FastAPI()

origins = [
    "http://localhost:3000",
    "https://grantcompass-ui-f7e74ec26071.herokuapp.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    # Load data into cache & download if necessary
    get_full_grants_data()


@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.get("/opportunities/")
async def get_items(id: List[str] = Query(None)):
    grant_embeddings = get_full_grants_data()

    return {
        "items": [
            {k: v for k, v in embedding.items() if k != "embedding"}
            for embedding in grant_embeddings if embedding["OpportunityID"] in id
        ]
    }

@app.get("/search/")
async def search_items(search_text: str):
    grant_embeddings = get_full_grants_data()

    top_indices = search_embeddings(
        search_text, [g["embedding"] for g in grant_embeddings], top_n=10
    )
    print(top_indices)
    return {
        "Top matches": [
            {k: v for k, v in grant_embeddings[i].items() if k != "embedding"}
            for i in top_indices
        ]
    }


@app.post("/chat/")
async def chat_with_grants(chatRequest: ChatRequest):
    res = " " if len(chatRequest.messages) == 0 else chatRequest.messages[-1]
    res = chat_with_grant(chatRequest.opportunity_id, chatRequest.messages)
    return {"opportunity_id": chatRequest.opportunity_id, "content": res}
