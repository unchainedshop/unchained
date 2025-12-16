const base64ToArrayBuffer = (b64: string) => {
  // Check if the atob and Uint8Array methods are available
  if (window.atob && Uint8Array) {
    // Convert base64url to standard base64 if needed
    const base64 = b64.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const binaryString = window.atob(padded);
    // Store the length of the binary string in a variable
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i += 1) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
  throw new Error('The atob and Uint8Array methods are not available');
};

export default base64ToArrayBuffer;
