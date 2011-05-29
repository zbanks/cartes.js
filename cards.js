var _ = require("underscore");
var Sandbox = require("sandbox");

// Globals 

ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
suits = ["S", "H", "C", "D"];
dispSuits = ["♠", "♡", "♣", "♢"];

function mapperGenerator(fn){
    ax = function(xs){
        if(_.isArray(xs)){
            return _.map(xs, function(x){ return ax(x); });
        }else{
            return fn(xs);
        }
    };
    return ax;
}

// Card

function Card(rank, suit){
    if(!suit){
        suit = Math.floor(rank / ranks.length);
        rank %= ranks.length;
    }
    this.rank = rank;
    this.suit = suit;
}

Card.prototype.valueOf = function(){
    return this.rank + ranks.length * this.suit;
}

Card.prototype.disp = function(){
    return ranks[this.rank] +  dispSuits[this.suit];
}

Card.prototype.toString = Card.prototype.disp;



var intsToCards = mapperGenerator(function(x){ return new Card(x); });
var cardsToInts = mapperGenerator(function(x){ return x.valueOf(); });

// CardSet

function CardSet(cs){
    if(!cs){
        this.cards = [];
    }else if(cs instanceof CardSet){
        this.cards = cs.cards;
    }else if(_.isArray(cs)){
        this.cards = cs;
    }
    
    this.hasCard = function(card){
        return _.include(this.cards, card);
    }
    
    this.remove = function(card){
        this.cards = _.without(this.cards, card);
        return card;
    }
}

// Deck

function Deck(numdecks){
    var cards = [];
    numdecks = numdecks || 1;
    
    this.shuffle = function(n){
        n = n || 3;
        for(var i = 0; i < n; i++){
            cards.sort(function(){return 0.5 - Math.random();});
        }
    }
    
    this.pop = function(n, cs){ // TODO: hand, n
        n = n || 1;
        cs = cs || [];
        for(var i = 0; i < n; i++){
            cs.push(cards.pop());
        }
        return cs;
    }
    
    this.deal = function(numhands, amt){
        amt = amt || cards.length;
        var hands = [];
        for(var i = 0, h = 0; cards.length && i < amt * numhands; h = ++h % numhands, i++){
            hands[h] = hands[h] || [];
            this.pop(1, hands[h]);
        }
        return hands;
    }
    
    
    for(var n = 0; n < numdecks; n++){
        for(var s = 0; s < suits.length; s++){
            for(var r = 0; r < ranks.length; r++){
                cards.push(new Card(r, s));
            }
        }
    }
    
    //console.log(cards);
    
    this.shuffle(5);
    

}

function Player(uid, code, trusted){
    this.uid = uid;
    this.code = code;
    
    
    this.run = function(args, callback){
        args.hand = cardsToInts(args.hand);
        
        if(args.claim){
            var codeaugment = "\n\ncheck(" + JSON.stringify(args) + ");";
        }else{
            var codeaugment = "\n\nplay(" + JSON.stringify(args) + ");";
        }
        
        if(!trusted){
            sbox = new Sandbox({
                timeout: 1000
            });
            
            //console.log(this.code + codeaugment);
            sbox.run(this.code + codeaugment, function(output){
                console.log(output);
                if(output.result == "TimeoutError"){
                    callback([0]);
                }else{
                    output.result = JSON.parse(output.result);
                    args.data = output.result.data;
                    callback(output.result.action);
                }
            });
        }else{
            // If the bot is "trusted", can be run directly via eval
            // Significantly quicker, but possibly evil!!!!
            result = eval(this.code + codeaugment);
            args.data = result.data;
            callback(result.action);
        }
    }
}



module.exports = {
    ranks: ranks,
    suits: suits,
    Card: Card,
    Deck: Deck,
    Player: Player,
    intsToCards: intsToCards,
    cardsToInts: cardsToInts
}
