$port = 8000
$root = Join-Path $PSScriptRoot "docs"

while ($true) {
    $listener = New-Object System.Net.HttpListener
    try {
        $listener.Prefixes.Clear()
        $listener.Prefixes.Add("http://localhost:$port/")
        $listener.Start()
        Write-Host "Server started at http://localhost:$port/"
        break
    } catch {
        Write-Warning "Port $port failed: $_"
        $port++
        if ($port -gt 8100) {
            Write-Error "Could not find a free port between 8000 and 8100."
            exit 1
        }
    }
}

$mimeTypes = @{
    ".html" = "text/html"
    ".js"   = "application/javascript"
    ".css"  = "text/css"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".gif"  = "image/gif"
    ".svg"  = "image/svg+xml"
    ".json" = "application/json"
    ".ico"  = "image/x-icon"
}

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
    } catch {
        if (-not $listener.IsListening) { break }
        Write-Warning "Listener error: $($_.Exception.Message)"
        continue
    }

    $request = $context.Request
    $response = $context.Response

    try {
        $localPath = $request.Url.LocalPath.TrimStart('/').Replace('/', '\')
        $path = Join-Path $root $localPath
        
        if ($request.Url.LocalPath.EndsWith("/")) {
            $path = Join-Path $path "index.html"
        }
        
        Write-Host "Request: $($request.Url.LocalPath) -> $path"

        if (Test-Path $path -PathType Leaf) {
            $extension = [System.IO.Path]::GetExtension($path)
            if ($mimeTypes.ContainsKey($extension)) {
                $response.ContentType = $mimeTypes[$extension]
            } else {
                $response.ContentType = "application/octet-stream"
            }
            
            $content = [System.IO.File]::ReadAllBytes($path)
            $response.ContentLength64 = $content.Length
            $response.OutputStream.Write($content, 0, $content.Length)
            $response.StatusCode = 200
        } else {
            $response.StatusCode = 404
        }
    } catch {
        Write-Warning "Request failed: $($_.Exception.Message)"
        if ($response) { $response.StatusCode = 500 }
    } finally {
        if ($response) { $response.Close() }
    }
}
