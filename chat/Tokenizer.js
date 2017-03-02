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

