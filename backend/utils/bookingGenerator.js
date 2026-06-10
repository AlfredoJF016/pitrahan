const crypto = require('crypto');

/**
 * Generates a cryptographically secure, short, readable booking code.
 * Format: PT-XXXXX (e.g. PT-D8J2K)
 * Excludes ambiguous characters (0, O, 1, I, L) for improved user readability.
 */
function generateBookingCode() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const codeLength = 5;
    let code = '';
    
    // Generate secure random bytes
    const randomBytes = crypto.randomBytes(codeLength);
    
    for (let i = 0; i < codeLength; i++) {
        const index = randomBytes[i] % alphabet.length;
        code += alphabet[index];
    }
    
    return `PT-${code}`;
}

module.exports = {
    generateBookingCode
};
