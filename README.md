[&larr; See my other Open Source projects](https://robinvanbaalen.nl)

# @rvanbaalen/signals
![NPM Downloads](https://img.shields.io/npm/dm/%40rvanbaalen%2Fsignals)
![GitHub License](https://img.shields.io/github/license/rvanbaalen/signals)
![NPM Version](https://img.shields.io/npm/v/%40rvanbaalen%2Fsignals)

A lightweight, decoupled pub/sub signal system for building reactive web applications with organized state management and clean component communication.

## Description

Signals is a minimalist library that implements the signals pattern (also known as pub/sub or event emitter) for JavaScript applications. It helps you build decoupled, reactive components that can communicate without direct dependencies.

Key features:
- **Signal**: Basic pub/sub implementation with connect/disconnect lifecycle management
- **SignalGroup**: Organize related signals into logical groups
- **Store**: Generic state container with integrated signal emission

## Installation

Install the package via npm:

```bash
npm install @rvanbaalen/signals
```

## Usage

### Basic Signal Usage

```js
import { Signal } from '@rvanbaalen/signals';

// Create a signal
const clicked = new Signal();

// Connect a listener (returns a cleanup function)
const cleanup = clicked.connect((x, y) => {
  console.log(`Clicked at ${x}, ${y}`);
});

// Emit the signal
clicked.emit(100, 200); // Logs: "Clicked at 100, 200"

// Cleanup when done
cleanup();
```

### Using SignalGroup

```js
import { SignalGroup } from '@rvanbaalen/signals';

// Create a group of related signals
const userSignals = new SignalGroup();

// Get signals from the group (creates them if they don't exist)
const loggedIn = userSignals.get('loggedIn');
const loggedOut = userSignals.get('loggedOut');

// Connect to signals
loggedIn.connect((user) => {
  console.log(`${user.name} logged in`);
});

// Emit signals
loggedIn.emit({ id: 1, name: 'Alice' });
```

### Using Store

```js
import { createStore } from '@rvanbaalen/signals';

// Create a store with initial state and signal groups
const store = createStore(
  { count: 0, user: null },
  ['counter', 'user']
);

// Connect to signals
store.connect('counter', 'changed', (state, oldState) => {
  console.log(`Count changed from ${oldState.count} to ${state.count}`);
});

// Update state (automatically emits signals)
store.update({ count: store.state.count + 1 }, 'counter', 'changed');

// Select parts of state
const count = store.select('count');
const user = store.select('user');
```

## Advanced Examples

### Component Communication

```js
import { SignalGroup } from '@rvanbaalen/signals';

// Create shared signal group
const appSignals = new SignalGroup();

// Component A
class ComponentA {
  constructor() {
    this.cleanup = appSignals.get('dataRequested').connect((id) => {
      const data = this.fetchData(id);
      appSignals.get('dataReady').emit(data);
    });
  }
  
  fetchData(id) {
    return { id, name: 'Example Item' };
  }
  
  destroy() {
    this.cleanup();
  }
}

// Component B (completely decoupled from A)
class ComponentB {
  constructor() {
    this.cleanup = appSignals.get('dataReady').connect((data) => {
      this.updateUI(data);
    });
  }
  
  requestData(id) {
    appSignals.get('dataRequested').emit(id);
  }
  
  updateUI(data) {
    console.log('Updating UI with:', data);
  }
  
  destroy() {
    this.cleanup();
  }
}
```

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint
```

## Contributing

Contributions are welcome! If you have any suggestions, improvements, or bug fixes, please [open an issue](https://github.com/rvanbaalen/signals/issues/new) or [submit a pull request](https://github.com/rvanbaalen/signals/pulls).

## License

Distributed under the MIT License. See the [LICENSE](LICENSE) file for more information.
