import pytest
from unittest.mock import Mock, patch
from fastapi import HTTPException
from src.server.supabase_mcp import (
    read_rows,
    create_records,
    update_records,
    delete_records,
    check_rate_limit,
    RATE_LIMIT_WINDOW,
    MAX_REQUESTS_PER_WINDOW,
    request_counts
)
import time

@pytest.fixture(autouse=True)
def reset_rate_limit():
    """Reset rate limit state before each test."""
    request_counts.clear()
    yield

@pytest.mark.asyncio
async def test_read_rows(mock_supabase, read_rows_request):
    """Test the read_rows tool."""
    # Setup mock response
    mock_supabase.table.return_value.select.return_value.match.return_value.limit.return_value.execute.return_value.data = [
        {"id": 1, "name": "John"},
        {"id": 2, "name": "Jane"}
    ]
    
    # Call the tool
    result = await read_rows(read_rows_request)
    
    # Verify the result
    assert len(result) == 2
    assert result[0]["id"] == 1
    assert result[0]["name"] == "John"
    
    # Verify the mock was called correctly
    mock_supabase.table.assert_called_once_with("users")
    mock_supabase.table.return_value.select.assert_called_once_with("id,name")
    mock_supabase.table.return_value.select.return_value.match.assert_called_once_with({"age": {"gt": 18}})
    mock_supabase.table.return_value.select.return_value.match.return_value.limit.assert_called_once_with(10)

@pytest.mark.asyncio
async def test_create_records(mock_supabase, create_records_request):
    """Test the create_records tool."""
    # Setup mock response
    mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [
        {"id": 1, "name": "John", "age": 30},
        {"id": 2, "name": "Jane", "age": 25}
    ]
    
    # Call the tool
    result = await create_records(create_records_request)
    
    # Verify the result
    assert len(result) == 2
    assert result[0]["name"] == "John"
    assert result[1]["name"] == "Jane"
    
    # Verify the mock was called correctly
    mock_supabase.table.assert_called_once_with("users")
    mock_supabase.table.return_value.insert.assert_called_once_with([
        {"name": "John", "age": 30},
        {"name": "Jane", "age": 25}
    ])

@pytest.mark.asyncio
async def test_update_records(mock_supabase, update_records_request):
    """Test the update_records tool."""
    # Setup mock response
    mock_supabase.table.return_value.update.return_value.match.return_value.execute.return_value.data = [
        {"id": 1, "status": "active"},
        {"id": 2, "status": "active"}
    ]
    
    # Call the tool
    result = await update_records(update_records_request)
    
    # Verify the result
    assert len(result) == 2
    assert all(record["status"] == "active" for record in result)
    
    # Verify the mock was called correctly
    mock_supabase.table.assert_called_once_with("users")
    mock_supabase.table.return_value.update.assert_called_once_with({"status": "active"})
    mock_supabase.table.return_value.update.return_value.match.assert_called_once_with({"status": "inactive"})

@pytest.mark.asyncio
async def test_delete_records(mock_supabase, delete_records_request):
    """Test the delete_records tool."""
    # Setup mock response
    mock_supabase.table.return_value.delete.return_value.match.return_value.execute.return_value.data = []
    
    # Call the tool
    result = await delete_records(delete_records_request)
    
    # Verify the result
    assert result == []
    
    # Verify the mock was called correctly
    mock_supabase.table.assert_called_once_with("users")
    mock_supabase.table.return_value.delete.assert_called_once()
    mock_supabase.table.return_value.delete.return_value.match.assert_called_once_with({"id": 1})

@pytest.mark.asyncio
async def test_error_handling(mock_supabase, read_rows_request):
    """Test error handling in the read_rows tool."""
    # Setup mock to raise an exception
    mock_supabase.table.return_value.select.side_effect = Exception("Database error")
    
    # Call the tool and verify it raises the exception
    with pytest.raises(Exception) as exc_info:
        await read_rows(read_rows_request)
    
    assert str(exc_info.value) == "Database error"

@pytest.mark.asyncio
async def test_rate_limiting():
    """Test the rate limiting functionality."""
    # Test that we can make requests up to the limit
    for _ in range(MAX_REQUESTS_PER_WINDOW):
        check_rate_limit()
    
    # Test that we get rate limited after exceeding the limit
    with pytest.raises(HTTPException) as exc_info:
        check_rate_limit()
    
    assert exc_info.value.status_code == 429
    assert "Too many requests" in str(exc_info.value.detail)

@pytest.mark.asyncio
async def test_rate_limit_window_expiry():
    """Test that the rate limit window expires correctly."""
    # Make requests up to the limit
    for _ in range(MAX_REQUESTS_PER_WINDOW):
        check_rate_limit()
    
    # Wait for the window to expire
    time.sleep(RATE_LIMIT_WINDOW + 1)
    
    # Should be able to make requests again
    check_rate_limit() 