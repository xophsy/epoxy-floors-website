/**
 * @jest-environment jsdom
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

describe('handleFormSubmit', () => {
  let handleFormSubmit;
  let form;
  let submitBtn;
  let originalAlert;

  beforeEach(() => {
    document.body.innerHTML = `
      <form id="contact-form">
        <button id="submit-btn">Send Message</button>
      </form>
    `;
    form = document.getElementById('contact-form');
    submitBtn = document.getElementById('submit-btn');

    global.emailjs = { sendForm: jest.fn() };
    originalAlert = global.alert;
    global.alert = jest.fn();

    const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
    const start = html.indexOf('// Form submission handler with EmailJS');
    const end = html.indexOf('// Add some interactive effects');
    const functionCode = html.slice(start, end);
    const sandbox = { emailjs: global.emailjs, alert: global.alert, document, console };
    vm.runInNewContext(functionCode, sandbox);
    handleFormSubmit = sandbox.handleFormSubmit;
  });

  afterEach(() => {
    global.alert = originalAlert;
    delete global.emailjs;
    delete global.handleFormSubmit;
  });

  test('successfully sends form and resets button state', async () => {
    global.emailjs.sendForm.mockResolvedValue({ status: 200, text: 'OK' });
    const event = { preventDefault: jest.fn(), target: form };
    handleFormSubmit(event);
    expect(submitBtn.textContent).toBe('Sending...');
    expect(submitBtn.disabled).toBe(true);
    await global.emailjs.sendForm.mock.results[0].value;
    expect(submitBtn.textContent).toBe('Send Message');
    expect(submitBtn.disabled).toBe(false);
  });

  test('handles failure and resets button state', async () => {
    global.emailjs.sendForm.mockRejectedValue(new Error('failed'));
    const event = { preventDefault: jest.fn(), target: form };
    handleFormSubmit(event);
    expect(submitBtn.textContent).toBe('Sending...');
    expect(submitBtn.disabled).toBe(true);
    await global.emailjs.sendForm.mock.results[0].value.catch(() => {});
    expect(submitBtn.textContent).toBe('Send Message');
    expect(submitBtn.disabled).toBe(false);
  });
});

