import { extractAction } from './src/main/store/extractAction';
import { BetaMessageParam, BetaContentBlockParam } from '@anthropic-ai/sdk/resources/beta/messages/messages';

// Helper function to create test messages
const createTestMessage = (text: string, action: string, params: any = {}): BetaMessageParam => ({
  role: 'assistant',
  content: [
    {
      type: 'text',
      text
    } as BetaContentBlockParam,
    {
      type: 'tool_use',
      name: 'computer',
      id: `test-${action}`,
      input: {
        action,
        ...params
      }
    } as BetaContentBlockParam
  ]
});

// Test cases for different actions
console.log('Testing basic actions:\n');

// Test mouse move
const mouseMove = createTestMessage('Moving mouse', 'mouse_move', { coordinate: [100, 200] });
console.log('=== Mouse Move ===');
console.log(extractAction(mouseMove));
console.log('\n');

// Test type text
const typeText = createTestMessage('Typing text', 'type', { text: 'Hello World' });
console.log('=== Type Text ===');
console.log(extractAction(typeText));
console.log('\n');

// Test left click
const leftClick = createTestMessage('Left clicking', 'left_click');
console.log('=== Left Click ===');
console.log(extractAction(leftClick));
console.log('\n');

// Test right click
const rightClick = createTestMessage('Right clicking', 'right_click');
console.log('=== Right Click ===');
console.log(extractAction(rightClick));
console.log('\n');

// Test drag
const dragMouse = createTestMessage('Dragging mouse', 'left_click_drag', { coordinate: [300, 400] });
console.log('=== Drag Mouse ===');
console.log(extractAction(dragMouse));
console.log('\n');

// Test screenshot
const screenshot = createTestMessage('Taking screenshot', 'screenshot');
console.log('=== Screenshot ===');
console.log(extractAction(screenshot));
console.log('\n');

// Test finish run
const finishRun: BetaMessageParam = {
  role: 'assistant',
  content: [
    {
      type: 'text',
      text: 'Finishing task'
    } as BetaContentBlockParam,
    {
      type: 'tool_use',
      name: 'finish_run',
      id: 'test-finish',
      input: {
        success: true
      }
    } as BetaContentBlockParam
  ]
};
console.log('=== Finish Run ===');
console.log(extractAction(finishRun));
