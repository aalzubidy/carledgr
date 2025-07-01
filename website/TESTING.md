# CarLedgr Website - Stripe Integration Testing

## Architecture Overview

```
Marketing Website (port 8080) → Backend API (port 5000) → Stripe
                                      ↑
                               Stripe Webhooks
```

**Important:** 
- Marketing website calls backend API
- Stripe webhooks go directly to backend API (via ngrok)
- Success/cancel pages are served by marketing website

## Setup for Local Testing

### 1. Backend Setup
Make sure your backend is running with Stripe in test mode:

```bash
cd backend
npm install
npm start
```

The backend should be running on `http://localhost:5000`

### 2. Ngrok for Backend (Required for Stripe Webhooks)
```bash
# In a new terminal
ngrok http 5000
```

Copy the ngrok URL (e.g., `https://abc123.ngrok.io`) and update your Stripe webhook endpoint to:
`https://abc123.ngrok.io/api/stripe/webhook`

### 3. Marketing Website Setup
```bash
cd website
python3 -m http.server 8080
```

The website will be available at `http://localhost:8080`

### 4. Configuration
The `config.json` is already set up for local testing. For production, update:
- `baseUrl`: Your production backend URL
- `successUrl`: `https://yourdomain.com/success.html`
- `cancelUrl`: `https://yourdomain.com/cancel.html`

## Testing the Checkout Flow

### Test Cards (Stripe Test Mode)
- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- **Requires Auth:** `4000 0025 0000 3155`

Use any future expiry date (e.g., 12/34) and any 3-digit CVC.

### Test Steps
1. Open `http://localhost:8080`
2. Scroll to pricing section
3. Click "Get Started" on any plan
4. Fill in the organization modal:
   - **Organization Name:** Test Dealership
   - **Owner Email:** test@example.com
5. Click "Continue to Payment"
6. Use test card `4242 4242 4242 4242`
7. Complete checkout
8. Should redirect to success page
9. Check the backend logs for webhook events
10. Check that organization and user were created

### Expected Flow
1. **Modal appears** asking for organization details
2. **Redirect to Stripe** with pre-filled information
3. **Complete payment** using test card
4. **Success page** with welcome message
5. **Backend webhook** creates organization and user
6. **Welcome email** sent to provided address

### Troubleshooting
- Check browser console for JavaScript errors
- Check backend logs for API errors
- Verify CORS is working (backend already has it enabled)
- Ensure Stripe test keys are configured in backend

## Production Deployment

### Option 1: Local Testing with Ngrok
1. Backend runs locally with ngrok tunnel for webhooks
2. Marketing website runs locally (or deployed)
3. Perfect for development and testing

### Option 2: Full Production
1. Deploy backend to your VPS
2. Deploy marketing website to your VPS  
3. Update `config.json` with production URLs
4. Update Stripe webhook URL to production backend

### Ngrok Setup for Stripe Webhooks
- Stripe webhooks MUST point to your backend API
- Use ngrok to tunnel to `localhost:5000` during development
- In production, point directly to your backend VPS 