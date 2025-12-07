const CrypticCourier = require('./games/CrypticCourier');
const WereTextMystery = require('./games/WereTextMystery');
const PocketDungeon = require('./games/PocketDungeon');
const CoOpCatastrophe = require('./games/CoOpCatastrophe');
const TextTacToeRoyale = require('./games/TextTacToeRoyale');
const SMSBakeOff = require('./games/SMSBakeOff');
const ChainReactionStories = require('./games/ChainReactionStories');
const EmojiGladiators = require('./games/EmojiGladiators');
const TreasureTextIsland = require('./games/TreasureTextIsland');
const TimeTravelTrouble = require('./games/TimeTravelTrouble');

const GameRegistry = {
    '1': { name: 'Cryptic Courier', class: CrypticCourier },
    '2': { name: 'The Were-Text Mystery', class: WereTextMystery },
    '3': { name: 'Pocket Dungeon De-Lite', class: PocketDungeon },
    '4': { name: 'The Cooperative Catastrophe', class: CoOpCatastrophe },
    '5': { name: 'Text-Tac-Toe Royale', class: TextTacToeRoyale },
    '6': { name: 'The Great SMS Bake-Off', class: SMSBakeOff },
    '7': { name: 'Chain Reaction Stories', class: ChainReactionStories },
    '8': { name: 'Emoji Gladiators', class: EmojiGladiators },
    '9': { name: 'Treasure Text Island', class: TreasureTextIsland },
    '10': { name: 'Time-Travel Trouble', class: TimeTravelTrouble }
};

module.exports = GameRegistry;
