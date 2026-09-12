"""A tiny in-memory stand-in for the `supabase-py` query builder.

The app talks to Supabase exclusively through the chainable
`.table(...).select(...).eq(...)....execute()` interface, so tests don't
need a real Postgres instance — they need something that understands that
chain over plain Python dicts. This implements just the subset of the
chain the app actually calls (see the grep-verified list below); it is not
a general Postgrest client.

Supported: select/insert/update/delete, eq/neq/gt/gte/lt/lte/in_,
not_.is_(col, "null") for IS NOT NULL, order(column, desc=), limit(),
maybe_single(), and count="exact" on select.
"""

import uuid
from datetime import datetime, timezone


class FakeResponse:
    def __init__(self, data, count=None):
        self.data = data
        self.count = count


class _NotProxy:
    """Backs `.not_.is_(column, "null")`, the only `.not_` use in the app —
    an IS NOT NULL check. Real supabase-py's `.not_` returns a filter
    builder; here it just needs to hand back the parent builder so a
    second `.not_.is_(...)` in the same chain still works."""

    def __init__(self, builder: "FakeQueryBuilder") -> None:
        self._builder = builder

    def is_(self, column: str, value) -> "FakeQueryBuilder":
        is_null_check = value in (None, "null")
        self._builder._filters.append(
            lambda row, c=column: (row.get(c) is None) != is_null_check
        )
        return self._builder


class FakeQueryBuilder:
    def __init__(self, client: "FakeSupabaseClient", table_name: str) -> None:
        self._client = client
        self._table = table_name
        self._filters = []
        self._select_count = None
        self._order = None
        self._limit = None
        self._single = False
        self._op = "select"
        self._payload = None

    # -- filters --------------------------------------------------------
    def eq(self, column, value):
        self._filters.append(lambda row, c=column, v=value: row.get(c) == v)
        return self

    def neq(self, column, value):
        self._filters.append(lambda row, c=column, v=value: row.get(c) != v)
        return self

    def gt(self, column, value):
        self._filters.append(lambda row, c=column, v=value: row.get(c) is not None and row[c] > v)
        return self

    def gte(self, column, value):
        self._filters.append(lambda row, c=column, v=value: row.get(c) is not None and row[c] >= v)
        return self

    def lt(self, column, value):
        self._filters.append(lambda row, c=column, v=value: row.get(c) is not None and row[c] < v)
        return self

    def lte(self, column, value):
        self._filters.append(lambda row, c=column, v=value: row.get(c) is not None and row[c] <= v)
        return self

    def in_(self, column, values):
        values = set(values)
        self._filters.append(lambda row, c=column, v=values: row.get(c) in v)
        return self

    @property
    def not_(self) -> _NotProxy:
        return _NotProxy(self)

    # -- shaping ----------------------------------------------------------
    def order(self, column, desc: bool = False):
        self._order = (column, desc)
        return self

    def limit(self, n: int):
        self._limit = n
        return self

    def maybe_single(self):
        self._single = True
        return self

    # -- operations ---------------------------------------------------------
    def select(self, columns: str = "*", count: str | None = None):
        self._op = "select"
        self._select_count = count
        return self

    def insert(self, payload):
        self._op = "insert"
        self._payload = payload
        return self

    def update(self, payload):
        self._op = "update"
        self._payload = payload
        return self

    def delete(self):
        self._op = "delete"
        return self

    # -- execution --------------------------------------------------------
    def _matching_rows(self):
        rows = self._client.tables.get(self._table, [])
        for f in self._filters:
            rows = [r for r in rows if f(r)]
        return rows

    def execute(self) -> FakeResponse:
        if self._op == "insert":
            payload = self._payload if isinstance(self._payload, list) else [self._payload]
            table = self._client.tables.setdefault(self._table, [])
            inserted = []
            for row in payload:
                new_row = {"id": str(uuid.uuid4()), "created_at": _now(), **row}
                table.append(new_row)
                inserted.append(new_row)
            return FakeResponse(inserted)

        if self._op == "update":
            matches = self._matching_rows()
            for row in matches:
                row.update(self._payload)
            return FakeResponse(matches)

        if self._op == "delete":
            matches = self._matching_rows()
            table = self._client.tables.setdefault(self._table, [])
            self._client.tables[self._table] = [r for r in table if r not in matches]
            return FakeResponse(matches)

        rows = self._matching_rows()
        count = len(rows) if self._select_count else None
        if self._order:
            column, desc = self._order
            rows = sorted(rows, key=lambda r: r.get(column), reverse=desc)
        if self._limit is not None:
            rows = rows[: self._limit]
        if self._single:
            return FakeResponse(rows[0] if rows else None, count=count)
        return FakeResponse(rows, count=count)


class FakeSupabaseClient:
    """`tables` is a plain `{table_name: [row_dict, ...]}` store, mutated
    in place — pass in seed data and inspect it afterward directly."""

    def __init__(self, tables: dict[str, list[dict]] | None = None) -> None:
        self.tables: dict[str, list[dict]] = {k: list(v) for k, v in (tables or {}).items()}

    def table(self, name: str) -> FakeQueryBuilder:
        return FakeQueryBuilder(self, name)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()
