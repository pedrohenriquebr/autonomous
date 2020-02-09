module.exports = {
    extract: function (data, where) {
        for (var key in data) {
            where[key] = data[key];
        }
    },
    sleep: (ms) => {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    makeid: function (length) {
        var result = '';
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += (
                rs = '',
                char = characters.charAt(Math.floor(Math.random() * charactersLength)),
                [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].includes(parseInt(char)) && i == 0 ? i-- : rs = char,
                rs
            );
        }
        return result;
    }
}