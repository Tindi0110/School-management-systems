from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.db import transaction
from .services import MpesaService
from .models import MpesaSTKRequest
from students.models import Student
from finance.models import Invoice, Payment, FeeStructure
from academics.models import AcademicYear, Term
import json
import logging

logger = logging.getLogger(__name__)

class InitiateSTKPushView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        phone_number = request.data.get('phone_number')
        amount = request.data.get('amount')
        admission_number = request.data.get('admission_number')

        if not all([phone_number, amount, admission_number]):
            return Response({"error": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST)

        # Standardize phone number (must start with 254)
        if phone_number.startswith('0'):
            phone_number = '254' + phone_number[1:]
        elif phone_number.startswith('+254'):
            phone_number = phone_number[1:]
        
        response = MpesaService.initiate_stk_push(phone_number, amount, admission_number)
        
        if response and response.get('ResponseCode') == '0':
            MpesaSTKRequest.objects.create(
                merchant_request_id=response.get('MerchantRequestID'),
                checkout_request_id=response.get('CheckoutRequestID'),
                admission_number=admission_number,
                phone_number=phone_number,
                amount=amount
            )
            return Response(response, status=status.HTTP_200_OK)
        
        return Response(response or {"error": "Failed to initiate STK push"}, status=status.HTTP_400_BAD_REQUEST)

class MpesaCallbackView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        logger.info(f"M-Pesa Callback Data: {json.dumps(data)}")

        stk_callback = data.get('Body', {}).get('stkCallback', {})
        result_code = stk_callback.get('ResultCode')
        checkout_request_id = stk_callback.get('CheckoutRequestID')

        try:
            stk_request = MpesaSTKRequest.objects.get(checkout_request_id=checkout_request_id)
            stk_request.status = 'SUCCESS' if result_code == 0 else 'FAILED'
            stk_request.result_desc = stk_callback.get('ResultDesc')
            stk_request.save()

            if result_code == 0:
                self.process_payment(stk_request)
                
        except MpesaSTKRequest.DoesNotExist:
            logger.error(f"STK Request with ID {checkout_request_id} not found")

        return Response({"ResultCode": 0, "ResultDesc": "Success"})

    @transaction.atomic
    def process_payment(self, stk_request):
        try:
            student = Student.objects.get(admission_number=stk_request.admission_number)
            
            # Find or Create Invoice for the current term/year
            # We assume there's an active year and the student is in a class
            active_year = AcademicYear.objects.filter(is_active=True).first()
            if not active_year:
                # Fallback to current year if no active year found
                active_year = AcademicYear.objects.order_by('-name').first()

            # Attempt to find if there's an unpaid or partial invoice for this student
            invoice = Invoice.objects.filter(
                student=student, 
                academic_year=active_year,
                # We might need a better way to determine the current term, 
                # but for simplicity we'll check status
            ).exclude(status='PAID').first()

            if not invoice:
                # Need to generate one
                # For term, we'll try to guess based on dates or just default to 1
                term_val = 1 
                # Check if an invoice for term 1 exists, if so check term 2
                existing_terms = Invoice.objects.filter(student=student, academic_year=active_year).values_list('term', flat=True)
                for t in [1, 2, 3]:
                    if t not in existing_terms:
                        term_val = t
                        break
                
                invoice = Invoice.objects.create(
                    student=student,
                    academic_year=active_year,
                    term=term_val,
                    status='UNPAID'
                )
                
                # Auto-add fee structures for their class
                fees = FeeStructure.objects.filter(
                    academic_year=active_year,
                    term=term_val,
                    class_level=student.current_class
                )
                
                from finance.models import InvoiceItem
                for fee in fees:
                    InvoiceItem.objects.create(
                        invoice=invoice,
                        fee_structure=fee,
                        description=fee.name,
                        amount=fee.amount
                    )
                
                invoice.recalculate_pricing()

            # Create Payment
            Payment.objects.create(
                invoice=invoice,
                amount=stk_request.amount,
                method='MPESA',
                reference_number=stk_request.checkout_request_id, # Or get the MpesaReceiptNumber from callback metadata
                notes=f"Auto-generated from M-Pesa STK Push ({stk_request.admission_number})"
            )
            
        except Exception as e:
            logger.error(f"Error processing payment for {stk_request.admission_number}: {str(e)}")
