const _ = require('lodash');

isEmpty = function(obj) {
    for(let key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

shuffleArray = function(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1)),
        temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

const greetings = ['Hello ', 'Greetings ', 'Hey there ', 'Hi '],
jokes = ["I'm reading a book about anti-gravity. It's impossible to put down.", "I wondered why the baseball was getting bigger. Then it hit me.", "I'm glad I know sign language, it's pretty handy.", "My friend's bakery burned down last night. Now his business is toast.", "Why did the cookie cry?\nIt was feeling crumby.", "I used to be a banker, but I lost interest.", "How did the hipster burn his tongue?\nHe drank his coffee before it was cool.", "What do you call a cow with no legs?\nGround beef.", "What do you do with a sick chemist?\nCurium.", "What do you do with a dead chemist?\nBarium.", "Why can't you hear a pterodactyl going to the bathroom?\nThe 'P' is silent.", "What do you call a donkey flying through space?\nAn assteroid.", "What do you call a donkey exploring space?\nAn asstronaut.", "Why was the broom late for work?\nIt overswept.", "I walked into my sister's room and tripped on a bra. It was a booby-trap.", "What is the leading cause of divorce in long-term marriages?\nA stalemate.", "What did the mermaid wear to her math class?\nAn algae bra.", "People are making apocalypse jokes like there's no tomorrow...", "I stayed up all night wondering where the sun went. Then it dawned on me.", "You wanna hear a joke about pizza? Never mind, it was too cheesy.", "Why did the scarecrow get an award?\nHe was outstanding in his field.", "I once heard a joke about amnesia... But I forget how it goes.", "The frustrated cannibal threw up his hands.", "The midget psychic escaped prison. He was a small medium at large.", "Newspaper headline reads: Cartoonist found dead at home, details are sketchy.", "The Magician got frustrated and pulled his hare out.", "I heard about the guy who got hit in the head with a can of soda. He is lucky it was a soft drink.", "What did the triangle say to the circle?\nYou're so pointless.", "What did the cannibal get when he showed up to the party late?\nA cold shoulder!", "Two whales walk in to a bar. One of them is like, 'hmhmhnnnngnbrmuh'. And the other one is like, 'Man, Steve, go home. You are drunk!'", "What are the strongest days of the week?\nSaturday and Sunday. All the rest are weak-days.", "What did the shy pebble wish for?\nThat she was a little boulder.", "Why did the tomato blush?\nBecause it saw the salad dressing.", "My Grandpa had the heart of a lion... And a life time ban from the Zoo.", "Why did Sherlock Holmes go to the mexican restaurant?\nHe was looking for a good case-idea.", "What do you call a pencil without lead?\nPointless.", "What is the object-oriented way to become wealthy?\nInheritance.", "The lumberjack loved his new computer... especially logging in.", "Why did the developer add body { padding-top: 1000px; } to her Facebook page?\nShe wanted to keep a low profile.", "Why couldn’t the bicycle stand up by itself?\nIt was two-tired.", "Why don't crabs give to charity?\nBecause they're shellfish.", "I can't believe I got fired from the calendar factory. All I did was take a day off.", "I am on a seafood diet. Every time I see food, I eat it.", "A steak pun is a rare medium well done.", "If Shaquille O'neal was a banana, he'd be Shaquille O'peal.", "If Shaquille O'neal was a shade of blue green, he'd be Shaquille O'teal.", "If Shaquille O'neal was a criminal, he'd be Shaquille O'steal.", "If Shaquille O'neal was overly emotional, he'd be Shaquille O'feel.", "Three guys are on a boat and they have four cigarettes, but no lighters or matches to light them with. What do they do?\nThey throw one cigarette over board and then the whole boat becomes a cigarette lighter.", "Have you ever tried to eat a clock? It's very time consuming.", "How do you kill vegetarian vampires?\nWith a steak to the heart.", "A blind man walks into a bar. And a table. And a chair.", "When you get a bladder infection, urine trouble."];

random = function(items) {
    if (items === 'greetings') {
        items = greetings;
    } else if (items === 'jokes') {
        items = jokes;
    }

    return _.sample(items);
}
module.exports = {
    isEmpty: isEmpty,
    shuffleArray: shuffleArray,
    random: random
};
