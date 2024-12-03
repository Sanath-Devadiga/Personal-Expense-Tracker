const express = require('express');
const cron = require('node-cron');
const moment = require('moment');

const app = express();
const PORT = 3000;

// Middleware to parse JSON (Express 4.16+)
app.use(express.json());

// In-memory storage for expenses (for testing purposes)
let expenses = [];

// Predefined categories
const categories = ['Food', 'Travel', 'Entertainment', 'Utilities', 'Healthcare', 'Others'];


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Add Expense 
app.post('/expenses', (req, res) => {
  const { category, amount, date } = req.body;

  // Data Validation
  if (!categories.includes(category)) {
    return res.status(400).json({ status: 'error', error: 'Invalid category' });
  }
  if (isNaN(amount) || parseFloat(amount) <= 0) {
    return res.status(400).json({ status: 'error', error: 'Amount must be a positive number' });
  }
  if (!moment(date, 'YYYY-MM-DD', true).isValid()) {
    return res.status(400).json({ status: 'error', error: 'Invalid date format. Use YYYY-MM-DD' });
  }

  // Store the expense
  const expense = { category, amount, date };
  expenses.push(expense);

  return res.status(201).json({ status: 'success', data: expense });
});

// Get Expenses 
app.get('/expenses', (req, res) => {
  const { category, startDate, endDate } = req.query;

  let filteredExpenses = expenses;

  if (category && categories.includes(category)) {
    filteredExpenses = filteredExpenses.filter(expense => expense.category === category);
  }

  if (startDate && endDate) {
    filteredExpenses = filteredExpenses.filter(expense => {
      return moment(expense.date).isBetween(startDate, endDate, null, '[]');
    });
  }

  // If no expenses found
  if (filteredExpenses.length === 0) {
    return res.status(200).json({
      status: 'success',
      message: 'No expenses found for the given filters.',
      data: []
    });
  }

  return res.status(200).json({ status: 'success', data: filteredExpenses });
});

//(Runs every minute for testing)
cron.schedule('* * * * *', () => {
  // Generate daily report
  const today = moment().format('YYYY-MM-DD');
  const dailyExpenses = expenses.filter(expense => expense.date === today);

  const totalAmount = dailyExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

  console.log(`Daily Report - ${today}`);
  console.log(`Total Expenses: $${totalAmount}`);
  console.log('----------------------------------');
  dailyExpenses.forEach(expense => {
    console.log(`${expense.category}: $${expense.amount}`);
  });
}, {
  scheduled: true,
  timezone: "America/New_York"
});
