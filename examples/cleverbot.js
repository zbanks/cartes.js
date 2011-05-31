// Liarbot.js
// Sometimes lies, Tricky BSing

var numcards = [0,0,0,0, 0,0,0,0, 0,0,0,0, 0];
function getNumcards(hand){
    for(var i = 0; i < hand.length; i++){
        numcards[hand[i] % 13]++;
    }
}

function findCard(hand, card, action){
    offset = action ? action[action.length-1] : 0;
    for(var i = card; i < 52; i += 13){
        var p = hand.indexOf(i, offset);
        if(p != -1){
            return p;
        }
    }
    return -1;
}

function check(args){
    var action = false;
    getNumcards(args.hand);
    if(args.claim + numcards[args.rank] > 4){
        action = true;
    }
    if(args.pilesize == args.claim && numcards[args.rank] != 0){
        action = true;
    }
    return { action: action, data : args.data};
}


// args :: numplayers, turn, rank, hand, pilesize, cardsleft, data, claim

function play(args){
    var action = [];
    if(!args.data.order){
        args.data.order = [];
        for(var i = args.rank; args.data.order.length < 13; i = ++i % 13){
            args.data.order.push(i);
        }
    }
    getNumcards(args.hand);
    for(var i = 0; i < args.hand.length; i++){
        if(args.hand[i] % 13 == args.rank){
            action.push(i);
        }
    }
    if(action.length == 0 || (action.length == 1 && Math.random() < 0.3){
        for(var i = 12; i; i++){
            if(numcards[args.data.order[i]]){
                p = findCard(hand, args.data.order[i]);
                if(p != -1){
                    action.push(p);
                    if(numcards[args.data.order[i]] >= 2 && action.length == 1 && Math.random() < 0.7){
                        p = findCard(hand, args.data.order[i]);
                        if(p != -1){
                            action.push(p);
                        }
                    }
                }
            }
        }
    }
    args.data.order.splice(0,1);
    args.data.order.push(args.rank);
    return { action: action, data : args.data};
}
