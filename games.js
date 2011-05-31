var cards = require("./cards");
var _ = require("underscore");

function BSGame(){
    this.init = function(players){
        this.players = players;
        this.deck = new cards.Deck(1);
        this.hands = this.deck.deal(this.players.length);
        this.data = _.map(_.range(this.players.length), function(x){return {};});
        this.pile = [];
        console.log(cards.cardsToInts(this.hands));
        this.hands = cards.intsToCards(_.map(cards.cardsToInts(this.hands), function(x){ return x.sort(function(a, b){return a-b;});}));
        console.log(cards.cardsToInts(this.hands));

        this.turn = _.detect(_.zip(cards.cardsToInts(this.hands), _.range(this.hands.length)), function(n){ 
            return _.indexOf(n[0], 0) != -1;
        })[1]; // First to have the ace of spades, card 0
        this.rank = 0;
        this.lastLie = false;
        
        this.started = true;
        this.turnno = 0;
    }
    
    this.winner = function(){
        return _.reduce(_.zip(this.hands, _.range(this.hands.length)), function(mem, n){
            return mem || (n[0].length == 0 ? (n[1]+1) : 0);
        }, 0) - 1; 
    }
    
    this.playOut = function(hollaback, logger){
        this.turnno++;
        var pl = this.players[this.turn];
        var that = this;
        logger(this.pile.length + " > \n" + _.map(this.hands, function(h){
            return _.map(_.sortBy(h, function(n){return n % 13;}), function(c){ return (new cards.Card(c)).disp(); }).join(" ");
        }).join(":"));
        // run(numplayers, rank, turn, hand, data, claim?)
        
        var args = { numplayers :  this.players.length,
                     turn : this.turn,
                     rank : this.rank,
                     hand : this.hands[this.turn],
                     pilesize : this.pile.length,
                     cardsleft : _.pluck(this.hands, "length"),
                     data : this.data[this.turn],
                     claim : null };
        pl.run(args, function(res){
            res = res || [];
            var claim = res.length;
            args.claim = claim;
            args.pilesize = claim + that.pile.length;
            args.cardsleft[that.turn] -= claim;
            var playset = [];
            var autobs = false
            that.lastLie = false;
            
            res.sort(function(a, b){return a-b;});
            
            if(claim == 0 || claim > 4){
                autobs = true;
            }
            
            for(var i = 0; i < claim; i++){
                if(res[i]-i >= that.hands[that.turn].length || res[i] < 0){
                    //BS
                    autobs = true;
                    break;
                }
                var c = that.hands[that.turn].splice(Math.floor(res[i])-i, 1)[0];
                if(c % 13 != that.rank){
                    that.lastLie = true;
                }else{
                    //console.log("k", c.rank, that.rank);
                }
                playset.push(c);
            }
            //console.log(that.lastLie);
            
            if(!autobs && _.uniq(playset).toString() != playset.toString()){
                //BS
                playset = _.uniq(playset);
                autobs = true;
            }
            /*
            that.hands[that.turn] = _.zip.apply(this, _.filter(_.zip(_.range(that.hands[that.turn].length), that.hands[that.turn]),
            function(x){
                return _.indexOf(res, x[0]) == -1;
            }))[1];
            */
            logger("Play", that.turn, "had", playset.length, "x", cards.ranks[that.rank], that.lastLie || autobs);
            that.pile = that.pile.concat(playset);
            
            var nextIter = function(){
                var w = that.winner();
                if(w != -1){
                    that.winner = function(){return w};
                    hollaback();
                }else{       
                    that.turn = ++that.turn % that.players.length;
                    that.rank = ++that.rank % cards.ranks.length;
                    
                    if(that.turnno < 200){
                        //console.log(that.pile.length);
                        //console.log(_.map(that.hands, function(x){return x.length;}));
                        that.playOut(hollaback, logger);
                    }else{
                        console.log("Too many turns");
                        hollaback();
                    }
                }
            }
            
            var handleBs = function(player){
                that.hands[player] = that.hands[player].concat(that.pile);
                that.hands[player].sort(function(a,b){return a-b;});
                that.pile = [];

                nextIter();
            };
            
            var i = 0;
            var bsGenerator = function(){
                if(i < that.players.length){
                    if(i == that.turn){
                        i++;
                        bsGenerator();
                    }else{
                        args.hand = that.hands[i];
                        args.data = that.data[i];
                        that.players[i].run(args, function(res){
                            if(res){
                                // they called BS
                                //console.log(that.turn, "bs" , that.lastLie);
                                logger("BS", i, that.lastLie);
                                if(that.lastLie){
                                    console.log(i + " calls BS! -- Caught! (" + that.pile.length + " cards)");
                                    handleBs(that.turn);
                                }else{
                                    console.log(i + " calls BS! -- Nope! (" + that.pile.length + " cards)");
                                    handleBs(i);
                                }
                            }else{
                                i++;
                                bsGenerator();
                            }
                        });
                    }
                }else{
                    // Done with BSing test
                    nextIter();
                }
            }
            
            
            
            if(autobs){
                console.log("autobs"); 
                logger("BS:", that.turn, "auto");   
                that.lastLie = true;
                handleBs(that.turn);
                
            }else{
                bsGenerator();
            }
            
            
        });
    }
}


module.exports = {
    "BS" : BSGame,
}
