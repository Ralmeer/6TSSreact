while ($true) {
    Write-Host "Starting server.cjs at $(Get-Date)"
    node server.cjs | Out-File -FilePath server_output.log -Append
    Write-Host "Server.cjs exited at $(Get-Date). Restarting in 5 seconds..."
    Start-Sleep -Seconds 5
}