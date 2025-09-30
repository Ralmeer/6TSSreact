import pytest
from unittest.mock import Mock, patch
from supabase import Client
from src.server.supabase_mcp import (
    ReadRowsRequest,
    CreateRecordRequest,
    UpdateRecordRequest,
    DeleteRecordRequest,
)

@pytest.fixture
def mock_supabase():
    """Create a mock Supabase client for testing."""
    with patch("supabase.create_client") as mock_create:
        mock_client = Mock(spec=Client)
        mock_create.return_value = mock_client
        yield mock_client

@pytest.fixture
def read_rows_request():
    """Create a sample read rows request."""
    return ReadRowsRequest(
        table_name="users",
        columns=["id", "name"],
        filters={"age": {"gt": 18}},
        limit=10
    )

@pytest.fixture
def create_records_request():
    """Create a sample create records request."""
    return CreateRecordRequest(
        table_name="users",
        records=[
            {"name": "John", "age": 30},
            {"name": "Jane", "age": 25}
        ]
    )

@pytest.fixture
def update_records_request():
    """Create a sample update records request."""
    return UpdateRecordRequest(
        table_name="users",
        filters={"status": "inactive"},
        updates={"status": "active"}
    )

@pytest.fixture
def delete_records_request():
    """Create a sample delete records request."""
    return DeleteRecordRequest(
        table_name="users",
        filters={"id": 1}
    ) 