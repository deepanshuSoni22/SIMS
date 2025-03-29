import otpGenerator from 'otp-generator';

console.log(typeof otpGenerator);
console.log(Object.keys(otpGenerator));

// Try different ways to generate OTP
try {
  console.log('Direct function call:');
  const otp1 = otpGenerator(6, { digits: true });
  console.log(otp1);
} catch (e) {
  console.log('Error with direct function call:', e.message);
}

try {
  console.log('Using generate method:');
  const otp2 = otpGenerator.generate(6, { digits: true });
  console.log(otp2);
} catch (e) {
  console.log('Error with generate method:', e.message);
}