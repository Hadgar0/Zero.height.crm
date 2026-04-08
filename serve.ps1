$listener = New-Object Net.HttpListener
$listener.Prefixes.Add('http://localhost:5500/')
$listener.Start()
Write-Host "Server started at http://localhost:5500"
while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $path = $ctx.Request.Url.LocalPath.TrimStart('/')
    $file = "C:/Users/HadgarPC/Desktop/CRM/" + $(if ($path -eq '') { 'index.html' } else { $path })
    if (-not [IO.File]::Exists($file)) { $file = 'C:/Users/HadgarPC/Desktop/CRM/index.html' }
    $bytes = [IO.File]::ReadAllBytes($file)
    $ctx.Response.ContentLength64 = $bytes.Length
    $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    $ctx.Response.Close()
}
