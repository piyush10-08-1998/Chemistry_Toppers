// Email validation utilities

// List of disposable/temporary email domains to block
const DISPOSABLE_EMAIL_DOMAINS = [
  'tempmail.com', 'guerrillamail.com', '10minutemail.com', 'throwaway.email',
  'mailinator.com', 'maildrop.cc', 'temp-mail.org', 'getnada.com',
  'trashmail.com', 'fakeinbox.com', 'yopmail.com', 'mohmal.com',
  'sharklasers.com', 'guerrillamail.info', 'grr.la', 'guerrillamail.biz',
  'spam4.me', 'guerrillamail.net', 'guerrillamail.org', 'guerrillamailblock.com',
  'mailnesia.com', 'mytemp.email', 'crazymailing.com', 'emailondeck.com',
  'mailinator2.com', 'tmails.net'
];

// List of allowed email providers (can be customized)
const ALLOWED_EMAIL_DOMAINS = [
  'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com',
  'live.com', 'msn.com', 'aol.com', 'protonmail.com', 'mail.com',
  'zoho.com', 'yandex.com', 'gmx.com', 'mail.ru'
  // You can add school/organization domains here
];

/**
 * Validates email format using regex
 */
function isValidEmailFormat(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Extracts domain from email
 */
function getEmailDomain(email) {
  return email.split('@')[1]?.toLowerCase();
}

/**
 * Checks if email domain is disposable/temporary
 */
function isDisposableEmail(email) {
  const domain = getEmailDomain(email);
  return DISPOSABLE_EMAIL_DOMAINS.includes(domain);
}

/**
 * Checks if email domain is from allowed providers
 * Set allowAnyDomain to true to allow any domain except disposable ones
 */
function isAllowedEmailDomain(email, allowAnyDomain = true) {
  const domain = getEmailDomain(email);

  if (allowAnyDomain) {
    // Allow any domain except disposable ones
    return !isDisposableEmail(email);
  } else {
    // Only allow specific domains
    return ALLOWED_EMAIL_DOMAINS.includes(domain);
  }
}

/**
 * Comprehensive email validation
 * Returns { valid: boolean, error: string | null }
 */
function validateEmail(email, options = {}) {
  const {
    allowAnyDomain = true,
    requireEducationalEmail = false
  } = options;

  // Check if email exists
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }

  // Trim and lowercase
  email = email.trim().toLowerCase();

  // Check format
  if (!isValidEmailFormat(email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  // Check for disposable email
  if (isDisposableEmail(email)) {
    return {
      valid: false,
      error: 'Disposable/temporary email addresses are not allowed. Please use a valid email address.'
    };
  }

  // Check for educational email if required
  if (requireEducationalEmail) {
    const domain = getEmailDomain(email);
    if (!domain.endsWith('.edu') && !domain.endsWith('.ac.in') && !domain.endsWith('.edu.in')) {
      return {
        valid: false,
        error: 'Please use your educational email address (.edu, .ac.in, or .edu.in)'
      };
    }
  }

  // Check allowed domains
  if (!isAllowedEmailDomain(email, allowAnyDomain)) {
    return {
      valid: false,
      error: `Email must be from an allowed provider: ${ALLOWED_EMAIL_DOMAINS.join(', ')}`
    };
  }

  return { valid: true, error: null };
}

module.exports = {
  validateEmail,
  isValidEmailFormat,
  isDisposableEmail,
  isAllowedEmailDomain,
  ALLOWED_EMAIL_DOMAINS,
  DISPOSABLE_EMAIL_DOMAINS
};
