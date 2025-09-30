# Supabase MCP Server

A Model Context Protocol (MCP) server that enables AI tools to interact with Supabase databases. This server provides tools for reading, creating, updating, and deleting records in Supabase tables.

## Features

- Read rows from any Supabase table with filtering and column selection
- Create single or multiple records in tables
- Update records based on filter conditions
- Delete records based on filter conditions
- Comprehensive tool descriptions for AI model understanding
- Type-safe request/response handling with Pydantic
- Docker support for easy deployment

## Prerequisites

- Python 3.9+
- Docker and Docker Compose
- Supabase project with service role key
- FastMCP-compatible AI IDE

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/supabase-mcp.git
cd supabase-mcp
```

2. Create a `.env` file with your Supabase credentials:

```bash
cp .env.example .env
# Edit .env with your Supabase credentials:
# SUPABASE_URL=your-project-url
# SUPABASE_KEY=your-service-role-key
```

3. Build and start the container:

```bash
# Build and start in detached mode
docker-compose up --build -d

# To view logs
docker-compose logs -f

# To stop the container
docker-compose down
```

The server will be available at `http://localhost:8000`.

### Docker Management Commands

```bash
# Start the container
docker-compose up

# Start in detached mode (background)
docker-compose up -d

# Stop the container
docker-compose down

# View logs
docker-compose logs -f

# Rebuild the container
docker-compose up --build

# Check container status
docker-compose ps

# Restart the container
docker-compose restart
```

### Troubleshooting Docker Issues

1. If the container fails to start:

   ```bash
   # Check logs
   docker-compose logs -f

   # Check container status
   docker-compose ps

   # Remove and rebuild
   docker-compose down
   docker-compose up --build
   ```

2. If you get port conflicts:

   ```bash
   # Stop any existing containers using port 8000
   docker-compose down

   # Or modify the port in docker-compose.yml
   # ports:
   #   - "8000:8000"  # Change the first number to an available port
   ```

3. If environment variables aren't loading:

   ```bash
   # Verify .env file exists and has correct values
   cat .env

   # Check environment variables in container
   docker-compose exec mcp-server env
   ```

## Configuring MCP in Your AI IDE

### General Configuration Steps

1. Open your AI IDE's settings/preferences
2. Navigate to the MCP or AI settings section
3. Add a new MCP server with the following configuration:

```json
{
  "name": "Supabase MCP",
  "command": "docker-compose",
  "args": ["up"],
  "cwd": "/path/to/supabase-mcp"
}
```

### IDE-Specific Instructions

#### Cursor

1. Open Settings (⌘, or Ctrl+,)
2. Go to "AI" section
3. Under "MCP Servers", click "Add Server"
4. Use the configuration above
5. Restart Cursor to apply changes

#### VS Code with AI Extensions

1. Open Command Palette (⌘⇧P or Ctrl+Shift+P)
2. Search for "MCP" or "AI Settings"
3. Add new MCP server configuration
4. Use the configuration above
5. Reload VS Code window

#### JetBrains IDEs with AI Plugins

1. Open Settings (⌘, or Ctrl+Alt+S)
2. Navigate to "Tools" → "AI" → "MCP Servers"
3. Click "+" to add new server
4. Use the configuration above
5. Restart IDE to apply changes

### Verifying MCP Connection

1. Check your IDE's status bar for MCP server status
2. Look for a green indicator or "MCP Connected" message
3. Try using AI features that require database access
4. Check Docker logs for any connection issues:
   ```bash
   docker-compose logs -f
   ```

## Usage

1. Start the MCP server:

```bash
docker-compose up
```

2. Configure your AI tool to use the MCP server:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "docker-compose",
      "args": ["up"]
    }
  }
}
```

## Available Tools

### read_rows

Read rows from a Supabase table with optional filtering and column selection.

Example usage:

```json
{
  "table_name": "users",
  "columns": ["id", "name"],
  "filters": { "age": { "gt": 18 } },
  "limit": 10
}
```

### create_records

Create one or more records in a Supabase table.

Example usage:

```json
{
  "table_name": "users",
  "records": [
    { "name": "John", "age": 30 },
    { "name": "Jane", "age": 25 }
  ]
}
```

### update_records

Update records in a Supabase table based on filter conditions.

Example usage:

```json
{
  "table_name": "users",
  "filters": { "status": "inactive" },
  "updates": { "status": "active" }
}
```

### delete_records

Delete records from a Supabase table based on filter conditions.

Example usage:

```json
{
  "table_name": "users",
  "filters": { "id": 1 }
}
```

## Security Considerations

- Always use the service role key in a secure environment
- Never expose the service role key in client-side code
- Use appropriate row-level security policies in Supabase
- Consider implementing rate limiting for production use

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT
