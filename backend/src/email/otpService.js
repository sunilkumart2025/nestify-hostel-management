const { Resend } = require('resend');
const { supabase } = require('../../config/supabase');
const { generateOTP } = require('../utils/generators');

// Check if Resend is configured
const isResendConfigured = process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.startsWith('re_');
const resend = isResendConfigured ? new Resend(process.env.RESEND_API_KEY) : null;

const sendOTP = async (email, purpose) => {
  try {
    if (!isResendConfigured) {
      console.log(`📧 Demo Mode: OTP for ${email} (${purpose}): 123456`);
      return true;
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in database
    await supabase
      .from('otp_verifications')
      .insert({
        email,
        otp,
        purpose,
        expires_at: expiresAt.toISOString()
      });

    // Send email
    const subject = getEmailSubject(purpose);
    const html = getEmailTemplate(otp, purpose);

    const result = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
      to: email,
      subject,
      html
    });

    if (result.error) {
      console.error('Resend API error:', result.error);
      throw new Error(`Failed to send email: ${result.error.message}`);
    }

    console.log(`📧 OTP sent to ${email}: ${otp}`);
    return true;
  } catch (error) {
    console.error('Send OTP error:', error);
    throw error;
  }
};

const verifyOTP = async (email, otp, purpose) => {
  try {
    if (!isResendConfigured) {
      // Demo mode: accept any 6-digit OTP
      return otp && otp.length === 6;
    }

    const { data, error } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq('email', email)
      .eq('otp', otp)
      .eq('purpose', purpose)
      .eq('is_used', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return false;
    }

    // Mark OTP as used
    await supabase
      .from('otp_verifications')
      .update({ is_used: true })
      .eq('id', data.id);

    return true;
  } catch (error) {
    console.error('Verify OTP error:', error);
    return false;
  }
};

const getEmailSubject = (purpose) => {
  switch (purpose) {
    case 'signup':
      return 'Verify Your Nestify Account';
    case 'password_reset':
      return 'Reset Your Nestify Password';
    case 'profile_update':
      return 'Verify Profile Update';
    default:
      return 'Nestify Verification Code';
  }
};

const getEmailTemplate = (otp, purpose) => {
  const baseTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin: 0;">Nestify</h1>
        <p style="color: #6b7280; margin: 5px 0;">Hostel Management System</p>
      </div>
      
      <div style="background: #f8fafc; padding: 30px; border-radius: 8px; text-align: center;">
        <h2 style="color: #1f2937; margin-bottom: 20px;">${getEmailTitle(purpose)}</h2>
        
        <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <p style="color: #6b7280; margin-bottom: 10px;">Your verification code is:</p>
          <h1 style="color: #2563eb; font-size: 32px; letter-spacing: 8px; margin: 0;">${otp}</h1>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">
          This code will expire in 10 minutes. Do not share this code with anyone.
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
        <p>© 2025 Nestify Hostel Management System. All rights reserved.</p>
      </div>
    </div>
  `;
  
  return baseTemplate;
};

const getEmailTitle = (purpose) => {
  switch (purpose) {
    case 'signup':
      return 'Welcome to Nestify!';
    case 'password_reset':
      return 'Reset Your Password';
    case 'profile_update':
      return 'Verify Your Changes';
    default:
      return 'Verification Required';
  }
};

module.exports = {
  sendOTP,
  verifyOTP
};