declare module 'otp-generator' {
  export default function generate(length: number, options?: {
    digits?: boolean;
    alphabets?: boolean;
    upperCaseAlphabets?: boolean;
    lowerCaseAlphabets?: boolean;
    specialChars?: boolean;
  }): string;
}