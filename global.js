// Globals 

ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "J", "Q", "K"];
suits = ["S", "H", "C", "D"];

// Card

function Card(rank, suit){
    this.rank = rank;
    this.suit = suit;
}

Card.prototype.toString = function(){
    return ranks[this.rank] + "-" + suits[this.suit];
}

// Hand extends Array
// TODO fix

var Hand = Array;

// Pile extends Hand
// TODO fix

var Pile = Hand;

// Deck

function Deck(){
    var cards = [];
    
    for(var s = 0; s < suits.length; s++){
        for(var r = 0; r < ranks.length; r++){
            cards.push(new Card(r, s));
        }
    }
    
    this.shuffle(5);
    
    this.shuffle = function(n){
        n = n || 3;
        for(var i = 0; i < n; i++){
            cards.sort(function(){return Math.random();});
        }
    }
    
    this.pop = function(n){ // TODO: hand, n
        n = n || 1;
        var cs = [];
        for(var i = 0; i < n; i++){
            cs.push(cards.pop());
        }
        return Hand(cs);
    }
    
    this.deal = function(hands, amt){
        
    }
    
}
