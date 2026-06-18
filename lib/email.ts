/**
 * lib/email.ts
 *
 * Resend Email Integration Helper for Iyarkai Nala Maruthuvamanai
 * Fully compatible with serverless Next.js edge runtimes.
 */

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`
========================================================================
[MOCK EMAIL SENDER] (RESEND_API_KEY is missing)
------------------------------------------------------------------------
To:      ${to}
Subject: ${subject}
Content:
${html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()}
========================================================================
    `);
    return true;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Iyarkai Nala <onboarding@resend.dev>',
        to,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Resend API call failed:', errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error calling Resend API:', error);
    return false;
  }
}

/**
 * 🌿 Send OTP code during registration
 */
export async function sendOtpEmail(email: string, otp: string, name?: string): Promise<boolean> {
  const customerName = name || 'அன்பான பயனர்';
  const html = `
    <div style="background-color: #030C07; color: #F5EDD6; font-family: 'Outfit', -apple-system, sans-serif; padding: 40px 20px; max-width: 600px; margin: 0 auto; border: 1px solid rgba(201, 168, 76, 0.2);">
      <div style="text-align: center; margin-bottom: 30px;">
        <span style="font-size: 24px; color: #3D8A5C; font-weight: bold; letter-spacing: 1px;">இயற்கை நல மருத்துவமனை</span>
        <div style="font-size: 11px; color: #c9a84c; text-transform: uppercase; margin-top: 5px; letter-spacing: 2px;">Traditional Luxury Medicine</div>
      </div>
      
      <div style="background-color: #0D1A10; padding: 30px; border-radius: 12px; border: 1px solid rgba(61, 138, 92, 0.15);">
        <h2 style="font-family: Georgia, serif; font-weight: normal; color: #c9a84c; margin-top: 0;">வணக்கம், ${customerName}!</h2>
        <p style="font-size: 15px; line-height: 1.6; color: rgba(245, 237, 214, 0.8);">
          உங்கள் கணக்கை உருவாக்கக் கோரியதற்க்கு நன்றி. உங்கள் உள்நுழைவு மற்றும் பதிவு செய்வதற்கான ஒரு முறை கடவுச்சொல் (OTP) கீழே கொடுக்கப்பட்டுள்ளது:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <div style="display: inline-block; background: linear-gradient(135deg, #C9922A, #E8A820); color: #030C07; font-size: 32px; font-weight: bold; padding: 12px 35px; border-radius: 6px; letter-spacing: 8px; font-family: monospace;">
            ${otp}
          </div>
        </div>
        
        <p style="font-size: 13px; line-height: 1.5; color: rgba(245, 237, 214, 0.5);">
          * இந்த கடவுச்சொல் அடுத்த 10 நிமிடங்களுக்கு மட்டுமே செல்லுபடியாகும். இதை யாரிடமும் பகிர்ந்து கொள்ள வேண்டாம்.
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 30px; font-size: 12px; color: rgba(245, 237, 214, 0.4);">
        © 2024 Iyarkai Nala Maruthuvamanai. All rights reserved.
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `இயற்கை நல மருத்துவமனை — பதிவு OTP: ${otp}`,
    html,
  });
}

/**
 * 🔑 Send password reset verification code
 */
export async function sendPasswordResetOtpEmail(email: string, otp: string, name?: string): Promise<boolean> {
  const customerName = name || 'அன்பான பயனர்';
  const html = `
    <div style="background-color: #030C07; color: #F5EDD6; font-family: 'Outfit', -apple-system, sans-serif; padding: 40px 20px; max-width: 600px; margin: 0 auto; border: 1px solid rgba(201, 168, 76, 0.2);">
      <div style="text-align: center; margin-bottom: 30px;">
        <span style="font-size: 24px; color: #3D8A5C; font-weight: bold; letter-spacing: 1px;">இயற்கை நல மருத்துவமனை</span>
        <div style="font-size: 11px; color: #c9a84c; text-transform: uppercase; margin-top: 5px; letter-spacing: 2px;">Traditional Luxury Medicine</div>
      </div>
      
      <div style="background-color: #0D1A10; padding: 30px; border-radius: 12px; border: 1px solid rgba(61, 138, 92, 0.15);">
        <h2 style="font-family: Georgia, serif; font-weight: normal; color: #c9a84c; margin-top: 0;">கடவுச்சொல் மீட்பு / Password Reset</h2>
        <p style="font-size: 15px; line-height: 1.6; color: rgba(245, 237, 214, 0.8);">
          வணக்கம் ${customerName}, உங்கள் கணக்கின் கடவுச்சொல்லை மீட்டமைப்பதற்கான குறியீடு கீழே உள்ளது:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <div style="display: inline-block; background: linear-gradient(135deg, #c9a84c, #a4822d); color: #030C07; font-size: 32px; font-weight: bold; padding: 12px 35px; border-radius: 6px; letter-spacing: 8px; font-family: monospace;">
            ${otp}
          </div>
        </div>
        
        <p style="font-size: 13px; line-height: 1.5; color: rgba(245, 237, 214, 0.5);">
          * இந்த குறியீடு அடுத்த 10 நிமிடங்களில் காலாவதியாகிவிடும். இதை நீங்கள் கோரவில்லை எனில், இந்த மின்னஞ்சலைப் புறக்கணிக்கவும்.
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 30px; font-size: 12px; color: rgba(245, 237, 214, 0.4);">
        © 2024 Iyarkai Nala Maruthuvamanai. All rights reserved.
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `இயற்கை நல மருத்துவமனை — கடவுச்சொல் மீட்புக் குறியீடு: ${otp}`,
    html,
  });
}

/**
 * 🛍️ Send order receipt/confirmation email
 */
export async function sendOrderConfirmationEmail(
  email: string,
  orderId: string,
  total: number,
  items: any[],
  name?: string
): Promise<boolean> {
  const customerName = name || 'அன்பான பயனர்';
  
  const itemsHtml = items.map(item => `
    <tr style="border-bottom: 1px solid rgba(245, 237, 214, 0.1);">
      <td style="padding: 12px 0; font-size: 14px; color: rgba(245, 237, 214, 0.9);">
        ${item.nameTa} <br/>
        <span style="font-size: 12px; color: rgba(245, 237, 214, 0.45);">${item.nameEn}</span>
      </td>
      <td style="padding: 12px 0; font-size: 14px; text-align: center; color: rgba(245, 237, 214, 0.70);">
        ${item.qty}
      </td>
      <td style="padding: 12px 0; font-size: 14px; text-align: right; font-weight: bold; color: #c9a84c;">
        ₹${(item.price * item.qty).toLocaleString()}
      </td>
    </tr>
  `).join('');

  const html = `
    <div style="background-color: #030C07; color: #F5EDD6; font-family: 'Outfit', -apple-system, sans-serif; padding: 40px 20px; max-width: 600px; margin: 0 auto; border: 1px solid rgba(201, 168, 76, 0.2);">
      <div style="text-align: center; margin-bottom: 30px;">
        <span style="font-size: 24px; color: #3D8A5C; font-weight: bold; letter-spacing: 1px;">இயற்கை நல மருத்துவமனை</span>
        <div style="font-size: 11px; color: #c9a84c; text-transform: uppercase; margin-top: 5px; letter-spacing: 2px;">Order Confirmation</div>
      </div>
      
      <div style="background-color: #0D1A10; padding: 30px; border-radius: 12px; border: 1px solid rgba(61, 138, 92, 0.15);">
        <h2 style="font-family: Georgia, serif; font-weight: normal; color: #c9a84c; margin-top: 0; margin-bottom: 8px;">நன்றி, ${customerName}!</h2>
        <p style="font-size: 14px; color: rgba(245, 237, 214, 0.60); margin-top: 0; margin-bottom: 24px;">
          உங்கள் கட்டளை வெற்றிகரமாகப் பெறப்பட்டது.
        </p>
        
        <div style="border-bottom: 1px dashed rgba(201, 168, 76, 0.2); padding-bottom: 12px; margin-bottom: 20px;">
          <span style="font-size: 13px; color: rgba(245, 237, 214, 0.45);">கட்டளை எண் (Order ID):</span> <br/>
          <strong style="font-size: 18px; color: #F5EDD6; letter-spacing: 0.5px;">${orderId}</strong>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="border-bottom: 1.5px solid rgba(201, 168, 76, 0.2);">
              <th style="text-align: left; padding-bottom: 8px; font-size: 12px; text-transform: uppercase; color: rgba(245, 237, 214, 0.45);">தயாரிப்பு (Product)</th>
              <th style="text-align: center; padding-bottom: 8px; font-size: 12px; text-transform: uppercase; color: rgba(245, 237, 214, 0.45);">எண்ணிக்கை (Qty)</th>
              <th style="text-align: right; padding-bottom: 8px; font-size: 12px; text-transform: uppercase; color: rgba(245, 237, 214, 0.45);">விலை (Total)</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="border-top: 1.5px solid rgba(201, 168, 76, 0.25); padding-top: 15px; margin-top: 20px;">
          <table style="width: 100%; font-size: 14px;">
            <tr>
              <td style="color: rgba(245, 237, 214, 0.6); padding: 4px 0;">மொத்த தொகை (Subtotal):</td>
              <td style="text-align: right; color: #F5EDD6; padding: 4px 0;">₹${total.toLocaleString()}</td>
            </tr>
            <tr style="font-size: 16px; font-weight: bold;">
              <td style="color: #c9a84c; padding: 12px 0 0 0;">மொத்தம் (Grand Total):</td>
              <td style="text-align: right; color: #c9a84c; padding: 12px 0 0 0;">₹${total.toLocaleString()}</td>
            </tr>
          </table>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 30px; font-size: 12px; color: rgba(245, 237, 214, 0.4);">
        © 2024 Iyarkai Nala Maruthuvamanai. All rights reserved.
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `இயற்கை நல மருத்துவமனை — கட்டளை உறுதிப்படுத்தல்: ${orderId}`,
    html,
  });
}
