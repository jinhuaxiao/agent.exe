const { extractAction } = require('./src/main/store/extractAction');

// Test message simulating a mouse move action
const mouseMessage = {
  content: [
    { type: 'text', text: 'Moving mouse to coordinates' },
    {
      type: 'tool_use',
      name: 'computer',
      id: 'test1',
      input: {
        action: 'mouse_move',
        coordinate: [100, 200]
      }
    }
  ]
};

// Test message simulating a typing action
const typeMessage = {
  content: [
    { type: 'text', text: 'Typing text' },
    {
      type: 'tool_use',
      name: 'computer',
      id: 'test2',
      input: {
        action: 'type',
        text: 'Hello World'
      }
    }
  ]
};

// Test message simulating a click action
const clickMessage = {
  content: [
    { type: 'text', text: 'Performing click' },
    {
      type: 'tool_use',
      name: 'computer',
      id: 'test3',
      input: {
        action: 'left_click'
      }
    }
  ]
};

console.log('Testing mouse move action:');
console.log(extractAction(mouseMessage));

console.log('\nTesting type action:');
console.log(extractAction(typeMessage));

console.log('\nTesting click action:');
console.log(extractAction(clickMessage));
