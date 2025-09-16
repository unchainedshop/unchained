const base64ToArrayBuffer = (b64) => {
  // Check if the atob and Uint8Array methods are available
  if (window.atob && Uint8Array) {
    const binaryString = window.atob(b64);
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
