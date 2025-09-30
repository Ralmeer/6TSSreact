from typing import List, Optional, Dict, Any
from fastmcp import FastMCP, Tool, Resource
from supabase import create_client, Client
import os
from pydantic import BaseModel, Field
from fastapi import HTTPException
import time
from collections import defaultdict
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment variables
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY environment variables must be set")

# Rate limiting configuration
RATE_LIMIT_WINDOW = 60  # 1 minute window
MAX_REQUESTS_PER_WINDOW = 100  # Maximum requests per window
request_counts = defaultdict(list)

def check_rate_limit():
    """Check if the current request should be rate limited."""
    current_time = time.time()
    client_id = "default"  # In a real implementation, this would be based on client identification
    
    # Clean up old requests
    request_counts[client_id] = [
        t for t in request_counts[client_id]
        if current_time - t < RATE_LIMIT_WINDOW
    ]
    
    # Check if we're over the limit
    if len(request_counts[client_id]) >= MAX_REQUESTS_PER_WINDOW:
        logger.warning(f"Rate limit exceeded for client {client_id}")
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Please try again later."
        )
    
    # Add the current request
    request_counts[client_id].append(current_time)

# Initialize Supabase client with error handling
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    logger.info("Successfully initialized Supabase client")
except Exception as e:
    logger.error(f"Failed to initialize Supabase client: {str(e)}")
    raise

# Pydantic models for request/response validation
class ReadRowsRequest(BaseModel):
    table_name: str = Field(..., description="Name of the table to read from")
    columns: Optional[List[str]] = Field(None, description="List of columns to select")
    filters: Optional[Dict[str, Any]] = Field(None, description="Filter conditions")
    limit: Optional[int] = Field(None, description="Maximum number of rows to return")

class CreateRecordRequest(BaseModel):
    table_name: str = Field(..., description="Name of the table to insert into")
    records: List[Dict[str, Any]] = Field(..., description="List of records to insert")

class UpdateRecordRequest(BaseModel):
    table_name: str = Field(..., description="Name of the table to update")
    filters: Dict[str, Any] = Field(..., description="Filter conditions to identify records to update")
    updates: Dict[str, Any] = Field(..., description="Fields to update and their new values")

class DeleteRecordRequest(BaseModel):
    table_name: str = Field(..., description="Name of the table to delete from")
    filters: Dict[str, Any] = Field(..., description="Filter conditions to identify records to delete")

# Create FastMCP instance
mcp = FastMCP()

@mcp.tool(
    name="read_rows",
    description="Read rows from a Supabase table with optional filtering and column selection",
    parameters=ReadRowsRequest
)
async def read_rows(request: ReadRowsRequest) -> List[Dict[str, Any]]:
    """
    Read rows from a Supabase table.
    
    This tool allows reading data from any table in your Supabase database with optional filtering
    and column selection. It's useful for retrieving specific records or viewing table contents.
    
    Example usage:
    - Get all users: {"table_name": "users"}
    - Get specific columns: {"table_name": "users", "columns": ["id", "name"]}
    - Filter results: {"table_name": "users", "filters": {"age": {"gt": 18}}}
    """
    try:
        check_rate_limit()
        query = supabase.table(request.table_name).select(
            ",".join(request.columns) if request.columns else "*"
        )
        
        if request.filters:
            query = query.match(request.filters)
        
        if request.limit:
            query = query.limit(request.limit)
        
        result = query.execute()
        return result.data
    except Exception as e:
        logger.error(f"Error in read_rows: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@mcp.tool(
    name="create_records",
    description="Create one or more records in a Supabase table",
    parameters=CreateRecordRequest
)
async def create_records(request: CreateRecordRequest) -> List[Dict[str, Any]]:
    """
    Create records in a Supabase table.
    
    This tool allows inserting one or more records into a table. It's useful for adding new data
    to your database in bulk or individually.
    
    Example usage:
    - Create a single user: {"table_name": "users", "records": [{"name": "John", "age": 30}]}
    - Create multiple users: {"table_name": "users", "records": [{"name": "John"}, {"name": "Jane"}]}
    """
    try:
        check_rate_limit()
        result = supabase.table(request.table_name).insert(request.records).execute()
        return result.data
    except Exception as e:
        logger.error(f"Error in create_records: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@mcp.tool(
    name="update_records",
    description="Update records in a Supabase table based on filter conditions",
    parameters=UpdateRecordRequest
)
async def update_records(request: UpdateRecordRequest) -> List[Dict[str, Any]]:
    """
    Update records in a Supabase table.
    
    This tool allows updating existing records that match specific filter conditions. It's useful
    for modifying multiple records at once or updating specific fields.
    
    Example usage:
    - Update user age: {"table_name": "users", "filters": {"id": 1}, "updates": {"age": 31}}
    - Update multiple users: {"table_name": "users", "filters": {"status": "inactive"}, "updates": {"status": "active"}}
    """
    try:
        check_rate_limit()
        result = supabase.table(request.table_name).update(request.updates).match(request.filters).execute()
        return result.data
    except Exception as e:
        logger.error(f"Error in update_records: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@mcp.tool(
    name="delete_records",
    description="Delete records from a Supabase table based on filter conditions",
    parameters=DeleteRecordRequest
)
async def delete_records(request: DeleteRecordRequest) -> List[Dict[str, Any]]:
    """
    Delete records from a Supabase table.
    
    This tool allows deleting records that match specific filter conditions. It's useful for
    removing specific records or cleaning up data.
    
    Example usage:
    - Delete a user: {"table_name": "users", "filters": {"id": 1}}
    - Delete inactive users: {"table_name": "users", "filters": {"status": "inactive"}}
    """
    try:
        check_rate_limit()
        result = supabase.table(request.table_name).delete().match(request.filters).execute()
        return result.data
    except Exception as e:
        logger.error(f"Error in delete_records: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    try:
        mcp.run_stdio()
    except Exception as e:
        logger.error(f"Error running MCP server: {str(e)}")
        raise 