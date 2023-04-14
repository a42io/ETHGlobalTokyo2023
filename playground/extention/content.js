console.log("piyo");

function hello() {
    console.log("hello");
}

var ethereum = {};
ethereum.request = function(message) {
    console.log(message);
    alert("We need to write wallet connection logic!")
}