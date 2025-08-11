# epoxy-floors-website

## Testing

This project uses [Jest](https://jestjs.io/) with a jsdom environment for unit testing.

To run the test suite:

```bash
npm test
```

The included tests mock EmailJS and verify that the form submission handler updates the submit button state correctly on both success and failure.
