$path = "frontend\src\pages\Library.tsx"
$content = Get-Content $path -Raw

# fix: toast.error(Error: ); -> toast.error(`Error: ${errorMsg}`);
$search = 'toast.error(Error: );'
# Use single quotes to prevent PowerShell from interpolating ${errorMsg}
$replace = 'toast.error(`Error: ${errorMsg}`);'

$content = $content.Replace($search, $replace)

Set-Content $path $content -NoNewline
Write-Host "Fixed Library syntax error."
