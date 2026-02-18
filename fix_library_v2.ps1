$path = "frontend\src\pages\Library.tsx"
$content = Get-Content $path -Raw

# fix: toast.error(`Error: ${msg}`); -> if timeout ... else toast.error(`Error: ${errorMsg}`);
# Using single quotes for the search string to ensure backticks and ${} are treated literallly
$search = 'toast.error(`Error: ${msg}`);'

$replace = "if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
                 toast.warning('Request timed out, but book might be issued. Please check the list.');
            } else {
                 toast.error(`Error: ${errorMsg}`);
            }"

$content = $content.Replace($search, $replace)

Set-Content $path $content -NoNewline
Write-Host "Fixed Library error variable usage."
