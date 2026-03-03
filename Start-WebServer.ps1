$port = 8000
$root = Join-Path $PSScriptRoot "docs"
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
try {
    $listener.Start()
    Write-Host "Server started at http://localhost:$port/"
} catch {
    Write-Error "Failed to start listener: $_"
    exit 1
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
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response
    
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
    $response.Close()
}
