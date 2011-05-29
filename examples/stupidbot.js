// Stupidbot.js
// Always tries to tell the truth, Never BSes

function check(args){
    var action = false;
    // Uncomment next line to BS when there is a decent pile and opp. only played 1 card
    //action = args.pilesize > 2 && args.claim < 2;
    return { action: action, data : args.data};
}

function play(args){
    var action = [];
    for(var i = 0; i < args.hand.length; i++){
        if(args.hand[i] % 13 == args.rank){
            action.push(i);
        }
    }
    if(action.length == 0){
        action = [0];
    }
    return { action: action, data : args.data};
}
