/**
 * Signal - A simple implementation of the signals pattern
 * This acts as a pub/sub system to decouple components in the application
 */
export class Signal {
  constructor() {
    this.listeners = new Set();
  }

  /**
   * Connect a listener function to this signal
   * @param {Function} listener - Function to call when the signal is emitted
   * @returns {Function} A function that will disconnect the listener when called
   */
  connect(listener) {
    if (typeof listener !== "function") {
      throw new TypeError("Signal listener must be a function");
    }

    this.listeners.add(listener);

    // Return a function that will disconnect this listener
    return () => {
      this.disconnect(listener);
    };
  }

  /**
   * Disconnect a listener from this signal
   * @param {Function} listener - The listener to disconnect
   * @returns {boolean} True if the listener was found and removed
   */
  disconnect(listener) {
    return this.listeners.delete(listener);
  }

  /**
   * Emit the signal with the provided data
   * @param {...any} args - Arguments to pass to the listener functions
   */
  emit(...args) {
    this.listeners.forEach((listener) => {
      try {
        listener(...args);
      } catch (error) {
        console.error("Error in signal listener:", error);
      }
    });
  }

  /**
   * Remove all listeners from this signal
   */
  clear() {
    this.listeners.clear();
  }

  /**
   * Get the number of connected listeners
   * @returns {number} The number of listeners
   */
  get listenerCount() {
    return this.listeners.size;
  }
}

/**
 * SignalGroup - Manages a group of related signals
 * This provides an organized way to access related signals
 */
export class SignalGroup {
  constructor() {
    this.signals = new Map();
  }

  /**
   * Get a signal by name, creating it if it doesn't exist
   * @param {string} name - The name of the signal
   * @returns {Signal} The requested signal
   */
  get(name) {
    if (!this.signals.has(name)) {
      this.signals.set(name, new Signal());
    }

    return this.signals.get(name);
  }

  /**
   * Check if a signal exists
   * @param {string} name - The name of the signal
   * @returns {boolean} True if the signal exists
   */
  has(name) {
    return this.signals.has(name);
  }

  /**
   * Remove a signal
   * @param {string} name - The name of the signal to remove
   * @returns {boolean} True if the signal was removed
   */
  remove(name) {
    if (this.signals.has(name)) {
      const signal = this.signals.get(name);
      signal.clear();

      return this.signals.delete(name);
    }

    return false;
  }

  /**
   * Clear all signals in this group
   */
  clear() {
    this.signals.forEach(signal => signal.clear());
    this.signals.clear();
  }
}

/**
 * Store - Manages state and emits signals when the state changes
 */
export class Store {
  /**
   * Create a new store
   * @param {object} initialState - The initial state of the store
   * @param {Array | object} signalGroups - Array of signal group names or object with signal group names as keys
   */
  constructor(initialState = {}, signalGroups = ["state"]) {
    // Initialize state
    this.state = { ...initialState };

    // Initialize signal groups
    this.signals = {};

    // Create signal groups from the provided array or object
    if (Array.isArray(signalGroups)) {
      signalGroups.forEach((groupName) => {
        this.signals[groupName] = new SignalGroup();
      });
    } else if (typeof signalGroups === "object") {
      Object.keys(signalGroups).forEach((groupName) => {
        this.signals[groupName] = new SignalGroup();
      });
    }

    // Always ensure we have at least a 'state' signal group
    if (!this.signals.state) {
      this.signals.state = new SignalGroup();
    }
  }

  /**
   * Update the state and emit signals
   * @param {object | Function} updater - Object to merge with state or function that returns a new state
   * @param {string} signalGroup - Name of the signal group to emit on (defaults to 'state')
   * @param {string} signalName - Name of the signal to emit (defaults to 'changed')
   * @returns {object} The new state
   */
  update(updater, signalGroup = "state", signalName = "changed") {
    const oldState = { ...this.state };

    // Apply the update
    if (typeof updater === "function") {
      this.state = updater(this.state);
    } else if (typeof updater === "object") {
      this.state = { ...this.state, ...updater };
    } else {
      throw new TypeError("Updater must be an object or a function");
    }

    // Emit signal if the group and signal exist
    if (this.signals[signalGroup]) {
      // Create and emit the signal - get() creates the signal if it doesn't exist
      this.signals[signalGroup].get(signalName).emit(this.state, oldState);
    }

    return this.state;
  }

  /**
   * Get a subset of the state
   * @param {string|Array|Function} selector - Path to the state value, array of paths, or selector function
   * @returns {any} Selected state
   */
  select(selector) {
    if (typeof selector === "string") {
      // Handle dot notation path
      return selector.split(".").reduce(
        (obj, key) => (obj && obj[key] !== undefined ? obj[key] : undefined),
        this.state,
      );
    } else if (Array.isArray(selector)) {
      // Return an object with the selected keys
      const result = {};
      selector.forEach((key) => {
        result[key] = this.select(key);
      });

      return result;
    } else if (typeof selector === "function") {
      // Use selector function
      return selector(this.state);
    }

    // Return the entire state if no selector
    return this.state;
  }

  /**
   * Connect a listener to a signal
   * @param {string} signalGroup - Name of the signal group
   * @param {string} signalName - Name of the signal
   * @param {Function} listener - Listener function
   * @returns {Function} Disconnect function
   */
  connect(signalGroup, signalName, listener) {
    if (!this.signals[signalGroup]) {
      this.signals[signalGroup] = new SignalGroup();
    }

    return this.signals[signalGroup].get(signalName).connect(listener);
  }

  /**
   * Reset the store to its initial state
   * @param {object} initialState - New initial state (optional)
   * @returns {object} The new state
   */
  reset(initialState = {}) {
    const oldState = { ...this.state };
    this.state = { ...initialState };

    // Emit reset signal
    if (this.signals.state) {
      this.signals.state.get("reset").emit(this.state, oldState);
    }

    return this.state;
  }
}

/**
 * Create a store instance
 * @param {object} initialState - Initial state for the store
 * @param {Array | object} signalGroups - Signal groups to create
 * @returns {Store} A new store instance
 */
export function createStore(initialState = {}, signalGroups) {
  return new Store(initialState, signalGroups);
}
