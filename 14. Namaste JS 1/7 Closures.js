/**
 * ? Closures:Closure means that a function bind together with its lexical environment or you can say “function along with it’s lexical scope”
 * A closure is a function that retains access to its lexical scope, even when the function is executed outside that scope.
 * This means that the function can remember the environment in which it was created, allowing it to access variables from that scope even after the outer function has finished executing.
 * 
 * Few Common usage of Closures are :
Module Design Patterns
Currying
Function Like once
memoize
maintaining state in async world
setTimeouts
Iterators
Data Hiding and Encapsulation

Disadvantages of Closures:
There could be over consumption of memory because every time a closure is formed, it consumes a lot of memory.
Those closed over variables are not Garbage Collected, so it means it is accumulating a lot of memory
If not handled properly, it can lead to memory leaks.
 */


function x() {
    var a = 7;
    function y() {
        console.log(a);
    }
    return y;
}
var z = x();
console.log(z);
// if koi biji file ma thi z() call karsu to b a ni value print thse coz y bind hto ena lexical scope x saathe j z() ma pass thayu.
z(); // 7

// In the above code, function y is a closure that retains access to the variable a from its lexical scope, even after the outer function x has finished executing. When we call z(), it still has access to the variable a and prints its value, which is 7.