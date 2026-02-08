import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sms.settings')
django.setup()

from finance.models import FeeItem, ExpenseCategory

def seed_finance():
    # Fee Items
    fee_items = ['Tuition', 'Boarding', 'Transport', 'Exam', 'Activity', 'Library', 'Medical']
    for item in fee_items:
        FeeItem.objects.get_or_create(name=item)
    
    # Expense Categories
    expense_cats = ['Staff Salaries', 'Utilities', 'Maintenance', 'Supplies', 'Food & Catering', 'Security']
    for cat in expense_cats:
        ExpenseCategory.objects.get_or_create(name=cat)

    print("Finance metadata seeded successfully!")

if __name__ == '__main__':
    seed_finance()
