const shortenAddress = (fullAddress) => {
  return fullAddress
    ? `${fullAddress.substr(0, 6)}...${fullAddress.substr(-4, 4)}`
    : '0x0';
};

export default shortenAddress;
