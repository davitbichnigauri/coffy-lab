# მარტივი სტატიკური სერვერი დეველოპმენტისთვის
$root = Split-Path $PSScriptRoot -Parent
$port = 8737
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "Serving $root on http://localhost:$port/"

$mime = @{
  '.html' = 'text/html; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.js'   = 'application/javascript; charset=utf-8'
  '.svg'  = 'image/svg+xml'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.ico'  = 'image/x-icon'
  '.json' = 'application/json; charset=utf-8'
  '.woff2'= 'font/woff2'
}
$rootFull = [System.IO.Path]::GetFullPath($root)

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  try {
    $path = [System.Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart('/'))
    if ([string]::IsNullOrWhiteSpace($path)) { $path = 'index.html' }
    $full = [System.IO.Path]::GetFullPath((Join-Path $rootFull $path))
    if (-not $full.StartsWith($rootFull) -or -not (Test-Path $full -PathType Leaf)) {
      $ctx.Response.StatusCode = 404
      $bytes = [System.Text.Encoding]::UTF8.GetBytes('404 Not Found')
    } else {
      $ext = [System.IO.Path]::GetExtension($full).ToLower()
      $ctx.Response.ContentType = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' }
      $bytes = [System.IO.File]::ReadAllBytes($full)
    }
    $ctx.Response.ContentLength64 = $bytes.Length
    $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  } catch {}
  finally { try { $ctx.Response.OutputStream.Close() } catch {} }
}
