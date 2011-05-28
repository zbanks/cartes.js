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

function Deck(numdecks){
    var cards = [];
    numdecks = numdecks || 1;
    
    this.shuffle = function(n){
        n = n || 3;
        for(var i = 0; i < n; i++){
            cards.sort(function(){return Math.random();});
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
        amt = amt || this.cards.length;
        var hands = [];
        for(var i = 0, h = 0; i < this.cards.length && i < amt * numhands; h = ++h % numhands, i++){
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
    
    this.shuffle(5);
    
}

function Player(uid, code){
    this.uid = uid;
    
    this.run = function(args){
        if(args[4])
            return false;
        else
            return [0];
    }
}

function mapperGenerator(fn){
    return function(xs){
        if(_.isArray(xs)){
            return _.map(xs, function(x){ return fn(x); });
        }else{
            return fn(xs);
        }
    };
}

module.exports = {
    ranks: ranks,
    suits: suits,
    Card: Card,
    Deck: Deck,
    Player: Player,
    intsToCards: mapperGenerator(function(x){ return new Card(x); }),
    cardsToInts: mapperGenerator(function(x){ return x.valueOf(); })
}
