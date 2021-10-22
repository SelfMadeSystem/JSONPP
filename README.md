# JSON++
Ah yes, JSON++. Very nice.

Basically JSON but with some extra features. Backwards compatible with JSON (except scientific notation; I'm lazy).

The following features are supported:
- Objects
- Arrays
- Strings
- Numbers (integers and floats in decimal, hexadecimal, octal, binary, but no scientific notation because I'm lazy)
- Booleans
- Null
- Comments (//, /* */)
- References (${key1.key2.key3[...]})

Basic example:
```
// This is a comment.

// You don't have to use specify the root object as an object.
// The parser will infer it if you start with key-value pairs. Otherwise, it will be an array.

key1 'Strings must be quoted.'
key2 "You can also use double quotes."
/* You don't need quotes for keys unless you want to use special characters.
 *
 * You don't need commas or colons. The parser will infer them.
 */
key3 null
booleans [ // Brackets are still required.
    true
    false
]
numbers [
    1       // Integer
    -5      // Negative numbers are supported.
    0xFF    // 255  Hexadecimal
    0b1010  // 10   Binary
    0o777   // 511  Octal
    0.5     // 0.5  Floating point
    0xf.8   // 15.5 Hexadecimal with floating point
    0b.1    // 0.5  Binary with floating point
    0o.2    // 0.25 Octal with floating point
]
objects [
    {
        key1: 'value1'
        key2: 'value2'
        key3: null
        key4: true
        key5: false
        key6: [
            1
            2
            3
        ]
    }
]
references [
    ${key1}       // Returns 'Strings must be quoted.'
    ${key2}       // Returns 'You can also use double quotes.'
    ${numbers.0}  // Returns 1
    ${numbers.4}  // Returns 10
    ${references} // Actually returns the  references  array. (This is a recursive reference.)
]
```
