"""Vector store for RAG.

Uses ChromaDB when available (CHROMADB_HOST or CHROMADB_PATH set); otherwise a
deterministic hashing-based in-memory store keeps AI features working offline.
Production can switch to Pinecone via the same add/query interface.
"""
import hashlib
import math
import re

from app.core.config import settings

_token_re = re.compile(r"[a-z0-9']+")


def _tokens(text: str) -> list[str]:
    return _token_re.findall(text.lower())


def hash_embedding(text: str, dim: int | None = None) -> list[float]:
    """Deterministic bag-of-hashed-ngrams embedding (dev fallback)."""
    dim = dim or settings.EMBEDDING_DIMENSION
    vec = [0.0] * dim
    tokens = _tokens(text)
    for i, token in enumerate(tokens):
        for n in (1, 2):
            if i + n > len(tokens):
                continue
            gram = " ".join(tokens[i : i + n])
            digest = hashlib.sha256(gram.encode()).digest()
            idx = int.from_bytes(digest[:4], "big") % dim
            sign = 1.0 if digest[4] % 2 == 0 else -1.0
            vec[idx] += sign
    norm = math.sqrt(sum(v * v for v in vec)) or 1.0
    return [v / norm for v in vec]


def cosine(a: list[float], b: list[float]) -> float:
    if not a or not b:
        return 0.0
    return sum(x * y for x, y in zip(a, b)) / (
        math.sqrt(sum(x * x for x in a)) * math.sqrt(sum(y * y for y in b)) or 1.0
    )


class _LocalStore:
    """In-memory deterministic store with chroma-like interface."""

    def __init__(self) -> None:
        self._docs: list[dict] = []

    def upsert(self, ids: list[str], documents: list[str], metadatas: list[dict]) -> None:
        existing = {d["id"]: d for d in self._docs}
        for doc_id, doc, meta in zip(ids, documents, metadatas):
            existing[doc_id] = {"id": doc_id, "text": doc, "metadata": meta, "embedding": hash_embedding(doc)}
        self._docs = list(existing.values())

    def query(self, query_text: str, n_results: int = 3, where: dict | None = None) -> list[tuple[str, float, dict]]:
        q = hash_embedding(query_text)
        results = []
        for doc in self._docs:
            if where and not all(doc["metadata"].get(k) == v for k, v in where.items()):
                continue
            results.append((doc["id"], cosine(q, doc["embedding"]), doc["metadata"]))
        results.sort(key=lambda r: r[1], reverse=True)
        return results[:n_results]


_chroma_client = None
_store: _LocalStore | None = None


def _get_store() -> _LocalStore:
    global _store
    if _store is None:
        _store = _LocalStore()
    return _store


def upsert_documents(ids: list[str], documents: list[str], metadatas: list[dict]) -> None:
    if settings.CHROMADB_HOST or settings.CHROMADB_PATH:
        _chromadb_upsert(ids, documents, metadatas)
        return
    _get_store().upsert(ids, documents, metadatas)


def query_documents(query_text: str, n_results: int = 3, where: dict | None = None) -> list[dict]:
    if settings.CHROMADB_HOST or settings.CHROMADB_PATH:
        return _chromadb_query(query_text, n_results, where)
    return [
        {"id": doc_id, "distance": 1.0 - score, "metadata": meta}
        for doc_id, score, meta in _get_store().query(query_text, n_results, where)
    ]


def _chromadb_collection():
    import chromadb  # type: ignore

    global _chroma_client
    if _chroma_client is None:
        if settings.CHROMADB_HOST:
            _chroma_client = chromadb.HttpClient(host=settings.CHROMADB_HOST, port=settings.CHROMADB_PORT)
        else:
            _chroma_client = chromadb.PersistentClient(path=settings.CHROMADB_PATH or "chroma_data")
    name = f"{settings.CHROMADB_COLLECTION_PREFIX}-rag"
    return _chroma_client.get_or_create_collection(name)


def _chromadb_upsert(ids: list[str], documents: list[str], metadatas: list[dict]) -> None:
    try:
        collection = _chromadb_collection()
        collection.upsert(ids=ids, documents=documents, metadatas=metadatas)
    except Exception:  # chromadb optional/absent
        _get_store().upsert(ids, documents, metadatas)


def _chromadb_query(query_text: str, n_results: int, where: dict | None) -> list[dict]:
    try:
        collection = _chromadb_collection()
        kwargs = {"n_results": n_results}
        if where:
            kwargs["where"] = where
        result = collection.query(query_texts=[query_text], **kwargs)
        docs = result.get("metadatas") or [[]]
        metas = docs[0] if docs else []
        ids = result.get("ids") or [[]]
        ids = ids[0] if ids else []
        return [
            {"id": doc_id, "distance": 0.0, "metadata": meta}
            for doc_id, meta in zip(ids, metas)
        ]
    except Exception:
        return _get_store().query(query_text, n_results, where)
