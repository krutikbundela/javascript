/**
 *? What is Block ?
Block is defined by curly braces i.e { .. }
Block is also know as Compound Statement.
Why Block is required in JS?
Block is used to combine multiple javascript statements into one group.

Why we need to group multiple statements at one place?
we group multiple statements in a block so that we can use it where JS expects one statement

Example: if statement only expecting one statement but we provided multiple statements using curly braces. This is a Block.

if(true){
// Compound Statement
var a = 10;
console.log(a);
}
— — — — — — — — — — — — — — — — — — — — — — —
*?What is Block Scoped?
Block Scoped means what all variables and functions we can access inside block.

To understand in details, let’s take an example and run it:

{
var a = 10;
let b = 20;
const c = 30;
}

So, “b” and “c” are inside Block Scope which is separate space which is reserved for block only. But “a” is hoisted inside global object.
From here the statement comes in picture that:

*!let and const are block scoped.

Therefore, you can’t access let and const type variable outside the scope .

In 6.1 screenshot, you can see three scopes ::::

Global: memory reserved for var
Script: separate memory for let and const outside block scope
Block: separate memory for variables inside scope
 */
/**
 * ? Shadowing:
Shadowing is a concept in programming where a variable declared within a certain scope (like a block or function) has the same name as a variable declared in an outer scope. When this happens, the inner variable "shadows" or hides the outer variable within its scope. This means that when you reference the variable name within the inner scope, it will refer to the inner variable rather than the outer one.

Example of Shadowing:

 var x = 10; // Outer variable
    {
        var x = 20; // Inner variable that shadows the outer variable
        console.log(x); // Output: 20 (refers to the inner variable)
    }
    console.log(x); // Output: 20 (refers to the inner variable)


    
*? But in case of let and const, they are block scoped, so they will not shadow the outer variable if they have the same name. Instead, they will create a new variable in the inner scope.

Example of Shadowing with let and const:
let x = 10; // Outer variable
{
    let x = 20; // Inner variable that does not shadow the outer variable
    console.log(x); // Output: 20 (refers to the inner variable)
}
console.log(x); // Output: 10 (refers to the outer variable)

 */
