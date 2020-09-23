//Max and min are inclusive
function getRandonInt(min,max){
    min=Math.ceil(min);
    max=Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}