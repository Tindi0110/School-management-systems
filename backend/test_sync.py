import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from library.models import LibraryFine
from finance.models import Invoice, Adjustment
from library.views import sync_fine_to_finance

print('Checking Library Fines...')
fines = LibraryFine.objects.all()
print(f'Total fines: {fines.count()}')

pending = fines.filter(status='PENDING')
print(f'Pending fines: {pending.count()}')

for fine in pending[:5]:
    status = getattr(fine, 'adjustment', None)
    print(f'Fine ID: {fine.id}, User: {fine.user.username}, Amount: {fine.amount}, HasAdjustment: {status is not None}')
    # Try syncing
    success, msg = sync_fine_to_finance(fine, fine.user)
    print(f'Sync attempt for Fine {fine.id}: Success={success}, Msg={msg}')
