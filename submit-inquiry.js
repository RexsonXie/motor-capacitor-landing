// Vercel Serverless Function for handling form submission
// Resend API Key: re_Wb6wExws_6bZtSDtaNp85tJTZt7Q8apVm

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
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
        return res.status(405).json({ error: 'Method not allowed', received: req.method });
    }

    try {
        console.log('Received form submission');
        console.log('Request body:', req.body);

        const { name, company, email, country, products, message } = req.body;

        // Validate required fields
        if (!name || !company || !email || !country || !products || !message) {
            console.log('Missing fields:', { name: !!name, company: !!company, email: !!email, country: !!country, products: !!products, message: !!message });
            return res.status(400).json({
                error: 'Missing required fields',
                received: { name, company, email, country, products, message }
            });
        }

        console.log('Fields validated, preparing email...');

        // Prepare email content
        const productsList = Array.isArray(products) ? products.join(', ') : products;

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
                            <div class="value">${name}</div>
                        </div>
                        <div class="field">
                            <div class="label">Company:</div>
                            <div class="value">${company}</div>
                        </div>
                        <div class="field">
                            <div class="label">Email:</div>
                            <div class="value">${email}</div>
                        </div>
                        <div class="field">
                            <div class="label">Country:</div>
                            <div class="value">${country}</div>
                        </div>
                        <div class="field">
                            <div class="label">Product Interest:</div>
                            <div class="value">${productsList}</div>
                        </div>
                        <div class="field">
                            <div class="label">Message / Requirement:</div>
                            <div class="value">${message}</div>
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

        // Send email via Resend API
        const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer re_Wb6wExws_6bZtSDtaNp85tJTZt7Q8apVm`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: 'Motor Run Capacitor <noreply@eperscapacitor.com>',
                to: ['sales@eperscapacitor.com'],
                subject: `New Inquiry: ${name} from ${company}`,
                html: emailHTML,
                reply_to: email
            }),
        });

        console.log('Resend response status:', resendResponse.status);

        if (!resendResponse.ok) {
            const errorText = await resendResponse.text();
            console.error('Resend API Error:', errorText);
            throw new Error(`Resend API failed: ${resendResponse.status} - ${errorText}`);
        }

        const resendData = await resendResponse.json();
        console.log('Email sent successfully:', resendData);

        // Success response
        return res.status(200).json({
            success: true,
            message: 'Inquiry submitted successfully',
            emailId: resendData.id
        });

    } catch (error) {
        console.error('Error processing inquiry:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Failed to process inquiry'
        });
    }
};
