//在所有中文字符后面添加一个空格
export default function tokenizer(text) {
    var r = "";
    var index = 0;
    while (true) {
        var codePoint = text.codePointAt(index);
        if (codePoint == undefined) {
            break;
        }
        r = r.concat(String.fromCodePoint(codePoint));
        //u4e00~u9fff 中文
        if (codePoint >= 0x4e00 && codePoint <= 0x9fff) {
            //添加分词空格
            r = r.concat(' ');
        }
        index++;
    }
    return r;
}

if (!String.fromCodePoint) {
    (function() {
        var stringFromCharCode = String.fromCharCode;
        var floor = Math.floor;
        var fromCodePoint = function() {
            var MAX_SIZE = 0x4000;
            var codeUnits = [];
            var highSurrogate;
            var lowSurrogate;
            var index = -1;
            var length = arguments.length;
            if (!length) {
                return '';
            }
            var result = '';
            while (++index < length) {
                var codePoint = Number(arguments[index]);
                if (
                    !isFinite(codePoint) ||       // `NaN`, `+Infinity`, or `-Infinity`
                    codePoint < 0 ||              // not a valid Unicode code point
                    codePoint > 0x10FFFF ||       // not a valid Unicode code point
                    floor(codePoint) != codePoint // not an integer
                ) {
                    throw RangeError('Invalid code point: ' + codePoint);
                }
                if (codePoint <= 0xFFFF) { // BMP code point
                    codeUnits.push(codePoint);
                } else { // Astral code point; split in surrogate halves
                    // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
                    codePoint -= 0x10000;
                    highSurrogate = (codePoint >> 10) + 0xD800;
                    lowSurrogate = (codePoint % 0x400) + 0xDC00;
                    codeUnits.push(highSurrogate, lowSurrogate);
                }
                if (index + 1 == length || codeUnits.length > MAX_SIZE) {
                    result += stringFromCharCode.apply(null, codeUnits);
                    codeUnits.length = 0;
                }
            }
            return result;
        };
   
        String.fromCodePoint = fromCodePoint;

    }());
}
