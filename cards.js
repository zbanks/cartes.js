var _ = require("underscore");

// Globals 

ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "J", "Q", "K"];
suits = ["S", "H", "C", "D"];

// Card

function Card(rank, suit){
    if(!suit){
        suit = Math.floor(rank / ranks.length);
        rank %= ranks.length;
    }
    this.rank = rank;
    this.suit = suit;
}

Card.prototype.toString = function(){
    return ranks[this.rank] + "-" + suits[this.suit];
}

Card.prototype.valueOf = function(){
    return this.rank + ranks.length * this.suit;
}

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
        return CardSet(cs);
    }
    
    this.deal = function(hands, amt){
        //TODO
    }
    
}

module.exports = {
    ranks: ranks,
    suits: suits,
    Card: Card,
    CardSet: CardSet,
    Deck: Deck
}
