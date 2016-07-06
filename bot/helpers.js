isEmpty = function(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

shuffleArray = function(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

var greetings = ['Hello ', 'Greetings ', 'Hey there ', 'Hi '];

random = function(type) {
    type = greetings;

    shuffleArray(type);
    return type[0];
}
module.exports = {
    isEmpty: isEmpty,
    shuffleArray: shuffleArray,
    random: random
};
