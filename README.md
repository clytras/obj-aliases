
# obj-aliases

Use dot notation key paths to get/set/create/delete object properties and arrays. It supports link aliases, properties with string values that begin with special characters are treated like inside object links.

# Install

```
npm install --save obj-aliases
```

# Usage

Key paths are splited using dot char by default. Link aliases are string values that begin with a special char. There are three types of link aliases supported:

1. **Root aliases**<br>
Begin with the `@` char and these are scoped to the root element of the object<br>
Example: `@rootProp.subProp.nestedProp.prop`

2. **Parent aliases**<br>
Begin with `~` char and are scoped to the first of the parent properties that will match the first key<br>
Example: `~parentProp.subProp.prop`

3. **Sibling aliases**<br>
Begin with `>` char and are scoped to sibling properties only<br>
Example: `>siblingProp.subProp.prop`

All these special chars can be altered, including key path split char:

```javascript
// Change key path split char to `/`
obj.setKeysSplit('/')

// Change link aliases chars
obj.setLinkMarks({
  root: '$',
  parents: '#',
  siblings: '!'
})
```

There are four methods to manipulate the object `has`, `get`, `set`, `del` all support links in properties values and when using the dollar versions, each of the methods does not follow link properties values `$has`, `$get`, `$set`, `$del`.

## Initializing an object
```javascript
var Aliases = require('../index');

// Testing data object
var data = {
  nested: {
    obj: {
      arr: [
        'one',
        'two',
        {
          prop: 'Prop'
        }
      ]
    }
  },
  testing: {
    arr: [
      1, 22, 333
    ],
    obj: {
      bar: 'Foo'
    }
  },
  aliases: {
    root: '@nested.obj.arr.1',
    nested: {
      props: {
        one: 1,
        two: 22,
        three: 333,
        nested: {
          props: {
            foo: 'Bar'
          },
          parentsAlias: '~testing.obj.bar'
        },
        siblingAlias: '>two',
        siblingAliasFoo: '>nested.props.foo'
      }
    }
  },
  some: {
    param: 'Own some param!'
  },
  expandString: {
    types: {
      _string: 'String',
      _int: 'Integer',
      _float: 'Float'
    },
    test: 'This is a {>types._string}',
    rootTest: 'Root test {testing.obj.bar}',
    aliasTestParams: 'Alias test {aliases.root} and "{some.param}" and "{@some.param}"',
    aliasSiblingTest: 'Alias sibling test {aliases.nested.props.siblingAliasFoo}',
    aliasParentsTest: 'Alias parents test {aliases.nested.props.nested.parentsAlias}',
    nested: {
      thisParents: {
        _str: 'Str',
        _int: 'Int',
        _flt: 'Flt'
      },
      formats: {
        test: {
          parent: 'This is a parent test {~nested.thisParents._flt}'
        }
      }
    }
  }
}

var dataAliases = new Aliases(data);
```

## Manipulate properties using key path (`check/get/set/delete`)

```javascript
// Check if key path resolves to something using alias links

> dataAliases.has('nested.obj.arr.2.prop')
< true
```

```javascript
// Check if key path resolves to something NOT using alias links
// Usuful for checking if an alias link exists

> dataAliases.$has('nested.obj.arr.2.prop')
< true
```

```javascript
// Get a value using a keypath
// Negative array indexes supported to get array elements counting from the end

> dataAliases.get('nested.obj.arr.-1.prop')
< "Prop"
```

```javascript
// Set a new value to an existing prop using a keypath

> dataAliases.set('nested.obj.arr.2.prop', 'New Prop')
< true

> dataAliases.get('nested.obj.arr.2.prop')
< "New Prop"
```

```javascript
// Delete a prop using a keypath

> dataAliases.del('nested.obj.arr.2.prop')
< true
```

## Root link aliases using key path (`check/get/set/delete`)

```javascript
// Check if a link prop resolves using a keypath

> dataAliases.has('aliases.root')
< true

// Check if a prop exists using a keypath (disables links)
> dataAliases.$has('aliases.root')
< true
```

```javascript
// Get a link resolved value using a keypath
// Value of `aliases.root` is a root alias `@nested.obj.arr.1`

> dataAliases.get('aliases.root')
< "two"

> dataAliases.$get('aliases.root')
< "@nested.obj.arr.1"
```

```javascript
// Set a new link resolved value to an existing prop using a keypath

> dataAliases.set('aliases.root', 'New two')
< true

> dataAliases.get('aliases.root')
< "New two"
```

```javascript
// Delete a link resolved prop using a keypath
// This will delete the prop that the link points to, not the actual link

> dataAliases.del('aliases.root')
< true

// Check if the deleted prop exists
> dataAliases.has('aliases.root')
< false

> dataAliases.$has('aliases.root')
< true
```

## Parent link aliases using key path (`check/get/set/delete`)

```javascript
// Check if a parent link prop resolves using a keypath

> dataAliases.has('aliases.nested.props.nested.parentsAlias')
< true

> dataAliases.exists('aliases.nested.props.nested.parentsAlias')
< true

> dataAliases.get('aliases.nested.props.nested.parentsAlias')
< "Foo"

> dataAliases.set('aliases.nested.props.nested.parentsAlias', 'Parent Foo')
< true

> dataAliases.get('aliases.nested.props.nested.parentsAlias')
< "Parent Foo"

> data.testing.obj.bar
< "Parent Foo"

> dataAliases.del('aliases.nested.props.nested.parentsAlias')
< true

> dataAliases.get('aliases.nested.props.nested.parentsAlias')
< undefined

> 'bar' in data.testing.obj
< false
```

## Siblings link aliases using key path (`check/get/set/delete`)

```javascript
// Check if a sibling alias exists

> dataAliases.has('aliases.nested.props.siblingAlias')
< true

// Get the sibling alias link value

> dataAliases.get('aliases.nested.props.siblingAlias')
< 22

// Change sibling alias link value

> dataAliases.set('aliases.nested.props.siblingAlias', 222)
< true

// Check if the value has changed

> dataAliases.get('aliases.nested.props.siblingAlias')
< 222

> dataAliases.get('aliases.nested.props.two')
< 222

> data.aliases.nested.props.two
< 222

// Delete a sibling alias link prop

> dataAliases.del('aliases.nested.props.siblingAlias')
< true

// Check if a sibling alias link exists

> dataAliases.has('aliases.nested.props.siblingAlias')
< false

// Check if a sibling alias exists

> dataAliases.$has('aliases.nested.props.siblingAlias')
< true

// Check if the actual object has the prop that's being deleted

> typeof(data.aliases.nested.props.two)
< "undefined"

// Check the deleted sibling alias link value

> dataAliases.get('aliases.nested.props.siblingAlias')
< undefined

// Check the deleted sibling alias value (not using links)

> dataAliases.$get('aliases.nested.props.siblingAlias')
< ">two"

// Check if a nested sibling key alias link exists

> dataAliases.has('aliases.nested.props.siblingAliasFoo')
< true

// Get a nested sibling key alias link prop value

> dataAliases.get('aliases.nested.props.siblingAliasFoo')
< "Bar"

// Change a nested sibling key alias link prop value

> dataAliases.set('aliases.nested.props.siblingAliasFoo', 'New Bar')
< true

// Get the changed sibling alias link prop value

> dataAliases.get('aliases.nested.props.siblingAliasFoo')
< "New Bar"

// Get the chenged value using an absolute key alias

> dataAliases.get('aliases.nested.props.nested.props.foo')
< "New Bar"

// Check the actual object prop value that is changed

> data.aliases.nested.props.nested.props.foo
< "New Bar"

// Delete a nested sibling alias link prop

> dataAliases.del('aliases.nested.props.siblingAliasFoo')
< true

// Check if the deleted link alias prop exists

> dataAliases.has('aliases.nested.props.siblingAliasFoo')
< false

// Check if the the actual prop exists (not using links)

> dataAliases.$has('aliases.nested.props.siblingAliasFoo')
< true

// Check the type of the objects deleted value

> typeof(data.aliases.nested.props.nested.props.foo)
< undefined

// Get the deleted alias link value

> dataAliases.get('aliases.nested.props.siblingAliasFoo')
< undefined

// Get the actual alias value (not using links)

> dataAliases.$get('aliases.nested.props.siblingAliasFoo')
< ">nested.props.foo"
```

## Expand inline string key paths (`expandString`)

```javascript

// Expand direct sibling alias
// 'This is a {>types._string}'

> dataAliases.expandString('expandString.test')
< "This is a String"

// Expand root alias
// 'Root test {testing.obj.bar}'

> dataAliases.expandString('expandString.rootTest')
< "Root test Foo"

// Expand root aliases and given parameters
// 'Alias test {aliases.root} and "{some.param}" and "{@some.param}"'

> dataAliases.expandString('expandString.aliasTestParams', {
    some: {
      param: 'Some Param!'
    }
  })
< "Alias test two and "Some Param!" and "Own some param!""

// Expand siblibing alias link
// 'Alias sibling test {aliases.nested.props.siblingAliasFoo}'

> dataAliases.expandString('expandString.aliasSiblingTest')
< "Alias sibling test Bar"

// Expand parent alias link
// 'Alias parents test {aliases.nested.props.nested.parentsAlias}'

> dataAliases.expandString('expandString.aliasParentsTest')
< "Alias parents test Foo"
```

# License

BSD-3-Clause

Copyright 2019 Lytras Christos

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.