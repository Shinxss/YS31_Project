# TODO: Implement Separate OTP Messages for Signup and Password Reset

- [ ] Update sendOtpEmail function in backend/src/utils/mailer.js to accept a 'purpose' parameter and customize email content for 'signup' vs 'passwordReset'
- [ ] Update sendSignupOtp in backend/src/controllers/auth.controller.js to pass purpose: 'signup' to sendOtpEmail
- [ ] Update sendPasswordResetOtp in backend/src/controllers/auth.controller.js to pass purpose: 'passwordReset' to sendOtpEmail
