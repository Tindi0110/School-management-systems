$path = "frontend\src\pages\Library.tsx"
$content = Get-Content $path -Raw

# 1. Improve Success Block (Safety)
$oldSuccess = "const bookTitle = books.find(b => b.id === Number(copies.find(c => c.id === Number(lendingForm.copy))?.book))?.title;"
$newSuccess = "const copyId = Number(lendingForm.copy);
            const copyObj = copies.find(c => c.id === copyId);
            const bookObj = copyObj ? books.find(b => b.id === Number(copyObj.book)) : null;
            const bookTitle = bookObj?.title || 'Book';"
$content = $content.Replace($oldSuccess, $newSuccess)

# 2. Improve Catch Block (Timeout handling)
$oldCatch = "} catch (err: any) {
            console.error(err);
            const msg = err.response?.data?.detail || 'Failed to issue book.';
            toast.error(`Error: ${msg}`);
        } finally {"

$newCatch = "} catch (err: any) {
            console.error('Lending Error:', err);
            const errorDetail = err.response?.data?.detail;
            const errorMsg = errorDetail || err.message || 'Failed to issue book.';
            
            if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
                 toast.warning('Request timed out, but book might be issued. Please check the list.');
            } else {
                 toast.error(`Error: ${errorMsg}`);
            }
        } finally {"

# Use regex or exact string match. The oldCatch has newlines.
# PowerShell Replace might fail with multiline strings if not exact.
# I'll rely on a simpler replace for the catch block if possible, or use regex.
# Let's try simpler unique strings.

$content = $content.Replace("const msg = err.response?.data?.detail || 'Failed to issue book.';", "const errorDetail = err.response?.data?.detail; const errorMsg = errorDetail || err.message || 'Failed to issue book.';")
$content = $content.Replace("toast.error(`Error: ${msg}`);", "if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) { toast.warning('Request timed out, but book might be issued.'); } else { toast.error(`Error: ${errorMsg}`); }")

# Fix the variable name in the second replace (msg -> errorMsg) if I changed it.
# Wait, if I replace the first line, `msg` var is gone.
# So I must replace the usages of `msg` too.

Set-Content $path $content -NoNewline
Write-Host "Fixed Library error handling."
