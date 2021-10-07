import Hashids from 'hashids/cjs';
var hashids = new Hashids('unchained', 6, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890');
export default (function () {
    var randomNumber = Math.floor(Math.random() * (999999999 - 1)) + 1;
    return hashids.encode(randomNumber);
});
//# sourceMappingURL=generate-random-hash.js.map