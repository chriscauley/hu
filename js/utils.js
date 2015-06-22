var COUNTS = 10;
function timeit(f) {
  return function() {
    var start = new Date().valueOf();
    var counts = window.COUNTS;
    while (counts--) {
      var out = f.apply(this,arguments);
    }
    var t = new Date().valueOf()-start;
    console.log(f.name + ": " +  Math.round(t/window.COUNTS) + "ms");
    return out
  }
}
