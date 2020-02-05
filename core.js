module.exports = {
    extract: function (data, where) {
        for (var key in data) {
            where[key] = data[key];
        }
    },
    sleep: (ms) => {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}