// Vercel Serverless Function for handling form submission
// Environment variables required:
// - RESEND_API_KEY: Resend API key
// - TO_EMAIL: Recipient email address
// - ALLOWED_ORIGINS: Comma-separated list of allowed origins (optional)

// Validation and sanitization utilities
const Validator = {
    // Sanitize HTML to prevent XSS
    sanitizeHtml(str) {
        if (typeof str !== 'string') return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    },

    // Validate email format
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // Validate string length
    isValidLength(str, min = 1, max = 1000) {
        if (typeof str !== 'string') return false;
        return str.length >= min && str.length <= max;
    },

    // Validate and sanitize name
    validateName(name) {
        if (!this.isValidLength(name, 1, 100)) return null;
        return this.sanitizeHtml(name.trim());
    },

    // Validate and sanitize company
    validateCompany(company) {
        if (!this.isValidLength(company, 1, 200)) return null;
        return this.sanitizeHtml(company.trim());
    },

    // Validate and sanitize email
    validateEmail(email) {
        if (!this.isValidLength(email, 5, 255)) return null;
        const trimmed = email.trim();
        if (!this.isValidEmail(trimmed)) return null;
        return this.sanitizeHtml(trimmed);
    },

    // Validate and sanitize country
    validateCountry(country) {
        if (!this.isValidLength(country, 1, 100)) return null;
        return this.sanitizeHtml(country.trim());
    },

    // Validate and sanitize message
    validateMessage(message) {
        if (!this.isValidLength(message, 10, 5000)) return null;
        return this.sanitizeHtml(message.trim());
    },

    // Validate products array
    validateProducts(products) {
        if (!Array.isArray(products) || products.length === 0) return null;
        const validProducts = ['CBB60', 'CBB61'];
        const sanitized = products
            .filter(p => validProducts.includes(p))
            .map(p => this.sanitizeHtml(p));
        return sanitized.length > 0 ? sanitized : null;
    }
};

// Get allowed origins from environment
function getAllowedOrigins() {
    const allowedOriginsEnv = process.env.ALLOWED_ORIGINS;
    if (!allowedOriginsEnv) return []; // If not set, allow all (for backward compatibility)
    return allowedOriginsEnv.split(',').map(origin => origin.trim());
}

// Check if origin is allowed
function isOriginAllowed(origin, allowedOrigins) {
    if (allowedOrigins.length === 0) return true; // No restriction
    return allowedOrigins.some(allowed => {
        // Support wildcards
        if (allowed === '*') return true;
        if (allowed.endsWith('*')) {
            const prefix = allowed.slice(0, -1);
            return origin.startsWith(prefix);
        }
        return origin === allowed;
    });
}

module.exports = async (req, res) => {
    // Get configuration from environment variables
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const TO_EMAIL = process.env.TO_EMAIL;
    const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@eperscapacitor.com';
    const allowedOrigins = getAllowedOrigins();

    // Check required environment variables
    if (!RESEND_API_KEY) {
        console.error('RESEND_API_KEY environment variable is not set');
        return res.status(500).json({
            success: false,
            error: 'Server configuration error'
        });
    }

    if (!TO_EMAIL) {
        console.error('TO_EMAIL environment variable is not set');
        return res.status(500).json({
            success: false,
            error: 'Server configuration error'
        });
    }

    // Enable CORS
    const origin = req.headers.origin;
    if (origin && isOriginAllowed(origin, allowedOrigins)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (allowedOrigins.length === 0) {
        // Backward compatibility: allow all if not configured
        res.setHeader('Access-Control-Allow-Origin', '*');
    }

    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('Received form submission');

        const { name, company, email, country, products, message } = req.body;

        // Validate and sanitize all fields
        const sanitizedName = Validator.validateName(name);
        const sanitizedCompany = Validator.validateCompany(company);
        const sanitizedEmail = Validator.validateEmail(email);
        const sanitizedCountry = Validator.validateCountry(country);
        const sanitizedProducts = Validator.validateProducts(products);
        const sanitizedMessage = Validator.validateMessage(message);

        // Check validation results
        if (!sanitizedName) {
            return res.status(400).json({
                success: false,
                error: 'Invalid name. Please provide a valid name (1-100 characters).'
            });
        }

        if (!sanitizedCompany) {
            return res.status(400).json({
                success: false,
                error: 'Invalid company name. Please provide a valid company name (1-200 characters).'
            });
        }

        if (!sanitizedEmail) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email address. Please provide a valid email.'
            });
        }

        if (!sanitizedCountry) {
            return res.status(400).json({
                success: false,
                error: 'Invalid country. Please provide a valid country (1-100 characters).'
            });
        }

        if (!sanitizedProducts) {
            return res.status(400).json({
                success: false,
                error: 'Please select at least one product (CBB60 or CBB61).'
            });
        }

        if (!sanitizedMessage) {
            return res.status(400).json({
                success: false,
                error: 'Invalid message. Please provide a message (10-5000 characters).'
            });
        }

        console.log('Fields validated, preparing email...');

        // Prepare email content with sanitized data
        const productsList = Array.isArray(sanitizedProducts) ? sanitizedProducts.join(', ') : sanitizedProducts;

        const emailHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #c41e3a 0%, #a01830 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
                    .field { margin-bottom: 15px; }
                    .label { font-weight: bold; color: #1a1a2e; }
                    .value { margin-top: 5px; color: #6b7280; }
                    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #9ca3af; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>New Inquiry from Landing Page</h2>
                    </div>
                    <div class="content">
                        <div class="field">
                            <div class="label">Name:</div>
                            <div class="value">${sanitizedName}</div>
                        </div>
                        <div class="field">
                            <div class="label">Company:</div>
                            <div class="value">${sanitizedCompany}</div>
                        </div>
                        <div class="field">
                            <div class="label">Email:</div>
                            <div class="value">${sanitizedEmail}</div>
                        </div>
                        <div class="field">
                            <div class="label">Country:</div>
                            <div class="value">${sanitizedCountry}</div>
                        </div>
                        <div class="field">
                            <div class="label">Product Interest:</div>
                            <div class="value">${productsList}</div>
                        </div>
                        <div class="field">
                            <div class="label">Message / Requirement:</div>
                            <div class="value">${sanitizedMessage.replace(/\n/g, '<br>')}</div>
                        </div>
                        <div class="field">
                            <div class="label">Submitted at:</div>
                            <div class="value">${new Date().toISOString()}</div>
                        </div>
                    </div>
                    <div class="footer">
                        <p>Motor Run Capacitor Manufacturer Landing Page</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        console.log('Sending email via Resend API...');
        console.log('FROM_EMAIL:', FROM_EMAIL);
        console.log('TO_EMAIL:', TO_EMAIL);
        console.log('RESEND_API_KEY (first 10 chars):', RESEND_API_KEY ? RESEND_API_KEY.substring(0, 10) + '...' : 'NOT SET');

        // Send email via Resend API
        // Use simple from format for resend.dev domains, formatted for custom domains
        const fromEmail = FROM_EMAIL.includes('resend.dev')
            ? FROM_EMAIL
            : `Motor Run Capacitor <${FROM_EMAIL}>`;

        console.log('Using fromEmail:', fromEmail);

        const emailPayload = {
            from: fromEmail,
            to: [TO_EMAIL],
            subject: `New Inquiry: ${sanitizedName} from ${sanitizedCompany}`,
            html: emailHTML,
            reply_to: sanitizedEmail
        };

        console.log('Email payload:', JSON.stringify(emailPayload, null, 2));

        const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(emailPayload),
        });

        console.log('Resend response status:', resendResponse.status);
        console.log('Resend response headers:', JSON.stringify(Object.fromEntries(resendResponse.headers.entries()), null, 2));

        if (!resendResponse.ok) {
            const errorText = await resendResponse.text();
            const errorJson = await resendResponse.json().catch(() => null);
            console.error('=== RESEND API ERROR ===');
            console.error('Status:', resendResponse.status);
            console.error('Status Text:', resendResponse.statusText);
            console.error('Response Body (text):', errorText);
            console.error('Response Body (json):', errorJson);
            console.error('========================');
            // Don't expose internal error details to client
            throw new Error('Failed to send email');
        }

        const resendData = await resendResponse.json();
        console.log('Email sent successfully:', resendData);

        // Success response
        return res.status(200).json({
            success: true,
            message: 'Inquiry submitted successfully'
        });

    } catch (error) {
        console.error('Error processing inquiry:', error);
        // Return generic error message to avoid exposing internal details
        return res.status(500).json({
            success: false,
            error: 'An error occurred while processing your request. Please try again later.'
        });
    }
};
